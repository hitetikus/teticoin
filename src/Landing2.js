/* eslint-disable */
// Landing_v2.js — New content strategy (launch-focused, simple, outcome-first)
// To activate: change App.js import to → import LandingPage from "./Landing_v2";
// Theme, fonts, animations, CoinPops all identical to Landing.js

import { useState, useEffect } from "react";

const PINK   = "#FF4FB8";
const PINK2  = "#E91E8C";
const CYAN   = "#00E5FF";
const PURPLE = "#9D50FF";
const PURPLE2= "#7C3AED";
const NEUT   = "#6B7280";
const TEXT   = "#0A0A0F";
const SOFT   = "#FFF0F7";
const BORDER = "rgba(255,79,184,0.15)";
const GRAD   = `linear-gradient(135deg,${PINK},${PURPLE})`;
const GRAD2  = `linear-gradient(135deg,${CYAN},${PURPLE})`;

// ── Floating coin pop animation — identical to Landing.js ──
const COIN_POP_DATA = [
  { type:"name",  name:"Adam",     pts:"+50",  color:PINK,      x:"6%"  },
  { type:"name",  name:"Sarah",    pts:"+150", color:PURPLE,    x:"78%" },
  { type:"name",  name:"Daniel",   pts:"+30",  color:CYAN,      x:"4%"  },
  { type:"name",  name:"Nur",      pts:"+100", color:PINK,      x:"80%" },
  { type:"name",  name:"Marcus",   pts:"+200", color:PURPLE,    x:"8%"  },
  { type:"name",  name:"Aisha",    pts:"+50",  color:"#00C896", x:"75%" },
  { type:"name",  name:"James",    pts:"+30",  color:CYAN,      x:"5%"  },
  { type:"name",  name:"Priya",    pts:"+100", color:PINK,      x:"79%" },
  { type:"action", label:"Correct Answer",  pts:"+50",  color:PURPLE,    x:"3%"  },
  { type:"action", label:"Asked Question",  pts:"+30",  color:CYAN,      x:"76%" },
  { type:"action", label:"Best Idea",       pts:"+100", color:PINK,      x:"7%"  },
  { type:"action", label:"Most Active",     pts:"+50",  color:"#00C896", x:"77%" },
  { type:"action", label:"Correct Answer",  pts:"+50",  color:PURPLE,    x:"5%"  },
  { type:"action", label:"Chat Reply",      pts:"+10",  color:CYAN,      x:"80%" },
];

function CoinPops() {
  const [pops, setPops] = useState([]);
  useEffect(() => {
    let idx = 0;
    function spawnNext() {
      const data = COIN_POP_DATA[idx % COIN_POP_DATA.length];
      const id = Date.now() + Math.random();
      const yBase = 12 + Math.random() * 44;
      setPops(prev => [...prev.slice(-8), { ...data, id, yBase }]);
      idx++;
      setTimeout(spawnNext, 1200 + Math.random() * 1000);
    }
    const t = setTimeout(spawnNext, 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {pops.map(p => (
        <div key={p.id} className="lp-coin-pop"
          style={{ left: p.x, top: `${p.yBase}%`, borderColor: `${p.color}40`, animationDelay:"0s" }}>
          {p.type === "name" ? (
            <>
              <div style={{
                width:30,height:30,borderRadius:"50%",
                background:`${p.color}20`,border:`1.5px solid ${p.color}40`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:12,
                color:p.color,flexShrink:0
              }}>{p.name.slice(0,2).toUpperCase()}</div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:1}}>
                <span style={{fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:12,color:"#6B7280",lineHeight:1}}>{p.name}</span>
                <span style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:16,color:p.color,lineHeight:1}}>{p.pts}</span>
              </div>
            </>
          ) : (
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:2}}>
              <span style={{fontFamily:"DM Sans,sans-serif",fontWeight:600,fontSize:11,color:"#6B7280",lineHeight:1}}>{p.label}</span>
              <span style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:16,color:p.color,lineHeight:1}}>{p.pts} pts</span>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Nunito:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
.lp *{box-sizing:border-box;margin:0;padding:0;}
.lp{font-family:'DM Sans',sans-serif;background:#fff;color:#0A0A0F;-webkit-font-smoothing:antialiased;user-select:none;scroll-behavior:smooth;}
.lp h1,.lp h2,.lp h3,.lp h4{font-family:'Plus Jakarta Sans',sans-serif;}
.lp a{text-decoration:none;color:inherit;}
.lp img{display:block;}
.lp-nav{position:sticky;top:0;z-index:200;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,79,184,0.15);padding:0 40px;height:64px;display:flex;align-items:center;justify-content:space-between;}
.lp-nav-logo{display:flex;align-items:center;gap:8px;font-family:'Nunito',sans-serif;font-weight:900;font-size:18px;cursor:pointer;transition:opacity .15s;}
.lp-nav-logo:hover{opacity:.8;}
.lp-nav-logo span{background:linear-gradient(135deg,#FF4FB8,#9D50FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.lp-nav-links{position:absolute;left:50%;transform:translateX(-50%);display:flex;gap:32px;font-size:14px;font-weight:500;color:#6B7280;}
.lp-nav-links a:hover{color:#FF4FB8;}
.lp-nav-actions{display:flex;gap:10px;align-items:center;margin-left:auto;}
.lp-btn-ghost{padding:8px 18px;border:1.5px solid #E5E7EB;border-radius:999px;font-size:14px;font-weight:600;background:none;cursor:pointer;font-family:'DM Sans',sans-serif;color:#0A0A0F;}
.lp-btn-ghost:hover{border-color:#FF4FB8;color:#FF4FB8;}
.lp-btn-fill{padding:9px 20px;border:none;border-radius:999px;font-size:14px;font-weight:600;color:#fff;background:linear-gradient(135deg,#FF4FB8,#9D50FF);cursor:pointer;font-family:'DM Sans',sans-serif;}
.lp-hero{min-height:96vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px 24px 60px;position:relative;overflow:hidden;background:radial-gradient(ellipse 70% 60% at 50% 0%,rgba(157,80,255,0.08) 0%,transparent 70%),radial-gradient(ellipse 50% 40% at 80% 80%,rgba(0,229,255,0.06) 0%,transparent 60%),#fff;}
@keyframes lpHeroFadeUp{0%{opacity:0;transform:translateY(28px);}100%{opacity:1;transform:translateY(0);}}
@keyframes lpHeroFadeIn{0%{opacity:0;}100%{opacity:1;}}
@keyframes lpFloatPop{0%{opacity:0;transform:translateY(0) scale(0.75);}12%{opacity:1;transform:translateY(-12px) scale(1.04);}72%{opacity:1;transform:translateY(-52px) scale(1);}100%{opacity:0;transform:translateY(-80px) scale(0.92);}}
.lp-coin-pop{position:absolute;pointer-events:none;display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid rgba(255,79,184,0.3);border-radius:14px;padding:10px 16px;white-space:nowrap;animation:lpFloatPop 2.8s ease-out forwards;box-shadow:0 6px 24px rgba(0,0,0,0.1);z-index:5;}
.lp-hero-tag{display:inline-flex;align-items:center;gap:6px;background:rgba(157,80,255,0.08);border:1px solid rgba(157,80,255,0.25);border-radius:999px;padding:5px 14px;font-size:12px;font-weight:600;color:#9D50FF;margin-bottom:24px;letter-spacing:.3px;animation:lpHeroFadeUp .7s cubic-bezier(0.22,1,0.36,1) both;animation-delay:.05s;}
.lp-hero h1{font-size:clamp(38px,5.5vw,68px);line-height:1.06;color:#0A0A0F;max-width:780px;margin:0 auto 20px;letter-spacing:-1.5px;animation:lpHeroFadeUp .8s cubic-bezier(0.22,1,0.36,1) both;animation-delay:.2s;}
.lp-hero-sub{font-size:18px;color:#6B7280;line-height:1.7;max-width:560px;margin:0 auto 36px;animation:lpHeroFadeUp .8s cubic-bezier(0.22,1,0.36,1) both;animation-delay:.35s;}
.lp-hero-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:14px;animation:lpHeroFadeUp .8s cubic-bezier(0.22,1,0.36,1) both;animation-delay:.48s;}
.lp-btn-big{padding:14px 32px;border-radius:999px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:15px;cursor:pointer;}
.lp-btn-big-fill{background:linear-gradient(135deg,#FF4FB8,#9D50FF);color:#fff;border:none;box-shadow:0 8px 32px rgba(255,79,184,0.3);}
.lp-btn-big-outline{background:#fff;color:#0A0A0F;border:1.5px solid #E5E7EB;}
.lp-btn-big-outline:hover{border-color:#9D50FF;color:#9D50FF;}
.lp-hero-note{font-size:12px;color:#9CA3AF;margin-top:8px;animation:lpHeroFadeIn .9s ease both;animation-delay:.62s;}
.lp-screen-glow{position:absolute;bottom:-40px;left:50%;transform:translateX(-50%);width:60%;height:120px;background:radial-gradient(ellipse,rgba(255,79,184,0.18) 0%,transparent 70%);pointer-events:none;}
.lp-section{padding:96px 24px;}
.lp-section-inner{max-width:960px;margin:0 auto;}
.lp-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;}
.lp-section-title{font-size:clamp(30px,4vw,48px);line-height:1.08;color:#0A0A0F;margin-bottom:14px;letter-spacing:-1px;font-weight:800;}
.lp-section-sub{font-size:16px;color:#6B7280;line-height:1.7;max-width:540px;margin:0 auto;}
@keyframes lpFadeUp{from{opacity:0;transform:translateY(28px);}to{opacity:1;transform:translateY(0);}}
.lp-fade-up{opacity:0;transform:translateY(28px);transition:opacity 0.6s ease,transform 0.6s ease;}
.lp-fade-up.visible{opacity:1;transform:translateY(0);}
.lp-fade-up-d1{transition-delay:0.1s;}
.lp-fade-up-d2{transition-delay:0.2s;}
.lp-fade-up-d3{transition-delay:0.3s;}
.lp-fade-up-d4{transition-delay:0.4s;}
.lp-problem{background:#FAFAFA;padding:96px 24px;}
.lp-problem-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:48px;align-items:start;}
.lp-problem-col{background:#fff;border:1px solid #F0F0F0;border-radius:20px;padding:32px;}
.lp-problem-col-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:15px;color:#0A0A0F;margin-bottom:16px;}
.lp-problem-list{list-style:none;display:flex;flex-direction:column;gap:10px;}
.lp-problem-list li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:#374151;line-height:1.6;}
.lp-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:56px;}
.lp-step{background:#fff;padding:36px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;}
.lp-step-num{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:11px;letter-spacing:2px;margin-bottom:20px;}
.lp-step-icon{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:20px;}
.lp-step-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:17px;color:#0A0A0F;margin-bottom:8px;}
.lp-step-body{font-size:13px;color:#6B7280;line-height:1.7;max-width:200px;}
.lp-features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:48px;}
.lp-feat-card{background:#fff;border:1px solid #F0F0F0;border-radius:20px;padding:28px 24px;transition:box-shadow .2s;}
.lp-feat-card:hover{box-shadow:0 8px 32px rgba(0,0,0,0.07);}
.lp-feat-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:"center";margin-bottom:16px;}
.lp-feat-card h4{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:16px;color:#0A0A0F;margin-bottom:8px;}
.lp-feat-card p{font-size:13px;color:#6B7280;line-height:1.65;}
.lp-who-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:48px;max-width:760px;margin-left:auto;margin-right:auto;}
.lp-who-card{background:#fff;border:1px solid #F0F0F0;border-radius:16px;padding:24px;display:flex;gap:16px;align-items:flex-start;}
.lp-who-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.lp-who-card h4{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:15px;color:#0A0A0F;margin-bottom:4px;}
.lp-who-card p{font-size:13px;color:#6B7280;line-height:1.6;}
.lp-usecase-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:48px;}
.lp-usecase-card{border-radius:20px;padding:32px;position:relative;overflow:hidden;}
.lp-usecase-card h4{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:18px;margin-bottom:8px;}
.lp-usecase-card p{font-size:14px;line-height:1.65;opacity:.85;}
.lp-proof{background:#0A0A0F;color:#fff;padding:96px 24px;position:relative;overflow:hidden;}
.lp-proof::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:800px;height:400px;background:radial-gradient(ellipse,rgba(157,80,255,0.12) 0%,transparent 70%);}
.lp-proof-inner{max-width:760px;margin:0 auto;text-align:center;position:relative;z-index:1;}
.lp-proof-badge{display:inline-block;background:rgba(255,79,184,0.15);border:1px solid rgba(255,79,184,0.3);border-radius:999px;padding:6px 18px;font-size:12px;font-weight:700;color:#FDA4CF;letter-spacing:.5px;margin-bottom:28px;}
.lp-pricing{padding:96px 24px;background:#FAFAFA;}
.lp-pricing-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-top:40px;max-width:640px;margin-left:auto;margin-right:auto;}
.lp-plan-card{background:#fff;border:1px solid #E5E7EB;border-radius:20px;padding:36px 28px;}
.lp-plan-card.popular{border-color:#FF4FB8;box-shadow:0 0 0 1px #FF4FB8,0 8px 40px rgba(255,79,184,0.12);}
.lp-plan-badge{display:inline-block;background:linear-gradient(135deg,#FF4FB8,#9D50FF);color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;margin-bottom:16px;letter-spacing:.5px;}
.lp-plan-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;}
.lp-plan-price{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:42px;line-height:1;margin-bottom:4px;}
.lp-plan-period{font-size:13px;color:#6B7280;margin-bottom:4px;}
.lp-plan-early{font-size:11px;font-weight:700;color:#FF4FB8;margin-bottom:0;}
.lp-plan-divider{height:1px;background:#F3F4F6;margin:24px 0;}
.lp-plan-features{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:28px;}
.lp-plan-features li{display:flex;align-items:center;gap:8px;font-size:13px;color:#0A0A0F;}
.lp-plan-btn{width:100%;padding:12px;border-radius:999px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:14px;cursor:pointer;border:none;transition:all .2s;}
.lp-plan-btn.primary{background:linear-gradient(135deg,#FF4FB8,#9D50FF);color:#fff;}
.lp-plan-btn.outline{background:#fff;color:#0A0A0F;border:1.5px solid #E5E7EB;}
.lp-plan-btn.outline:hover{border-color:#FF4FB8;color:#FF4FB8;}
.lp-cta-final{padding:80px 24px;display:flex;justify-content:center;}
.lp-cta-card{background:linear-gradient(135deg,#FF4FB8 0%,#E91E8C 50%,#9D50FF 100%);border-radius:28px;padding:72px 48px;text-align:center;max-width:800px;width:100%;position:relative;overflow:hidden;}
.lp-cta-card::before{content:'';position:absolute;top:-80px;right:-80px;width:300px;height:300px;background:rgba(255,255,255,0.06);border-radius:50%;}
.lp-cta-card::after{content:'';position:absolute;bottom:-60px;left:-60px;width:240px;height:240px;background:rgba(255,255,255,0.04);border-radius:50%;}
.lp-cta-card h2{font-size:clamp(28px,4vw,48px);color:#fff;line-height:1.1;margin-bottom:16px;letter-spacing:-0.5px;position:relative;z-index:1;}
.lp-cta-card p{font-size:16px;color:rgba(255,255,255,0.8);margin-bottom:36px;line-height:1.65;position:relative;z-index:1;}
.lp-cta-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;position:relative;z-index:1;}
.lp-cta-btn-white{padding:14px 32px;border-radius:999px;background:#fff;color:#E91E8C;font-family:'DM Sans',sans-serif;font-weight:700;font-size:15px;border:none;cursor:pointer;}
.lp-cta-btn-outline{padding:14px 32px;border-radius:999px;background:rgba(255,255,255,0.12);color:#fff;font-family:'DM Sans',sans-serif;font-weight:700;font-size:15px;border:1.5px solid rgba(255,255,255,0.3);cursor:pointer;}
.lp-footer{background:#0A0A0F;color:rgba(255,255,255,0.4);padding:40px 48px;}
.lp-footer-inner{max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;}
.lp-footer-logo{font-family:'Nunito',sans-serif;font-weight:900;font-size:16px;background:linear-gradient(135deg,#FF4FB8,#9D50FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.lp-footer-links{display:flex;gap:24px;}
.lp-footer-links a,.lp-footer-links button{font-size:13px;color:rgba(255,255,255,0.35);background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;}
.lp-footer-links a:hover,.lp-footer-links button:hover{color:#fff;}
.lp-footer-bottom{max-width:1120px;margin:16px auto 0;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;font-size:12px;text-align:center;color:rgba(255,255,255,0.2);}
@media(max-width:900px){
  .lp-nav-links,.lp-nav .lp-btn-ghost{display:none;}
  .lp-nav{padding:0 20px;}
  .lp-hero{padding:64px 20px 40px;}
  .lp-problem-grid{grid-template-columns:1fr;}
  .lp-steps{grid-template-columns:1fr 1fr;}
  .lp-features-grid{grid-template-columns:1fr;}
  .lp-who-grid{grid-template-columns:1fr;}
  .lp-usecase-grid{grid-template-columns:1fr;}
  .lp-pricing-grid{grid-template-columns:1fr;}
  .lp-footer-inner{flex-direction:column;gap:20px;text-align:center;}
  .lp-footer-links{flex-wrap:wrap;justify-content:center;}
  .lp-section{padding:64px 20px;}
  .lp-cta-card{padding:48px 24px;}
}
@media(max-width:480px){
  .lp-hero h1{font-size:34px;}
  .lp-steps{grid-template-columns:1fr;}
}
`;

function Ham({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <ellipse cx="22" cy="30" rx="16" ry="16" fill="#F9A8D4"/>
      <ellipse cx="78" cy="30" rx="16" ry="16" fill="#F9A8D4"/>
      <ellipse cx="22" cy="30" rx="9" ry="9" fill="#FDE8F0"/>
      <ellipse cx="78" cy="30" rx="9" ry="9" fill="#FDE8F0"/>
      <ellipse cx="50" cy="52" rx="32" ry="30" fill="#FCE7F3"/>
      <ellipse cx="50" cy="80" rx="18" ry="14" fill="#FFF0F5"/>
      <ellipse cx="26" cy="58" rx="9" ry="7" fill="#FDA4CF" opacity=".6"/>
      <ellipse cx="74" cy="58" rx="9" ry="7" fill="#FDA4CF" opacity=".6"/>
      <circle cx="40" cy="47" r="4.5" fill="#1A0A14"/>
      <circle cx="60" cy="47" r="4.5" fill="#1A0A14"/>
      <circle cx="41.5" cy="45.5" r="1.8" fill="white" opacity=".85"/>
      <circle cx="61.5" cy="45.5" r="1.8" fill="white" opacity=".85"/>
      <ellipse cx="50" cy="56" rx="3.5" ry="2.5" fill="#E91E8C"/>
    </svg>
  );
}

function Check({ color = PINK }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

// ── Privacy & Terms pages — unchanged from Landing.js ──
export function PrivacyPage({ onBack }) {
  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#fff",color:TEXT,minHeight:"100vh"}}>
      <style>{CSS}</style>
      <nav style={{borderBottom:`1px solid ${BORDER}`,padding:"0 48px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={onBack}>
          <Ham size={28}/><span style={{fontFamily:"'Nunito',sans-serif",fontWeight:900,fontSize:20,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Teticoin</span>
        </div>
        <button onClick={onBack} style={{fontSize:14,color:NEUT,background:"none",border:"none",cursor:"pointer"}}>← Back</button>
      </nav>
      <div style={{maxWidth:760,margin:"0 auto",padding:"64px 48px"}}>
        <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:38,color:TEXT,marginBottom:8}}>Privacy Policy</h1>
        <div style={{fontSize:14,color:NEUT,marginBottom:48}}>Last updated: 20 March 2026 · Teticoin by Tetikus</div>
        {[
          ["","This Privacy Policy explains how Teticoin ('we', 'our', or 'us'), operated by Tetikus, collects, uses, and protects your information when you use our platform."],
          ["","By using Teticoin, you agree to the terms of this Privacy Policy. If you do not agree, please do not use the platform."],
          ["1. Information We Collect","Account holders (hosts): When you create an account, we collect your name, email address, and authentication credentials. We also store your session history and usage data.\n\nParticipants: Participants who join a session via QR code or link only provide a display name. No email or account is required. Participant data is stored as part of the session created by the host.\n\nUsage data: We may collect technical information such as browser type and IP address to improve platform performance."],
          ["2. How We Use Your Information","We use your information to provide the platform, authenticate host accounts, process payments via Chip, send transactional emails, and improve features. We do not sell your personal data or use participant data for advertising."],
          ["3. Data Storage","Data is stored securely in Google Firebase (Firestore). Free plan session data is retained for 30 days after last activity. Pro and Team plan data is retained for the subscription lifetime plus 90 days after cancellation."],
          ["4. Participant Data & Host Responsibility","Hosts are responsible for informing participants that their name and performance may be recorded. Hosts must not collect sensitive personal information from participants beyond what is needed to run a session."],
          ["5. Payments","Paid subscriptions are processed through Chip (chip-in.asia). We do not store card details. All payment data is handled by Chip in accordance with PCI DSS standards."],
          ["6. Cookies","Teticoin uses essential cookies to maintain your login session. We do not use advertising or tracking cookies."],
          ["7. Your Rights","You have the right to access, correct, or delete your personal data, and to export session data in CSV format. Contact us at hi.tetikus@gmail.com to exercise these rights."],
          ["8. Third-Party Services","Teticoin uses Google Firebase (authentication & database), Chip (payments), and Vercel (hosting). Each has its own privacy policy."],
          ["9. Changes","We may update this policy from time to time. For questions: hi.tetikus@gmail.com · Tetikus · Malaysia."],
        ].map(([h,b],i) => (
          <div key={i}>
            {h && <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20,color:TEXT,margin:"36px 0 12px"}}>{h}</h2>}
            <p style={{fontSize:15,color:"#374151",marginBottom:14,lineHeight:1.75}}>{b}</p>
          </div>
        ))}
      </div>
      <footer style={{background:"#0A0A0F",color:"rgba(255,255,255,.4)",padding:"24px 48px",textAlign:"center",fontSize:13,marginTop:64}}>
        <span onClick={onBack} style={{cursor:"pointer",margin:"0 12px"}}>← Teticoin</span>
        <a href="mailto:hi.tetikus@gmail.com" style={{color:"rgba(255,255,255,.4)",margin:"0 12px"}}>Contact</a>
        <br/><br/>Powered by <a href="https://www.tetikus.com.my" target="_blank" rel="noopener noreferrer" style={{color:"rgba(255,255,255,.4)"}}>Tetikus</a> · © 2026
      </footer>
    </div>
  );
}

export function TermsPage({ onBack }) {
  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#fff",color:TEXT,minHeight:"100vh"}}>
      <style>{CSS}</style>
      <nav style={{borderBottom:`1px solid ${BORDER}`,padding:"0 48px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={onBack}>
          <Ham size={28}/><span style={{fontFamily:"'Nunito',sans-serif",fontWeight:900,fontSize:20,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Teticoin</span>
        </div>
        <button onClick={onBack} style={{fontSize:14,color:NEUT,background:"none",border:"none",cursor:"pointer"}}>← Back</button>
      </nav>
      <div style={{maxWidth:760,margin:"0 auto",padding:"64px 48px"}}>
        <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:38,color:TEXT,marginBottom:8}}>Terms of Service</h1>
        <div style={{fontSize:14,color:NEUT,marginBottom:48}}>Last updated: 20 March 2026 · Teticoin by Tetikus</div>
        {[
          ["","These Terms govern your access to and use of Teticoin, operated by Tetikus. By accessing or using Teticoin, you agree to be bound by these Terms."],
          ["1. Acceptance of Terms","By creating an account or using Teticoin as a host or participant, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the platform."],
          ["2. Description of Service","Teticoin is a participation engagement platform that allows hosts to create live sessions and award points to participants in real time. The platform is provided \"as is\" and may be updated, changed, or discontinued at any time."],
          ["3. Accounts","To host sessions, you must register with a valid email. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us immediately at hi.tetikus@gmail.com if you suspect unauthorised use."],
          ["4. Acceptable Use","You agree not to use Teticoin to collect sensitive personal data without consent, harass any participant, violate any law, reverse engineer the platform, or gain unauthorised access to other accounts or sessions."],
          ["5. Subscriptions and Payments","Paid plans are billed monthly or annually as selected. Payments are processed through Chip (chip-in.asia). Subscriptions auto-renew unless cancelled before the renewal date. No refunds are issued for unused time."],
          ["6. Intellectual Property","All content, design, branding, and code on Teticoin is the intellectual property of Tetikus. Session data entered by users remains the property of the host."],
          ["7. Disclaimers","Teticoin is provided \"as is\" without warranties. We do not guarantee uninterrupted availability or that the platform will meet your specific requirements."],
          ["8. Limitation of Liability","To the maximum extent permitted by law, Tetikus shall not be liable for any indirect, incidental, or consequential damages."],
          ["9. Termination","You may delete your account at any time. Upon termination, session data is retained for 90 days before permanent deletion."],
          ["10. Governing Law","These Terms are governed by the laws of Malaysia."],
          ["11. Contact","For questions: hi.tetikus@gmail.com · Tetikus · Malaysia."],
        ].map(([h,b],i) => (
          <div key={i}>
            {h && <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20,color:TEXT,margin:"36px 0 12px"}}>{h}</h2>}
            <p style={{fontSize:15,color:"#374151",marginBottom:14,lineHeight:1.75}}>{b}</p>
          </div>
        ))}
      </div>
      <footer style={{background:"#0A0A0F",color:"rgba(255,255,255,.4)",padding:"24px 48px",textAlign:"center",fontSize:13,marginTop:64}}>
        <span onClick={onBack} style={{cursor:"pointer",margin:"0 12px"}}>← Teticoin</span>
        <a href="mailto:hi.tetikus@gmail.com" style={{color:"rgba(255,255,255,.4)",margin:"0 12px"}}>Contact</a>
        <br/><br/>Powered by <a href="https://www.tetikus.com.my" target="_blank" rel="noopener noreferrer" style={{color:"rgba(255,255,255,.4)"}}>Tetikus</a> · © 2026
      </footer>
    </div>
  );
}

// ── Main landing page — new content, same theme ──
export default function LandingPage({ onGetStarted, onLogin }) {
  const [subpage, setSubpage] = useState(null);
  const N = {fontFamily:"Nunito,sans-serif"};

  if (subpage === "privacy") return <PrivacyPage onBack={() => setSubpage(null)}/>;
  if (subpage === "terms")   return <TermsPage   onBack={() => setSubpage(null)}/>;

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({behavior:"smooth"});
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, {threshold: 0.12});
    document.querySelectorAll(".lp-fade-up").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lp">
      <style>{CSS}</style>

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo" onClick={() => window.scrollTo({top:0,behavior:"smooth"})}>
          <Ham size={28}/><span>Teticoin</span>
        </div>
        <div className="lp-nav-links">
          <a href="#how" onClick={(e)=>{e.preventDefault();scrollTo("how")}}>How it works</a>
          <a href="#features" onClick={(e)=>{e.preventDefault();scrollTo("features")}}>Features</a>
          <a href="#pricing" onClick={(e)=>{e.preventDefault();scrollTo("pricing")}}>Pricing</a>
        </div>
        <div className="lp-nav-actions">
          <button className="lp-btn-ghost" onClick={onLogin}>Log in</button>
          <button className="lp-btn-fill" onClick={onGetStarted}>Try Free</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <CoinPops/>
        <div className="lp-hero-tag">✦ Gamification for trainers &amp; events</div>
        <h1>Turn Your Training &amp; Events Into<br/><span style={{background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Interactive Experiences</span></h1>
        <p className="lp-hero-sub">Keep participants engaged with live leaderboard, rewards, and real-time interaction — without complicated setup.</p>
        <div className="lp-hero-btns">
          <button className="lp-btn-big lp-btn-big-fill" onClick={onGetStarted}>Try Free Session</button>
          <button className="lp-btn-big lp-btn-big-outline" onClick={() => window.location.href="mailto:hi.tetikus@gmail.com?subject=Teticoin Demo Request"}>Book Demo</button>
        </div>
        <p className="lp-hero-note">No download required · Works instantly with QR</p>

        {/* Mini leaderboard preview */}
        <div style={{marginTop:52,position:"relative",width:"100%",display:"flex",justifyContent:"center",animation:"lpHeroFadeUp .9s cubic-bezier(0.22,1,0.36,1) both",animationDelay:".55s"}}>
          <div style={{background:"#0A0A0F",borderRadius:24,padding:24,width:300,boxShadow:"0 32px 80px rgba(0,0,0,0.2)",position:"relative",zIndex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <Ham size={20}/>
              <span style={{...N,fontWeight:800,fontSize:13,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Teticoin</span>
              <span style={{marginLeft:"auto",background:"#1A3A22",color:"#10B981",fontSize:9,fontWeight:700,borderRadius:999,padding:"3px 10px"}}>● LIVE</span>
            </div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",marginBottom:16,letterSpacing:1}}>LEADERSHIP BOOTCAMP · LIVE BOARD</div>
            {[
              {rank:"1",init:"HI",name:"Haziq Ibrahim",pts:"210",av:`linear-gradient(135deg,${PURPLE2},${PURPLE})`,rankCol:"#F5A623",ptsCol:PINK,rowBg:"rgba(255,79,184,0.12)",rowBorder:"rgba(255,79,184,0.2)"},
              {rank:"2",init:"AF",name:"Ahmad Faris",pts:"180",av:`linear-gradient(135deg,${PINK},${PINK2})`,rankCol:"rgba(255,255,255,0.3)",ptsCol:"#fff",rowBg:"rgba(255,255,255,0.04)",rowBorder:"transparent"},
              {rank:"3",init:"NA",name:"Nurul Ain",pts:"140",av:`linear-gradient(135deg,${CYAN},${PURPLE})`,rankCol:"rgba(255,255,255,0.3)",ptsCol:"#fff",rowBg:"rgba(255,255,255,0.04)",rowBorder:"transparent"},
              {rank:"4",init:"LH",name:"Luqman Hakim",pts:"120",av:"linear-gradient(135deg,#3B82F6,#1D4ED8)",rankCol:"rgba(255,255,255,0.3)",ptsCol:"#fff",rowBg:"rgba(255,255,255,0.04)",rowBorder:"transparent"},
            ].map(r => (
              <div key={r.rank} style={{background:r.rowBg,border:`1px solid ${r.rowBorder}`,borderRadius:12,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
                <span style={{...N,color:r.rankCol,fontWeight:800,fontSize:12,width:12}}>{r.rank}</span>
                <div style={{width:26,height:26,borderRadius:8,background:r.av,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff"}}>{r.init}</div>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:10,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div></div>
                <span style={{...N,fontWeight:800,fontSize:13,color:r.ptsCol}}>{r.pts}</span>
              </div>
            ))}
          </div>
          <div className="lp-screen-glow"/>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="lp-problem" id="problem">
        <div className="lp-section-inner" style={{textAlign:"center"}}>
          <div className="lp-label lp-fade-up" style={{color:PINK}}>The problem</div>
          <div className="lp-section-title lp-fade-up lp-fade-up-d1">Training terasa boring?<br/>Audience diam je?</div>
          <p className="lp-section-sub lp-fade-up lp-fade-up-d2">Most training sessions and events struggle with low engagement.</p>

          <div className="lp-problem-grid lp-fade-up lp-fade-up-d3">
            {/* Participants column */}
            <div className="lp-problem-col" style={{borderTop:`3px solid ${PINK}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                <div style={{width:36,height:36,borderRadius:10,background:`rgba(255,79,184,0.1)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <div className="lp-problem-col-title" style={{margin:0}}>Participants...</div>
              </div>
              <ul className="lp-problem-list">
                {[
                  "Hilang fokus selepas 20 minit",
                  "Kurang interaction & tanya soalan",
                  "Tak motivated untuk participate",
                ].map(item => (
                  <li key={item}>
                    <span style={{width:20,height:20,borderRadius:6,background:"rgba(255,79,184,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Trainer column */}
            <div className="lp-problem-col" style={{borderTop:`3px solid ${PURPLE}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                <div style={{width:36,height:36,borderRadius:10,background:`rgba(157,80,255,0.1)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </div>
                <div className="lp-problem-col-title" style={{margin:0}}>As a trainer, you end up...</div>
              </div>
              <ul className="lp-problem-list">
                {[
                  "Talking alone — no response from the room",
                  "Struggling to get anyone to participate",
                  "Losing energy and momentum",
                ].map(item => (
                  <li key={item}>
                    <span style={{width:20,height:20,borderRadius:6,background:"rgba(157,80,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section className="lp-section" style={{background:"#fff",textAlign:"center"}}>
        <div className="lp-section-inner">
          <div className="lp-label lp-fade-up" style={{color:PINK}}>The solution</div>
          <div className="lp-section-title lp-fade-up lp-fade-up-d1">Make your session <span style={{background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>hidup &amp; interactive</span> — instantly</div>
          <p className="lp-section-sub lp-fade-up lp-fade-up-d2">Teticoin transforms your session into an engaging experience using a simple gamification system.</p>

          <div style={{marginTop:48,display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,maxWidth:640,marginLeft:"auto",marginRight:"auto"}} className="lp-fade-up lp-fade-up-d3">
            {[
              {icon:"⚡",col:PINK, bg:"rgba(255,79,184,0.06)", label:"Reward participation instantly"},
              {icon:"🏆",col:PURPLE, bg:"rgba(157,80,255,0.06)", label:"Show live leaderboard"},
              {icon:"🔥",col:CYAN, bg:"rgba(0,229,255,0.06)", label:"Create healthy competition"},
              {icon:"🎯",col:"#00C896", bg:"rgba(0,200,150,0.06)", label:"Keep everyone involved, start to end"},
            ].map(item => (
              <div key={item.label} style={{background:item.bg,border:`1px solid ${item.col}20`,borderRadius:16,padding:"20px 24px",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
                <span style={{fontSize:22}}>{item.icon}</span>
                <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:14,color:TEXT}}>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={{marginTop:20,fontSize:13,color:NEUT}} className="lp-fade-up lp-fade-up-d4">
            No complicated setup. No app download.
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-section" id="how" style={{background:"#FAFAFA"}}>
        <div className="lp-section-inner">
          <div style={{textAlign:"center"}}>
            <div className="lp-label lp-fade-up" style={{color:PINK}}>How it works</div>
            <div className="lp-section-title lp-fade-up lp-fade-up-d1">4 simple steps.<br/>Start in under a minute.</div>
          </div>
          <div className="lp-steps">
            {[
              {num:"01",col:PINK,bg:"rgba(255,79,184,0.1)",
                icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
                title:"Create your session",body:"Set up your session in seconds — give it a name and go live."},
              {num:"02",col:CYAN,bg:"rgba(0,229,255,0.1)",
                icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
                title:"Participants scan QR",body:"They join instantly using their phone — no app, no account needed."},
              {num:"03",col:PURPLE,bg:"rgba(157,80,255,0.1)",
                icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
                title:"Give coins &amp; engage",body:"Reward actions, answers, and participation live — one tap per award."},
              {num:"04",col:"#00C896",bg:"rgba(0,200,150,0.1)",
                icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00C896" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
                title:"Show leaderboard",body:"Keep the energy high until the end — everyone sees the rankings live."},
            ].map((s,i) => (
              <div key={s.num} className={`lp-step lp-fade-up lp-fade-up-d${i+1}`}>
                <div className="lp-step-num" style={{color:s.col}}>{s.num}</div>
                <div className="lp-step-icon" style={{background:s.bg}}>{s.icon}</div>
                <div className="lp-step-title" dangerouslySetInnerHTML={{__html:s.title}}/>
                <div className="lp-step-body">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-section" id="features" style={{background:"#fff"}}>
        <div className="lp-section-inner">
          <div style={{textAlign:"center"}}>
            <div className="lp-label lp-fade-up" style={{color:PURPLE}}>Features</div>
            <div className="lp-section-title lp-fade-up lp-fade-up-d1">Everything you need to run<br/>an engaging session</div>
          </div>
          <div className="lp-features-grid">
            {[
              {col:PINK,  bg:"rgba(255,79,184,0.08)",
                icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2.2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
                title:"Keep participants focused",body:"Live leaderboard keeps everyone excited and competitive throughout your session."},
              {col:PURPLE,bg:"rgba(157,80,255,0.08)",
                icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
                title:"Reward instantly",body:"Give coins for participation, answers, or any action — one tap, instant recognition."},
              {col:CYAN,  bg:"rgba(0,229,255,0.08)",
                icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
                title:"Easy to join",body:"Participants scan QR and they're in — no app download, no account, no friction."},
              {col:"#00C896",bg:"rgba(0,200,150,0.08)",
                icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C896" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                title:"Real-time control",body:"Manage session, participants, and scores live — from any device, anywhere in the room."},
              {col:PINK,  bg:"rgba(255,79,184,0.08)",
                icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                title:"Flexible for any session",body:"Use for training, workshops, events, or classes — works for any group size or format."},
              {col:PURPLE,bg:"rgba(157,80,255,0.08)",
                icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
                title:"Projector / TV mode",body:"Cast a full-screen leaderboard to the big screen. Auto-refresh keeps it live automatically."},
            ].map((f,i) => (
              <div key={f.title} className={`lp-feat-card lp-fade-up lp-fade-up-d${(i%4)+1}`}>
                <div className="lp-feat-icon" style={{background:f.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS THIS FOR ── */}
      <section className="lp-section" style={{background:"#FAFAFA",textAlign:"center"}}>
        <div className="lp-section-inner">
          <div className="lp-label lp-fade-up" style={{color:PINK}}>Who it's for</div>
          <div className="lp-section-title lp-fade-up lp-fade-up-d1">Built for people who run sessions</div>
          <div className="lp-who-grid lp-fade-up lp-fade-up-d2">
            {[
              {icon:"🎤",col:PINK,  bg:"rgba(255,79,184,0.08)",  title:"Trainers & Coaches",      body:"Make your training more engaging and impactful — participants stay alert from start to finish."},
              {icon:"🎪",col:PURPLE,bg:"rgba(157,80,255,0.08)",  title:"Event Organizers",        body:"Increase interaction and audience participation at any live event."},
              {icon:"🏢",col:CYAN,  bg:"rgba(0,229,255,0.08)",   title:"Corporate Teams",         body:"Boost engagement during internal sessions, town halls, and team training days."},
              {icon:"📚",col:"#00C896",bg:"rgba(0,200,150,0.08)",title:"Schools & Educators",     body:"Encourage students to participate actively and make learning fun."},
            ].map(w => (
              <div key={w.title} className="lp-who-card">
                <div className="lp-who-icon" style={{background:w.bg}}>
                  <span style={{fontSize:20}}>{w.icon}</span>
                </div>
                <div style={{textAlign:"left"}}>
                  <h4>{w.title}</h4>
                  <p>{w.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="lp-section" style={{background:"#fff"}}>
        <div className="lp-section-inner">
          <div style={{textAlign:"center"}}>
            <div className="lp-label lp-fade-up" style={{color:CYAN}}>Real situations</div>
            <div className="lp-section-title lp-fade-up lp-fade-up-d1">Use Teticoin in real situations</div>
          </div>
          <div className="lp-usecase-grid lp-fade-up lp-fade-up-d2">
            {[
              {bg:`linear-gradient(135deg,rgba(255,79,184,0.08),rgba(157,80,255,0.06))`,border:`rgba(255,79,184,0.15)`,titleCol:PINK2,
                icon:"💼",title:"Training Workshop",body:"Keep participants alert, involved, and excited throughout your full-day or half-day session."},
              {bg:`linear-gradient(135deg,rgba(157,80,255,0.08),rgba(0,229,255,0.06))`,border:`rgba(157,80,255,0.15)`,titleCol:PURPLE,
                icon:"🎙️",title:"Corporate Event",body:"Turn a passive audience into active participants. Make your event one people actually remember."},
              {bg:`linear-gradient(135deg,rgba(0,229,255,0.07),rgba(0,200,150,0.06))`,border:`rgba(0,229,255,0.15)`,titleCol:"#0891B2",
                icon:"🎓",title:"Classroom / Learning",body:"Reward students and improve participation. Make learning feel like a game worth playing."},
              {bg:`linear-gradient(135deg,rgba(0,200,150,0.07),rgba(255,79,184,0.05))`,border:`rgba(0,200,150,0.15)`,titleCol:"#047857",
                icon:"🌍",title:"Community Programs",body:"Make sessions more fun and memorable for any group, any age, any setting."},
            ].map(u => (
              <div key={u.title} className="lp-usecase-card" style={{background:u.bg,border:`1px solid ${u.border}`}}>
                <div style={{fontSize:28,marginBottom:12}}>{u.icon}</div>
                <h4 style={{color:u.titleCol}}>{u.title}</h4>
                <p style={{color:"#374151"}}>{u.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="lp-proof">
        <div className="lp-proof-inner">
          <div className="lp-plan-badge lp-fade-up" style={{marginBottom:28}}>EARLY USERS</div>
          <div className="lp-section-title lp-fade-up lp-fade-up-d1" style={{color:"#fff",marginBottom:16,maxWidth:560,marginLeft:"auto",marginRight:"auto"}}>Already used in real sessions</div>
          <p className="lp-fade-up lp-fade-up-d2" style={{fontSize:16,color:"rgba(255,255,255,0.6)",lineHeight:1.8,marginBottom:40,maxWidth:480,marginLeft:"auto",marginRight:"auto"}}>
            Used by trainers, facilitators and organizers to improve engagement in workshops and events across Malaysia.
          </p>
          {/* Placeholder quote cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginTop:8}} className="lp-fade-up lp-fade-up-d3">
            {[
              {init:"AT",col:PINK,   name:"Ahmad T.",   role:"Corporate Trainer",   quote:"Peserta lebih aktif dan engaged. Lain dari biasa!"},
              {init:"NR",col:PURPLE, name:"Nurul R.",   role:"Workshop Facilitator",quote:"Simple giler nak guna. Tak payah setup lama-lama."},
              {init:"ZK",col:CYAN,   name:"Zulaikha K.",role:"University Lecturer",  quote:"Students pun excited nak join. Best sangat!"},
            ].map(t => (
              <div key={t.name} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:20,textAlign:"left"}}>
                <p style={{fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:1.7,marginBottom:16,fontStyle:"italic"}}>"{t.quote}"</p>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:32,borderRadius:10,background:`${t.col}30`,border:`1.5px solid ${t.col}50`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:11,color:t.col}}>{t.init}</div>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#fff"}}>{t.name}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-pricing" id="pricing">
        <div className="lp-section-inner" style={{textAlign:"center"}}>
          <div className="lp-label lp-fade-up" style={{color:PINK}}>Pricing</div>
          <div className="lp-section-title lp-fade-up lp-fade-up-d1">Simple &amp; flexible pricing</div>
          <p className="lp-section-sub lp-fade-up lp-fade-up-d2">Start free. Upgrade when you're ready.</p>

          <div className="lp-pricing-grid lp-fade-up lp-fade-up-d3">
            {/* Free Plan */}
            <div className="lp-plan-card">
              <div className="lp-plan-label" style={{color:NEUT}}>Free</div>
              <div className="lp-plan-price" style={{color:TEXT}}>RM 0</div>
              <div className="lp-plan-period">Forever free · No card required</div>
              <div className="lp-plan-divider"/>
              <ul className="lp-plan-features">
                {[
                  "1 active session",
                  "Up to 20 participants",
                  "Basic leaderboard",
                  "QR join — no app needed",
                ].map(f => (
                  <li key={f}><Check color={NEUT}/>{f}</li>
                ))}
              </ul>
              <button className="lp-plan-btn outline" onClick={onGetStarted}>Start Free</button>
            </div>

            {/* Pro Plan */}
            <div className="lp-plan-card popular">
              <div className="lp-plan-badge">EARLY ADOPTER</div>
              <div className="lp-plan-label" style={{color:PINK}}>Pro</div>
              <div className="lp-plan-price" style={{color:PINK}}>RM 29</div>
              <div className="lp-plan-period">/ month</div>
              <div className="lp-plan-early">Early Adopter Price 🎉</div>
              <div className="lp-plan-divider" style={{background:"#FECDE8"}}/>
              <ul className="lp-plan-features">
                {[
                  "Unlimited sessions",
                  "Up to 100 participants",
                  "Full features included",
                  "Priority updates",
                  "QR join — no app needed",
                ].map(f => (
                  <li key={f}><Check/>{f}</li>
                ))}
              </ul>
              <button className="lp-plan-btn primary" onClick={() => window.location.href = "https://pay.chip-in.asia/GyQkRcSifMzzRwqpoL"}>Upgrade to Pro</button>
              <div style={{textAlign:"center",fontSize:11,color:NEUT,marginTop:10}}>Cancel anytime · FPX · Card · DuitNow</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="lp-cta-final">
        <div className="lp-cta-card lp-fade-up">
          <h2>Ready to make your session<br/>more engaging?</h2>
          <p>Start your first session in minutes — no setup headache.</p>
          <div className="lp-cta-btns">
            <button className="lp-cta-btn-white" onClick={onGetStarted}>Try Free Session</button>
            <button className="lp-cta-btn-outline" onClick={() => window.location.href="mailto:hi.tetikus@gmail.com?subject=Teticoin Demo Request"}>Book Demo</button>
          </div>
          <p style={{marginTop:16,fontSize:12,color:"rgba(255,255,255,0.5)"}}>No download required · Works instantly with QR</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <div className="lp-footer-logo">Teticoin</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.2)",marginTop:4}}>Interactive engagement system for modern trainers &amp; events</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.2)",marginTop:2}}>by Tetikus · © 2026</div>
          </div>
          <div className="lp-footer-links">
            <button onClick={() => setSubpage("privacy")}>Privacy Policy</button>
            <button onClick={() => setSubpage("terms")}>Terms of Service</button>
            <a href="mailto:hi.tetikus@gmail.com">Contact</a>
          </div>
        </div>
        <div className="lp-footer-bottom">Powered by <a href="https://www.tetikus.com.my" target="_blank" rel="noopener noreferrer" style={{color:"rgba(255,255,255,0.35)"}}>Tetikus</a></div>
      </footer>
    </div>
  );
}
