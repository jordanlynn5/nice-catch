# Nice Catch — Launch Roadmap

> Reference this file to track exactly where we are. Each step has a clear done-when condition.
> Update status markers: `[ ]` pending · `[x]` done · `[~]` in progress · `[!]` blocked

---

## Current Status Snapshot
- Code: **fully scaffolded** (90+ files, builds clean, **24/24 tests pass**)
- GitHub: **live** at `github.com/jordanlynn5/nice-catch` (developer branch ahead of main)
- Vercel: **CLI installed**, dev server tested locally
- API keys: **configured** (IUCN, Wolfram, GreenPT working)
- PWA icons: **missing**
- Live URL: **none yet** (vercel dev runs at localhost:3001)

---

## Phase 0 — Foundation ✅ COMPLETE

Everything in this phase is done.

- [x] Project scaffolded (Vite 5 + React 18 + TypeScript + Tailwind)
- [x] All 90+ source files written
- [x] TypeScript passes clean (`npm run typecheck`)
- [x] **24/24 tests passing** (`npm run test:ci`) — includes guidance tests
- [x] Production build succeeds (`npm run build`)
- [x] PWA service worker + manifest generated
- [x] Dev server runs at `localhost:5173`
- [x] GitHub repo created and pushed (`github.com/jordanlynn5/nice-catch`)
- [x] Git credentials fixed (HTTPS + gh auth)
- [x] **Smart Buying Guidance system** — replaced species alternatives with actionable EU label criteria (committed to developer branch)

---

## Phase 1 — API Keys & Local Verification 🚧 IN PROGRESS

**Goal:** Every feature works end-to-end locally before touching Vercel.

### 1.1 Get API credentials
- [x] **IUCN Red List key** — register free at https://apiv3.iucnredlist.org → "Get Token"
- [x] **Wolfram App ID** — log in at developer.wolframalpha.com → create app → copy App ID (Wolfram One subscription already active)
- [x] **GreenPT API key** — sign up at greenpt.ai → copy key from dashboard

### 1.2 Create `.env.local`
```
IUCN_API_KEY=your_key_here
WOLFRAM_APP_ID=your_app_id_here
GREENPT_API_KEY=your_key_here
```
- [x] File created at project root (never committed — already in `.gitignore`)

### 1.3 Install Vercel CLI for local testing
```bash
npm i -g vercel
vercel dev --listen 3000   # runs app + serverless functions together at localhost:3001
```
- [x] Vercel CLI installed
- [x] `vercel dev` starts without errors

### 1.4 End-to-end smoke tests (run locally with `vercel dev`)
- [~] Manual search: type "orada" → resolves to dorada, score displayed
- [ ] Manual search: type "atún rojo" → score ≤ 30, ReduceMessage shown with seasonality
- [~] IUCN: search merluza → Vercel function log shows live IUCN API response (503 errors seen)
- [~] Wolfram CO2: search sardina → CO2 badge shows value, Vercel log shows Wolfram query (503 errors seen)
- [ ] Wolfram cache: search sardina again → no second Wolfram query (served from IndexedDB)
- [ ] Gamification: 3 searches → Profile page shows ocean score > 0 + First Catch badge
- [~] i18n: toggle EN → all labels switch to English
- [ ] Barcode scanner: open scanner view → camera activates, scan overlay visible
- [x] **AI Assistant**: extracts species/FAO/method from natural language → score displayed
- [x] **Buying Guidance**: low-scoring fish shows 3 prioritized label criteria to improve score
- [x] **FAO area scoring**: general FAO codes (27, 37, 87) now work correctly (+8, -14, 0 modifiers)

---

## Phase 2 — PWA Assets 🔴 NEXT (parallel with Phase 1)

**Goal:** Proper app icon so PWA install prompt shows the right branding.

### 2.1 Create app icon
- [ ] Design or source a fish/wave icon that works at small sizes
- [ ] Export `icon-192.png` (192×192 px)
- [ ] Export `icon-512.png` (512×512 px)
- [ ] Export `icon-maskable.png` (512×512 px, with safe zone padding ~10%)
- [ ] Place all three in `public/icons/`
- [ ] Rebuild: `npm run build` — verify icons appear in `dist/`

### 2.2 Favicon
- [ ] Export a 32×32 or SVG favicon
- [ ] Place at `public/favicon.ico` (or `favicon.svg`)
- [ ] Update `index.html` link tag if using SVG

---

## Phase 3 — Vercel Deployment 🔴 BLOCKED on Phase 1

**Goal:** App live on a public HTTPS URL.

### 3.1 Connect repo to Vercel
- [ ] Go to vercel.com/new
- [ ] Import `jordanlynn5/nice-catch` from GitHub
- [ ] Framework preset: **Vite** (auto-detected)
- [ ] Build command: `npm run build` (default)
- [ ] Output directory: `dist` (default)
- [ ] Click Deploy (first deploy will succeed without env vars — falls back to static data)

### 3.2 Add environment variables in Vercel dashboard
- [ ] Go to Project → Settings → Environment Variables
- [ ] Add `IUCN_API_KEY` (all environments)
- [ ] Add `WOLFRAM_APP_ID` (all environments)
- [ ] Add `GREENPT_API_KEY` (all environments)
- [ ] Redeploy (trigger from Deployments tab → "Redeploy")

### 3.3 Verify live deployment
- [ ] Visit production URL (e.g. `nice-catch.vercel.app`)
- [ ] Manual search works on live URL
- [ ] Vercel function logs show API calls (Functions tab in Vercel dashboard)
- [ ] HTTPS is active (padlock in browser)

### 3.4 Custom domain (optional)
- [ ] Buy or use existing domain
- [ ] Add in Vercel → Settings → Domains
- [ ] DNS records updated
- [ ] HTTPS auto-provisioned by Vercel

---

## Phase 4 — Barcode Testing 🔴 BLOCKED on Phase 3

**Goal:** Barcode scan → full result, end-to-end on a real device.

### 4.1 Find test barcodes
- [ ] Collect 5–10 EAN barcodes from packaged fish products (supermarket)
  - Merluza fillets (common, widely available)
  - Salmón (farmed, should show ASC/wild alternative)
  - Sardinas en lata (small pelagic, good score)
  - Atún claro (Near Threatened, moderate score)
  - Gambas (should show high CO2, shellfish)
- [ ] Look up each barcode on `world.openfoodfacts.org` to confirm they return fish data
- [ ] Note which ones Open Food Facts returns species/area/method info for

### 4.2 Live barcode scan tests
- [ ] Scan test barcode on mobile → species identified and score shown
- [ ] CO2 badge visible on result card
- [ ] FishBase biology section shown (if API responds)
- [ ] Score breakdown pillars visible
- [ ] Barcode that returns no OFF data → falls back to manual search gracefully
- [ ] Second scan of same barcode → loads instantly from IndexedDB cache

---

## Phase 5 — Camera / GreenPT Label Parsing 🔴 BLOCKED on Phase 1

**Goal:** Photo of an EU fish label → parsed species, area, method → score.

### 5.1 Verify GreenPT vision endpoint
- [ ] Photograph a real EU fish label (must show species, FAO area code, method)
- [ ] Run through CameraCapture → `/api/greenpt` → confirm structured JSON returned
- [ ] Confirm extracted species resolves via synonymResolver
- [ ] Test fallback: blurry photo → gracefully falls to ManualSearch

### 5.2 Tune AI label prompt if needed
- [ ] If GreenPT misses FAO area codes, update prompt in `api/greenpt.ts`
- [ ] If species names come back in unexpected language, add handling in synonymResolver

---

## Phase 6 — Device & PWA Testing 🔴 BLOCKED on Phase 3

**Goal:** App installable and fully functional on iOS and Android.

### 6.1 iOS (Safari)
- [ ] Open production URL in Safari on iPhone
- [ ] "Add to Home Screen" → app installs, launches full-screen
- [ ] Camera permission prompt appears correctly
- [ ] Barcode scanner works in installed PWA
- [ ] Score results display correctly on small screen
- [ ] Offline: enable airplane mode → cached species still loads

### 6.2 Android (Chrome)
- [ ] Open production URL in Chrome on Android
- [ ] Install banner appears or use "Add to Home Screen"
- [ ] App installs and launches full-screen
- [ ] Camera works
- [ ] Offline works

### 6.3 Desktop (Chrome/Firefox)
- [ ] App is usable on desktop (max-width container)
- [ ] Manual search works
- [ ] Score gauge renders correctly

---

## Phase 7 — Polish & Content 🔴 BLOCKED on Phase 4

**Goal:** App feels complete and accurate for demo day.

### 7.1 Species data accuracy
- [ ] Verify scores for the 10 most common Spanish market species
- [ ] Cross-check IUCN statuses against current Red List (2023/2024 assessments)
- [ ] Review FAO area modifiers against STECF 2023 report
- [ ] Add any missing common synonyms to `species-db.json`
- [ ] Add regional names (Valencian, Catalan, Basque) for top 5 species

### 7.2 UI/UX polish
- [ ] Test every screen on 375px wide (iPhone SE)
- [ ] Fix any text overflow or layout issues
- [ ] Verify animated gauge works smoothly on low-end Android
- [ ] Check `prefers-reduced-motion` disables gauge animation
- [ ] Verify offline banner appears/disappears correctly

### 7.3 Confetti & gamification feel
- [ ] Badge unlock → confetti fires correctly on real device
- [ ] Ocean Score counter animation feels snappy
- [ ] Social share: Web Share API works on iOS/Android
- [ ] Clipboard fallback works on desktop

### 7.4 Error states
- [ ] No internet + no cache → meaningful error message (not blank screen)
- [ ] IUCN API down → graceful fallback to static score
- [ ] Wolfram timeout → CO2 badge shows fallback value with "estimated" label
- [ ] Camera denied → clear message with alternative options shown

---

## Phase 8 — Demo Day Preparation 🔴 BLOCKED on Phase 7

**Goal:** Zero failures during the live demo.

### 8.1 Cache warming
- [ ] Run through all 10 test barcodes on the demo device the night before
- [ ] Search 10 species manually to warm synonym + IUCN cache
- [ ] Verify all 10 results load instantly in airplane mode
- [ ] Enable airplane mode — confirm OfflineBanner appears

### 8.2 Demo script
- [ ] Prepare 3-minute demo flow:
  1. Show Home screen
  2. Scan a "bad" fish barcode (e.g. Mediterranean merluza by bottom trawl) → Avoid score
  3. Tap alternative → score jumps + confetti
  4. Show Profile page → Ocean Score + badge earned
  5. Toggle to English
  6. Show "Add to Home Screen" on phone
- [ ] Practice the flow 3× end-to-end

### 8.3 Fallback plan
- [ ] If WiFi fails: demo runs fully offline from warmed cache
- [ ] If camera fails: switch to manual search immediately
- [ ] Know which barcodes definitely work (tested in Phase 4)

### 8.4 Final checks
- [ ] Production URL shared with judges in advance (if required)
- [ ] README on GitHub explains the project clearly
- [ ] Screenshots or screen recording ready as backup

---

## Phase 9 — Stretch Features (post-hackathon if time permits)

These are not needed to win — only do them if Phases 1–8 are solid.

- [ ] **Google sign-in** via Supabase Auth (cross-device history sync)
- [ ] **Price crowdsourcing** — Supabase table + Wolfram price query + user submit button
- [ ] **Confetti OG image** — canvas-generated shareable card with score + species
- [ ] **Push notifications** — PWA push for "sardines in season!" alerts
- [ ] **More species** — expand from 21 to 50 species in `species-db.json`
- [ ] **Retailer-specific barcodes** — pre-scan Mercadona/Carrefour fish section

---

## Quick Reference — Key Commands

```bash
# Local dev (no serverless functions)
npm run dev

# Local dev WITH serverless functions (needs vercel CLI)
vercel dev

# Type check
npm run typecheck

# Tests
npm run test:ci

# Build
npm run build

# Deploy to Vercel (after first setup)
git push origin main   # auto-deploys via GitHub integration
```

## Quick Reference — Key URLs

| Thing | URL |
|-------|-----|
| GitHub repo | https://github.com/jordanlynn5/nice-catch |
| Vercel dashboard | https://vercel.com/jordanlynn5/nice-catch (after deploy) |
| Production app | TBD (assigned by Vercel after deploy) |
| IUCN API signup | https://apiv3.iucnredlist.org |
| Wolfram developer | https://developer.wolframalpha.com |
| Open Food Facts | https://world.openfoodfacts.org |

---

## Phase Status Summary

| Phase | Name | Status |
|-------|------|--------|
| 0 | Foundation | ✅ Complete (24/24 tests, Smart Buying Guidance) |
| 1 | API Keys & Local Verification | 🚧 In Progress (API keys configured, vercel dev running) |
| 2 | PWA Icons | 🔴 Next |
| 3 | Vercel Deployment | 🔴 Blocked on 1 |
| 4 | Barcode Testing | 🔴 Blocked on 3 |
| 5 | Camera / GreenPT | 🔴 Blocked on 1 |
| 6 | Device & PWA Testing | 🔴 Blocked on 3 |
| 7 | Polish & Content | 🔴 Blocked on 4 |
| 8 | Demo Day Prep | 🔴 Blocked on 7 |
| 9 | Stretch Features | ⬜ Optional |
