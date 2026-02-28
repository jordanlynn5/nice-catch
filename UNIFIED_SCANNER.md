# Unified Scanner Implementation

## Overview

Implemented a **single "Start Exploring" entry point** that intelligently combines all scanning capabilities into one seamless experience.

## What Changed

### New Component: `UnifiedScanner.tsx`

A smart camera component that:

1. **Auto-detects barcodes** in the background while camera is running
   - Uses ZXing with continuous barcode scanning
   - Shows overlay when barcode is detected
   - Auto-processes after 1 second (user can cancel)

2. **Captures photos** for label analysis
   - Large capture button always visible
   - Sends to GreenPT vision API for label parsing
   - Extracts species, FAO area, fishing method, certifications

3. **Intelligent fallbacks**
   - If barcode lookup fails → AI chat assistance
   - If label vision fails → AI chat assistance
   - If AI can't help → Manual search
   - User can manually trigger fallbacks anytime

4. **Enhanced autofocus**
   - Continuous autofocus mode (`focusMode: 'continuous'`)
   - High resolution (1920x1080) for better detection
   - Works on modern mobile browsers

### Updated HomePage

**Simplified UX:**
- Single "Start Exploring" button opens `UnifiedScanner`
- Removed separate barcode/camera/AI buttons from main flow
- Kept manual search as secondary option on mobile
- Kept side nav for power users (desktop only)

**User flow:**
```
Start Exploring
    ↓
UnifiedScanner (camera opens)
    ↓
Auto-scanning for barcode + Photo capture ready
    ↓
[Barcode detected] → Process → Result
    OR
[Photo captured] → GreenPT vision → Result
    OR
[Neither works] → AI chat → Manual search
```

### Translation Updates

Added new i18n keys:
- `scanner.smart_scan` - "Point at barcode or label" / "Apunta al código o etiqueta"
- `scanner.try_ai` - "Ask AI for help" / "Pedir ayuda a la IA"

### CSS Updates

Added fade-in animation for barcode detection overlay.

## User Benefits

1. **No decision paralysis** - User doesn't choose between barcode/camera/AI upfront
2. **Automatic detection** - Barcode scanning happens in background, no mode switching
3. **Flexible capture** - Can take photo anytime if barcode not present
4. **Smart fallbacks** - System guides user to next best option if primary fails
5. **Single tap to start** - Just "Start Exploring" and the app handles the rest

## Technical Details

- Built on existing `useCamera` and `useBarcode` hooks
- ZXing dynamically imported (avoids 400KB bundle bloat)
- Parallel barcode detection doesn't block photo capture
- All API calls use existing `ky` timeout patterns
- Fully typed with TypeScript

## Testing

✅ `npm run typecheck` - passes
✅ `npm run build` - production build successful (~786KB total)

## Next Steps

Test on mobile device:
```bash
vercel dev --listen 3000
```

Then access from phone at `http://[your-ip]:3000`

The unified scanner should:
- Open camera with rear-facing mode
- Continuously scan for barcodes (watch the frame overlay)
- Allow photo capture with the big circular button
- Show fallback options at bottom
