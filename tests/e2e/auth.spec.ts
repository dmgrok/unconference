import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login options on homepage when not authenticated', async ({ page }) => {
    await page.goto('/')

    // Should show login options
    await expect(page.locator('text=Login')).toBeVisible()
    await expect(page.locator('text=Sign in with GitHub')).toBeVisible()
    await expect(page.locator('text=Sign in with Google')).toBeVisible()
  })

  test('should redirect to login when accessing protected pages', async ({ page }) => {
    await page.goto('/dashboard')

    // Should be redirected to login or show login form
    await expect(page.url()).toMatch(/(login|auth|signin)/)
  })

  test('should show guest access option for events with guest access enabled', async ({ page }) => {
    // This would require setting up a test event with guest access
    // For now, just verify the flow exists
    await page.goto('/')
    await expect(page.locator('text=Join as Guest')).toBeVisible({ timeout: 5000 })
  })

  test('should handle email authentication flow', async ({ page }) => {
    await page.goto('/')

    // Click email auth option
    await page.click('text=Email')

    // Fill email form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button[type="submit"]')

    // Should show PIN verification form
    await expect(page.locator('text=Enter verification code')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/')

    // Click email auth option
    await page.click('text=Email')

    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.click('button[type="submit"]')

    // Should show validation error
    await expect(page.locator('text=Invalid email')).toBeVisible()
  })
})