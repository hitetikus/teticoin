/* eslint-disable */
import React, { useState, useEffect } from "react";
import { auth, fsGetSession, fsSetSession } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import LandingPage from "./Landing"; 

// --- UI CONSTANTS ---
const PINK = "#E91E8C";
const SOFT = "#FFF0F7";
const SUB = "#9A6080";
const BORDER = "#EDD8E8";
const mkAv = n => n.trim().split(/\s+/).map(w=>w[0]).join("").toUpperCase().slice(0,2);

// --- COMPONENT: HAMSTER LOGO ---
function Ham({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="40" fill={SOFT}/>
      <path d="M30 50 Q50 70 70 50" stroke={PINK} strokeWidth="4" fill="none" strokeLinecap="round"/>
      <circle cx="40" cy="40" r="4" fill="#1A0A14"/><circle cx="60" cy="40" r="4" fill="#1A0A14"/>
    </svg>
  );
}

// --- COMPONENT: AVATAR ---
function Av({ s, color = PINK, size = 36 }) {
  return (
    <div style={{width:size,height:size,borderRadius:size*.22,background:color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:size*.35,color:"#fff"}}>
      {s}
    </div>
  );
}

// --- COMPONENT: PARTICIPANT VIEW ---
function ParticipantView({ sessionCode }) {
  const [step, setStep] = useState("loading");
  const [name, setName] = useState("");
  const [live, setLive] = useState(null);
  const [myId, setMyId] = useState(null);

  // Auto-sync with Firebase every 3 seconds
  useEffect(() => {
    const fetchSession = async () => {
      const data = await fsGetSession(sessionCode);
      if (data) {
        setLive(data);
        if (step === "loading") setStep("name");
      }
    };
    fetchSession();
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [sessionCode, step]);

  async function handleJoin() {
    if (!name.trim()) return;
    const participants = live.participants || [];
    const existing = participants.find(p => p.name.toLowerCase() === name.toLowerCase().trim());
    
    if (existing) {
      if (window.confirm(`Welcome back ${existing.name}! Rejoin this session?`)) {
        setMyId(existing.id);
        setStep("joined");
      }
    } else {
      const newP = { id: Date.now(), name: name.trim(), av: mkAv(name), total: 0 };
      const updated = { ...live, participants: [...participants, newP] };
      await fsSetSession(sessionCode, updated);
      setMyId(newP.id);
      setStep("joined");
    }
  }

  if (step === "loading") return <div style={{textAlign:"center", padding:50}}><Ham /></div>;

  if (step === "name") return (
    <div style={{padding:40, textAlign:"center", fontFamily:"sans-serif"}}>
      <Ham size={60} />
      <h2 style={{color:PINK}}>Join Session: {sessionCode}</h2>
      <input 
        style={{width:"100%", padding:12, borderRadius:8, border:`1px solid ${BORDER}`, marginBottom:10, boxSizing:"border-box"}}
        placeholder="Enter your name" 
        value={name} 
        onChange={e => setName(e.target.value)} 
      />
      <button 
        onClick={handleJoin}
        style={{width:"100%", padding:12, borderRadius:8, background:PINK, color:"#fff", border:"none", fontWeight:800, cursor:"pointer"}}
      >
        Enter Session
      </button>
    </div>
  );

  const me = live.participants?.find(p => p.id === myId);
  const sorted = [...(live.participants || [])].sort((a,b) => b.total - a.total);

  return (
    <div style={{padding:20, fontFamily:"sans-serif", background:"#f9f9f9", minHeight:"100vh"}}>
      <div style={{background:"#fff", padding:20, borderRadius:15, display:"flex", alignItems:"center", gap:15, boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
        <Av s={me?.av} size={50} />
        <div style={{flex:1}}>
          <div style={{fontWeight:800}}>{me?.name}</div>
          <div style={{fontSize:12, color:SUB}}>My Points</div>
        </div>
        <div style={{fontSize:24, fontWeight:900, color:PINK}}>{me?.total || 0}</div>
      </div>

      {live.boardVisible ? (
        <div style={{marginTop:20}}>
          <h3 style={{fontSize:16, marginBottom:10}}>Leaderboard</h3>
          {sorted.map((p, i) => (
            <div key={p.id} style={{display:"flex", alignItems:"center", gap:10, padding:"12px 0", borderBottom:`1px solid ${BORDER}`}}>
               <span style={{width:20, fontWeight:800, color: i < 3 ? PINK : SUB}}>{i+1}</span>
               <Av s={p.av} size={30} />
               <span style={{flex:1, fontWeight: p.id === myId ? 800 : 400}}>{p.name} {p.id === myId && "(You)"}</span>
               <span style={{fontWeight:800}}>{p.total}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{textAlign:"center", marginTop:60, color:SUB}}>
          <Ham size={50} />
          <p>The host hasn't opened the leaderboard yet. Stay tuned!</p>
        </div>
      )}
    </div>
  );
}

// --- MAIN APP ROUTER ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sCode, setSCode] = useState(null);

  useEffect(() => {
    // 1. Check URL for ?s=CODE
    const params = new URLSearchParams(window.location.search);
    const code = params.get("s");
    if (code) {
      setSCode(code.toUpperCase());
    }

    // 2. Check Auth State
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <div style={{height:"100vh", display:"flex", alignItems:"center", justifyContent:"center"}}><Ham /></div>;

  // PRIORITY 1: If session code is in URL, show Participant View
  if (sCode) {
    return <ParticipantView sessionCode={sCode} />;
  }

  // PRIORITY 2: If no session code and not logged in, show Landing
  if (!user) {
    return <LandingPage />;
  }

  // PRIORITY 3: Host Dashboard
  return (
    <div style={{padding:20, fontFamily:"sans-serif"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <h1 style={{fontSize:20, color:PINK}}>Host Dashboard</h1>
        <button onClick={() => signOut(auth)} style={{background:"none", border:"none", color:SUB, cursor:"pointer"}}>Logout</button>
      </div>
      <div style={{marginTop:40, textAlign:"center", border:`2px dashed ${BORDER}`, padding:40, borderRadius:20}}>
        <p>Welcome back, <b>{user.displayName || "Host"}</b>!</p>
        <p style={{color:SUB}}>Your Host features should be placed here.</p>
      </div>
    </div>
  );
}