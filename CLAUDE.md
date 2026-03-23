# Teticoin - Claude Code Guide

## Project Overview
Teticoin is a web-based gamification and reward management platform for training environments. Instructors manage participant achievements via virtual coins/points and badges.

# TETICOIN PROJECT CONTEXT
# ─────────────────────────────────────────────────────────────────

## What is Teticoin
A training gamification web app. Hosts create live sessions and award
points to participants in real time. Participants join via QR code —
no account or app needed. Built by Tetikus (tetikus.com.my).

## Live URLs
- App:     https://teticoin.tetikus.com.my
- Repo:    https://github.com/hitetikus/teticoin
- Deploy:  git add . && git commit -m "update" && git push
           (Vercel auto-deploys from main branch)

## Stack
- React (create-react-app, no TypeScript)
- Firebase Firestore (database + auth)
- Vercel (hosting)
- Chip payment gateway (MYR, chip-in.asia)

## Project file structure
src/
  App.js      ← entire app (3300+ lines, single file)
  Landing.js  ← landing page + Privacy Policy + Terms of Service
  firebase.js ← Firebase config and helper functions
public/
  index.html  ← loads QR CDN script
  favicon.png ← hamster logo

## Firebase helpers (defined in App.js, imported from firebase.js)
User data (keyed by UID):
  sg(key)         → get user data
  ss(key, val)    → set user data
  sd(key)         → delete user data

Session data (public, keyed by session code):
  sgSession(code)       → get session
  ssSession(code, data) → save session

Coinmaster lookup:
  ssSession("cm-" + cmCode, { sessionCode }) → lookup doc for cross-user CM access

## App.js structure (in order)
Constants:    PINK, SOFT, BORDER, BG, SUB, TEXT, GRAD, TV_DEFAULT, ACTS_DEFAULT
Helpers:      genCode(), genCMCode(), playSound()
UI atoms:     Ham, Confetti, FloatAnim, Av, Toast, SL, Inp, PBtn, PQR
Modals:       Picker, MassGive, CoinCustomizer, SessionSettings, Manage
Auth:         Auth (login/signup/Google)
Views:        ParticipantView, Projector, QRModal, LeaderSheet
Buttons:      QuickCoinBtn, InlineCoinBtn
CoinmasterView (assistant host, limited permissions)
Session       (main host session screen)
CreateModal
Payment:      PAYMENT_CONFIG, handlePaymentReturn(), PricingPage,
              UpgradeBanner, LimitModal, BillingPage
CoinmasterJoinModal
App           (root component — screens: landing, auth, home, session,
              coinmaster, participant, participantJoin, sessionSettings)

## Landing.js structure
LandingPage (default export) — full marketing page with:
  - Monthly/yearly pricing toggle (landingBilling state)
  - 3 plan cards: Free / Pro / Team with Chip payment links
PrivacyPage (named export)
TermsPage   (named export)
Navigation between pages uses onBack() prop, not React Router.

## Key design conventions
- ALL styles are inline JSX — no external CSS files, no Tailwind
- Global CSS injected via <style>{CSS}</style> at component render
- CSS constant is at the bottom of App.js (search: "const CSS = `")
- Responsive classes: tc-app-shell, tc-session-body, tc-session-left,
  tc-session-right, tc-tab-bar, tc-right-tabs, tc-modal-backdrop,
  tc-modal-sheet, tc-home-wrap, tc-home-inner, tc-home-left,
  tc-home-right — all defined in CSS constant
- Desktop ≥900px: session is two-column (left=Award, right=Award All/Board/Groups/Log)
- Desktop ≥900px: home is two-column (left=hero+stats, right=session list)
- Modals: tc-modal-backdrop (fixed overlay) + tc-modal-sheet (content)
  → bottom-sheet on mobile, centered on desktop ≥700px

## Session data shape
{
  code, name, live, boardVisible, archived,
  coinmasterEnabled, coinmasterCode,
  participants: [{ id, name, av, total, bk, gid, num, hist }],
  groups:       [{ id, name, color }],
  log:          [{ id, name, type, pts, t }],
  quickCoins:   [50, 30, 10],   // Quick Coins values
  otherCoins:   [10,30,50,100,150,200],  // Give Coins grid
}

## Plan/subscription
Plans: free | pro | proY | team | teamY
Stored in Firebase: ss("plan", value)
Chip payment links in PAYMENT_CONFIG constant in App.js:
  Pro Monthly:  RM 16  → pay.chip-in.asia/GyQkRcSifMzzRwqpoL
  Pro Yearly:   RM 169 → pay.chip-in.asia/RbxCqTYWGld5bJsSKl
  Team Monthly: RM 32  → pay.chip-in.asia/4PzNZvVfRlvVVl2N1Y
  Team Yearly:  RM 320 → pay.chip-in.asia/X4yoJ2E6269tJoE6xt
Return URL pattern: ?payment=success&plan=pro_monthly
Pricing still under review
Business model still under improvement

## Coinmaster feature
- Host enables in Session Settings → coinmaster tab appear in participant page -> button to assign/unassign coinmaster among participant
- coinmaster cannot be a participant (cannot receive coins etc)
- coinmaster must login as a participant (thru email or google) before eligible to be assigned
- CoinmasterView: can award coins, add participants, mass give
- Cannot: rename, go live/offline, change coin values, archive

## CRITICAL RULES FOR EDITING
1. NEVER rewrite whole components from scratch — always use str_replace
   on specific sections. Rewriting causes state declarations to be lost
   which crashes React silently (blank screen).
2. When adding state to Session component, add it WITH the existing
   state block — never replace the whole state block.
3. Session component has these states that MUST always be present:
   ses, tab, rightTab, selId, picker, manage, mass, proj, showQR,
   showLeader, showSettings, showCoinCustomizer, editingTitle, titleVal,
   anims, confetti, snd, cAmt, toast, aid, confirmOffline
4. App.js and Landing.js are the only files that ever need editing.
   firebase.js, index.js, index.html are untouched boilerplate.
5. After any edit, check for: duplicate function declarations,
   unclosed JSX divs, and missing state declarations.
6. To find content to edit, use search terms:
   - Hero headline:       "Reward participation"
   - Stats numbers:       "3×" or "94%"
   - Logo bar orgs:       "Petronas"
   - Pricing toggle:      "landingBilling"
   - Payment config:      "PAYMENT_CONFIG"
   - Chip links:          "pay.chip-in.asia"
   - CSS constant:        "const CSS = `"
   - Session states:      "const [rightTab"

## Tech Stack
- **Frontend**: React 19.2.4 (Create React App)
- **Backend/DB**: Firebase (Firestore + Auth)
- **Deployment**: Vercel

## Common Commands
```bash
npm start        # Dev server (port 3000)
npm run build    # Production build
npm test         # Run tests
```

## Project Structure
```
src/
  App.js         # Core app — 4500+ lines, 30+ components
  Landing.js     # Marketing landing page
  firebase.js    # Firebase init + helpers (fsGet, fsSet, fsDel)
  App.css        # App styles
  index.js       # React root
```

## Architecture

### Data Layer
- **Firestore**: `users/{uid}/data/{key}` for user data, `sessions/{code}` for shared session data
- **Storage helpers**: `sg()` / `ss()` / `sd()` — get/set/delete with current UID prefix

### Color Constants (defined at top of App.js)
```js
PINK, PINK2, SOFT, MID, BORDER, BG, SUB, TEXT, YELLOW, GREEN, BLUE, PURPLE
GC[]  // group color array
```

### Key Utility Functions
- `genCode()` — 5-char uppercase session code
- `genCMCode()` — Coinmaster code (CM-4 chars)
- `mkAv(name)` — initials avatar from name
- `playSound()` — Web Audio API feedback

### Component Groups (all in App.js)
- **UI Primitives**: `Inp`, `PBtn`, `Av`, `Toast`, `SL`
- **Modals**: `CreateModal`, `PricingPage`, `SessionSettings`, `BadgePickerModal`
- **Session Views**: `Session`, `ParticipantView`, `CoinmasterView`
- **Features**: `LeaderSheet`, `Projector`, `QRModal`, `LuckyDraw`
- **Auth**: `Auth` (email/password + Google OAuth)

### Participant Scoring
Each participant has a `bk` (breakdown) object tracking coins per action type.

## Responsive Design
- Mobile-first; bottom-sheet modals on mobile, centered on desktop
- Breakpoints: 600px, 900px

## Known Gaps
- EmailJS credentials are placeholder `xxxxxxx` — needs real credentials in `.env`
- Firebase config is hardcoded — should be moved to environment variables for production

## Error screenhot
-  C:\Users\User\Desktop\teticoin\screenshot of latest error
- i want you to see the image i put there if any, refer to the conversation (if relevant) fix and remove that screenshot image from the folder so it doesn't get mixed up with future screenshot images i'm going to put later.

## Commit edit
don't ask me about commits, just commit automatically when done

