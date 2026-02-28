# End-to-End Tests

This directory contains Playwright E2E tests that verify the core user flows from the Phase 1.4 smoke test checklist.

## Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (recommended for debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# View last test report
npm run test:e2e:report
```

## Test Coverage

### ✅ Implemented Tests

1. **Manual Search Flow**
   - Type "dorada" → resolves to Dorada
   - Wizard completion → score displayed
   - Score gauge visible

2. **Buying Guidance**
   - Low-scoring fish (Mediterranean merluza + bottom trawl)
   - Guidance cards with impact badges (+XX)
   - "Look for" / "Avoid" sections

3. **i18n Toggle**
   - Switch Spanish ↔ English
   - All labels update correctly

4. **AI Assistant**
   - Natural language query → species extraction
   - Score displayed from AI-parsed data

5. **FAO Area Scoring**
   - General FAO codes (27, 37, 87) work
   - Area modifier is not zero

6. **Result Page Components**
   - Score gauge (SVG)
   - CO2 badge
   - IUCN status
   - Score breakdown

7. **Navigation**
   - Back button returns to home

8. **PWA & Service Worker**
   - No JavaScript errors on load
   - Service worker registers correctly

### ⏳ TODO Tests (Phase 2+)

- **Barcode Scanner**: Camera activation, scan overlay, decode flow
- **Gamification**: Points earned, badges unlocked, Ocean Score display
- **Wolfram CO2**: API call, cache behavior, fallback values
- **IUCN API**: Live API response, fallback to static data
- **Offline Mode**: IndexedDB cache, offline banner display

## Test Configuration

See `playwright.config.ts`:
- **Base URL**: `http://localhost:3001` (vercel dev)
- **Projects**: Desktop Chrome + iPhone 12 mobile emulation
- **Web Server**: Auto-starts `vercel dev` before tests
- **Screenshots**: Captured on failure
- **Trace**: Recorded on first retry

## CI/CD

These tests are designed to run in CI with the following environment variables:
- `CI=true` - Enables stricter retry logic
- All API keys should be set in CI secrets (IUCN_API_KEY, WOLFRAM_APP_ID, GREENPT_API_KEY)

## Debugging Tips

1. **Use UI mode** for interactive debugging:
   ```bash
   npm run test:e2e:ui
   ```

2. **Run specific test**:
   ```bash
   npx playwright test -g "Manual search"
   ```

3. **View traces** (after failure):
   ```bash
   npm run test:e2e:report
   ```

4. **Check selector issues**: Use Playwright Inspector:
   ```bash
   npx playwright test --debug
   ```

## Notes

- Tests require `vercel dev` running on port 3001
- Some tests skip if UI elements (like language toggle) aren't present yet
- API calls may be slow or fail in test environment - tests have 10-15s timeouts
- Mobile tests run with iPhone 12 viewport (390x844)
