/* eslint-disable */
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

// ── EmailJS credentials — fill these in after EmailJS setup ──
const EMAILJS_SERVICE_ID  = "service_xxxxxxx";   // ← paste your Service ID
const EMAILJS_TEMPLATE_ID = "template_xxxxxxx";  // ← paste your Template ID
const EMAILJS_PUBLIC_KEY  = "xxxxxxxxxxxxxxx";    // ← paste your Public Key

// ── Floating coin pop animation component ──
const COIN_POP_DATA = [
  { label:"+50 pts",  color:PINK,   icon:"🎯", x:"12%",  delay:0.8  },
  { label:"+150 pts", color:PURPLE, icon:"⚡", x:"82%",  delay:1.8  },
  { label:"+30 pts",  color:CYAN,   icon:"💡", x:"22%",  delay:3.2  },
  { label:"+100 pts", color:PINK,   icon:"🏆", x:"76%",  delay:4.1  },
  { label:"+200 pts", color:PURPLE, icon:"🌟", x:"58%",  delay:5.5  },
  { label:"+50 pts",  color:"#00C896",icon:"🔥",x:"38%", delay:6.8  },
  { label:"+30 pts",  color:PINK,   icon:"🎯", x:"68%",  delay:8.2  },
  { label:"+100 pts", color:CYAN,   icon:"👑", x:"18%",  delay:9.0  },
];

function CoinPops() {
  const [pops, setPops] = useState([]);
  const counterRef = useState(0);

  useEffect(() => {
    let idx = 0;
    function spawnNext() {
      const data = COIN_POP_DATA[idx % COIN_POP_DATA.length];
      const id = Date.now() + Math.random();
      const yBase = 52 + Math.random() * 36; // % from top, within hero-screens area
      setPops(prev => [...prev.slice(-6), { ...data, id, yBase }]);
      idx++;
      const nextDelay = 1400 + Math.random() * 1200;
      setTimeout(spawnNext, nextDelay);
    }
    const t = setTimeout(spawnNext, 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {pops.map(p => (
        <div key={p.id} className="lp-coin-pop"
          style={{
            left: p.x,
            top: `${p.yBase}%`,
            color: p.color,
            borderColor: `${p.color}35`,
            animationDelay: "0s",
          }}>
          <span style={{fontSize:14}}>{p.icon}</span>
          <span style={{color:p.color}}>{p.label}</span>
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
@keyframes lpFloatPop{0%{opacity:0;transform:translateY(0) scale(0.7);}15%{opacity:1;transform:translateY(-10px) scale(1.05);}75%{opacity:1;transform:translateY(-44px) scale(1);}100%{opacity:0;transform:translateY(-72px) scale(0.9);}}
.lp-coin-pop{position:absolute;pointer-events:none;display:flex;align-items:center;gap:5px;background:#fff;border:1.5px solid rgba(255,79,184,0.3);border-radius:10px;padding:6px 12px;font-family:'Nunito',sans-serif;font-weight:800;font-size:13px;white-space:nowrap;animation:lpFloatPop 2.6s ease-out forwards;box-shadow:0 4px 16px rgba(0,0,0,0.1);z-index:5;}
.lp-hero-tag{display:inline-flex;align-items:center;gap:6px;background:rgba(157,80,255,0.08);border:1px solid rgba(157,80,255,0.25);border-radius:999px;padding:5px 14px;font-size:12px;font-weight:600;color:#9D50FF;margin-bottom:24px;letter-spacing:.3px;animation:lpHeroFadeUp .7s cubic-bezier(0.22,1,0.36,1) both;animation-delay:.05s;}
.lp-hero h1{font-size:clamp(40px,6vw,72px);line-height:1.04;color:#0A0A0F;max-width:760px;margin:0 auto 20px;letter-spacing:-1.5px;animation:lpHeroFadeUp .8s cubic-bezier(0.22,1,0.36,1) both;animation-delay:.2s;}
.lp-hero-sub{font-size:18px;color:#6B7280;line-height:1.7;max-width:540px;margin:0 auto 36px;animation:lpHeroFadeUp .8s cubic-bezier(0.22,1,0.36,1) both;animation-delay:.35s;}
.lp-hero-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:14px;animation:lpHeroFadeUp .8s cubic-bezier(0.22,1,0.36,1) both;animation-delay:.48s;}
.lp-btn-big{padding:14px 32px;border-radius:999px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:15px;cursor:pointer;}
.lp-btn-big-fill{background:linear-gradient(135deg,#FF4FB8,#9D50FF);color:#fff;border:none;box-shadow:0 8px 32px rgba(255,79,184,0.3);}
.lp-btn-big-outline{background:#fff;color:#0A0A0F;border:1.5px solid #E5E7EB;}
.lp-btn-big-outline:hover{border-color:#9D50FF;color:#9D50FF;}
.lp-hero-note{font-size:12px;color:#9CA3AF;margin-top:8px;animation:lpHeroFadeIn .9s ease both;animation-delay:.62s;}
.lp-hero-screens{position:relative;width:100%;max-width:960px;margin:52px auto 0;display:flex;align-items:flex-end;justify-content:center;gap:16px;padding:0 24px;animation:lpHeroFadeUp .9s cubic-bezier(0.22,1,0.36,1) both;animation-delay:.55s;}
.lp-screen-main{width:280px;border-radius:24px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.18),0 0 0 1px rgba(0,0,0,0.06);flex-shrink:0;}
.lp-screen-side{width:220px;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.14),0 0 0 1px rgba(0,0,0,0.05);flex-shrink:0;}
.lp-screen-glow{position:absolute;bottom:-40px;left:50%;transform:translateX(-50%);width:60%;height:120px;background:radial-gradient(ellipse,rgba(255,79,184,0.18) 0%,transparent 70%);pointer-events:none;}
.lp-logos{border-top:1px solid #F3F4F6;border-bottom:1px solid #F3F4F6;padding:28px 48px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;}
.lp-logos-label{font-size:11px;font-weight:700;color:#9CA3AF;letter-spacing:1.5px;text-transform:uppercase;margin-right:8px;}
.lp-logo-pill{background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:7px 18px;font-size:13px;font-weight:600;color:#6B7280;}
.lp-section{padding:96px 24px;}
.lp-section-inner{max-width:960px;margin:0 auto;}
.lp-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;}
.lp-section-title{font-size:clamp(32px,4vw,50px);line-height:1.06;color:#0A0A0F;margin-bottom:14px;letter-spacing:-1px;font-weight:800;}
.lp-section-sub{font-size:16px;color:#6B7280;line-height:1.7;max-width:540px;margin:0 auto;}
.lp-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:56px;}
.lp-step{background:#fff;padding:36px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;}
.lp-step-num{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:11px;letter-spacing:2px;margin-bottom:20px;}
.lp-step-icon{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:20px;}
.lp-step-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:17px;color:#0A0A0F;margin-bottom:8px;}
.lp-step-body{font-size:13px;color:#6B7280;line-height:1.7;max-width:200px;}
@keyframes lpFadeUp{from{opacity:0;transform:translateY(28px);}to{opacity:1;transform:translateY(0);}}
@keyframes lpFadeIn{from{opacity:0;}to{opacity:1;}}
.lp-fade-up{opacity:0;transform:translateY(28px);transition:opacity 0.6s ease,transform 0.6s ease;}
.lp-fade-up.visible{opacity:1;transform:translateY(0);}
.lp-fade-up-d1{transition-delay:0.1s;}
.lp-fade-up-d2{transition-delay:0.2s;}
.lp-fade-up-d3{transition-delay:0.3s;}
.lp-fade-up-d4{transition-delay:0.4s;}
.lp-feat-dark{background:#0A0A0F;color:#fff;padding:96px 24px;position:relative;overflow:hidden;}
.lp-feat-dark::before{content:'';position:absolute;top:-100px;right:-100px;width:500px;height:500px;background:radial-gradient(circle,rgba(157,80,255,0.15) 0%,transparent 70%);pointer-events:none;}
.lp-feat-dark::after{content:'';position:absolute;bottom:-80px;left:-80px;width:400px;height:400px;background:radial-gradient(circle,rgba(0,229,255,0.1) 0%,transparent 70%);pointer-events:none;}
.lp-feat-tabs{display:flex;gap:8px;margin-top:40px;flex-wrap:wrap;}
.lp-feat-tab{padding:8px 18px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);font-size:13px;font-weight:600;color:rgba(255,255,255,0.5);cursor:pointer;background:none;font-family:'DM Sans',sans-serif;transition:all .2s;}
.lp-feat-tab.active{background:linear-gradient(135deg,#FF4FB8,#9D50FF);border-color:transparent;color:#fff;}
.lp-feat-content{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;margin-top:48px;}
.lp-feat-text h3{font-size:32px;line-height:1.15;color:#fff;margin-bottom:16px;letter-spacing:-0.3px;}
.lp-feat-text p{font-size:15px;color:rgba(255,255,255,0.6);line-height:1.75;margin-bottom:24px;}
.lp-feat-list{list-style:none;display:flex;flex-direction:column;gap:10px;}
.lp-feat-list li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:rgba(255,255,255,0.75);}
.lp-feat-list li::before{content:'';width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,#FF4FB8,#9D50FF);flex-shrink:0;margin-top:6px;}
.lp-feat-screen{position:relative;}
.lp-feat-screen-glow{position:absolute;inset:-30px;background:radial-gradient(circle at center,rgba(157,80,255,0.2) 0%,transparent 70%);pointer-events:none;z-index:0;}
.lp-bento{background:#FAFAFA;padding:96px 24px;}
.lp-bento-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:56px;}
.lp-bento-card{background:#fff;border:1px solid #F0F0F0;border-radius:20px;padding:32px;overflow:hidden;position:relative;transition:box-shadow .2s;}
.lp-bento-card:hover{box-shadow:0 8px 32px rgba(0,0,0,0.07);}
.lp-bento-card.span2{grid-column:span 2;}
.lp-bento-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;}
.lp-bento-card h4{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:17px;color:#0A0A0F;margin-bottom:8px;}
.lp-bento-card p{font-size:13px;color:#6B7280;line-height:1.65;}
.lp-stats{background:#0A0A0F;color:#fff;padding:96px 24px;position:relative;overflow:hidden;}
.lp-stats::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:800px;height:400px;background:radial-gradient(ellipse,rgba(157,80,255,0.12) 0%,transparent 70%);}
.lp-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;margin-top:56px;}
.lp-stat-item{padding:40px 32px;background:rgba(255,255,255,0.02);}
.lp-stat-num{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:52px;line-height:1;margin-bottom:8px;}
.lp-stat-label{font-size:13px;color:rgba(255,255,255,0.5);line-height:1.5;}
.lp-who{padding:80px 0;background:#fff;overflow:hidden;}
.lp-who-inner{max-width:960px;margin:0 auto;padding:0 24px;margin-bottom:40px;}
.lp-carousel-wrap{overflow:hidden;mask-image:linear-gradient(to right,transparent 0%,black 6%,black 94%,transparent 100%);-webkit-mask-image:linear-gradient(to right,transparent 0%,black 6%,black 94%,transparent 100%);}
.lp-carousel-track{display:flex;gap:16px;animation:lpScrollX 32s linear infinite;width:max-content;}
.lp-carousel-track:hover{animation-play-state:paused;}
@keyframes lpScrollX{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
.lp-who-card{flex-shrink:0;width:240px;border-radius:16px;overflow:hidden;background:#F9FAFB;border:1px solid #F0F0F0;}
.lp-who-card img{width:100%;height:155px;object-fit:cover;}
.lp-who-card-body{padding:14px 16px;}
.lp-who-card-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13px;color:#0A0A0F;margin-bottom:4px;}
.lp-who-card-sub{font-size:11px;color:#6B7280;line-height:1.5;}
.lp-pricing{padding:96px 24px;background:#FAFAFA;}
.lp-pricing-toggle{display:inline-flex;background:#F3F4F6;border:1.5px solid #D1D5DB;border-radius:999px;padding:4px;gap:2px;margin-top:28px;}
.lp-pricing-toggle button{border:none;border-radius:999px;padding:9px 22px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:13px;cursor:pointer;transition:all .2s;white-space:nowrap;background:transparent;color:#6B7280;}
.lp-pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:32px;max-width:860px;margin-left:auto;margin-right:auto;}
.lp-plan-card{background:#fff;border:1px solid #E5E7EB;border-radius:20px;padding:36px 28px;}
.lp-plan-card.popular{border-color:#FF4FB8;box-shadow:0 0 0 1px #FF4FB8,0 8px 40px rgba(255,79,184,0.12);}
.lp-plan-badge{display:inline-block;background:linear-gradient(135deg,#FF4FB8,#9D50FF);color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;margin-bottom:16px;letter-spacing:.5px;}
.lp-plan-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;}
.lp-plan-price{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:42px;line-height:1;margin-bottom:4px;}
.lp-plan-period{font-size:13px;color:#6B7280;}
.lp-plan-divider{height:1px;background:#F3F4F6;margin:24px 0;}
.lp-plan-features{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:28px;}
.lp-plan-features li{display:flex;align-items:center;gap:8px;font-size:13px;color:#0A0A0F;}
.lp-plan-btn{width:100%;padding:12px;border-radius:999px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:14px;cursor:pointer;border:none;transition:all .2s;}
.lp-plan-btn.primary{background:linear-gradient(135deg,#FF4FB8,#9D50FF);color:#fff;}
.lp-plan-btn.outline{background:#fff;color:#0A0A0F;border:1.5px solid #E5E7EB;}
.lp-plan-btn.outline:hover{border-color:#FF4FB8;color:#FF4FB8;}
.lp-cta-final{padding:80px 24px;display:flex;justify-content:center;}
.lp-cta-card{background:linear-gradient(135deg,#FF4FB8 0%,#E91E8C 50%,#9D50FF 100%);border-radius:28px;padding:72px 48px;text-align:center;max-width:900px;width:100%;position:relative;overflow:hidden;}
.lp-cta-card::before{content:'';position:absolute;top:-80px;right:-80px;width:300px;height:300px;background:rgba(255,255,255,0.06);border-radius:50%;}
.lp-cta-card::after{content:'';position:absolute;bottom:-60px;left:-60px;width:240px;height:240px;background:rgba(255,255,255,0.04);border-radius:50%;}
.lp-cta-card h2{font-size:clamp(32px,5vw,54px);color:#fff;line-height:1.08;margin-bottom:16px;letter-spacing:-0.5px;position:relative;z-index:1;}
.lp-cta-card p{font-size:17px;color:rgba(255,255,255,0.8);margin-bottom:36px;line-height:1.65;position:relative;z-index:1;}
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
  .lp-hero-screens{flex-direction:column;align-items:center;}
  .lp-screen-side{display:none;}
  .lp-screen-main{width:260px;}
  .lp-steps{grid-template-columns:1fr 1fr;}
  .lp-feat-content{grid-template-columns:1fr;}
  .lp-bento-grid{grid-template-columns:1fr;}
  .lp-bento-card.span2{grid-column:span 1;}
  .lp-stats-grid{grid-template-columns:1fr 1fr;}
  .lp-pricing-grid{grid-template-columns:1fr;}
  .lp-footer-inner{flex-direction:column;gap:20px;text-align:center;}
  .lp-footer-links{flex-wrap:wrap;justify-content:center;}
  .lp-logos{padding:20px 16px;}
  .lp-section{padding:64px 20px;}
  .lp-cta-card{padding:48px 24px;}
}
@media(max-width:480px){
  .lp-hero h1{font-size:34px;}
  .lp-stat-num{font-size:36px;}
  .lp-stats-grid{grid-template-columns:1fr;}
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

export default function LandingPage({ onGetStarted, onLogin }) {
  const [subpage, setSubpage]   = useState(null);
  const [billing, setBilling]   = useState("monthly");
  const [activeTab, setActiveTab] = useState(0);

  if (subpage === "privacy") return <PrivacyPage onBack={() => setSubpage(null)}/>;
  if (subpage === "terms")   return <TermsPage   onBack={() => setSubpage(null)}/>;

  // Smooth scroll helper
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({behavior:"smooth"});
  };

  // Scroll-triggered entrance animation observer
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

  const proPrice  = billing === "monthly" ? "RM 16" : "RM 14";
  const proPeriod = billing === "monthly" ? "/mo · Was RM 22/mo" : "/mo · Billed RM 169/year · Save RM 23";
  const proBtn    = billing === "monthly" ? "Get Pro — RM 16/mo" : "Get Pro — RM 169/year";
  const teamPrice = billing === "monthly" ? "RM 32" : "RM 27";
  const teamPeriod= billing === "monthly" ? "/mo · up to 5 hosts" : "/mo · Billed RM 320/year · Save RM 64";
  const teamBtn   = billing === "monthly" ? "Get Team — RM 32/mo" : "Get Team — RM 320/year";
  const proLink   = billing === "monthly" ? "https://pay.chip-in.asia/GyQkRcSifMzzRwqpoL" : "https://pay.chip-in.asia/RbxCqTYWGld5bJsSKl";
  const teamLink  = billing === "monthly" ? "https://pay.chip-in.asia/4PzNZvVfRlvVVl2N1Y" : "https://pay.chip-in.asia/X4yoJ2E6269tJoE6xt";

  const N = {fontFamily:"Nunito,sans-serif"};

  const whoCards = [
    {img:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=480&q=80&fit=crop",title:"Corporate Trainers",sub:"Award points for great ideas and active participation in L&D sessions."},
    {img:"https://images.unsplash.com/photo-1509062522246-3755977927d7?w=480&q=80&fit=crop",title:"Teachers & Lecturers",sub:"Gamify classroom participation and boost student engagement instantly."},
    {img:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=480&q=80&fit=crop",title:"Workshop Facilitators",sub:"Keep energy high in half-day and full-day sessions."},
    {img:"https://images.unsplash.com/photo-1556761175-4b46a572b786?w=480&q=80&fit=crop",title:"Team Leaders",sub:"Run engaging team meetings where every contribution gets recognised."},
    {img:"https://images.unsplash.com/photo-1515169067868-5387ec356754?w=480&q=80&fit=crop",title:"Event Hosts",sub:"Add a competitive leaderboard element to any live event."},
    {img:"https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=480&q=80&fit=crop",title:"HR & L&D Teams",sub:"Build a culture of recognition across onboarding and training days."},
    {img:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=480&q=80&fit=crop",title:"Coaches & Mentors",sub:"Turn group coaching sessions into high-energy rewarding experiences."},
    {img:"https://images.unsplash.com/photo-1491895200222-0fc4a4c35e18?w=480&q=80&fit=crop",title:"Online Class Hosts",sub:"Bring real-time interaction to Zoom, Meet, or any virtual class."},
  ];

  return (
    <div className="lp">
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-nav-logo" onClick={() => window.scrollTo({top:0, behavior:"smooth"})}><Ham size={28}/><span>Teticoin</span></div>
        <div className="lp-nav-links">
          <a href="#how" onClick={(e)=>{e.preventDefault();scrollTo("how")}}>How it works</a>
          <a href="#features" onClick={(e)=>{e.preventDefault();scrollTo("features")}}>Features</a>
          <a href="#pricing" onClick={(e)=>{e.preventDefault();scrollTo("pricing")}}>Pricing</a>
        </div>
        <div className="lp-nav-actions">
          <button className="lp-btn-ghost" onClick={onLogin}>Log in</button>
          <button className="lp-btn-fill" onClick={onGetStarted}>Get started free</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-tag">✦ Real-time participation gamification</div>
        <h1>Reward participation.<br/>Watch engagement <span style={{background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>skyrocket.</span></h1>
        <p className="lp-hero-sub">Award points to anyone in your group in real time — for great contributions, active participation, or any behaviour worth recognising. No app needed.</p>
        <div className="lp-hero-btns">
          <button className="lp-btn-big lp-btn-big-fill" onClick={onGetStarted}>Start for free</button>
          <button className="lp-btn-big lp-btn-big-outline" onClick={() => scrollTo("how")}>See how it works →</button>
        </div>
        <p className="lp-hero-note">Free plan available · No credit card required</p>

        <CoinPops/>

        <div className="lp-hero-screens">
          {/* LEFT — Home screen */}
          <div className="lp-screen-side" style={{transform:"translateY(32px) rotate(-3deg)"}}>
            <div style={{background:"linear-gradient(145deg,#FFF0F7,#FCE7F3)",borderRadius:20,width:"100%",padding:20,display:"flex",flexDirection:"column",gap:10,minHeight:380}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <Ham size={22}/>
                <span style={{...N,fontWeight:800,fontSize:14,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Teticoin</span>
              </div>
              <div style={{background:"#fff",borderRadius:14,padding:16,textAlign:"center",marginTop:4}}>
                <p style={{...N,fontWeight:700,fontSize:12,color:TEXT,marginBottom:8}}>Ready to reward<br/>your participants?</p>
                <div style={{background:GRAD,color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:11,fontWeight:700}}>+ Create New Session</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:4}}>
                <div style={{background:"#fff",borderRadius:10,padding:"10px 6px",textAlign:"center"}}><div style={{...N,fontWeight:800,fontSize:16,color:PINK}}>12</div><div style={{fontSize:9,color:NEUT}}>Sessions</div></div>
                <div style={{background:"#fff",borderRadius:10,padding:"10px 6px",textAlign:"center"}}><div style={{...N,fontWeight:800,fontSize:16,color:CYAN}}>107</div><div style={{fontSize:9,color:NEUT}}>People</div></div>
                <div style={{background:"#fff",borderRadius:10,padding:"10px 6px",textAlign:"center"}}><div style={{...N,fontWeight:800,fontSize:16,color:PURPLE}}>4.2k</div><div style={{fontSize:9,color:NEUT}}>Coins</div></div>
              </div>
              <div style={{background:"#fff",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{background:SOFT,borderRadius:8,padding:"6px 8px",fontSize:9,fontWeight:700,color:PINK}}>LB2</div>
                <div><div style={{fontSize:11,fontWeight:700,color:TEXT}}>Leadership Bootcamp</div><div style={{fontSize:9,color:NEUT}}>Mar 2026 · 107 participants</div></div>
              </div>
            </div>
          </div>

          {/* CENTER — Award screen */}
          <div className="lp-screen-main">
            <div style={{background:"#fff",borderRadius:24,width:"100%",padding:20,minHeight:520}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:16,flexWrap:"wrap"}}>
                <div style={{...N,fontWeight:800,fontSize:13,color:PINK}}>Leadership Bootcamp</div>
                <div style={{background:"#DCFCE7",color:"#15803D",fontSize:10,fontWeight:700,borderRadius:999,padding:"3px 10px",display:"flex",alignItems:"center",gap:4}}><span style={{width:5,height:5,background:"#15803D",borderRadius:"50%",display:"inline-block"}}/>LIVE</div>
                <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                  <div style={{width:26,height:26,background:"#F3F4F6",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>⊞</div>
                  <div style={{width:26,height:26,background:"#F3F4F6",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>👥</div>
                </div>
              </div>
              <div style={{display:"flex",gap:0,borderBottom:"1px solid #F3F4F6",marginBottom:16}}>
                {["Award","Board","Groups","Log"].map((t,i) => (
                  <div key={t} style={{padding:"8px 12px",fontSize:12,fontWeight:i===0?700:400,color:i===0?PINK:NEUT,borderBottom:i===0?`2px solid ${PINK}`:"none"}}>{t}</div>
                ))}
                <div style={{marginLeft:"auto",padding:"8px 12px",fontSize:12,color:NEUT}}>👥 6</div>
              </div>
              <div style={{border:`1.5px dashed #FECDE8`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <div style={{width:28,height:28,borderRadius:8,border:`1.5px dashed #FECDE8`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:PINK}}>+</div>
                <span style={{fontSize:12,color:NEUT}}>Tap to select participant</span>
                <span style={{marginLeft:"auto",fontSize:14,color:NEUT}}>🔍</span>
              </div>
              <div style={{background:"#FFF9FC",border:`1px solid ${BORDER}`,borderRadius:14,padding:14}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:NEUT,textTransform:"uppercase",marginBottom:10}}>Give Coins</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
                  {["+10","+30","+50","+100","+150","+200"].map(v => (
                    <div key={v} style={{border:`1px solid #FECDE8`,borderRadius:10,padding:10,textAlign:"center",...N,fontWeight:800,fontSize:15,color:PINK}}>{v}</div>
                  ))}
                </div>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:NEUT,textTransform:"uppercase",marginBottom:8}}>Quick Coins</div>
                <div style={{display:"flex",gap:6,marginBottom:10}}>
                  <div style={{flex:1,background:"#F3F0FF",borderRadius:10,padding:"8px 6px",textAlign:"center"}}><div style={{...N,fontWeight:800,fontSize:13,color:PURPLE}}>+50</div><div style={{fontSize:9,color:PURPLE}}>Correct</div></div>
                  <div style={{flex:1,background:"#E0F2FE",borderRadius:10,padding:"8px 6px",textAlign:"center"}}><div style={{...N,fontWeight:800,fontSize:13,color:"#0284C7"}}>+30</div><div style={{fontSize:9,color:"#0284C7"}}>Question</div></div>
                  <div style={{flex:1,background:"#DCFCE7",borderRadius:10,padding:"8px 6px",textAlign:"center"}}><div style={{...N,fontWeight:800,fontSize:13,color:"#15803D"}}>+10</div><div style={{fontSize:9,color:"#15803D"}}>Reply</div></div>
                </div>
                <div style={{background:`linear-gradient(135deg,${PURPLE2},${PURPLE})`,color:"#fff",borderRadius:12,padding:12,textAlign:"center",fontSize:12,fontWeight:700}}>👥 Mass Give Coins</div>
              </div>
            </div>
          </div>

          {/* RIGHT — Leaderboard */}
          <div className="lp-screen-side" style={{transform:"translateY(32px) rotate(3deg)"}}>
            <div style={{background:"#0A0A0F",borderRadius:20,padding:20,minHeight:380}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <Ham size={20}/>
                <span style={{...N,fontWeight:800,fontSize:13,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Teticoin</span>
                <span style={{marginLeft:"auto",background:"#2A2A2F",borderRadius:8,padding:"4px 10px",fontSize:10,color:"rgba(255,255,255,0.5)"}}>Back</span>
              </div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",marginBottom:14,letterSpacing:1}}>LEADERSHIP BOOTCAMP · LB24</div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"rgba(255,255,255,0.3)",marginBottom:10}}>INDIVIDUAL</div>
              {[
                {rank:"1",init:"HI",name:"Haziq Ibrahim",pts:"210",av:`linear-gradient(135deg,${PURPLE2},${PURPLE})`,rankCol:"#F5A623",ptsCol:PINK,rowBg:"rgba(255,79,184,0.12)",rowBorder:"rgba(255,79,184,0.2)"},
                {rank:"2",init:"AF",name:"Ahmad Faris",pts:"180",av:`linear-gradient(135deg,${PINK},${PINK2})`,rankCol:"rgba(255,255,255,0.3)",ptsCol:"#fff",rowBg:"rgba(255,255,255,0.04)",rowBorder:"transparent"},
                {rank:"3",init:"NA",name:"Nurul Ain",pts:"140",av:`linear-gradient(135deg,${PINK},${PINK2})`,rankCol:"rgba(255,255,255,0.3)",ptsCol:"#fff",rowBg:"rgba(255,255,255,0.04)",rowBorder:"transparent"},
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
          </div>
          <div className="lp-screen-glow"/>
        </div>
      </section>

      {/* LOGOS */}
      <div className="lp-logos">
        <span className="lp-logos-label">Trusted by</span>
        {["Petronas","Maybank","TalentCorp","Universiti Malaya","MDEC"].map(n => (
          <div key={n} className="lp-logo-pill">{n}</div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <section className="lp-section" id="how" style={{background:"#FAFAFA"}}>
        <div className="lp-section-inner">
          <div className="lp-label lp-fade-up" style={{color:PINK}}>How it works</div>
          <div className="lp-section-title lp-fade-up lp-fade-up-d1">Start rewarding<br/>in 30 seconds.</div>
          <p className="lp-section-sub lp-fade-up lp-fade-up-d2">No setup headaches, no IT approval needed. Just create a session and start recognising great participation.</p>
          <div className="lp-steps">
            {[
              {num:"01",col:PINK,bg:"rgba(255,79,184,0.1)",icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,title:"Create a session",body:"Give your session a name and go live. Share a QR code or link — everyone joins instantly from any device."},
              {num:"02",col:CYAN,bg:"rgba(0,229,255,0.1)",icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,title:"Invite participants",body:"Share a QR code or link. Participants enter their name and join instantly — no app or account needed."},
              {num:"03",col:PURPLE,bg:"rgba(157,80,255,0.1)",icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,title:"Award points in real time",body:"Tap to award coins for great answers, active participation, or any behaviour worth recognising."},
              {num:"04",col:"#00C896",bg:"rgba(0,200,150,0.1)",icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00C896" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,title:"Reveal the leaderboard",body:"Push the live leaderboard to everyone's screen with one tap. Watch energy spike as rankings appear."},
            ].map((s,i) => (
              <div key={s.num} className={`lp-step lp-fade-up lp-fade-up-d${i+1}`}>
                <div className="lp-step-num" style={{color:s.col}}>{s.num}</div>
                <div className="lp-step-icon" style={{background:s.bg}}>{s.icon}</div>
                <div className="lp-step-title">{s.title}</div>
                <div className="lp-step-body">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE DARK */}
      <section className="lp-feat-dark" id="features">
        <div className="lp-section-inner">
          <div className="lp-label lp-fade-up" style={{color:CYAN,textShadow:`0 0 12px rgba(0,229,255,0.4)`}}>Features</div>
          <div className="lp-section-title lp-fade-up lp-fade-up-d1" style={{color:"#fff"}}>Built to recognise participation<br/><span style={{background:GRAD2,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>online &amp; offline.</span></div>
          <div className="lp-feat-tabs">
            {["Award Screen","Live Leaderboard","Groups & Teams","QR Join","Coinmaster"].map((t,i) => (
              <button key={t} className={`lp-feat-tab${activeTab===i?" active":""}`} onClick={() => setActiveTab(i)}>{t}</button>
            ))}
          </div>
          <div className="lp-feat-content lp-fade-up lp-fade-up-d2">
            <div className="lp-feat-text">
              <h3>Award points<br/>in one tap.</h3>
              <p>Select a participant, tap a coin value, and the points land instantly. Customise every button label — "Correct Answer", "Great Idea", "Most Energetic" — whatever fits your session.</p>
              <ul className="lp-feat-list">
                <li>6-button coin grid with fully custom values</li>
                <li>Named Quick Coins for recurring behaviours</li>
                <li>Custom amount field for any value</li>
                <li>Mass Give — award coins to everyone at once</li>
                <li>Negative coins for fun penalties</li>
              </ul>
            </div>
            <div className="lp-feat-screen">
              <div className="lp-feat-screen-glow"/>
              <div style={{background:"#1A1A22",borderRadius:20,padding:20,maxWidth:280,margin:"0 auto",boxShadow:"0 32px 80px rgba(0,0,0,0.5)",position:"relative",zIndex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
                  <span style={{...N,fontSize:12,fontWeight:800,color:PINK}}>Leadership Bootcamp</span>
                  <span style={{background:"#1A3A22",color:"#10B981",fontSize:9,fontWeight:700,borderRadius:999,padding:"2px 8px"}}>● LIVE</span>
                </div>
                <div style={{display:"flex",gap:6,marginBottom:12,borderBottom:"1px solid rgba(255,255,255,0.07)",paddingBottom:10}}>
                  {["Award","Board","Groups","Log"].map((t,i) => (
                    <span key={t} style={{fontSize:11,fontWeight:i===0?700:400,color:i===0?PINK:"rgba(255,255,255,0.3)",borderBottom:i===0?`2px solid ${PINK}`:"none",paddingBottom:i===0?6:0}}>{t}</span>
                  ))}
                </div>
                <div style={{border:`1.5px dashed rgba(255,79,184,0.3)`,borderRadius:10,padding:10,display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{width:24,height:24,border:`1.5px dashed rgba(255,79,184,0.4)`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:PINK}}>+</div>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>Tap to select participant</span>
                </div>
                <div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:12}}>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"rgba(255,255,255,0.3)",marginBottom:8}}>GIVE COINS</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:8}}>
                    {["+10","+30","+50","+100","+150","+200"].map(v => (
                      <div key={v} style={{border:`1px solid rgba(255,79,184,0.25)`,borderRadius:8,padding:8,textAlign:"center",...N,fontWeight:800,fontSize:13,color:PINK}}>{v}</div>
                    ))}
                  </div>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"rgba(255,255,255,0.3)",marginBottom:6}}>QUICK COINS</div>
                  <div style={{display:"flex",gap:5,marginBottom:8}}>
                    <div style={{flex:1,background:"rgba(157,80,255,0.15)",borderRadius:8,padding:6,textAlign:"center"}}><div style={{...N,fontWeight:800,fontSize:11,color:PURPLE}}>+50</div><div style={{fontSize:8,color:PURPLE}}>Correct</div></div>
                    <div style={{flex:1,background:"rgba(0,229,255,0.1)",borderRadius:8,padding:6,textAlign:"center"}}><div style={{...N,fontWeight:800,fontSize:11,color:CYAN}}>+30</div><div style={{fontSize:8,color:CYAN}}>Question</div></div>
                    <div style={{flex:1,background:"rgba(16,185,129,0.12)",borderRadius:8,padding:6,textAlign:"center"}}><div style={{...N,fontWeight:800,fontSize:11,color:"#10B981"}}>+10</div><div style={{fontSize:8,color:"#10B981"}}>Reply</div></div>
                  </div>
                  <div style={{background:`linear-gradient(135deg,${PURPLE2},${PURPLE})`,borderRadius:10,padding:10,textAlign:"center",fontSize:11,fontWeight:700,color:"#fff"}}>👥 Mass Give Coins</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENTO */}
      <section className="lp-bento">
        <div className="lp-section-inner">
          <div className="lp-label lp-fade-up" style={{color:PURPLE}}>Everything included</div>
          <div className="lp-section-title lp-fade-up lp-fade-up-d1">More features.<br/>Zero complexity.</div>
          <p className="lp-section-sub lp-fade-up lp-fade-up-d2">Every feature is designed to be discovered mid-session, not after a training course.</p>
          <div className="lp-bento-grid">

            <div className="lp-bento-card span2">
              <div className="lp-bento-icon" style={{background:"rgba(255,79,184,0.08)"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg></div>
              <h4>QR join — no app, no account</h4>
              <p>Participants scan a QR code or open a link, type their name, and they're in. Works on any phone or laptop instantly. Can be joined mid-session too.</p>
              <div style={{marginTop:20,background:"rgba(255,79,184,0.04)",border:"1px solid rgba(255,79,184,0.1)",borderRadius:12,padding:16,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
                <div style={{textAlign:"center"}}>
                  <div style={{width:72,height:72,background:`linear-gradient(135deg,rgba(255,79,184,0.15),rgba(157,80,255,0.15))`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px"}}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="5" y="5" width="3" height="3" fill={PINK}/><rect x="16" y="5" width="3" height="3" fill={PINK}/><rect x="5" y="16" width="3" height="3" fill={PINK}/><rect x="16" y="16" width="3" height="3" fill={PURPLE}/><rect x="14" y="14" width="7" height="7" rx="1" stroke={PURPLE}/></svg>
                  </div>
                  <div style={{fontSize:10,fontWeight:700,color:PINK}}>LB24</div>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:TEXT,marginBottom:4}}>teticoin.tetikus.com.my/join/LB24</div>
                  <div style={{fontSize:11,color:NEUT}}>Shareable link — works on any browser</div>
                </div>
              </div>
              <div style={{position:"absolute",bottom:0,right:0,width:180,height:180,background:"radial-gradient(circle,rgba(255,79,184,0.06) 0%,transparent 70%)",pointerEvents:"none",borderRadius:20}}/>
            </div>

            <div className="lp-bento-card">
              <div className="lp-bento-icon" style={{background:"rgba(0,229,255,0.08)"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
              <h4>Live leaderboard push</h4>
              <p>One tap sends the leaderboard to every participant's screen at once. Instant energy spike guaranteed.</p>
              <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:6}}>
                {[{n:"1",c:"#F5A623",name:"Haziq Ibrahim",pts:"210",pc:PINK},{n:"2",c:NEUT,name:"Ahmad Faris",pts:"180",pc:TEXT},{n:"3",c:NEUT,name:"Nurul Ain",pts:"140",pc:TEXT}].map(r => (
                  <div key={r.n} style={{background:"#F9FAFB",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{...N,fontWeight:800,fontSize:11,color:r.c}}>{r.n}</span>
                    <div style={{width:20,height:20,borderRadius:6,background:GRAD}}/>
                    <span style={{flex:1,fontSize:12,fontWeight:600,color:TEXT}}>{r.name}</span>
                    <span style={{...N,fontWeight:800,fontSize:12,color:r.pc}}>{r.pts}</span>
                  </div>
                ))}
              </div>
              <div style={{position:"absolute",bottom:0,right:0,width:120,height:120,background:"radial-gradient(circle,rgba(0,229,255,0.07) 0%,transparent 70%)",pointerEvents:"none"}}/>
            </div>

            <div className="lp-bento-card">
              <div className="lp-bento-icon" style={{background:"rgba(157,80,255,0.08)"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
              <h4>Groups & team scoring</h4>
              <p>Organise into teams. Points accumulate individually and for the group — perfect for competitions and workshops.</p>
              <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:6}}>
                {[{col:PINK,name:"Team Alpha"},{col:PURPLE,name:"Team Bravo"},{col:"#3B82F6",name:"Team Charlie"}].map(g => (
                  <div key={g.name} style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:g.col}}/>
                    <span style={{fontSize:12,fontWeight:700,color:g.col}}>{g.name}</span>
                    <span style={{marginLeft:"auto",fontSize:11,color:NEUT}}>2 members</span>
                  </div>
                ))}
              </div>
              <div style={{position:"absolute",bottom:0,right:0,width:120,height:120,background:"radial-gradient(circle,rgba(157,80,255,0.07) 0%,transparent 70%)",pointerEvents:"none"}}/>
            </div>

            <div className="lp-bento-card">
              <div className="lp-bento-icon" style={{background:"rgba(0,229,255,0.08)"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg></div>
              <h4>Coinmaster — co-host mode</h4>
              <p>Give a helper a code to award coins from their own device. No account needed. Perfect for big rooms.</p>
              <div style={{marginTop:14,background:"rgba(0,229,255,0.06)",border:"1px solid rgba(0,229,255,0.15)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                <div><div style={{fontSize:11,fontWeight:700,color:CYAN}}>CM-4X8K</div><div style={{fontSize:10,color:NEUT}}>Active coinmaster code</div></div>
              </div>
            </div>

            <div className="lp-bento-card">
              <div className="lp-bento-icon" style={{background:"rgba(255,79,184,0.08)"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2.2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
              <h4>Projector / TV mode</h4>
              <p>Cast a clean full-screen leaderboard to your projector or second screen. Auto-refresh keeps it live.</p>
            </div>

            <div className="lp-bento-card span2">
              <div className="lp-bento-icon" style={{background:"rgba(157,80,255,0.08)"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
              <h4>Fully customisable awards</h4>
              <p>Name every coin button anything you want. Mix positive and negative points. Works for any format, any group size.</p>
              <div style={{marginTop:16,display:"flex",gap:8,flexWrap:"wrap"}}>
                {[{bg:"rgba(157,80,255,0.08)",border:"rgba(157,80,255,0.2)",col:PURPLE,label:"+50 Correct Answer"},{bg:"rgba(0,229,255,0.08)",border:"rgba(0,229,255,0.2)",col:CYAN,label:"+30 Great Idea"},{bg:"rgba(255,79,184,0.08)",border:"rgba(255,79,184,0.2)",col:PINK,label:"+100 MVP"},{bg:"rgba(239,68,68,0.06)",border:"rgba(239,68,68,0.15)",col:"#EF4444",label:"-10 Phone Out"}].map(t => (
                  <div key={t.label} style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:600,color:t.col}}>{t.label}</div>
                ))}
              </div>
              <div style={{position:"absolute",bottom:0,right:0,width:180,height:180,background:"radial-gradient(circle,rgba(157,80,255,0.05) 0%,transparent 70%)",pointerEvents:"none",borderRadius:20}}/>
            </div>

            <div className="lp-bento-card">
              <div className="lp-bento-icon" style={{background:"rgba(255,79,184,0.08)"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2.2" strokeLinecap="round"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></svg></div>
              <h4>Full session history & log</h4>
              <p>Every coin award is logged with timestamp and participant. Export, review, and replay your sessions anytime.</p>
            </div>

          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="lp-stats">
        <div className="lp-section-inner" style={{position:"relative",zIndex:1}}>
          <div style={{textAlign:"center"}}>
            <div className="lp-label lp-fade-up" style={{color:"#FDA4CF",display:"block",textAlign:"center"}}>Impact</div>
            <div className="lp-section-title lp-fade-up lp-fade-up-d1" style={{color:"#fff",textAlign:"center",maxWidth:600,margin:"0 auto 14px"}}>Engagement goes up.<br/>Every single time.</div>
            <p className="lp-fade-up lp-fade-up-d2" style={{fontSize:16,color:"rgba(255,255,255,0.5)",lineHeight:1.75,maxWidth:480,margin:"0 auto"}}>The recognition loop is simple: acknowledge great participation, and watch more of it happen naturally.</p>
          </div>
          <div className="lp-stats-grid">
            {[
              {num:"3×",grad:GRAD,label:"More contributions per session when points are on the line"},
              {num:"94%",grad:GRAD2,label:"Participants reported feeling more engaged throughout"},
              {num:"30s",grad:GRAD,label:"Average time to start a live session from scratch"},
              {num:"0",grad:GRAD2,label:"Apps to install — works on any device, any browser"},
            ].map((s,i) => (
              <div key={s.num} className={`lp-stat-item lp-fade-up lp-fade-up-d${i+1}`}>
                <div className="lp-stat-num" style={{background:s.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{s.num}</div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO CAROUSEL */}
      <section className="lp-who">
        <div className="lp-who-inner">
          <div className="lp-label lp-fade-up" style={{color:PINK}}>Who it's for</div>
          <div className="lp-section-title lp-fade-up lp-fade-up-d1">Built for anyone who runs groups.</div>
          <p className="lp-section-sub lp-fade-up lp-fade-up-d2">From classrooms to corporate training — if you lead a group, Teticoin makes engagement effortless.</p>
        </div>
        <div className="lp-carousel-wrap">
          <div className="lp-carousel-track">
            {[...whoCards,...whoCards].map((c,i) => (
              <div key={i} className="lp-who-card">
                <img src={c.img} alt={c.title}/>
                <div className="lp-who-card-body">
                  <div className="lp-who-card-title">{c.title}</div>
                  <div className="lp-who-card-sub">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="lp-pricing" id="pricing">
        <div className="lp-section-inner" style={{textAlign:"center"}}>
          <div className="lp-label lp-fade-up" style={{color:PINK}}>Pricing</div>
          <div className="lp-section-title lp-fade-up lp-fade-up-d1">Simple, honest pricing.</div>
          <p className="lp-section-sub lp-fade-up lp-fade-up-d2">Start for free. Upgrade when your sessions grow.</p>
          <div style={{display:"flex",justifyContent:"center",marginTop:28}}>
          <div className="lp-pricing-toggle lp-fade-up lp-fade-up-d3">
            {[["monthly","Monthly"],["yearly","Yearly — save 35%"]].map(([v,l]) => (
              <button key={v} onClick={() => setBilling(v)}
                style={{background:billing===v?GRAD:"transparent",color:billing===v?"#fff":NEUT,
                  boxShadow:billing===v?"0 4px 16px rgba(255,79,184,0.25)":"none"}}>
                {l}
              </button>
            ))}
          </div>
          </div>
          <div className="lp-pricing-grid lp-fade-up lp-fade-up-d4" style={{margin:"32px auto 0"}}>
            <div className="lp-plan-card">
              <div className="lp-plan-label" style={{color:NEUT}}>Free forever</div>
              <div className="lp-plan-price" style={{color:TEXT}}>RM 0</div>
              <div className="lp-plan-period">No time limit. No card required.</div>
              <div className="lp-plan-divider"/>
              <ul className="lp-plan-features">
                {["Up to 3 sessions","30 participants per session","Live leaderboard","QR join — no app needed","1 group per session"].map(f => (
                  <li key={f}><Check color={NEUT}/>{f}</li>
                ))}
              </ul>
              <button className="lp-plan-btn outline" onClick={onGetStarted}>Get started free</button>
            </div>
            <div className="lp-plan-card popular">
              <div className="lp-plan-badge">POPULAR</div>
              <div className="lp-plan-label" style={{color:PINK}}>Pro</div>
              <div className="lp-plan-price" style={{color:PINK}}>{proPrice}</div>
              <div className="lp-plan-period">{proPeriod}</div>
              <div className="lp-plan-divider" style={{background:"#FECDE8"}}/>
              <ul className="lp-plan-features">
                {["Unlimited sessions","Unlimited participants","Up to 10 groups","Custom award labels","PIN rejoin for returning participants","Full session history","Coinmaster co-host mode"].map(f => (
                  <li key={f}><Check/>{f}</li>
                ))}
              </ul>
              <button className="lp-plan-btn primary" onClick={() => window.location.href = proLink}>{proBtn}</button>
              <div style={{textAlign:"center",fontSize:11,color:NEUT,marginTop:10}}>Cancel anytime · FPX · Card · DuitNow</div>
            </div>
            <div className="lp-plan-card">
              <div className="lp-plan-label" style={{color:PURPLE}}>Team</div>
              <div className="lp-plan-price" style={{color:PURPLE}}>{teamPrice}</div>
              <div className="lp-plan-period">{teamPeriod}</div>
              <div className="lp-plan-divider" style={{background:"#DDD6FE"}}/>
              <ul className="lp-plan-features">
                {["Everything in Pro","5 host accounts","Shared session library","Admin dashboard","Bulk participant import (CSV)"].map(f => (
                  <li key={f}><Check color={PURPLE}/>{f}</li>
                ))}
              </ul>
              <button className="lp-plan-btn outline" style={{borderColor:"#DDD6FE",color:PURPLE}} onClick={() => window.location.href = teamLink}>{teamBtn}</button>
              <div style={{textAlign:"center",fontSize:11,color:NEUT,marginTop:10}}>Cancel anytime · FPX · Card · DuitNow</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta-final">
        <div className="lp-cta-card lp-fade-up">
          <h2>Make your next session<br/>one they'll remember.</h2>
          <p>Join trainers, teachers, and facilitators who use Teticoin<br/>to turn passive attendance into active participation.</p>
          <div className="lp-cta-btns">
            <button className="lp-cta-btn-white" onClick={onGetStarted}>Create Session</button>
            <button className="lp-cta-btn-outline" onClick={() => scrollTo("pricing")}>See Pricing →</button>
          </div>
          <p style={{marginTop:16,fontSize:12,color:"rgba(255,255,255,0.5)"}}>No credit card required · Free plan available forever</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <div className="lp-footer-logo">Teticoin</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.2)",marginTop:4}}>by Tetikus · © 2026</div>
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
