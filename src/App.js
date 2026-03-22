/* eslint-disable */
import { useState, useRef, useEffect, useCallback } from "react";
import { auth, googleProvider, fsGet, fsSet, fsDel, fsGetSession, fsSetSession } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  sendPasswordResetEmail, 
  onAuthStateChanged, 
  updateProfile 
} from "firebase/auth";
import LandingPage from "./Landing";

// --- THEME CONSTANTS ---
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
const TV_DEFAULT = [10,30,50,100,150,200]; 
const ACTS_DEFAULT = [
  {id:"correct", label:"Correct Answer", pts:50, col:PINK},
  {id:"question",label:"Asked Question", pts:30, col:BLUE},
  {id:"chat",    label:"Chat Reply",     pts:10, col:GREEN},
];

// --- UTILS ---
const mkAv = n => n.trim().split(/\s+/).map(w=>w[0]).join("").toUpperCase().slice(0,2);
const pNum = n => `P${String(n).padStart(3,"0")}`;
const genToken = () => Math.random().toString(36).slice(2,10) + Math.random().toString(36).slice(2,10);

// --- SHARED COMPONENTS ---
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
      <circle cx="40" cy="47" r="4.5" fill="#1A0A14"/>
      <circle cx="60" cy="47" r="4.5" fill="#1A0A14"/>
      <ellipse cx="50" cy="56" rx="3.5" ry="2.5" fill={PINK}/>
      <path d="M44 62 Q50 68 56 62" stroke="#C0185A" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function Av({ s, color = PINK, size = 36 }) {
  return (
    <div style={{width:size,height:size,borderRadius:size*.22,flexShrink:0,background:`linear-gradient(135deg,${color},${color}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:size*.34,color:"#fff"}}>
      {s}
    </div>
  );
}

function Inp({ placeholder, value, onChange, type="text", onKeyDown, autoFocus, style: sx = {} }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      onKeyDown={onKeyDown} autoFocus={autoFocus}
      style={{background:BG,border:`1.5px solid ${BORDER}`,borderRadius:12,padding:"11px 14px",fontFamily:"Poppins,sans-serif",fontSize:14,color:TEXT,outline:"none",width:"100%",boxSizing:"border-box",...sx}}/>
  );
}

function PBtn({ children, onClick, disabled, full, style: sx = {} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{background:disabled?BG:GRAD,border:"none",borderRadius:13,padding:"13px 22px",fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:15,color:disabled?SUB:"#fff",cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,transition:"all .15s",width:full?"100%":"auto",...sx}}>
      {children}
    </button>
  );
}

// --- PARTICIPANT VIEW COMPONENT ---
function ParticipantView({ session: init, hostPlan="free" }) {
  const [step, setStep] = useState("name");
  const [name, setName] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [myId, setMyId] = useState(null);
  const [live, setLive] = useState(init);
  const [returnMatch, setReturnMatch] = useState(null);

  // Poll for updates
  useEffect(() => {
    if (!init?.code) return;
    const t = setInterval(async () => {
      const s = await fsGetSession(init.code);
      if (s) setLive(s);
    }, 2500);
    return () => clearInterval(t);
  }, [init?.code]);

  const me = live?.participants?.find(p => p.id === myId);

  async function checkName() {
    const existing = (live.participants || []).find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim());
    if (existing) {
      setReturnMatch(existing);
      setStep("returning");
    } else {
      joinNew();
    }
  }

  async function joinNew() {
    const n = ((live.participants || []).reduce((m, p) => Math.max(m, p.num || 0), 0)) + 1;
    const newP = { id: Date.now(), name: name.trim(), av: mkAv(name), total: 0, bk: {}, num: n };
    const updated = { ...live, participants: [...(live.participants || []), newP] };
    await fsSetSession(init.code, updated);
    setMyId(newP.id);
    setStep("joined");
  }

  function confirmReturn() {
    setMyId(returnMatch.id);
    setStep("joined");
  }

  const card = (content) => (
    <div style={{ minHeight: "100vh", background: "#fdfdfd", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 24, padding: 32, width: "100%", maxWidth: 400, textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
        {content}
      </div>
    </div>
  );

  if (step === "name") return card(<>
    <Ham size={60} />
    <h2 style={{ fontFamily: "Nunito", fontWeight: 900, color: PINK }}>Join Session</h2>
    <div style={{ background: SOFT, padding: "8px 16px", borderRadius: 12, marginBottom: 20, display: "inline-block" }}>
      <span style={{ fontSize: 12, color: SUB }}>Code: </span>
      <strong style={{ letterSpacing: 2 }}>{live.code}</strong>
    </div>
    <Inp placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && checkName()} />
    <PBtn full style={{ marginTop: 12 }} onClick={checkName} disabled={!name.trim()}>Enter Session</PBtn>
  </>);

  if (step === "returning") return card(<>
    <Av s={returnMatch.av} size={60} color={PINK} />
    <h2 style={{ fontFamily: "Nunito", fontWeight: 900 }}>Welcome Back!</h2>
    <p style={{ color: SUB }}>We found an existing score for <b>{returnMatch.name}</b>.</p>
    <div style={{ background: SOFT, padding: 12, borderRadius: 12, margin: "16px 0" }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: PINK }}>{returnMatch.total} 🪙</div>
    </div>
    <PBtn full onClick={confirmReturn}>Yes, that's me!</PBtn>
    <button onClick={() => setStep("name")} style={{ background: "none", border: "none", marginTop: 16, color: SUB, cursor: "pointer" }}>Not me, use another name</button>
  </>);

  if (step === "joined") {
    const sorted = [...(live.participants || [])].sort((a, b) => b.total - a.total);
    const myRank = sorted.findIndex(p => p.id === myId) + 1;

    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fa", padding: "20px" }}>
        {/* Header Profile */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 15, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <Av s={me?.av} size={50} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{me?.name}</div>
            <div style={{ color: SUB, fontSize: 13 }}>Rank #{myRank} of {live.participants.length}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 900, fontSize: 22, color: PINK }}>{me?.total}</div>
            <div style={{ fontSize: 10, color: SUB, textTransform: "uppercase" }}>Coins</div>
          </div>
        </div>

        {/* Leaderboard Toggle */}
        {live.boardVisible ? (
          <div style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: 16, fontWeight: 900 }}>Leaderboard</h3>
            {sorted.slice(0, 10).map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i === 9 ? "none" : `1px solid ${BORDER}` }}>
                <span style={{ width: 24, fontWeight: 800, color: i < 3 ? PINK : SUB }}>{i + 1}</span>
                <Av s={p.av} size={30} color={i === 0 ? YELLOW : PINK} />
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{p.name} {p.id === myId && "(You)"}</span>
                <span style={{ fontWeight: 800 }}>{p.total}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Ham size={80} />
            <p style={{ color: SUB, fontWeight: 500 }}>Waiting for the host to show the leaderboard...</p>
          </div>
        )}
      </div>
    );
  }

  return card(<div style={{ padding: 40 }}><div className="spinner" /></div>);
}

// --- MAIN APP CONTROLLER ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pSession, setPSession] = useState(null);

  useEffect(() => {
    // Check for session in URL (e.g., ?s=CODE)
    const params = new URLSearchParams(window.location.search);
    const sCode = params.get("s");

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (sCode) {
        const sessionData = await fsGetSession(sCode.toUpperCase());
        if (sessionData) {
          setPSession(sessionData);
        }
      }
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Ham size={80} />
    </div>
  );

  // If a participant scanned the QR (sCode exists)
  if (pSession) {
    return <ParticipantView session={pSession} />;
  }

  // Otherwise, show Host View / Landing
  if (!user) return <LandingPage onAuth={() => {}} />;

  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome Host, {user.displayName}</h1>
      <p>Your dashboard is ready. Create a session to get started!</p>
      <button onClick={() => signOut(auth)}>Sign Out</button>
      {/* Rest of your Host logic here */}
    </div>
  );
}