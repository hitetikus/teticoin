/* eslint-disable */
import { useState } from "react";
// ─── Landing page + Privacy + Terms ───────────────────────────────────────────
// To edit content: search for the text you want to change and edit inline.
// All text is plain English inside JSX — no coding knowledge needed.
// ─────────────────────────────────────────────────────────────────────────────

const LPINK = "#E91E8C";
const LPINK2 = "#FF4FB8";
const LGRAD = `linear-gradient(135deg,${LPINK},${LPINK2})`;
const LTEXT = "#0F0A0D";
const LSUB = "#6B7280";
const LBORDER = "#F0E8EE";
const LSOFT = "#FFF0F7";

const LANDING_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Inter:wght@400;500;600&display=swap');
  .lp *{box-sizing:border-box;}
  .lp{font-family:Inter,sans-serif;background:#fff;color:${LTEXT};-webkit-font-smoothing:antialiased;user-select:none;}
  .lp img{display:block;width:100%;object-fit:cover;}
  .lp a{text-decoration:none;color:inherit;}
  @keyframes lpScrollX{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
  .lp-carousel-track{display:flex;gap:20px;animation:lpScrollX 30s linear infinite;width:max-content;}
  .lp-carousel-track:hover{animation-play-state:paused;}
  .lp-carousel-wrap{overflow:hidden;width:100%;mask-image:linear-gradient(to right,transparent 0%,black 8%,black 92%,transparent 100%);-webkit-mask-image:linear-gradient(to right,transparent 0%,black 8%,black 92%,transparent 100%);}
  .lp-who-card{flex-shrink:0;width:260px;border-radius:14px;overflow:hidden;position:relative;background:#F9FAFB;border:1px solid ${LBORDER};}
  .lp-who-card img{width:100%;height:170px;object-fit:cover;}
  .lp-who-label{padding:14px 16px;font-family:Nunito,sans-serif;font-weight:800;font-size:14px;color:${LTEXT};}
  .lp-who-sub{padding:0 16px 14px;font-size:12px;color:${LSUB};line-height:1.5;margin-top:-4px;}
  .lp-billing-cute{display:flex;background:#F3F4F6;border-radius:999px;padding:4px;gap:2px;}
  .lp-billing-cute button{border:none;border-radius:999px;padding:8px 18px;font-family:Inter,sans-serif;font-weight:700;font-size:13px;cursor:pointer;transition:all .2s;white-space:nowrap;}
  .lp-feat-img{width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:16px;}
  @keyframes lpFadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  .lp-nav{position:sticky;top:0;z-index:200;background:rgba(255,255,255,0.96);backdrop-filter:blur(12px);border-bottom:1px solid ${LBORDER};padding:0 48px;height:64px;display:flex;align-items:center;justify-content:space-between;}
  .lp-logo-text{font-family:Nunito,sans-serif;font-weight:900;font-size:20px;background:${LGRAD};-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  .lp-nav-links{display:flex;gap:36px;font-size:14px;font-weight:500;color:${LSUB};}
  .lp-nav-links a:hover{color:${LPINK};}
  .lp-btn-ghost{padding:8px 20px;border:1.5px solid ${LBORDER};border-radius:8px;font-size:14px;font-weight:600;color:${LTEXT};background:none;cursor:pointer;font-family:Inter,sans-serif;}
  .lp-btn-ghost:hover{border-color:${LPINK};color:${LPINK};}
  .lp-btn-fill{padding:8px 20px;border:none;border-radius:8px;font-size:14px;font-weight:600;color:#fff;background:${LGRAD};cursor:pointer;font-family:Inter,sans-serif;}
  .lp-nav-ham{display:none;background:none;border:none;cursor:pointer;padding:4px;}
  .lp-hero{min-height:90vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:80px 48px;gap:60px;max-width:1280px;margin:0 auto;position:relative;}
  .lp-hero-tag{display:inline-flex;align-items:center;gap:6px;background:${LSOFT};border:1px solid #FECDE8;border-radius:4px;padding:5px 12px;font-size:12px;font-weight:600;color:${LPINK};margin-bottom:20px;letter-spacing:.3px;}
  .lp-hero h1{font-family:Nunito,sans-serif;font-weight:900;font-size:52px;line-height:1.07;color:${LTEXT};margin-bottom:18px;}
  .lp-hero h1 em{font-style:normal;background:${LGRAD};-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  .lp-hero-sub{font-size:17px;color:${LSUB};line-height:1.75;margin-bottom:32px;max-width:480px;}
  .lp-hero-btns{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;}
  .lp-btn-big{padding:14px 32px;border-radius:8px;font-family:Inter,sans-serif;font-weight:600;font-size:15px;cursor:pointer;}
  .lp-btn-big-fill{background:${LGRAD};color:#fff;border:none;}
  .lp-btn-big-outline{background:#fff;color:${LTEXT};border:1.5px solid #E5E7EB;}
  .lp-btn-big-outline:hover{border-color:${LPINK};}
  .lp-hero-note{font-size:13px;color:#9CA3AF;}
  .lp-hero-img{border-radius:16px;overflow:hidden;height:520px;position:relative;}
  .lp-hero-img img{height:100%;object-fit:cover;}
  .lp-hero-badge{position:absolute;bottom:20px;left:20px;background:rgba(255,255,255,0.97);border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,.12);}
  .lp-logos{border-top:1px solid ${LBORDER};border-bottom:1px solid ${LBORDER};padding:28px 48px;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;}
  .lp-logos-label{font-size:12px;font-weight:600;color:#9CA3AF;white-space:nowrap;margin-right:8px;letter-spacing:.5px;text-transform:uppercase;}
  .lp-logo-pill{background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:8px 20px;font-size:13px;font-weight:600;color:#6B7280;}
  .lp-section{padding:96px 48px;}
  .lp-section-inner{max-width:1200px;margin:0 auto;}
  .lp-section-label{font-size:12px;font-weight:600;color:${LPINK};text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;}
  .lp-section-title{font-family:Nunito,sans-serif;font-weight:900;font-size:40px;line-height:1.1;color:${LTEXT};margin-bottom:14px;}
  .lp-section-sub{font-size:16px;color:${LSUB};line-height:1.75;max-width:560px;}
  .lp-how{background:#FAFAFA;position:relative;overflow:hidden;}
  .lp-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:${LBORDER};margin-top:64px;}
  .lp-step{background:#fff;padding:40px 36px;}
  .lp-step-num{font-family:Nunito,sans-serif;font-weight:900;font-size:13px;color:${LPINK};letter-spacing:1px;margin-bottom:20px;}
  .lp-step-icon{width:48px;height:48px;margin-bottom:20px;}
  .lp-step-title{font-family:Nunito,sans-serif;font-weight:900;font-size:20px;color:${LTEXT};margin-bottom:8px;}
  .lp-step-body{font-size:14px;color:${LSUB};line-height:1.7;}
  .lp-photo-split{display:grid;grid-template-columns:1fr 1fr;min-height:540px;}
  .lp-photo-split-img{overflow:hidden;}
  .lp-photo-split-img img{height:100%;object-fit:cover;}
  .lp-photo-split-content{padding:80px 64px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden;background:${LSOFT};}
  .lp-quote-mark{font-family:Nunito,sans-serif;font-weight:900;font-size:64px;color:${LPINK};line-height:.8;margin-bottom:12px;}
  .lp-quote-text{font-family:Nunito,sans-serif;font-weight:800;font-size:22px;color:${LTEXT};line-height:1.45;margin-bottom:16px;}
  .lp-quote-attr{font-size:14px;color:${LSUB};font-weight:500;}
  .lp-feat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0;border:1px solid ${LBORDER};border-radius:12px;overflow:hidden;margin-top:56px;}
  .lp-feat{padding:36px;border-right:1px solid ${LBORDER};border-bottom:1px solid ${LBORDER};}
  .lp-feat:nth-child(2n){border-right:none;}
  .lp-feat:nth-child(3),.lp-feat:nth-child(4){border-bottom:none;}
  .lp-feat-icon{width:40px;height:40px;border-radius:8px;background:${LSOFT};display:flex;align-items:center;justify-content:center;margin-bottom:16px;}
  .lp-feat-title{font-family:Nunito,sans-serif;font-weight:900;font-size:17px;color:${LTEXT};margin-bottom:6px;}
  .lp-feat-body{font-size:14px;color:${LSUB};line-height:1.7;}
  .lp-stats{background:${LTEXT};color:#fff;padding:96px 48px;position:relative;overflow:hidden;}
  .lp-stats-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;}
  .lp-stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;}
  .lp-stat-item{border-top:1px solid rgba(255,255,255,.15);padding-top:24px;}
  .lp-stat-num{font-family:Nunito,sans-serif;font-weight:900;font-size:48px;color:${LPINK2};line-height:1;}
  .lp-stat-label{font-size:14px;color:rgba(255,255,255,.55);margin-top:6px;line-height:1.5;}
  .lp-photo-full{position:relative;height:480px;overflow:hidden;}
  .lp-photo-full img{width:100%;height:100%;object-fit:cover;}
  .lp-photo-full-overlay{position:absolute;inset:0;background:linear-gradient(to right,rgba(15,10,13,0.72) 40%,rgba(15,10,13,0.1));}
  .lp-photo-full-content{position:absolute;inset:0;display:flex;align-items:center;padding:0 96px;max-width:700px;}
  .lp-pricing{padding:96px 48px;background:#FAFAFA;position:relative;overflow:hidden;}
  .lp-pricing-inner{max-width:1100px;margin:0 auto;}
  .lp-pricing-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid ${LBORDER};border-radius:12px;overflow:hidden;margin-top:56px;max-width:820px;}
  .lp-cta{padding:96px 48px;text-align:center;position:relative;overflow:hidden;}
  .lp-cta h2{font-family:Nunito,sans-serif;font-weight:900;font-size:44px;color:${LTEXT};line-height:1.1;margin-bottom:14px;}
  .lp-cta p{font-size:16px;color:${LSUB};margin-bottom:36px;line-height:1.7;}
  .lp-footer{background:#0F0A0D;color:rgba(255,255,255,.45);padding:32px 48px;}
  .lp-footer-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;}
  .lp-footer-logo-text{font-family:Nunito,sans-serif;font-weight:900;font-size:16px;background:${LGRAD};-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  .lp-footer-links{display:flex;gap:24px;}
  .lp-footer-links a{color:rgba(255,255,255,.4);font-size:13px;}
  .lp-footer-links a:hover{color:#fff;}
  .lp-footer-powered{font-size:12px;color:rgba(255,255,255,.25);margin-top:16px;text-align:center;border-top:1px solid rgba(255,255,255,.07);padding-top:16px;max-width:1200px;margin:16px auto 0;}
  .lp-footer-powered a{color:rgba(255,255,255,.4);}
  .lp-footer-powered a:hover{color:#fff;}
  @media(max-width:900px){
    .lp-nav{padding:0 20px;}
    .lp-nav-links,.lp-nav .lp-btn-ghost{display:none;}
    .lp-nav-ham{display:block;}
    .lp-hero{grid-template-columns:1fr;padding:48px 24px;min-height:auto;gap:36px;}
    .lp-hero h1{font-size:36px;}
    .lp-hero-img{height:280px;}
    .lp-logos{padding:20px 24px;}
    .lp-section{padding:64px 24px;}
    .lp-section-title{font-size:30px;}
    .lp-steps{grid-template-columns:1fr;}
    .lp-photo-split{grid-template-columns:1fr;}
    .lp-photo-split-img{height:280px;}
    .lp-photo-split-content{padding:48px 24px;}
    .lp-feat-grid{grid-template-columns:1fr;border-radius:0;border-left:none;border-right:none;}
    .lp-feat{border-right:none !important;border-bottom:1px solid ${LBORDER} !important;}
    .lp-feat:last-child{border-bottom:none !important;}
    .lp-stats{padding:64px 24px;}
    .lp-stats-inner{grid-template-columns:1fr;gap:40px;}
    .lp-stats-grid{grid-template-columns:1fr 1fr;}
    .lp-photo-full{height:320px;}
    .lp-photo-full-content{padding:0 32px;max-width:100%;}
    .lp-photo-full-content h2{font-size:26px !important;}
    .lp-pricing{padding:64px 24px;}
    .lp-pricing-grid{grid-template-columns:1fr !important;max-width:100% !important;}
    .lp-pricing-grid > div:first-child{border-right:none !important;border-bottom:1px solid ${LBORDER} !important;}
    [style*="grid-template-columns:repeat(3,1fr)"]{grid-template-columns:1fr !important;}
    [style*="grid-template-columns: repeat(3,1fr)"]{grid-template-columns:1fr !important;}
    .lp-cta{padding:64px 24px;}
    .lp-cta h2{font-size:32px;}
    .lp-footer{padding:32px 24px;}
    .lp-footer-inner{flex-direction:column;gap:20px;text-align:center;}
    .lp-footer-links{flex-wrap:wrap;justify-content:center;}
  }
  @media(max-width:480px){
    .lp-hero h1{font-size:30px;}
    .lp-hero-btns{flex-direction:column;}
    .lp-stat-num{font-size:36px;}
  }
`;

// ── Ham logo SVG ──
function LPHam({ size = 32 }) {
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
      <ellipse cx="50" cy="56" rx="3.5" ry="2.5" fill="#E91E8C"/>
      <path d="M44 62 Q50 68 56 62" stroke="#C0185A" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// ── Check icon ──
function Check({ color = LPINK }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

// ── Privacy Policy page ──
export function PrivacyPage({ onBack }) {
  return (
    <div style={{fontFamily:"Inter,sans-serif",background:"#fff",color:LTEXT,minHeight:"100vh"}}>
      <style>{LANDING_CSS}</style>
      <nav style={{borderBottom:`1px solid ${LBORDER}`,padding:"0 48px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={onBack}>
          <LPHam size={28}/><span style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,background:LGRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Teticoin</span>
        </div>
        <button onClick={onBack} style={{fontSize:14,color:LSUB,background:"none",border:"none",cursor:"pointer"}}>← Back</button>
      </nav>
      <div style={{maxWidth:760,margin:"0 auto",padding:"64px 48px"}}>
        <h1 style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:38,color:LTEXT,marginBottom:8}}>Privacy Policy</h1>
        <div style={{fontSize:14,color:LSUB,marginBottom:48}}>Last updated: 20 March 2026 · Teticoin by Tetikus</div>
        {[
          ["", "This Privacy Policy explains how Teticoin ('we', 'our', or 'us'), operated by Tetikus, collects, uses, and protects your information when you use our platform."],
          ["", "By using Teticoin, you agree to the terms of this Privacy Policy. If you do not agree, please do not use the platform."],
          ["1. Information We Collect", "Account holders (hosts): When you create an account, we collect your name, email address, and authentication credentials. We also store your session history and usage data.\n\nParticipants: Participants who join a session via QR code or link only provide a display name. No email or account is required. Participant data is stored as part of the session created by the host.\n\nUsage data: We may collect technical information such as browser type and IP address to improve platform performance."],
          ["2. How We Use Your Information", "We use your information to provide the platform, authenticate host accounts, process payments via Chip, send transactional emails, and improve features. We do not sell your personal data or use participant data for advertising."],
          ["3. Data Storage", "Data is stored securely in Google Firebase (Firestore). Free plan session data is retained for 30 days after last activity. Pro and Team plan data is retained for the subscription lifetime plus 90 days after cancellation."],
          ["4. Participant Data & Host Responsibility", "Hosts are responsible for informing participants that their name and performance may be recorded. Hosts must not collect sensitive personal information from participants beyond what is needed to run a session."],
          ["5. Payments", "Paid subscriptions are processed through Chip (chip-in.asia). We do not store card details. All payment data is handled by Chip in accordance with PCI DSS standards."],
          ["6. Cookies", "Teticoin uses essential cookies to maintain your login session. We do not use advertising or tracking cookies."],
          ["7. Your Rights", "You have the right to access, correct, or delete your personal data, and to export session data in CSV format. Contact us at hi.tetikus@gmail.com to exercise these rights."],
          ["8. Third-Party Services", "Teticoin uses Google Firebase (authentication & database), Chip (payments), and Vercel (hosting). Each has its own privacy policy."],
          ["9. Children's Privacy", "Teticoin is not directed at children under 13. Hosts using Teticoin with younger participants are responsible for obtaining appropriate consents."],
          ["10. Changes & Contact", "We may update this policy from time to time. For questions, contact hi.tetikus@gmail.com · Tetikus · Malaysia."],
        ].map(([heading, body], i) => (
          <div key={i}>
            {heading && <h2 style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:20,color:LTEXT,margin:"36px 0 12px"}}>{heading}</h2>}
            {body.split("\n\n").map((para, j) => (
              <p key={j} style={{fontSize:15,color:"#374151",marginBottom:14,lineHeight:1.75}}>{para}</p>
            ))}
          </div>
        ))}
      </div>
      <footer style={{background:"#0F0A0D",color:"rgba(255,255,255,.4)",padding:"24px 48px",textAlign:"center",fontSize:13,marginTop:64}}>
        <span onClick={onBack} style={{color:"rgba(255,255,255,.4)",cursor:"pointer",margin:"0 12px"}}>← Teticoin</span>
        <a href="mailto:hi.tetikus@gmail.com" style={{color:"rgba(255,255,255,.4)",margin:"0 12px"}}>Contact</a>
        <br/><br/>Powered by <a href="https://www.tetikus.com.my" target="_blank" rel="noopener noreferrer" style={{color:"rgba(255,255,255,.4)"}}>Tetikus</a> · © 2026
      </footer>
    </div>
  );
}

// ── Terms of Service page ──
export function TermsPage({ onBack }) {
  return (
    <div style={{fontFamily:"Inter,sans-serif",background:"#fff",color:LTEXT,minHeight:"100vh"}}>
      <style>{LANDING_CSS}</style>
      <nav style={{borderBottom:`1px solid ${LBORDER}`,padding:"0 48px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={onBack}>
          <LPHam size={28}/><span style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,background:LGRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Teticoin</span>
        </div>
        <button onClick={onBack} style={{fontSize:14,color:LSUB,background:"none",border:"none",cursor:"pointer"}}>← Back</button>
      </nav>
      <div style={{maxWidth:760,margin:"0 auto",padding:"64px 48px"}}>
        <h1 style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:38,color:LTEXT,marginBottom:8}}>Terms of Service</h1>
        <div style={{fontSize:14,color:LSUB,marginBottom:48}}>Last updated: 20 March 2026 · Teticoin by Tetikus</div>
        {[
          ["", "These Terms govern your access to and use of Teticoin, operated by Tetikus. By accessing or using Teticoin, you agree to be bound by these Terms."],
          ["1. Acceptance of Terms", "By creating an account or using Teticoin as a host or participant, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the platform."],
          ["2. Description of Service", "Teticoin is a participation engagement platform that allows hosts to create live sessions and award points to participants in real time. The platform is provided \"as is\" and may be updated, changed, or discontinued at any time."],
          ["3. Accounts", "To host sessions, you must register with a valid email. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us immediately at hi.tetikus@gmail.com if you suspect unauthorised use."],
          ["4. Acceptable Use", "You agree not to use Teticoin to collect sensitive personal data without consent, harass any participant, violate any law, reverse engineer the platform, or gain unauthorised access to other accounts or sessions. We reserve the right to suspend accounts that violate these terms."],
          ["5. Subscriptions and Payments", "Paid plans are billed monthly or annually as selected. Payments are processed through Chip (chip-in.asia). Subscriptions auto-renew unless cancelled before the renewal date. Cancellation takes effect at end of the current billing period — no refunds are issued for unused time. We may change pricing with 30 days' notice."],
          ["6. Intellectual Property", "All content, design, branding, and code on Teticoin is the intellectual property of Tetikus. You may not reproduce or distribute it without prior written consent. Session data entered by users remains the property of the host."],
          ["7. Disclaimers", "Teticoin is provided \"as is\" without warranties. We do not guarantee uninterrupted availability or that the platform will meet your specific requirements. We are not responsible for loss of data or opportunity arising from your use."],
          ["8. Limitation of Liability", "To the maximum extent permitted by law, Tetikus shall not be liable for any indirect, incidental, or consequential damages. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim."],
          ["9. Termination", "You may delete your account at any time. We may suspend or terminate access for Terms violations. Upon termination, session data is retained for 90 days before permanent deletion."],
          ["10. Governing Law", "These Terms are governed by the laws of Malaysia. Disputes are subject to the exclusive jurisdiction of Malaysian courts."],
          ["11. Changes & Contact", "We may update these Terms from time to time and will notify users by email of material changes. For questions: hi.tetikus@gmail.com · Tetikus · Malaysia."],
        ].map(([heading, body], i) => (
          <div key={i}>
            {heading && <h2 style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:20,color:LTEXT,margin:"36px 0 12px"}}>{heading}</h2>}
            <p style={{fontSize:15,color:"#374151",marginBottom:14,lineHeight:1.75}}>{body}</p>
          </div>
        ))}
      </div>
      <footer style={{background:"#0F0A0D",color:"rgba(255,255,255,.4)",padding:"24px 48px",textAlign:"center",fontSize:13,marginTop:64}}>
        <span onClick={onBack} style={{color:"rgba(255,255,255,.4)",cursor:"pointer",margin:"0 12px"}}>← Teticoin</span>
        <a href="mailto:hi.tetikus@gmail.com" style={{color:"rgba(255,255,255,.4)",margin:"0 12px"}}>Contact</a>
        <br/><br/>Powered by <a href="https://www.tetikus.com.my" target="_blank" rel="noopener noreferrer" style={{color:"rgba(255,255,255,.4)"}}>Tetikus</a> · © 2026
      </footer>
    </div>
  );
}

// ── Main Landing Page ──
export default function LandingPage({ onGetStarted, onLogin }) {
  const [subpage, setSubpage] = useState(null); // null | "privacy" | "terms"
  const [landingBilling, setLandingBilling] = useState("monthly");

  if (subpage === "privacy") return <PrivacyPage onBack={() => setSubpage(null)}/>;
  if (subpage === "terms") return <TermsPage onBack={() => setSubpage(null)}/>;

  return (
    <div className="lp">
      <style>{LANDING_CSS}</style>

      {/* NAV */}
      <nav className="lp-nav">
        <div style={{display:"flex",alignItems:"center",gap:10}}><LPHam size={32}/><span className="lp-logo-text">Teticoin</span></div>
        <div className="lp-nav-links">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="lp-btn-ghost" onClick={onLogin}>Log in</button>
          <button className="lp-btn-fill" onClick={onGetStarted}>Get started free</button>
        </div>
        <button className="lp-nav-ham" onClick={onGetStarted}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A0A14" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </nav>

      {/* HERO */}
      <div style={{maxWidth:1280,margin:"0 auto"}}>
        <div className="lp-hero">
          <div>
            {/* ↓ EDIT: hero tag */}
            <div className="lp-hero-tag" style={{marginBottom:12}}>✦ Gamify any group session</div>
            {/* ↓ EDIT: main headline */}
            <h1 style={{marginBottom:12}}>Make your sessions<br/><em>fun, competitive, unforgettable.</em></h1>
            {/* ↓ EDIT: hero subtitle */}
            <p className="lp-hero-sub" style={{marginBottom:24}}>Teticoin transforms any training, seminar, or gathering into an exciting experience — reward participation, spark competition, and keep everyone engaged from start to finish.</p>
            <div className="lp-hero-btns">
              <button className="lp-btn-big lp-btn-big-fill" onClick={onGetStarted}>🎯 Start Free Session</button>
              <button className="lp-btn-big lp-btn-big-outline" onClick={() => document.getElementById("how")?.scrollIntoView({behavior:"smooth"})}>See how it works →</button>
            </div>
            <p className="lp-hero-note">Free plan available · No credit card required</p>
          </div>
          <div className="lp-hero-img">
            <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&q=80&fit=crop" alt="Engaged group session"/>
            <div className="lp-hero-badge">
              <div style={{width:8,height:8,borderRadius:"50%",background:"#10B981",flexShrink:0}}/>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:LTEXT}}>Live session</div>
                {/* ↓ EDIT: badge session name */}
                <div style={{fontSize:11,color:LSUB}}>Design Thinking Workshop</div>
              </div>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:18,color:LPINK}}>+100 pts</div>
            </div>
          </div>
        </div>
      </div>

      {/* LOGOS */}
      <div className="lp-logos">
        <span className="lp-logos-label">Trusted by</span>
        {[
          { name:"Petronas", src:"/logos/logo1.png" },
          { name:"Maybank", src:"/logos/logo2.png" },
          { name:"TalentCorp", src:"/logos/logo3.png" },
          { name:"Universiti Malaya", src:"/logos/logo4.png" },
          { name:"MDEC", src:"/logos/logo5.png" },
        ].map(({name, src}) => (
          <div key={name} className="lp-logo-pill" style={{display:"flex",alignItems:"center",gap:8}}>
            <img src={src} alt={name} onError={e=>{e.target.style.display="none"}} style={{height:20,width:"auto",objectFit:"contain",display:"block"}}/>
            <span>{name}</span>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <div className="lp-section lp-how" id="how">
        <div className="lp-section-inner">
          <div className="lp-section-label">How it works</div>
          {/* ↓ EDIT: section titles and body text */}
          <div className="lp-section-title">Start rewarding in 30 seconds.</div>
          <p className="lp-section-sub">No setup headaches, no IT approval needed. Just create a session and start recognising great participation.</p>
        </div>
        <div style={{position:"relative",marginTop:56}}>
          {/* Timeline connector line */}
          <div style={{position:"absolute",top:32,left:"calc(16.6% + 12px)",right:"calc(16.6% + 12px)",height:2,background:`linear-gradient(to right,${LPINK},${LPINK2})`,opacity:0.25,display:"none"}} className="lp-timeline-line"/>
          <div className="lp-steps">
          {[
            { num:"01", title:"Create a session", body:"Give your session a name and go live. Share a QR code or link — everyone joins instantly from any device, no account or download needed." },
            { num:"02", title:"Add participants & award points", body:"Tap to award points for great contributions, good answers, or active involvement. Award one person or the whole group at once." },
            { num:"03", title:"Reveal the leaderboard", body:"Push the live leaderboard to everyone's screen with one tap. Watch energy spike the moment the rankings appear." },
          ].map(s => (
            <div key={s.num} className="lp-step">
              <div className="lp-step-num">{s.num}</div>
              <svg className="lp-step-icon" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill={LSOFT}/><rect x="13" y="28" width="5" height="8" rx="1" fill={LPINK} opacity=".4"/><rect x="21" y="22" width="5" height="14" rx="1" fill={LPINK} opacity=".7"/><rect x="29" y="16" width="5" height="20" rx="1" fill={LPINK}/></svg>
              <div className="lp-step-title">{s.title}</div>
              <div className="lp-step-body">{s.body}</div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* PHOTO + QUOTE */}
      <div className="lp-photo-split">
        <div className="lp-photo-split-img">
          <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80&fit=crop" alt="Engaging seminar"/>
        </div>
        <div className="lp-photo-split-content">
          <div className="lp-section-label">Why it works</div>
          <div className="lp-quote-mark">"</div>
          {/* ↓ EDIT: quote text and attribution */}
          <div className="lp-quote-text">Research shows immediate recognition increases participation by up to 3×. When people know their contributions matter right now, they give more of themselves.</div>
          <div className="lp-quote-attr">Ahmad Faris, Training Facilitator · Petronas</div>
          <div style={{marginTop:28,display:"flex",gap:24}}>
            <div>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:28,color:LPINK}}>3×</div>
              <div style={{fontSize:13,color:LSUB,marginTop:3}}>more contributions per session</div>
            </div>
            <div style={{width:1,background:"#FECDE8"}}/>
            <div>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:28,color:LPINK}}>94%</div>
              <div style={{fontSize:13,color:LSUB,marginTop:3}}>felt more engaged throughout</div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="lp-section" id="features" style={{paddingTop:72,paddingBottom:72}}>
        <div className="lp-section-inner">
          <div className="lp-section-label">Features</div>
          <div className="lp-section-title">Everything you need<br/><em style={{fontStyle:"normal",background:LGRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>to recognise participation — online &amp; offline.</em></div>
          <p className="lp-section-sub" style={{lineHeight:1.55}}>Teticoin is built to be picked up in the middle of any session, not learned over a weekend.</p>
          <div className="lp-feat-grid">
            {[
              { img:"https://images.unsplash.com/photo-1601370690183-1c7796ecec61?w=600&q=80&fit=crop", icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={LPINK} strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>, title:"QR join — no app needed", body:"Scan a QR or open a link. Enter a name, get a unique number, and start earning points — from any phone or laptop, instantly." },
              { img:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80&fit=crop", icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={LPINK} strokeWidth="2.2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title:"Live leaderboard push", body:"One tap sends the leaderboard to every participant's screen at once. Great for mid-session energy boosts or a final reveal." },
              { img:"https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80&fit=crop", icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={LPINK} strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title:"Groups & team scoring", body:"Organise participants into teams. Points accumulate individually and for the group — perfect for competitions, workshops, or classroom activities." },
              { img:"https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80&fit=crop", icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={LPINK} strokeWidth="2.2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, title:"Fully customisable awards", body:"Set your own point values for any behaviour worth recognising — or deduct points as a fun penalty. Works for any format, any group size." },
            ].map(f => (
              <div key={f.title} className="lp-feat">
                <img src={f.img} alt={f.title} className="lp-feat-img"/>
                <div className="lp-feat-icon">{f.icon}</div>
                <div className="lp-feat-title">{f.title}</div>
                <div className="lp-feat-body">{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DARK STATS */}
      <div className="lp-stats">
        <div className="lp-stats-inner">
          <div>
            <div className="lp-section-label" style={{color:"#FDA4CF"}}>Impact</div>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:40,lineHeight:1.1,color:"#fff",marginBottom:14}}>Engagement goes up.<br/>Every single time.</div>
            <p style={{fontSize:16,color:"rgba(255,255,255,.6)",lineHeight:1.75,maxWidth:400}}>Teticoin creates a simple recognition loop — acknowledge great participation, and watch more of it happen naturally.</p>
          </div>
          <div className="lp-stats-grid">
            {[
              { num:"3×", label:"More contributions per session when points are on the line" },
              { num:"94%", label:"Participants reported feeling more engaged throughout" },
              { num:"60s", label:"Average time to start a live session from scratch" },
              { num:"0", label:"Apps to install — works on any device, any browser" },
            ].map(s => (
              <div key={s.num} className="lp-stat-item">
                <div className="lp-stat-num">{s.num}</div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FULL PHOTO */}
      <div className="lp-photo-full">
        <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&q=80&fit=crop" alt="Group session in progress"/>
        <div className="lp-photo-full-overlay"/>
        <div className="lp-photo-full-content">
          <div>
            <div style={{fontSize:12,fontWeight:600,color:"#FDA4CF",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Works for any setting</div>
            {/* ↓ EDIT: full-width photo headline */}
            <h2 style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:38,color:"#fff",lineHeight:1.15}}>Classrooms. Workshops.<br/>Team meetings. Online.<br/>Teticoin fits them all.</h2>
            <p style={{fontSize:15,color:"rgba(255,255,255,.7)",marginTop:14,lineHeight:1.7,maxWidth:460}}>Participants join from their own device. The host manages everything in real time. Works in-person, remote, or hybrid.</p>
          </div>
        </div>
      </div>

      {/* WHO SHOULD USE TETICOIN */}
      <div style={{padding:"80px 0",background:"#fff",overflow:"hidden"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 48px",marginBottom:40}}>
          <div className="lp-section-label">Who it's for</div>
          <div className="lp-section-title" style={{fontSize:34}}>Built for anyone who runs groups.</div>
          <p className="lp-section-sub" style={{lineHeight:1.55}}>From classrooms to corporate training — if you lead a group, Teticoin makes engagement effortless.</p>
        </div>
        <div className="lp-carousel-wrap">
          <div className="lp-carousel-track">
            {[
              { img:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&fit=crop", label:"Corporate Trainers", sub:"Award points for great ideas, active questions, and top performers." },
              { img:"https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80&fit=crop", label:"Teachers & Lecturers", sub:"Gamify classroom participation and boost student engagement instantly." },
              { img:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80&fit=crop", label:"Workshop Facilitators", sub:"Keep energy high in half-day and full-day sessions with real-time rewards." },
              { img:"https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600&q=80&fit=crop", label:"Team Leaders", sub:"Run engaging team meetings where every contribution gets recognised." },
              { img:"https://images.unsplash.com/photo-1515169067868-5387ec356754?w=600&q=80&fit=crop", label:"Event Hosts", sub:"Add a competitive leaderboard element to any live event or conference." },
              { img:"https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&q=80&fit=crop", label:"HR & L&D Teams", sub:"Build a culture of recognition across onboarding, upskilling, and training days." },
              { img:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop", label:"Coaches & Mentors", sub:"Turn group coaching sessions into high-energy, rewarding experiences." },
              { img:"https://images.unsplash.com/photo-1491895200222-0fc4a4c35e18?w=600&q=80&fit=crop", label:"Online Class Hosts", sub:"Bring real-time interaction to Zoom, Google Meet, or any virtual class." },
              // Duplicate for seamless loop
              { img:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&fit=crop", label:"Corporate Trainers", sub:"Award points for great ideas, active questions, and top performers." },
              { img:"https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80&fit=crop", label:"Teachers & Lecturers", sub:"Gamify classroom participation and boost student engagement instantly." },
              { img:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80&fit=crop", label:"Workshop Facilitators", sub:"Keep energy high in half-day and full-day sessions with real-time rewards." },
              { img:"https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600&q=80&fit=crop", label:"Team Leaders", sub:"Run engaging team meetings where every contribution gets recognised." },
              { img:"https://images.unsplash.com/photo-1515169067868-5387ec356754?w=600&q=80&fit=crop", label:"Event Hosts", sub:"Add a competitive leaderboard element to any live event or conference." },
              { img:"https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&q=80&fit=crop", label:"HR & L&D Teams", sub:"Build a culture of recognition across onboarding, upskilling, and training days." },
              { img:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop", label:"Coaches & Mentors", sub:"Turn group coaching sessions into high-energy, rewarding experiences." },
              { img:"https://images.unsplash.com/photo-1491895200222-0fc4a4c35e18?w=600&q=80&fit=crop", label:"Online Class Hosts", sub:"Bring real-time interaction to Zoom, Google Meet, or any virtual class." },
            ].map((c,i) => (
              <div key={i} className="lp-who-card">
                <img src={c.img} alt={c.label}/>
                <div className="lp-who-label">{c.label}</div>
                <div className="lp-who-sub">{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div className="lp-pricing" id="pricing">
        <div className="lp-pricing-inner">
          <div className="lp-section-label">Pricing</div>
          <div className="lp-section-title">Simple, honest pricing.</div>
          <p className="lp-section-sub" style={{marginBottom:0}}>🎯 Start Free Session. Upgrade when your sessions grow. No credit card needed.</p>

          {/* Billing toggle — cute pill style */}
          <div className="lp-billing-cute" style={{marginTop:28,display:"inline-flex"}}>
            {[["monthly","Monthly"],["yearly","Yearly — save 35%"]].map(([b,label]) => (
              <button key={b} onClick={()=>setLandingBilling(b)}
                className="lp-billing-cute"
                style={{flex:"none",padding:"8px 20px",borderRadius:999,border:"none",
                  background:landingBilling===b?LGRAD:"transparent",
                  fontFamily:"Inter,sans-serif",fontWeight:700,fontSize:13,
                  color:landingBilling===b?"#fff":"#6B7280",cursor:"pointer",transition:"all .2s",
                  whiteSpace:"nowrap"}}>
                {label}
              </button>
            ))}
          </div>

          {/* 3-column plan grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:0,border:`1px solid ${LBORDER}`,borderRadius:12,overflow:"hidden",marginTop:28,maxWidth:1100}}>

            {/* FREE */}
            <div style={{padding:"40px 32px",background:"#fff",borderRight:`1px solid ${LBORDER}`}}>
              <div style={{fontSize:12,fontWeight:600,color:LSUB,textTransform:"uppercase",letterSpacing:1.5,marginBottom:16}}>Free forever</div>
              <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:44,color:LTEXT,lineHeight:1}}>RM 0</div>
              <div style={{fontSize:14,color:LSUB,marginTop:6,marginBottom:28}}>No time limit. No card required.</div>
              <div style={{height:1,background:LBORDER,marginBottom:24}}/>
              <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:10,marginBottom:32}}>
                {["Up to 3 sessions","30 participants per session","Live leaderboard","QR join — no app needed","1 group per session"].map(f => (
                  <li key={f} style={{display:"flex",alignItems:"center",gap:10,fontSize:13,color:LSUB}}><Check/>{f}</li>
                ))}
              </ul>
              <button onClick={onGetStarted} style={{width:"100%",padding:"12px 0",borderRadius:8,fontFamily:"Inter,sans-serif",fontWeight:600,fontSize:14,cursor:"pointer",background:"#fff",color:LTEXT,border:`1.5px solid ${LBORDER}`}}>Get started free</button>
            </div>

            {/* PRO */}
            <div style={{padding:"40px 32px",background:LSOFT,position:"relative",borderRight:`1px solid ${LBORDER}`}}>
              <div style={{position:"absolute",top:16,right:16,background:LGRAD,color:"#fff",fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:4}}>POPULAR</div>
              <div style={{fontSize:12,fontWeight:600,color:LPINK,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Pro</div>
              {landingBilling === "monthly" ? (
                <>
                  <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                    <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:44,color:LPINK,lineHeight:1}}>RM 16</div>
                    <div style={{fontSize:14,color:LSUB}}>/mo</div>
                  </div>
                  <div style={{fontSize:12,color:LSUB,marginTop:3,textDecoration:"line-through",marginBottom:28}}>Was RM 22/mo</div>
                </>
              ) : (
                <>
                  <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                    <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:44,color:LPINK,lineHeight:1}}>RM 14</div>
                    <div style={{fontSize:14,color:LSUB}}>/mo</div>
                  </div>
                  <div style={{fontSize:12,color:LSUB,marginTop:3}}>Billed RM 169/year</div>
                  <div style={{fontSize:12,background:"#D1FAE5",color:"#065F46",fontWeight:700,borderRadius:6,padding:"2px 8px",display:"inline-block",marginTop:4,marginBottom:28}}>Save RM 23</div>
                </>
              )}
              <div style={{height:1,background:"#FECDE8",marginBottom:24}}/>
              <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:10,marginBottom:32}}>
                {["Unlimited sessions","Unlimited participants","Up to 10 groups","Custom award labels","PIN rejoin for returning participants","Full session history","Priority support"].map(f => (
                  <li key={f} style={{display:"flex",alignItems:"center",gap:10,fontSize:13,color:LTEXT,fontWeight:500}}><Check color={LPINK}/>{f}</li>
                ))}
              </ul>
              <button onClick={()=>window.location.href = landingBilling==="monthly"
                  ? "https://pay.chip-in.asia/GyQkRcSifMzzRwqpoL"
                  : "https://pay.chip-in.asia/RbxCqTYWGld5bJsSKl"}
                style={{width:"100%",padding:"12px 0",borderRadius:8,fontFamily:"Inter,sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",background:LGRAD,color:"#fff",border:"none"}}>
                {landingBilling==="monthly" ? "Get Pro — RM 16/mo" : "Get Pro — RM 169/year"}
              </button>
              <div style={{textAlign:"center",fontSize:11,color:LSUB,marginTop:10}}>Cancel anytime · FPX · Card · DuitNow</div>
            </div>

            {/* TEAM */}
            <div style={{padding:"40px 32px",background:"#FAF5FF",position:"relative"}}>
              <div style={{fontSize:12,fontWeight:600,color:"#7C3AED",textTransform:"uppercase",letterSpacing:1.5,marginBottom:16}}>Team</div>
              {landingBilling === "monthly" ? (
                <>
                  <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                    <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:44,color:"#7C3AED",lineHeight:1}}>RM 32</div>
                    <div style={{fontSize:14,color:LSUB}}>/mo</div>
                  </div>
                  <div style={{fontSize:12,color:LSUB,marginTop:3,marginBottom:28}}>up to 5 hosts</div>
                </>
              ) : (
                <>
                  <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                    <div style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:44,color:"#7C3AED",lineHeight:1}}>RM 27</div>
                    <div style={{fontSize:14,color:LSUB}}>/mo</div>
                  </div>
                  <div style={{fontSize:12,color:LSUB,marginTop:3}}>Billed RM 320/year</div>
                  <div style={{fontSize:12,background:"#EDE9FE",color:"#5B21B6",fontWeight:700,borderRadius:6,padding:"2px 8px",display:"inline-block",marginTop:4,marginBottom:28}}>Save RM 64</div>
                </>
              )}
              <div style={{height:1,background:"#DDD6FE",marginBottom:24}}/>
              <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:10,marginBottom:32}}>
                {["Everything in Pro","5 host accounts","Shared session library","Admin dashboard","Bulk participant import (CSV)","Custom subdomain"].map(f => (
                  <li key={f} style={{display:"flex",alignItems:"center",gap:10,fontSize:13,color:LTEXT,fontWeight:500}}><Check color="#7C3AED"/>{f}</li>
                ))}
              </ul>
              <button onClick={()=>window.location.href = landingBilling==="monthly"
                  ? "https://pay.chip-in.asia/4PzNZvVfRlvVVl2N1Y"
                  : "https://pay.chip-in.asia/X4yoJ2E6269tJoE6xt"}
                style={{width:"100%",padding:"12px 0",borderRadius:8,fontFamily:"Inter,sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",background:"linear-gradient(135deg,#7C3AED,#A855F7)",color:"#fff",border:"none"}}>
                {landingBilling==="monthly" ? "Get Team — RM 32/mo" : "Get Team — RM 320/year"}
              </button>
              <div style={{textAlign:"center",fontSize:11,color:LSUB,marginTop:10}}>Cancel anytime · FPX · Card · DuitNow</div>
            </div>

          </div>

          {/* Mobile responsive override */}
          <style>{`
            @media(max-width:900px){
              .lp-pricing-3col { grid-template-columns: 1fr !important; }
              .lp-pricing-3col > div { border-right: none !important; border-bottom: 1px solid ${LBORDER}; }
              .lp-pricing-3col > div:last-child { border-bottom: none; }
            }
          `}</style>

        </div>
      </div>

      {/* CTA */}
      <div className="lp-cta">
        <div style={{maxWidth:640,margin:"0 auto",position:"relative",zIndex:1}}>
          <div className="lp-section-label" style={{display:"block",textAlign:"center",marginBottom:16}}>Get started today</div>
          {/* ↓ EDIT: CTA headline and subtext */}
          <h2>Make your next session<br/>one they actually remember.</h2>
          <p>Join groups, classes, and teams who use Teticoin to turn passive participation into something everyone looks forward to.</p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="lp-btn-big lp-btn-big-fill" onClick={onGetStarted}>🎯 Start Free Session</button>
          </div>
          <p style={{marginTop:14,fontSize:13,color:"#9CA3AF"}}>No credit card required · Free plan available forever</p>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <LPHam size={22}/>
            <span className="lp-footer-logo-text">Teticoin</span>
            <span style={{fontSize:13}}>© 2026</span>
          </div>
          <div className="lp-footer-links">
            <button onClick={() => setSubpage("privacy")} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.4)",fontSize:13}}>Privacy Policy</button>
            <button onClick={() => setSubpage("terms")} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.4)",fontSize:13}}>Terms of Service</button>
            <a href="mailto:hi.tetikus@gmail.com">Contact</a>
          </div>
        </div>
        <div className="lp-footer-powered">
          Powered by <a href="https://www.tetikus.com.my" target="_blank" rel="noopener noreferrer">Tetikus</a>
        </div>
      </footer>
    </div>
  );
}
