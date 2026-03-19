/* eslint-disable */
import { useState, useRef, useEffect, useCallback } from "react";
import { auth, googleProvider, fsGet, fsSet, fsDel, fsGetSession, fsSetSession } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, sendPasswordResetEmail, onAuthStateChanged, updateProfile } from "firebase/auth";

const PINK = "#E91E8C";
const PINK2 = "#FF4FB8";
const SOFT = "#FFF0F7";
const MID = "#FECDE8";
const BORDER = "#EDD8E8";
const BG = "#FFFFFF";
const SUB = "#9A6080";
const TEXT = "#1A0A14";
const YELLOW = "#F5A623";
const GREEN = "#00C48C";
const BLUE = "#3B82F6";
const PURPLE = "#7C3AED";
const GRAD = `linear-gradient(135deg,${PINK},${PINK2})`;
const GC = ["#E91E8C","#8B5CF6","#3B82F6","#00C48C","#F5A623","#EF4444"];
const TV_DEFAULT = [10,30,50,100,150,200]; // default Other Coins (editable per session)
const ACTS_DEFAULT = [
  {id:"correct", label:"Correct Answer", pts:50, col:PINK},
  {id:"question",label:"Asked Question", pts:30, col:BLUE},
  {id:"chat",    label:"Chat Reply",     pts:10, col:GREEN},
];
const ACTS = ACTS_DEFAULT;

// ── Firebase storage wrappers (uid injected at call site) ──
// These are set up in App component and passed down or called directly
let _currentUid = null;
function setCurrentUid(uid) { _currentUid = uid; }
async function sg(k) { 
  if (!_currentUid) return null;
  return await fsGet(_currentUid, k); 
}
async function ss(k, v) { 
  if (!_currentUid) return;
  await fsSet(_currentUid, k, v); 
}
async function sd(k) { 
  if (!_currentUid) return;
  await fsDel(_currentUid, k); 
}

// Session storage (shared, by session code)
async function sgSession(code) { return await fsGetSession(code); }
async function ssSession(code, data) { await fsSetSession(code, data); }

const DEMO = {
  code:"DEMO1", name:"Design Thinking Workshop", boardVisible:false,
  participants:[
    {id:1,name:"Ahmad Faris",av:"AF",total:180,bk:{question:3,chat:2,token:2},gid:0,num:1},
    {id:2,name:"Nurul Ain",av:"NA",total:140,bk:{question:1,chat:4,token:1},gid:0,num:2},
    {id:3,name:"Haziq Ibrahim",av:"HI",total:210,bk:{question:2,chat:1,token:3},gid:1,num:3},
    {id:4,name:"Siti Khadijah",av:"SK",total:90,bk:{question:1,chat:2,token:0},gid:1,num:4},
    {id:5,name:"Darwisyah",av:"DW",total:60,bk:{question:0,chat:3,token:1},gid:2,num:5},
    {id:6,name:"Luqman Hakim",av:"LH",total:120,bk:{question:2,chat:1,token:1},gid:2,num:6},
  ],
  groups:[
    {id:0,name:"Team Alpha",color:GC[0]},
    {id:1,name:"Team Bravo",color:GC[1]},
    {id:2,name:"Team Charlie",color:GC[2]},
  ],
  log:[
    {id:1,name:"Haziq Ibrahim",type:"token",pts:100,t:"10:42 AM"},
    {id:2,name:"Ahmad Faris",type:"question",pts:30,t:"10:40 AM"},
  ],
};

const PAST = [];

// storage
const SK = k => `tc:${k}`;
const genCode = () => Math.random().toString(36).slice(2,7).toUpperCase();
const mkAv = n => n.trim().split(/\s+/).map(w=>w[0]).join("").toUpperCase().slice(0,2);
const pNum = n => `P${String(n).padStart(3,"0")}`;
const rankColor = i => [YELLOW,"#94A3B8","#CD7C2E"][i] || SUB;

function playSound(big) {
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const g = ctx.createGain(); g.connect(ctx.destination);
    if (big) {
      [[440,0],[554,.1],[659,.2],[880,.32]].forEach(([f,t]) => {
        const o = ctx.createOscillator(); o.connect(g);
        o.frequency.value = f; o.start(ctx.currentTime+t); o.stop(ctx.currentTime+t+.2);
      });
      g.gain.setValueAtTime(.14,ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.55);
    } else {
      const o = ctx.createOscillator(); o.connect(g);
      o.frequency.setValueAtTime(600,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(900,ctx.currentTime+.1);
      g.gain.setValueAtTime(.08,ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.18);
      o.start(); o.stop(ctx.currentTime+.18);
    }
  } catch {}
}

// ── Hamster ──
function Ham({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <ellipse cx="22" cy="30" rx="16" ry="16" fill="#F9A8D4"/>
      <ellipse cx="78" cy="30" rx="16" ry="16" fill="#F9A8D4"/>
      <ellipse cx="22" cy="30" rx="9" ry="9" fill="#FDE8F0"/>
      <ellipse cx="78" cy="30" rx="9" ry="9" fill="#FDE8F0"/>
      <ellipse cx="50" cy="78" rx="30" ry="22" fill="#FDE8F0"/>
      <ellipse cx="50" cy="52" rx="32" ry="30" fill="#FCE7F3"/>
      <ellipse cx="50" cy="80" rx="18" ry="14" fill="#FFF0F5"/>
      <ellipse cx="26" cy="58" rx="9" ry="7" fill="#FDA4CF" opacity=".6"/>
      <ellipse cx="74" cy="58" rx="9" ry="7" fill="#FDA4CF" opacity=".6"/>
      <circle cx="40" cy="47" r="4.5" fill="#1A0A14"/>
      <circle cx="60" cy="47" r="4.5" fill="#1A0A14"/>
      <circle cx="41.5" cy="45.5" r="1.8" fill="white" opacity=".85"/>
      <circle cx="61.5" cy="45.5" r="1.8" fill="white" opacity=".85"/>
      <ellipse cx="50" cy="56" rx="3.5" ry="2.5" fill={PINK}/>
      <path d="M44 62 Q50 68 56 62" stroke="#C0185A" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <line x1="54" y1="57" x2="76" y2="53" stroke="#FDA4CF" strokeWidth="1.2" opacity=".7"/>
      <line x1="54" y1="59" x2="76" y2="59" stroke="#FDA4CF" strokeWidth="1.2" opacity=".7"/>
      <line x1="46" y1="57" x2="24" y2="53" stroke="#FDA4CF" strokeWidth="1.2" opacity=".7"/>
      <line x1="46" y1="59" x2="24" y2="59" stroke="#FDA4CF" strokeWidth="1.2" opacity=".7"/>
    </svg>
  );
}

// ── Confetti ──
function Confetti({ active }) {
  const ref = useRef(); const pts = useRef([]); const raf = useRef();
  useEffect(() => {
    if (!active) return;
    const c = ref.current; if (!c) return;
    c.width = window.innerWidth; c.height = window.innerHeight;
    const cols = [PINK,PINK2,YELLOW,GREEN,BLUE,"#A855F7"];
    pts.current = Array.from({length:100}, () => ({
      x:Math.random()*c.width, y:-10, vx:(Math.random()-.5)*6, vy:Math.random()*4+2,
      col:cols[Math.floor(Math.random()*cols.length)], s:Math.random()*9+4, r:Math.random()*360, vr:(Math.random()-.5)*6,
    }));
    const ctx = c.getContext("2d"); let alive = true;
    const draw = () => {
      if (!alive) return;
      ctx.clearRect(0,0,c.width,c.height);
      pts.current.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.vy+=.07; p.r+=p.vr;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r*Math.PI/180);
        ctx.fillStyle=p.col; ctx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2); ctx.restore();
      });
      pts.current = pts.current.filter(p => p.y < c.height);
      if (pts.current.length) raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { alive=false; cancelAnimationFrame(raf.current); ctx.clearRect(0,0,c.width,c.height); };
  }, [active]);
  return <canvas ref={ref} style={{position:"fixed",top:0,left:0,pointerEvents:"none",zIndex:9998}}/>;
}

// ── Float anim ──
function FloatAnim({ x, y, text, color, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 900); return () => clearTimeout(t); }, []);
  return <div style={{position:"fixed",left:x-20,top:y-20,pointerEvents:"none",zIndex:9999,fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:28,color,animation:"floatUp .9s ease forwards"}}>{text}</div>;
}

// ── Avatar ──
function Av({ s, color = PINK, size = 36 }) {
  return (
    <div style={{width:size,height:size,borderRadius:size*.22,flexShrink:0,background:`linear-gradient(135deg,${color},${color}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:size*.34,color:"#fff"}}>
      {s}
    </div>
  );
}

// ── Toast ──
function Toast({ msg }) {
  return <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:TEXT,color:"#fff",padding:"10px 22px",borderRadius:12,fontSize:13,fontWeight:600,zIndex:9997,fontFamily:"Poppins,sans-serif",boxShadow:"0 8px 32px rgba(0,0,0,.22)",whiteSpace:"nowrap",animation:"slideUp .2s ease"}}>{msg}</div>;
}

// ── Section label ──
function SL({ children, style={} }) {
  return <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:1.2,marginBottom:8,fontFamily:"Poppins,sans-serif",...style}}>{children}</div>;
}

// ── Input ──
function Inp({ placeholder, value, onChange, type="text", onKeyDown, autoFocus, style: sx = {} }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      onKeyDown={onKeyDown} autoFocus={autoFocus}
      style={{background:BG,border:`1.5px solid ${BORDER}`,borderRadius:12,padding:"11px 14px",fontFamily:"Poppins,sans-serif",fontSize:14,color:TEXT,outline:"none",width:"100%",boxSizing:"border-box",...sx}}/>
  );
}

// ── Primary button ──
function PBtn({ children, onClick, disabled, full, style: sx = {} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{background:disabled?BG:GRAD,border:"none",borderRadius:13,padding:"13px 22px",fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:disabled?SUB:"#fff",cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,transition:"all .2s",width:full?"100%":"auto",...sx}}
      // hover
      onMouseOut={e => { e.currentTarget.style.transform="translateY(0)"; }}>
      {children}
    </button>
  );
}

// ── Participant QR ──
function PQR({ p, code, size = 160 }) {
  const seed = `${code}-${p.id}`;
  const h = seed.split("").reduce((a,c) => ((a<<5)-a)+c.charCodeAt(0)|0, 0);
  const corners = [0,1,2,7,8,9,14,6,13,20,36,37,38,43,44,45,42,48];
  const cells = Array.from({length:49}, (_,i) => { const v=(h^(i*2654435761))>>>0; return corners.includes(i)||(v%3===0); });
  return (
    <div style={{width:size,height:size,background:"#fff",borderRadius:12,padding:10,border:`1px solid ${BORDER}`,display:"inline-block"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,height:"100%"}}>
        {cells.map((on,i) => <div key={i} style={{borderRadius:2,background:on?PINK:"transparent"}}/>)}
      </div>
    </div>
  );
}

// ── Contacts picker ──
function Picker({ participants, groups, selId, onSelect, onClose }) {
  const [q, setQ] = useState("");
  const sorted = [...participants].sort((a,b) => a.num - b.num);
  const filt = sorted.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || pNum(p.num).includes(q.toUpperCase()));
  const grouped = {};
  filt.forEach(p => { const k = p.name[0].toUpperCase(); if (!grouped[k]) grouped[k]=[]; grouped[k].push(p); });
  const letters = Object.keys(grouped).sort();
  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:BG,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto",animation:"slideInRight .2s ease"}}>
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"0 16px",height:54,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:PINK,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:14}}>Cancel</button>
        <div style={{flex:1,textAlign:"center",fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:16,color:TEXT}}>Select Participant</div>
        <div style={{width:56}}/>
      </div>
      <div style={{padding:"10px 16px",background:"#fff",borderBottom:`1px solid ${BORDER}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,background:BG,border:`1.5px solid ${BORDER}`,borderRadius:12,padding:"8px 14px"}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search name or number..." value={q} onChange={e=>setQ(e.target.value)} autoFocus style={{flex:1,background:"none",border:"none",fontFamily:"Poppins,sans-serif",fontSize:14,color:TEXT,outline:"none"}}/>
          {q && <button onClick={()=>setQ("")} style={{background:"none",border:"none",cursor:"pointer",color:SUB,fontSize:18}}>×</button>}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {filt.length === 0 && <div style={{padding:48,textAlign:"center",color:SUB,fontSize:13}}>No participants found</div>}
        {q
          ? filt.map(p => <PRow key={p.id} p={p} groups={groups} sel={selId===p.id} onSelect={()=>{onSelect(p.id);onClose();}}/>)
          : letters.map(l => (
            <div key={l}>
              <div style={{padding:"6px 16px 4px",background:BG,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:12,color:SUB,borderBottom:`1px solid ${BORDER}`}}>{l}</div>
              {grouped[l].map(p => <PRow key={p.id} p={p} groups={groups} sel={selId===p.id} onSelect={()=>{onSelect(p.id);onClose();}}/>)}
            </div>
          ))
        }
        <div style={{height:32}}/>
      </div>
    </div>
  );
}

function PRow({ p, groups, sel, onSelect }) {
  const grp = groups.find(g => g.id === p.gid);
  return (
    <button onClick={onSelect} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"13px 16px",border:"none",background:sel?SOFT:"#fff",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",textAlign:"left",borderLeft:sel?`3px solid ${PINK}`:"3px solid transparent",transition:".1s"}}>
      <Av s={p.av} color={grp?.color||PINK} size={42}/>
      <div style={{flex:1}}>
        <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:TEXT,marginBottom:2}}>{p.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:11,color:SUB}}>{pNum(p.num)}</span>
          {grp && <span style={{fontSize:11,background:`${grp.color}18`,border:`1px solid ${grp.color}35`,color:grp.color,padding:"1px 8px",borderRadius:99,fontWeight:700}}>{grp.name}</span>}
          <span style={{fontSize:11,color:PINK,fontWeight:700}}>{p.total} coins</span>
        </div>
      </div>
      <div style={{color:BORDER,fontSize:20}}>›</div>
    </button>
  );
}

// ── Mass Give sheet ──
function MassGive({ participants, groups, onAward, onClose }) {
  const [amt, setAmt] = useState(null);
  const [cAmt, setCAmt] = useState("");
  const [mode, setMode] = useState(null);
  const [sel, setSel] = useState(new Set());
  const [scanLog, setScanLog] = useState([]);
  const [scanLine, setScanLine] = useState(false);

  const finalAmt = amt === "custom" ? Number(cAmt) : amt;
  const ok = finalAmt > 0 && !isNaN(finalAmt);
  const sorted = [...participants].sort((a,b) => a.num - b.num);

  function toggleSel(id) { setSel(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }); }
  function doAll() { if (!ok) return; participants.forEach(p => onAward(p.id, "token", finalAmt)); onClose(); }
  function doSel() { if (!ok || sel.size===0) return; sel.forEach(id => onAward(id, "token", finalAmt)); onClose(); }

  // Participant QR just encodes their number "001", "002" etc — no API needed
  // In production: real camera reads the number string, looks up participant
  // Here: simulated — picks a random unscanned participant
  const [scanning, setScanning] = useState(false);
  const [scannerErr, setScannerErr] = useState("");
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  function startScanner() {
    if (!ok) return;
    setScannerErr("");
    setScanning(true);
  }

  function stopScanner() {
    if (html5QrRef.current) {
      html5QrRef.current.stop().catch(()=>{});
      html5QrRef.current = null;
    }
    setScanning(false);
  }

  useEffect(() => {
    if (!scanning) return;
    const containerId = "tc-qr-scanner";

    function initScanner() {
      if (!window.Html5Qrcode) { setScannerErr("Camera library failed to load."); return; }
      const scanner = new window.Html5Qrcode(containerId);
      html5QrRef.current = scanner;
      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          // decodedText = "P001" or "001"
          const raw = decodedText.replace(/^P/i,"").trim();
          const num = parseInt(raw);
          if (isNaN(num)) return;
          const p = participants.find(x => x.num === num);
          if (!p) return;
          if (scanLog.find(l => l.id === p.id)) return; // already scanned
          setScanLine(true); setTimeout(()=>setScanLine(false), 350);
          onAward(p.id, "token", finalAmt);
          setScanLog(prev => [{...p, t: new Date().toLocaleTimeString()}, ...prev]);
        },
        () => {} // ignore decode errors (normal while scanning)
      ).catch(err => {
        setScannerErr("Camera access denied. Please allow camera permission.");
        setScanning(false);
      });
    }

    if (window.Html5Qrcode) {
      initScanner();
    } else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js";
      s.onload = initScanner;
      s.onerror = () => setScannerErr("Failed to load camera library.");
      document.head.appendChild(s);
    }

    return () => { stopScanner(); };
  }, [scanning]); // eslint-disable-line react-hooks/exhaustive-deps

  const methodBtn = (id, icon, title, sub) => (
    <div onClick={()=>{if(mode===id){stopScanner();setMode(null);}else{stopScanner();setMode(id);}}}
      style={{padding:"14px 16px",borderRadius:14,border:`1.5px solid ${mode===id?PINK:BORDER}`,background:mode===id?SOFT:"#fff",cursor:"pointer",transition:"all .12s",marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:38,height:38,borderRadius:10,background:mode===id?GRAD:`${PINK}14`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>
        <div>
          <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:mode===id?PINK:TEXT}}>{title}</div>
          <div style={{fontSize:12,color:SUB,marginTop:1}}>{sub}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:450}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(26,10,20,.45)",backdropFilter:"blur(3px)"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,background:"#fff",borderRadius:"20px 20px 0 0",maxHeight:"90vh",display:"flex",flexDirection:"column",animation:"slideUp .25s ease",maxWidth:480,margin:"0 auto"}}>
        <div style={{padding:"14px 20px 0",flexShrink:0}}>
          <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 14px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,color:TEXT}}>Mass Give Coins</div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:SUB,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          <div style={{fontSize:13,color:SUB,marginBottom:16}}>Award the same amount to multiple participants.</div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"0 20px 32px"}}>
          <SL>Step 1 — Choose Amount</SL>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:8}}>
            {TV_DEFAULT.map(v => (
              <button key={v} onClick={()=>{setAmt(v);setCAmt("");}}
                style={{padding:"12px 8px",borderRadius:12,cursor:"pointer",fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:17,background:amt===v?GRAD:"transparent",border:amt===v?"2px solid transparent":`1.5px solid ${BORDER}`,color:amt===v?"#fff":TEXT,transition:"all .12s"}}>
                +{v}
              </button>
            ))}
          </div>
          <input type="number" placeholder="Custom amount..." value={cAmt} onChange={e=>{setCAmt(e.target.value);setAmt("custom");}}
            style={{width:"100%",background:BG,border:`1.5px solid ${amt==="custom"?PINK:BORDER}`,borderRadius:12,padding:"10px 14px",fontFamily:"Poppins,sans-serif",fontSize:13,color:TEXT,outline:"none",marginBottom:20}}/>

          <SL>Step 2 — Choose Method</SL>

          {/* Give All */}
          <div>
            {methodBtn("all",
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={mode==="all"?"#fff":PINK} strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
              "Give to Everyone", `All ${participants.length} participants get coins`
            )}
            {mode==="all" && ok && (
              <button onClick={doAll} style={{width:"100%",padding:"12px 0",background:GRAD,border:"none",borderRadius:12,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",marginBottom:10}}>
                Give +{finalAmt} to All {participants.length}
              </button>
            )}
            {mode==="all" && !ok && <div style={{textAlign:"center",fontSize:13,color:SUB,padding:"8px 0 10px"}}>Select an amount above first</div>}
          </div>

          {/* Multi select */}
          <div>
            {methodBtn("multi",
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={mode==="multi"?"#fff":PINK} strokeWidth="2.2" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
              "Select Participants", mode==="multi"?`${sel.size} selected`:"Pick specific people"
            )}
            {mode==="multi" && (
              <div onClick={e=>e.stopPropagation()}>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  <button onClick={()=>setSel(new Set(participants.map(p=>p.id)))} style={{padding:"6px 12px",background:BG,border:`1px solid ${BORDER}`,borderRadius:8,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:12,color:TEXT,cursor:"pointer"}}>Select All</button>
                  <button onClick={()=>setSel(new Set())} style={{padding:"6px 12px",background:BG,border:`1px solid ${BORDER}`,borderRadius:8,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:12,color:TEXT,cursor:"pointer"}}>Clear</button>
                </div>
                <div style={{maxHeight:200,overflowY:"auto",borderRadius:12,border:`1px solid ${BORDER}`,overflow:"hidden",marginBottom:10}}>
                  {sorted.map(p => {
                    const grp = groups.find(g=>g.id===p.gid); const on = sel.has(p.id);
                    return (
                      <button key={p.id} onClick={()=>toggleSel(p.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",border:"none",borderBottom:`1px solid ${BORDER}`,background:on?SOFT:"#fff",cursor:"pointer",textAlign:"left"}}>
                        <div style={{width:20,height:20,borderRadius:6,flexShrink:0,border:`2px solid ${on?PINK:BORDER}`,background:on?PINK:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:".12s"}}>
                          {on && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>}
                        </div>
                        <span style={{fontSize:11,fontFamily:"Nunito,sans-serif",fontWeight:700,color:SUB,minWidth:32}}>{pNum(p.num)}</span>
                        <Av s={p.av} color={grp?.color||PINK} size={28}/>
                        <span style={{flex:1,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:13,color:TEXT}}>{p.name}</span>
                        <span style={{fontSize:11,color:PINK,fontWeight:700}}>{p.total}</span>
                      </button>
                    );
                  })}
                </div>
                {sel.size > 0 && ok && (
                  <button onClick={doSel} style={{width:"100%",padding:"12px 0",background:GRAD,border:"none",borderRadius:12,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",marginBottom:10}}>
                    Give +{finalAmt} to {sel.size} Participant{sel.size>1?"s":""}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* QR Scan — real camera */}
          <div>
            {methodBtn("scan",
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={mode==="scan"?"#fff":PINK} strokeWidth="2.2" strokeLinecap="round"><polyline points="23 7 23 1 17 1"/><line x1="16" y1="8" x2="23" y2="1"/><polyline points="1 17 1 23 7 23"/><line x1="8" y1="16" x2="1" y2="23"/><polyline points="23 17 23 23 17 23"/><line x1="16" y1="16" x2="23" y2="23"/><polyline points="1 7 1 1 7 1"/><line x1="8" y1="8" x2="1" y2="1"/></svg>,
              "Scan QR One by One", `Scan participant's screen · ${scanLog.length} scanned`
            )}
            {mode==="scan" && (
              <div onClick={e=>e.stopPropagation()}>
                {!ok && <div style={{textAlign:"center",padding:"10px 0 12px",fontSize:13,color:SUB}}>Select an amount above first</div>}
                {ok && !scanning && (
                  <button onClick={startScanner}
                    style={{width:"100%",padding:"14px 0",background:GRAD,border:"none",borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Open Camera to Scan
                  </button>
                )}
                {ok && scanning && (
                  <div style={{marginBottom:12}}>
                    <div style={{borderRadius:14,overflow:"hidden",marginBottom:8,position:"relative"}}>
                      <div id="tc-qr-scanner" style={{width:"100%"}}/>
                      {/* Pink corner overlay */}
                      <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
                        {[[0,0],[1,0],[0,1],[1,1]].map(([r,b],i)=>(
                          <div key={i} style={{position:"absolute",[r?"right":"left"]:16,[b?"bottom":"top"]:16,width:24,height:24,borderTop:b?"none":`2.5px solid ${PINK}`,borderBottom:b?`2.5px solid ${PINK}`:"none",borderLeft:r?"none":`2.5px solid ${PINK}`,borderRight:r?`2.5px solid ${PINK}`:"none"}}/>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                      <div style={{fontSize:12,color:SUB,fontWeight:600}}>
                        {scanLog.length===0?"Point camera at participant's QR":`Scanned ${scanLog.length} of ${participants.length}`}
                      </div>
                      <div style={{fontSize:12,color:PINK,fontWeight:700}}>+{finalAmt} per scan</div>
                    </div>
                    <button onClick={stopScanner}
                      style={{width:"100%",padding:"11px 0",background:"none",border:`1.5px solid ${BORDER}`,borderRadius:12,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:13,color:SUB,cursor:"pointer",marginBottom:8}}>
                      Stop Camera
                    </button>
                  </div>
                )}
                {scannerErr && <div style={{fontSize:12,color:"#EF4444",fontWeight:600,marginBottom:10,textAlign:"center"}}>{scannerErr}</div>}

                {/* Scan log */}
                {scanLog.length > 0 && (
                  <div style={{borderRadius:12,border:`1px solid ${BORDER}`,overflow:"hidden"}}>
                    <div style={{padding:"8px 12px",background:BG,fontSize:11,fontFamily:"Nunito,sans-serif",fontWeight:800,color:SUB,textTransform:"uppercase",letterSpacing:1,borderBottom:`1px solid ${BORDER}`}}>
                      Scanned ({scanLog.length})
                    </div>
                    {scanLog.map((p,i) => {
                      const grp = groups.find(g=>g.id===p.gid);
                      return (
                        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderBottom:`1px solid ${BORDER}`,background:i===0?SOFT:"#fff"}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:GREEN,flexShrink:0}}/>
                          <span style={{fontSize:11,fontFamily:"Nunito,sans-serif",fontWeight:800,color:PINK,minWidth:36}}>{pNum(p.num)}</span>
                          <Av s={p.av} color={grp?.color||PINK} size={26}/>
                          <span style={{flex:1,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:13,color:TEXT}}>{p.name}</span>
                          <span style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:13,color:GREEN}}>+{finalAmt}</span>
                          <span style={{fontSize:10,color:SUB}}>{p.t}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Coin Customizer modal ──
function CoinCustomizer({ session, onSave, onClose }) {
  // quickCoins: 3 items matching ACTS (pts only)
  const initQuick = session.quickCoins || ACTS_DEFAULT.map(a=>a.pts);
  const initOther = session.otherCoins || TV_DEFAULT;

  const [quick, setQuick] = useState([...initQuick]);
  const [other, setOther] = useState([...initOther]);
  const [tab, setTab] = useState("quick"); // quick | other
  const [newVal, setNewVal] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");

  function addOther() {
    const n = parseInt(newVal);
    if (isNaN(n)) return;
    if (other.length >= 15) return;
    setOther(prev => [...prev, n].sort((a,b)=>a-b));
    setNewVal("");
  }

  function removeOther(i) { setOther(prev => prev.filter((_,idx)=>idx!==i)); }

  function saveEdit(i) {
    const n = parseInt(editVal);
    if (isNaN(n)) { setEditIdx(null); return; }
    setOther(prev => { const a=[...prev]; a[i]=n; return a.sort((a,b)=>a-b); });
    setEditIdx(null);
  }

  function save() { onSave({ quickCoins: quick, otherCoins: other }); onClose(); }

  const QLABELS = ["Quick Coin 1","Quick Coin 2","Quick Coin 3"];
  const QCOLS = [BLUE, GREEN, PINK];

  return (
    <div style={{position:"fixed",inset:0,zIndex:600}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(26,10,20,.5)",backdropFilter:"blur(3px)"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,background:"#fff",borderRadius:"20px 20px 0 0",maxHeight:"85vh",display:"flex",flexDirection:"column",animation:"slideUp .25s ease",maxWidth:480,margin:"0 auto"}}>
        <div style={{padding:"14px 20px 0",flexShrink:0}}>
          <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 14px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:18,color:TEXT}}>Customise Coins</div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:SUB,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          <div style={{display:"flex",borderBottom:`1px solid ${BORDER}`}}>
            {[["quick","Quick Coins"],["other","Give Coins"]].map(([id,l])=>(
              <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 16px",border:"none",background:"none",fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:13,color:tab===id?PINK:SUB,cursor:"pointer",borderBottom:tab===id?`2.5px solid ${PINK}`:"2.5px solid transparent",transition:"all .12s"}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"16px 20px 24px"}}>

          {tab==="quick" && <>
            <div style={{fontSize:13,color:SUB,marginBottom:14,fontWeight:500,lineHeight:1.6}}>
              Tap the label to rename. Adjust the point value with the stepper or type directly.
            </div>
            {ACTS_DEFAULT.map((a,i)=>{
              return(
                <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${BORDER}`}}>
                  <div style={{width:38,height:38,borderRadius:10,background:`${QCOLS[i]}14`,border:`1.5px solid ${QCOLS[i]}33`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:14,color:QCOLS[i]}}>Q{i+1}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:14,color:TEXT}}>{a.label}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <button onClick={()=>setQuick(prev=>{const a=[...prev];a[i]=Math.max(-999,a[i]-5);return a;})}
                      style={{width:30,height:30,borderRadius:9,border:`1px solid ${BORDER}`,background:BG,cursor:"pointer",fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:18,color:SUB,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                    <input type="number" value={quick[i]} onChange={e=>setQuick(prev=>{const a=[...prev];a[i]=parseInt(e.target.value)||0;return a;})}
                      style={{width:58,textAlign:"center",background:BG,border:`1.5px solid ${QCOLS[i]}55`,borderRadius:10,padding:"7px 4px",fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:16,color:QCOLS[i],outline:"none"}}/>
                    <button onClick={()=>setQuick(prev=>{const a=[...prev];a[i]+=5;return a;})}
                      style={{width:30,height:30,borderRadius:9,border:`1px solid ${BORDER}`,background:BG,cursor:"pointer",fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:18,color:SUB,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                  </div>
                </div>
              );
            })}
            <div style={{background:`${BLUE}10`,border:`1px solid ${BLUE}25`,borderRadius:10,padding:"10px 12px",marginTop:14,fontSize:12,color:BLUE,fontWeight:600}}>
              Tip: Use negative values (e.g. −10) to subtract coins as a penalty.
            </div>
          </>}

          {tab==="other" && <>
            <div style={{fontSize:13,color:SUB,marginBottom:14,fontWeight:500,lineHeight:1.6}}>
              Up to 15 values. Negative values subtract coins (penalty). Changes apply to this session only.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
              {other.map((v,i)=>(
                <div key={i} style={{borderRadius:12,border:`1.5px solid ${v<0?"#EF444440":BORDER}`,background:v<0?"#FEF2F2":`${YELLOW}08`,position:"relative"}}>
                  {editIdx===i ? (
                    <input type="number" value={editVal} autoFocus
                      onChange={e=>setEditVal(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter")saveEdit(i);if(e.key==="Escape")setEditIdx(null);}}
                      onBlur={()=>saveEdit(i)}
                      style={{width:"100%",textAlign:"center",background:"none",border:"none",fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:16,color:v<0?"#EF4444":YELLOW,outline:"none",padding:"14px 4px"}}/>
                  ) : (
                    <button onClick={()=>{setEditIdx(i);setEditVal(String(v));}}
                      style={{width:"100%",padding:"14px 4px",background:"none",border:"none",cursor:"pointer",fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:16,color:v<0?"#EF4444":YELLOW}}>
                      {v>0?"+":""}{v}
                    </button>
                  )}
                  <button onClick={()=>removeOther(i)}
                    style={{position:"absolute",top:-6,right:-6,width:18,height:18,borderRadius:"50%",background:"#EF4444",border:"2px solid #fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
                    <span style={{color:"#fff",fontSize:10,fontWeight:900,lineHeight:1}}>×</span>
                  </button>
                </div>
              ))}
              {/* Add new slot */}
              {other.length < 15 && (
                <div style={{borderRadius:12,border:`1.5px dashed ${BORDER}`,display:"flex",alignItems:"center",justifyContent:"center",minHeight:50}}>
                  <input type="number" placeholder="+/−" value={newVal} onChange={e=>setNewVal(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&addOther()}
                    style={{width:"100%",textAlign:"center",background:"none",border:"none",fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:15,color:PINK,outline:"none",padding:"14px 4px"}}/>
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <input type="number" placeholder="Enter value (e.g. 200 or −50)" value={newVal}
                onChange={e=>setNewVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addOther()}
                style={{flex:1,background:BG,border:`1.5px solid ${BORDER}`,borderRadius:12,padding:"10px 14px",fontFamily:"Poppins,sans-serif",fontSize:13,color:TEXT,outline:"none"}}/>
              <button onClick={addOther} disabled={other.length>=15||!newVal}
                style={{padding:"0 16px",background:other.length>=15?BG:GRAD,border:"none",borderRadius:12,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:13,color:other.length>=15?SUB:"#fff",cursor:other.length>=15?"not-allowed":"pointer"}}>
                Add
              </button>
            </div>
            <div style={{fontSize:11,color:SUB,fontWeight:600}}>{other.length}/15 values · Tap any value to edit · × to remove</div>
            <div style={{background:`${PINK}10`,border:`1px solid ${PINK}25`,borderRadius:10,padding:"10px 12px",marginTop:10,fontSize:12,color:PINK,fontWeight:600}}>
              Negative values (e.g. −50) will subtract coins — participants can go below zero on the leaderboard.
            </div>
          </>}
        </div>
        <div style={{padding:"0 20px 32px",flexShrink:0}}>
          <button onClick={save} style={{width:"100%",padding:"14px 0",background:GRAD,border:"none",borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer"}}>
            Save Coin Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Session Settings sheet (gear next to session name in session list) ──
function SessionSettings({ session, onRename, onToggleLive, onExport, onReset, onDuplicate, onArchive, onClose }) {
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(session.name); // eslint-disable-line
  function saveName() { if (nameVal.trim() && nameVal !== session.name) { onRename(nameVal.trim()); } setEditing(false); }
  return (
    <div style={{position:"fixed",inset:0,zIndex:500}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(26,10,20,.45)",backdropFilter:"blur(3px)"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,background:"#fff",borderRadius:"20px 20px 0 0",animation:"slideUp .25s ease",maxWidth:480,margin:"0 auto"}}>
        <div style={{padding:"14px 20px 0"}}>
          <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:18,color:TEXT}}>Session Settings</div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:SUB,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        </div>
        <div style={{padding:"0 20px 36px",display:"flex",flexDirection:"column",gap:10}}>
          {/* Session name edit */}
          <div style={{background:BG,borderRadius:14,padding:"14px 16px"}}>
            <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontFamily:"Poppins,sans-serif"}}>Session Name</div>
            {editing ? (
              <div style={{display:"flex",gap:8}}>
                <input value={nameVal} onChange={e=>setNameVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveName()} autoFocus
                  style={{flex:1,background:"#fff",border:`1.5px solid ${PINK}`,borderRadius:10,padding:"10px 12px",fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:15,color:TEXT,outline:"none"}}/>
                <button onClick={saveName} style={{padding:"0 16px",background:GRAD,border:"none",borderRadius:10,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>Save</button>
                <button onClick={()=>{setNameVal(session.name);setEditing(false);}} style={{padding:"0 12px",background:"none",border:`1px solid ${BORDER}`,borderRadius:10,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:13,color:SUB,cursor:"pointer"}}>Cancel</button>
              </div>
            ) : (
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:16,color:TEXT}}>{session.name}</div>
                <button onClick={()=>setEditing(true)} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,padding:"5px 12px",fontSize:12,color:SUB,cursor:"pointer",fontFamily:"Nunito,sans-serif",fontWeight:700}}>Edit</button>
              </div>
            )}
            <div style={{fontSize:11,color:SUB,marginTop:4}}>Code: {session.code} · {session.participants.length} participants</div>
          </div>

          {/* Live toggle */}
          <div onClick={onToggleLive}
            style={{background:session.live!==false?`${GREEN}10`:`#EF444410`,border:`1.5px solid ${session.live!==false?GREEN:"#EF4444"}`,borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"all .2s"}}>
            <div>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:session.live!==false?GREEN:"#EF4444"}}>
                {session.live!==false?"Session is Live":"Session is Offline"}
              </div>
              <div style={{fontSize:12,color:SUB,marginTop:2,fontWeight:500}}>
                {session.live!==false?"Participants can join and earn coins":"Participants cannot join or earn coins"}
              </div>
            </div>
            <div style={{width:44,height:26,borderRadius:13,background:session.live!==false?GREEN:"#EF4444",position:"relative",transition:"all .2s",flexShrink:0,marginLeft:12}}>
              <div style={{position:"absolute",top:3,left:session.live!==false?21:3,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.2)",transition:"left .2s"}}/>
            </div>
          </div>

          {/* Export */}
          <button onClick={onExport} style={{width:"100%",padding:"13px 0",background:`linear-gradient(135deg,${GREEN},#06B6D4)`,border:"none",borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:"#fff",cursor:"pointer"}}>
            Export Results CSV
          </button>

          {/* Duplicate */}
          <button onClick={onDuplicate}
            style={{width:"100%",padding:"13px 0",background:SOFT,border:`1.5px solid ${MID}`,borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:PINK,cursor:"pointer"}}>
            Duplicate Session
          </button>

          {/* Reset */}
          <button onClick={onReset} style={{width:"100%",padding:"13px 0",background:"#FEF2F2",border:"1.5px solid #EF444440",borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:"#EF4444",cursor:"pointer"}}>
            Reset All Coins
          </button>

          {/* Divider */}
          <div style={{height:1,background:BORDER,margin:"4px 0"}}/>

          {/* Archive */}
          <div style={{background:"#F8F8FA",border:`1px solid ${BORDER}`,borderRadius:13,padding:"14px 16px"}}>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:TEXT,marginBottom:4}}>Archive Session</div>
            <div style={{fontSize:12,color:SUB,marginBottom:12,lineHeight:1.6}}>
              Permanently closes the session. Participants can no longer join. Data is preserved as read-only history.
            </div>
            <button onClick={onArchive}
              style={{width:"100%",padding:"11px 0",background:"#1A0A14",border:"none",borderRadius:10,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>
              Archive Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Manage({ session, onUpdate, onClose, onExport, onReset, onRename, onToggleLive }) {
  const [tab, setTab] = useState("people");
  const [np, setNp] = useState("");
  const [ng, setNg] = useState("");
  const [ngc, setNgc] = useState(GC[0]);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(session.name); // eslint-disable-line

  const sorted = [...session.participants].sort((a,b) => a.num - b.num);
  function addP() { if (!np.trim()) return; const n=(session.participants.reduce((m,p)=>Math.max(m,p.num),0))+1; onUpdate(s=>{s.participants.push({id:Date.now(),name:np.trim(),av:mkAv(np),total:0,bk:{},gid:null,num:n});return s;}); setNp(""); }
  function addG() { if (!ng.trim()) return; onUpdate(s=>{s.groups.push({id:Date.now(),name:ng.trim(),color:ngc});return s;}); setNg(""); }
  function remP(pid) { onUpdate(s=>{s.participants=s.participants.filter(x=>x.id!==pid);return s;}); }
  function asgG(pid,gid) { onUpdate(s=>{const p=s.participants.find(x=>x.id===pid);if(p)p.gid=gid===""?null:Number(gid);return s;}); }
  function saveName() { if (nameVal.trim()) { onRename(nameVal.trim()); setEditingName(false); } } // eslint-disable-line

  const tabBtn = (id, label) => (
    <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 14px",border:"none",background:"none",fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:12,color:tab===id?PINK:SUB,cursor:"pointer",borderBottom:tab===id?`2.5px solid ${PINK}`:"2.5px solid transparent",transition:"all .12s",whiteSpace:"nowrap"}}>{label}</button>
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:400}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(26,10,20,.45)",backdropFilter:"blur(3px)"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,background:"#fff",borderRadius:"20px 20px 0 0",maxHeight:"85vh",display:"flex",flexDirection:"column",animation:"slideUp .25s ease",maxWidth:480,margin:"0 auto"}}>
        <div style={{padding:"14px 20px 0",flexShrink:0}}>
          <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 12px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:18,color:TEXT}}>Participants</div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:SUB,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          <div style={{display:"flex",borderBottom:`1px solid ${BORDER}`}}>
            {[["people","People"],["groups","Groups"]].map(([id,l]) => tabBtn(id,l))}
          </div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"16px 20px 32px"}}>

          {tab==="people" && <>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <Inp placeholder="Full name" value={np} onChange={e=>setNp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addP()} style={{flex:1}}/>
              <button onClick={addP} style={{padding:"0 18px",background:GRAD,border:"none",borderRadius:12,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>Add</button>
            </div>
            {sorted.length===0 && <div style={{textAlign:"center",padding:24,color:SUB,fontSize:13}}>No participants yet</div>}
            {sorted.map(p => {
              const grp = session.groups.find(g=>g.id===p.gid);
              return (
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${BORDER}`}}>
                  <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:11,color:SUB,minWidth:36}}>{pNum(p.num)}</div>
                  <Av s={p.av} color={grp?.color||PINK} size={34}/>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:14,color:TEXT}}>{p.name}</div>
                    <div style={{fontSize:11,color:PINK,fontWeight:600}}>{p.total} coins</div>
                  </div>
                  <select value={p.gid??""} onChange={e=>asgG(p.id,e.target.value)} style={{background:SOFT,border:`1px solid ${MID}`,color:TEXT,borderRadius:9,padding:"5px 8px",fontSize:11,fontFamily:"Poppins,sans-serif",cursor:"pointer",outline:"none",maxWidth:90}}>
                    <option value="">No group</option>
                    {session.groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <button onClick={()=>remP(p.id)} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,padding:"4px 9px",fontSize:11,color:SUB,cursor:"pointer"}}>✕</button>
                </div>
              );
            })}
          </>}

          {tab==="groups" && <>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <Inp placeholder="Group name" value={ng} onChange={e=>setNg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addG()} style={{flex:1}}/>
              <button onClick={addG} style={{padding:"0 18px",background:GRAD,border:"none",borderRadius:12,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>Add</button>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
              {GC.map(c => <div key={c} onClick={()=>setNgc(c)} style={{width:26,height:26,borderRadius:8,background:c,cursor:"pointer",transition:".12s",border:ngc===c?`3px solid ${TEXT}`:"3px solid transparent",transform:ngc===c?"scale(1.15)":"scale(1)"}}/>)}
            </div>
            {session.groups.map(g => (
              <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${BORDER}`}}>
                <div style={{width:12,height:12,borderRadius:3,background:g.color,flexShrink:0}}/>
                <div style={{flex:1,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:14,color:g.color}}>{g.name}</div>
                <div style={{fontSize:11,color:SUB}}>{session.participants.filter(p=>p.gid===g.id).length} members</div>
              </div>
            ))}
          </>}
        </div>
      </div>
    </div>
  );
}

// ── Auth ──
function Auth({ onDone }) {
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [showP, setShowP] = useState(false);

  if (view==="sent") return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 20px"}}>
      <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:20,padding:"36px 28px",maxWidth:400,width:"100%",textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:SOFT,border:`2px solid ${MID}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2.2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:22,color:TEXT,marginBottom:8}}>Check your email</div>
        <div style={{fontSize:13,color:SUB,marginBottom:24,lineHeight:1.7}}>Reset link sent to<br/><strong style={{color:TEXT}}>{email}</strong></div>
        <button onClick={()=>setView("login")} style={{background:"none",border:"none",color:PINK,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:14,cursor:"pointer"}}>Back to sign in</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"Poppins,sans-serif"}}>
      <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:20,padding:"32px 28px",maxWidth:400,width:"100%"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:24}}>
          <Ham size={68}/>
          <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:26,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-1,marginTop:4,lineHeight:1.1}}>Teticoin</div>
          <div style={{fontSize:12,color:SUB,fontWeight:500,marginTop:2}}>Gamifying Interactions</div>
        </div>

        {view!=="forgot" && (
          <div style={{display:"flex",background:BG,borderRadius:12,padding:4,marginBottom:20}}>
            {["login","register"].map(v => (
              <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"9px 0",borderRadius:9,border:"none",background:view===v?"#fff":"transparent",fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:13,color:view===v?TEXT:SUB,cursor:"pointer",boxShadow:view===v?"0 1px 6px rgba(0,0,0,.08)":"none",transition:"all .15s"}}>
                {v==="login"?"Sign In":"Register"}
              </button>
            ))}
          </div>
        )}

        {view==="forgot" && (
          <div style={{marginBottom:20}}>
            <button onClick={()=>setView("login")} style={{background:"none",border:"none",color:SUB,fontFamily:"Poppins,sans-serif",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:0,marginBottom:10}}><span style={{fontSize:18}}>‹</span>Back</button>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:4}}>Reset Password</div>
            <div style={{fontSize:13,color:SUB}}>We'll send a reset link to your email.</div>
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {view==="register" && <Inp placeholder="Full name" value={name} onChange={e=>setName(e.target.value)}/>}
          <Inp placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} type="email"/>
          {view!=="forgot" && (
            <div style={{position:"relative"}}>
              <Inp placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} type={showP?"text":"password"} style={{paddingRight:56}}/>
              <button onClick={()=>setShowP(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:SUB,fontFamily:"Poppins,sans-serif",fontSize:11,fontWeight:700,cursor:"pointer"}}>{showP?"HIDE":"SHOW"}</button>
            </div>
          )}
          {view==="login" && (
            <div style={{textAlign:"right",marginTop:-4}}>
              <button onClick={()=>setView("forgot")} style={{background:"none",border:"none",color:PINK,fontFamily:"Poppins,sans-serif",fontSize:12,cursor:"pointer",fontWeight:600}}>Forgot password?</button>
            </div>
          )}
          <PBtn full onClick={async()=>{
              if(view==="forgot"){
                try{ await sendPasswordResetEmail(auth,email); setView("sent"); }
                catch(e){ alert("Error: "+e.message); }
              } else if(view==="login"){
                try{ const c=await signInWithEmailAndPassword(auth,email,pass); onDone({name:c.user.displayName||email.split("@")[0]||"User",email,uid:c.user.uid}); }
                catch(e){ alert("Login failed: "+e.message); }
              } else {
                try{ const c=await createUserWithEmailAndPassword(auth,email,pass); await updateProfile(c.user,{displayName:name||email.split("@")[0]}); onDone({name:name||email.split("@")[0],email,uid:c.user.uid}); }
                catch(e){ alert("Register failed: "+e.message); }
              }
            }}>
            {view==="login"?"Sign In":view==="register"?"Create Account":"Send Reset Link"}
          </PBtn>
          {view!=="forgot" && <>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1,height:1,background:BORDER}}/><span style={{fontSize:12,color:SUB,fontWeight:600}}>or</span><div style={{flex:1,height:1,background:BORDER}}/>
            </div>
            <button onClick={async()=>{try{const c=await signInWithPopup(auth,googleProvider);onDone({name:c.user.displayName||"User",email:c.user.email,uid:c.user.uid});}catch(e){alert("Google sign-in failed: "+e.message);}}}
              style={{width:"100%",padding:"12px 0",borderRadius:13,border:`1.5px solid ${BORDER}`,background:"#fff",fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:14,color:TEXT,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"all .15s"}}
              onMouseOver={e=>{e.currentTarget.style.background=BG;e.currentTarget.style.borderColor=PINK;}}
              onMouseOut={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.borderColor=BORDER;}}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.3 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.8l5.7-5.7C33.5 7 29 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19c10 0 18.7-7.2 18.7-19 0-1.3-.1-2.7-.1-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c2.8 0 5.3 1 7.2 2.8l5.7-5.7C33.5 7 29 5 24 5c-7.2 0-13.4 4-16.7 9.7z"/><path fill="#4CAF50" d="M24 43c5.2 0 9.8-1.8 13.4-4.7l-6.2-5.2C29.3 34.3 26.8 35 24 35c-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.8 39.2 16.4 43 24 43z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.6-2.7 4.8-5.1 6.1l6.2 5.2C40 35.8 44 30.4 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
              Continue with Google
            </button>
          </>}
        </div>
      </div>
    </div>
  );
}

// ── Participant view ──
function ParticipantView({ session: init, hostPlan="free" }) {
  const [step, setStep] = useState("name");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [myId, setMyId] = useState(null);
  const [live, setLive] = useState(init);
  const [showMyQR, setShowMyQR] = useState(false);
  const [returnMatch, setReturnMatch] = useState(null);

  const isPro = hostPlan !== "free";

  // Poll for live updates every 2s once joined
  useEffect(() => {
    if (step !== "joined" || !init?.code) return;
    const t = setInterval(async () => {
      const s = await sgSession(init.code);
      if (s) setLive(s);
    }, 2000);
    return () => clearInterval(t);
  }, [step, init?.code]);

  function checkName() {
    if (!name.trim()) return;
    const existing = (live.participants||[]).find(
      p => p.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (existing) { setReturnMatch(existing); setStep("returning"); }
    else { setStep(isPro ? "newpin" : "directjoin"); }
  }

  function directJoin(overrideName) {
    const n = ((live.participants||[]).reduce((m,p)=>Math.max(m,p.num||0),0))+1;
    const joinName = overrideName || name.trim();
    const np = {id:Date.now(),name:joinName,av:mkAv(joinName),total:0,bk:{},gid:null,num:n};
    setMyId(np.id);
    const u = {...live,participants:[...(live.participants||[]),np]};
    setLive(u); ssSession(init.code, u); setStep("joined");
  }

  function confirmReturn() {
    if (returnMatch.pin) { setStep("pinentry"); }
    else { setMyId(returnMatch.id); setStep("joined"); }
  }

  function notMe() { setStep(isPro ? "newpin" : "directjoin_new"); }

  function setNewPin() {
    if (pin.length !== 4) return;
    const n = ((live.participants||[]).reduce((m,p)=>Math.max(m,p.num||0),0))+1;
    const np = {id:Date.now(),name:name.trim(),av:mkAv(name),total:0,bk:{},gid:null,num:n,pin};
    setMyId(np.id);
    const u = {...live,participants:[...(live.participants||[]),np]};
    setLive(u); ssSession(init.code, u); setStep("joined");
  }

  function skipPin() { directJoin(); }

  function verifyPin() {
    if (pinInput === returnMatch.pin) { setMyId(returnMatch.id); setStep("joined"); }
    else { setPinError("Wrong PIN. Try again."); setPinInput(""); }
  }

  useEffect(() => {
    if (step === "directjoin") directJoin();
    if (step === "directjoin_new") directJoin(name.trim() + " 2");
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const me = live?.participants?.find(p => p.id === myId);
  const sorted = [...(live?.participants||[])].sort((a,b) => b.total - a.total);
  const myRank = sorted.findIndex(p => p.id === myId) + 1;

  function PinPad({ value, onChange, length=4 }) {
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        <div style={{display:"flex",gap:12,marginBottom:4}}>
          {Array.from({length}).map((_,i)=>(
            <div key={i} style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${value.length>i?PINK:BORDER}`,background:value.length>i?PINK:"transparent",transition:"all .15s"}}/>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,width:"100%",maxWidth:260}}>
          {[1,2,3,4,5,6,7,8,9,"","0","\u232B"].map((k,i)=>(
            <button key={i} onClick={()=>{
              if (k==="\u232B") onChange(v=>v.slice(0,-1));
              else if (k!=="" && value.length<length) onChange(v=>v+String(k));
            }} style={{padding:"16px 8px",borderRadius:12,border:`1px solid ${BORDER}`,background:k==="\u232B"?SOFT:"#fff",cursor:k===""?"default":"pointer",fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:20,color:k==="\u232B"?PINK:TEXT,transition:"transform .08s"}}
              onMouseDown={e=>e.currentTarget.style.transform="scale(0.92)"}
              onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
              onTouchStart={e=>{e.preventDefault();e.currentTarget.style.transform="scale(0.92)";}}
              onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
              {k}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const card = (content) => (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"Poppins,sans-serif"}}>
      <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:20,padding:"32px 24px",maxWidth:380,width:"100%",textAlign:"center"}}>
        {content}
      </div>
    </div>
  );

  if (step === "name") return card(<>
    <Ham size={60}/>
    <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:24,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginTop:6,marginBottom:4,lineHeight:1.1}}>Join Session</div>
    <div style={{background:SOFT,border:`1px solid ${MID}`,borderRadius:10,padding:"6px 16px",margin:"10px auto 20px",display:"inline-block"}}>
      <div style={{fontSize:10,color:SUB,fontWeight:600}}>Session</div>
      <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:22,letterSpacing:4,color:PINK}}>{live?.code}</div>
    </div>
    <Inp placeholder="Your full name" value={name} onChange={e=>setName(e.target.value)}
      onKeyDown={e=>e.key==="Enter"&&checkName()} style={{textAlign:"center",marginBottom:12}}/>
    <PBtn full onClick={checkName} disabled={!name.trim()}>Continue</PBtn>
    <div style={{marginTop:12,fontSize:12,color:SUB}}>No account needed</div>
  </>);

  if (step === "returning") return card(<>
    <div style={{width:64,height:64,borderRadius:20,background:SOFT,border:`2px solid ${MID}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
      <Av s={returnMatch.av} color={PINK} size={44}/>
    </div>
    <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:6}}>Welcome back!</div>
    <div style={{fontSize:14,color:SUB,marginBottom:6,lineHeight:1.6}}>
      We found <strong style={{color:TEXT}}>{returnMatch.name}</strong> in this session.
    </div>
    <div style={{background:SOFT,border:`1px solid ${MID}`,borderRadius:12,padding:"10px 16px",marginBottom:20,display:"inline-flex",alignItems:"center",gap:10}}>
      <span style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:13,color:PINK}}>{pNum(returnMatch.num)}</span>
      <span style={{fontSize:13,color:TEXT,fontWeight:600}}>{returnMatch.total} coins</span>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <PBtn full onClick={confirmReturn}>Yes, that's me →</PBtn>
      <button onClick={notMe} style={{padding:"12px 0",background:"none",border:`1px solid ${BORDER}`,borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:14,color:SUB,cursor:"pointer"}}>
        Not me — I'm someone else
      </button>
    </div>
  </>);

  if (step === "pinentry") return card(<>
    <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:6}}>Enter your PIN</div>
    <div style={{fontSize:13,color:SUB,marginBottom:20,lineHeight:1.6}}>
      {returnMatch.name} has a PIN set.<br/>Enter it to rejoin.
    </div>
    <PinPad value={pinInput} onChange={setPinInput} length={4}/>
    {pinError && <div style={{marginTop:12,fontSize:13,color:"#EF4444",fontWeight:600}}>{pinError}</div>}
    <button onClick={verifyPin} disabled={pinInput.length<4}
      style={{width:"100%",marginTop:16,padding:"13px 0",background:pinInput.length===4?GRAD:BG,border:"none",borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:pinInput.length===4?"#fff":SUB,cursor:pinInput.length===4?"pointer":"not-allowed"}}>
      Confirm PIN
    </button>
    <button onClick={()=>setStep("name")} style={{marginTop:8,background:"none",border:"none",fontSize:13,color:SUB,cursor:"pointer",fontFamily:"Poppins,sans-serif"}}>\u2190 Back</button>
  </>);

  if (step === "newpin") return card(<>
    <div style={{width:48,height:48,borderRadius:14,background:`${PURPLE}15`,border:`1.5px solid ${PURPLE}35`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    </div>
    <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:6}}>Set a PIN</div>
    <div style={{fontSize:13,color:SUB,marginBottom:20,lineHeight:1.6}}>
      Create a 4-digit PIN so you can rejoin and keep your coins &amp; number.
    </div>
    <PinPad value={pin} onChange={setPin} length={4}/>
    <button onClick={setNewPin} disabled={pin.length<4}
      style={{width:"100%",marginTop:16,padding:"13px 0",background:pin.length===4?GRAD:BG,border:"none",borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:pin.length===4?"#fff":SUB,cursor:pin.length===4?"pointer":"not-allowed"}}>
      Set PIN &amp; Join
    </button>
    <button onClick={skipPin} style={{marginTop:10,background:"none",border:"none",fontSize:13,color:SUB,cursor:"pointer",fontFamily:"Poppins,sans-serif",textDecoration:"underline"}}>
      Skip \u2014 join without PIN
    </button>
  </>);

  // Leaderboard view — host pushed boardVisible=true
  if (step === "joined" && live?.boardVisible) return (
    <div style={{minHeight:"100vh",background:"#0D0008",fontFamily:"Poppins,sans-serif",color:"#fff",padding:"24px 20px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <Confetti active/>
      <Ham size={56}/>
      <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:24,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginTop:4,marginBottom:2,lineHeight:1.1}}>Leaderboard</div>
      <div style={{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:20}}>{live?.name}</div>
      <div style={{width:"100%",maxWidth:400,display:"flex",flexDirection:"column",gap:8}}>
        {sorted.map((p,i) => (
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",background:p.id===myId?"rgba(233,30,140,.18)":"rgba(255,255,255,.05)",borderRadius:14,border:p.id===myId?`1.5px solid ${PINK}66`:"1.5px solid rgba(255,255,255,.07)"}}>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:16,color:rankColor(i),minWidth:22}}>{i+1}</div>
            <Av s={p.av} color={live.groups?.find(g=>g.id===p.gid)?.color||PINK} size={34}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14}}>{p.name}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{pNum(p.num)}</div>
            </div>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,color:p.id===myId?PINK:"#fff"}}>{p.total}</div>
            {p.id===myId && <div style={{fontSize:10,background:PINK,color:"#fff",padding:"2px 8px",borderRadius:99,fontWeight:700}}>You</div>}
          </div>
        ))}
      </div>
    </div>
  );

  // Main participant dashboard
  if (step === "joined") return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"Poppins,sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"0 16px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Ham size={28}/>
          <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:16,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Teticoin</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setShowMyQR(v=>!v)}
            style={{display:"flex",alignItems:"center",gap:5,background:showMyQR?SOFT:"none",border:`1px solid ${showMyQR?PINK:BORDER}`,borderRadius:9,padding:"5px 10px",fontSize:12,fontFamily:"Nunito,sans-serif",fontWeight:700,color:showMyQR?PINK:SUB,cursor:"pointer"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3" rx=".5"/></svg>
            My QR
          </button>
          <div style={{background:SOFT,border:`1px solid ${MID}`,borderRadius:8,padding:"3px 10px",fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:12,color:PINK,letterSpacing:1}}>
            {me ? pNum(me.num) : "—"}
          </div>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:12,maxWidth:420,margin:"0 auto",width:"100%"}}>

        {showMyQR && me && (
          <div style={{width:"100%",background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:16,padding:"20px",textAlign:"center"}}>
            <div style={{fontSize:11,color:SUB,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>My QR Code</div>
            <div style={{display:"inline-block",background:"#fff",borderRadius:12,padding:10,border:`1px solid ${BORDER}`}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,width:140,height:140}}>
                {(() => {
                  const seed = pNum(me.num);
                  const h = seed.split("").reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0)|0,0);
                  const corners=[0,1,2,7,8,9,14,6,13,20,36,37,38,43,44,45,42,48];
                  return Array.from({length:49},(_,i)=>{
                    const v=(Math.abs(h)^(i*2654435761))>>>0;
                    return corners.includes(i)||(v%2===0);
                  });
                })().map((on,i)=><div key={i} style={{borderRadius:1,background:on?PINK:"transparent"}}/>)}
              </div>
            </div>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:18,color:PINK,marginTop:10,letterSpacing:2}}>{pNum(me.num)}</div>
            <div style={{fontSize:12,color:SUB,marginTop:2}}>{me.name}</div>
            <div style={{fontSize:11,color:SUB,marginTop:6,background:SOFT,borderRadius:8,padding:"4px 10px",display:"inline-block"}}>Show this to the host to earn coins</div>
          </div>
        )}

        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:SOFT,border:`1.5px solid ${MID}`,borderRadius:12,padding:"6px 18px",fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:16,color:PINK,letterSpacing:3}}>
            {me ? pNum(me.num) : "—"}
          </div>
          <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:18,color:TEXT}}>{me?.name||"—"}</div>
        </div>

        <div style={{width:"100%",background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:20,padding:"28px 24px",textAlign:"center",boxShadow:`0 4px 24px ${PINK}10`}}>
          <div style={{fontSize:11,fontWeight:700,color:SUB,marginBottom:6,letterSpacing:.5,textTransform:"uppercase"}}>Your Teticoins</div>
          <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:80,lineHeight:1,color:PINK,letterSpacing:-4}}>{me?.total||0}</div>
          <div style={{fontSize:13,color:SUB,marginTop:6,fontWeight:500}}>coins collected</div>
        </div>

        <div style={{width:"100%",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {ACTS.map(a => (
            <div key={a.id} style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,color:a.col}}>{me?.bk?.[a.id]||0}</div>
              <div style={{fontSize:10,color:SUB,fontWeight:600,lineHeight:1.3,marginTop:2}}>{a.label}</div>
            </div>
          ))}
        </div>

        {myRank > 0 && sorted.length > 1 && (
          <div style={{width:"100%",background:SOFT,border:`1.5px solid ${MID}`,borderRadius:14,padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:13,color:SUB,fontWeight:600}}>Your rank</div>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,color:PINK}}>#{myRank} <span style={{fontSize:13,color:SUB,fontWeight:600}}>of {sorted.length}</span></div>
          </div>
        )}

        <div style={{fontSize:12,color:SUB,textAlign:"center",lineHeight:1.8,marginTop:4}}>
          {sorted.length <= 1 ? "Waiting for others to join..." : "Leaderboard will appear when host shares it"}
        </div>
      </div>
    </div>
  );

  return <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}><Ham size={60}/></div>;
}



// ── Projector ──
function Projector({ session, onBack }) {
  const sorted = [...session.participants].sort((a,b)=>b.total-a.total);
  const gs = session.groups.map(g=>({...g,total:session.participants.filter(p=>p.gid===g.id).reduce((s,p)=>s+p.total,0),members:session.participants.filter(p=>p.gid===g.id)})).sort((a,b)=>b.total-a.total);
  return (
    <div style={{minHeight:"100vh",background:"#0D0008",color:"#fff",fontFamily:"Poppins,sans-serif",padding:"28px 24px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <Ham size={50}/>
          <div>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:26,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Teticoin</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.3)",letterSpacing:2,textTransform:"uppercase",marginTop:2}}>{session.name} · {session.code}</div>
          </div>
        </div>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"8px 16px",color:"rgba(255,255,255,.6)",fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:13,cursor:"pointer"}}>Back</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Individual</div>
          {sorted.map((p,i) => (
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:i===0?"rgba(233,30,140,.1)":"rgba(255,255,255,.04)",borderRadius:13,marginBottom:8,border:`1px solid ${i===0?"rgba(233,30,140,.2)":"rgba(255,255,255,.06)"}`}}>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:15,color:rankColor(i),minWidth:22,textAlign:"center"}}>{i+1}</div>
              <Av s={p.av} color={session.groups.find(g=>g.id===p.gid)?.color||PINK} size={36}/>
              <div style={{flex:1}}>
                <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:"#fff"}}>{p.name}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>{pNum(p.num)}</div>
              </div>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:22,color:i===0?PINK:"#fff"}}>{p.total}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Groups</div>
          {gs.length===0 && <div style={{color:"rgba(255,255,255,.2)",fontSize:13,padding:20,textAlign:"center"}}>No groups</div>}
          {gs.map(g => (
            <div key={g.id} style={{padding:"14px 16px",background:"rgba(255,255,255,.04)",borderRadius:13,marginBottom:10,border:`1px solid ${g.color}22`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:10,height:10,borderRadius:3,background:g.color}}/>
                  <span style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:16,color:g.color}}>{g.name}</span>
                </div>
                <span style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:22,color:g.color}}>{g.total}</span>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                {g.members.map(m => <span key={m.id} style={{fontSize:11,background:`${g.color}18`,border:`1px solid ${g.color}30`,color:g.color,padding:"2px 9px",borderRadius:99,fontWeight:700}}>{m.name}</span>)}
              </div>
              <div style={{height:4,background:"rgba(255,255,255,.08)",borderRadius:4}}>
                <div style={{height:4,background:g.color,width:`${(g.total/(gs[0]?.total||1))*100}%`,borderRadius:4,transition:"width .8s ease"}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── QR Share sheet ──
function QRSheet({ session, onClose }) {
  const [copied, setCopied] = useState("");
  const qrRef = useRef(null);
  const url = `${window.location.origin}/join/${session.code}`;
  function copy(text, label) { navigator.clipboard.writeText(text); setCopied(label); setTimeout(()=>setCopied(""),2000); }

  useEffect(() => {
    const container = qrRef.current;
    if (!container) return;
    container.innerHTML = "";
    // Use qrcode.js to generate a real QR
    const script = document.querySelector('script[src*="qrcode"]');
    function renderQR() {
      if (window.QRCode) {
        new window.QRCode(container, {
          text: url,
          width: 180,
          height: 180,
          colorDark: "#E91E8C",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.M,
        });
      }
    }
    if (window.QRCode) {
      renderQR();
    } else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      s.onload = renderQR;
      document.head.appendChild(s);
    }
  }, [url]);

  return (
    <div style={{position:"fixed",inset:0,zIndex:420}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(26,10,20,.45)",backdropFilter:"blur(3px)"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,background:"#fff",borderRadius:"20px 20px 0 0",animation:"slideUp .25s ease",maxWidth:480,margin:"0 auto"}}>
        <div style={{padding:"14px 20px 0",flexShrink:0}}>
          <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,color:TEXT}}>Share Session</div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:SUB,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          <div style={{fontSize:13,color:SUB,marginBottom:20}}>Participants scan or open the link to join. No account needed.</div>
        </div>
        <div style={{padding:"0 20px 32px"}}>
          {/* Real QR code */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",background:BG,borderRadius:16,padding:"24px 20px",marginBottom:16}}>
            <div style={{width:180,height:180,background:"#fff",borderRadius:14,padding:8,border:`1px solid ${BORDER}`,boxShadow:`0 4px 20px ${PINK}15`,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
              <div ref={qrRef}/>
            </div>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:22,letterSpacing:6,color:PINK,marginBottom:6}}>{session.code}</div>
            <div style={{fontSize:11,color:SUB,fontWeight:500,marginBottom:8}}>{url}</div>
            <div style={{fontSize:12,color:PINK,fontWeight:600,background:SOFT,border:`1px solid ${MID}`,borderRadius:8,padding:"4px 12px"}}>Show this screen to participants to scan</div>
          </div>
          {/* Copy buttons */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button onClick={()=>copy(url,"link")} style={{padding:"13px 0",background:copied==="link"?`${GREEN}15`:SOFT,border:`1.5px solid ${copied==="link"?GREEN:MID}`,borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:copied==="link"?GREEN:PINK,cursor:"pointer",transition:"all .2s"}}>
              {copied==="link"?"Copied!":"Copy Link"}
            </button>
            <button onClick={()=>copy(session.code,"code")} style={{padding:"13px 0",background:copied==="code"?`${GREEN}15`:BG,border:`1.5px solid ${copied==="code"?GREEN:BORDER}`,borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:copied==="code"?GREEN:TEXT,cursor:"pointer",transition:"all .2s"}}>
              {copied==="code"?"Copied!":"Copy Code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Leaderboard sheet ──
function LeaderSheet({ session, onToggleBoard, onClose }) {
  const sorted = [...session.participants].sort((a,b)=>b.total-a.total);
  const gs = session.groups.map(g=>({...g,total:session.participants.filter(p=>p.gid===g.id).reduce((s,p)=>s+p.total,0),members:session.participants.filter(p=>p.gid===g.id)})).sort((a,b)=>b.total-a.total);
  const maxP = sorted[0]?.total||1;
  return (
    <div style={{position:"fixed",inset:0,zIndex:420}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(26,10,20,.45)",backdropFilter:"blur(3px)"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,background:"#fff",borderRadius:"20px 20px 0 0",maxHeight:"88vh",display:"flex",flexDirection:"column",animation:"slideUp .25s ease",maxWidth:480,margin:"0 auto"}}>
        <div style={{padding:"14px 20px 0",flexShrink:0}}>
          <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 14px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,color:TEXT}}>Leaderboard</div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:SUB,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          {/* Board visibility toggle — lives here */}
          <div onClick={onToggleBoard}
            style={{background:session.boardVisible?`${GREEN}12`:`${PINK}08`,border:`1.5px solid ${session.boardVisible?GREEN:BORDER}`,borderRadius:13,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:12,transition:"all .2s"}}>
            <div>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:session.boardVisible?GREEN:TEXT}}>
                {session.boardVisible?"Leaderboard visible to participants":"Leaderboard hidden from participants"}
              </div>
              <div style={{fontSize:12,color:SUB,marginTop:2,fontWeight:500}}>
                {session.boardVisible?"Participants can see the board now":"Tap to show board on participant devices"}
              </div>
            </div>
            <div style={{width:44,height:26,borderRadius:13,background:session.boardVisible?GREEN:BORDER,position:"relative",transition:"all .2s",flexShrink:0,marginLeft:12}}>
              <div style={{position:"absolute",top:3,left:session.boardVisible?21:3,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.2)",transition:"left .2s"}}/>
            </div>
          </div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"0 16px 32px"}}>
          {/* Individuals */}
          <SL>Individual Rankings</SL>
          <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,overflow:"hidden",marginBottom:20}}>
            {sorted.length===0 && <div style={{padding:32,textAlign:"center",color:SUB,fontSize:13}}>No participants yet</div>}
            {sorted.map((p,i)=>{
              const grp=session.groups.find(g=>g.id===p.gid);
              return (
                <div key={p.id} style={{padding:"12px 14px",borderBottom:`1px solid ${BORDER}`,background:i===0?SOFT:"#fff"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:15,color:rankColor(i),minWidth:20,textAlign:"center"}}>{i+1}</div>
                    <span style={{fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:11,color:SUB,minWidth:30}}>{pNum(p.num)}</span>
                    <Av s={p.av} color={grp?.color||PINK} size={34}/>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:TEXT}}>{p.name}</div>
                      {grp && <span style={{fontSize:10,background:`${grp.color}18`,border:`1px solid ${grp.color}30`,color:grp.color,padding:"1px 7px",borderRadius:99,fontWeight:700}}>{grp.name}</span>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:22,color:i===0?PINK:TEXT}}>{p.total}</div>
                      <div style={{fontSize:10,color:SUB}}>coins</div>
                    </div>
                  </div>
                  <div style={{marginTop:8,height:4,background:BORDER,borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:4,background:GRAD,width:`${(p.total/maxP)*100}%`,borderRadius:4,transition:"width .5s ease"}}/>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Groups */}
          {gs.length > 0 && <>
            <SL>Group Rankings</SL>
            {gs.map((g,i)=>(
              <div key={g.id} style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"14px 16px",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:14,color:rankColor(i),minWidth:18}}>{i+1}</div>
                    <div style={{width:11,height:11,borderRadius:3,background:g.color,flexShrink:0}}/>
                    <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:16,color:g.color}}>{g.name}</div>
                    <div style={{fontSize:11,color:SUB}}>{g.members.length} members</div>
                  </div>
                  <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:22,color:g.color}}>{g.total}</div>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                  {g.members.map(m=><span key={m.id} style={{fontSize:11,background:`${g.color}12`,border:`1px solid ${g.color}28`,color:g.color,padding:"2px 9px",borderRadius:99,fontWeight:700}}>{pNum(m.num)} {m.name}</span>)}
                </div>
                <div style={{height:4,background:BORDER,borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:4,background:g.color,width:`${(g.total/(gs[0]?.total||1))*100}%`,borderRadius:4,transition:"width .6s ease"}}/>
                </div>
              </div>
            ))}
          </>}
        </div>
      </div>
    </div>
  );
}

// ── Quick Coin button (pill, press to fill) ──
function QuickCoinBtn({ pts, label, pal, onAward }) {
  const [pressed, setPressed] = useState(false);
  function down() { setPressed(true); }
  function up() { setPressed(false); }
  return (
    <button
      onClick={onAward}
      onMouseDown={down} onMouseUp={up} onMouseLeave={up}
      onTouchStart={down} onTouchEnd={up}
      style={{
        padding:"8px 6px 10px",borderRadius:10,
        border:`1.5px solid ${pal.border}`,
        background: pressed ? pal.fill : pal.bg,
        cursor:"pointer",
        transition:"transform .08s, background .08s",
        transform: pressed ? "scale(0.91)" : "scale(1)",
        display:"flex",flexDirection:"column",alignItems:"center",gap:4,
        userSelect:"none",WebkitUserSelect:"none"}}>
      <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:26,lineHeight:1,
        color: pressed ? "#fff" : (pts<0?"#EF4444":pal.num),
        transition:"color .08s"}}>
        {pts>0?"+":""}{pts}
      </div>
      <div style={{fontSize:10,fontWeight:700,textAlign:"center",lineHeight:1.3,
        color: pressed ? "rgba(255,255,255,.85)" : pal.num,
        transition:"color .08s"}}>
        {label}
      </div>
    </button>
  );
}

// ── Inline-editable coin button (Give Coins) ──
function InlineCoinBtn({ value, bg, border, col, disabled, onAward, onEdit, circle=false }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));
  const [pressed, setPressed] = useState(false);
  const pressTimer = useRef(null);


  function startPress() {
    setPressed(true);
    pressTimer.current = setTimeout(()=>{ setPressed(false); setEditing(true); }, 600);
  }
  function endPress() { clearTimeout(pressTimer.current); setPressed(false); }

  function commit() {
    const n = parseInt(val);
    if (!isNaN(n)) onEdit(n);
    setEditing(false);
    setVal(String(isNaN(parseInt(val)) ? value : parseInt(val)));
  }

  if (editing) return (
    <div style={{borderRadius:10,border:"1.5px solid #FECDE8",background:"#fff",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:"8px 6px",minHeight:64}}>
      <input type="number" value={val} autoFocus
        onChange={e=>setVal(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape"){setEditing(false);setVal(String(value));}}}
        onBlur={commit}
        style={{width:"100%",textAlign:"center",background:"none",border:"none",
          fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:22,
          color:"#E91E8C",outline:"none",padding:"4px 0"}}/>
    </div>
  );

  return (
    <button
      onClick={e=>{if(!editing)onAward(e);}}
      onMouseDown={startPress} onMouseUp={endPress} onMouseLeave={endPress}
      onTouchStart={startPress} onTouchEnd={endPress}
      onDoubleClick={e=>{e.preventDefault();setEditing(true);}}
      style={{padding:"8px 6px",
        borderRadius:10,
        border:"1.5px solid #FECDE8",
        background: pressed ? "#E91E8C" : "#fff",
        cursor:"pointer",fontFamily:"Nunito,sans-serif",fontWeight:900,
        fontSize:28,
        color: pressed ? "#fff" : "transparent",
        WebkitTextFillColor: pressed ? "#fff" : "transparent",
        backgroundClip: pressed ? "unset" : "text",
        WebkitBackgroundClip: pressed ? "unset" : "text",
        backgroundImage: pressed ? "none" : "linear-gradient(135deg,#E91E8C,#FF4FB8)",
        transition:"transform .08s, background-color .08s",
        display:"flex",alignItems:"center",justifyContent:"center",
        transform: pressed ? "scale(0.91)" : "scale(1)",
        userSelect:"none",WebkitUserSelect:"none"}}>
      {value>0?"+":""}{value}
    </button>
  );
}

// ── Session screen ──
function Session({ session: init, onBack, onPView }) {
  const [ses, setSes] = useState(init);
  const [tab, setTab] = useState("award");
  const [selId, setSelId] = useState(null);
  const [picker, setPicker] = useState(false);
  const [manage, setManage] = useState(false);
  const [mass, setMass] = useState(false);
  const [proj, setProj] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showLeader, setShowLeader] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCoinCustomizer, setShowCoinCustomizer] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(init.name);
  const [anims, setAnims] = useState([]);
  const [confetti, setConfetti] = useState(false);
  const [snd] = useState(true);
  const [cAmt, setCAmt] = useState("");
  const [toast, setToast] = useState(null);
  const aid = useRef(0);

  const isLive = ses.live !== false; // default true

  const [confirmOffline, setConfirmOffline] = useState(false);

  // ── Live poll: pull participant updates from Firebase every 3s ──
  useEffect(() => {
    if (!isLive) return;
    const t = setInterval(async () => {
      const fresh = await sgSession(ses.code);
      if (!fresh) return;
      // Only update participants + log from remote — don't overwrite local UI state
      setSes(prev => ({...prev, participants: fresh.participants||prev.participants, log: fresh.log||prev.log}));
    }, 3000);
    return () => clearInterval(t);
  }, [isLive, ses.code]);

  useEffect(() => { ssSession(ses.code, ses); }, [ses]);
  function mut(fn) { setSes(prev => { const s = JSON.parse(JSON.stringify(prev)); fn(s); return s; }); }
  function notify(m, type="ok") { setToast({m,type}); setTimeout(()=>setToast(null), 2200); }
  function toggleLive() {
    if (ses.live !== false) {
      // Going offline — show confirm
      setConfirmOffline(true);
    } else {
      // Going live — instant, no confirm needed
      mut(s=>{s.live=true;}); notify("Session is now Live");
    }
  }
  function goOffline() { mut(s=>{s.live=false;}); setConfirmOffline(false); notify("Session is offline"); }
  function renameSession(name) { mut(s=>{s.name=name;}); notify("Session renamed"); }

  function award(pid, type, pts, mx = window.innerWidth/2, my = 300) {
    if (!pid) { notify("Select a participant first","warn"); return; }
    if (!isLive) { notify("Session is offline — go live first","warn"); return; }
    if (snd) playSound(pts >= 100);
    if (pts >= 100) { setConfetti(true); setTimeout(()=>setConfetti(false), 3000); }
    mut(s => {
      const p = s.participants.find(x=>x.id===pid); if (!p) return;
      p.total += pts; p.bk[type] = (p.bk[type]||0)+1;
      p.hist = [{type,pts,t:new Date().toLocaleTimeString()}, ...(p.hist||[]).slice(0,29)];
      s.log = [{id:Date.now(),name:p.name,type,pts,t:new Date().toLocaleTimeString()}, ...(s.log||[]).slice(0,99)];
    });
    const col = type==="token" ? YELLOW : ACTS.find(x=>x.id===type)?.col||YELLOW;
    setAnims(a => [...a, {id:aid.current++,x:mx,y:my,text:`+${pts}`,color:col}]);
    notify(`+${pts} coins awarded`);
  }

  // Award with guard: if no participant selected or session paused, show warning
  function awardGuarded(type, pts, e) {
    if (!isLive) { notify("Session is offline — tap OFFLINE to go live","warn"); return; }
    if (!selId) { notify("Select a participant first","warn"); return; }
    award(selId, type, pts, e?.clientX, e?.clientY);
  }

  const sorted = [...ses.participants].sort((a,b)=>b.total-a.total);
  const selP = ses.participants.find(x=>x.id===selId);
  const gs = ses.groups.map(g=>({...g,total:ses.participants.filter(p=>p.gid===g.id).reduce((s,p)=>s+p.total,0),members:ses.participants.filter(p=>p.gid===g.id)})).sort((a,b)=>b.total-a.total);

  if (proj) return <Projector session={ses} onBack={()=>setProj(false)}/>;

  const IB = {background:"none",border:`1px solid ${BORDER}`,borderRadius:9,width:34,height:34,cursor:"pointer",color:SUB,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0};

  return (
    <div style={{height:"100vh",background:BG,fontFamily:"Poppins,sans-serif",display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto",overflow:"hidden"}}>
      <Confetti active={confetti}/>
      {anims.map(a => <FloatAnim key={a.id} {...a} onDone={()=>setAnims(p=>p.filter(x=>x.id!==a.id))}/>)}
      {toast && (
        <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",
          background:toast.type==="warn"?"#FFF3CD":TEXT,
          color:toast.type==="warn"?"#92400E":"#fff",
          padding:"10px 22px",borderRadius:12,fontSize:13,fontWeight:600,zIndex:9997,
          fontFamily:"Poppins,sans-serif",boxShadow:"0 8px 32px rgba(0,0,0,.22)",
          whiteSpace:"nowrap",animation:"slideUp .2s ease",
          border:toast.type==="warn"?`1px solid #F59E0B`:"none"}}>
          {toast.type==="warn" ? "⚠️ " : ""}{toast.m}
        </div>
      )}
      {picker && <Picker participants={sorted} groups={ses.groups} selId={selId} onSelect={setSelId} onClose={()=>setPicker(false)}/>}
      {manage && <Manage session={ses} onUpdate={fn=>mut(fn)} onClose={()=>setManage(false)} onExport={()=>{}} onReset={()=>{}} onRename={renameSession} onToggleLive={toggleLive}/>}
      {showCoinCustomizer && <CoinCustomizer session={ses}
        onSave={cfg=>mut(s=>{s.quickCoins=cfg.quickCoins;s.otherCoins=cfg.otherCoins;})}
        onClose={()=>setShowCoinCustomizer(false)}/>}

      {/* Go Offline confirm dialog */}
      {confirmOffline && (
        <div style={{position:"fixed",inset:0,zIndex:800,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(4px)",background:"rgba(26,10,20,.35)"}}>
          <div style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"24px 24px 36px",width:"100%",maxWidth:480,animation:"slideUp .2s ease"}}>
            <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 18px"}}/>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:18,color:TEXT,marginBottom:6}}>Go Offline?</div>
            <div style={{fontSize:14,color:SUB,lineHeight:1.7,marginBottom:20}}>
              Participants won't be able to join or earn coins.<br/>
              All data is saved — you can go live again anytime.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={goOffline}
                style={{width:"100%",padding:"13px 0",background:"#1A0A14",border:"none",borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer"}}>
                Go Offline
              </button>
              <button onClick={()=>setConfirmOffline(false)}
                style={{width:"100%",padding:"13px 0",background:"none",border:`1px solid ${BORDER}`,borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:14,color:SUB,cursor:"pointer"}}>
                Stay Live
              </button>
            </div>
          </div>
        </div>
      )}
      {showSettings && <SessionSettings session={ses}
        onRename={renameSession}
        onToggleLive={toggleLive}
        onDuplicate={()=>{
          const code=genCode();
          const dup={...JSON.parse(JSON.stringify(ses)),code,name:`${ses.name} (Copy)`,
            participants:[],log:[],boardVisible:false,live:true};
          ssSession(code, dup);
          notify("Session duplicated with coin settings");
          setShowSettings(false);
        }}
        onArchive={()=>{
          if(!window.confirm("Archive this session? It will become read-only. This cannot be undone.")) return;
          mut(s=>{s.live=false;s.archived=true;});
          notify("Session archived");
          setShowSettings(false);
          // Return to home after a moment
          setTimeout(()=>onBack(), 1200);
        }}
        onExport={()=>{
          const rows=[["#","Name","Group","Total"]];
          [...ses.participants].sort((a,b)=>b.total-a.total).forEach(p=>{const g=ses.groups.find(g=>g.id===p.gid);rows.push([pNum(p.num),p.name,g?.name||"",p.total]);});
          const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(rows.map(r=>r.join(",")).join("\n"));a.download=`teticoin-${ses.code}.csv`;a.click();notify("CSV exported");
        }}
        onReset={()=>{if(!window.confirm("Reset all coins?"))return;mut(s=>{s.participants=s.participants.map(p=>({...p,total:0,bk:{},hist:[]}));s.log=[];});notify("Reset done");setShowSettings(false);}}
        onClose={()=>setShowSettings(false)}
      />}
      {mass && <MassGive participants={ses.participants} groups={ses.groups} onAward={award} onClose={()=>setMass(false)}/>}
      {showQR && <QRSheet session={ses} onClose={()=>setShowQR(false)}/>}
      {showLeader && <LeaderSheet session={ses} onToggleBoard={()=>mut(s=>{s.boardVisible=!s.boardVisible;notify(s.boardVisible?"Board shown to participants":"Board hidden");})} onClose={()=>setShowLeader(false)}/>}

      {/* ── TOP BAR ── */}
      <div style={{background: isLive?"#fff":"#F9F4F4", borderBottom:`1px solid ${BORDER}`,padding:"0 12px",display:"flex",alignItems:"center",gap:8,height:56,flexShrink:0, transition:"background .3s"}}>
        {/* Back — chevron in circle */}
        <button onClick={onBack} style={{background:"none",border:`1.5px solid ${BORDER}`,borderRadius:"50%",width:32,height:32,cursor:"pointer",color:SUB,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:0}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        {/* Title — vertically centered */}
        <div style={{flex:1,overflow:"hidden",minWidth:0,display:"flex",alignItems:"center"}}>
          {editingTitle ? (
            <div style={{display:"flex",alignItems:"center",gap:6,width:"100%"}}>
              <input value={titleVal} onChange={e=>setTitleVal(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"){renameSession(titleVal);setEditingTitle(false);}if(e.key==="Escape")setEditingTitle(false);}}
                autoFocus onBlur={()=>{renameSession(titleVal);setEditingTitle(false);}}
                style={{flex:1,background:SOFT,border:`1.5px solid ${PINK}`,borderRadius:8,padding:"4px 10px",fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:TEXT,outline:"none",minWidth:0}}/>
            </div>
          ) : (
            <button onClick={()=>{setTitleVal(ses.name);setEditingTitle(true);}}
              style={{background:"none",border:"none",cursor:"text",padding:0,textAlign:"left",width:"100%",display:"flex",alignItems:"center"}}>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:15,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:1}}>{ses.name}</div>
            </button>
          )}
        </div>

        {/* LIVE / OFFLINE — clickable toggle */}
        <button onClick={toggleLive}
          style={{display:"flex",alignItems:"center",gap:5,
            background:isLive?SOFT:"#FEF2F2",
            border:`1px solid ${isLive?MID:"#EF444455"}`,
            borderRadius:20,padding:"5px 10px",flexShrink:0,cursor:"pointer",transition:"all .2s"}}>
          <div style={{width:7,height:7,borderRadius:"50%",
            background:isLive?GREEN:"#EF4444",
            
            animation:isLive?"pulse 2s infinite":"none"}}/>
          <span style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:11,
            color:isLive?PINK:"#EF4444",letterSpacing:.5}}>
            {isLive?"LIVE":"OFFLINE"}
          </span>
        </button>

        {/* Leaderboard icon — green when board is visible to participants */}
        <button onClick={()=>setShowLeader(true)}
          style={{...IB, background:ses.boardVisible?`${GREEN}18`:"none", border:`1.5px solid ${ses.boardVisible?GREEN:BORDER}`, color:ses.boardVisible?GREEN:SUB}}
          title="Leaderboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </button>

        {/* Participants / Manage icon */}
        <button onClick={()=>setManage(true)} style={IB} title="Participants & Groups">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </button>

        {/* QR share icon */}
        <button onClick={()=>setShowQR(true)} style={IB} title="Share QR">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3" rx=".5"/><rect x="19" y="14" width="2" height="2" rx=".5"/><rect x="14" y="19" width="2" height="2" rx=".5"/><rect x="18" y="19" width="3" height="2" rx=".5"/></svg>
        </button>

        {/* Gear — last */}
        <button onClick={()=>setShowSettings(true)} style={IB} title="Session settings">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>

      {/* ── TABS ── */}
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,display:"flex",alignItems:"center",flexShrink:0}}>
        {[["award","Award"],["board","Board"],["groups","Groups"],["log","Log"]].map(([id,l]) => (
          <button key={id} onClick={()=>isLive&&setTab(id)}
            style={{padding:"11px 16px",border:"none",background:"none",fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:13,
              color:!isLive?`${SUB}55`:tab===id?PINK:SUB,
              cursor:isLive?"pointer":"default",flexShrink:0,
              borderBottom:tab===id&&isLive?`2.5px solid ${PINK}`:"2.5px solid transparent",
              transition:"all .12s"}}>{l}
          </button>
        ))}
        {/* Live participant count — right end of tab bar */}
        <div style={{marginLeft:"auto",paddingRight:14,display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:12,color:SUB}}>{ses.participants.length}</span>
        </div>
      </div>

      {/* Content area — offline overlay covers everything below tabs */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>

        {/* ── OFFLINE OVERLAY — covers all tabs, blocks all interaction ── */}
        {!isLive && (
          <div style={{position:"absolute",inset:0,zIndex:20,
            background:"rgba(255,255,255,0.82)",
            backdropFilter:"blur(2px)",
            display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"flex-start",
            paddingTop:"18%"}}>
            <div style={{background:"#fff",border:`1.5px solid #EF444428`,borderRadius:20,
              padding:"28px 32px",textAlign:"center",width:"80%",maxWidth:300}}>
              <div style={{width:52,height:52,borderRadius:16,background:"#FEF2F2",
                border:`1.5px solid #EF444430`,display:"flex",alignItems:"center",
                justifyContent:"center",margin:"0 auto 14px"}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round">
                  <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              </div>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:18,color:"#EF4444",marginBottom:6}}>
                Session Offline
              </div>
              <div style={{fontSize:13,color:SUB,marginBottom:20,lineHeight:1.6}}>
                Participants cannot join or earn coins.<br/>Go live to reactivate.
              </div>
              <button onClick={toggleLive}
                style={{width:"100%",padding:"12px 0",background:"#EF4444",border:"none",
                  borderRadius:12,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,
                  color:"#fff",cursor:"pointer"}}>
                Go Live
              </button>
            </div>
          </div>
        )}

      {/* ══ AWARD TAB ══ */}
      {tab==="award" && (
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Fixed participant selector bar */}
          <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"10px 14px",flexShrink:0}}>
            <button onClick={()=>isLive&&setPicker(true)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,background:selP?SOFT:BG,border:`1.5px solid ${selP?PINK:BORDER}`,borderRadius:13,padding:"10px 14px",cursor:isLive?"pointer":"default",textAlign:"left",transition:"all .12s"}}>
              {selP ? (
                <>
                  <Av s={selP.av} color={ses.groups.find(g=>g.id===selP.gid)?.color||PINK} size={36}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:11,color:SUB}}>{pNum(selP.num)}</span>
                      <span style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:15,color:TEXT}}>{selP.name}</span>
                    </div>
                    <div style={{fontSize:11,color:PINK,fontWeight:700,marginTop:1}}>{selP.total} coins total</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
                    <span style={{fontFamily:"Poppins,sans-serif",fontSize:11,fontWeight:500,color:SUB}}>Change participant</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </>
              ) : (
                <>
                  <div style={{width:36,height:36,borderRadius:8,background:BG,border:`1.5px dashed ${BORDER}`,display:"flex",alignItems:"center",justifyContent:"center",color:SUB,fontSize:20,flexShrink:0}}>+</div>
                  <div style={{flex:1,fontSize:13,color:SUB,fontWeight:500}}>Tap to select participant</div>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </>
              )}
            </button>
          </div>

          {/* Scrollable award content — always visible */}
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10,position:"relative"}}>

            {/* GIVE COINS + QUICK COINS — Give Coins on top */}
            <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"14px"}}>

              {/* Give Coins header + three dots */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <SL style={{marginBottom:0}}>Give Coins</SL>
                <button onClick={()=>setShowCoinCustomizer(true)}
                  style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,width:28,height:28,cursor:"pointer",color:SUB,display:"flex",alignItems:"center",justifyContent:"center",gap:2,flexShrink:0}}
                  title="Customise coins">
                  <span style={{width:3,height:3,borderRadius:"50%",background:SUB,display:"inline-block"}}/>
                  <span style={{width:3,height:3,borderRadius:"50%",background:SUB,display:"inline-block"}}/>
                  <span style={{width:3,height:3,borderRadius:"50%",background:SUB,display:"inline-block"}}/>
                </button>
              </div>

              {/* Give Coins — bold pink circles */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
                {(ses.otherCoins||TV_DEFAULT).map((v,i) => {
                  const neg = v < 0;
                  const bg   = neg ? "#FFF1F1" : "#ffffff";
                  const bord = neg ? "#FFBBBB" : "#E91E8C";
                  const col  = neg ? "#DC2626" : "#E91E8C";
                  return (
                    <InlineCoinBtn key={i} value={v}
                      bg={bg} border={bord} col={col}
                      circle={true}
                      disabled={!selP}
                      onAward={e=>awardGuarded("token",v,e)}
                      onEdit={newVal=>{
                        const n=parseInt(newVal);
                        if(!isNaN(n)) mut(s=>{if(!s.otherCoins)s.otherCoins=[...TV_DEFAULT];s.otherCoins[i]=n;});
                      }}/>
                  );
                })}
              </div>

              {/* Quick Coins — pill shape */}
              <SL>Quick Coins</SL>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
                {ACTS.map((a,i) => {
                  const pts = (ses.quickCoins||ACTS_DEFAULT.map(x=>x.pts))[i] ?? a.pts;
                  const palettes = [
                    {bg:"#FAF5FF",border:"#DDB6FF",num:"#7C3AED",fill:"#7C3AED"},
                    {bg:"#EEF4FF",border:"#C7D9FF",num:"#4F7CF6",fill:"#4F7CF6"},
                    {bg:"#EDFAF5",border:"#B3EDDA",num:"#1DB87A",fill:"#1DB87A"},
                  ];
                  const pal = palettes[i];
                  return (
                    <QuickCoinBtn key={a.id} pts={pts} label={a.label} pal={pal}
                      onAward={e=>awardGuarded(a.id,pts,e)}/>
                  );
                })}
              </div>

              <div style={{display:"flex",gap:8}}>
                <input type="number" placeholder="Custom amount" value={cAmt} onChange={e=>setCAmt(e.target.value)}
                  style={{flex:1,background:BG,border:`1.5px solid ${BORDER}`,borderRadius:12,padding:"10px 12px",fontFamily:"Poppins,sans-serif",fontSize:13,color:TEXT,outline:"none"}}/>
                <button onClick={e=>{if(!cAmt||isNaN(cAmt))return;awardGuarded("token",Number(cAmt),e);setCAmt("");}}
                  style={{padding:"0 14px",background:GRAD,border:"none",borderRadius:12,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>
                  Award
                </button>
              </div>
            </div>

            {/* Mass Give button */}
            <button onClick={()=>setMass(true)} style={{width:"100%",padding:"14px 0",background:`linear-gradient(135deg,${PURPLE},#A855F7)`,border:"none",borderRadius:14,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Mass Give Coins
            </button>

            {/* Award to all quick row */}
            {ses.participants.length > 0 && (
              <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"14px"}}>
                <SL>Award to Everyone</SL>
                {sorted.map(p => (
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:`1px solid ${BORDER}`}}>
                    <span style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:11,color:SUB,minWidth:32}}>{pNum(p.num)}</span>
                    <Av s={p.av} color={ses.groups.find(g=>g.id===p.gid)?.color||PINK} size={26}/>
                    <div style={{flex:1,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:TEXT}}>{p.name}</div>
                    <div style={{display:"flex",gap:3,flexShrink:0}}>
                      {ACTS.map(a => (
                        <button key={a.id} title={`+${a.pts}`} onClick={e=>award(p.id,a.id,a.pts,e.clientX,e.clientY)}
                          style={{width:28,height:28,borderRadius:7,border:`1.5px solid ${a.col}28`,background:`${a.col}08`,cursor:"pointer",fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:11,color:a.col,transition:"all .1s"}}
                          onMouseOver={e=>e.currentTarget.style.transform="scale(1.12)"}
                          onMouseOut={e=>e.currentTarget.style.transform="scale(1)"}>
                          +{a.pts}
                        </button>
                      ))}
                      <button onClick={e=>award(p.id,"token",50,e.clientX,e.clientY)} style={{padding:"0 7px",height:28,borderRadius:7,border:`1.5px solid ${YELLOW}28`,background:`${YELLOW}08`,color:YELLOW,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:11,cursor:"pointer"}}>+50</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ BOARD TAB ══ */}
      {tab==="board" && (
        <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
          {/* Board status banner — tap to open leaderboard sheet where toggle lives */}
          <div onClick={()=>setShowLeader(true)}
            style={{background:ses.boardVisible?`${GREEN}12`:`${PINK}08`,border:`1.5px solid ${ses.boardVisible?GREEN:BORDER}`,borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
            <div>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:ses.boardVisible?GREEN:TEXT}}>
                {ses.boardVisible?"Board is live on participant devices":"Board is hidden from participants"}
              </div>
              <div style={{fontSize:12,color:SUB,marginTop:2,fontWeight:500}}>Tap to manage visibility</div>
            </div>
            <div style={{width:8,height:8,borderRadius:"50%",background:ses.boardVisible?GREEN:BORDER,flexShrink:0,marginLeft:8}}/>
          </div>
          <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,overflow:"hidden"}}>
            {sorted.length===0 && <div style={{padding:48,textAlign:"center"}}><Ham size={70}/><div style={{marginTop:12,fontSize:13,color:SUB}}>No participants yet</div></div>}
            {sorted.map((p,i) => {
              const grp = ses.groups.find(g=>g.id===p.gid); const maxP = sorted[0]?.total||1;
              return (
                <div key={p.id} onClick={()=>{setSelId(p.id);setTab("award");}} style={{padding:"12px 14px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",background:i===0?SOFT:"#fff",transition:".1s"}} onMouseOver={e=>e.currentTarget.style.background=SOFT} onMouseOut={e=>e.currentTarget.style.background=i===0?SOFT:"#fff"}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:15,color:rankColor(i),minWidth:20,textAlign:"center"}}>{i+1}</div>
                    <span style={{fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:11,color:SUB,minWidth:30}}>{pNum(p.num)}</span>
                    <Av s={p.av} color={grp?.color||PINK} size={34}/>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:TEXT}}>{p.name}</div>
                      {grp && <span style={{fontSize:10,background:`${grp.color}18`,border:`1px solid ${grp.color}30`,color:grp.color,padding:"1px 7px",borderRadius:99,fontWeight:700}}>{grp.name}</span>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:22,color:i===0?PINK:TEXT}}>{p.total}</div>
                      <div style={{fontSize:10,color:SUB}}>coins</div>
                    </div>
                  </div>
                  <div style={{marginTop:8,height:4,background:BORDER,borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:4,background:GRAD,width:`${(p.total/maxP)*100}%`,borderRadius:4,transition:"width .5s ease"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ GROUPS TAB ══ */}
      {tab==="groups" && (
        <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
          {gs.length===0 && <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:32,textAlign:"center",fontSize:13,color:SUB}}>Create groups via the people icon in the top bar</div>}
          {gs.map((g,i) => (
            <div key={g.id} style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:14,color:rankColor(i),minWidth:18}}>{i+1}</div>
                  <div style={{width:11,height:11,borderRadius:3,background:g.color,flexShrink:0}}/>
                  <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:16,color:g.color}}>{g.name}</div>
                  <div style={{fontSize:11,color:SUB}}>{g.members.length} members</div>
                </div>
                <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:22,color:g.color}}>{g.total}</div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                {g.members.map(m=><span key={m.id} style={{fontSize:11,background:`${g.color}12`,border:`1px solid ${g.color}28`,color:g.color,padding:"2px 9px",borderRadius:99,fontWeight:700}}>{pNum(m.num)} {m.name}</span>)}
              </div>
              <div style={{height:4,background:BORDER,borderRadius:4,overflow:"hidden"}}>
                <div style={{height:4,background:g.color,width:`${(g.total/(gs[0]?.total||1))*100}%`,borderRadius:4,transition:"width .6s ease"}}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ LOG TAB ══ */}
      {tab==="log" && (
        <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
          <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,overflow:"hidden"}}>
            <div style={{padding:"10px 14px",borderBottom:`1px solid ${BORDER}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <SL>Activity Log</SL>
              <span style={{fontSize:11,color:SUB,fontWeight:600}}>{ses.log.length} events</span>
            </div>
            {ses.log.length===0 && <div style={{padding:40,textAlign:"center"}}><Ham size={56}/><div style={{marginTop:10,fontSize:13,color:SUB}}>No activity yet</div></div>}
            {ses.log.map(item => {
              const a = ACTS.find(x=>x.id===item.type);
              const col = item.type==="token" ? YELLOW : a?.col;
              return (
                <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderBottom:`1px solid ${BORDER}`}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:col,flexShrink:0}}/>
                  <div style={{flex:1,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:14,color:TEXT}}>{item.name}</div>
                  <div style={{fontSize:12,color:SUB,fontWeight:500}}>{item.type==="token"?"Token":a?.label}</div>
                  <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:14,color:col}}>+{item.pts}</div>
                  <div style={{fontSize:11,color:SUB}}>{item.t}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
// ── Create modal ──
function CreateModal({ onConfirm, onClose }) {
  const [n, setN] = useState("");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,10,20,.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:600,backdropFilter:"blur(4px)"}}>
      <div style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"28px 24px",width:"100%",maxWidth:480,animation:"slideUp .25s ease"}}>
        <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 20px"}}/>
        <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:4}}>New Session</div>
        <div style={{fontSize:13,color:SUB,marginBottom:16}}>Give your session a name so you can find it later.</div>
        <Inp placeholder="e.g. Design Thinking Workshop" value={n} onChange={e=>setN(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&n.trim()&&onConfirm(n.trim())} style={{marginBottom:14}}/>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"13px 0",background:BG,border:`1.5px solid ${BORDER}`,borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:SUB,cursor:"pointer"}}>Cancel</button>
          <PBtn onClick={()=>n.trim()&&onConfirm(n.trim())} disabled={!n.trim()} style={{flex:2,padding:"13px 22px"}}>Start Session</PBtn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PLAN CONSTANTS
// ─────────────────────────────────────────────
const PLANS = {
  free:  { name:"Free",  price:0,    year:0,    color:SUB,   sessions:3,  participants:30  },
  pro:   { name:"Pro",   price:4.99, year:39,   color:PINK,  sessions:999,participants:999 },
  team:  { name:"Team",  price:14.99,year:119,  color:PURPLE,sessions:999,participants:999 },
};

// ── 1. Pricing Page ──────────────────────────
function PricingPage({ currentPlan="free", onSelect, onClose }) {
  const [billing, setBilling] = useState("monthly"); // monthly | yearly

  const tiers = [
    {
      id:"free", name:"Free", monthly:0, yearly:0,
      color:SUB, borderColor:BORDER, bg:"#fff",
      tagline:"Get started",
      features:[
        "3 sessions",
        "30 participants/session",
        "1 group per session",
        "Basic coin types",
        "Teticoin branding shown",
        "30-day session history",
      ],
      limits:["No custom coin labels","No session templates","No branding removal"],
    },
    {
      id:"pro", name:"Pro", monthly:4.99, yearly:39,
      color:PINK, borderColor:PINK, bg:SOFT,
      tagline:"Most popular",
      badge:"⭐ Popular",
      features:[
        "Unlimited sessions",
        "Unlimited participants",
        "Up to 10 groups",
        "Custom coin labels",
        "Remove Teticoin branding ✦",
        "Session templates",
        "Full session history",
        "Priority support",
      ],
    },
    {
      id:"team", name:"Team", monthly:14.99, yearly:119,
      color:PURPLE, borderColor:PURPLE, bg:"#FAF5FF",
      tagline:"For organisations",
      features:[
        "Everything in Pro",
        "5 host accounts",
        "Shared session library",
        "Admin dashboard",
        "Bulk participant import (CSV)",
        "Custom subdomain",
      ],
    },
  ];

  const price = (t) => billing==="yearly"
    ? (t.yearly/12).toFixed(2)
    : t.monthly.toFixed(2);

  return (
    <div style={{position:"fixed",inset:0,zIndex:700,background:BG,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto",overflowY:"auto"}}>
      <style>{CSS}</style>
      {/* Header */}
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Upgrade Plan</div>
        <button onClick={onClose} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:SUB,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>

      <div style={{padding:"20px 20px 40px"}}>
        {/* Value prop — tighter line height */}
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:22,color:TEXT,lineHeight:1.25,marginBottom:8}}>
            Reward behaviour,<br/>not just answers.
          </div>
          <div style={{fontSize:13,color:SUB,lineHeight:1.6}}>
            Kahoot scores quizzes. Teticoin rewards humans.
          </div>
        </div>

        {/* Billing toggle — clear active with solid fill */}
        <div style={{display:"flex",background:BG,border:`1.5px solid ${BORDER}`,borderRadius:12,padding:3,marginBottom:20,gap:3}}>
          {[["monthly","Monthly",null],["yearly","Yearly","SAVE 35%"]].map(([b,label,badge]) => (
            <button key={b} onClick={()=>setBilling(b)}
              style={{flex:1,padding:"10px 0",borderRadius:9,border:"none",
                background:billing===b?GRAD:"transparent",
                fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:13,
                color:billing===b?"#fff":SUB,
                cursor:"pointer",transition:"all .15s",position:"relative",
                display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              {label}
              {badge && <span style={{background:billing==="yearly"?"rgba(255,255,255,.25)":GREEN,color:"#fff",fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:99,lineHeight:1.4}}>{badge}</span>}
            </button>
          ))}
        </div>

        {/* Plan cards */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {tiers.map(t => {
            const isCurrent = currentPlan === t.id;
            const monthly = parseFloat(price(t));
            return (
              <div key={t.id} style={{background:t.bg,border:`2px solid ${isCurrent?t.color:t.borderColor}`,borderRadius:16,padding:"18px 20px",position:"relative",transition:"all .15s"}}>
                {t.badge && <div style={{position:"absolute",top:-10,left:20,background:GRAD,color:"#fff",fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:99}}>{t.badge}</div>}
                {isCurrent && <div style={{position:"absolute",top:-10,right:20,background:t.color,color:"#fff",fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:99}}>Current Plan</div>}

                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                  <div>
                    <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,color:t.color}}>{t.name}</div>
                    <div style={{fontSize:12,color:SUB,fontWeight:500,marginTop:2}}>{t.tagline}</div>
                  </div>
                  {/* Price + billing toggle inline */}
                  <div style={{textAlign:"right"}}>
                    {monthly === 0 ? (
                      <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:26,color:SUB}}>Free</div>
                    ) : (
                      <>
                        <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:26,color:t.color,lineHeight:1}}>
                          ${monthly}<span style={{fontSize:12,fontWeight:700,color:SUB}}>/mo</span>
                        </div>
                        {/* Mini billing toggle per card */}
                        <div style={{display:"flex",gap:4,marginTop:6,justifyContent:"flex-end"}}>
                          {[["monthly","Mo"],["yearly","Yr"]].map(([b,lbl])=>(
                            <button key={b} onClick={()=>setBilling(b)}
                              style={{padding:"3px 9px",borderRadius:99,border:`1.5px solid ${billing===b?t.color:BORDER}`,
                                background:billing===b?t.color:"transparent",
                                fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:10,
                                color:billing===b?"#fff":SUB,cursor:"pointer",transition:"all .12s"}}>
                              {lbl}{b==="yearly"?" ·35%off":""}
                            </button>
                          ))}
                        </div>
                        {billing==="yearly" && <div style={{fontSize:10,color:SUB,marginTop:3}}>billed ${t.yearly}/yr</div>}
                      </>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
                  {t.features.map((f,i) => (
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8}}>
                      <div style={{width:16,height:16,borderRadius:"50%",background:`${t.color}18`,border:`1.5px solid ${t.color}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke={t.color} strokeWidth="2" strokeLinecap="round"/></svg>
                      </div>
                      <div style={{fontSize:13,color:TEXT,fontWeight:500,lineHeight:1.4}}>{f}</div>
                    </div>
                  ))}
                  {t.limits?.map((f,i) => (
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,opacity:.5}}>
                      <div style={{width:16,height:16,borderRadius:"50%",background:"#f1f1f1",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><line x1="2" y1="10" x2="10" y2="2" stroke={SUB} strokeWidth="2" strokeLinecap="round"/></svg>
                      </div>
                      <div style={{fontSize:13,color:SUB,fontWeight:500,lineHeight:1.4}}>{f}</div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {isCurrent ? (
                  <div style={{textAlign:"center",padding:"10px 0",fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:13,color:t.color,background:`${t.color}10`,borderRadius:10}}>
                    ✓ Your current plan
                  </div>
                ) : t.id==="free" ? (
                  <button onClick={()=>onSelect(t.id,"monthly")} style={{width:"100%",padding:"11px 0",background:"none",border:`1.5px solid ${BORDER}`,borderRadius:10,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:13,color:SUB,cursor:"pointer"}}>
                    Downgrade to Free
                  </button>
                ) : (
                  <button onClick={()=>{
                    // Chip payment gateway — redirect to Chip checkout
                    // Replace CHIP_PAYMENT_LINK_PRO / CHIP_PAYMENT_LINK_TEAM with your actual Chip payment page URLs
                    const links = {
                      pro: {
                        monthly: "https://gate.chip-in.asia/p/teticoin-pro-monthly",
                        yearly:  "https://gate.chip-in.asia/p/teticoin-pro-yearly",
                      },
                      team: {
                        monthly: "https://gate.chip-in.asia/p/teticoin-team-monthly",
                        yearly:  "https://gate.chip-in.asia/p/teticoin-team-yearly",
                      },
                    };
                    const url = links[t.id]?.[billing];
                    if (url) {
                      window.open(url, "_blank");
                    } else {
                      // Fallback: local plan selection (dev mode)
                      onSelect(t.id, billing);
                    }
                  }}
                    style={{width:"100%",padding:"13px 0",background:t.id==="pro"?GRAD:`linear-gradient(135deg,${PURPLE},#A855F7)`,border:"none",borderRadius:10,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:"#fff",cursor:"pointer"}}>
                    Get {t.name} {billing==="yearly"?"· Save 35%":""}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div style={{marginTop:20,textAlign:"center",fontSize:12,color:SUB,lineHeight:1.8}}>
          Cancel anytime · No hidden fees<br/>
          Secure payment via <span style={{color:PINK,fontWeight:600}}>Chip</span> · Malaysian Ringgit (MYR)<br/>
          <span style={{color:PINK,fontWeight:600}}>✦ Most popular feature among paid users</span>
        </div>
      </div>
    </div>
  );
}

// ── 2. Upgrade Banner (home screen) ──────────
function UpgradeBanner({ sessionCount, onUpgrade }) {
  const nearLimit = sessionCount >= 2;
  const atLimit   = sessionCount >= 3;
  if (!nearLimit) return null;
  return (
    <div onClick={onUpgrade}
      style={{background:"#EFF6FF",border:`1.5px solid #93C5FD`,borderRadius:14,padding:"12px 14px",marginBottom:12,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:32,height:32,borderRadius:9,background:"#DBEAFE",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:13,color:"#1E3A8A"}}>
          {atLimit?"Session limit reached":"You're using 2 of 3 free sessions"}
        </div>
        <div style={{fontSize:11,color:"#2563EB",marginTop:1,fontWeight:500}}>
          {atLimit?"Upgrade to Pro — unlimited from $4.99/mo":"Upgrade to Pro for unlimited sessions"}
        </div>
      </div>
      <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:11,color:"#fff",flexShrink:0,background:"#2563EB",borderRadius:8,padding:"4px 9px",whiteSpace:"nowrap"}}>Upgrade →</div>
    </div>
  );
}

// ── 3. Limit Hit Modal ───────────────────────
function LimitModal({ type, onUpgrade, onClose }) {
  const configs = {
    sessions: {
      icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
      title:"Session limit reached",
      body:"Free plan allows 3 sessions. Upgrade to Pro for unlimited sessions, participants, and more.",
      cta:"Unlock Unlimited Sessions",
    },
    participants: {
      icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      title:"Participant limit reached",
      body:"Free plan allows 30 participants per session. Upgrade to Pro for unlimited participants.",
      cta:"Unlock Unlimited Participants",
    },
    branding: {
      icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
      title:"Pro feature",
      body:"Remove Teticoin branding from the participant screen. Available on Pro and Team plans.",
      cta:"Upgrade to Remove Branding",
    },
  };
  const cfg = configs[type] || configs.sessions;
  return (
    <div style={{position:"fixed",inset:0,zIndex:800,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(4px)",background:"rgba(26,10,20,.4)"}}>
      <div style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"28px 24px 36px",width:"100%",maxWidth:480,animation:"slideUp .25s ease"}}>
        <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 20px"}}/>
        {/* Icon */}
        <div style={{width:64,height:64,borderRadius:20,background:SOFT,border:`1.5px solid ${MID}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          {cfg.icon}
        </div>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:8}}>{cfg.title}</div>
          <div style={{fontSize:14,color:SUB,lineHeight:1.7}}>{cfg.body}</div>
        </div>
        {/* Mini plan comparison */}
        <div style={{background:SOFT,border:`1px solid ${MID}`,borderRadius:14,padding:"14px 16px",marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:12,color:SUB}}>Feature</div>
            <div style={{display:"flex",gap:24}}>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:12,color:SUB,minWidth:40,textAlign:"center"}}>Free</div>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:12,color:PINK,minWidth:40,textAlign:"center"}}>Pro</div>
            </div>
          </div>
          {[
            ["Sessions","3","∞"],
            ["Participants","30","∞"],
            ["Custom labels","✗","✓"],
            ["Remove branding","✗","✓"],
            ["Templates","✗","✓"],
          ].map(([f,free,pro]) => (
            <div key={f} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderTop:`1px solid ${BORDER}`}}>
              <div style={{fontSize:13,color:TEXT,fontWeight:500}}>{f}</div>
              <div style={{display:"flex",gap:24}}>
                <div style={{fontSize:13,color:free==="✓"?GREEN:free==="✗"?"#EF4444":SUB,fontWeight:700,minWidth:40,textAlign:"center"}}>{free}</div>
                <div style={{fontSize:13,color:pro==="✓"?GREEN:PINK,fontWeight:700,minWidth:40,textAlign:"center"}}>{pro}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onUpgrade} style={{width:"100%",padding:"14px 0",background:GRAD,border:"none",borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",marginBottom:10}}>
          {cfg.cta} · from $4.99/mo
        </button>
        <button onClick={onClose} style={{width:"100%",padding:"11px 0",background:"none",border:`1px solid ${BORDER}`,borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:14,color:SUB,cursor:"pointer"}}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

// ── 4. Billing Page ──────────────────────────
function BillingPage({ plan="free", onUpgrade, onClose }) {
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const planData = {
    free:  {name:"Free",  price:"$0",    renewal:null,           color:SUB,   next:null},
    pro:   {name:"Pro",   price:"$4.99", renewal:"monthly",      color:PINK,  next:"Apr 19, 2026"},
    proY:  {name:"Pro",   price:"$39",   renewal:"yearly",       color:PINK,  next:"Mar 19, 2027"},
    team:  {name:"Team",  price:"$14.99",renewal:"monthly",      color:PURPLE,next:"Apr 19, 2026"},
  };
  const pd = planData[plan] || planData.free;
  const isFree = plan==="free";
  const invoices = plan!=="free" ? [
    {date:"Mar 19, 2026",amount:pd.price,status:"Paid"},
    {date:"Feb 19, 2026",amount:pd.price,status:"Paid"},
    {date:"Jan 19, 2026",amount:pd.price,status:"Paid"},
  ] : [];

  return (
    <div style={{position:"fixed",inset:0,zIndex:700,background:BG,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto"}}>
      <style>{CSS}</style>
      {/* Header */}
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:SUB,fontSize:22,padding:0,lineHeight:1}}>‹</button>
        <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:18,color:TEXT}}>Billing & Plan</div>
        <div style={{width:30}}/>
      </div>
      <div style={{overflowY:"auto",flex:1,padding:"20px 20px 40px"}}>

        {/* Current plan card */}
        <div style={{background:isFree?"#fff":pd.color===PINK?SOFT:"#FAF5FF",border:`2px solid ${pd.color}`,borderRadius:16,padding:"18px 20px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:22,color:pd.color}}>{pd.name}</div>
            <div style={{background:`${pd.color}18`,border:`1.5px solid ${pd.color}44`,borderRadius:99,padding:"3px 12px",fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:11,color:pd.color}}>Active</div>
          </div>
          <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:28,color:TEXT,marginBottom:4}}>{pd.price}{!isFree&&<span style={{fontSize:13,fontWeight:600,color:SUB}}>/{pd.renewal==="yearly"?"yr":"mo"}</span>}</div>
          {pd.next && <div style={{fontSize:12,color:SUB,fontWeight:500}}>Renews {pd.next} · Cancel anytime</div>}
          {isFree && <div style={{fontSize:12,color:SUB,fontWeight:500}}>3 sessions · 30 participants · Basic features</div>}
        </div>

        {/* Usage */}
        {isFree && (
          <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"16px",marginBottom:16}}>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:TEXT,marginBottom:12}}>Usage</div>
            {[
              {label:"Sessions",used:2,max:3,color:PINK},
              {label:"Participants (last session)",used:18,max:30,color:BLUE},
            ].map(u=>(
              <div key={u.label} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <div style={{fontSize:13,color:TEXT,fontWeight:500}}>{u.label}</div>
                  <div style={{fontSize:13,color:u.color,fontWeight:700}}>{u.used} / {u.max}</div>
                </div>
                <div style={{height:6,background:BORDER,borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:6,background:u.used/u.max>0.8?`linear-gradient(90deg,${u.color},#EF4444)`:u.color,width:`${(u.used/u.max)*100}%`,borderRadius:4,transition:"width .5s ease"}}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upgrade CTA for free */}
        {isFree && (
          <button onClick={onUpgrade}
            style={{width:"100%",padding:"14px 0",background:GRAD,border:"none",borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",marginBottom:16}}>
            Upgrade to Pro · $4.99/mo
          </button>
        )}

        {/* Invoice history */}
        {invoices.length > 0 && (
          <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,overflow:"hidden",marginBottom:16}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${BORDER}`,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:TEXT}}>Invoice History</div>
            {invoices.map((inv,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",padding:"12px 16px",borderBottom:i<invoices.length-1?`1px solid ${BORDER}`:"none"}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:14,color:TEXT}}>{inv.date}</div>
                  <div style={{fontSize:12,color:SUB,marginTop:1}}>{pd.name} Plan · {pd.renewal}</div>
                </div>
                <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:TEXT,marginRight:12}}>{inv.amount}</div>
                <div style={{background:`${GREEN}18`,border:`1px solid ${GREEN}40`,borderRadius:99,padding:"2px 10px",fontSize:11,fontWeight:700,color:GREEN}}>{inv.status}</div>
              </div>
            ))}
          </div>
        )}

        {/* Cancel / manage */}
        {!isFree && (
          cancelConfirm ? (
            <div style={{background:"#FEF2F2",border:"1.5px solid #EF444440",borderRadius:14,padding:"16px"}}>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:"#EF4444",marginBottom:6}}>Cancel subscription?</div>
              <div style={{fontSize:13,color:SUB,marginBottom:14,lineHeight:1.6}}>You'll keep Pro features until the end of your billing period. Data preserved for 90 days after.</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setCancelConfirm(false)} style={{flex:1,padding:"11px 0",background:"none",border:`1px solid ${BORDER}`,borderRadius:10,fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:13,color:SUB,cursor:"pointer"}}>Keep Plan</button>
                <button style={{flex:1,padding:"11px 0",background:"#EF4444",border:"none",borderRadius:10,fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>Yes, Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setCancelConfirm(true)}
              style={{width:"100%",padding:"12px 0",background:"none",border:`1px solid ${BORDER}`,borderRadius:13,fontFamily:"Nunito,sans-serif",fontWeight:600,fontSize:13,color:SUB,cursor:"pointer"}}>
              Cancel Subscription
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ── Root app ──
export default function App() {
  const [screen, setScreen] = useState("auth");
  const [trainer, setTrainer] = useState(null);
  const [sessions, setSessions] = useState(PAST);
  const [cur, setCur] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("free");
  const [showPricing, setShowPricing] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [limitModal, setLimitModal] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const isFree = plan === "free";
  const sessionLimit = isFree ? 3 : 999;

  // ── Handle /join/CODE URLs from QR scans ──
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/join\/([A-Z0-9]+)$/i);
    if (match) {
      const code = match[1].toUpperCase();
      sgSession(code).then(s => {
        if (s) {
          setCur(s);
          setScreen("participantJoin");
          setLoading(false);
        } else {
          setLoading(false);
        }
      }).catch(() => setLoading(false));
      return; // don't run auth check for join links
    }
    // Normal auth flow
    const { onAuthStateChanged } = require("firebase/auth") || {};
    // handled below
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.match(/^\/join\/[A-Z0-9]+$/i)) return; // skip for join URLs

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUid(user.uid);
        try {
          const s = await sg("sessions_index"); if (s) setSessions(s);
          const t = { name: user.displayName || user.email.split("@")[0], email: user.email, uid: user.uid };
          setTrainer(t);
          const p = await sg("plan"); if (p) setPlan(p);
          setScreen("home");
        } catch {}
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function handleAuth(t) { 
    setCurrentUid(t.uid);
    setTrainer(t); 
    await ss("trainer", t); 
    setScreen("home"); 
  }
  async function handleLogout() { 
    try { await signOut(auth); } catch {}
    await sd("trainer"); 
    setTrainer(null); 
    setCurrentUid(null);
    setScreen("auth"); 
  }
  async function handleNew(name) {
    if (isFree && sessions.length >= sessionLimit) { setLimitModal("sessions"); return; }
    const code = genCode();
    const s = {code, name, createdAt:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}), boardVisible:false, participants:[], groups:[], log:[]};
    await ssSession(code, s);
    const idx = [{code, name, date:s.createdAt, count:0}, ...sessions];
    setSessions(idx); await ss("sessions_index", idx);
    setCur(s); setCreating(false); setScreen("session");
  }
  async function handleOpen(code) {
    if (code==="DEMO") { setCur(JSON.parse(JSON.stringify(DEMO))); setScreen("session"); return; }
    const s = await sgSession(code); if (s) { setCur(s); setScreen("session"); }
  }
  async function handleSelectPlan(id, billing) {
    const newPlan = id==="pro" && billing==="yearly" ? "proY" : id;
    setPlan(newPlan); await ss("plan", newPlan);
    setShowPricing(false);
  }

  if (loading) return <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}><style>{CSS}</style><Ham size={60}/></div>;
  if (screen==="auth") return <><style>{CSS}</style><Auth onDone={handleAuth}/></>;
  // participantJoin = loaded from /join/CODE URL — always show participant view, never host view
  if (screen==="participantJoin" && cur) return <><style>{CSS}</style><ParticipantView session={cur}/></>;
  if (screen==="participant" && cur) return <><style>{CSS}</style><ParticipantView session={cur}/></>;
  if (screen==="session" && cur) return <><style>{CSS}</style><Session session={cur} onBack={()=>setScreen("home")} onPView={()=>setScreen("participant")}/></>;

  // Session settings from home list gear icon
  if (screen==="sessionSettings" && cur) return (
    <>
      <style>{CSS}</style>
      <div style={{minHeight:"100vh",background:BG}}>
        <SessionSettings session={cur}
          onRename={async(name)=>{ const s={...cur,name}; await ssSession(s.code, s); setCur(s); const idx=sessions.map(x=>x.code===s.code?{...x,name}:x); setSessions(idx); await ss("sessions_index",idx); }}
          onToggleLive={async()=>{ const s={...cur,live:cur.live===false?true:false}; await ssSession(s.code, s); setCur(s); }}
          onDuplicate={async()=>{ const code=genCode(); const dup={...JSON.parse(JSON.stringify(cur)),code,name:`${cur.name} (Copy)`,participants:[],log:[],boardVisible:false,live:true}; await ssSession(code, dup); const idx=[{code,name:dup.name,date:dup.createdAt,count:0},...sessions]; setSessions(idx); await ss("sessions_index",idx); setScreen("home"); }}
          onArchive={async()=>{ if(!window.confirm("Archive this session?")) return; const s={...cur,live:false,archived:true}; await ssSession(s.code, s); setCur(s); const idx=sessions.map(x=>x.code===s.code?{...x,archived:true}:x); setSessions(idx); await ss("sessions_index",idx); setScreen("home"); }}
          onExport={()=>{ const rows=[["#","Name","Group","Total"]]; [...(cur.participants||[])].sort((a,b)=>b.total-a.total).forEach(p=>{const g=(cur.groups||[]).find(g=>g.id===p.gid);rows.push([pNum(p.num),p.name,g?.name||"",p.total]);}); const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(rows.map(r=>r.join(",")).join("\n"));a.download=`teticoin-${cur.code}.csv`;a.click(); }}
          onReset={async()=>{ if(!window.confirm("Reset all coins?")) return; const s={...cur,participants:(cur.participants||[]).map(p=>({...p,total:0,bk:{},hist:[]})),log:[]}; await ssSession(s.code, s); setCur(s); }}
          onClose={()=>setScreen("home")}
        />
      </div>
    </>
  );

  const planLabel = plan==="free"?"Free Plan":plan.startsWith("pro")?"Pro Plan":"Team Plan";

  return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"Poppins,sans-serif"}}>
      <style>{CSS}</style>

      {showPricing && <PricingPage currentPlan={plan} onSelect={handleSelectPlan} onClose={()=>setShowPricing(false)}/>}
      {showBilling && <BillingPage plan={plan} onUpgrade={()=>{setShowBilling(false);setShowPricing(true);}} onClose={()=>setShowBilling(false)}/>}
      {limitModal && <LimitModal type={limitModal} onUpgrade={()=>{setLimitModal(null);setShowPricing(true);}} onClose={()=>setLimitModal(null)}/>}
      {creating && <CreateModal onConfirm={handleNew} onClose={()=>setCreating(false)}/>}

      {profileOpen && (
        <div style={{position:"fixed",inset:0,zIndex:300}} onClick={()=>setProfileOpen(false)}>
          <div style={{position:"absolute",top:72,right:20,background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:16,padding:"8px 0",minWidth:210,boxShadow:`0 8px 32px rgba(26,10,20,.15)`,animation:"slideUp .15s ease"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{padding:"10px 16px 12px",borderBottom:`1px solid ${BORDER}`}}>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:TEXT}}>{trainer?.name}</div>
              <div style={{fontSize:12,color:plan==="free"?SUB:PINK,marginTop:2,fontWeight:600}}>{planLabel}</div>
            </div>
            {[
              {icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label:"Profile", fn:()=>{}},
              {icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, label:"Billing & Plan", fn:()=>{setShowBilling(true);}},
              {icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>, label:"Settings", fn:()=>{}},
            ].map(item => (
              <button key={item.label} onClick={()=>{setProfileOpen(false);item.fn();}}
                style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 16px",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"Poppins,sans-serif",fontSize:13,fontWeight:600,color:TEXT}}
                onMouseOver={e=>e.currentTarget.style.background=SOFT}
                onMouseOut={e=>e.currentTarget.style.background="none"}>
                <span style={{color:SUB}}>{item.icon}</span>{item.label}
              </button>
            ))}
            <div style={{borderTop:`1px solid ${BORDER}`,marginTop:4,paddingTop:4}}>
              <button onClick={()=>{setProfileOpen(false);handleLogout();}}
                style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 16px",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"Poppins,sans-serif",fontSize:13,fontWeight:600,color:"#EF4444"}}
                onMouseOver={e=>e.currentTarget.style.background="#FEF2F2"}
                onMouseOut={e=>e.currentTarget.style.background="none"}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{maxWidth:480,margin:"0 auto",padding:"0 20px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 0 0",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Ham size={40}/>
            <div>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>Teticoin</div>
              <div style={{fontSize:10,color:SUB,fontWeight:500}}>by Tetikus</div>
            </div>
          </div>
          <button onClick={()=>setProfileOpen(v=>!v)}
            style={{display:"flex",alignItems:"center",gap:8,background:profileOpen?SOFT:"none",border:`1px solid ${profileOpen?PINK:BORDER}`,borderRadius:12,padding:"7px 12px 7px 8px",cursor:"pointer",transition:"all .15s"}}>
            <div style={{width:28,height:28,borderRadius:8,background:GRAD,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:12,color:"#fff",flexShrink:0}}>
              {(trainer?.name||"U").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}
            </div>
            <div style={{textAlign:"left"}}>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:12,color:TEXT,lineHeight:1.2}}>{trainer?.name}</div>
              <div style={{fontSize:10,color:plan==="free"?SUB:PINK,fontWeight:600}}>{planLabel}</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2.5" strokeLinecap="round" style={{transform:profileOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        <UpgradeBanner sessionCount={sessions.length} onUpgrade={()=>setShowPricing(true)}/>

        <PBtn full onClick={()=>{
          if (isFree && sessions.length >= sessionLimit) { setLimitModal("sessions"); return; }
          setCreating(true);
        }} style={{marginBottom:16}}>Create New Session</PBtn>

        <div style={{textAlign:"center",marginBottom:20}}>
          <button onClick={()=>handleOpen("DEMO")} style={{background:"none",border:"none",fontFamily:"Poppins,sans-serif",fontSize:13,color:SUB,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Load demo session</button>
        </div>

        {sessions.length > 0 && <>
          <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:1.2,marginBottom:8,fontFamily:"Poppins,sans-serif"}}>Recent Sessions</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {sessions.map(s => (
              <div key={s.code} style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,display:"flex",alignItems:"center",overflow:"hidden"}}>
                <button onClick={()=>handleOpen(s.code)} style={{flex:1,display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"none",border:"none",cursor:"pointer",textAlign:"left",transition:"background .12s"}}
                  onMouseOver={e=>e.currentTarget.style.background=SOFT}
                  onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                  {/* Code badge */}
                  <div style={{width:44,height:44,borderRadius:10,background:SOFT,border:`1.5px solid ${MID}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <div style={{fontFamily:"Poppins,sans-serif",fontWeight:500,fontSize:9,color:PINK,letterSpacing:.5}}>{s.code}</div>
                  </div>
                  <div style={{flex:1,textAlign:"left"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:1}}>
                      <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:s.archived?SUB:TEXT,lineHeight:1.2}}>{s.name}</div>
                      {s.archived && <span style={{fontSize:9,fontWeight:700,color:"#fff",background:SUB,borderRadius:99,padding:"2px 6px",flexShrink:0}}>ARCHIVED</span>}
                    </div>
                    <div style={{fontSize:11,color:SUB,fontWeight:400}}>{s.date} · {s.count} participants</div>
                  </div>
                </button>
                {/* Gear — opens SessionSettings for this session */}
                <button onClick={async ()=>{
                    const full = await sgSession(s.code);
                    if (full) { setCur(full); setScreen("sessionSettings"); }
                  }}
                  style={{padding:"0 14px",height:"100%",background:"none",border:"none",borderLeft:`1px solid ${BORDER}`,cursor:"pointer",color:SUB,display:"flex",alignItems:"center",justifyContent:"center",minHeight:62}}
                  title="Session settings">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </button>
              </div>
            ))}
          </div>
        </>}
        <div style={{height:48}}/>
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Poppins:wght@400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Poppins,sans-serif; -webkit-font-smoothing:antialiased; background:${BG}; }
  @keyframes floatUp { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-80px);opacity:0} }
  @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes slideInRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(1.2)} }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-thumb { background:${MID}; border-radius:4px; }
  input::placeholder { color:${SUB}; opacity:.6; }
  select option { background:#fff; }
`;
