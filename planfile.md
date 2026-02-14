# Nice Catch — Seafood Sustainability PWA
## Full Specification (Post-Interview)

---

## Context

A Spanish consumer standing at a fish market or grocery store has almost no easy way to know whether the fish in front of them is sustainably caught. EU law requires fish labels to carry the species name, catch area (FAO code), and fishing method — but this information is meaningless to most shoppers. "Nice Catch" decodes that label in seconds and gives a clear sustainability score, CO2 impact, and a better alternative when needed.

Built for an environmental hackathon. Prizes rewarded for use of Wolfram (user has Wolfram One 6-month subscription), GreenPT, and AI/ML.

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | React 18 + Vite 5 + TypeScript | PWA via `vite-plugin-pwa` |
| Styling | Tailwind CSS | Custom color tokens from palette below |
| State | Zustand | Global UI state only |
| Persistence | localStorage + IndexedDB (`idb`) | Gamification + offline cache |
| HTTP | `ky` | Retry/timeout/JSON parsing |
| Barcode | `@zxing/browser` | Dynamically imported |
| Backend | Vercel serverless functions | API key proxy |
| Database | Supabase free tier | Stretch: crowdsourced prices + optional auth |
| Hosting | Vercel free tier | |

---

## Color Palette

```
#309f9b  — Primary teal (brand color, score needle, CTAs)
#80b8a2  — Sage green (Good Choice band, secondary actions)
#f3cfa4  — Sandy peach (warm backgrounds, cards)
#106c72  — Deep teal (headers, Best Choice band)
#b97f5f  — Warm terracotta (Think Twice band, accents)
#ef4444  — Red (Avoid band — standard for accessibility)
```

---

## Input Methods (priority order)

1. **Barcode scanner** → Open Food Facts API → extract species/origin/method
2. **Camera + AI label reader** → JPEG frame → `/api/greenpt` (vision) → `{ species, area, method }`
3. **Manual text search** → fuzzy synonym match against bundled `species-db.json` + Open Food Facts name search

Fallback chain: barcode times out after 8s → offer camera capture → text search always available in top bar.

---

## APIs

| API | Auth | Cost | Use |
|-----|------|------|-----|
| Open Food Facts | None | Free | Barcode → product/species |
| FishBase (ropensci) | None | Free | Species biology + taxonomy |
| FAO ASFIS | None | CSV download | Bundled as JSON for species codes + catch areas |
| IUCN Red List | API key | Free | Conservation status |
| Wolfram Alpha | App ID | Wolfram One subscription | CO2 data + species enrichment (runtime, cached) |
| GreenPT | API key | Free tier | Vision label parsing + sustainability chat |
| Supabase | Anon key | Free tier (500MB) | Stretch: crowdsourced prices + optional auth |

All keyed APIs proxied through Vercel serverless functions. Never use `VITE_` prefix for secrets.

---

## File Structure

```
/
├── public/
│   └── manifest.json, icons/ (192, 512, maskable)
├── src/
│   ├── components/
│   │   ├── scanner/
│   │   │   ├── BarcodeScanner.tsx     ZXing camera feed + decode
│   │   │   ├── CameraCapture.tsx      Snapshot → GreenPT vision
│   │   │   └── ManualSearch.tsx       Combobox with synonym matching
│   │   ├── results/
│   │   │   ├── ProductCard.tsx        Main result card
│   │   │   ├── SustainabilityGauge.tsx  Semicircular SVG dial (ESG style)
│   │   │   ├── ScoreBreakdown.tsx     IUCN + method + area pillars
│   │   │   ├── CO2Badge.tsx           kg CO2/kg fish chip
│   │   │   ├── AlternativesList.tsx   Same-category better options
│   │   │   ├── ReduceMessage.tsx      When no alternative exists
│   │   │   └── SpeciesDetail.tsx      FishBase biology data
│   │   ├── gamification/
│   │   │   ├── OceanScore.tsx         Points total + animated counter
│   │   │   ├── BadgeGrid.tsx          Earned/locked badges + share button
│   │   │   └── ScanHistory.tsx        Past scans from localStorage
│   │   ├── chat/
│   │   │   └── GreenPTChat.tsx        Floating chat widget with species context
│   │   └── ui/
│   │       ├── LanguageToggle.tsx     ES/EN toggle in top bar
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── OfflineBanner.tsx
│   │       └── Toast.tsx
│   ├── pages/
│   │   ├── HomePage.tsx               Scan button + recent searches
│   │   ├── ResultPage.tsx             Full result after scan
│   │   ├── ProfilePage.tsx            Ocean score + badges + history
│   │   └── AboutPage.tsx              Methodology + data sources
│   ├── hooks/
│   │   ├── useBarcode.ts
│   │   ├── useCamera.ts
│   │   ├── useSustainability.ts       Main orchestration hook
│   │   ├── useGameification.ts        Points + badges (localStorage)
│   │   ├── useOffline.ts
│   │   └── useI18n.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── openFoodFacts.ts
│   │   │   ├── fishBase.ts
│   │   │   ├── iucn.ts
│   │   │   ├── wolframAlpha.ts        CO2 + enrichment queries
│   │   │   └── greenPT.ts             Vision + chat
│   │   ├── scoring/
│   │   │   ├── scoreEngine.ts         Main orchestrator
│   │   │   ├── iucnScore.ts
│   │   │   ├── methodScore.ts
│   │   │   ├── areaScore.ts
│   │   │   └── staticOverride.ts      Curated species clamp
│   │   ├── cache/
│   │   │   ├── speciesCache.ts        IndexedDB — species API responses
│   │   │   └── productCache.ts        IndexedDB — barcode lookups
│   │   └── parsers/
│   │       ├── labelParser.ts         EU label field extraction
│   │       ├── aiLabelParser.ts       GreenPT vision → structured data
│   │       └── synonymResolver.ts     Common name → canonical species ID
│   ├── data/
│   │   ├── species-db.json            15-20 curated Spanish species
│   │   ├── fao-areas.json             FAO codes + sustainability modifiers
│   │   ├── fishing-methods.json       Method → score modifier + CO2 fallback
│   │   ├── alternatives.json          Species → better alternatives by category
│   │   ├── seasonality.json           Best months per species (Med + Atlantic split)
│   │   └── co2-fallback.json          Static CO2 values from lifecycle analyses
│   ├── i18n/
│   │   ├── es.json
│   │   └── en.json
│   ├── store/
│   │   └── appStore.ts                Zustand
│   └── types/
│       ├── species.ts
│       ├── scoring.ts
│       └── gamification.ts
├── api/                               Vercel serverless functions
│   ├── iucn.ts
│   ├── wolfram.ts
│   └── greenpt.ts
├── vite.config.ts
├── vercel.json
└── .env.local                         Never committed
```

---

## Sustainability Scoring Algorithm

```
finalScore = clamp(
  iucnBase + methodModifier + areaModifier + originModifier,
  staticOverride.min,
  staticOverride.max
)
```

### IUCN Base Score (0–50 pts)
```
LC=50, NT=40, VU=25, EN=10, CR/EX=0, DD=30, NE=30
```

### Fishing Method Modifier (−20 to +20 pts)
```
bottom_trawl: −20    beam_trawl: −18    dredge: −15
midwater_trawl: −8   purse_seine: −5    gillnet: −5
longline_pelagic: 0  trap_pot: +12      pole_and_line: +15
hook_and_line: +15   handline: +18
aquaculture_certified (ASC/MSC): +20    aquaculture_standard: +10
unknown: 0
```

### FAO Area Modifier (−15 to +15 pts)
```
Mediterranean 37.1/37.2/37.3: −15 to −12  (STECF 2023: >90% stocks overfished)
Black Sea 37.4: −10
Bay of Biscay 27.8: +5      Portuguese Waters 27.9: +3
North Sea 27.4: +10          West of Scotland 27.6: +12
Northeast Pacific 67: +8     Southeast Atlantic 47: −8
Unknown: 0
```

### Origin/Certification Modifier (−10 to +10 pts)
```
MSC: +10   ASC: +8   GlobalGAP: +5   Friend of Sea: +4
EU origin: +2        IUU risk flag: −10
```

### Static Species Override
Each entry in `species-db.json` includes `scoreRange: [min, max]` — the final score is clamped to this range, ensuring research-backed floors/ceilings.

### Score Bands (Gauge Display)
```
76–100: Best Choice   (#106c72 deep teal)
51–75:  Good Choice   (#80b8a2 sage green)
26–50:  Think Twice   (#b97f5f terracotta)
0–25:   Avoid         (#ef4444 red)
```

### Confidence Level
Shown as a chip on the result card:
- `high`: live IUCN + method from label + FAO area from label
- `medium`: one factor missing or sourced from static data
- `low`: no label data, static override only

---

## CO2 Data Strategy

**Primary**: Wolfram One API at runtime: `"carbon footprint of {species} per kilogram seafood"`
- Parse response for kg CO2/kg value
- Cache in IndexedDB (never re-query same species)

**Fallback**: `co2-fallback.json` — static table from published lifecycle analyses, differentiated by fishing method (e.g. bottom-trawled cod ~3.5 vs line-caught ~1.2 kg CO2/kg)

**Display**: Chip on result card: `~2.3 kg CO2/kg` + comparison: `"3× less than bottom-trawled equivalent"`

---

## Wild vs. Farmed Handling

- Score computed for what the label states (wild or farmed)
- If significant sustainability difference exists between wild and farmed: **first alternative suggestion is the same species, different production method** (e.g. "Wild merluza from North Atlantic instead of Mediterranean")
- Only then suggest a different species as further alternatives

---

## Alternatives Logic

1. Same species, better origin/method (if sustainability delta is significant)
2. Same flavor/texture category with higher score
3. If no alternative scores at least 15 points higher: show `ReduceMessage.tsx`

### No-Alternative Fallback (`ReduceMessage.tsx`)
- Why this species is under pressure (1–2 sentences from `species-db`)
- Best months to buy from `seasonality.json` (Mediterranean or Atlantic split)
- "Consider reducing consumption to once a month" guidance

---

## Name / Synonym Resolution

`synonymResolver.ts` maps any incoming name → canonical `species.id`:

```json
{
  "id": "dorada",
  "names": {
    "es": ["Dorada", "Orada"],
    "en": ["Gilt-head bream", "Gilthead seabream"],
    "fr": ["Daurade"],
    "scientific": "Sparus aurata",
    "eu_commercial": "Dorada"
  }
}
```

Matching priority: exact → case-insensitive → partial/fuzzy → GreenPT AI fallback for unknown names.

---

## Score Gauge Component (`SustainabilityGauge.tsx`)

Semicircular SVG dial matching the ESG image reference:
- Half-circle arc with color-banded segments
- Numeric score + band label in center
- Needle sweeps from 0 → score over 800ms ease-out
- Respects `prefers-reduced-motion` (instant render if set)

---

## Seasonality Data

`seasonality.json` structure:
```json
{
  "sardina": {
    "mediterranean": { "best": ["May","Jun","Jul","Aug"], "avoid": ["Jan","Feb"] },
    "atlantic":      { "best": ["Apr","May","Jun","Jul"], "avoid": ["Dec","Jan"] }
  }
}
```

Shown in `ReduceMessage.tsx` and as a small chip on result cards.

---

## Gamification

**Ocean Score** (localStorage):
```
+10 pts: any scan
+15 pts: scanned species scores > 75
+25 pts: chose an alternative
+5 pts:  shared a badge
```

**Badges**:
| Badge | Condition |
|-------|-----------|
| First Catch | First scan |
| Conscious Choice | First alternative chosen |
| Endangered Guardian | Scanned + avoided a CR/EN species |
| Ocean Champion | 10 scans with score > 75 |
| Share the Wave | First social share |

- Unlock triggers `canvas-confetti` animation
- Each badge has a **share button** → generates an OG image card for social (Twitter/Instagram)

---

## Authentication (optional sign-in only)

- Users can skip entirely — full functionality with local-only state
- Optional Google sign-in via Supabase Auth
- Signed-in benefit: cross-device history sync
- No leaderboard — gamification is personal only

---

## First Launch / Navigation

**Home screen**: Prominent scan button + recent searches list (localStorage). No onboarding splash.

**Bottom tab bar**: Scan | History | Profile | About

**Language**: Spanish default (`navigator.language` detection), EN toggle in top bar.

---

## Implementation Phases

| Phase | Goal | Priority |
|-------|------|----------|
| 1 | Scaffold + barcode scan + static score + gauge UI | Must ship |
| 2 | Live IUCN/FishBase + score breakdown + CO2 via Wolfram | Must ship |
| 3 | Synonym resolution + manual search + camera AI fallback | Must ship |
| 4 | Alternatives logic (wild/farmed + category) + no-alternative message | Must ship |
| 5 | Gamification (ocean score + badges + social share) | High |
| 6 | PWA offline (service worker + IndexedDB cache) | High |
| 7 | GreenPT chat widget + i18n polish + Vercel deploy | Medium |
| 8 | Optional Google sign-in (Supabase Auth) | Stretch |
| 9 | Price feature (Supabase schema + Wolfram price + crowdsource button) | Stretch |

---

## Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Open Food Facts sparse fish coverage | Fuzzy-match `product_name` against synonym map |
| FishBase no SLA | 3s timeout, non-fatal, cache all responses |
| IUCN needs scientific name | Always resolve via `synonymResolver.ts` first |
| Wolfram CO2 uncertain coverage | Cache results; `co2-fallback.json` always available |
| ZXing bundle size | Dynamic `import()` on scanner view open only |
| GreenPT reliability unknown | Camera falls through to ManualSearch; chat shows "unavailable" gracefully |
| iOS PWA camera permission reset on install | Prompt install first, then request camera |
| Demo day WiFi failure | Pre-scan 10 products to warm IndexedDB cache before presenting |

---

## Critical Files to Get Right First

1. `src/data/species-db.json` — species backbone: scores, synonyms, categories, seasonality
2. `src/services/scoring/scoreEngine.ts` — all results flow through here
3. `src/services/parsers/synonymResolver.ts` — every lookup path depends on this
4. `src/hooks/useSustainability.ts` — parallel API orchestration + fallback chain
5. `src/components/results/SustainabilityGauge.tsx` — the core visual, used everywhere
6. `api/wolfram.ts` — CO2 + enrichment proxy; pattern reused for IUCN and GreenPT

---

## Verification Checklist

1. **Barcode**: Scan EAN from packaged merluza → species identified, score shown, CO2 badge visible
2. **Wolfram CO2**: Vercel function logs show Wolfram query + cached result in IndexedDB on second scan
3. **Manual search**: Type "orada" → resolves to "dorada" via synonyms → correct score shown
4. **Wild vs. farmed**: Scan farmed dorada → first alternative is "wild dorada, North Atlantic"
5. **No alternative**: Search "atún rojo" → ReduceMessage shows seasonality + reduce consumption text
6. **Gamification**: 3 scans → ProfilePage shows updated ocean score + badge progress
7. **Social share**: Earn a badge → tap share → OG image generated
8. **Offline**: Disconnect → scan previously cached species → result loads with OfflineBanner
9. **PWA**: "Add to Home Screen" on iOS + Android → launches full-screen
10. **i18n**: Toggle ES/EN → all strings change including species names
