# Nice Catch

Empowering Spanish consumers to make sustainable seafood choices at the point of purchase

A Progressive Web App that decodes EU seafood labels and provides instant sustainability scores, CO₂ impact analysis, and personalized alternatives — helping shoppers navigate the complex world of seafood sustainability with confidence.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

---

## The Problem

Seafood sustainability is complex. EU labels contain critical information — fishing method, FAO catch area, production method, origin — but most consumers don't know how to interpret these details or make informed choices that balance environmental impact with their budget and preferences.

Nice Catch transforms confusing labels into clear, actionable guidance in under 3 seconds.

---

## Key Features

### Three Ways to Search
- Barcode Scan: Instant lookup via product barcode (OpenFoodFacts integration)
- Camera Capture: AI-powered label parsing using computer vision (GreenPT)
- Manual Search: Guided wizard for selecting species, method, area, and origin

### Sustainability Scoring (0-100)
- IUCN Red List conservation status as baseline
- Modifiers for fishing method, FAO catch area, and production system
- Research-backed score ranges per species (no overpromising)
- Clear bands: Best Choice (76-100), Good Choice (51-75), Think Twice (26-50), Avoid (0-25)

### Environmental Impact
- CO₂ footprint per kilogram (via Wolfram Alpha API)
- Visual comparison against global averages
- Methodology transparency (trawling vs. line-caught, wild vs. farmed)

### Smart Alternatives System
- Suggests better options based on current selection
- Same species with better production method (e.g., wild-caught vs. farmed)
- Similar flavor/texture profile with higher sustainability score
- Gamification: unlock badges by choosing alternatives

### Gamification
- Earn points for every scan and sustainable choice
- Unlock badges: First Scan, Sustainability Hero, Conscious Choice, Catch Streak
- Track scan history with score timeline
- Encourages habit formation and repeat engagement

### AI Chat Assistant
- Powered by GreenPT AI
- Context-aware answers about species sustainability
- Bilingual support (Spanish/English)

### Fully Offline-Capable
- IndexedDB caching for all API responses
- Service worker precaches app shell + species database
- Works without connectivity after first load

### Bilingual
- Spanish (default) and English
- Localized species names, UI text, and sustainability guidance

---

## Tech Stack

### Frontend
- React 18 with TypeScript — type-safe component architecture
- Vite — lightning-fast dev server and optimized production builds
- Tailwind CSS — utility-first styling with custom Mediterranean color palette
- Zustand — lightweight state management for UI state
- React Router — client-side routing with navigation history

### APIs & Data
- OpenFoodFacts — barcode product lookup
- IUCN Red List — species conservation status (via serverless proxy)
- Wolfram Alpha — CO₂ footprint calculations (via serverless proxy)
- GreenPT — Vision AI for label parsing + conversational chat (via serverless proxy)
- FishBase — species biology and taxonomy

### Scanning & Recognition
- ZXing — barcode scanning library (dynamically imported)
- GreenPT Vision — OCR and label understanding for camera capture

### Storage & Caching
- IndexedDB (via `idb`) — client-side caching for species, products, and CO₂ data
- localStorage — gamification profile persistence

### Deployment
- Vercel — serverless functions + global CDN
- Vite PWA Plugin — service worker generation with Workbox

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Vercel CLI (for local serverless function testing)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd nice-catch

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
IUCN_API_KEY=your_iucn_api_key
WOLFRAM_APP_ID=your_wolfram_app_id
GREENPT_API_KEY=your_greenpt_api_key
```

> Note: Never prefix these with `VITE_` — they're accessed only in serverless functions to keep them secret.

### Development

```bash
# Run Vite dev server (for UI development)
npm run dev
# → http://localhost:5173

# Run Vercel dev server (REQUIRED for testing AI assistant and API proxies)
vercel dev --listen 3000
# → http://localhost:3000
```

> Important: The AI assistant and all `/api/*` endpoints require `vercel dev` because they're Vercel serverless functions. Use `npm run dev` only for UI-only work.

### Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Unit tests
npm test              # Watch mode
npm run test:ci       # Single run
npm run test:coverage # With coverage report

# Run specific test file
npm test -- --testPathPattern=scoreEngine
```

### Production Build

```bash
npm run build
npm run preview  # Preview production build locally
```

---

## How to Use

### 1. Scan or Search
- Tap Ask AI Assistant for conversational fish identification
- Tap Capture Label to photograph an EU seafood label
- Tap Manual Search to browse by species name
- Tap Scan Barcode for packaged products

### 2. Get Your Score
- See sustainability score (0-100) with color-coded band
- Review environmental impact (CO₂ per kg)
- Read species-specific buying guidance
- Check if it's in-season in your region

### 3. Explore Alternatives
- View better options (same fish with better method, or similar species)
- Choose an alternative to unlock gamification badges
- Navigate back through your selection history

### 4. Track Your Impact
- View recent scans on homepage
- Check your gamification profile (points, badges, streak)
- See your sustainability journey over time

---

## Architecture

### Request Flow

Every lookup follows this pipeline:

```
Input (barcode | camera | manual search)
  ↓
synonymResolver.ts          ← Normalize to canonical species ID
  ↓
useSustainability.ts        ← Orchestrate parallel API calls
  ├── openFoodFacts.ts       (barcode metadata)
  ├── fishBase.ts            (species biology)
  ├── iucn.ts                (conservation status)
  └── wolframAlpha.ts        (CO₂ data)
  ↓
scoreEngine.ts              ← Compute final score with modifiers
  ↓
ResultPage                  ← Render score, guidance, alternatives
  ↓
useGameification.ts         ← Award points + check badge conditions
  ↓
IndexedDB cache             ← Store for offline reuse
```

### Scoring Algorithm

```javascript
finalScore = clamp(
  iucnBase + methodModifier + areaModifier + originModifier,
  species.scoreRange[0],  // Research-backed floor
  species.scoreRange[1]   // Research-backed ceiling
)
```

- IUCN Status: 0-50 pts base (Critically Endangered = 0, Least Concern = 50)
- Fishing Method: ±15 pts (pole-and-line +15, bottom trawl -15)
- FAO Area: ±10 pts (overfished regions penalized)
- Production Method: Wild vs. farmed (species-dependent)

Each species in `species-db.json` has a hard `scoreRange` that clamps results regardless of modifiers — these are the research-backed guardrails.

### Serverless Functions (`/api/`)

Three Vercel serverless functions proxy secret API keys:

- `api/iucn.ts` — IUCN Red List API (species conservation status)
- `api/wolfram.ts` — Wolfram Alpha API (CO₂ calculations)
- `api/greenpt.ts` — GreenPT Vision + Chat (label parsing, AI assistant)

This keeps API keys secure (never exposed to client) and provides CORS headers.

### Data Files (`src/data/`)

- `species-db.json` — 21 Spanish species with names, scores, alternatives, categories
- `fao-areas.json` — FAO area codes → score modifiers + human-readable names
- `fishing-methods.json` — EU gear categories → score modifiers
- `alternatives.json` — Species category → ranked alternative species
- `seasonality.json` — Mediterranean/Atlantic best/avoid months per species
- `co2-fallback.json` — Static CO₂ estimates by fishing method (Wolfram fallback)

---

## Design Philosophy

Mediterranean Minimalism — Clean, editorial typography with a muted color palette inspired by the Spanish coast:

- Navy (#1e3a5f) — Best Choice band, headers
- Teal (#0891b2) — Primary actions, accents
- Olive (#6b7c59) — Good Choice band
- Terracotta (#dc6b4a) — Think Twice band
- Coral (#ff6b6b) — Avoid band
- Cream (#f5e6d3) — Backgrounds, warmth

Typography: Serif headings for editorial feel, sans-serif body for legibility. No emojis, generous whitespace, refined interactions.

---

## Data Sources

- [IUCN Red List](https://www.iucnredlist.org/) — Global conservation status authority
- [OpenFoodFacts](https://world.openfoodfacts.org/) — Collaborative food product database
- [FishBase](https://www.fishbase.org/) — Comprehensive fish species database
- [Wolfram Alpha](https://www.wolframalpha.com/) — Computational knowledge engine
- [GreenPT](https://greenpt.ai/) — Environmental AI platform
- [FAO](https://www.fao.org/) — Fishing area definitions and stock assessments

---

## Testing

Test Coverage: 19/19 tests passing

```bash
npm run test:ci
```

Tests cover:
- Score calculation engine with all modifiers
- Synonym resolution and fuzzy matching
- Label parsing from OpenFoodFacts data
- Alternatives generation logic
- Gamification badge conditions
- Caching TTL and invalidation

---

## Deployment

Deployed on Vercel with automatic CI/CD:

1. Push to `main` branch triggers production deployment
2. Push to `developer` branch triggers preview deployment
3. Serverless functions auto-deploy with environment variables from Vercel dashboard
4. Service worker precaches app shell + species database on first visit

---

## Future Enhancements

- Price Comparison: Integrate real-time pricing data for alternatives
- User-Reported Data: Crowdsource prices, availability, and regional insights
- Social Features: Share scans, compare scores with friends
- Retail Integration: Partner with supermarkets for in-store guidance
- Expanded Database: Support for shellfish, mollusks, and aquaculture species
- Recipe Suggestions: Sustainable cooking ideas based on in-season species

---

## License

This project was created for an environmental hackathon. License TBD.

---

## Acknowledgments

Built with data from IUCN, OpenFoodFacts, FishBase, Wolfram Alpha, and GreenPT. Scoring methodology informed by marine conservation research and EU sustainability guidelines.

For a healthier ocean, one choice at a time.
