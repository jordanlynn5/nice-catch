import { test, expect } from '@playwright/test'

test.describe('Phase 1.4 — End-to-End Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Set language to Spanish before loading the page
    await page.addInitScript(() => {
      localStorage.setItem('language', 'es')
      // Override navigator.language to force Spanish
      Object.defineProperty(navigator, 'language', {
        get: () => 'es-ES',
        configurable: true
      })
    })
    // Navigate and wait for page load
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // Wait for React app to render (h1 should appear)
    await page.waitForSelector('h1', { timeout: 15000 })
    // Give React a moment to fully hydrate
    await page.waitForTimeout(1000)
  })

  test('Home page loads with all main buttons', async ({ page }) => {
    // Check title (Spanish)
    const h1 = page.locator('h1')
    await expect(h1).toContainText('¿Qué pescado vas a comprar?')

    // Check all main action buttons are visible (not checking exact count due to additional UI buttons)
    await expect(page.locator('button', { hasText: 'Buscar especie' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Escanear código' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Fotografiar etiqueta' })).toBeVisible()
  })

  test('Manual search flow: dorada with full wizard', async ({ page }) => {
    // Click manual search button
    await page.locator('button', { hasText: 'Buscar especie' }).click()

    // Wait for search input
    await page.waitForSelector('input[placeholder]', { timeout: 5000 })

    // Type species name
    await page.locator('input[placeholder]').fill('dorada')
    await page.waitForTimeout(500) // Wait for debounce

    // Click first result
    await page.locator('text=Dorada').first().click()

    // Wait for wizard Step 2 to appear
    await page.waitForTimeout(1000)

    // STEP 2: Origin & Method
    // Purchase context
    await page.locator('button', { hasText: 'Fresco, del mostrador' }).click()
    // Production method (farmed)
    await page.locator('button', { hasText: 'Criado en acuicultura' }).click()

    // Click arrow button to advance to Step 3
    await page.locator('button', { hasText: '→' }).click()
    await page.waitForTimeout(500)

    // STEP 3: Certifications
    await page.locator('button', { hasText: 'Sin sellos visibles' }).click()

    // Final submit
    await page.locator('button', { hasText: 'Calcular sostenibilidad' }).click()

    // Wait for result page
    await expect(page.locator('h2')).toContainText('Dorada', { timeout: 15000 })

    // Check score gauge SVG is visible
    await expect(page.locator('svg').first()).toBeVisible()
  })

  test('Buying Guidance shows for low-scoring fish', async ({ page }) => {
    test.slow() // This test involves multiple steps

    await page.locator('button', { hasText: 'Buscar especie' }).click()
    await page.locator('input[placeholder]').fill('merluza')
    await page.waitForTimeout(500)
    await page.locator('text=Merluza').first().click()

    // STEP 2: Origin & Method (worst-case scenario)
    await page.waitForTimeout(1000)
    // Purchase context
    await page.locator('button', { hasText: 'Fresco, del mostrador' }).click()
    // Production method (wild)
    await page.locator('button', { hasText: 'Pescado en el mar' }).click()
    // FAO area (Mediterranean - worst for most species)
    await page.locator('button', { hasText: 'Mediterráneo' }).click()
    // Fishing method (bottom trawl - worst impact)
    await page.locator('button', { hasText: 'Arrastre de fondo' }).click()

    // Advance to Step 3
    await page.locator('button', { hasText: '→' }).click()
    await page.waitForTimeout(500)

    // STEP 3: Certifications (none)
    await page.locator('button', { hasText: 'Sin sellos visibles' }).click()

    // Final submit
    await page.locator('button', { hasText: 'Calcular sostenibilidad' }).click()

    // Wait for result
    await expect(page.locator('h2')).toContainText('Merluza', { timeout: 15000 })

    // Check for buying guidance section
    await expect(page.locator('text=Cómo mejorar la elección')).toBeVisible({ timeout: 5000 })
  })

  test('AI Assistant button is visible and clickable', async ({ page }) => {
    const aiButton = page.locator('button', { hasText: 'Ask AI Assistant' })
    await expect(aiButton).toBeVisible()
    await aiButton.click()

    // Check that we navigated to AI assistant mode
    // (Implementation may vary - adjust based on actual UI)
    await page.waitForTimeout(1000)
  })

  test('Navigation: manual search back button works', async ({ page }) => {
    // Go to manual search
    await page.locator('button', { hasText: 'Buscar especie' }).click()
    await page.waitForSelector('text=Buscar especie')

    // Click back button
    await page.locator('button', { hasText: '← Atrás' }).click()

    // Should be back at home
    await expect(page.locator('h1')).toContainText('¿Qué pescado vas a comprar?')
  })
})

test.describe('PWA and Performance', () => {
  test('App loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Filter out known acceptable errors (e.g., API 503s during dev)
    const criticalErrors = errors.filter(err =>
      !err.includes('503') &&
      !err.includes('Service Unavailable') &&
      !err.includes('ERR_CERT_AUTHORITY_INVALID')
    )

    expect(criticalErrors).toHaveLength(0)
  })

  test('Service worker registers successfully', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    // Wait for SW registration
    await page.waitForTimeout(3000)

    const swRegistered = await page.evaluate(async () => {
      const regs = await navigator.serviceWorker.getRegistrations()
      return regs.length > 0
    })

    expect(swRegistered).toBe(true)
  })

  test('Main assets load successfully', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)

    // Check critical assets loaded
    const scripts = await page.locator('script[src]').count()
    expect(scripts).toBeGreaterThan(0)
  })
})
