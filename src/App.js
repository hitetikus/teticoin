/* eslint-disable */
import { useState, useRef, useEffect, useCallback } from "react";
import { auth, googleProvider, fsGet, fsSet, fsDel, fsGetSession, fsSetSession } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, sendPasswordResetEmail, onAuthStateChanged, updateProfile, linkWithPopup, fetchSignInMethodsForEmail, EmailAuthProvider, linkWithCredential } from "firebase/auth";
import LandingPage from "./Landing";

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

// ── Feature Flags ─────────────────────────────────────
// Set to true to enable, false to hide/disable
const FEATURES = {
  luckyDraw:  false, // Lucky draw modal
  badges:     false, // Badge picker & awarding
  coinmaster: true,  // Coinmaster role
  groups:     true,  // Groups & teams
  projector:  true,  // Projector/TV view
  templates:  false, // Session templates (coming soon)
  exportCsv:  false, // Export participant data
};

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
// Write a sentinel doc at users/{uid} so admin getDocs("users") can list all users
async function ssParent(uid, email, name) {
  try {
    const { getFirestore, doc, setDoc } = await import("firebase/firestore");
    const db = getFirestore();
    await setDoc(doc(db, "users", uid), { email, name, createdAt: Date.now() }, { merge: true });
  } catch(e) { console.error("ssParent error", e); }
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
const genCMCode = () => "CM-" + Math.random().toString(36).slice(2,6).toUpperCase();
const genToken = () => Math.random().toString(36).slice(2,10) + Math.random().toString(36).slice(2,10);

// ── EmailJS credentials — paste yours here ──
const EMAILJS_SERVICE_ID  = "service_xxxxxxx";
const EMAILJS_TEMPLATE_ID = "template_xxxxxxx";
const EMAILJS_PUBLIC_KEY  = "xxxxxxxxxxxxxxx";

// ── Premade badge library ──
const BADGE_PRESETS = [
  { id:"top",      icon:"🏆", label:"Top Scorer",    color:"#F5A623" },
  { id:"first",    icon:"🥇", label:"First Place",   color:"#F5A623" },
  { id:"star",     icon:"🌟", label:"Star Performer",color:"#F59E0B" },
  { id:"active",   icon:"⚡", label:"Most Active",   color:"#00E5FF" },
  { id:"idea",     icon:"💡", label:"Best Idea",     color:"#9D50FF" },
  { id:"sharp",    icon:"🎯", label:"Sharp Shooter", color:"#E91E8C" },
  { id:"fire",     icon:"🔥", label:"On Fire",       color:"#F97316" },
  { id:"mvp",      icon:"👑", label:"MVP",           color:"#F5A623" },
  { id:"rising",   icon:"🚀", label:"Rising Star",   color:"#3B82F6" },
  { id:"diamond",  icon:"💎", label:"Diamond",       color:"#06B6D4" },
  { id:"special",  icon:"🎖️", label:"Special Award", color:"#E91E8C" },
  { id:"team",     icon:"🤝", label:"Team Player",   color:"#00C48C" },
];

// ── Send badge claim email via EmailJS ──
async function sendClaimEmail({ toEmail, participantName, sessionName, hostName, badge, token }) {
  const expiryDate = new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
  const claimUrl = `${window.location.origin}/claim/${token}`;
  try {
    if (!window.emailjs) throw new Error("EmailJS not loaded");
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email:         toEmail,
      participant_name: participantName,
      session_name:     sessionName,
      host_name:        hostName,
      badge_icon:       badge.icon,
      badge_label:      badge.label,
      claim_url:        claimUrl,
      expiry_date:      expiryDate,
    }, EMAILJS_PUBLIC_KEY);
    return { ok: true };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}
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
  return <div style={{position:"fixed",left:x-20,top:y-20,pointerEvents:"none",zIndex:9999,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:28,color,animation:"floatUp .9s ease forwards"}}>{text}</div>;
}

// ── Avatar ──
function Av({ s, color = PINK, size = 36 }) {
  return (
    <div style={{width:size,height:size,borderRadius:size*.22,flexShrink:0,background:`linear-gradient(135deg,${color},${color}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:size*.34,color:"#fff"}}>
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
      style={{background:disabled?BG:GRAD,border:"none",borderRadius:13,padding:"13px 22px",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:disabled?SUB:"#fff",cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,transition:"all .15s",width:full?"100%":"auto",...sx}}
      onMouseOver={e=>{ if(!disabled){ e.currentTarget.style.filter="brightness(1.08)"; e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow=`0 4px 14px rgba(233,30,140,.35)`; }}}
      onMouseOut={e=>{ e.currentTarget.style.filter="none"; e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
      onMouseDown={e=>{ if(!disabled){ e.currentTarget.style.transform="translateY(1px)"; e.currentTarget.style.filter="brightness(.95)"; }}}
      onMouseUp={e=>{ if(!disabled){ e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.filter="brightness(1.08)"; }}}>
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
    <div style={{position:"fixed",inset:0,zIndex:500,background:BG,display:"flex",flexDirection:"column",animation:"slideInRight .2s ease"}}>
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"0 16px",height:54,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:PINK,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14}}>Cancel</button>
        <div style={{flex:1,textAlign:"center",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:16,color:TEXT}}>Select Participant</div>
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
              <div style={{padding:"6px 16px 4px",background:BG,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:12,color:SUB,borderBottom:`1px solid ${BORDER}`}}>{l}</div>
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
        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:TEXT,marginBottom:2}}>{p.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:11,color:SUB}}>{pNum(p.num)}</span>
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
          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:mode===id?PINK:TEXT}}>{title}</div>
          <div style={{fontSize:12,color:SUB,marginTop:1}}>{sub}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="tc-modal-backdrop" style={{position:"fixed",inset:0,zIndex:450}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(26,10,20,.45)",backdropFilter:"blur(3px)"}}/>
      <div className="tc-modal-sheet" style={{background:"#fff",maxHeight:"90vh",display:"flex",flexDirection:"column",animation:"slideUp .25s ease"}}>
        <div style={{padding:"14px 20px 0",flexShrink:0}}>
          <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 14px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT}}>Mass Give Coins</div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:SUB,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          <div style={{fontSize:13,color:SUB,marginBottom:16}}>Award the same amount to multiple participants.</div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"0 20px 32px"}}>
          <SL>Step 1 — Choose Amount</SL>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:8}}>
            {TV_DEFAULT.map(v => (
              <button key={v} onClick={()=>{setAmt(v);setCAmt("");}}
                style={{padding:"12px 8px",borderRadius:12,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:17,background:amt===v?GRAD:"transparent",border:amt===v?"2px solid transparent":`1.5px solid ${BORDER}`,color:amt===v?"#fff":TEXT,transition:"all .12s"}}>
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
              <button onClick={doAll} style={{width:"100%",padding:"12px 0",background:GRAD,border:"none",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",marginBottom:10}}>
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
                  <button onClick={()=>setSel(new Set(participants.map(p=>p.id)))} style={{padding:"6px 12px",background:BG,border:`1px solid ${BORDER}`,borderRadius:8,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:12,color:TEXT,cursor:"pointer"}}>Select All</button>
                  <button onClick={()=>setSel(new Set())} style={{padding:"6px 12px",background:BG,border:`1px solid ${BORDER}`,borderRadius:8,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:12,color:TEXT,cursor:"pointer"}}>Clear</button>
                </div>
                <div style={{maxHeight:200,overflowY:"auto",borderRadius:12,border:`1px solid ${BORDER}`,overflow:"hidden",marginBottom:10}}>
                  {sorted.map(p => {
                    const grp = groups.find(g=>g.id===p.gid); const on = sel.has(p.id);
                    return (
                      <button key={p.id} onClick={()=>toggleSel(p.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",border:"none",borderBottom:`1px solid ${BORDER}`,background:on?SOFT:"#fff",cursor:"pointer",textAlign:"left"}}>
                        <div style={{width:20,height:20,borderRadius:6,flexShrink:0,border:`2px solid ${on?PINK:BORDER}`,background:on?PINK:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:".12s"}}>
                          {on && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>}
                        </div>
                        <span style={{fontSize:11,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,color:SUB,minWidth:32}}>{pNum(p.num)}</span>
                        <Av s={p.av} color={grp?.color||PINK} size={28}/>
                        <span style={{flex:1,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:13,color:TEXT}}>{p.name}</span>
                        <span style={{fontSize:11,color:PINK,fontWeight:700}}>{p.total}</span>
                      </button>
                    );
                  })}
                </div>
                {sel.size > 0 && ok && (
                  <button onClick={doSel} style={{width:"100%",padding:"12px 0",background:GRAD,border:"none",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",marginBottom:10}}>
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
                    style={{width:"100%",padding:"14px 0",background:GRAD,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
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
                      style={{width:"100%",padding:"11px 0",background:"none",border:`1.5px solid ${BORDER}`,borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:13,color:SUB,cursor:"pointer",marginBottom:8}}>
                      Stop Camera
                    </button>
                  </div>
                )}
                {scannerErr && <div style={{fontSize:12,color:"#EF4444",fontWeight:600,marginBottom:10,textAlign:"center"}}>{scannerErr}</div>}

                {/* Scan log */}
                {scanLog.length > 0 && (
                  <div style={{borderRadius:12,border:`1px solid ${BORDER}`,overflow:"hidden"}}>
                    <div style={{padding:"8px 12px",background:BG,fontSize:11,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,color:SUB,textTransform:"uppercase",letterSpacing:1,borderBottom:`1px solid ${BORDER}`}}>
                      Scanned ({scanLog.length})
                    </div>
                    {scanLog.map((p,i) => {
                      const grp = groups.find(g=>g.id===p.gid);
                      return (
                        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderBottom:`1px solid ${BORDER}`,background:i===0?SOFT:"#fff"}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:GREEN,flexShrink:0}}/>
                          <span style={{fontSize:11,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,color:PINK,minWidth:36}}>{pNum(p.num)}</span>
                          <Av s={p.av} color={grp?.color||PINK} size={26}/>
                          <span style={{flex:1,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:13,color:TEXT}}>{p.name}</span>
                          <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:13,color:GREEN}}>+{finalAmt}</span>
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
    <div className="tc-modal-backdrop" style={{position:"fixed",inset:0,zIndex:600}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(26,10,20,.5)",backdropFilter:"blur(3px)"}}/>
      <div className="tc-modal-sheet" style={{background:"#fff",maxHeight:"85vh",display:"flex",flexDirection:"column",animation:"slideUp .25s ease"}}>
        <div style={{padding:"14px 20px 0",flexShrink:0}}>
          <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 14px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:TEXT}}>Customise Coins</div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:SUB,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          <div style={{display:"flex",borderBottom:`1px solid ${BORDER}`}}>
            {[["quick","Quick Coins"],["other","Give Coins"]].map(([id,l])=>(
              <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 16px",border:"none",background:"none",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:tab===id?PINK:SUB,cursor:"pointer",borderBottom:tab===id?`2.5px solid ${PINK}`:"2.5px solid transparent",transition:"all .12s"}}>{l}</button>
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
                    <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:14,color:QCOLS[i]}}>Q{i+1}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:TEXT}}>{a.label}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <button onClick={()=>setQuick(prev=>{const a=[...prev];a[i]=Math.max(-999,a[i]-5);return a;})}
                      style={{width:30,height:30,borderRadius:9,border:`1px solid ${BORDER}`,background:BG,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:18,color:SUB,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                    <input type="number" value={quick[i]} onChange={e=>setQuick(prev=>{const a=[...prev];a[i]=parseInt(e.target.value)||0;return a;})}
                      style={{width:58,textAlign:"center",background:BG,border:`1.5px solid ${QCOLS[i]}55`,borderRadius:10,padding:"7px 4px",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:16,color:QCOLS[i],outline:"none"}}/>
                    <button onClick={()=>setQuick(prev=>{const a=[...prev];a[i]+=5;return a;})}
                      style={{width:30,height:30,borderRadius:9,border:`1px solid ${BORDER}`,background:BG,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:18,color:SUB,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
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
                      style={{width:"100%",textAlign:"center",background:"none",border:"none",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:16,color:v<0?"#EF4444":YELLOW,outline:"none",padding:"14px 4px"}}/>
                  ) : (
                    <button onClick={()=>{setEditIdx(i);setEditVal(String(v));}}
                      style={{width:"100%",padding:"14px 4px",background:"none",border:"none",cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:16,color:v<0?"#EF4444":YELLOW}}>
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
                    style={{width:"100%",textAlign:"center",background:"none",border:"none",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:15,color:PINK,outline:"none",padding:"14px 4px"}}/>
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <input type="number" placeholder="Enter value (e.g. 200 or −50)" value={newVal}
                onChange={e=>setNewVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addOther()}
                style={{flex:1,background:BG,border:`1.5px solid ${BORDER}`,borderRadius:12,padding:"10px 14px",fontFamily:"Poppins,sans-serif",fontSize:13,color:TEXT,outline:"none"}}/>
              <button onClick={addOther} disabled={other.length>=15||!newVal}
                style={{padding:"0 16px",background:other.length>=15?BG:GRAD,border:"none",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:other.length>=15?SUB:"#fff",cursor:other.length>=15?"not-allowed":"pointer"}}>
                Add
              </button>
            </div>
            <div style={{fontSize:11,color:SUB,fontWeight:600}}>{other.length}/15 values · Tap any value to edit · × to remove</div>
            <div style={{background:`${PINK}10`,border:`1px solid ${PINK}25`,borderRadius:10,padding:"10px 12px",marginTop:10,fontSize:12,color:PINK,fontWeight:600}}>
              Negative values (e.g. −50) will subtract coins — participants can go below zero on the scoreboard.
            </div>
          </>}
        </div>
        <div style={{padding:"0 20px 32px",flexShrink:0}}>
          <button onClick={save} style={{width:"100%",padding:"14px 0",background:GRAD,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer"}}>
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
    <div className="tc-modal-backdrop" style={{position:"fixed",inset:0,zIndex:500}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(26,10,20,.45)",backdropFilter:"blur(3px)"}}/>
      <div className="tc-modal-sheet" style={{background:"#fff",animation:"slideUp .25s ease",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{padding:"14px 20px 0"}}>
          <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:TEXT}}>Session Settings</div>
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
                  style={{flex:1,background:"#fff",border:`1.5px solid ${PINK}`,borderRadius:10,padding:"10px 12px",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:15,color:TEXT,outline:"none"}}/>
                <button onClick={saveName} style={{padding:"0 16px",background:GRAD,border:"none",borderRadius:10,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>Save</button>
                <button onClick={()=>{setNameVal(session.name);setEditing(false);}} style={{padding:"0 12px",background:"none",border:`1px solid ${BORDER}`,borderRadius:10,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:13,color:SUB,cursor:"pointer"}}>Cancel</button>
              </div>
            ) : (
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:16,color:TEXT}}>{session.name}</div>
                <button onClick={()=>setEditing(true)} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,padding:"5px 12px",fontSize:12,color:SUB,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700}}>Edit</button>
              </div>
            )}
            <div style={{fontSize:11,color:SUB,marginTop:4}}>Code: {session.code} · {session.participants.length} participants</div>
          </div>

          {/* Live toggle */}
          <div onClick={onToggleLive}
            style={{background:session.live!==false?`${GREEN}10`:`#EF444410`,border:`1.5px solid ${session.live!==false?GREEN:"#EF4444"}`,borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"all .2s"}}>
            <div>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:session.live!==false?GREEN:"#EF4444"}}>
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
          <button onClick={onExport} style={{width:"100%",padding:"13px 0",background:`linear-gradient(135deg,${GREEN},#06B6D4)`,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:"#fff",cursor:"pointer"}}>
            Export Results CSV
          </button>

          {/* Duplicate */}
          <button onClick={onDuplicate}
            style={{width:"100%",padding:"13px 0",background:SOFT,border:`1.5px solid ${MID}`,borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:PINK,cursor:"pointer"}}>
            Duplicate Session
          </button>

          {/* Reset */}
          <button onClick={onReset} style={{width:"100%",padding:"13px 0",background:"#FEF2F2",border:"1.5px solid #EF444440",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:"#EF4444",cursor:"pointer"}}>
            Reset All Coins
          </button>

          <div style={{height:1,background:BORDER,margin:"4px 0"}}/>

          {/* Archive */}
          <div style={{background:"#F8F8FA",border:`1px solid ${BORDER}`,borderRadius:13,padding:"14px 16px"}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:TEXT,marginBottom:4}}>Archive Session</div>
            <div style={{fontSize:12,color:SUB,marginBottom:12,lineHeight:1.6}}>
              Permanently closes the session. Participants can no longer join. Data is preserved as read-only history.
            </div>
            <button onClick={onArchive}
              style={{width:"100%",padding:"11px 0",background:"#1A0A14",border:"none",borderRadius:10,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>
              Archive Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Manage({ session, plan="free", paxLimit=FREE_PAX_LIMIT, onUpdate, onClose, onShowQR, onExport, onReset, onRename, onToggleLive }) {
  const isManagePro = plan !== "free";
  const [showUpgradeHint, setShowUpgradeHint] = useState(null);
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
  function assignCM(uid) { onUpdate(s=>{ s.coinmasterUids=[...(s.coinmasterUids||[]).filter(x=>x!==uid),uid]; return s; }); }
  function removeCM(uid) { onUpdate(s=>{ s.coinmasterUids=(s.coinmasterUids||[]).filter(x=>x!==uid); return s; }); }
  function toggleCoinmaster() { onUpdate(s=>{ s.coinmasterEnabled=!s.coinmasterEnabled; return s; }); }
  function saveName() { if (nameVal.trim()) { onRename(nameVal.trim()); setEditingName(false); } } // eslint-disable-line

  const cmEnabled = !!session.coinmasterEnabled;

  const tabBtn = (id, label, badge) => (
    <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 14px",border:"none",background:"none",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:12,color:tab===id?PINK:SUB,cursor:"pointer",borderBottom:tab===id?`2.5px solid ${PINK}`:"2.5px solid transparent",transition:"all .12s",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
      {label}{badge}
    </button>
  );

  return (
    <div className="tc-modal-backdrop" style={{position:"fixed",inset:0,zIndex:400}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(26,10,20,.45)",backdropFilter:"blur(3px)"}}/>
      <div className="tc-modal-sheet" style={{background:"#fff",maxHeight:"85vh",display:"flex",flexDirection:"column",animation:"slideUp .25s ease"}}>
        <div style={{padding:"14px 20px 0",flexShrink:0}}>
          <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 12px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:TEXT}}>Participants</div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:SUB,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          <div style={{display:"flex",borderBottom:`1px solid ${BORDER}`}}>
            {tabBtn("people","Participants")}
            {tabBtn("groups",<span style={{display:"flex",alignItems:"center",gap:4}}>Groups<svg width="12" height="10" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="m2.8373 20.9773c-.6083-3.954-1.2166-7.9079-1.8249-11.8619-.1349-.8765.8624-1.4743 1.5718-.9422 1.8952 1.4214 3.7903 2.8427 5.6855 4.2641.624.468 1.513.3157 1.9456-.3333l4.7333-7.1c.5002-.7503 1.6026-.7503 2.1028 0l4.7333 7.1c.4326.649 1.3216.8012 1.9456.3333 1.8952-1.4214 3.7903-2.8427 5.6855-4.2641.7094-.5321 1.7067.0657 1.5719.9422-.6083 3.954-1.2166 7.9079-1.8249 11.8619z" fill="#ffb743"/><path d="m27.7902 27.5586h-23.5804c-.758 0-1.3725-.6145-1.3725-1.3725v-3.015h26.3255v3.015c-.0001.758-.6146 1.3725-1.3726 1.3725z" fill="#ffb743"/></svg></span>)}
            {/* Coinmaster tab hidden — phase 2 feature */}
          </div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"16px 20px 32px"}}>

          {tab==="people" && <>
            {/* Two-column: Add name input + Show QR button */}
            <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,marginBottom:12,alignItems:"center"}}>
              <Inp placeholder="Participant Name" value={np} onChange={e=>setNp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addP()} style={{flex:1,margin:0}}/>
              <button onClick={addP}
                style={{padding:"0 16px",height:42,background:GRAD,border:"none",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer",whiteSpace:"nowrap"}}>
                Add
              </button>
              <button onClick={()=>{ onClose(); if(onShowQR) onShowQR(); }}
                style={{padding:"0 12px",height:42,background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:12,color:TEXT,cursor:"pointer",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3" rx=".5"/></svg>
                Show QR
              </button>
            </div>
            {sorted.length===0 && <div style={{textAlign:"center",padding:24,color:SUB,fontSize:13}}>No participants yet</div>}
            {sorted.map(p => {
              const grp = session.groups.find(g=>g.id===p.gid);
              return (
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${BORDER}`}}>
                  <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:11,color:SUB,minWidth:36}}>{pNum(p.num)}</div>
                  <Av s={p.av} color={grp?.color||PINK} size={34}/>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:TEXT}}>{p.name}</div>
                    <div style={{fontSize:11,color:PINK,fontWeight:600}}>{p.total} coins</div>
                  </div>
                  {isManagePro && (
                    <select value={p.gid??""} onChange={e=>asgG(p.id,e.target.value)} style={{background:SOFT,border:`1px solid ${MID}`,color:TEXT,borderRadius:9,padding:"5px 8px",fontSize:11,fontFamily:"Poppins,sans-serif",cursor:"pointer",outline:"none",maxWidth:90}}>
                      <option value="">No group</option>
                      {session.groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  )}
                  {(p.total === 0 && !p.uid) ? (
                    <button onClick={()=>remP(p.id)} title="Remove participant"
                      style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,padding:"4px 9px",fontSize:11,color:SUB,cursor:"pointer"}}>✕</button>
                  ) : (
                    <div title="Cannot remove — participant has joined or earned coins"
                      style={{width:28,height:26,display:"flex",alignItems:"center",justifyContent:"center",color:`${SUB}44`,fontSize:13,flexShrink:0}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                  )}
                </div>
              );
            })}
          </>}

          {tab==="groups" && <>
            {!isManagePro ? (
              <div style={{position:"relative"}}>
                {/* Dummy group content as teaser — visible behind overlay */}
                <div style={{pointerEvents:"none",userSelect:"none"}}>
                  <div style={{display:"flex",gap:8,marginBottom:10}}>
                    <div style={{flex:1,height:38,background:BORDER,borderRadius:10,opacity:0.5}}/>
                    <div style={{width:64,height:38,background:MID,borderRadius:10,opacity:0.5}}/>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                    {GC.slice(0,4).map(c=><div key={c} style={{width:22,height:22,borderRadius:6,background:c,opacity:0.6}}/>)}
                  </div>
                  {[{name:"Team Alpha",color:GC[0],count:3},{name:"Team Bravo",color:GC[1],count:2},{name:"Team Charlie",color:GC[2],count:4}].map((g,i)=>(
                    <div key={g.name} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${BORDER}`,opacity:0.6}}>
                      <div style={{width:12,height:12,borderRadius:3,background:g.color,flexShrink:0}}/>
                      <div style={{flex:1,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:g.color}}>{g.name}</div>
                      <div style={{fontSize:11,color:SUB}}>{g.count} members</div>
                    </div>
                  ))}
                </div>
                {/* Frosted overlay with upgrade prompt */}
                <div style={{position:"absolute",inset:0,backdropFilter:"blur(3px)",WebkitBackdropFilter:"blur(3px)",background:"rgba(255,255,255,0.55)",borderRadius:12,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px",textAlign:"center"}}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
                    <svg width="36" height="30" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="m2.8373 20.9773c-.6083-3.954-1.2166-7.9079-1.8249-11.8619-.1349-.8765.8624-1.4743 1.5718-.9422 1.8952 1.4214 3.7903 2.8427 5.6855 4.2641.624.468 1.513.3157 1.9456-.3333l4.7333-7.1c.5002-.7503 1.6026-.7503 2.1028 0l4.7333 7.1c.4326.649 1.3216.8012 1.9456.3333 1.8952-1.4214 3.7903-2.8427 5.6855-4.2641.7094-.5321 1.7067.0657 1.5719.9422-.6083 3.954-1.2166 7.9079-1.8249 11.8619z" fill="#ffb743"/><path d="m27.7902 27.5586h-23.5804c-.758 0-1.3725-.6145-1.3725-1.3725v-3.015h26.3255v3.015c-.0001.758-.6146 1.3725-1.3726 1.3725z" fill="#ffb743"/></svg>
                  </div>
                  <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:TEXT,marginBottom:6}}>Groups is a Pro feature</div>
                  <div style={{fontSize:13,color:SUB,lineHeight:1.6,marginBottom:16}}>Organise participants into teams and track group scores. Upgrade to unlock.</div>
                  <button onClick={()=>setShowUpgradeHint("groups")} style={{padding:"10px 24px",background:GRAD,border:"none",borderRadius:10,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>Upgrade to Pro →</button>
                </div>
              </div>
            ) : <>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <Inp placeholder="Group name" value={ng} onChange={e=>setNg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addG()} style={{flex:1}}/>
              <button onClick={addG} style={{padding:"0 18px",background:GRAD,border:"none",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>Add</button>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
              {GC.map(c => <div key={c} onClick={()=>setNgc(c)} style={{width:26,height:26,borderRadius:8,background:c,cursor:"pointer",transition:".12s",border:ngc===c?`3px solid ${TEXT}`:"3px solid transparent",transform:ngc===c?"scale(1.15)":"scale(1)"}}/>)}
            </div>
            {session.groups.map(g => (
              <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${BORDER}`}}>
                <div style={{width:12,height:12,borderRadius:3,background:g.color,flexShrink:0}}/>
                <div style={{flex:1,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:g.color}}>{g.name}</div>
                <div style={{fontSize:11,color:SUB}}>{session.participants.filter(p=>p.gid===g.id).length} members</div>
              </div>
            ))}
            </>}
          </>}

          {tab==="coinmaster" && <>
            {!isManagePro ? (
              <div style={{textAlign:"center",padding:"32px 16px 24px"}}>
                <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><svg width="36" height="30" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="m2.8373 20.9773c-.6083-3.954-1.2166-7.9079-1.8249-11.8619-.1349-.8765.8624-1.4743 1.5718-.9422 1.8952 1.4214 3.7903 2.8427 5.6855 4.2641.624.468 1.513.3157 1.9456-.3333l4.7333-7.1c.5002-.7503 1.6026-.7503 2.1028 0l4.7333 7.1c.4326.649 1.3216.8012 1.9456.3333 1.8952-1.4214 3.7903-2.8427 5.6855-4.2641.7094-.5321 1.7067.0657 1.5719.9422-.6083 3.954-1.2166 7.9079-1.8249 11.8619z" fill="#ffb743"/><path d="m27.7902 27.5586h-23.5804c-.758 0-1.3725-.6145-1.3725-1.3725v-3.015h26.3255v3.015c-.0001.758-.6146 1.3725-1.3726 1.3725z" fill="#ffb743"/></svg></div>
                <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:TEXT,marginBottom:8}}>Coinmaster is a Pro feature</div>
                <div style={{fontSize:13,color:SUB,lineHeight:1.7,marginBottom:18}}>Let co-hosts award coins from their own device. Upgrade to unlock coinmaster, groups, custom labels and more.</div>
                <button onClick={()=>setShowUpgradeHint("coinmaster")} style={{padding:"10px 24px",background:GRAD,border:"none",borderRadius:10,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>Upgrade to Pro →</button>
                <div style={{marginTop:20,opacity:0.3,pointerEvents:"none",filter:"blur(1.5px)"}}>
                  <div style={{height:40,background:"#FAF5FF",border:"1px solid #DDD6FE",borderRadius:10,marginBottom:10}}/>
                  <div style={{height:32,background:BORDER,borderRadius:8,marginBottom:8}}/><div style={{height:32,background:BORDER,borderRadius:8}}/>
                </div>
              </div>
            ) : !cmEnabled ? (
              <div style={{textAlign:"center",padding:"36px 16px 24px"}}>
                <div style={{width:56,height:56,borderRadius:16,background:"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:TEXT,marginBottom:6}}>Coinmaster is off</div>
                <div style={{fontSize:13,color:SUB,lineHeight:1.7,marginBottom:18}}>Enable it to assign participants as coinmasters who can award coins from their own device.</div>
                <button onClick={toggleCoinmaster} style={{padding:"10px 24px",background:"#7C3AED",border:"none",borderRadius:10,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>Enable Coinmaster</button>
              </div>
            ) : (<>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,background:"#FAF5FF",border:"1px solid #DDD6FE",borderRadius:10,padding:"10px 14px"}}>
                <div style={{fontSize:12,color:"#7C3AED",fontWeight:700,display:"flex",alignItems:"center",gap:7}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                  Coinmaster enabled
                </div>
                <button onClick={toggleCoinmaster} style={{padding:"4px 10px",background:"none",border:"1px solid #DDD6FE",borderRadius:7,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:11,color:SUB,cursor:"pointer"}}>Disable</button>
              </div>
              <div style={{fontSize:12,color:SUB,lineHeight:1.7,marginBottom:14,background:SOFT,border:`1px solid ${MID}`,borderRadius:10,padding:"10px 12px"}}>
                Coinmasters can award coins from their own device. Only participants who are <strong>logged in</strong> are eligible.
              </div>
              {sorted.length===0 && <div style={{textAlign:"center",padding:24,color:SUB,fontSize:13}}>No participants yet</div>}
              {sorted.map(p => {
                const isCM = (session.coinmasterUids||[]).includes(p.uid);
                const canAssign = !!p.uid;
                return (
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 0",borderBottom:`1px solid ${BORDER}`}}>
                    <Av s={p.av} color={isCM?"#7C3AED":PINK} size={34}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:TEXT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                      {isCM
                        ? <div style={{fontSize:11,color:"#7C3AED",fontWeight:700}}>Coinmaster ✓</div>
                        : canAssign
                          ? <div style={{fontSize:11,color:GREEN,fontWeight:600}}>Logged in · eligible</div>
                          : <div style={{fontSize:11,color:SUB}}>Not logged in · ineligible</div>
                      }
                    </div>
                    {canAssign ? (
                      <button onClick={()=>isCM?removeCM(p.uid):assignCM(p.uid)}
                        style={{padding:"5px 13px",background:isCM?"#FAF5FF":"#F0FDF4",border:`1px solid ${isCM?"#DDD6FE":"#BBF7D0"}`,borderRadius:8,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:12,color:isCM?"#7C3AED":"#16A34A",cursor:"pointer",flexShrink:0}}>
                        {isCM?"Remove":"Assign"}
                      </button>
                    ) : (
                      <span style={{fontSize:11,color:SUB,padding:"5px 8px",flexShrink:0}}>—</span>
                    )}
                  </div>
                );
              })}
            </>)}
          </>}
        </div>
      </div>
    </div>
  );
}

// ── Auth ──
function Auth({ onDone, onBack }) {
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [showP, setShowP] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr(""); setBusy(true);
    try {
      if (view==="forgot") {
        await sendPasswordResetEmail(auth, email);
        setView("sent");
      } else if (view==="login") {
        const c = await signInWithEmailAndPassword(auth, email, pass);
        onDone({ name: c.user.displayName||email.split("@")[0]||"User", email, uid: c.user.uid });
      } else {
        const c = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(c.user, { displayName: name||email.split("@")[0] });
        onDone({ name: name||email.split("@")[0], email, uid: c.user.uid });
      }
    } catch(e) {
      const msg = e.code==="auth/invalid-credential"||e.code==="auth/user-not-found"||e.code==="auth/wrong-password" ? "Incorrect email or password. Please try again."
        : e.code==="auth/email-already-in-use" ? "An account with this email already exists."
        : e.code==="auth/weak-password" ? "Password must be at least 6 characters."
        : e.code==="auth/invalid-email" ? "Please enter a valid email address."
        : e.code==="auth/too-many-requests" ? "Too many failed attempts. Please wait a moment and try again."
        : e.code==="auth/user-disabled" ? "This account has been disabled. Contact support."
        : e.code==="auth/network-request-failed" ? "Network error. Check your connection and try again."
        : "Something went wrong. Please try again.";
      setErr(msg);
    }
    setBusy(false);
  }

  async function googleSignIn() {
    setErr(""); setBusy(true);
    try {
      const c = await signInWithPopup(auth, googleProvider);
      onDone({ name: c.user.displayName||"User", email: c.user.email, uid: c.user.uid });
    } catch(e) {
      setErr("Google sign-in failed. Please try again.");
    }
    setBusy(false);
  }

  if (view==="sent") return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 20px"}}>
      <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:20,padding:"36px 28px",maxWidth:400,width:"100%",textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:SOFT,border:`2px solid ${MID}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2.2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,color:TEXT,marginBottom:8}}>Check your email</div>
        <div style={{fontSize:13,color:SUB,marginBottom:24,lineHeight:1.7}}>Reset link sent to<br/><strong style={{color:TEXT}}>{email}</strong></div>
        <button onClick={()=>setView("login")} style={{background:"none",border:"none",color:PINK,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,cursor:"pointer"}}>Back to sign in</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"Poppins,sans-serif"}}>
      {/* Back to home */}
      {onBack && (
        <div style={{position:"fixed",top:0,left:0,right:0,padding:"12px 20px",display:"flex",alignItems:"center",zIndex:10}}>
          <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:`1px solid ${BORDER}`,borderRadius:10,padding:"7px 14px",cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:13,color:SUB}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to home
          </button>
        </div>
      )}
      <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:20,padding:"32px 28px",maxWidth:400,width:"100%"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:24}}>
          <Ham size={68}/>
          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:26,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-1,marginTop:4,lineHeight:1.1}}>Teticoin</div>
          <div style={{fontSize:12,color:SUB,fontWeight:500,marginTop:2}}>Gamifying Interactions</div>
        </div>

        {view!=="forgot" && (
          <div style={{display:"flex",background:BG,borderRadius:12,padding:4,marginBottom:20}}>
            {["login","register"].map(v => (
              <button key={v} onClick={()=>{setView(v);setErr("");}} 
                style={{flex:1,padding:"9px 0",borderRadius:9,border:"none",background:view===v?"#fff":"transparent",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:view===v?TEXT:SUB,cursor:"pointer",boxShadow:view===v?"0 1px 6px rgba(0,0,0,.08)":"none",transition:"all .15s"}}
                onMouseOver={e=>{ if(view!==v) e.currentTarget.style.color=TEXT; }}
                onMouseOut={e=>{ if(view!==v) e.currentTarget.style.color=SUB; }}>
                {v==="login"?"Sign In":"Register"}
              </button>
            ))}
          </div>
        )}

        {view==="forgot" && (
          <div style={{marginBottom:20}}>
            <button onClick={()=>setView("login")} style={{background:"none",border:"none",color:SUB,fontFamily:"Poppins,sans-serif",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:0,marginBottom:10}}><span style={{fontSize:18}}>‹</span>Back</button>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:4}}>Reset Password</div>
            <div style={{fontSize:13,color:SUB}}>We'll send a reset link to your email.</div>
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {view==="register" && <Inp placeholder="Full name" value={name} onChange={e=>setName(e.target.value)}/>}
          <Inp placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} type="email"/>
          {view!=="forgot" && (
            <div style={{position:"relative"}}>
              <Inp placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} type={showP?"text":"password"} onKeyDown={e=>e.key==="Enter"&&submit()} style={{paddingRight:56}}/>
              <button onClick={()=>setShowP(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:SUB,fontFamily:"Poppins,sans-serif",fontSize:11,fontWeight:700,cursor:"pointer"}}>{showP?"HIDE":"SHOW"}</button>
            </div>
          )}
          {view==="login" && (
            <div style={{textAlign:"right",marginTop:-4}}>
              <button onClick={()=>{setView("forgot");setErr("");}} style={{background:"none",border:"none",color:PINK,fontFamily:"Poppins,sans-serif",fontSize:12,cursor:"pointer",fontWeight:600}}>Forgot password?</button>
            </div>
          )}
          {err && <div style={{background:"#FEF2F2",border:"1px solid #EF444440",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#EF4444",fontWeight:600,lineHeight:1.5}}>{err}</div>}
          <PBtn full onClick={submit} disabled={busy}>
            {busy
              ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{width:14,height:14,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite"}}/>{view==="login"?"Signing in...":view==="register"?"Creating account...":"Sending..."}</span>
              : view==="login"?"Sign In":view==="register"?"Create Account":"Send Reset Link"
            }
          </PBtn>
          {view!=="forgot" && <>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1,height:1,background:BORDER}}/><span style={{fontSize:12,color:SUB,fontWeight:600}}>or</span><div style={{flex:1,height:1,background:BORDER}}/>
            </div>
            <button onClick={googleSignIn} disabled={busy}
              style={{width:"100%",padding:"12px 0",borderRadius:13,border:`1.5px solid ${BORDER}`,background:"#fff",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:TEXT,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"all .15s",opacity:busy?.6:1}}
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
  const [showEarnings, setShowEarnings] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editNameVal, setEditNameVal] = useState("");
  const [returnMatch, setReturnMatch] = useState(null);
  const [linkedUid, setLinkedUid] = useState(null);       // set after optional login
  const [linkedName, setLinkedName] = useState(null);     // display name from linked account
  const [guestName, setGuestName] = useState("");         // original typed name before optional login
  const [showLoginBanner, setShowLoginBanner] = useState(true); // can be dismissed
  const [loginModal, setLoginModal] = useState(false);    // optional login modal open
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

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
    // Block host from joining their own session
    const currentUid = auth.currentUser?.uid || null;
    if (currentUid && live.hostUid && currentUid === live.hostUid) { setStep("hostblocked"); return; }
    const existing = (live.participants||[]).find(
      p => p.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (existing) { setReturnMatch(existing); setStep("returning"); }
    else { setStep(isPro ? "newpin" : "directjoin"); }
  }

  function directJoin(overrideName) {
    const currentPax = (live.participants||[]).length;
    const limit = isPro ? PRO_PAX_LIMIT : FREE_PAX_LIMIT;
    if (currentPax >= limit) { setStep("full"); return; }
    // Block host from joining their own session
    const currentUid = auth.currentUser?.uid || linkedUid || null;
    if (currentUid && live.hostUid && currentUid === live.hostUid) { setStep("hostblocked"); return; }
    const n = ((live.participants||[]).reduce((m,p)=>Math.max(m,p.num||0),0))+1;
    const joinName = overrideName || name.trim();
    const baseGuestName = name.trim() || joinName;
    const np = {id:Date.now(),name:joinName,av:mkAv(joinName),total:0,bk:{},gid:null,num:n,uid:currentUid,guestName:baseGuestName};
    setGuestName(baseGuestName);
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
    const currentPax = (live.participants||[]).length;
    const limit = isPro ? PRO_PAX_LIMIT : FREE_PAX_LIMIT;
    if (currentPax >= limit) { setStep("full"); return; }
    const currentUid = auth.currentUser?.uid || linkedUid || null;
    if (currentUid && live.hostUid && currentUid === live.hostUid) { setStep("hostblocked"); return; }
    const n = ((live.participants||[]).reduce((m,p)=>Math.max(m,p.num||0),0))+1;
    const joinName = linkedName || name.trim();
    const baseGuestName = name.trim() || joinName;
    const np = {id:Date.now(),name:joinName,av:mkAv(joinName),total:0,bk:{},gid:null,num:n,pin,uid:(auth.currentUser?.uid || linkedUid || null),guestName:baseGuestName};
    setGuestName(baseGuestName);
    setMyId(np.id);
    const u = {...live,participants:[...(live.participants||[]),np]};
    setLive(u); ssSession(init.code, u); setStep("joined");
  }

  function skipPin() { directJoin(); }

  function verifyPin() {
    if (pinInput === returnMatch.pin) { setMyId(returnMatch.id); setStep("joined"); }
    else { setPinError("Wrong PIN. Try again."); setPinInput(""); }
  }

  // Link account after joining anonymously
  async function handleOptionalLogin(e, method) {
    if (e) e.preventDefault();
    setLoginErr(""); setLoginBusy(true);
    try {
      let cred;
      if (method === "google") {
        const result = await signInWithPopup(auth, googleProvider);
        cred = result.user;
      } else {
        const result = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPass);
        cred = result.user;
      }
      const uid = cred.uid;
      const displayName = cred.displayName || cred.email.split("@")[0];
      setLinkedUid(uid);
      setLinkedName(displayName);

      // If they log in before joining, use the logged-in name for the first join
      if (!myId) {
        if (!name.trim()) setName(displayName);
        setLoginModal(false);
        setShowLoginBanner(false);
        directJoin(displayName);
        setLoginBusy(false);
        return;
      }

      // Patch participant record in Firestore with uid and switch visible name to logged-in account
      const fresh = await sgSession(init.code);
      if (fresh) {
        const updated = {
          ...fresh,
          participants: (fresh.participants||[]).map(p =>
            p.id === myId ? {...p, uid, guestName: p.guestName || guestName || p.name, name: displayName, av: mkAv(displayName)} : p
          )
        };
        setLive(updated);
        await ssSession(init.code, updated);
      }
      setLoginModal(false);
      setShowLoginBanner(false);
    } catch(err) {
      const msg = err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found"
        ? "Incorrect email or password. Please try again."
        : err.code === "auth/invalid-email" ? "Invalid email address."
        : err.code === "auth/too-many-requests" ? "Too many attempts. Try again later."
        : err.code === "auth/network-request-failed" ? "Network error. Check your connection."
        : "Something went wrong. Please try again.";
      setLoginErr(msg);
    }
    setLoginBusy(false);
  }

  async function switchBackToGuestName() {
    if (!myId) return;
    const fallbackName = guestName || name.trim() || "Guest";
    const fresh = await sgSession(init.code);
    if (fresh) {
      const updated = {
        ...fresh,
        participants: (fresh.participants||[]).map(p =>
          p.id === myId ? {...p, uid:null, name:fallbackName, av:mkAv(fallbackName), guestName:fallbackName} : p
        )
      };
      setLive(updated);
      await ssSession(init.code, updated);
    }
    setLinkedUid(null);
    setLinkedName(null);
    setShowLoginBanner(true);
  }

  // Badge claim prompt — appears when host awards a badge (detected via polling)
  const [badgeClaimStep, setBadgeClaimStep] = useState("idle"); // idle|prompt|email|sent|claiming
  const [claimEmail, setClaimEmail] = useState("");
  const [claimEmailErr, setClaimEmailErr] = useState("");
  const [claimEmailBusy, setClaimEmailBusy] = useState(false);

  const pendingBadge = live?.participants?.find(p => p.id === myId)?.pendingBadge;

  async function handleEmailClaim() {
    if (!claimEmail.trim() || !pendingBadge) return;
    setClaimEmailBusy(true); setClaimEmailErr("");
    const token = genToken();
    const claimDoc = {
      token,
      sessionCode:     init.code,
      sessionName:     live.name,
      hostName:        live.hostName || "the host",
      participantId:   myId,
      participantName: me.name,
      badge:           pendingBadge,
      email:           claimEmail.trim(),
      createdAt:       new Date().toISOString(),
      claimed:         false,
      claimedAt:       null,
      claimedUid:      null,
    };
    await fsSetSession("claim-" + token, claimDoc);
    // Patch session participant with claimEmail + token
    const fresh = await sgSession(init.code);
    if (fresh) {
      const updated = { ...fresh, participants: (fresh.participants||[]).map(p =>
        p.id === myId ? { ...p, pendingBadge: { ...p.pendingBadge, claimToken: token, claimEmail: claimEmail.trim() } } : p
      )};
      setLive(updated);
      await ssSession(init.code, updated);
    }
    const result = await sendClaimEmail({
      toEmail:         claimEmail.trim(),
      participantName: me.name,
      sessionName:     live.name,
      hostName:        live.hostName || "the host",
      badge:           pendingBadge,
      token,
    });
    setClaimEmailBusy(false);
    if (result.ok) { setBadgeClaimStep("sent"); }
    else { setClaimEmailErr("Couldn't send email. Please try again."); }
  }

  async function dismissBadge() {
    if (!window.confirm("Are you sure? This badge will be permanently gone.")) return;
    const fresh = await sgSession(init.code);
    if (fresh) {
      const updated = { ...fresh, participants: (fresh.participants||[]).map(p =>
        p.id === myId ? { ...p, pendingBadge: null } : p
      )};
      setLive(updated);
      await ssSession(init.code, updated);
    }
    setBadgeClaimStep("idle");
  }

  async function claimWithLogin(user) {
    if (!pendingBadge || !user) return;
    const uid = user.uid;
    const badge = { ...pendingBadge, sessionCode: init.code, sessionName: live.name, awardedAt: new Date().toISOString() };
    const existing = await fsGet(uid, "badges") || [];
    await fsSet(uid, "badges", [...existing, badge]);
    // Clear pendingBadge from session record
    const fresh = await sgSession(init.code);
    if (fresh) {
      const updated = { ...fresh, participants: (fresh.participants||[]).map(p =>
        p.id === myId ? { ...p, pendingBadge: null, uid } : p
      )};
      setLive(updated);
      await ssSession(init.code, updated);
    }
    setLinkedUid(uid);
    setLinkedName(user.displayName || user.email?.split("@")[0]);
    setBadgeClaimStep("idle");
  }

  // Show prompt when pendingBadge detected and not yet acting on it
  useEffect(() => {
    if (pendingBadge && badgeClaimStep === "idle") setBadgeClaimStep("prompt");
  }, [pendingBadge?.label]);

  const BadgeClaimPrompt = () => {
    if (!pendingBadge || badgeClaimStep === "idle") return null;
    const badge = pendingBadge;
    return (
      <div style={{position:"fixed",inset:0,zIndex:650,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"rgba(26,10,20,.6)",backdropFilter:"blur(4px)"}}>
        <div style={{background:"#fff",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:460,padding:"24px 24px 48px",animation:"slideUp .3s ease"}}>
          <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 20px"}}/>
          {badgeClaimStep === "prompt" && (<>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:64,lineHeight:1,marginBottom:12}}>
                {badge.svgData ? <img src={badge.svgData} alt="" style={{width:64,height:64,margin:"0 auto"}}/> : badge.icon}
              </div>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,color:TEXT,marginBottom:4}}>You've been awarded!</div>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:18,color:badge.color||PINK,marginBottom:4}}>{badge.label}</div>
              <div style={{fontSize:13,color:SUB}}>at {live.name}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>setBadgeClaimStep("loginClaim")}
                style={{width:"100%",padding:"14px 0",background:GRAD,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer"}}>
                🏅 Log in / Register to claim
              </button>
              <button onClick={()=>setBadgeClaimStep("email")}
                style={{width:"100%",padding:"13px 0",background:SOFT,border:`1.5px solid ${MID}`,borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:PINK,cursor:"pointer"}}>
                📧 Send claim link to my email
              </button>
              <button onClick={dismissBadge}
                style={{width:"100%",padding:"11px 0",background:"none",border:`1px solid ${BORDER}`,borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:600,fontSize:13,color:SUB,cursor:"pointer"}}>
                I don't want this badge
              </button>
            </div>
          </>)}
          {badgeClaimStep === "email" && (<>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:TEXT,marginBottom:6}}>Send to my email</div>
            <div style={{fontSize:13,color:SUB,lineHeight:1.6,marginBottom:16}}>
              We'll send a claim link valid for <strong>7 days</strong>. Click it any time to register and save your badge.
            </div>
            <div style={{background:SOFT,border:`1.5px solid ${MID}`,borderRadius:12,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:24}}>{badge.svgData?<img src={badge.svgData} alt="" style={{width:24,height:24}}/>:badge.icon}</span>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:TEXT}}>{badge.label}</div>
            </div>
            <Inp type="email" placeholder="your@email.com" value={claimEmail} onChange={e=>{setClaimEmail(e.target.value);setClaimEmailErr("");}} style={{marginBottom:claimEmailErr?6:12}} onKeyDown={e=>e.key==="Enter"&&handleEmailClaim()}/>
            {claimEmailErr && <div style={{fontSize:12,color:"#EF4444",marginBottom:10,fontWeight:600}}>{claimEmailErr}</div>}
            <button onClick={handleEmailClaim} disabled={!claimEmail.trim()||claimEmailBusy}
              style={{width:"100%",padding:"13px 0",background:claimEmail.trim()?GRAD:BG,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:claimEmail.trim()?"#fff":SUB,cursor:claimEmail.trim()?"pointer":"not-allowed",marginBottom:10,opacity:claimEmailBusy?.6:1}}>
              {claimEmailBusy?"Sending…":"Send Claim Link →"}
            </button>
            <button onClick={()=>setBadgeClaimStep("prompt")} style={{width:"100%",padding:"10px 0",background:"none",border:"none",fontSize:13,color:SUB,cursor:"pointer",fontFamily:"Poppins,sans-serif"}}>← Back</button>
          </>)}
          {badgeClaimStep === "sent" && (<>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:56,marginBottom:14}}>📬</div>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:8}}>Check your inbox!</div>
              <div style={{fontSize:14,color:SUB,lineHeight:1.65,marginBottom:6}}>We sent a claim link to<br/><strong style={{color:TEXT}}>{claimEmail}</strong></div>
              <div style={{fontSize:13,color:SUB,marginBottom:24}}>Link is valid for <strong>7 days</strong>. Click it to register and claim your badge.</div>
              <button onClick={()=>setBadgeClaimStep("idle")} style={{padding:"12px 32px",background:GRAD,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer"}}>Got it!</button>
            </div>
          </>)}
          {badgeClaimStep === "loginClaim" && (<>
            <div style={{background:SOFT,border:`1.5px solid ${MID}`,borderRadius:12,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:28}}>{badge.svgData?<img src={badge.svgData} alt="" style={{width:28,height:28}}/>:badge.icon}</span>
              <div><div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:TEXT}}>{badge.label}</div><div style={{fontSize:12,color:SUB}}>Log in or register to claim</div></div>
            </div>
            <Auth onDone={async(user)=>{ await claimWithLogin(user); }} claimContext="Save your badge to your Teticoin profile."/>
            <button onClick={()=>setBadgeClaimStep("prompt")} style={{width:"100%",marginTop:10,padding:"10px 0",background:"none",border:"none",fontSize:13,color:SUB,cursor:"pointer",fontFamily:"Poppins,sans-serif"}}>← Back</button>
          </>)}
        </div>
      </div>
    );
  };

  // Optional login modal
  const OptionalLoginModal = () => (
    <div style={{position:"fixed",inset:0,zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"rgba(26,10,20,.5)",backdropFilter:"blur(4px)"}}>
      <div style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:420,padding:"24px 24px 40px",animation:"slideUp .25s ease"}}>
        <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 20px"}}/>
        {linkedUid ? (
          <div style={{textAlign:"center"}}>
            <div style={{width:56,height:56,borderRadius:16,background:`${GREEN}15`,border:`1.5px solid ${GREEN}40`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:6}}>Account linked!</div>
            <div style={{fontSize:14,color:SUB,lineHeight:1.6,marginBottom:20}}>
              You're now logged in as <strong style={{color:TEXT}}>{linkedName}</strong>.<br/>
              Your coins will be saved to your account.
            </div>
            <button onClick={()=>setLoginModal(false)} style={{width:"100%",padding:"13px 0",background:GRAD,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer"}}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:4}}>Save your progress</div>
            <div style={{fontSize:13,color:SUB,lineHeight:1.6,marginBottom:20}}>Log in to keep your coins and number across sessions.</div>
            <button onClick={(e)=>handleOptionalLogin(e,"google")} disabled={loginBusy}
              style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"12px 0",background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:TEXT,cursor:loginBusy?"not-allowed":"pointer",marginBottom:10,opacity:loginBusy?.6:1}}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {loginBusy ? "Logging in…" : "Continue with Google"}
            </button>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{flex:1,height:1,background:BORDER}}/><span style={{fontSize:12,color:SUB}}>or email</span><div style={{flex:1,height:1,background:BORDER}}/>
            </div>
            <input placeholder="Email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)}
              type="email" autoComplete="email"
              style={{background:BG,border:`1.5px solid ${BORDER}`,borderRadius:12,padding:"11px 14px",fontFamily:"Poppins,sans-serif",fontSize:14,color:TEXT,outline:"none",width:"100%",boxSizing:"border-box",marginBottom:8}}/>
            <div style={{position:"relative",marginBottom:loginErr?8:12}}>
              <input placeholder="Password" value={loginPass} onChange={e=>setLoginPass(e.target.value)}
                type={showLoginPw?"text":"password"} autoComplete="current-password"
                onKeyDown={e=>e.key==="Enter"&&handleOptionalLogin(null,"email")}
                style={{background:BG,border:`1.5px solid ${BORDER}`,borderRadius:12,padding:"11px 44px 11px 14px",fontFamily:"Poppins,sans-serif",fontSize:14,color:TEXT,outline:"none",width:"100%",boxSizing:"border-box"}}/>
              <button type="button" onMouseDown={e=>{e.preventDefault();setShowLoginPw(v=>!v);}}
                style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:SUB,padding:4,display:"flex",alignItems:"center"}}>
                {showLoginPw
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {loginErr && <div style={{fontSize:12,color:"#EF4444",fontWeight:600,marginBottom:10}}>{loginErr}</div>}
            <button onClick={(e)=>handleOptionalLogin(e,"email")} disabled={loginBusy||!loginEmail.trim()||!loginPass}
              style={{width:"100%",padding:"13px 0",background:loginEmail.trim()&&loginPass?GRAD:BG,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:loginEmail.trim()&&loginPass?"#fff":SUB,cursor:loginEmail.trim()&&loginPass?"pointer":"not-allowed",marginBottom:10,opacity:loginBusy?.6:1}}>
              {loginBusy ? "Logging in…" : "Log in"}
            </button>
            {loginErr && <div style={{fontSize:12,color:SUB,textAlign:"center"}}><a href="https://teticoin.tetikus.com.my" target="_blank" rel="noopener noreferrer" style={{color:PINK}}>Don't have an account? Sign up →</a></div>}
            <button onClick={()=>setLoginModal(false)} style={{width:"100%",marginTop:6,padding:"10px 0",background:"none",border:"none",fontSize:13,color:SUB,cursor:"pointer",fontFamily:"Poppins,sans-serif"}}>Skip for now</button>
          </>
        )}
      </div>
    </div>
  );

  // Login banner shown in joined view
  const LoginBanner = () => linkedUid ? (
    <div style={{width:"100%",background:`${GREEN}12`,border:`1.5px solid ${GREEN}30`,borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:32,height:32,borderRadius:10,background:`${GREEN}20`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:TEXT}}>Logged in as {linkedName}</div>
        <div style={{fontSize:11,color:SUB,marginTop:1}}>Your coins & badges are being saved</div>
      </div>
    </div>
  ) : showLoginBanner ? (
    <div style={{width:"100%",background:`linear-gradient(135deg,${PURPLE}10,${PINK}08)`,border:`1.5px solid ${PURPLE}25`,borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:32,height:32,borderRadius:10,background:`${PURPLE}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/><path d="M12 12v4"/><path d="M10 15h4"/></svg>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:TEXT}}>Save your progress</div>
        <div style={{fontSize:11,color:SUB,marginTop:1}}>Log in to keep your coins &amp; number across sessions</div>
      </div>
      <button onClick={()=>setLoginModal(true)}
        style={{flexShrink:0,padding:"6px 14px",background:GRAD,border:"none",borderRadius:9,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:12,color:"#fff",cursor:"pointer",whiteSpace:"nowrap"}}>
        Log in
      </button>
      <button onClick={()=>setShowLoginBanner(false)} style={{background:"none",border:"none",cursor:"pointer",color:SUB,fontSize:16,padding:2,flexShrink:0,lineHeight:1}}>×</button>
    </div>
  ) : null;

  useEffect(() => {
    if (step === "directjoin") directJoin();
    if (step === "directjoin_new") directJoin(name.trim() + " 2");
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const me = live?.participants?.find(p => p.id === myId);
  const sorted = [...(live?.participants||[])].sort((a,b) => b.total - a.total);
  const myRank = sorted.findIndex(p => p.id === myId) + 1;
  const myUid = linkedUid || auth.currentUser?.uid || null;
  const isMeAssignedCM = myUid && (live?.coinmasterUids||[]).includes(myUid);

  // If assigned as coinmaster, show CoinmasterView instead of normal participant view
  if (step === "joined" && isMeAssignedCM) {
    return <CoinmasterView session={live} onBack={()=>{ setMyId(null); setStep("name"); }}/>;
  }

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
            }} style={{padding:"16px 8px",borderRadius:12,border:`1px solid ${BORDER}`,background:k==="\u232B"?SOFT:"#fff",cursor:k===""?"default":"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:20,color:k==="\u232B"?PINK:TEXT,transition:"transform .08s"}}
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
      {loginModal && <OptionalLoginModal/>}
      <BadgeClaimPrompt/>
      <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:20,padding:"32px 24px",maxWidth:380,width:"100%",textAlign:"center"}}>
        {content}
      </div>
    </div>
  );

  if (step === "name") return card(<>
    <Ham size={60}/>
    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:24,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginTop:6,marginBottom:4,lineHeight:1.1}}>Join Session</div>
    <div style={{background:SOFT,border:`1px solid ${MID}`,borderRadius:10,padding:"6px 16px",margin:"10px auto 20px",display:"inline-block"}}>
      <div style={{fontSize:10,color:SUB,fontWeight:600}}>Session</div>
      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,letterSpacing:4,color:PINK}}>{live?.code}</div>
    </div>
    <Inp placeholder="Your full name" value={name} onChange={e=>setName(e.target.value)}
      onKeyDown={e=>e.key==="Enter"&&checkName()} style={{textAlign:"center",marginBottom:12}}/>
    <PBtn full onClick={checkName} disabled={!name.trim()}>Continue</PBtn>
    <button onClick={()=>setLoginModal(true)} style={{marginTop:12,background:"none",border:"none",fontSize:12,color:PINK,cursor:"pointer",fontFamily:"Poppins,sans-serif",fontWeight:600,textDecoration:"underline",textUnderlineOffset:3}}>
      Log in / Register to save progress
    </button>
  </>);

  if (step === "hostblocked") return card(<>
    <div style={{width:64,height:64,borderRadius:20,background:"#FFF7ED",border:"2px solid #FED7AA",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </div>
    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:TEXT,textAlign:"center",marginBottom:8}}>You're the host</div>
    <div style={{fontSize:13,color:SUB,textAlign:"center",lineHeight:1.7}}>You created this session. Hosts can't join as participants in their own session.</div>
  </>);

  if (step === "full") return card(<>
    <div style={{width:64,height:64,borderRadius:20,background:"#FEF2F2",border:"2px solid #EF444430",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
    </div>
    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:TEXT,textAlign:"center",marginBottom:8}}>Session is full</div>
    <div style={{fontSize:13,color:SUB,textAlign:"center",lineHeight:1.7}}>This session has reached its participant limit. Please ask the host to upgrade to Pro for more spots.</div>
  </>);

  if (step === "returning") return card(<>
    <div style={{width:64,height:64,borderRadius:20,background:SOFT,border:`2px solid ${MID}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
      <Av s={returnMatch.av} color={PINK} size={44}/>
    </div>
    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:6}}>Welcome back!</div>
    <div style={{fontSize:14,color:SUB,marginBottom:6,lineHeight:1.6}}>
      We found <strong style={{color:TEXT}}>{returnMatch.name}</strong> in this session.
    </div>
    <div style={{background:SOFT,border:`1px solid ${MID}`,borderRadius:12,padding:"10px 16px",marginBottom:20,display:"inline-flex",alignItems:"center",gap:10}}>
      <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:PINK}}>{pNum(returnMatch.num)}</span>
      <span style={{fontSize:13,color:TEXT,fontWeight:600}}>{returnMatch.total} coins</span>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <PBtn full onClick={confirmReturn}>Yes, that's me →</PBtn>
      <button onClick={notMe} style={{padding:"12px 0",background:"none",border:`1px solid ${BORDER}`,borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:SUB,cursor:"pointer"}}>
        Not me — I'm someone else
      </button>
    </div>
  </>);

  if (step === "pinentry") return card(<>
    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:6}}>Enter your PIN</div>
    <div style={{fontSize:13,color:SUB,marginBottom:20,lineHeight:1.6}}>
      {returnMatch.name} has a PIN set.<br/>Enter it to rejoin.
    </div>
    <PinPad value={pinInput} onChange={setPinInput} length={4}/>
    {pinError && <div style={{marginTop:12,fontSize:13,color:"#EF4444",fontWeight:600}}>{pinError}</div>}
    <button onClick={verifyPin} disabled={pinInput.length<4}
      style={{width:"100%",marginTop:16,padding:"13px 0",background:pinInput.length===4?GRAD:BG,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:pinInput.length===4?"#fff":SUB,cursor:pinInput.length===4?"pointer":"not-allowed"}}>
      Confirm PIN
    </button>
    <button onClick={()=>setStep("name")} style={{marginTop:8,background:"none",border:"none",fontSize:13,color:SUB,cursor:"pointer",fontFamily:"Poppins,sans-serif"}}>\u2190 Back</button>
  </>);

  if (step === "newpin") return card(<>
    <div style={{width:48,height:48,borderRadius:14,background:`${PURPLE}15`,border:`1.5px solid ${PURPLE}35`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    </div>
    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:6}}>Set a PIN</div>
    <div style={{fontSize:13,color:SUB,marginBottom:20,lineHeight:1.6}}>
      Create a 4-digit PIN so you can rejoin and keep your coins &amp; number.
    </div>
    <PinPad value={pin} onChange={setPin} length={4}/>
    <button onClick={setNewPin} disabled={pin.length<4}
      style={{width:"100%",marginTop:16,padding:"13px 0",background:pin.length===4?GRAD:BG,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:pin.length===4?"#fff":SUB,cursor:pin.length===4?"pointer":"not-allowed"}}>
      Set PIN &amp; Join
    </button>
    <button onClick={skipPin} style={{marginTop:10,background:"none",border:"none",fontSize:13,color:SUB,cursor:"pointer",fontFamily:"Poppins,sans-serif",textDecoration:"underline"}}>
      Skip \u2014 join without PIN
    </button>
  </>);

  // Scoreboard view — host pushed boardVisible=true
  if (step === "joined" && live?.boardVisible) return (
    <div style={{minHeight:"100vh",background:"#0D0008",fontFamily:"Poppins,sans-serif",color:"#fff",padding:"24px 20px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      {loginModal && <OptionalLoginModal/>}
      <BadgeClaimPrompt/>
      <Confetti active/>
      <Ham size={56}/>
      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:24,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginTop:4,marginBottom:2,lineHeight:1.1}}>Scoreboard</div>
      <div style={{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:20}}>{live?.name}</div>
      <div style={{width:"100%",maxWidth:400,display:"flex",flexDirection:"column",gap:8}}>
        {sorted.map((p,i) => (
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",background:p.id===myId?"rgba(233,30,140,.18)":"rgba(255,255,255,.05)",borderRadius:14,border:p.id===myId?`1.5px solid ${PINK}66`:"1.5px solid rgba(255,255,255,.07)"}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:16,color:rankColor(i),minWidth:22}}>{i+1}</div>
            <Av s={p.av} color={live.groups?.find(g=>g.id===p.gid)?.color||PINK} size={34}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14}}>{p.name}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{pNum(p.num)}</div>
            </div>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:p.id===myId?PINK:"#fff"}}>{p.total}</div>
            {p.id===myId && <div style={{fontSize:10,background:PINK,color:"#fff",padding:"2px 8px",borderRadius:99,fontWeight:700}}>You</div>}
          </div>
        ))}
      </div>
      {/* Share button */}
      {me && (
        <div style={{marginTop:24,width:"100%",maxWidth:400}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,.4)",textAlign:"center",marginBottom:12}}>Share your result</div>
          <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
            {[
              {name:"WhatsApp", color:"#25D366", bg:"#25D366",
               icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
               url:`https://wa.me/?text=${encodeURIComponent(`I scored ${me.total} coins at "${live.name}" on Teticoin! 🎉 https://teticoin.tetikus.com.my`)}`},
              {name:"Facebook", color:"#1877F2", bg:"#1877F2",
               icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
               url:`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://teticoin.tetikus.com.my")}&quote=${encodeURIComponent(`I scored ${me.total} coins at "${live.name}" on Teticoin! 🎉`)}`},
              {name:"X", color:"#000", bg:"#000",
               icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L2.146 2.25H8.32l4.273 5.647L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>,
               url:`https://x.com/intent/tweet?text=${encodeURIComponent(`I scored ${me.total} coins at "${live.name}" on Teticoin! 🎉 https://teticoin.tetikus.com.my`)}`},
              {name:"Telegram", color:"#229ED9", bg:"#229ED9",
               icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
               url:`https://t.me/share/url?url=${encodeURIComponent("https://teticoin.tetikus.com.my")}&text=${encodeURIComponent(`I scored ${me.total} coins at "${live.name}" on Teticoin! 🎉`)}`},
              {name:"Copy", color:"#6B7280", bg:"#374151",
               icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
               url:null},
            ].map(s => (
              <button key={s.name} title={s.name}
                onClick={()=>{
                  if(s.url) window.open(s.url,"_blank");
                  else { navigator.clipboard?.writeText(`I scored ${me.total} coins at "${live.name}" on Teticoin! 🎉 https://teticoin.tetikus.com.my`); }
                }}
                style={{width:48,height:48,borderRadius:"50%",background:s.bg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 2px 8px ${s.bg}66`}}>
                {s.icon}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Main participant dashboard
  if (step === "joined") return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"Poppins,sans-serif",display:"flex",flexDirection:"column"}}>
      {loginModal && <OptionalLoginModal/>}
      {showEarnings && linkedUid && (
        <EarningsPage uid={linkedUid} name={me?.name||"You"} onClose={()=>setShowEarnings(false)}/>
      )}
      <BadgeClaimPrompt/>
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"0 16px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Ham size={28}/>
          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:16,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Teticoin</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* Earnings snippet — only shown when logged in */}
          {linkedUid && (
            <button onClick={()=>setShowEarnings(true)}
              title="My total earnings across all sessions"
              style={{display:"flex",alignItems:"center",gap:4,background:"none",border:`1px solid ${BORDER}`,borderRadius:9,padding:"5px 10px",cursor:"pointer",position:"relative",gap:6}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:12,color:PINK}}>{me?.total||0}</span>
              <span style={{fontSize:10,color:SUB,fontWeight:600}}>coins</span>
            </button>
          )}
          <button onClick={()=>setShowMyQR(v=>!v)}
            style={{display:"flex",alignItems:"center",gap:5,background:showMyQR?SOFT:"none",border:`1px solid ${showMyQR?PINK:BORDER}`,borderRadius:9,padding:"5px 10px",fontSize:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,color:showMyQR?PINK:SUB,cursor:"pointer"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3" rx=".5"/></svg>
            My QR
          </button>
          <div style={{background:SOFT,border:`1px solid ${MID}`,borderRadius:8,padding:"3px 10px",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:12,color:PINK,letterSpacing:1}}>
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
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:PINK,marginTop:10,letterSpacing:2}}>{pNum(me.num)}</div>
            <div style={{fontSize:12,color:SUB,marginTop:2}}>{me.name}</div>
            <div style={{fontSize:11,color:SUB,marginTop:6,background:SOFT,borderRadius:8,padding:"4px 10px",display:"inline-block"}}>Show this to the host to earn coins</div>
          </div>
        )}

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,width:"100%"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
            <div style={{background:SOFT,border:`1.5px solid ${MID}`,borderRadius:12,padding:"6px 18px",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:16,color:PINK,letterSpacing:3,flexShrink:0}}>
              {me ? pNum(me.num) : "—"}
            </div>
            {editingName ? (
              <div style={{display:"flex",gap:6,flex:1,minWidth:0}}>
                <input autoFocus value={editNameVal} onChange={e=>setEditNameVal(e.target.value)}
                  onKeyDown={e=>{
                    if(e.key==="Enter"&&editNameVal.trim()){
                      const newName=editNameVal.trim();
                      const u={...live,participants:live.participants.map(p=>p.id===myId?{...p,name:newName,av:mkAv(newName)}:p)};
                      setLive(u); ssSession(init.code,u); setEditingName(false);
                    }
                    if(e.key==="Escape") setEditingName(false);
                  }}
                  style={{flex:1,minWidth:0,padding:"6px 10px",border:`1.5px solid ${PINK}`,borderRadius:9,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:16,color:TEXT,outline:"none"}}/>
                <button onClick={()=>{
                  if(!editNameVal.trim()){setEditingName(false);return;}
                  const newName=editNameVal.trim();
                  const u={...live,participants:live.participants.map(p=>p.id===myId?{...p,name:newName,av:mkAv(newName)}:p)};
                  setLive(u); ssSession(init.code,u); setEditingName(false);
                }} style={{padding:"0 12px",background:GRAD,border:"none",borderRadius:9,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer",flexShrink:0}}>Save</button>
                <button onClick={()=>setEditingName(false)} style={{padding:"0 10px",background:"none",border:`1px solid ${BORDER}`,borderRadius:9,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:13,color:SUB,cursor:"pointer",flexShrink:0}}>✕</button>
              </div>
            ) : (
              <div style={{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:0}}>
                <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:18,color:TEXT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{me?.name||"—"}</div>
                <button onClick={()=>{setEditNameVal(me?.name||"");setEditingName(true);}}
                  title="Edit name"
                  style={{background:"none",border:"none",cursor:"pointer",color:SUB,padding:"2px 4px",flexShrink:0,lineHeight:1}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
            )}
          </div>
          {!editingName && (linkedUid ? (
            <button onClick={switchBackToGuestName} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:10,padding:"8px 10px",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:12,color:SUB,cursor:"pointer",flexShrink:0}}>
              Use typed name
            </button>
          ) : (
            <button onClick={()=>setLoginModal(true)} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:10,padding:"8px 10px",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:12,color:PINK,cursor:"pointer",flexShrink:0}}>
              Log in
            </button>
          ))}
        </div>

        <LoginBanner/>

        {/* Earned badges — shown if logged in */}
        {linkedUid && <ParticipantBadges uid={linkedUid}/>}

        <div style={{width:"100%",background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:20,padding:"28px 24px",textAlign:"center",boxShadow:`0 4px 24px ${PINK}10`}}>
          <div style={{fontSize:11,fontWeight:700,color:SUB,marginBottom:6,letterSpacing:.5,textTransform:"uppercase"}}>Your Teticoins</div>
          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:80,lineHeight:1,color:PINK,letterSpacing:-4}}>{me?.total||0}</div>
          <div style={{fontSize:13,color:SUB,marginTop:6,fontWeight:500}}>coins collected</div>
        </div>

        <div style={{width:"100%",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {ACTS.map(a => (
            <div key={a.id} style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:a.col}}>{me?.bk?.[a.id]||0}</div>
              <div style={{fontSize:10,color:SUB,fontWeight:600,lineHeight:1.3,marginTop:2}}>{a.label}</div>
            </div>
          ))}
        </div>

        <div style={{fontSize:12,color:SUB,textAlign:"center",lineHeight:1.8,marginTop:4}}>
          {sorted.length <= 1 ? "Waiting for others to join..." : "Scoreboard will appear when host shares it"}
        </div>
      </div>
    </div>
  );

  return <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}><Ham size={60}/></div>;
}



// ── ParticipantBadges — proper component so hooks are legal ──
function ParticipantBadges({ uid }) {
  const [badges, setBadges] = useState([]);
  useEffect(() => {
    if (uid) fsGet(uid, "badges").then(b => { if (b) setBadges(b); });
  }, [uid]);
  if (!badges.length) return null;
  return (
    <div style={{width:"100%",background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"14px 16px"}}>
      <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Your Badges</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {badges.map((b,i) => (
          <div key={i} title={`${b.label} · ${b.sessionName||""}`}
            style={{display:"flex",alignItems:"center",gap:5,background:`${b.color||PINK}12`,border:`1.5px solid ${b.color||PINK}30`,borderRadius:999,padding:"5px 12px"}}>
            {b.svgData?<img src={b.svgData} alt="" style={{width:16,height:16}}/>:<span style={{fontSize:14}}>{b.icon}</span>}
            <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:12,color:b.color||PINK}}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
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
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:26,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Teticoin</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.3)",letterSpacing:2,textTransform:"uppercase",marginTop:2}}>{session.name} · {session.code}</div>
          </div>
        </div>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"8px 16px",color:"rgba(255,255,255,.6)",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:13,cursor:"pointer"}}>Back</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Individual</div>
          {sorted.map((p,i) => (
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:i===0?"rgba(233,30,140,.1)":"rgba(255,255,255,.04)",borderRadius:13,marginBottom:8,border:`1px solid ${i===0?"rgba(233,30,140,.2)":"rgba(255,255,255,.06)"}`}}>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:15,color:rankColor(i),minWidth:22,textAlign:"center"}}>{i+1}</div>
              <Av s={p.av} color={session.groups.find(g=>g.id===p.gid)?.color||PINK} size={36}/>
              <div style={{flex:1}}>
                <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:"#fff"}}>{p.name}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>{pNum(p.num)}</div>
              </div>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,color:i===0?PINK:"#fff"}}>{p.total}</div>
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
                  <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:16,color:g.color}}>{g.name}</span>
                </div>
                <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,color:g.color}}>{g.total}</span>
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
function QRModal({ session, onClose }) {
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
    <div className="tc-modal-backdrop" style={{position:"fixed",inset:0,zIndex:420}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(26,10,20,.45)",backdropFilter:"blur(3px)"}}/>
      <div className="tc-modal-sheet" style={{background:"#fff",animation:"slideUp .25s ease"}}>
        <div style={{padding:"14px 20px 0",flexShrink:0}}>
          <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT}}>Share Session</div>
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
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,letterSpacing:6,color:PINK,marginBottom:6}}>{session.code}</div>
            <div style={{fontSize:11,color:SUB,fontWeight:500,marginBottom:8}}>{url}</div>
            <div style={{fontSize:12,color:PINK,fontWeight:600,background:SOFT,border:`1px solid ${MID}`,borderRadius:8,padding:"4px 12px"}}>Show this screen to participants to scan</div>
          </div>
          {/* Copy buttons */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button onClick={()=>copy(url,"link")} style={{padding:"13px 0",background:copied==="link"?`${GREEN}15`:SOFT,border:`1.5px solid ${copied==="link"?GREEN:MID}`,borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:copied==="link"?GREEN:PINK,cursor:"pointer",transition:"all .2s"}}>
              {copied==="link"?"Copied!":"Copy Link"}
            </button>
            <button onClick={()=>copy(session.code,"code")} style={{padding:"13px 0",background:copied==="code"?`${GREEN}15`:BG,border:`1.5px solid ${copied==="code"?GREEN:BORDER}`,borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:copied==="code"?GREEN:TEXT,cursor:"pointer",transition:"all .2s"}}>
              {copied==="code"?"Copied!":"Copy Code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Scoreboard sheet ──
function LeaderSheet({ session, onToggleBoard, onClose }) {
  const sorted = [...session.participants].sort((a,b)=>b.total-a.total);
  const gs = session.groups.map(g=>({...g,total:session.participants.filter(p=>p.gid===g.id).reduce((s,p)=>s+p.total,0),members:session.participants.filter(p=>p.gid===g.id)})).sort((a,b)=>b.total-a.total);
  const maxP = sorted[0]?.total||1;
  return (
    <div className="tc-modal-backdrop" style={{position:"fixed",inset:0,zIndex:420}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(26,10,20,.45)",backdropFilter:"blur(3px)"}}/>
      <div className="tc-modal-sheet" style={{background:"#fff",maxHeight:"88vh",display:"flex",flexDirection:"column",animation:"slideUp .25s ease"}}>
        <div style={{padding:"14px 20px 0",flexShrink:0}}>
          <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 14px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT}}>Scoreboard</div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:SUB,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          {/* Board visibility toggle — lives here */}
          <div onClick={onToggleBoard}
            style={{background:session.boardVisible?`${GREEN}12`:`${PINK}08`,border:`1.5px solid ${session.boardVisible?GREEN:BORDER}`,borderRadius:13,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:12,transition:"all .2s"}}>
            <div>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:session.boardVisible?GREEN:TEXT}}>
                {session.boardVisible?"Scoreboard visible to participants":"Scoreboard hidden from participants"}
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
                    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:15,color:rankColor(i),minWidth:20,textAlign:"center"}}>{i+1}</div>
                    <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:11,color:SUB,minWidth:30}}>{pNum(p.num)}</span>
                    <Av s={p.av} color={grp?.color||PINK} size={34}/>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:TEXT}}>{p.name}</div>
                      {grp && <span style={{fontSize:10,background:`${grp.color}18`,border:`1px solid ${grp.color}30`,color:grp.color,padding:"1px 7px",borderRadius:99,fontWeight:700}}>{grp.name}</span>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,color:i===0?PINK:TEXT}}>{p.total}</div>
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
                    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:14,color:rankColor(i),minWidth:18}}>{i+1}</div>
                    <div style={{width:11,height:11,borderRadius:3,background:g.color,flexShrink:0}}/>
                    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:16,color:g.color}}>{g.name}</div>
                    <div style={{fontSize:11,color:SUB}}>{g.members.length} members</div>
                  </div>
                  <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,color:g.color}}>{g.total}</div>
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
      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:26,lineHeight:1,
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
          fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,
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
        cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,
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

// ── Coinmaster View ──
// Same award UI as host but read-only for settings/live/coin values
function CoinmasterView({ session: init, onBack }) {
  const [ses, setSes] = useState(init);
  const [tab, setTab] = useState("award");
  const [selId, setSelId] = useState(null);
  const [picker, setPicker] = useState(false);
  const [mass, setMass] = useState(false);
  const [anims, setAnims] = useState([]);
  const [confetti, setConfetti] = useState(false);
  const [toast, setToast] = useState(null);
  const [cAmt, setCAmt] = useState("");
  const aid = useRef(0);

  // Poll session every 3s
  useEffect(() => {
    const t = setInterval(async () => {
      const fresh = await sgSession(ses.code);
      if (fresh) setSes(fresh);
    }, 3000);
    return () => clearInterval(t);
  }, [ses.code]);

  // Save changes (only participant additions)
  function mut(fn) { setSes(prev => { const s = JSON.parse(JSON.stringify(prev)); fn(s); ssSession(s.code, s); return s; }); }
  function notify(m, type="ok") { setToast({m,type}); setTimeout(()=>setToast(null), 2200); }

  function award(pid, type, pts, mx = window.innerWidth/2, my = 300) {
    if (!pid) { notify("Select a participant first","warn"); return; }
    if (ses.live === false) { notify("Session is offline","warn"); return; }
    playSound(pts >= 100);
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

  function awardGuarded(type, pts, e) {
    if (!selId) { notify("Select a participant first","warn"); return; }
    award(selId, type, pts, e?.clientX, e?.clientY);
  }

  const sorted = [...ses.participants].sort((a,b)=>b.total-a.total);
  const selP = ses.participants.find(x=>x.id===selId);
  const IB = {background:"none",border:`1px solid ${BORDER}`,borderRadius:9,width:34,height:34,cursor:"pointer",color:SUB,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0};

  return (
    <div style={{height:"100vh",background:BG,fontFamily:"Poppins,sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <Confetti active={confetti}/>
      {anims.map(a => <FloatAnim key={a.id} {...a} onDone={()=>setAnims(p=>p.filter(x=>x.id!==a.id))}/>)}
      {toast && (
        <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",
          background:toast.type==="warn"?"#FFF3CD":TEXT,color:toast.type==="warn"?"#92400E":"#fff",
          padding:"10px 22px",borderRadius:12,fontSize:13,fontWeight:600,zIndex:9997,
          fontFamily:"Poppins,sans-serif",boxShadow:"0 8px 32px rgba(0,0,0,.22)",
          whiteSpace:"nowrap",animation:"slideUp .2s ease",
          border:toast.type==="warn"?`1px solid #F59E0B`:"none"}}>
          {toast.type==="warn"?"⚠️ ":""}{toast.m}
        </div>
      )}
      {picker && <Picker participants={sorted} groups={ses.groups} selId={selId} onSelect={setSelId} onClose={()=>setPicker(false)}/>}
      {mass && <MassGive participants={ses.participants} groups={ses.groups} onAward={award} onClose={()=>setMass(false)}/>}

      {/* TOP BAR */}
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"0 12px",display:"flex",alignItems:"center",gap:8,height:56,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:`1.5px solid ${BORDER}`,borderRadius:"50%",width:32,height:32,cursor:"pointer",color:SUB,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:0}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{flex:1,overflow:"hidden",minWidth:0,display:"flex",alignItems:"center"}}>
          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:15,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ses.name}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,background:ses.live!==false?SOFT:"#FEF2F2",border:`1px solid ${ses.live!==false?MID:"#EF444455"}`,borderRadius:20,padding:"5px 10px",flexShrink:0}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:ses.live!==false?GREEN:"#EF4444",animation:ses.live!==false?"pulse 2s infinite":"none"}}/>
          <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:11,color:ses.live!==false?PINK:"#EF4444",letterSpacing:.5}}>{ses.live!==false?"LIVE":"OFFLINE"}</span>
        </div>
        <button onClick={()=>setMass(true)} style={IB} title="Mass give coins">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </button>
      </div>

      {/* COINMASTER BADGE BAR */}
      <div style={{background:"#FAF5FF",borderBottom:`1px solid #EDE9FE`,padding:"6px 14px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <span style={{fontSize:9,fontWeight:800,color:"#fff",background:"#7C3AED",borderRadius:99,padding:"2px 10px",letterSpacing:.5,flexShrink:0}}>COINMASTER</span>
        <span style={{fontSize:11,color:"#7C3AED",fontWeight:600}}>You can award points and add participants</span>
      </div>

      {/* TABS */}
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,display:"flex",alignItems:"center",flexShrink:0}}>
        {[["award","Award"],["board","Board"],["log","Log"]].map(([id,l]) => (
          <button key={id} onClick={()=>setTab(id)}
            style={{padding:"11px 16px",border:"none",background:"none",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,
              color:tab===id?PINK:SUB,cursor:"pointer",flexShrink:0,
              borderBottom:tab===id?`2.5px solid ${PINK}`:"2.5px solid transparent",transition:"all .12s"}}>{l}
          </button>
        ))}
        <div style={{marginLeft:"auto",paddingRight:14,display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:12,color:SUB}}>{ses.participants.length}</span>
        </div>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* PEOPLE TAB (mobile) */}
        {tab==="people" && (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {/* Two-column add row */}
            <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"10px 14px",flexShrink:0,display:"flex",gap:8,alignItems:"center"}}>
              <Inp placeholder="Participant Name" value={""} onChange={()=>{}}
                style={{flex:1,margin:0,pointerEvents:"none",opacity:0.5}}/>
              <button onClick={()=>setManage(true)}
                style={{padding:"0 14px",height:40,background:GRAD,border:"none",borderRadius:11,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer",flexShrink:0}}>
                + Add
              </button>
              <button onClick={()=>setShowQR(true)}
                style={{padding:"0 12px",height:40,background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:11,display:"flex",alignItems:"center",gap:5,cursor:"pointer",flexShrink:0}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3" rx=".5"/></svg>
                <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:12,color:TEXT,whiteSpace:"nowrap"}}>QR</span>
              </button>
            </div>
            {/* Participant list */}
            <div style={{flex:1,overflowY:"auto",padding:"10px 14px"}}>
              {sorted.length===0 ? (
                <div style={{textAlign:"center",padding:"32px 16px",color:SUB,fontSize:13}}>
                  <Ham size={48}/><div style={{marginTop:10}}>No participants yet</div>
                </div>
              ) : (
                <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,overflow:"hidden"}}>
                  {sorted.map(p => {
                    const grp = ses.groups.find(g=>g.id===p.gid);
                    return (
                      <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:`1px solid ${BORDER}`}}>
                        <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:11,color:SUB,minWidth:32,flexShrink:0}}>{pNum(p.num)}</span>
                        <Av s={p.av} color={grp?.color||PINK} size={32}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:13,color:TEXT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                          <div style={{fontSize:11,color:PINK,fontWeight:600}}>{p.total} coins</div>
                        </div>
                        {isPro && (
                          <select value={p.gid??""} onChange={e=>mut(s=>{const px=s.participants.find(x=>x.id===p.id);if(px)px.gid=e.target.value===""?null:Number(e.target.value);return s;})}
                            style={{background:SOFT,border:`1px solid ${MID}`,color:TEXT,borderRadius:8,padding:"4px 6px",fontSize:10,fontFamily:"Poppins,sans-serif",cursor:"pointer",outline:"none",maxWidth:72,flexShrink:0}}>
                            <option value="">No group</option>
                            {ses.groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                          </select>
                        )}
                        <button onClick={()=>mut(s=>{s.participants=s.participants.filter(x=>x.id!==p.id);return s;})}
                          style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:7,padding:"3px 8px",fontSize:11,color:p.total===0&&!p.uid?SUB:`${SUB}33`,cursor:p.total===0&&!p.uid?"pointer":"default",flexShrink:0}}
                          title={p.total===0&&!p.uid?"Remove":"Cannot remove — participant has joined"}
                          disabled={!(p.total===0&&!p.uid)}>
                          {p.total===0&&!p.uid?"✕":<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AWARD TAB */}
        {tab==="award" && (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"10px 14px",flexShrink:0}}>
              <button onClick={()=>setPicker(true)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,background:selP?SOFT:BG,border:`1.5px solid ${selP?PINK:BORDER}`,borderRadius:13,padding:"10px 14px",cursor:"pointer",textAlign:"left",transition:"all .12s"}}>
                {selP ? (
                  <>
                    <Av s={selP.av} color={ses.groups.find(g=>g.id===selP.gid)?.color||PINK} size={36}/>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:11,color:SUB}}>{pNum(selP.num)}</span>
                        <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:15,color:TEXT}}>{selP.name}</span>
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
                  </>
                )}
              </button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
              <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"14px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <SL style={{marginBottom:0}}>Give Coins</SL>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
                  {(ses.otherCoins||TV_DEFAULT).map((v,i) => (
                    <InlineCoinBtn key={i} value={v}
                      bg="#ffffff" border="#FECDE8" col={PINK} circle={true}
                      disabled={!selP}
                      onAward={e=>awardGuarded("token",v,e)}
                      onEdit={()=>{}}/>
                  ))}
                </div>
                <SL>Quick Coins</SL>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
                  {ACTS.map((a,i) => {
                    const pts = (ses.quickCoins||ACTS_DEFAULT.map(x=>x.pts))[i] ?? a.pts;
                    const palettes = [
                      {bg:"#FAF5FF",border:"#DDB6FF",num:"#7C3AED",fill:"#7C3AED"},
                      {bg:"#EEF4FF",border:"#C7D9FF",num:"#4F7CF6",fill:"#4F7CF6"},
                      {bg:"#EDFAF5",border:"#B3EDDA",num:"#1DB87A",fill:"#1DB87A"},
                    ];
                    return <QuickCoinBtn key={a.id} pts={pts} label={a.label} pal={palettes[i]} onAward={e=>awardGuarded(a.id,pts,e)}/>;
                  })}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input type="number" placeholder="Custom amount" value={cAmt} onChange={e=>setCAmt(e.target.value)}
                    style={{flex:1,background:BG,border:`1.5px solid ${BORDER}`,borderRadius:12,padding:"10px 12px",fontFamily:"Poppins,sans-serif",fontSize:13,color:TEXT,outline:"none"}}/>
                  <button onClick={e=>{if(!cAmt||isNaN(cAmt))return;awardGuarded("token",Number(cAmt),e);setCAmt("");}}
                    style={{padding:"0 14px",background:GRAD,border:"none",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>
                    Award
                  </button>
                </div>
              </div>
              {/* Locked features notice */}
              <div style={{background:"#F9FAFB",border:`1px solid #E5E7EB`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <div style={{fontSize:11,color:"#9CA3AF",fontWeight:500}}>Session settings, coin values &amp; live toggle are host-only</div>
              </div>
            </div>
          </div>
        )}

        {/* BOARD TAB */}
        {tab==="board" && (
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
            <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,overflow:"hidden"}}>
              {sorted.length===0 && <div style={{padding:48,textAlign:"center"}}><Ham size={70}/><div style={{marginTop:12,fontSize:13,color:SUB}}>No participants yet</div></div>}
              {sorted.map((p,i) => {
                const grp = ses.groups.find(g=>g.id===p.gid); const maxP = sorted[0]?.total||1;
                return (
                  <div key={p.id} onClick={()=>{setSelId(p.id);setTab("award");}} style={{padding:"12px 14px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",background:i===0?SOFT:"#fff",transition:".1s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:15,color:rankColor(i),minWidth:20,textAlign:"center"}}>{i+1}</div>
                      <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:11,color:SUB,minWidth:30}}>{pNum(p.num)}</span>
                      <Av s={p.av} color={grp?.color||PINK} size={34}/>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:TEXT}}>{p.name}</div>
                        {grp && <span style={{fontSize:10,background:`${grp.color}18`,border:`1px solid ${grp.color}30`,color:grp.color,padding:"1px 7px",borderRadius:99,fontWeight:700}}>{grp.name}</span>}
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,color:i===0?PINK:TEXT}}>{p.total}</div>
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

        {/* LOG TAB */}
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
                    <div style={{flex:1,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:TEXT}}>{item.name}</div>
                    <div style={{fontSize:12,color:SUB,fontWeight:500}}>{item.type==="token"?"Token":a?.label}</div>
                    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:14,color:col}}>+{item.pts}</div>
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

// ── Session screen ──
function Session({ session: init, plan="free", paxLimit=FREE_PAX_LIMIT, onBack, onPView }) {
  const isSesAdmin = plan === "superadmin";
  const isSuperadmin = plan === "superadmin";
  const isBeta = plan === "beta";
  const isPro = plan !== "free" || isSesAdmin; // superadmin + beta + paid = pro features
  const [ses, setSes] = useState(init);
  const [tab, setTab] = useState("award");       // mobile left panel tabs
  const [rightTab, setRightTab] = useState("award_all"); // desktop right panel tabs
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
  const [showBadgePicker, setShowBadgePicker] = useState(false);
  const [badgePickerTarget, setBadgePickerTarget] = useState(null);
  const [showLuckyDraw, setShowLuckyDraw] = useState(false);
              const [proGateHint, setProGateHint] = useState(null); // "customlabels" | "groups" | "coinmaster" | "massgive"

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
      // Record earning to participant's personal Firestore earnings history
      if (p.uid) {
        const now = Date.now();
        import("firebase/firestore").then(({getFirestore,doc,getDoc,setDoc})=>{
          const db = getFirestore();
          const ref = doc(db,"users",p.uid,"data","earnings");
          getDoc(ref).then(snap=>{
            const prev = snap.exists() ? (snap.data().value||[]) : [];
            // Find or create entry for this session
            const idx = prev.findIndex(e=>e.code===ses.code);
            let updated;
            if (idx>=0) {
              updated = prev.map((e,i)=>i===idx?{...e,coins:e.coins+pts,lastUpdated:now}:e);
            } else {
              updated = [{code:ses.code,name:ses.name,coins:pts,joinedAt:now,lastUpdated:now},...prev];
            }
            setDoc(ref,{value:updated,updatedAt:now});
          }).catch(()=>{});
        }).catch(()=>{});
      }
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
    <div className="tc-app-shell">
      <Confetti active={confetti}/>
      {anims.map(a => <FloatAnim key={a.id} {...a} onDone={()=>setAnims(p=>p.filter(x=>x.id!==a.id))}/>)}
      {toast && (
        <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",
          background:toast.type==="warn"?"#FFF3CD":TEXT,color:toast.type==="warn"?"#92400E":"#fff",
          padding:"10px 22px",borderRadius:12,fontSize:13,fontWeight:600,zIndex:9997,
          fontFamily:"Poppins,sans-serif",boxShadow:"0 8px 32px rgba(0,0,0,.22)",
          whiteSpace:"nowrap",animation:"slideUp .2s ease",
          border:toast.type==="warn"?`1px solid #F59E0B`:"none"}}>
          {toast.type==="warn" ? "⚠️ " : ""}{toast.m}
        </div>
      )}
      {picker && <Picker participants={sorted} groups={ses.groups} selId={selId} onSelect={setSelId} onClose={()=>setPicker(false)}/>}
      {manage && <Manage session={ses} plan={plan} paxLimit={paxLimit} onUpdate={fn=>mut(fn)} onClose={()=>setManage(false)} onShowQR={()=>{setManage(false);setShowQR(true);}} onExport={()=>{}} onReset={()=>{}} onRename={renameSession} onToggleLive={toggleLive}/>}
      {showCoinCustomizer && <CoinCustomizer session={ses}
        onSave={cfg=>mut(s=>{s.quickCoins=cfg.quickCoins;s.otherCoins=cfg.otherCoins;})}
        onClose={()=>setShowCoinCustomizer(false)}/>}
      {proGateHint && (
        <div className="tc-modal-backdrop" style={{position:"fixed",inset:0,zIndex:800,backdropFilter:"blur(4px)",background:"rgba(26,10,20,.4)"}} onClick={()=>setProGateHint(null)}>
          <div className="tc-modal-sheet" style={{background:"#fff",padding:"28px 24px 32px",width:"100%"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 20px"}}/>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}>
                <svg width="40" height="34" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="m2.8373 20.9773c-.6083-3.954-1.2166-7.9079-1.8249-11.8619-.1349-.8765.8624-1.4743 1.5718-.9422 1.8952 1.4214 3.7903 2.8427 5.6855 4.2641.624.468 1.513.3157 1.9456-.3333l4.7333-7.1c.5002-.7503 1.6026-.7503 2.1028 0l4.7333 7.1c.4326.649 1.3216.8012 1.9456.3333 1.8952-1.4214 3.7903-2.8427 5.6855-4.2641.7094-.5321 1.7067.0657 1.5719.9422-.6083 3.954-1.2166 7.9079-1.8249 11.8619z" fill="#ffb743"/><path d="m27.7902 27.5586h-23.5804c-.758 0-1.3725-.6145-1.3725-1.3725v-3.015h26.3255v3.015c-.0001.758-.6146 1.3725-1.3726 1.3725z" fill="#ffb743"/></svg>
              </div>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:8}}>
                {proGateHint==="customlabels"?"Custom Coin Labels":proGateHint==="groups"?"Groups & Team Scoring":proGateHint==="massgive"?"Mass Give Coins":"Coinmaster Mode"} is Pro
              </div>
              <div style={{fontSize:14,color:SUB,lineHeight:1.7}}>
                {proGateHint==="customlabels"
                  ? "Rename award buttons to match your activity — Correct Answer, Participation, Teamwork and more."
                  : proGateHint==="groups"
                    ? "Organise participants into teams, assign groups, and track team scores on the scoreboard."
                    : proGateHint==="massgive"
                      ? <div style={{width:"100%"}}>
                          <div style={{marginBottom:12}}>Give coins to multiple participants at once. Three ways to use it:</div>
                          <div style={{background:"#fff",border:`1px solid ${BORDER}`,borderRadius:12,overflow:"hidden",marginBottom:0}}>
                            {[
                              ["Give to everyone","All participants get coins in one tap"],
                              ["Select by group","Reward a whole team at once"],
                              ["QR select","Participants scan to self-select for a reward"],
                            ].map(([label,desc],i,arr)=>(
                              <div key={label} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderBottom:i<arr.length-1?`1px solid ${BORDER}`:"none"}}>
                                <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:13,color:TEXT,minWidth:110,flexShrink:0}}>{label}</div>
                                <div style={{fontSize:12,color:SUB,lineHeight:1.5}}>{desc}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      : "Let a co-host award coins from their own device without giving them full host access."
                }
              </div>
            </div>
            <div style={{background:"#fff",border:`1px solid ${BORDER}`,borderRadius:12,padding:"12px 16px",marginBottom:20}}>
              {[["Custom coin labels","✗","✓"],["Groups & teams","✗","✓"],["Mass give coins","✗","✓"],["Participants","30","200"],["Sessions","3","∞"]].map(([f,free,pro])=>(
                <div key={f} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${BORDER}`}}>
                  <div style={{fontSize:13,color:TEXT,fontWeight:500}}>{f}</div>
                  <div style={{display:"flex",gap:24}}>
                    <div style={{fontSize:13,color:free==="✗"?"#EF4444":SUB,fontWeight:700,minWidth:36,textAlign:"center"}}>{free}</div>
                    <div style={{fontSize:13,color:PINK,fontWeight:700,minWidth:36,textAlign:"center"}}>{pro}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={()=>setProGateHint(null)} style={{width:"100%",padding:"14px 0",background:GRAD,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",marginBottom:10}}>Upgrade to Pro · RM 29/mo</button>
            <button onClick={()=>setProGateHint(null)} style={{width:"100%",padding:"10px 0",background:"none",border:"none",fontSize:13,color:SUB,cursor:"pointer"}}>Maybe later</button>
          </div>
        </div>
      )}
      {showQR && <QRModal session={ses} onClose={()=>setShowQR(false)}/>}
      {showLeader && <LeaderSheet session={ses} onToggle={()=>mut(s=>{s.boardVisible=!s.boardVisible;})} onClose={()=>setShowLeader(false)}/>}
      {showSettings && <SessionSettings session={ses}
        onRename={renameSession}
        onToggleLive={toggleLive}
        onDuplicate={()=>{
          const code=genCode();
          const dup={...JSON.parse(JSON.stringify(ses)),code,name:`${ses.name} (Copy)`,
            participants:[],log:[],boardVisible:false,live:true,coinmasterEnabled:false};
          ssSession(code, dup); notify("Session duplicated"); setShowSettings(false);
        }}
        onArchive={()=>{
          if(!window.confirm("Archive this session?")) return;
          mut(s=>{s.live=false;s.archived=true;}); setShowSettings(false); onBack();
        }}
        onExport={()=>{
          const rows=[["#","Name","Group","Total"]];
          [...ses.participants].sort((a,b)=>b.total-a.total).forEach(p=>{
            const g=ses.groups.find(g=>g.id===p.gid);
            rows.push([pNum(p.num),p.name,g?.name||"",p.total]);
          });
          const a=document.createElement("a");
          a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(rows.map(r=>r.join(",")).join("\n"));
          a.download=`teticoin-${ses.code}.csv`; a.click();
        }}
        onReset={()=>{
          if(!window.confirm("Reset all coins?")) return;
          mut(s=>{s.participants=s.participants.map(p=>({...p,total:0,bk:{},hist:[]}));s.log=[];});
          notify("All coins reset");
        }}
        onClose={()=>setShowSettings(false)}/>}
      {mass && <MassGive participants={ses.participants} groups={ses.groups} onAward={award} onClose={()=>setMass(false)}/>}
      {false && showLuckyDraw && <LuckyDraw participants={ses.participants} onClose={()=>setShowLuckyDraw(false)}/>}
      {false && showBadgePicker && badgePickerTarget && (
        <BadgePickerModal
          participant={badgePickerTarget}
          sessionName={ses.name}
          hostName={ses.hostName||"Host"}
          onAward={async(badge)=>{
            mut(s=>{
              const p=s.participants.find(x=>x.id===badgePickerTarget.id);
              if(p) p.pendingBadge={...badge, awardedAt:new Date().toISOString()};
            });
            notify(`Badge awarded to ${badgePickerTarget.name} 🏅`);
            setShowBadgePicker(false); setBadgePickerTarget(null);
          }}
          onClose={()=>{setShowBadgePicker(false);setBadgePickerTarget(null);}}
        />
      )}

      {/* Go Offline confirm */}
      {confirmOffline && (
        <div className="tc-modal-backdrop" style={{position:"fixed",inset:0,zIndex:800}}>
          <div className="tc-modal-sheet" style={{background:"#fff",padding:"24px 24px 36px",width:"100%"}}>
            <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 18px"}}/>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:TEXT,marginBottom:6}}>Go Offline?</div>
            <div style={{fontSize:14,color:SUB,lineHeight:1.7,marginBottom:20}}>Participants won't be able to join or earn coins.<br/>All data is saved — you can go live again anytime.</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={goOffline} style={{width:"100%",padding:"13px 0",background:"#1A0A14",border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer"}}>Go Offline</button>
              <button onClick={()=>setConfirmOffline(false)} style={{width:"100%",padding:"13px 0",background:"none",border:`1px solid ${BORDER}`,borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:SUB,cursor:"pointer"}}>Stay Live</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div className="tc-session-topbar" style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"0 16px",display:"flex",alignItems:"center",gap:8,height:56,flexShrink:0}}>
        <button onClick={onBack} style={{...IB,borderRadius:"50%"}} title="Back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{flex:1,overflow:"hidden",minWidth:0,display:"flex",alignItems:"center"}}>
          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:16,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ses.name}</div>
        </div>
        <button onClick={toggleLive} title={isLive?"Go offline":"Go live"}
          style={{display:"flex",alignItems:"center",gap:5,background:isLive?SOFT:"#FEF2F2",border:`1px solid ${isLive?MID:"#EF444455"}`,borderRadius:20,padding:"5px 12px",cursor:"pointer",flexShrink:0}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:isLive?GREEN:"#EF4444",animation:isLive?"pulse 2s infinite":"none"}}/>
          <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:11,color:isLive?PINK:"#EF4444",letterSpacing:.5}}>{isLive?"LIVE":"OFFLINE"}</span>
        </button>
        <button onClick={()=>setShowQR(true)} style={IB} title="QR Code">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3" rx=".5"/></svg>
        </button>
        <button onClick={()=>setProj(true)} style={IB} title="Projector view">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </button>
        <button onClick={()=>setShowSettings(true)} style={IB} title="Settings">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>

      {/* ── MOBILE TABS (hidden on desktop) ── */}
      <div className="tc-tab-bar" style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,display:"flex",alignItems:"center",flexShrink:0}}>
        {[["people","Participants"],["award","Award"],["board","Scoreboard"],["groups",<span style={{display:"flex",alignItems:"center",gap:4}}>Groups<svg width="12" height="10" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="m2.8373 20.9773c-.6083-3.954-1.2166-7.9079-1.8249-11.8619-.1349-.8765.8624-1.4743 1.5718-.9422 1.8952 1.4214 3.7903 2.8427 5.6855 4.2641.624.468 1.513.3157 1.9456-.3333l4.7333-7.1c.5002-.7503 1.6026-.7503 2.1028 0l4.7333 7.1c.4326.649 1.3216.8012 1.9456.3333 1.8952-1.4214 3.7903-2.8427 5.6855-4.2641.7094-.5321 1.7067.0657 1.5719.9422-.6083 3.954-1.2166 7.9079-1.8249 11.8619z" fill="#ffb743"/><path d="m27.7902 27.5586h-23.5804c-.758 0-1.3725-.6145-1.3725-1.3725v-3.015h26.3255v3.015c-.0001.758-.6146 1.3725-1.3726 1.3725z" fill="#ffb743"/></svg></span>],["log","Log"]].map(([id,l]) => (
          <button key={id} onClick={()=>{
            if (!isLive) return;
            setTab(id);
            if (id==="board") setRightTab("board");
            else if (id==="groups") setRightTab("groups");
            else if (id==="log") setRightTab("log");
          }}
            style={{padding:"11px 12px",border:"none",background:"none",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,
              color:!isLive?`${SUB}55`:tab===id?PINK:SUB,cursor:isLive?"pointer":"default",flexShrink:0,
              borderBottom:tab===id&&isLive?`2.5px solid ${PINK}`:"2.5px solid transparent",transition:"all .12s"}}>{l}
          </button>
        ))}
        <div style={{marginLeft:"auto",paddingRight:8,flexShrink:0}}/>
      </div>

      {/* ── BODY: two columns on desktop, single column on mobile ── */}
      <div className="tc-session-body" style={{flex:1,display:"flex",overflow:"hidden",position:"relative"}}>

        {/* Offline overlay */}
        {!isLive && (
          <div style={{position:"absolute",inset:0,zIndex:20,background:"rgba(255,255,255,0.88)",backdropFilter:"blur(3px)",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{background:"#fff",border:`1.5px solid #EF444428`,borderRadius:20,padding:"32px 36px",textAlign:"center",maxWidth:320,boxShadow:"0 8px 40px rgba(0,0,0,.08)"}}>
              <div style={{width:52,height:52,borderRadius:16,background:"#FEF2F2",border:`1.5px solid #EF444430`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              </div>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:"#EF4444",marginBottom:6}}>Session Offline</div>
              <div style={{fontSize:13,color:SUB,marginBottom:20,lineHeight:1.6}}>Participants cannot join or earn coins.<br/>Go live to reactivate.</div>
              <button onClick={toggleLive} style={{width:"100%",padding:"12px 0",background:"#EF4444",border:"none",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer"}}>Go Live</button>
            </div>
          </div>
        )}

        {/* ── LEFT PANEL: Award ── */}
        <div className="tc-session-left" style={{display: tab!=="award" ? "none" : "flex", flexDirection:"column", overflow:"hidden"}}>
          {/* Participant selector */}
          <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"10px 14px",flexShrink:0}}>
            <button onClick={()=>isLive&&setPicker(true)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,background:selP?SOFT:BG,border:`1.5px solid ${selP?PINK:BORDER}`,borderRadius:13,padding:"10px 14px",cursor:isLive?"pointer":"default",textAlign:"left",transition:"all .12s"}}>
              {selP ? (
                <>
                  <Av s={selP.av} color={ses.groups.find(g=>g.id===selP.gid)?.color||PINK} size={36}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:11,color:SUB}}>{pNum(selP.num)}</span>
                      <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:15,color:TEXT}}>{selP.name}</span>
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
          {/* Award scrollable content */}
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
            <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"14px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <SL style={{marginBottom:0}}>Give Coins</SL>
                <button onClick={()=>{ if(!isPro){setProGateHint("customlabels");return;} setShowCoinCustomizer(true);}}
                  title={isPro?"Customise coin labels":"Customise coin labels (Pro)"}
                  style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,width:28,height:28,cursor:"pointer",color:SUB,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                </button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
                {(ses.otherCoins||TV_DEFAULT).map((v,i) => (
                  <InlineCoinBtn key={i} value={v}
                    bg="#ffffff" border="#FECDE8" col={PINK} circle={true}
                    onAward={e=>awardGuarded("token",v,e)}
                    onEdit={newV=>mut(s=>{const oc=[...(s.otherCoins||TV_DEFAULT)];oc[i]=newV;s.otherCoins=oc;})}/>
                ))}
              </div>
              <SL>Quick Coins</SL>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
                {ACTS.map((a,i) => {
                  const pts = (ses.quickCoins||ACTS_DEFAULT.map(x=>x.pts))[i] ?? a.pts;
                  const palettes = [
                    {bg:"#FAF5FF",border:"#DDB6FF",num:"#7C3AED",fill:"#7C3AED"},
                    {bg:"#EEF4FF",border:"#C7D9FF",num:"#4F7CF6",fill:"#4F7CF6"},
                    {bg:"#EDFAF5",border:"#B3EDDA",num:"#1DB87A",fill:"#1DB87A"},
                  ];
                  return <QuickCoinBtn key={a.id} pts={pts} label={a.label} pal={palettes[i]} onAward={e=>awardGuarded(a.id,pts,e)}/>;
                })}
              </div>
              <div style={{display:"flex",gap:8}}>
                <input type="number" placeholder="Custom amount" value={cAmt} onChange={e=>setCAmt(e.target.value)}
                  style={{flex:1,background:BG,border:`1.5px solid ${BORDER}`,borderRadius:12,padding:"10px 12px",fontFamily:"Poppins,sans-serif",fontSize:13,color:TEXT,outline:"none"}}/>
                <button onClick={e=>{if(!cAmt||isNaN(cAmt))return;awardGuarded("token",Number(cAmt),e);setCAmt("");}}
                  style={{padding:"0 14px",background:GRAD,border:"none",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>Award</button>
              </div>
            </div>
            {isPro ? (
              <button onClick={()=>setMass(true)} style={{width:"100%",padding:"14px 0",background:`linear-gradient(135deg,${PURPLE},#A855F7)`,border:"none",borderRadius:14,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Mass Give Coins
              </button>
            ) : (
              <button onClick={()=>setProGateHint("massgive")} style={{width:"100%",padding:"14px 0",background:`linear-gradient(135deg,${PINK},${PINK2})`,border:"none",borderRadius:14,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Mass Give Coins</span>
                <svg width="14" height="12" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="m2.8373 20.9773c-.6083-3.954-1.2166-7.9079-1.8249-11.8619-.1349-.8765.8624-1.4743 1.5718-.9422 1.8952 1.4214 3.7903 2.8427 5.6855 4.2641.624.468 1.513.3157 1.9456-.3333l4.7333-7.1c.5002-.7503 1.6026-.7503 2.1028 0l4.7333 7.1c.4326.649 1.3216.8012 1.9456.3333 1.8952-1.4214 3.7903-2.8427 5.6855-4.2641.7094-.5321 1.7067.0657 1.5719.9422-.6083 3.954-1.2166 7.9079-1.8249 11.8619z" fill="#ffb743"/><path d="m27.7902 27.5586h-23.5804c-.758 0-1.3725-.6145-1.3725-1.3725v-3.015h26.3255v3.015c-.0001.758-.6146 1.3725-1.3726 1.3725z" fill="#ffb743"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Award All / Board / Groups / Log ── */}
        <div className="tc-session-right" style={{display: tab==="award" ? "none" : "flex", flexDirection:"column", overflow:"hidden"}}>

          {/* Desktop right-panel tabs */}
          <div className="tc-right-tabs" style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,alignItems:"center",flexShrink:0,display:"none"}}>
            {[["people","Participants"],["award_all","Award All"],["board","Scoreboard"],["groups",<span style={{display:"flex",alignItems:"center",gap:4}}>Groups<svg width="12" height="10" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="m2.8373 20.9773c-.6083-3.954-1.2166-7.9079-1.8249-11.8619-.1349-.8765.8624-1.4743 1.5718-.9422 1.8952 1.4214 3.7903 2.8427 5.6855 4.2641.624.468 1.513.3157 1.9456-.3333l4.7333-7.1c.5002-.7503 1.6026-.7503 2.1028 0l4.7333 7.1c.4326.649 1.3216.8012 1.9456.3333 1.8952-1.4214 3.7903-2.8427 5.6855-4.2641.7094-.5321 1.7067.0657 1.5719.9422-.6083 3.954-1.2166 7.9079-1.8249 11.8619z" fill="#ffb743"/><path d="m27.7902 27.5586h-23.5804c-.758 0-1.3725-.6145-1.3725-1.3725v-3.015h26.3255v3.015c-.0001.758-.6146 1.3725-1.3726 1.3725z" fill="#ffb743"/></svg></span>],["log","Log"]].map(([id,l]) => (
              <button key={id} onClick={()=>setRightTab(id)}
                style={{padding:"11px 14px",border:"none",background:"none",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,
                  color:rightTab===id?PINK:SUB,cursor:"pointer",flexShrink:0,
                  borderBottom:rightTab===id?`2.5px solid ${PINK}`:"2.5px solid transparent",transition:"all .12s"}}>{l}
              </button>
            ))}
            <div style={{marginLeft:"auto",paddingRight:12,display:"flex",alignItems:"center",gap:4}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:12,color:SUB}}>{ses.participants.length}</span>
            </div>
          </div>

          {/* ── PEOPLE TAB (desktop) ── */}
          {rightTab==="people" && (
            <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
              {/* Two-column add row */}
              <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,alignItems:"center"}}>
                <Inp placeholder="Participant Name" value={""} onChange={()=>{}}
                  style={{margin:0,pointerEvents:"none",opacity:0.5}}/>
                <button onClick={()=>setManage(true)}
                  style={{padding:"0 16px",height:42,background:GRAD,border:"none",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer",whiteSpace:"nowrap"}}>
                  + Add
                </button>
                <button onClick={()=>setShowQR(true)}
                  style={{padding:"0 14px",height:42,background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:TEXT,cursor:"pointer",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3" rx=".5"/></svg>
                  Show QR
                </button>
              </div>
              {/* Participant list */}
              <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,overflow:"hidden"}}>
                {sorted.length===0 && (
                  <div style={{padding:"32px 16px",textAlign:"center",color:SUB,fontSize:13}}>
                    <Ham size={48}/><div style={{marginTop:10}}>No participants yet</div>
                  </div>
                )}
                {sorted.map(p => {
                  const grp = ses.groups.find(g=>g.id===p.gid);
                  return (
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:`1px solid ${BORDER}`}}>
                      <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:11,color:SUB,minWidth:36,flexShrink:0}}>{pNum(p.num)}</span>
                      <Av s={p.av} color={grp?.color||PINK} size={32}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:13,color:TEXT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                        <div style={{fontSize:11,color:PINK,fontWeight:600}}>{p.total} coins</div>
                      </div>
                      {isPro && (
                        <select value={p.gid??""} onChange={e=>mut(s=>{const px=s.participants.find(x=>x.id===p.id);if(px)px.gid=e.target.value===""?null:Number(e.target.value);return s;})}
                          style={{background:SOFT,border:`1px solid ${MID}`,color:TEXT,borderRadius:8,padding:"4px 6px",fontSize:11,fontFamily:"Poppins,sans-serif",cursor:"pointer",outline:"none",maxWidth:80,flexShrink:0}}>
                          <option value="">No group</option>
                          {ses.groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      )}
                      <button onClick={()=>mut(s=>{s.participants=s.participants.filter(x=>x.id!==p.id);return s;})}
                        style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:7,padding:"3px 8px",fontSize:11,color:p.total===0&&!p.uid?SUB:`${SUB}33`,cursor:p.total===0&&!p.uid?"pointer":"default",flexShrink:0}}
                        title={p.total===0&&!p.uid?"Remove":"Cannot remove — participant has joined"}
                        disabled={!(p.total===0&&!p.uid)}>
                        {p.total===0&&!p.uid?"✕":<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                      </button>
                    </div>
                  );
                })}
              </div>
              {/* Open manage for more options */}
            </div>
          )}

          {/* ── AWARD ALL TAB (desktop default) ── */}
          {rightTab==="award_all" && (
            <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
              {sorted.length === 0 ? (
                <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"36px 24px",textAlign:"center"}}>
                  <Ham size={56}/>
                  <div style={{marginTop:12,fontSize:13,color:SUB,marginBottom:20}}>No participants yet</div>
                  <div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:280,margin:"0 auto"}}>
                    <button onClick={()=>setShowQR(true)}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"13px 18px",background:SOFT,border:`1.5px solid ${MID}`,borderRadius:13,cursor:"pointer",textAlign:"left",transition:"all .15s"}}
                      onMouseOver={e=>{e.currentTarget.style.background=MID;}}
                      onMouseOut={e=>{e.currentTarget.style.background=SOFT;}}>
                      <div style={{width:36,height:36,borderRadius:10,background:GRAD,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3m0 4h4v-4m-4 0h4"/></svg>
                      </div>
                      <div>
                        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:TEXT}}>Show QR Code</div>
                        <div style={{fontSize:11,color:SUB,marginTop:1}}>Participants scan to join instantly</div>
                      </div>
                    </button>
                    <button onClick={()=>setManage(true)}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"13px 18px",background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:13,cursor:"pointer",textAlign:"left",transition:"all .15s"}}
                      onMouseOver={e=>{e.currentTarget.style.background=SOFT;e.currentTarget.style.borderColor=MID;}}
                      onMouseOut={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.borderColor=BORDER;}}>
                      <div style={{width:36,height:36,borderRadius:10,background:"#F3F0FF",border:`1.5px solid #DDD6FE`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                      </div>
                      <div>
                        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:TEXT}}>Add Manually</div>
                        <div style={{fontSize:11,color:SUB,marginTop:1}}>Host adds participant by name</div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,overflow:"hidden"}}>
                  <div style={{padding:"10px 14px",borderBottom:`1px solid ${BORDER}`,display:"flex",alignItems:"center",gap:8}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <SL style={{marginBottom:0}}>Award to Everyone</SL>
                    <span style={{fontSize:11,color:SUB,fontWeight:500,marginLeft:"auto"}}>Click a value to award</span>
                  </div>
                  {sorted.map((p,i) => {
                    const grp = ses.groups.find(g=>g.id===p.gid);
                    const coins = ses.otherCoins || TV_DEFAULT;
                    return (
                      <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderBottom:i<sorted.length-1?`1px solid ${BORDER}`:"none",transition:"background .1s"}}
                        onMouseOver={e=>e.currentTarget.style.background=SOFT}
                        onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:13,color:rankColor(i),minWidth:16,textAlign:"center",flexShrink:0}}>{i+1}</div>
                        <Av s={p.av} color={grp?.color||PINK} size={28}/>
                        <div style={{width:130,flexShrink:0}}>
                          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:13,color:TEXT,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                          <div style={{fontSize:10,color:PINK,fontWeight:700}}>{p.total} pts</div>
                        </div>
                        <div style={{display:"flex",gap:4,flexShrink:0,flexWrap:"nowrap"}}>
                          {coins.map((v,ci) => (
                            <button key={ci}
                              onClick={e=>{e.stopPropagation();award(p.id,"token",v,e.clientX,e.clientY);}}
                              style={{width:v>=100?42:36,height:34,borderRadius:8,border:`1.5px solid ${MID}`,background:"#fff",cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:v>=100?10:11,color:PINK,transition:"all .1s",flexShrink:0,padding:0}}
                              onMouseOver={e=>{e.currentTarget.style.background=SOFT;e.currentTarget.style.transform="scale(1.08)";e.currentTarget.style.borderColor=PINK;}}
                              onMouseOut={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor=MID;}}>
                              +{v}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── BOARD TAB ── */}
          {rightTab==="board" && (
            <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
              <div onClick={()=>mut(s=>{s.boardVisible=!s.boardVisible;})}
                style={{background:ses.boardVisible?`${GREEN}12`:`${PINK}08`,border:`1.5px solid ${ses.boardVisible?GREEN:BORDER}`,borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"all .2s"}}>
                <div>
                  <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:ses.boardVisible?GREEN:TEXT}}>{ses.boardVisible?"Board is live on participant devices":"Board is hidden from participants"}</div>
                  <div style={{fontSize:12,color:SUB,marginTop:2,fontWeight:500}}>Tap to {ses.boardVisible?"hide":"show"} scoreboard on participant screens</div>
                </div>
                <div style={{width:44,height:26,borderRadius:13,background:ses.boardVisible?GREEN:BORDER,position:"relative",transition:"all .2s",flexShrink:0,marginLeft:12}}>
                  <div style={{position:"absolute",top:3,left:ses.boardVisible?21:3,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.2)",transition:"left .2s"}}/>
                </div>
              </div>
              {/* Lucky Draw button — disabled, phase 2 feature */}
              {false && ses.boardVisible && (
                <button onClick={()=>setShowLuckyDraw(true)}
                  style={{width:"100%",padding:"11px 0",background:"linear-gradient(135deg,#1A0A14,#2D0A22)",border:"1.5px solid rgba(255,79,184,.3)",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:"#FF4FB8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s"}}
                  onMouseOver={e=>{e.currentTarget.style.borderColor="#FF4FB8";e.currentTarget.style.background="linear-gradient(135deg,#2D0A22,#3D0A30)";}}
                  onMouseOut={e=>{e.currentTarget.style.borderColor="rgba(255,79,184,.3)";e.currentTarget.style.background="linear-gradient(135deg,#1A0A14,#2D0A22)";}}>
                  🎡 <span>Lucky Draw Wheel</span>
                </button>
              )}
              <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,overflow:"hidden"}}>
                {sorted.length===0 && <div style={{padding:48,textAlign:"center"}}><Ham size={70}/><div style={{marginTop:12,fontSize:13,color:SUB}}>No participants yet</div></div>}
                {sorted.map((p,i) => {
                  const grp = ses.groups.find(g=>g.id===p.gid); const maxP = sorted[0]?.total||1;
                  const showBadgeBtn = false; // phase 2 — badge award deactivated
                  const showPending  = false; // phase 2
                  return (
                    <div key={p.id} style={{padding:"12px 14px",borderBottom:`1px solid ${BORDER}`,background:i===0?SOFT:"#fff",cursor:"pointer",transition:"background .1s"}}
                      onClick={()=>{setSelId(p.id);setTab("award");}}
                      onMouseOver={e=>e.currentTarget.style.background=SOFT}
                      onMouseOut={e=>e.currentTarget.style.background=i===0?SOFT:"#fff"}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:15,color:rankColor(i),minWidth:20,textAlign:"center"}}>{i+1}</div>
                        <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:11,color:SUB,minWidth:30}}>{pNum(p.num)}</span>
                        <Av s={p.av} color={grp?.color||PINK} size={34}/>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:TEXT}}>{p.name}</div>
                          </div>
                          {grp && <span style={{fontSize:10,background:`${grp.color}18`,border:`1px solid ${grp.color}30`,color:grp.color,padding:"1px 7px",borderRadius:99,fontWeight:700}}>{grp.name}</span>}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,justifyContent:"flex-end"}}>
                          <div style={{textAlign:"right",minWidth:56}}>
                            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,color:i===0?PINK:TEXT}}>{p.total}</div>
                            <div style={{fontSize:10,color:SUB}}>coins</div>
                          </div>
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

          {/* Groups */}
          {rightTab==="groups" && (
            <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
              {!isPro ? (
                <div style={{position:"relative",minHeight:300}}>
                  {/* Teaser dummy content */}
                  <div style={{pointerEvents:"none",userSelect:"none",display:"flex",flexDirection:"column",gap:10}}>
                    {[{name:"Team Alpha",color:GC[0],total:380,members:["Ahmad Faris","Nurul Ain"]},{name:"Team Bravo",color:GC[1],total:310,members:["Haziq Ibrahim","Siti Khadijah"]},{name:"Team Charlie",color:GC[2],total:180,members:["Darwisyah","Luqman"]}].map((g,i)=>(
                      <div key={g.name} style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"14px 16px",opacity:0.7}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:14,color:rankColor(i),minWidth:18}}>{i+1}</div>
                            <div style={{width:11,height:11,borderRadius:3,background:g.color,flexShrink:0}}/>
                            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:g.color}}>{g.name}</div>
                            <div style={{fontSize:11,color:SUB}}>{g.members.length} members</div>
                          </div>
                          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:g.color}}>{g.total}</div>
                        </div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                          {g.members.map(m=><span key={m} style={{fontSize:11,background:`${g.color}12`,border:`1px solid ${g.color}28`,color:g.color,padding:"2px 9px",borderRadius:99,fontWeight:700}}>{m}</span>)}
                        </div>
                        <div style={{height:4,background:BORDER,borderRadius:4,overflow:"hidden"}}>
                          <div style={{height:4,background:g.color,width:`${Math.round((g.total/380)*100)}%`,borderRadius:4}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Frosted upgrade overlay */}
                  <div style={{position:"absolute",inset:0,backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",background:"rgba(255,255,255,0.6)",borderRadius:12,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px",textAlign:"center"}}>
                    <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><svg width="36" height="30" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="m2.8373 20.9773c-.6083-3.954-1.2166-7.9079-1.8249-11.8619-.1349-.8765.8624-1.4743 1.5718-.9422 1.8952 1.4214 3.7903 2.8427 5.6855 4.2641.624.468 1.513.3157 1.9456-.3333l4.7333-7.1c.5002-.7503 1.6026-.7503 2.1028 0l4.7333 7.1c.4326.649 1.3216.8012 1.9456.3333 1.8952-1.4214 3.7903-2.8427 5.6855-4.2641.7094-.5321 1.7067.0657 1.5719.9422-.6083 3.954-1.2166 7.9079-1.8249 11.8619z" fill="#ffb743"/><path d="m27.7902 27.5586h-23.5804c-.758 0-1.3725-.6145-1.3725-1.3725v-3.015h26.3255v3.015c-.0001.758-.6146 1.3725-1.3726 1.3725z" fill="#ffb743"/></svg></div>
                    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:TEXT,marginBottom:6}}>Groups is a Pro feature</div>
                    <div style={{fontSize:13,color:SUB,lineHeight:1.6,marginBottom:16}}>See team scores on the scoreboard. Upgrade to unlock.</div>
                    <button onClick={()=>setProGateHint("groups")} style={{padding:"10px 24px",background:GRAD,border:"none",borderRadius:10,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>Upgrade to Pro →</button>
                  </div>
                </div>
              ) : <>
              {gs.length===0 && <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:32,textAlign:"center",fontSize:13,color:SUB}}>Create groups via the people icon in the top bar</div>}
              {gs.map((g,i) => (
                <div key={g.id} style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"14px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:14,color:rankColor(i),minWidth:18}}>{i+1}</div>
                      <div style={{width:11,height:11,borderRadius:3,background:g.color,flexShrink:0}}/>
                      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:16,color:g.color}}>{g.name}</div>
                      <div style={{fontSize:11,color:SUB}}>{g.members.length} members</div>
                    </div>
                    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,color:g.color}}>{g.total}</div>
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
          )}

          {/* Log */}
          {rightTab==="log" && (
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
                      <div style={{flex:1,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:TEXT}}>{item.name}</div>
                      <div style={{fontSize:12,color:SUB,fontWeight:500}}>{item.type==="token"?"Token":a?.label}</div>
                      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:14,color:col}}>+{item.pts}</div>
                      <div style={{fontSize:11,color:SUB}}>{item.t}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>{/* end right panel */}

      </div>{/* end body */}
    </div>
  );
}
// ── Lucky Draw Wheel ──────────────────────────────────────────────────────────
// ── Lucky Draw Wheel Modal ───────────────────────────────────────────────────
function LuckyDraw({ participants, badgeAwarded, onClose }) {
  const canvasRef = useRef(null);
  const spinRef   = useRef({ spinning:false, angle:0, velocity:0, raf:null });
  const [spinning,  setSpinning]  = useState(false);
  const [winner,    setWinner]    = useState(null);   // current pending winner
  const [removed,   setRemoved]   = useState([]);     // ids removed from wheel
  const [winners,   setWinners]   = useState([]);     // history list {name,av,pts,status}
  const [spinsLeft, setSpinsLeft] = useState(10);

  const COLORS = ["#FF4FB8","#9D50FF","#00E5FF","#00C48C","#F5A623","#EF4444","#3B82F6","#F97316","#8B5CF6","#06B6D4"];

  // Eligible = not in top 5 AND no pendingBadge AND not already removed
  const sorted   = [...participants].sort((a,b)=>b.total-a.total);
  const top5ids  = new Set(sorted.slice(0,5).map(p=>p.id));
  const badgeIds = new Set(participants.filter(p=>p.pendingBadge).map(p=>p.id));
  const eligible = participants.filter(p =>
    !top5ids.has(p.id) && !badgeIds.has(p.id) && !removed.includes(p.id)
  );

  // Weight tickets by coins, min 1 each
  const tickets      = eligible.map(p=>({...p, tickets:Math.max(1,Math.floor((p.total||0)/10))}));
  const totalTickets = tickets.reduce((s,p)=>s+p.tickets,0)||1;

  function drawWheel(angle) {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2, r = cx-10;
    ctx.clearRect(0,0,W,H);

    if (eligible.length === 0) {
      ctx.fillStyle = "#1A0A14";
      ctx.beginPath(); ctx.arc(cx,cy,r+8,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.3)";
      ctx.font = "bold 13px Plus Jakarta Sans,sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("No more eligible", cx, cy-10);
      ctx.fillText("participants", cx, cy+10);
      return;
    }

    // Outer glow ring
    ctx.beginPath(); ctx.arc(cx,cy,r+8,0,Math.PI*2);
    ctx.fillStyle = "#1A0A14"; ctx.fill();

    let start = angle;
    tickets.forEach((p,i) => {
      const slice = (p.tickets/totalTickets)*Math.PI*2;
      const color = COLORS[i%COLORS.length];
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,start,start+slice); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = "#0D0008"; ctx.lineWidth = 1.5; ctx.stroke();
      // Label
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(start+slice/2);
      ctx.textAlign="right"; ctx.fillStyle="#fff";
      const fs = Math.max(9, Math.min(13, 120/Math.max(eligible.length,1)));
      ctx.font = `bold ${fs}px Plus Jakarta Sans,sans-serif`;
      ctx.shadowColor="rgba(0,0,0,.6)"; ctx.shadowBlur=3;
      ctx.fillText(p.name.split(" ")[0], r-10, 4);
      ctx.restore();
      start += slice;
    });

    // Centre hub
    ctx.beginPath(); ctx.arc(cx,cy,24,0,Math.PI*2);
    ctx.fillStyle="#0D0008"; ctx.fill();
    ctx.strokeStyle="#FF4FB8"; ctx.lineWidth=2.5; ctx.stroke();
    ctx.font="16px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("🎡",cx,cy);

    // Pointer at top centre
    ctx.save(); ctx.translate(cx, 8);
    ctx.beginPath(); ctx.moveTo(0,20); ctx.lineTo(-8,0); ctx.lineTo(8,0); ctx.closePath();
    ctx.fillStyle="#FF4FB8";
    ctx.shadowColor="#FF4FB8"; ctx.shadowBlur=10;
    ctx.fill(); ctx.restore();
  }

  useEffect(()=>{ drawWheel(spinRef.current.angle); }, [eligible.length, removed.length]);

  function spin() {
    if (spinRef.current.spinning || eligible.length < 1 || spinsLeft <= 0 || winner) return;
    setSpinsLeft(n=>n-1);
    spinRef.current.spinning = true;
    spinRef.current.velocity = 0.28 + Math.random()*0.18;
    setSpinning(true);
    function animate() {
      const s = spinRef.current;
      s.angle += s.velocity; s.velocity *= 0.984;
      drawWheel(s.angle);
      if (s.velocity > 0.004) { s.raf = requestAnimationFrame(animate); }
      else {
        s.spinning = false; setSpinning(false);
        // Resolve winner
        const norm = ((s.angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
        const pointer = (Math.PI*2 - norm + Math.PI*1.5)%(Math.PI*2);
        let acc=0, won=tickets[0];
        for (const p of tickets) {
          acc += (p.tickets/totalTickets)*Math.PI*2;
          if (pointer < acc) { won=p; break; }
        }
        setWinner(won);
      }
    }
    animate();
  }

  function handleAward() {
    if (!winner) return;
    setWinners(h=>[{...winner, status:"awarded", t:new Date().toLocaleTimeString()},...h]);
    setRemoved(r=>[...r, winner.id]);
    setWinner(null);
  }
  function handleCancel() {
    if (!winner) return;
    setWinners(h=>[{...winner, status:"skipped", t:new Date().toLocaleTimeString()},...h]);
    setRemoved(r=>[...r, winner.id]);
    setWinner(null);
  }

  const canSpin = !spinning && !winner && eligible.length >= 1 && spinsLeft > 0;

  return (
    <div style={{position:"fixed",inset:0,zIndex:800,background:"rgba(13,0,8,.85)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
      <div style={{background:"#0D0008",borderRadius:24,border:"1.5px solid rgba(255,79,184,.2)",width:"100%",maxWidth:560,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,.7)"}}>

        {/* Header */}
        <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,79,184,.15)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:"#fff"}}>🎡 Lucky Draw</div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:12,color:"rgba(255,255,255,.4)",fontWeight:600}}>{spinsLeft} spins left</div>
            <button onClick={onClose} style={{width:30,height:30,borderRadius:8,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",color:"rgba(255,255,255,.6)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        </div>

        <div style={{display:"flex",flex:1,overflow:"hidden"}}>

          {/* Wheel + controls */}
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 12px",overflow:"auto"}}>

            {/* Info about eligible */}
            <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginBottom:10,textAlign:"center",lineHeight:1.5}}>
              Eligible: {eligible.length} participants · Top 5 &amp; badge recipients excluded<br/>
              <span style={{color:"rgba(255,79,184,.6)"}}>More coins = more chances</span>
            </div>

            {/* Canvas */}
            <canvas ref={canvasRef} width={240} height={240}
              style={{borderRadius:"50%",boxShadow:"0 0 40px rgba(255,79,184,.2)",flexShrink:0}}/>

            {/* Winner announcement */}
            {winner && (
              <div style={{width:"100%",marginTop:14,background:"rgba(255,79,184,.1)",border:"1.5px solid rgba(255,79,184,.3)",borderRadius:14,padding:"14px 16px",textAlign:"center",animation:"slideUp .3s ease"}}>
                <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.5)",letterSpacing:1,marginBottom:8,textTransform:"uppercase"}}>🎉 Winner!</div>
                <div style={{display:"flex",alignItems:"center",gap:12,justifyContent:"center",marginBottom:14}}>
                  <Av s={winner.av} color={PINK} size={40}/>
                  <div style={{textAlign:"left"}}>
                    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:"#fff"}}>{winner.name}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,.4)"}}>{winner.total} coins</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={handleAward}
                    style={{flex:1,padding:"11px 0",background:"linear-gradient(135deg,#FF4FB8,#9D50FF)",border:"none",borderRadius:10,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:"#fff",cursor:"pointer"}}>
                    ✓ Award &amp; Continue
                  </button>
                  <button onClick={handleCancel}
                    style={{flex:1,padding:"11px 0",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:10,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:"rgba(255,255,255,.6)",cursor:"pointer"}}>
                    ✕ Skip
                  </button>
                </div>
              </div>
            )}

            {/* Spin button */}
            {!winner && (
              <button onClick={spin} disabled={!canSpin}
                style={{width:"100%",marginTop:14,padding:"14px 0",background:canSpin?"linear-gradient(135deg,#FF4FB8,#9D50FF)":"rgba(255,255,255,.06)",border:"none",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:16,color:canSpin?"#fff":"rgba(255,255,255,.3)",cursor:canSpin?"pointer":"not-allowed",transition:"all .2s",boxShadow:canSpin?"0 4px 24px rgba(255,79,184,.4)":"none"}}>
                {spinning ? "Spinning…" : eligible.length===0 ? "No participants left" : spinsLeft===0 ? "Spin limit reached" : "🎲 SPIN"}
              </button>
            )}
          </div>

          {/* Winners history sidebar */}
          {winners.length > 0 && (
            <div style={{width:160,borderLeft:"1px solid rgba(255,79,184,.12)",padding:"12px 10px",overflowY:"auto",flexShrink:0}}>
              <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.3)",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Results</div>
              {winners.map((h,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:7,marginBottom:8,opacity:h.status==="skipped"?.5:1}}>
                  <Av s={h.av} color={PINK} size={24}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:11,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.name}</div>
                    <div style={{fontSize:9,color:h.status==="awarded"?"#00C48C":"rgba(255,255,255,.3)"}}>{h.status==="awarded"?"✓ Awarded":"✕ Skipped"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


function CreateModal({ onConfirm, onClose }) {
  const [n, setN] = useState("");
  return (
    <div className="tc-modal-backdrop" style={{position:"fixed",inset:0,background:"rgba(26,10,20,.5)",zIndex:600,backdropFilter:"blur(4px)"}}>
      <div className="tc-modal-sheet" style={{background:"#fff",padding:"28px 24px",width:"100%"}}>
        <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 20px"}}/>
        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:4}}>New Session</div>
        <div style={{fontSize:13,color:SUB,marginBottom:16}}>Give your session a name so you can find it later.</div>
        <Inp placeholder="e.g. Design Thinking Workshop" value={n} onChange={e=>setN(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&n.trim()&&onConfirm(n.trim())} style={{marginBottom:20}}/>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"13px 0",background:BG,border:`1.5px solid ${BORDER}`,borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:SUB,cursor:"pointer"}}>Cancel</button>
          <PBtn onClick={()=>n.trim()&&onConfirm(n.trim())} disabled={!n.trim()} style={{flex:2,padding:"13px 22px"}}>Start Session</PBtn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PLAN CONSTANTS
// ─────────────────────────────────────────────
const SUPERADMIN_EMAIL = "hi.tetikus@gmail.com";
const FREE_SESSION_LIMIT = 3;
const FREE_PAX_LIMIT = 30;
const PRO_PAX_LIMIT = 200;

const PLANS = {
  free:        { name:"Free",          price:0,   year:0,   color:SUB,   sessions:FREE_SESSION_LIMIT, participants:FREE_PAX_LIMIT },
  beta:        { name:"Beta Tester",   price:0,   year:0,   color:GREEN, sessions:999, participants:PRO_PAX_LIMIT },
  superadmin:  { name:"Superadmin",    price:0,   year:0,   color:PINK,  sessions:999, participants:999 },
  oneTime:     { name:"One Time",      price:29,  year:0,   color:BLUE,  sessions:999, participants:PRO_PAX_LIMIT },
  pro:         { name:"Pro",           price:29,  year:269, color:PINK,  sessions:999, participants:PRO_PAX_LIMIT },
};

// ── 1. Pricing Page ──────────────────────────
// ── Payment config ────────────────────────────────────────────────
// To update prices or links, edit PAYMENT_CONFIG only — nothing else needs changing
const PAYMENT_CONFIG = {
  fxRate: 4.70, // rough MYR→USD estimate for display only
  chip: {
    pro:     { monthly: "https://pay.chip-in.asia/GyQkRcSifMzzRwqpoL", yearly: "https://pay.chip-in.asia/RbxCqTYWGld5bJsSKl" },
    oneTime: { oneTime: "https://pay.chip-in.asia/GyQkRcSifMzzRwqpoL" }, // update with real one-time link
  },
  myr: {
    pro:     { monthly: 29, yearly: 269, monthlyNote: "Early access price" },
    oneTime: { oneTime: 29 },
  },
  // Plan IDs used in return URL ?plan=
  planMap: {
    pro_monthly:  { plan:"pro",     billing:"monthly"  },
    pro_yearly:   { plan:"pro",     billing:"yearly"   },
    one_time:     { plan:"oneTime", billing:"oneTime"  },
  },
};

// ── Handle payment return from Chip ──
// Call this on app load to detect ?payment=success&plan=xxx in URL
async function handlePaymentReturn(onSuccess) {
  const params = new URLSearchParams(window.location.search);
  const payment = params.get("payment");
  const planParam = params.get("plan");
  if (payment === "success" && planParam && PAYMENT_CONFIG.planMap[planParam]) {
    const { plan, billing } = PAYMENT_CONFIG.planMap[planParam];
    // Compute expiry: monthly = 31 days, yearly = 366 days (extra day buffer)
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (billing === "yearly" ? 366 : 31));
    await onSuccess(plan, expiry.toISOString());
    // Clean URL
    window.history.replaceState({}, "", window.location.pathname);
    return true;
  }
  if (payment === "cancel") {
    window.history.replaceState({}, "", window.location.pathname);
  }
  return false;
}

function PricingPage({ currentPlan="free", onSelect, onClose }) {
  const [billing, setBilling] = useState("monthly");

  const { fxRate, chip, myr } = PAYMENT_CONFIG;

  function myrPrice(planId) {
    if (planId === "oneTime") return myr.oneTime.oneTime;
    return billing === "yearly" ? myr[planId].yearly : myr[planId].monthly;
  }
  function myrPerMonth(planId) {
    if (planId === "oneTime") return myr.oneTime.oneTime;
    return billing === "yearly"
      ? (myr[planId].yearly / 12).toFixed(0)
      : myr[planId].monthly;
  }
  function saving(planId) {
    const annual = myr[planId].monthly * 12;
    return annual - myr[planId].yearly;
  }

  function handlePay(planId) {
    if (planId === "oneTime") {
      const url = chip.oneTime?.oneTime;
      if (url) window.location.href = url;
      return;
    }
    const url = chip[planId]?.[billing];
    if (url) window.location.href = url;
  }

  const tiers = [
    {
      id:"free", name:"Free",
      color:SUB, borderColor:BORDER, bg:"#fff",
      tagline:"Try it out, no card needed",
      features:["3 sessions","Up to 20 participants","Live scoreboard","QR join — no app needed","Basic features"],
    },
    {
      id:"oneTime", name:"One Time",
      color:BLUE, borderColor:BLUE, bg:"#EFF6FF",
      tagline:"Pay once, use forever",
      features:["Unlimited sessions","Unlimited participants","Full features","No subscription needed","All future basic updates"],
    },
    {
      id:"pro", name:"Pro",
      color:PINK, borderColor:PINK, bg:SOFT,
      tagline:"For active facilitators",
      badge:"⭐ Best value",
      features:["Unlimited sessions","Up to 200 participants","Groups & team scoring","Custom coin labels","Mass give coins","Priority support"],
    },
  ];

  return (
    <div style={{position:"fixed",inset:0,zIndex:700,background:BG,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Choose a Plan</div>
        <button onClick={onClose} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:SUB,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>

      {/* Scrollable body */}
      <div style={{flex:1,overflowY:"auto"}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px 64px"}}>

          {/* Value prop + toggle */}
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:24,color:TEXT,lineHeight:1.2,marginBottom:6}}>
              Reward participation,<br/>not just answers.
            </div>
            <div style={{fontSize:14,color:SUB,marginBottom:16}}>Kahoot scores quizzes. Teticoin rewards humans.</div>
            <div style={{display:"inline-flex",background:"#F9FAFB",border:`1px solid ${BORDER}`,borderRadius:99,padding:"4px 14px",fontSize:12,color:SUB,alignItems:"center",gap:6,marginBottom:20}}>
              <span>🇲🇾</span><span>Prices in MYR · International cards accepted</span>
            </div>

            {/* Billing toggle — centered */}
            <div style={{display:"flex",justifyContent:"center"}}>
              <div style={{display:"flex",background:BG,border:`1.5px solid ${BORDER}`,borderRadius:12,padding:3,gap:3,width:320}}>
                {[["monthly","Monthly",null],["yearly","Yearly","SAVE 35%"]].map(([b,label,badge]) => (
                  <button key={b} onClick={()=>setBilling(b)}
                    style={{flex:1,padding:"10px 0",borderRadius:9,border:"none",
                      background:billing===b?GRAD:"transparent",
                      fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,
                      color:billing===b?"#fff":SUB,cursor:"pointer",transition:"all .15s",
                      display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    {label}
                    {badge && <span style={{background:billing==="yearly"?"rgba(255,255,255,.25)":GREEN,color:"#fff",fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:99}}>{badge}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3-column plan cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
            {tiers.map(t => {
              const isCurrent = currentPlan === t.id;
              const isPaid = t.id !== "free";
              const monthlyNote = t.id === "pro" && billing === "monthly" ? myr.pro.monthlyNote : null;
              return (
                <div key={t.id} style={{background:t.bg,border:`2px solid ${isCurrent?t.color:t.id==="free"?BORDER:t.borderColor}`,borderRadius:18,padding:"24px",position:"relative",display:"flex",flexDirection:"column"}}>
                  {t.badge && <div style={{position:"absolute",top:-11,left:20,background:GRAD,color:"#fff",fontSize:10,fontWeight:800,padding:"3px 12px",borderRadius:99,boxShadow:`0 2px 8px ${PINK}40`}}>{t.badge}</div>}
                  {isCurrent && <div style={{position:"absolute",top:-11,right:20,background:t.color,color:"#fff",fontSize:10,fontWeight:800,padding:"3px 12px",borderRadius:99}}>✓ Current Plan</div>}

                  <div style={{marginBottom:16}}>
                    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,color:t.color}}>{t.name}</div>
                    <div style={{fontSize:12,color:SUB,fontWeight:500,marginTop:2}}>{t.tagline}</div>
                  </div>

                  {/* Price */}
                  <div style={{marginBottom:16}}>
                    {!isPaid ? (
                      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:32,color:SUB}}>Free</div>
                    ) : t.id === "oneTime" ? (
                      <>
                        <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                          <span style={{fontSize:12,fontWeight:600,color:t.color}}>RM</span>
                          <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:32,color:t.color,lineHeight:1}}>29</span>
                        </div>
                        <div style={{fontSize:12,color:SUB,marginTop:3}}>One-time payment</div>
                        <div style={{fontSize:11,background:`${BLUE}15`,color:BLUE,fontWeight:700,borderRadius:6,padding:"2px 8px",marginTop:4,display:"inline-block"}}>No subscription</div>
                      </>
                    ) : billing === "yearly" ? (
                      <>
                        <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                          <span style={{fontSize:12,fontWeight:600,color:t.color}}>RM</span>
                          <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:32,color:t.color,lineHeight:1}}>{myrPerMonth(t.id)}</span>
                          <span style={{fontSize:13,color:SUB}}>/mo</span>
                        </div>
                        <div style={{fontSize:12,color:SUB,marginTop:3}}>RM {myr[t.id].yearly}/year</div>
                        <div style={{fontSize:11,background:`${GREEN}15`,color:GREEN,fontWeight:700,borderRadius:6,padding:"2px 8px",marginTop:4,display:"inline-block"}}>Save RM {saving(t.id)}</div>
                      </>
                    ) : (
                      <>
                        <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                          <span style={{fontSize:12,fontWeight:600,color:t.color}}>RM</span>
                          <span style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:32,color:t.color,lineHeight:1}}>{myr[t.id].monthly}</span>
                          <span style={{fontSize:13,color:SUB}}>/mo</span>
                        </div>
                        {monthlyNote && <div style={{fontSize:11,background:`${PINK}12`,color:PINK,fontWeight:700,borderRadius:6,padding:"2px 8px",marginTop:4,display:"inline-block"}}>🎉 {monthlyNote}</div>}
                      </>
                    )}
                  </div>

                  {/* Features */}
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20,flex:1}}>
                    {t.features.map(f => (
                      <div key={f} style={{display:"flex",alignItems:"center",gap:8}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><polyline points="20 6 9 17 4 12"/></svg>
                        <div style={{fontSize:13,color:TEXT,fontWeight:500}}>{f}</div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  {isCurrent ? (
                    <div style={{textAlign:"center",padding:"11px 0",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:13,color:t.color,background:`${t.color}10`,borderRadius:10}}>
                      ✓ Your current plan
                    </div>
                  ) : t.id==="free" ? (
                    currentPlan !== "free" ? (
                      <button onClick={()=>onSelect(t.id,"monthly")} style={{width:"100%",padding:"11px 0",background:"none",border:`1.5px solid ${BORDER}`,borderRadius:10,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:13,color:SUB,cursor:"pointer"}}>
                        Downgrade to Free
                      </button>
                    ) : null
                  ) : (
                    <button onClick={()=>handlePay(t.id)}
                      style={{width:"100%",padding:"14px 0",background:t.id==="pro"?GRAD:t.id==="oneTime"?`linear-gradient(135deg,${BLUE},#2563EB)`:`linear-gradient(135deg,${PURPLE},#A855F7)`,border:"none",borderRadius:11,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:t.id==="pro"?`0 4px 16px ${PINK}40`:t.id==="oneTime"?`0 4px 16px ${BLUE}40`:`0 4px 16px ${PURPLE}40`}}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      {t.id==="oneTime" ? "Get One Time · RM 29" : `Get ${t.name} ${billing==="yearly"?"— Save RM 79":""} · RM ${myrPrice(t.id)}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer trust signals */}
          <div style={{marginTop:28,textAlign:"center",fontSize:12,color:SUB,lineHeight:2}}>
            Cancel anytime · No hidden fees · Secure payment via{" "}
            <span style={{color:"#6C47FF",fontWeight:700}}>Chip</span><br/>
            <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,flexWrap:"wrap",marginTop:4}}>
              {["FPX","DuitNow QR","E-Wallet","Credit / Debit Card"].map(m=>(
                <span key={m} style={{background:"#F3F4F6",borderRadius:6,padding:"2px 8px",fontWeight:600,color:SUB,fontSize:11}}>{m}</span>
              ))}
            </span>
            <div style={{marginTop:8,color:SUB}}>International cards accepted · Billed in MYR</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 2. Upgrade Banner (home screen) ──────────
function UpgradeBanner({ sessionCount, onUpgrade }) {
  const nearLimit = sessionCount >= FREE_SESSION_LIMIT - 1; // show when 2 or more sessions
  const atLimit   = sessionCount >= FREE_SESSION_LIMIT;
  if (!nearLimit) return null;
  return (
    <div onClick={onUpgrade}
      style={{background:"#EFF6FF",border:`1.5px solid #93C5FD`,borderRadius:14,padding:"12px 14px",marginBottom:12,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:32,height:32,borderRadius:9,background:"#DBEAFE",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#1E3A8A"}}>
          {atLimit?"Session limit reached — upgrade to create more":"You're on the free plan"}
        </div>
        <div style={{fontSize:11,color:"#2563EB",marginTop:1,fontWeight:500}}>
          {atLimit?"Upgrade to Pro — unlimited sessions from RM 29/mo":"Upgrade for unlimited sessions"}
        </div>
      </div>
      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:11,color:"#fff",flexShrink:0,background:"#2563EB",borderRadius:8,padding:"4px 9px",whiteSpace:"nowrap"}}>Upgrade →</div>
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
      body:"Free plan allows 20 participants per session. Upgrade to Pro for unlimited participants.",
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
    <div className="tc-modal-backdrop" style={{position:"fixed",inset:0,zIndex:800,backdropFilter:"blur(4px)",background:"rgba(26,10,20,.4)"}}>
      <div className="tc-modal-sheet" style={{background:"#fff",padding:"28px 24px 36px",width:"100%"}}>
        <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 20px"}}/>
        {/* Icon */}
        <div style={{width:64,height:64,borderRadius:20,background:SOFT,border:`1.5px solid ${MID}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          {cfg.icon}
        </div>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginBottom:8}}>{cfg.title}</div>
          <div style={{fontSize:14,color:SUB,lineHeight:1.7}}>{cfg.body}</div>
        </div>
        {/* Mini plan comparison */}
        <div style={{background:"#fff",border:`1px solid ${BORDER}`,borderRadius:14,padding:"14px 16px",marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:12,color:SUB}}>Feature</div>
            <div style={{display:"flex",gap:24}}>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:12,color:SUB,minWidth:40,textAlign:"center"}}>Free</div>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:12,color:PINK,minWidth:40,textAlign:"center"}}>Pro</div>
            </div>
          </div>
          {[
            ["Sessions","3","∞"],
            ["Participants","30","200"],
            ["Groups & teams","✗","✓"],
            ["Custom labels","✗","✓"],
            ["Mass give coins","✗","✓"],
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
        <button onClick={onUpgrade} style={{width:"100%",padding:"14px 0",background:GRAD,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",marginBottom:10}}>
          {cfg.cta} · from RM 29/mo
        </button>
        <button onClick={onClose} style={{width:"100%",padding:"11px 0",background:"none",border:`1px solid ${BORDER}`,borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:SUB,cursor:"pointer"}}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

// ── Profile Page ──────────────────────────
function ProfilePage({ trainer, onClose, onSaved }) {
  const [displayName, setDisplayName] = useState(trainer?.name || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [linked, setLinked] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Check if Google is already linked
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const hasGoogle = user.providerData.some(p => p.providerId === "google.com");
      setLinked(hasGoogle);
    }
  }, []);

  async function saveName() {
    if (!displayName.trim()) return;
    setBusy(true); setErr(""); setMsg("");
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      await ss("name", displayName.trim());
      onSaved(displayName.trim());
      setMsg("Name updated!");
    } catch(e) { setErr("Failed to update name."); }
    setBusy(false);
  }

  async function linkGoogle() {
    setLinkBusy(true); setErr(""); setMsg("");
    try {
      await linkWithPopup(auth.currentUser, googleProvider);
      setLinked(true);
      setMsg("Google account linked! You can now sign in with either method.");
    } catch(e) {
      if (e.code === "auth/credential-already-in-use") setErr("This Google account is already linked to another Teticoin account.");
      else if (e.code === "auth/provider-already-linked") { setLinked(true); setMsg("Google is already linked to this account."); }
      else setErr("Could not link Google account. Please try again.");
    }
    setLinkBusy(false);
  }

  async function sendReset() {
    setErr(""); setMsg("");
    try {
      await sendPasswordResetEmail(auth, trainer.email);
      setResetSent(true);
      setMsg("Password reset email sent to " + trainer.email);
    } catch(e) { setErr("Failed to send reset email."); }
  }

  const PageHeader = ({ title }) => (
    <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <button onClick={onClose} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:SUB,fontFamily:"Poppins,sans-serif",fontSize:14,fontWeight:500,padding:0}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>
      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:TEXT}}>{title}</div>
      <div style={{width:60}}/>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:700,background:BG,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{CSS}</style>
      <PageHeader title="My Profile"/>
      <div style={{flex:1,overflowY:"auto",padding:"28px 24px",maxWidth:520,width:"100%",margin:"0 auto"}}>

        {/* Avatar */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:28}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:GRAD,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:28,color:"#fff",marginBottom:8}}>
            {(displayName||trainer?.name||"?").slice(0,2).toUpperCase()}
          </div>
          <div style={{fontSize:12,color:SUB,fontWeight:500}}>{trainer?.email}</div>
        </div>

        {/* Feedback */}
        {msg && <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#16A34A",fontWeight:600,marginBottom:14}}>{msg}</div>}
        {err && <div style={{background:"#FEF2F2",border:"1px solid #EF444440",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#EF4444",fontWeight:600,marginBottom:14}}>{err}</div>}

        {/* Display name */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Display Name</div>
          <div style={{display:"flex",gap:8}}>
            <Inp value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" style={{flex:1,margin:0}}/>
            <button onClick={saveName} disabled={busy||displayName.trim()===trainer?.name}
              style={{padding:"0 18px",background:GRAD,border:"none",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer",opacity:busy||displayName.trim()===trainer?.name?.6:1,flexShrink:0}}>
              {busy?"Saving...":"Save"}
            </button>
          </div>
        </div>

        {/* Email (read-only) */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Email Address</div>
          <div style={{background:"#F9FAFB",border:`1.5px solid ${BORDER}`,borderRadius:12,padding:"13px 16px",fontSize:14,color:SUB,fontFamily:"Poppins,sans-serif"}}>{trainer?.email}</div>
          <div style={{fontSize:11,color:SUB,marginTop:5}}>Email cannot be changed. Contact support if needed.</div>
        </div>

        {/* Password reset */}
        <div style={{marginBottom:20,background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"16px 18px"}}>
          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:TEXT,marginBottom:4}}>Password</div>
          <div style={{fontSize:12,color:SUB,marginBottom:12}}>Send a reset link to your email to change your password.</div>
          <button onClick={sendReset} disabled={resetSent}
            style={{padding:"10px 18px",background:"none",border:`1.5px solid ${BORDER}`,borderRadius:10,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:13,color:resetSent?SUB:TEXT,cursor:resetSent?"default":"pointer"}}>
            {resetSent?"Reset email sent ✓":"Send Password Reset Email"}
          </button>
        </div>

        {/* Link Google */}
        <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"16px 18px"}}>
          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:TEXT,marginBottom:4}}>Sign-in Methods</div>
          <div style={{fontSize:12,color:SUB,marginBottom:12}}>Link your Google account so you can sign in with either method.</div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.3 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.8l5.7-5.7C33.5 7 29 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19c10 0 18.7-7.2 18.7-19 0-1.3-.1-2.7-.1-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c2.8 0 5.3 1 7.2 2.8l5.7-5.7C33.5 7 29 5 24 5c-7.2 0-13.4 4-16.7 9.7z"/><path fill="#4CAF50" d="M24 43c5.2 0 9.8-1.8 13.4-4.7l-6.2-5.2C29.3 34.3 26.8 35 24 35c-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.8 39.2 16.4 43 24 43z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.6-2.7 4.8-5.1 6.1l6.2 5.2C40 35.8 44 30.4 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
            <div style={{flex:1}}>
              <div style={{fontFamily:"Poppins,sans-serif",fontSize:13,fontWeight:600,color:TEXT}}>Google</div>
              <div style={{fontSize:11,color:linked?GREEN:SUB}}>{linked?"Linked ✓":"Not linked"}</div>
            </div>
            {!linked && (
              <button onClick={linkGoogle} disabled={linkBusy}
                style={{padding:"8px 16px",background:GRAD,border:"none",borderRadius:10,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:12,color:"#fff",cursor:"pointer",opacity:linkBusy?.6:1}}>
                {linkBusy?"Linking...":"Link"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Settings Page ──────────────────────────
function SettingsPage({ onClose }) {
  const [soundOn, setSoundOn] = useState(() => {
    try { return localStorage.getItem("tc_sound") !== "off"; } catch { return true; }
  });
  const [confettiOn, setConfettiOn] = useState(() => {
    try { return localStorage.getItem("tc_confetti") !== "off"; } catch { return true; }
  });

  function toggle(key, val, setter) {
    setter(val);
    try { localStorage.setItem(key, val ? "on" : "off"); } catch {}
  }

  const Row = ({ label, sub, value, onToggle }) => (
    <div style={{display:"flex",alignItems:"center",padding:"14px 18px",borderBottom:`1px solid ${BORDER}`}}>
      <div style={{flex:1}}>
        <div style={{fontFamily:"Poppins,sans-serif",fontSize:13,fontWeight:600,color:TEXT}}>{label}</div>
        <div style={{fontSize:11,color:SUB,marginTop:2}}>{sub}</div>
      </div>
      <button onClick={onToggle} style={{width:44,height:26,borderRadius:13,border:"none",background:value?PINK:"#D1D5DB",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
        <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:value?21:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
      </button>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:700,background:BG,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{CSS}</style>
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <button onClick={onClose} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:SUB,fontFamily:"Poppins,sans-serif",fontSize:14,fontWeight:500,padding:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:TEXT}}>Settings</div>
        <div style={{width:60}}/>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"24px 20px",maxWidth:520,width:"100%",margin:"0 auto"}}>

        <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Session Experience</div>
        <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,overflow:"hidden",marginBottom:20}}>
          <Row label="Sound Effects" sub="Play sounds when coins are awarded" value={soundOn} onToggle={()=>toggle("tc_sound",!soundOn,setSoundOn)}/>
          <Row label="Confetti Animation" sub="Show confetti burst on large awards" value={confettiOn} onToggle={()=>toggle("tc_confetti",!confettiOn,setConfettiOn)}/>
        </div>

      </div>
    </div>
  );
}

// ── 4. Billing Page ──────────────────────────
function BillingPage({ plan="free", planExpiry=null, onUpgrade, onClose }) {
  const [cancelConfirm, setCancelConfirm] = useState(false);

  // Format real expiry date, or fall back to a rough estimate label
  const expiryLabel = planExpiry
    ? new Date(planExpiry).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })
    : null;

  const planData = {
    free:    {name:"Free",     price:"RM 0",    renewal:null,       color:SUB,  next:null},
    oneTime: {name:"One Time", price:"RM 29",   renewal:"one-time", color:BLUE, next:null},
    pro:     {name:"Pro",      price:"RM 29",   renewal:"monthly",  color:PINK, next:expiryLabel},
    proY:    {name:"Pro",      price:"RM 269",  renewal:"yearly",   color:PINK, next:expiryLabel},
  };
  const pd = planData[plan] || planData.free;
  const isFree = plan==="free";
  // Build a single real invoice from the expiry date (payment date = expiry minus billing period)
  const invoices = plan!=="free" && planExpiry ? (() => {
    const expDate = new Date(planExpiry);
    const isYearly = plan === "proY";
    const payDate = new Date(expDate);
    payDate.setDate(payDate.getDate() - (isYearly ? 366 : 31));
    return [{ date: payDate.toLocaleDateString("en-GB", {day:"numeric",month:"short",year:"numeric"}), amount:pd.price, status:"Paid" }];
  })() : [];

  return (
    <div style={{position:"fixed",inset:0,zIndex:700,background:BG,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{CSS}</style>

      {/* Header — full width */}
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <button onClick={onClose} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:SUB,fontFamily:"Poppins,sans-serif",fontSize:14,fontWeight:500,padding:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:TEXT}}>Billing &amp; Plan</div>
        <div style={{width:60}}/>
      </div>

      {/* Body — 2-column on desktop */}
      <div style={{flex:1,overflow:"hidden",display:"flex"}}>

        {/* LEFT: current plan + usage + upgrade CTA */}
        <div style={{flex:"0 0 420px",borderRight:`1px solid ${BORDER}`,overflowY:"auto",padding:"28px 32px"}}>

          {/* Current plan card */}
          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:12,color:SUB,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Current Plan</div>
          <div style={{background:isFree?"#fff":pd.color===PINK?SOFT:"#FAF5FF",border:`2px solid ${pd.color}`,borderRadius:16,padding:"20px",marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,color:pd.color}}>{pd.name}</div>
              <div style={{background:`${pd.color}18`,border:`1.5px solid ${pd.color}44`,borderRadius:99,padding:"3px 12px",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:11,color:pd.color}}>Active</div>
            </div>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:32,color:TEXT,marginBottom:4,lineHeight:1}}>
              {pd.price}{!isFree&&<span style={{fontSize:14,fontWeight:600,color:SUB}}>/{pd.renewal==="yearly"?"yr":"mo"}</span>}
            </div>
            {pd.next && <div style={{fontSize:12,color:SUB,fontWeight:500,marginTop:6}}>Access until {pd.next}</div>}
            {isFree && <div style={{fontSize:12,color:SUB,fontWeight:500,marginTop:6}}>No time limit · No card required</div>}
          </div>

          {/* Feature list */}
          <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"16px 18px",marginBottom:20}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:TEXT,marginBottom:12}}>
              {isFree ? "What's included" : "Everything in your plan"}
            </div>
            {isFree ? (
              <>
                {[
                  {label:"3 active sessions",ok:true},
                  {label:"Up to 30 participants per session",ok:true},
                  {label:"Award coins in real time",ok:true},
                  {label:"Live scoreboard",ok:true},
                  {label:"QR / link join — no app needed",ok:true},
                  {label:"Session log",ok:true},
                  {label:"Projector / TV mode",ok:true},
                  {label:"Export CSV",ok:true},
                ].map(f=>(
                  <div key={f.label} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${BORDER}`}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <div style={{fontSize:13,color:TEXT,fontWeight:500}}>{f.label}</div>
                  </div>
                ))}
                <div style={{marginTop:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:12,color:SUB,marginBottom:8}}>🔒 Unlock with Pro</div>
                {[
                  "Unlimited sessions",
                  "Up to 200 participants",
                  "Groups & team scoring",
                  "Custom coin labels",
                  "Mass give coins",
                ].map(f=>(
                  <div key={f} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${BORDER}`,opacity:0.5}}>
                    <svg width="13" height="11" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}><path d="m2.8373 20.9773c-.6083-3.954-1.2166-7.9079-1.8249-11.8619-.1349-.8765.8624-1.4743 1.5718-.9422 1.8952 1.4214 3.7903 2.8427 5.6855 4.2641.624.468 1.513.3157 1.9456-.3333l4.7333-7.1c.5002-.7503 1.6026-.7503 2.1028 0l4.7333 7.1c.4326.649 1.3216.8012 1.9456.3333 1.8952-1.4214 3.7903-2.8427 5.6855-4.2641.7094-.5321 1.7067.0657 1.5719.9422-.6083 3.954-1.2166 7.9079-1.8249 11.8619z" fill="#ffb743"/><path d="m27.7902 27.5586h-23.5804c-.758 0-1.3725-.6145-1.3725-1.3725v-3.015h26.3255v3.015c-.0001.758-.6146 1.3725-1.3726 1.3725z" fill="#ffb743"/></svg>
                    <div style={{fontSize:13,color:SUB,fontWeight:500}}>{f}</div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {[
                  "Unlimited sessions",
                  "Up to 200 participants",
                  "Award coins in real time",
                  "Live scoreboard",
                  "QR / link join — no app needed",
                  "Mass give coins",
                  "Session log",
                  "Projector / TV mode",
                  "Export CSV",
                  "Groups & team scoring",
                  "Custom coin labels",
                  "PIN rejoin for returning participants",
                  "Priority support",
                ].map(f=>(
                  <div key={f} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${BORDER}`}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <div style={{fontSize:13,color:TEXT,fontWeight:500}}>{f}</div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Usage */}
          {isFree && (
            <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"18px",marginBottom:20}}>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:TEXT,marginBottom:14}}>Usage</div>
              {[
                {label:"Sessions", used:1, max:FREE_SESSION_LIMIT, color:PINK},
                {label:"Participants / session", used:0, max:FREE_PAX_LIMIT, color:BLUE},
              ].map(u=>(
                <div key={u.label} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{fontSize:13,color:TEXT,fontWeight:500}}>{u.label}</div>
                    <div style={{fontSize:13,color:u.color,fontWeight:700}}>{u.used} / {u.max}</div>
                  </div>
                  <div style={{height:6,background:BORDER,borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:6,background:u.used/u.max>0.8?`linear-gradient(90deg,${u.color},#EF4444)`:u.color,width:`${Math.max(2,(u.used/u.max)*100)}%`,borderRadius:4,transition:"width .5s ease"}}/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upgrade CTA */}
          {isFree && (
            <button onClick={onUpgrade}
              style={{width:"100%",padding:"14px 0",background:GRAD,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",marginBottom:16}}>
              Upgrade to Pro · RM 29/mo
            </button>
          )}

          {/* Cancel */}
          {!isFree && (
            cancelConfirm ? (
              <div style={{background:"#FEF2F2",border:"1.5px solid #EF444440",borderRadius:14,padding:"16px"}}>
                <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#EF4444",marginBottom:6}}>Cancel subscription?</div>
                <div style={{fontSize:13,color:SUB,marginBottom:14,lineHeight:1.6}}>You'll keep your plan features until the end of the billing period. Data preserved for 90 days after.</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setCancelConfirm(false)} style={{flex:1,padding:"11px 0",background:"none",border:`1px solid ${BORDER}`,borderRadius:10,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:13,color:SUB,cursor:"pointer"}}>Keep Plan</button>
                  <button style={{flex:1,padding:"11px 0",background:"#EF4444",border:"none",borderRadius:10,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer"}}>Yes, Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={()=>setCancelConfirm(true)}
                style={{width:"100%",padding:"12px 0",background:"none",border:`1px solid ${BORDER}`,borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:600,fontSize:13,color:SUB,cursor:"pointer"}}>
                Cancel Subscription
              </button>
            )
          )}
        </div>

        {/* RIGHT: invoice history */}
        <div style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>
          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:12,color:SUB,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Invoice History</div>

          {invoices.length === 0 ? (
            <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"48px 24px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:10}}>🧾</div>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:TEXT,marginBottom:6}}>No invoices yet</div>
              <div style={{fontSize:13,color:SUB}}>Invoices will appear here after your first payment.</div>
            </div>
          ) : (
            <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,overflow:"hidden"}}>
              {invoices.map((inv,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",padding:"14px 18px",borderBottom:i<invoices.length-1?`1px solid ${BORDER}`:"none"}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:TEXT}}>{inv.date}</div>
                    <div style={{fontSize:12,color:SUB,marginTop:1}}>{pd.name} Plan · {pd.renewal}</div>
                  </div>
                  <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:TEXT,marginRight:12}}>{inv.amount}</div>
                  <div style={{background:`${GREEN}18`,border:`1px solid ${GREEN}40`,borderRadius:99,padding:"2px 10px",fontSize:11,fontWeight:700,color:GREEN}}>{inv.status}</div>
                </div>
              ))}
            </div>
          )}

          {/* Payment methods info */}
          <div style={{marginTop:20,background:"#F9FAFB",border:`1px solid ${BORDER}`,borderRadius:12,padding:"16px 18px"}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:TEXT,marginBottom:8}}>Payment Methods</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["FPX","DuitNow QR","E-Wallet","Credit / Debit Card"].map(m=>(
                <span key={m} style={{background:"#fff",border:`1px solid ${BORDER}`,borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:600,color:SUB}}>{m}</span>
              ))}
            </div>
            <div style={{fontSize:12,color:SUB,marginTop:10}}>Payments processed securely by <span style={{color:"#6C47FF",fontWeight:700}}>Chip</span> · International cards accepted</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Admin Dashboard ──────────────────────────────────────────
function SuperAdminDashboard({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("users"); // users | beta
  const [betaEmail, setBetaEmail] = useState("");
  const [betaMsg, setBetaMsg] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  // Load all users — data is stored under users/{uid}/data/{key} subcollection
  useEffect(() => {
    async function load() {
      try {
        const { getFirestore, collection, getDocs, doc, getDoc } = await import("firebase/firestore");
        const db = getFirestore();
        // Get all user UIDs from top-level users collection
        const usersSnap = await getDocs(collection(db, "users"));
        const list = [];
        // For each user, read their data subcollection keys we care about
        await Promise.all(usersSnap.docs.map(async userDoc => {
          const uid = userDoc.id;
          try {
            const [emailDoc, nameDoc, planDoc, planExpiryDoc, sessionsDoc] = await Promise.all([
              getDoc(doc(db, "users", uid, "data", "email")),
              getDoc(doc(db, "users", uid, "data", "name")),
              getDoc(doc(db, "users", uid, "data", "plan")),
              getDoc(doc(db, "users", uid, "data", "planExpiry")),
              getDoc(doc(db, "users", uid, "data", "sessions_index")),
            ]);
            const plan = planDoc.exists() ? planDoc.data().value : "free";
            const planExpiry = planExpiryDoc.exists() ? planExpiryDoc.data().value : null;
            const sessionsVal = sessionsDoc.exists() ? sessionsDoc.data().value : [];
            list.push({
              uid,
              email: emailDoc.exists() ? emailDoc.data().value : "—",
              name:  nameDoc.exists()  ? nameDoc.data().value  : "—",
              plan:  plan || "free",
              planExpiry,
              sessionsCount: Array.isArray(sessionsVal) ? sessionsVal.length : 0,
            });
          } catch(e) {
            // user exists but has no data subcollection yet — still list them
            list.push({ uid, email:"—", name:"—", plan:"free", planExpiry:null, sessionsCount:0 });
          }
        }));
        list.sort((a,b) => {
          const order = {superadmin:0, beta:1, pro:2, proY:2, oneTime:2, free:3};
          return (order[a.plan]||3) - (order[b.plan]||3);
        });
        setUsers(list);
      } catch(e) { console.error("Dashboard load error:", e); }
      setLoading(false);
    }
    load();
  }, []);

  async function assignBeta(uid, email) {
    try {
      const { getFirestore, doc, setDoc } = await import("firebase/firestore");
      const db = getFirestore();
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 90);
      // Write to data subcollection (matching fsSet pattern)
      await Promise.all([
        setDoc(doc(db, "users", uid, "data", "plan"),       { value: "beta",                   updatedAt: Date.now() }),
        setDoc(doc(db, "users", uid, "data", "planExpiry"), { value: expiry.toISOString(),      updatedAt: Date.now() }),
      ]);
      setUsers(u => u.map(x => x.uid === uid ? {...x, plan:"beta", planExpiry:expiry.toISOString()} : x));
      setActionMsg(`✅ Beta Pro assigned to ${email} for 90 days`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch(e) { setActionMsg("❌ Error: " + e.message); }
  }

  async function revokePlan(uid, email) {
    try {
      const { getFirestore, doc, setDoc, deleteDoc } = await import("firebase/firestore");
      const db = getFirestore();
      // Reset plan to free, remove expiry
      await Promise.all([
        setDoc(doc(db, "users", uid, "data", "plan"),       { value: "free", updatedAt: Date.now() }),
        deleteDoc(doc(db, "users", uid, "data", "planExpiry")),
      ]);
      setUsers(u => u.map(x => x.uid === uid ? {...x, plan:"free", planExpiry:null} : x));
      setActionMsg(`✅ Plan reset to Free for ${email}`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch(e) { setActionMsg("❌ Error: " + e.message); }
  }

  async function resendReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      setActionMsg(`✅ Password reset email sent to ${email}`);
      setTimeout(() => setActionMsg(null), 4000);
    } catch(e) {
      setActionMsg("❌ Could not send reset email: " + (e.code === "auth/user-not-found" ? "User not found in Auth." : e.message));
      setTimeout(() => setActionMsg(null), 5000);
    }
  }

  async function deleteUserAccount(uid, email) {
    if (!window.confirm(`Delete all Firestore data for ${email}?\n\nNote: Their Firebase Auth account must be deleted separately from the Firebase Console (Authentication → Users).`)) return;
    try {
      const { getFirestore, collection, getDocs, doc, deleteDoc } = await import("firebase/firestore");
      const db = getFirestore();
      // Delete all docs in users/{uid}/data subcollection
      const dataSnap = await getDocs(collection(db, "users", uid, "data"));
      await Promise.all(dataSnap.docs.map(d => deleteDoc(d.ref)));
      setUsers(u => u.filter(x => x.uid !== uid));
      setActionMsg(`✅ Firestore data deleted for ${email}. Remove from Firebase Auth console too.`);
      setTimeout(() => setActionMsg(null), 6000);
    } catch(e) { setActionMsg("❌ Error: " + e.message); }
  }

  async function assignBetaByEmail() {
    if (!betaEmail.trim()) return;
    const found = users.find(u => u.email.toLowerCase() === betaEmail.trim().toLowerCase());
    if (!found) { setBetaMsg("User not found. They must have logged in at least once."); return; }
    await assignBeta(found.uid, found.email);
    setBetaEmail("");
    setBetaMsg(null);
  }

  const PLAN_COLORS = { free: SUB, beta: GREEN, pro: PINK, proY: PINK, oneTime: BLUE, superadmin: "#FF6B00" };
  const PLAN_LABELS = { free:"Free", beta:"Beta Pro", pro:"Pro", proY:"Pro Yearly", oneTime:"One-Time", superadmin:"Superadmin" };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    pro: users.filter(u => u.plan === "pro" || u.plan === "proY" || u.plan === "oneTime").length,
    beta: users.filter(u => u.plan === "beta").length,
    free: users.filter(u => u.plan === "free").length,
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:900,background:BG,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <button onClick={onClose} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:SUB,fontFamily:"Plus Jakarta Sans,sans-serif",fontSize:14,fontWeight:500,padding:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:TEXT}}>Admin Dashboard</div>
        </div>
        <div style={{width:60}}/>
      </div>

      {/* Stats bar */}
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"12px 24px",display:"flex",gap:16,flexShrink:0,overflowX:"auto"}}>
        {[
          {label:"Total Users", val:stats.total, color:TEXT},
          {label:"Pro / Paid", val:stats.pro, color:PINK},
          {label:"Beta Testers", val:stats.beta, color:GREEN},
          {label:"Free", val:stats.free, color:SUB},
        ].map(s => (
          <div key={s.label} style={{background:BG,border:`1.5px solid ${BORDER}`,borderRadius:12,padding:"10px 18px",flexShrink:0,minWidth:100,textAlign:"center"}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,color:s.color}}>{loading ? "…" : s.val}</div>
            <div style={{fontSize:11,color:SUB,fontWeight:600,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,display:"flex",flexShrink:0}}>
        {[["users","👥 Users"],["beta","⚡ Assign Beta"]].map(([id,l]) => (
          <button key={id} onClick={()=>setTab(id)}
            style={{padding:"11px 20px",border:"none",background:"none",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:tab===id?PINK:SUB,cursor:"pointer",borderBottom:tab===id?`2.5px solid ${PINK}`:"2.5px solid transparent"}}>
            {l}
          </button>
        ))}
      </div>

      {/* Toast */}
      {actionMsg && (
        <div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:TEXT,color:"#fff",borderRadius:10,padding:"10px 20px",fontSize:13,fontWeight:600,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>
          {actionMsg}
        </div>
      )}

      <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>

        {tab === "users" && <>
          {/* Search */}
          <div style={{marginBottom:16}}>
            <Inp placeholder="Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",maxWidth:480}}/>
          </div>

          {loading ? (
            <div style={{textAlign:"center",padding:48,color:SUB,fontSize:14}}>Loading users…</div>
          ) : (
            <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:16,overflow:"hidden"}}>
              {filtered.length === 0 ? (
                <div style={{padding:32,textAlign:"center",color:SUB,fontSize:13}}>No users found</div>
              ) : filtered.map((u,i) => {
                const planColor = PLAN_COLORS[u.plan] || SUB;
                const planLabel = PLAN_LABELS[u.plan] || u.plan;
                const expiryStr = u.planExpiry ? new Date(u.planExpiry).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : null;
                const isSA = u.plan === "superadmin";
                return (
                  <div key={u.uid} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 18px",borderBottom:i<filtered.length-1?`1px solid ${BORDER}`:"none",flexWrap:"wrap"}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${planColor}18`,border:`1.5px solid ${planColor}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:planColor}}>
                      {(u.name||"?")[0].toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:TEXT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.name}</div>
                      <div style={{fontSize:12,color:SUB,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
                      {expiryStr && <div style={{fontSize:11,color:SUB,marginTop:1}}>Expires {expiryStr}</div>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      <span style={{background:`${planColor}15`,border:`1px solid ${planColor}40`,color:planColor,borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:800}}>{planLabel}</span>
                      {!isSA && u.plan !== "beta" && (
                        <button onClick={()=>assignBeta(u.uid, u.email)}
                          style={{padding:"4px 10px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,fontSize:11,fontWeight:700,color:"#16A34A",cursor:"pointer"}}>
                          + Beta
                        </button>
                      )}
                      {!isSA && u.plan !== "free" && (
                        <button onClick={()=>revokePlan(u.uid, u.email)}
                          style={{padding:"4px 10px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,fontSize:11,fontWeight:700,color:"#EF4444",cursor:"pointer"}}>
                          Revoke
                        </button>
                      )}
                      {u.email !== "—" && (
                        <button onClick={()=>resendReset(u.email)}
                          title="Send password reset email"
                          style={{padding:"4px 10px",background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:8,fontSize:11,fontWeight:700,color:"#2563EB",cursor:"pointer"}}>
                          Reset pw
                        </button>
                      )}
                      {!isSA && (
                        <button onClick={()=>deleteUserAccount(u.uid, u.email)}
                          title="Delete Firestore data"
                          style={{padding:"4px 8px",background:"none",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:11,fontWeight:700,color:SUB,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>}

        {tab === "beta" && (
          <div style={{maxWidth:480}}>
            <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:16,padding:"24px"}}>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:16,color:TEXT,marginBottom:6}}>Assign Beta Tester</div>
              <div style={{fontSize:13,color:SUB,marginBottom:18,lineHeight:1.6}}>Beta testers get full Pro access for 90 days. After 90 days their account automatically reverts to Free.</div>
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                <Inp placeholder="User email address" value={betaEmail} onChange={e=>setBetaEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&assignBetaByEmail()} style={{flex:1}}/>
                <button onClick={assignBetaByEmail}
                  style={{padding:"0 20px",background:GRAD,border:"none",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:"#fff",cursor:"pointer",flexShrink:0}}>
                  Assign
                </button>
              </div>
              {betaMsg && <div style={{fontSize:13,color:"#EF4444",marginTop:4}}>{betaMsg}</div>}
              <div style={{marginTop:20,padding:"12px 14px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10}}>
                <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:12,color:"#16A34A",marginBottom:6}}>Beta plan includes</div>
                {["Full Pro feature access","Groups & team scoring","Coinmaster co-host","Custom coin labels","Up to 200 participants","Automatic revert after 90 days"].map(f=>(
                  <div key={f} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0"}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <div style={{fontSize:12,color:"#166534",fontWeight:500}}>{f}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current beta users */}
            <div style={{marginTop:20}}>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:SUB,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Current Beta Testers ({users.filter(u=>u.plan==="beta").length})</div>
              {users.filter(u=>u.plan==="beta").length === 0 ? (
                <div style={{fontSize:13,color:SUB,padding:"16px 0"}}>No beta testers yet.</div>
              ) : users.filter(u=>u.plan==="beta").map(u => {
                const expiryStr = u.planExpiry ? new Date(u.planExpiry).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "—";
                const expired = u.planExpiry && new Date(u.planExpiry) < new Date();
                return (
                  <div key={u.uid} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:12,marginBottom:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:TEXT}}>{u.name}</div>
                      <div style={{fontSize:12,color:SUB}}>{u.email}</div>
                      <div style={{fontSize:11,color:expired?"#EF4444":GREEN,fontWeight:600,marginTop:2}}>{expired?"Expired":"Active"} · until {expiryStr}</div>
                    </div>
                    <button onClick={()=>revokePlan(u.uid, u.email)}
                      style={{padding:"5px 12px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,fontSize:12,fontWeight:700,color:"#EF4444",cursor:"pointer",flexShrink:0}}>
                      Revoke
                    </button>
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

// ── Coinmaster Join Modal ──
// ── Earnings Page — participant's personal coin history ──────────
function EarningsPage({ uid, name, onClose }) {
  const [earnings, setEarnings] = useState(null); // null = loading
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { getFirestore, doc, getDoc } = await import("firebase/firestore");
        const db = getFirestore();
        const snap = await getDoc(doc(db, "users", uid, "data", "earnings"));
        setEarnings(snap.exists() ? (snap.data().value || []) : []);
      } catch { setEarnings([]); }
    }
    if (uid) load();
    else setEarnings([]);
  }, [uid]);

  const totalCoins = (earnings||[]).reduce((s,e)=>s+e.coins,0);
  const totalSessions = (earnings||[]).length;

  function shareText() {
    return `I've earned ${totalCoins} coins across ${totalSessions} session${totalSessions!==1?"s":""} on Teticoin! 🏆 https://teticoin.tetikus.com.my`;
  }

  const shareLinks = [
    {name:"WhatsApp", color:"#25D366", url:`https://wa.me/?text=${encodeURIComponent(shareText())}`},
    {name:"Facebook", color:"#1877F2", url:`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://teticoin.tetikus.com.my")}&quote=${encodeURIComponent(shareText())}`},
    {name:"Threads",  color:"#000",    url:`https://www.threads.net/intent/post?text=${encodeURIComponent(shareText())}`},
  ];

  return (
    <div style={{position:"fixed",inset:0,zIndex:800,background:BG,display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:"Poppins,sans-serif"}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"0 16px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <button onClick={onClose} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:SUB,fontFamily:"Plus Jakarta Sans,sans-serif",fontSize:14,fontWeight:600,padding:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:17,color:TEXT}}>My Earnings</div>
        <div style={{width:48}}/>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 16px",maxWidth:480,margin:"0 auto",width:"100%"}}>

        {/* Name + summary */}
        <div style={{background:GRAD,borderRadius:20,padding:"24px 20px",marginBottom:20,color:"#fff",textAlign:"center"}}>
          <div style={{width:52,height:52,borderRadius:16,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22}}>
            {(name||"?")[0].toUpperCase()}
          </div>
          <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:16,marginBottom:16}}>{name}</div>
          <div style={{display:"flex",justifyContent:"center",gap:24}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:40,lineHeight:1}}>{earnings===null?"…":totalCoins}</div>
              <div style={{fontSize:12,opacity:.75,marginTop:4}}>total coins</div>
            </div>
            <div style={{width:1,background:"rgba(255,255,255,.3)",borderRadius:1}}/>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:40,lineHeight:1}}>{earnings===null?"…":totalSessions}</div>
              <div style={{fontSize:12,opacity:.75,marginTop:4}}>{totalSessions===1?"session":"sessions"}</div>
            </div>
          </div>
        </div>

        {/* Session history */}
        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:SUB,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Session history</div>

        {earnings === null ? (
          <div style={{textAlign:"center",padding:32,color:SUB,fontSize:13}}>Loading…</div>
        ) : earnings.length === 0 ? (
          <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:16,padding:"36px 20px",textAlign:"center"}}>
            <Ham size={52}/>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:TEXT,marginTop:12,marginBottom:6}}>No earnings yet</div>
            <div style={{fontSize:13,color:SUB}}>Join a session and earn coins to see your history here.</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[...earnings].sort((a,b)=>b.lastUpdated-a.lastUpdated).map((e,i) => (
              <div key={e.code} style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:12,background:SOFT,border:`1.5px solid ${MID}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:13,color:PINK}}>
                  {i+1}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:TEXT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.name}</div>
                  <div style={{fontSize:11,color:SUB,marginTop:2}}>
                    {e.joinedAt ? new Date(e.joinedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "—"}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,color:PINK}}>{e.coins}</div>
                  <div style={{fontSize:10,color:SUB}}>coins</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Share */}
        {totalCoins > 0 && (
          <div style={{marginTop:24}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:SUB,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Share your achievement</div>
            <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
              {[
                {name:"WhatsApp", bg:"#25D366", url:`https://wa.me/?text=${encodeURIComponent(shareText())}`,
                 icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>},
                {name:"Facebook", bg:"#1877F2", url:`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://teticoin.tetikus.com.my")}&quote=${encodeURIComponent(shareText())}`,
                 icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>},
                {name:"X", bg:"#000", url:`https://x.com/intent/tweet?text=${encodeURIComponent(shareText())}`,
                 icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L2.146 2.25H8.32l4.273 5.647L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>},
                {name:"Telegram", bg:"#229ED9", url:`https://t.me/share/url?url=${encodeURIComponent("https://teticoin.tetikus.com.my")}&text=${encodeURIComponent(shareText())}`,
                 icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>},
              ].map(s=>(
                <button key={s.name} onClick={()=>window.open(s.url,"_blank")} title={s.name}
                  style={{width:48,height:48,borderRadius:"50%",background:s.bg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 8px ${s.bg}66`,flexShrink:0}}>
                  {s.icon}
                </button>
              ))}
              <button onClick={()=>{navigator.clipboard?.writeText(shareText());setCopied(true);setTimeout(()=>setCopied(false),2000);}}
                title="Copy text"
                style={{width:48,height:48,borderRadius:"50%",background:copied?"#22c55e":"#374151",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.2)",flexShrink:0,transition:"background .2s"}}>
                {copied
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── JoinSessionField — compact code entry used on home screen ──
function JoinSessionField({ onJoin }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!code.trim()) return;
    setBusy(true); setErr("");
    const result = await onJoin(code.trim().toUpperCase());
    if (result) { setErr(result); setBusy(false); }
  }

  return (
    <div style={{width:"100%"}}>
      <div style={{display:"flex",gap:8,width:"100%"}}>
        <input
          value={code}
          onChange={e=>{ setCode(e.target.value.toUpperCase()); setErr(""); }}
          onKeyDown={e=>e.key==="Enter"&&submit()}
          placeholder="Enter session code"
          maxLength={8}
          style={{flex:1,minWidth:0,padding:"11px 14px",border:`1.5px solid ${err?'#EF4444':BORDER}`,borderRadius:11,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:TEXT,background:"#fff",outline:"none",letterSpacing:0,boxSizing:"border-box"}}
        />
        <button onClick={submit} disabled={!code.trim()||busy}
          style={{padding:"11px 16px",background:code.trim()?GRAD:BG,border:`1.5px solid ${code.trim()?'transparent':BORDER}`,borderRadius:11,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:code.trim()?"#fff":SUB,cursor:code.trim()?"pointer":"not-allowed",flexShrink:0,transition:"all .15s",whiteSpace:"nowrap"}}>
          {busy ? "…" : "Join →"}
        </button>
      </div>
      {err && <div style={{fontSize:12,color:"#EF4444",marginTop:6,fontWeight:600}}>{err}</div>}
    </div>
  );
}

// ── BadgePickerModal — host awards badge to a participant ──
function BadgePickerModal({ participant, sessionName, hostName, onAward, onClose }) {
  const [selected, setSelected] = useState(null);
  const [customFile, setCustomFile] = useState(null); // SVG data URL
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef(null);

  function handleSvgUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/svg+xml") { setUploadErr("Only .svg files allowed"); return; }
    if (file.size > 10240) { setUploadErr("File must be under 10KB"); return; }
    setUploadErr(""); setUploading(true);
    const reader = new FileReader();
    reader.onload = ev => {
      setCustomFile(ev.target.result);
      setSelected({ id:"custom", icon:"", label:"Custom Badge", color:PINK, svgData:ev.target.result });
      setUploading(false);
    };
    reader.onerror = () => { setUploadErr("Failed to read file"); setUploading(false); };
    reader.readAsDataURL(file);
  }

  return (
    <div className="tc-modal-backdrop" style={{position:"fixed",inset:0,zIndex:700}}>
      <div onClick={onClose} style={{position:"absolute",inset:0}}/>
      <div className="tc-modal-sheet" style={{background:"#fff",display:"flex",flexDirection:"column",maxHeight:"88vh"}}>
        <div style={{padding:"14px 20px 0",flexShrink:0}}>
          <div style={{width:36,height:4,background:BORDER,borderRadius:4,margin:"0 auto 14px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:18,color:TEXT}}>Award Badge</div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:SUB,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          <div style={{fontSize:13,color:SUB,marginBottom:16}}>Awarding to <strong style={{color:TEXT}}>{participant.name}</strong></div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"0 20px 32px"}}>
          {/* Premade grid */}
          <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Choose a badge</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
            {BADGE_PRESETS.map(b => (
              <button key={b.id} onClick={()=>setSelected(b)}
                style={{padding:"12px 8px",borderRadius:12,border:`2px solid ${selected?.id===b.id?b.color:BORDER}`,background:selected?.id===b.id?`${b.color}12`:"#fff",cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                <div style={{fontSize:28,lineHeight:1,marginBottom:5}}>{b.icon}</div>
                <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:11,color:selected?.id===b.id?b.color:TEXT,lineHeight:1.2}}>{b.label}</div>
              </button>
            ))}
          </div>
          {/* Custom SVG upload */}
          <div style={{borderTop:`1px solid ${BORDER}`,paddingTop:16,marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Or upload custom badge</div>
            <button onClick={()=>fileRef.current?.click()}
              style={{width:"100%",padding:"12px",border:`1.5px dashed ${uploadErr?'#EF4444':BORDER}`,borderRadius:12,background:customFile?"#F0FDF4":SOFT,cursor:"pointer",fontSize:13,color:SUB,fontFamily:"Poppins,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {customFile
                ? <><img src={customFile} alt="custom" style={{width:28,height:28}}/><span style={{color:GREEN,fontWeight:600}}>SVG uploaded ✓</span></>
                : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>.svg only · max 10KB · 48×48px recommended</span></>
              }
            </button>
            <input ref={fileRef} type="file" accept=".svg,image/svg+xml" style={{display:"none"}} onChange={handleSvgUpload}/>
            {uploadErr && <div style={{fontSize:12,color:"#EF4444",marginTop:6,fontWeight:600}}>{uploadErr}</div>}
            {uploading && <div style={{fontSize:12,color:SUB,marginTop:6}}>Reading file…</div>}
          </div>
          {/* Confirm */}
          {selected && (
            <div style={{background:SOFT,border:`1.5px solid ${MID}`,borderRadius:14,padding:"14px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
              {selected.svgData
                ? <img src={selected.svgData} alt="" style={{width:36,height:36,flexShrink:0}}/>
                : <span style={{fontSize:32,flexShrink:0}}>{selected.icon}</span>}
              <div>
                <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:TEXT}}>{selected.label}</div>
                <div style={{fontSize:12,color:SUB,marginTop:2}}>Will be awarded to {participant.name}</div>
              </div>
            </div>
          )}
          <button onClick={()=>selected&&onAward(selected)} disabled={!selected}
            style={{width:"100%",padding:"14px 0",background:selected?GRAD:BG,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:selected?"#fff":SUB,cursor:selected?"pointer":"not-allowed",transition:"all .2s"}}>
            Award Badge 🏅
          </button>
        </div>
      </div>
    </div>
  );
}

// ── BadgeClaimScreen — shown when visiting /claim/TOKEN ──
function BadgeClaimScreen({ token, onDone }) {
  const [claim, setClaim] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | valid | claimed | expired | error
  const [showAuth, setShowAuth] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const doc = await fsGetSession("claim-" + token);
        if (!doc) { setStatus("error"); return; }
        if (doc.claimed) { setStatus("claimed"); setClaim(doc); return; }
        const expiry = new Date(doc.createdAt).getTime() + 7*24*60*60*1000;
        if (Date.now() > expiry) { setStatus("expired"); setClaim(doc); return; }
        setClaim(doc); setStatus("valid");
      } catch { setStatus("error"); }
    }
    load();
  }, [token]);

  async function handleClaimed(user) {
    if (!claim) return;
    const uid = user.uid;
    const badge = { ...claim.badge, sessionCode: claim.sessionCode, sessionName: claim.sessionName, awardedAt: claim.createdAt, claimedAt: new Date().toISOString() };
    // Save badge to user profile
    const existing = await fsGet(uid, "badges") || [];
    await fsSet(uid, "badges", [...existing, badge]);
    // Mark claim as used
    await fsSetSession("claim-" + token, { ...claim, claimed: true, claimedAt: new Date().toISOString(), claimedUid: uid });
    setSuccess(true);
  }

  const card = (content) => (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"Poppins,sans-serif"}}>
      <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:20,padding:"36px 28px",maxWidth:380,width:"100%",textAlign:"center"}}>
        <Ham size={52}/>{content}
      </div>
    </div>
  );

  if (status==="loading") return card(<div style={{marginTop:16,color:SUB,fontSize:14}}>Loading your badge…</div>);
  if (status==="error")   return card(<><div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginTop:12,marginBottom:8}}>Link not found</div><div style={{fontSize:14,color:SUB}}>This claim link is invalid or has already been used.</div><button onClick={onDone} style={{marginTop:20,padding:"12px 24px",background:GRAD,border:"none",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:"#fff",cursor:"pointer"}}>Go to Teticoin</button></>);
  if (status==="claimed") return card(<><div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginTop:12,marginBottom:8}}>Already claimed!</div><div style={{fontSize:14,color:SUB}}>This badge was already saved to an account.</div><button onClick={onDone} style={{marginTop:20,padding:"12px 24px",background:GRAD,border:"none",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:"#fff",cursor:"pointer"}}>Go to Teticoin</button></>);
  if (status==="expired") return card(<><div style={{fontSize:48,marginTop:8}}>⏰</div><div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:TEXT,marginTop:10,marginBottom:8}}>Link expired</div><div style={{fontSize:14,color:SUB,lineHeight:1.6}}>This badge claim link expired on<br/><strong>{new Date(new Date(claim.createdAt).getTime()+7*24*60*60*1000).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</strong></div><button onClick={onDone} style={{marginTop:20,padding:"12px 24px",background:GRAD,border:"none",borderRadius:12,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:"#fff",cursor:"pointer"}}>Go to Teticoin</button></>);

  if (success) return (
    <div style={{minHeight:"100vh",background:"#0D0008",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"Poppins,sans-serif"}}>
      <Confetti active/>
      <div style={{fontSize:72,marginBottom:16}}>{claim.badge.svgData ? <img src={claim.badge.svgData} alt="" style={{width:72,height:72}}/> : claim.badge.icon}</div>
      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:28,color:"#fff",marginBottom:8,textAlign:"center"}}>Badge claimed! 🎉</div>
      <div style={{fontSize:15,color:"rgba(255,255,255,.6)",marginBottom:6,textAlign:"center"}}>{claim.badge.label}</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,.4)",marginBottom:32,textAlign:"center"}}>from {claim.sessionName}</div>
      <div style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:14,padding:"14px 20px",marginBottom:32,textAlign:"center",maxWidth:320}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginBottom:4}}>This badge now appears next to your name</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,.8)",fontWeight:600}}>in all future Teticoin sessions</div>
      </div>
      <button onClick={onDone} style={{padding:"14px 40px",background:GRAD,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer"}}>Go to Dashboard →</button>
    </div>
  );

  if (showAuth) return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"Poppins,sans-serif"}}>
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"0 20px",height:56,display:"flex",alignItems:"center",gap:10}}>
        <button onClick={()=>setShowAuth(false)} style={{background:"none",border:"none",cursor:"pointer",color:SUB,fontSize:14}}>← Back</button>
        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:TEXT}}>Log in or register to claim</div>
      </div>
      <div style={{maxWidth:400,margin:"0 auto",padding:"24px 20px"}}>
        <div style={{background:SOFT,border:`1.5px solid ${MID}`,borderRadius:14,padding:"14px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:32}}>{claim.badge.svgData ? <img src={claim.badge.svgData} alt="" style={{width:32,height:32}}/> : claim.badge.icon}</span>
          <div>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:TEXT}}>{claim.badge.label}</div>
            <div style={{fontSize:12,color:SUB}}>from {claim.sessionName} · hosted by {claim.hostName}</div>
          </div>
        </div>
        <Auth onDone={handleClaimed} claimContext="Log in or create an account to save your badge."/>
      </div>
    </div>
  );

  // Valid claim — show badge and options
  return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"Poppins,sans-serif"}}>
      <div style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:24,padding:"36px 28px",maxWidth:380,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:72,lineHeight:1,marginBottom:16}}>
          {claim.badge.svgData ? <img src={claim.badge.svgData} alt="" style={{width:72,height:72,margin:"0 auto"}}/> : claim.badge.icon}
        </div>
        <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:24,color:TEXT,marginBottom:6}}>{claim.badge.label}</div>
        <div style={{fontSize:14,color:SUB,marginBottom:4}}>Awarded to <strong style={{color:TEXT}}>{claim.participantName}</strong></div>
        <div style={{fontSize:13,color:SUB,marginBottom:28}}>at <strong style={{color:TEXT}}>{claim.sessionName}</strong> by {claim.hostName}</div>
        <div style={{background:SOFT,border:`1px solid ${MID}`,borderRadius:10,padding:"8px 14px",display:"inline-block",fontSize:12,color:SUB,marginBottom:24}}>
          Expires {new Date(new Date(claim.createdAt).getTime()+7*24*60*60*1000).toLocaleDateString("en-GB",{day:"numeric",month:"long"})}
        </div>
        <button onClick={()=>setShowAuth(true)}
          style={{width:"100%",padding:"14px 0",background:GRAD,border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",marginBottom:10}}>
          Claim My Badge 🏅
        </button>
        <button onClick={onDone}
          style={{width:"100%",padding:"12px 0",background:"none",border:`1px solid ${BORDER}`,borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:SUB,cursor:"pointer"}}>
          Maybe later
        </button>
        <div style={{fontSize:11,color:SUB,marginTop:12}}>Your badge will be saved to your Teticoin profile</div>
      </div>
    </div>
  );
}

function CoinmasterJoinModal({ onJoin, onClose }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (code.trim().length < 4) return;
    setLoading(true); setError("");
    const err = await onJoin(code.trim());
    if (err) { setError(err); setLoading(false); }
  }

  return (
    <div className="tc-modal-backdrop" style={{position:"fixed",inset:0,zIndex:600,backdropFilter:"blur(4px)",background:"rgba(26,10,20,.4)"}}>
      <div className="tc-modal-sheet" style={{background:"#fff",padding:"28px 24px 40px",width:"100%"}}>
        <div style={{width:36,height:4,background:"#EDD8E8",borderRadius:4,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
          <div style={{width:44,height:44,borderRadius:13,background:"#FAF5FF",border:"1.5px solid #DDD6FE",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polygon points="22 8 22 14 16 11"/></svg>
          </div>
          <div>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,color:"#1A0A14"}}></div>
            <div style={{fontSize:13,color:"#6B7280",marginTop:1}}>Enter the code from your host</div>
          </div>
        </div>
        <div style={{marginTop:20,marginBottom:8}}>
          <input
            value={code}
            onChange={e=>setCode(e.target.value.toUpperCase())}
            onKeyDown={e=>e.key==="Enter"&&handleJoin()}
            placeholder="CM-XXXX"
            autoFocus
            maxLength={7}
            style={{width:"100%",background:"#F9FAFB",border:"1.5px solid #DDD6FE",borderRadius:12,padding:"14px 16px",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,color:"#7C3AED",letterSpacing:6,textAlign:"center",outline:"none"}}
          />
        </div>
        {error && <div style={{fontSize:13,color:"#EF4444",fontWeight:600,marginBottom:8,textAlign:"center"}}>{error}</div>}
        <div style={{fontSize:12,color:"#9CA3AF",textAlign:"center",marginBottom:20,lineHeight:1.6}}>
          The host shares this code from their Session Settings.<br/>You must be logged in to join as Coinmaster.
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={handleJoin} disabled={code.trim().length < 4 || loading}
            style={{width:"100%",padding:"14px 0",background:code.trim().length>=4?"linear-gradient(135deg,#7C3AED,#A855F7)":"#F3F4F6",border:"none",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:code.trim().length>=4?"#fff":"#9CA3AF",cursor:code.trim().length>=4?"pointer":"not-allowed"}}>
            {loading ? "Joining..." : "Join Session →"}
          </button>
          <button onClick={onClose} style={{width:"100%",padding:"13px 0",background:"none",border:"1.5px solid #EDD8E8",borderRadius:13,fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:700,fontSize:14,color:"#9A6080",cursor:"pointer"}}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Root app ──
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [trainer, setTrainer] = useState(null);
  const [sessions, setSessions] = useState(PAST);
  const [cur, setCur] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("free");
  const [planExpiry, setPlanExpiry] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);
  const [showHostEarnings, setShowHostEarnings] = useState(false);
  const [homeEarnings, setHomeEarnings] = useState(null); // {totalCoins, totalSessions}
  const [limitModal, setLimitModal] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showCMJoin, setShowCMJoin] = useState(false);
  const [cmSession, setCmSession] = useState(null);
  const [paymentToast, setPaymentToast] = useState(null);
  const [claimToken, setClaimToken] = useState(null); // badge claim token from /claim/TOKEN URL

  const isSuperadmin = plan === "superadmin";
  const isBeta = plan === "beta";
  const isPaidPro = plan === "pro" || plan === "proY" || plan === "oneTime";
  const isPro = isPaidPro || isBeta || isSuperadmin; // beta + superadmin get full pro access
  const isFree = !isPro;
  const sessionLimit = isFree ? FREE_SESSION_LIMIT : 999;
  const paxLimit = isFree ? FREE_PAX_LIMIT : PRO_PAX_LIMIT;

  // ── Handle payment return from Chip ──
  useEffect(() => {
    if (!trainer) return; // wait until logged in
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const planParam = params.get("plan");
    if (payment === "success" && planParam) {
      const planMap = {
        pro_monthly:  "pro",
        pro_yearly:   "proY",
        one_time:     "oneTime",
      };
      const newPlan = planMap[planParam];
      if (newPlan) {
        setPlan(newPlan);
        ss("plan", newPlan);
        window.history.replaceState({}, "", window.location.pathname);
        setScreen("home");
      }
    } else if (payment === "cancel") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [trainer]);

  // ── Handle /join/CODE, /claim/TOKEN, /login URLs ──
  useEffect(() => {
    const path = window.location.pathname;

    // /login permalink
    if (path === "/login") {
      setScreen("auth");
      setLoading(false);
      return;
    }

    // Badge claim link
    const claimMatch = path.match(/^\/claim\/([a-z0-9]+)$/i);
    if (claimMatch) {
      setClaimToken(claimMatch[1]);
      setScreen("claimBadge");
      setLoading(false);
      return;
    }

    // Participant join link
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
    if (path.match(/^\/join\/[A-Z0-9]+$/i)) return; // skip entirely for join URLs
    if (path.match(/^\/claim\/[a-z0-9]+$/i)) return;  // skip entirely for claim URLs
    if (path === "/login") return; // skip for login permalink — already handled above

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Double-check path inside callback — async timing means URL could have changed
      const currentPath = window.location.pathname;
      if (currentPath.match(/^\/join\/[A-Z0-9]+$/i)) return;
      if (currentPath.match(/^\/claim\/[a-z0-9]+$/i)) return;

      if (user) {
        setCurrentUid(user.uid);
        try {
          const s = await sg("sessions_index"); if (s) setSessions(s);
          const t = { name: user.displayName || user.email.split("@")[0], email: user.email, uid: user.uid };
          setTrainer(t);
          // Write email + name to Firestore so they're visible in Firebase console
          await ss("email", user.email);
          await ss("name", t.name);
          // Write sentinel doc at users/{uid} so admin dashboard can list this user
          await ssParent(user.uid, user.email, t.name);
          loadHomeEarnings(user.uid);
          let p = await sg("plan"); 
          let exp = await sg("planExpiry");

          // ── Superadmin override ──
          if (user.email === SUPERADMIN_EMAIL) {
            p = "superadmin"; exp = null;
            await ss("plan", "superadmin");
            await sd("planExpiry");
          } else {
            // ── Check if existing plan has expired → downgrade to free ──
            if (p && p !== "free" && p !== "beta" && exp) {
              if (new Date(exp) < new Date()) {
                p = "free"; exp = null;
                await ss("plan", "free");
                await sd("planExpiry");
              }
            }
            // ── Check if beta has expired (90 days) ──
            if (p === "beta" && exp) {
              if (new Date(exp) < new Date()) {
                p = "free"; exp = null;
                await ss("plan", "free");
                await sd("planExpiry");
              }
            }
          }
          if (p) setPlan(p);
          if (exp) setPlanExpiry(exp);

          // ── Handle payment return from Chip ──
          const upgraded = await handlePaymentReturn(async (newPlan, newExpiry) => {
            const planVal = newPlan === "pro" ? "pro" : newPlan;
            setPlan(planVal);
            setPlanExpiry(newExpiry);
            await ss("plan", planVal);
            await ss("planExpiry", newExpiry);
            setPaymentToast(newPlan); // show success banner
            setTimeout(() => setPaymentToast(null), 6000);
          });

          setScreen("home");
        } catch {}
      } else {
        // Not logged in — check if returning from payment (needs login first)
        const params = new URLSearchParams(window.location.search);
        if (params.get("payment") === "success") {
          // They paid but aren't logged in — send to auth, payment will be picked up after login
          setScreen("auth");
        } else {
          setScreen("landing");
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function loadHomeEarnings(uid) {
    try {
      const { getFirestore, doc, getDoc } = await import("firebase/firestore");
      const db = getFirestore();
      const snap = await getDoc(doc(db, "users", uid, "data", "earnings"));
      const list = snap.exists() ? (snap.data().value || []) : [];
      setHomeEarnings({ totalCoins: list.reduce((s,e)=>s+e.coins,0), totalSessions: list.length });
    } catch { setHomeEarnings({ totalCoins:0, totalSessions:0 }); }
  }

  async function handleAuth(t) { 
    setCurrentUid(t.uid);
    setTrainer(t);
    await sd("trainer"); // clean up old field if present
    await ss("email", t.email);
    await ss("name", t.name);
    await ssParent(t.uid, t.email, t.name); // register in top-level users collection
    let p = await sg("plan"); if (!p) { await ss("plan", "free"); }
    loadHomeEarnings(t.uid);
    window.history.replaceState({}, "", "/app");
    setScreen("home"); 
  }
  async function handleLogout() { 
    try { await signOut(auth); } catch {}
    setTrainer(null); 
    setCurrentUid(null);
    window.history.replaceState({}, "", "/");
    setScreen("landing"); 
  }
  async function handleNew(name) {
    if (isFree && sessions.length >= sessionLimit) { setLimitModal("sessions"); return; }
    const code = genCode();
    const s = {code, name, createdAt:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}), boardVisible:false, participants:[], groups:[], log:[], coinmasterEnabled:false, hostUid: _currentUid || null};
    await ssSession(code, s);
    const idx = [{code, name, date:s.createdAt, count:0}, ...sessions];
    setSessions(idx); await ss("sessions_index", idx);
    setCur(s); setCreating(false);
    window.history.pushState({}, "", `/session/${code}`);
    setScreen("session");
  }
  async function handleOpen(code) {
    if (code==="DEMO") { setCur(JSON.parse(JSON.stringify(DEMO))); window.history.pushState({}, "", `/session/DEMO`); setScreen("session"); return; }
    const s = await sgSession(code); if (s) { setCur(s); window.history.pushState({}, "", `/session/${code}`); setScreen("session"); }
  }
  async function handleSelectPlan(id, billing) {
    const newPlan = id==="pro" && billing==="yearly" ? "proY" : id;
    setPlan(newPlan); await ss("plan", newPlan);
    setShowPricing(false);
  }

  if (loading) return <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}><style>{CSS}</style><Ham size={60}/></div>;
  if (screen==="claimBadge" && claimToken) return <><style>{CSS}</style><BadgeClaimScreen token={claimToken} onDone={()=>{ window.history.replaceState({},"","/"); setScreen("landing"); }}/></>;
  if (screen==="landing") return <LandingPage onGetStarted={()=>{ window.history.replaceState({},"","/login"); setScreen("auth"); }} onLogin={()=>{ window.history.replaceState({},"","/login"); setScreen("auth"); }}/>;
  if (screen==="auth") return <><style>{CSS}</style><Auth onDone={handleAuth} onBack={()=>{ window.history.replaceState({},"","/"); setScreen("landing"); }}/></>;
  // participantJoin = loaded from /join/CODE URL — always show participant view, never host view
  if (screen==="participantJoin") {
    if (cur) return <><style>{CSS}</style><ParticipantView session={cur}/></>;
    return <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}><style>{CSS}</style><Ham size={60}/><div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:15,color:PINK}}>Loading session…</div></div>;
  }
  if (screen==="participant" && cur) return <><style>{CSS}</style><ParticipantView session={cur}/></>;
  if (false && screen==="coinmaster" && cmSession) return <><style>{CSS}</style><CoinmasterView session={cmSession} onBack={()=>{setCmSession(null);setScreen("home");}}/></>;
  if (screen==="session" && cur) return <><style>{CSS}</style><Session session={cur} plan={plan} paxLimit={paxLimit} onBack={()=>{ window.history.replaceState({},"","/app"); setScreen("home"); }} onPView={()=>setScreen("participant")}/></>;

  // Session settings from home list gear icon
  if (screen==="sessionSettings" && cur) return (
    <>
      <style>{CSS}</style>
      <div style={{minHeight:"100vh",background:BG}}>
        <SessionSettings session={cur}
          onRename={async(name)=>{ const s={...cur,name}; await ssSession(s.code, s); setCur(s); const idx=sessions.map(x=>x.code===s.code?{...x,name}:x); setSessions(idx); await ss("sessions_index",idx); }}
          onToggleLive={async()=>{ const s={...cur,live:cur.live===false?true:false}; await ssSession(s.code, s); setCur(s); }}
          onDuplicate={async()=>{ const code=genCode(); const dup={...JSON.parse(JSON.stringify(cur)),code,name:`${cur.name} (Copy)`,participants:[],log:[],boardVisible:false,live:true,coinmasterEnabled:false}; await ssSession(code, dup); const idx=[{code,name:dup.name,date:dup.createdAt,count:0},...sessions]; setSessions(idx); await ss("sessions_index",idx); setScreen("home"); }}
          onArchive={async()=>{ if(!window.confirm("Archive this session?")) return; const s={...cur,live:false,archived:true}; await ssSession(s.code, s); setCur(s); const idx=sessions.map(x=>x.code===s.code?{...x,archived:true}:x); setSessions(idx); await ss("sessions_index",idx); setScreen("home"); }}
          onExport={()=>{ const rows=[["#","Name","Group","Total"]]; [...(cur.participants||[])].sort((a,b)=>b.total-a.total).forEach(p=>{const g=(cur.groups||[]).find(g=>g.id===p.gid);rows.push([pNum(p.num),p.name,g?.name||"",p.total]);}); const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(rows.map(r=>r.join(",")).join("\n"));a.download=`teticoin-${cur.code}.csv`;a.click(); }}
          onReset={async()=>{ if(!window.confirm("Reset all coins?")) return; const s={...cur,participants:(cur.participants||[]).map(p=>({...p,total:0,bk:{},hist:[]})),log:[]}; await ssSession(s.code, s); setCur(s); }}
          onClose={()=>setScreen("home")}
        />
      </div>
    </>
  );

  const planLabel = plan==="superadmin"?"Superadmin":plan==="beta"?"Beta Pro":plan==="free"?"Free Plan":plan.startsWith("pro")?"Pro Plan":"Team Plan";

  return (
    <div className="tc-app-shell" style={{minHeight:"100vh",background:BG,fontFamily:"Poppins,sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style>

      {showPricing && <PricingPage currentPlan={plan} onSelect={handleSelectPlan} onClose={()=>setShowPricing(false)}/>}
      {showBilling && <BillingPage plan={plan} planExpiry={planExpiry} onUpgrade={()=>{setShowBilling(false);setShowPricing(true);}} onClose={()=>setShowBilling(false)}/>}
      {showProfile && <ProfilePage trainer={trainer} onClose={()=>setShowProfile(false)} onSaved={(newName)=>setTrainer(t=>({...t,name:newName}))}/>}
      {showSuperAdmin && <SuperAdminDashboard onClose={()=>setShowSuperAdmin(false)}/>}
      {showHostEarnings && trainer && <EarningsPage uid={trainer.uid} name={trainer.name} onClose={()=>setShowHostEarnings(false)}/>}
      {showSettings && <SettingsPage onClose={()=>setShowSettings(false)}/>}
      {limitModal && <LimitModal type={limitModal} onUpgrade={()=>{setLimitModal(null);setShowPricing(true);}} onClose={()=>setLimitModal(null)}/>}
      {creating && <CreateModal onConfirm={handleNew} onClose={()=>setCreating(false)}/>}

      {/* ── Payment success banner ── */}
      {paymentToast && (
        <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:9999,
          background:`linear-gradient(135deg,${GREEN},#06B6D4)`,color:"#fff",
          borderRadius:16,padding:"16px 24px",boxShadow:"0 8px 40px rgba(0,0,0,.18)",
          display:"flex",alignItems:"center",gap:14,animation:"slideUp .3s ease",
          maxWidth:480,width:"calc(100% - 32px)"}}>
          <div style={{width:40,height:40,borderRadius:12,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:16,lineHeight:1.2}}>
              🎉 Welcome to {paymentToast === "pro" ? "Pro" : "Team"}!
            </div>
            <div style={{fontSize:12,opacity:.9,marginTop:3}}>
              Your plan has been upgraded. All features are now unlocked.
            </div>
          </div>
          <button onClick={()=>setPaymentToast(null)} style={{background:"none",border:"none",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:20,padding:4,flexShrink:0}}>×</button>
        </div>
      )}

      {/* ── COINMASTER JOIN MODAL ── */}
      {false && showCMJoin && <CoinmasterJoinModal onJoin={async(code)=>{
        let upperCode = code.toUpperCase().trim();
        if (!upperCode.startsWith("CM-") && upperCode.length === 4) upperCode = "CM-" + upperCode;
        // Strategy: we store a lookup doc in sessions collection keyed "cm-{code}"
        // that contains {sessionCode: "XXXXX"}. This works cross-user.
        try {
          const lookup = await fsGetSession("cm-" + upperCode);
          if (lookup && lookup.sessionCode) {
            const full = await sgSession(lookup.sessionCode);
            if (full && full.coinmasterEnabled && full.coinmasterCode === upperCode) {
              setCmSession(full); setShowCMJoin(false); setScreen("coinmaster");
              return null; // success
            }
          }
        } catch {}
        // Fallback: scan host's own sessions (covers self-testing)
        for (const s of sessions) {
          try {
            const full = await sgSession(s.code);
            if (full && full.coinmasterEnabled && full.coinmasterCode === upperCode) {
              setCmSession(full); setShowCMJoin(false); setScreen("coinmaster");
              return null;
            }
          } catch {}
        }
        return "Code not found. Check with your host and try again.";
      }} onClose={()=>setShowCMJoin(false)}/>}

      {profileOpen && (
        <div style={{position:"fixed",inset:0,zIndex:300}} onClick={()=>setProfileOpen(false)}>
          <div style={{position:"absolute",top:72,right:20,background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:16,padding:"8px 0",minWidth:210,boxShadow:`0 8px 32px rgba(26,10,20,.15)`,animation:"slideUp .15s ease"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{padding:"10px 16px 12px",borderBottom:`1px solid ${BORDER}`}}>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:TEXT}}>{trainer?.name}</div>
              <div style={{fontSize:12,color:plan==="free"?SUB:PINK,marginTop:2,fontWeight:600}}>{planLabel}</div>
            </div>
            {[
              {icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label:"Profile", fn:()=>{setShowProfile(true);}},
              {icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, label:"Billing & Plan", fn:()=>{setShowBilling(true);}},
              {icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, label:"My Earnings", fn:()=>{setShowHostEarnings(true);}},
              {icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>, label:"Settings", fn:()=>{setShowSettings(true);}},
              ...(isSuperadmin ? [{icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label:"Admin Dashboard", fn:()=>{setShowSuperAdmin(true);}}] : []),
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

      {/* ── HOME: desktop two-column, mobile single column ── */}
      <div className="tc-home-wrap" style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
        {/* Desktop top nav bar */}
        <div className="tc-home-topnav" style={{display:"none",background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"0 32px",height:64,alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Ham size={36}/>
            <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Teticoin</div>
            <div style={{fontSize:11,color:SUB,fontWeight:500,marginLeft:2}}>by Tetikus</div>
          </div>
          <button onClick={()=>setProfileOpen(v=>!v)}
            style={{display:"flex",alignItems:"center",gap:8,background:profileOpen?SOFT:"none",border:`1px solid ${profileOpen?PINK:BORDER}`,borderRadius:12,padding:"7px 14px 7px 10px",cursor:"pointer",transition:"all .15s"}}>
            <div style={{width:30,height:30,borderRadius:9,background:GRAD,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:12,color:"#fff",flexShrink:0}}>
              {(trainer?.name||"U").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}
            </div>
            <div style={{textAlign:"left"}}>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:13,color:TEXT,lineHeight:1.2}}>{trainer?.name}</div>
              <div style={{fontSize:11,color:plan==="free"?SUB:PINK,fontWeight:600}}>{planLabel}</div>
            </div>
            {homeEarnings && (
              <>
                <div style={{width:1,height:28,background:BORDER,marginLeft:4,flexShrink:0}}/>
                <div style={{display:"flex",gap:10,marginLeft:2}}>
                  <div style={{textAlign:"center"}} title="Total coins earned">
                    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:13,color:PINK,lineHeight:1}}>{homeEarnings.totalCoins}</div>
                    <div style={{fontSize:9,color:SUB,fontWeight:600,lineHeight:1.4}}>coins</div>
                  </div>
                  <div style={{textAlign:"center"}} title="Sessions joined">
                    <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:13,color:PURPLE,lineHeight:1}}>{homeEarnings.totalSessions}</div>
                    <div style={{fontSize:9,color:SUB,fontWeight:600,lineHeight:1.4}}>sessions</div>
                  </div>
                </div>
              </>
            )}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2.5" strokeLinecap="round" style={{transform:profileOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        <div className="tc-home-inner">
          {/* LEFT col: create + stats (desktop sidebar / top on mobile) */}
          <div className="tc-home-left" style={{padding:"20px"}}>
            {/* Mobile top bar — only shows on mobile */}
            <div className="tc-home-mobile-topbar" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Ham size={40}/>
                <div>
                  <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:20,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>Teticoin</div>
                  <div style={{fontSize:10,color:SUB,fontWeight:500}}>by Tetikus</div>
                </div>
              </div>
              <button onClick={()=>setProfileOpen(v=>!v)}
                style={{display:"flex",alignItems:"center",gap:8,background:profileOpen?SOFT:"none",border:`1px solid ${profileOpen?PINK:BORDER}`,borderRadius:12,padding:"7px 12px 7px 8px",cursor:"pointer",transition:"all .15s"}}>
                <div style={{width:28,height:28,borderRadius:8,background:GRAD,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:12,color:"#fff",flexShrink:0}}>
                  {(trainer?.name||"U").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2.5" strokeLinecap="round" style={{transform:profileOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s"}}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            </div>

            {isFree && <UpgradeBanner sessionCount={sessions.filter(s=>!s.archived).length} onUpgrade={()=>setShowPricing(true)}/>}

            {/* Hero card */}
            <div style={{background:`linear-gradient(135deg,#FFF0F7,#FFE4F2)`,border:`1.5px solid ${MID}`,borderRadius:18,padding:"24px 20px",marginBottom:16,textAlign:"center"}}>
              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:22,color:TEXT,lineHeight:1.1,marginBottom:6}}>
                Ready to reward<br/>your participants?
              </div>
              <div style={{fontSize:13,color:SUB,marginBottom:18,lineHeight:1.6}}>
                Start a live session and award points<br/>in real time — no app needed.
              </div>
              <PBtn full onClick={()=>{
                if (isFree && sessions.filter(s=>!s.archived).length >= sessionLimit) { setLimitModal("sessions"); return; }
                setCreating(true);
              }}>+ Create New Session</PBtn>

              {/* Join a session as participant */}
              <div style={{marginTop:20,borderTop:`2px solid ${BORDER}`,paddingTop:14}}>
                <div style={{fontSize:11,color:SUB,fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:.5}}>Join a session as participant</div>
                <JoinSessionField onJoin={async(code)=>{
                  const s = await sgSession(code.toUpperCase().trim());
                  if (s) { setCur(s); setScreen("participant"); return null; }
                  return "Session not found. Check the code and try again.";
                }}/> 
              </div>

              <div style={{marginTop:12,textAlign:"center"}}>
              </div>
            </div>

            {/* Stats */}
            {(() => {
              const activeSessions = sessions.filter(s=>!s.archived);
              const totalParticipants = activeSessions.reduce((sum,s)=>sum+(s.count||0),0);
              const totalCoins = activeSessions.reduce((sum,s)=>sum+(s.totalCoins||0),0);
              return (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
                  {[{num:activeSessions.length,label:"Sessions Created"},{num:totalParticipants,label:"Participants Joined"},{num:totalCoins,label:"Coins Given"}].map(({num,label})=>(
                    <div key={label} style={{background:"#fff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"14px 10px",textAlign:"center"}}>
                      <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:900,fontSize:24,color:PINK,lineHeight:1}}>{num}</div>
                      <div style={{fontSize:10,color:SUB,fontWeight:500,marginTop:4,lineHeight:1.3}}>{label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* RIGHT col: recent sessions */}
          <div className="tc-home-right" style={{padding:"20px"}}>
            {/* Desktop section label */}
            <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:1.2,fontFamily:"Poppins,sans-serif",marginBottom:12}}>Recent Sessions</div>

            {(() => {
              const active = sessions.filter(s=>!s.archived);
              const archived = sessions.filter(s=>s.archived);
              return (
                <>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:8,flexWrap:"wrap"}}>
                    <button onClick={()=>handleOpen("DEMO")} style={{background:"none",border:"none",fontSize:11,color:SUB,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:2,fontFamily:"Poppins,sans-serif",padding:0}}>
                      Load demo session
                    </button>
                    {archived.length > 0 ? (
                      <button onClick={()=>setShowArchived(v=>!v)} style={{background:"none",border:"none",fontSize:11,color:SUB,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:2,fontFamily:"Poppins,sans-serif",padding:0}}>
                        {showArchived ? "Hide archived" : `View archived (${archived.length})`}
                      </button>
                    ) : <div />}
                  </div>

                  {active.length === 0 && !showArchived && (
                    <div style={{border:`1.5px dashed ${BORDER}`,borderRadius:14,padding:"36px",textAlign:"center"}}>
                      <div style={{fontSize:13,color:SUB,lineHeight:1.7}}>No sessions yet.<br/>Create your first one above!</div>
                    </div>
                  )}

                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {(showArchived ? sessions : active).map(s => (
                      <div key={s.code} style={{background:"#fff",border:`1.5px solid ${s.archived?"#E5E7EB":BORDER}`,borderRadius:14,display:"flex",alignItems:"center",overflow:"hidden",opacity:s.archived?.7:1}}>
                        <button onClick={()=>handleOpen(s.code)} style={{flex:1,display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"none",border:"none",cursor:"pointer",textAlign:"left",transition:"background .12s"}}
                          onMouseOver={e=>e.currentTarget.style.background=SOFT}
                          onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                          <div style={{width:44,height:44,borderRadius:10,background:s.archived?"#F3F4F6":SOFT,border:`1.5px solid ${s.archived?"#E5E7EB":MID}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <div style={{fontFamily:"Poppins,sans-serif",fontWeight:500,fontSize:9,color:s.archived?SUB:PINK,letterSpacing:.5}}>{s.code}</div>
                          </div>
                          <div style={{flex:1,textAlign:"left"}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:1}}>
                              <div style={{fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:800,fontSize:14,color:s.archived?SUB:TEXT,lineHeight:1.2}}>{s.name}</div>
                              {s.archived && <span style={{fontSize:9,fontWeight:700,color:"#fff",background:"#9CA3AF",borderRadius:99,padding:"2px 6px",flexShrink:0}}>ARCHIVED</span>}
                            </div>
                            <div style={{fontSize:11,color:SUB,fontWeight:400}}>{s.date} · {s.count} participants</div>
                          </div>
                        </button>
                        <button onClick={async()=>{const full=await sgSession(s.code);if(full){setCur(full);setScreen("sessionSettings");}}}
                          style={{padding:"0 14px",height:"100%",background:"none",border:"none",borderLeft:`1px solid ${BORDER}`,cursor:"pointer",color:SUB,display:"flex",alignItems:"center",justifyContent:"center",minHeight:62}}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
            <div style={{height:48}}/>
          </div>
        </div>
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&family=Poppins:wght@400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Poppins,sans-serif; -webkit-font-smoothing:antialiased; background:${BG}; user-select:none; -webkit-user-select:none; cursor:default; }
  @keyframes floatUp { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-80px);opacity:0} }
  @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes fadeIn { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes slideInRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(1.2)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-thumb { background:${MID}; border-radius:4px; }
  input, textarea { user-select:text; -webkit-user-select:text; cursor:text; }
  input::placeholder { color:${SUB}; opacity:.6; }
  select option { background:#fff; }

  /* ── Responsive modal: bottom-sheet on mobile, centered on desktop ── */
  .tc-modal-backdrop {
    position: fixed; inset: 0; z-index: 500;
    display: flex; align-items: flex-end; justify-content: center;
    backdrop-filter: blur(3px);
    background: rgba(26,10,20,.45);
  }
  .tc-modal-sheet {
    position: relative;
    background: #fff;
    border-radius: 20px 20px 0 0;
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp .25s ease;
  }
  @media (min-width: 700px) {
    .tc-modal-backdrop { align-items: center; }
    .tc-modal-sheet {
      border-radius: 20px;
      max-width: 560px;
      max-height: 85vh;
      animation: fadeIn .2s ease;
    }
  }

  /* ─── App shell ─── */
  .tc-app-shell { height:100vh; background:${BG}; font-family:Poppins,sans-serif; display:flex; flex-direction:column; overflow:hidden; }

  /* ─── Session body: stacked on mobile, side-by-side on desktop ─── */
  .tc-session-body { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .tc-session-left { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .tc-session-right { display:flex; flex-direction:column; overflow:hidden; }
  .tc-tab-bar { background:#fff; border-bottom:1px solid ${BORDER}; display:flex; align-items:center; flex-shrink:0; }
  .tc-right-tabs { display:none; }
  .tc-session-topbar { padding:0 16px; }

  /* ─── Home layout: single column on mobile ─── */
  .tc-home-wrap { flex:1; overflow-y:auto; display:flex; flex-direction:column; }
  .tc-home-topnav { display:none; }
  .tc-home-inner { display:flex; flex-direction:column; max-width:520px; margin:0 auto; width:100%; }
  .tc-home-left { padding:20px 20px 0; }
  .tc-home-right { padding:0 20px 20px; }
  .tc-home-mobile-topbar { display:flex; }

  /* ─── Tablet 600-899px ─── */
  @media (min-width:600px) and (max-width:899px) {
    .tc-app-shell { max-width:680px; margin:0 auto; }
    .tc-session-topbar { padding:0 20px !important; }
    .tc-home-inner { max-width:640px; }
  }

  /* ─── Desktop ≥ 900px ─── */
  @media (min-width:900px) {
    /* Session: side-by-side panels */
    .tc-session-body { flex-direction:row !important; }
    .tc-session-left { width:420px !important; flex:none !important; border-right:1px solid ${BORDER}; display:flex !important; }
    .tc-session-right { flex:1 !important; display:flex !important; }
    .tc-tab-bar { display:none !important; }
    .tc-right-tabs { display:flex !important; background:#fff; border-bottom:1px solid ${BORDER}; align-items:center; flex-shrink:0; }
    .tc-session-topbar { padding:0 24px !important; }

    /* Home: fixed top nav + two-column body */
    .tc-home-wrap { flex-direction:column; overflow:hidden; height:100%; }
    .tc-home-topnav { display:flex !important; }
    .tc-home-inner { flex:1; overflow:hidden; display:grid !important; grid-template-columns:380px 1fr !important; max-width:100% !important; margin:0 !important; height:100%; }
    .tc-home-left { overflow-y:auto; padding:28px 32px !important; border-right:1px solid ${BORDER}; }
    .tc-home-right { overflow-y:auto; padding:28px 32px !important; }
    .tc-home-mobile-topbar { display:none !important; }
  }
`;
