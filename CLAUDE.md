# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Nice Catch** — A PWA that decodes EU seafood labels and gives a 1–100 sustainability score, CO2 impact, and alternative fish suggestions. Targeted at Spanish consumers at grocery stores and fish markets. Built for an environmental hackathon.

See `planfile.md` for the full specification.

---

## Commands

```bash
# Development
npm run dev          # Vite dev server at localhost:5173

# Build & preview
npm run build        # Type-check + Vite build to dist/
npm run preview      # Preview production build locally

# Type checking
npm run typecheck    # tsc --noEmit

# Linting
npm run lint         # ESLint

# Testing
npm test             # Jest in watch mode
npm run test:ci      # Jest single run (CI)
npm run test:coverage  # Jest with coverage report (lcov + text)
npm test -- --testPathPattern=scoreEngine  # Run a single test file
```

Vercel serverless functions in `/api/` are automatically deployed — test them locally with `vercel dev`.

---

## Architecture

### Request flow

Every lookup — whether from a barcode scan, camera capture, or manual search — funnels through a single hook:

```
input (barcode | image | text)
  → synonymResolver.ts        normalise to canonical species ID
  → useSustainability.ts      orchestrates all API calls in parallel
      ├── openFoodFacts.ts     product metadata (barcode path only)
      ├── fishBase.ts          species biology
      ├── iucn.ts              conservation status (via /api/iucn serverless proxy)
      └── wolframAlpha.ts      CO2 data (via /api/wolfram serverless proxy, cached)
  → scoreEngine.ts             compute final score
  → ResultPage renders
  → useGameification.ts        award points + check badge conditions
  → IndexedDB cache            write result for offline reuse
```

### Scoring

`scoreEngine.ts` computes:
```
finalScore = clamp(
  iucnBase + methodModifier + areaModifier + originModifier,
  species.scoreRange[0],
  species.scoreRange[1]
)
```

- IUCN status is the heaviest input (0–50 pts base)
- Fishing method and FAO catch area add/subtract modifiers
- Each species in `species-db.json` has a hard `scoreRange` that clamps the result regardless of modifiers — these are the research-backed guardrails

Score bands: 0–25 Avoid, 26–50 Think Twice, 51–75 Good Choice, 76–100 Best Choice.

### Serverless functions (`/api/`)

Three functions proxy secret API keys — never expose these as `VITE_` prefixed env vars:
- `api/iucn.ts` — IUCN Red List API
- `api/wolfram.ts` — Wolfram Alpha (CO2 + species enrichment). User has Wolfram One subscription; cache every response in IndexedDB to avoid redundant calls.
- `api/greenpt.ts` — GreenPT vision (label parsing) and chat

### Data files (`src/data/`)

These are the backbone of the app — get these right before building any UI:

- `species-db.json` — canonical species records. Each entry: `{ id, names: {es[], en[], fr[], scientific, eu_commercial}, iucnStatus, defaultScore, scoreRange, goodAlternatives, category, notes_es }`
- `fao-areas.json` — FAO area code → score modifier + human-readable name
- `fishing-methods.json` — EU fishing gear category → score modifier
- `alternatives.json` — species category → ranked list of better alternatives
- `seasonality.json` — species → `{ mediterranean, atlantic }` → `{ best[], avoid[] }` months
- `co2-fallback.json` — static kg CO2/kg fish by method (used when Wolfram returns nothing)

### Synonym resolution

`synonymResolver.ts` is called first on every lookup path. It maps any incoming name (Spanish common name, English name, French name, scientific name, EU commercial label text) → canonical `species.id`. If no match: fuzzy match → GreenPT fallback. **All downstream API calls use the scientific name resolved here.**

### Alternatives logic

1. Same species, better production method (if sustainability delta ≥ 15 pts)
2. Same flavor/texture category, higher scoring species
3. If neither option exists (or no alternative scores ≥ 15 pts higher): show `ReduceMessage.tsx` with seasonality data and reduce-consumption guidance

### Offline

`speciesCache.ts` and `productCache.ts` wrap IndexedDB via `idb`. After any successful API response, the full resolved species result is cached. On subsequent lookups, cache is checked before any network call. Vercel service worker (via `vite-plugin-pwa`) precaches the app shell and all `src/data/` JSON files.

### Gamification

`useGameification.ts` reads/writes a single localStorage key `nicecatch_profile`. Points and badge state live there. Zustand (`appStore.ts`) holds transient UI state only — not persisted.

---

## Key conventions

- **ZXing is dynamically imported** — `const { BrowserMultiFormatReader } = await import('@zxing/browser')` inside the scanner view. Never import at module top level; it adds ~400KB.
- **All API calls use `ky`** with a 3-second timeout. FishBase has no SLA — treat any failure as non-fatal and continue with partial data.
- **CO2 via Wolfram query pattern**: `"carbon footprint of {scientificName} per kilogram seafood"` — parse the numeric value from the response. Fall back to `co2-fallback.json` keyed by fishing method if no result.
- **Wild vs. farmed**: the score reflects what the EU label states. When wild and farmed have meaningfully different scores for the same species, the first alternative card suggests the same species with the better production method.
- **i18n**: simple custom `useI18n()` hook backed by `src/i18n/es.json` and `en.json`. No external library. Default language is `es` (Spanish).

---

## Color tokens (Tailwind config)

```
primary:   #309f9b  (teal — CTAs, score needle)
secondary: #80b8a2  (sage — Good Choice band)
warm:      #f3cfa4  (sandy peach — card backgrounds)
deep:      #106c72  (deep teal — Best Choice band, headers)
earth:     #b97f5f  (terracotta — Think Twice band, accents)
danger:    #ef4444  (red — Avoid band)
```

---

## Environment variables

All secret keys live in `.env.local` (never committed) and are accessed only in `/api/` serverless functions:

```
IUCN_API_KEY=
WOLFRAM_APP_ID=
GREENPT_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=      # stretch feature
NEXT_PUBLIC_SUPABASE_ANON_KEY= # stretch feature (anon key is safe to expose)
```
