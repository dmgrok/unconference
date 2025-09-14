import { test, expect } from '@playwright/test'

test.describe('Topic Voting System', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state and navigate to an active event
    await page.goto('/events/test-event')
  })

  test('should allow submitting a new topic', async ({ page }) => {
    // Click add topic button
    await page.click('text=Add Topic')

    // Fill out topic form
    await page.fill('input[name="title"]', 'Test Discussion Topic')
    await page.fill('textarea[name="description"]', 'This is a test topic for E2E testing')

    // Submit topic
    await page.click('button[type="submit"]')

    // Should see the new topic in the list
    await expect(page.locator('text=Test Discussion Topic')).toBeVisible()
  })

  test('should allow voting on topics', async ({ page }) => {
    // Find a topic and click vote
    const topicCard = page.locator('.topic-card').first()
    await topicCard.locator('button:has-text("Vote")').click()

    // Should show vote confirmation or update vote count
    await expect(topicCard.locator('.vote-count')).toContainText('1')
  })

  test('should respect voting limits', async ({ page }) => {
    // Cast maximum votes (default is 12)
    for (let i = 0; i < 12; i++) {
      const topicCard = page.locator('.topic-card').nth(i)
      await topicCard.locator('button:has-text("Vote")').click()
    }

    // Try to vote on one more topic
    const nextTopic = page.locator('.topic-card').nth(12)
    await nextTopic.locator('button:has-text("Vote")').click()

    // Should show vote limit message
    await expect(page.locator('text=vote limit reached')).toBeVisible()
  })

  test('should allow removing votes', async ({ page }) => {
    // Vote on a topic first
    const topicCard = page.locator('.topic-card').first()
    await topicCard.locator('button:has-text("Vote")').click()

    // Remove the vote
    await topicCard.locator('button:has-text("Remove Vote")').click()

    // Vote count should decrease
    await expect(topicCard.locator('.vote-count')).toContainText('0')
  })

  test('should display topic voting statistics', async ({ page }) => {
    // Navigate to admin view
    await page.goto('/events/test-event/admin')

    // Should show voting statistics
    await expect(page.locator('text=Voting Statistics')).toBeVisible()
    await expect(page.locator('.voting-chart')).toBeVisible()
  })

  test('should allow admin to freeze topic selection', async ({ page }) => {
    await page.goto('/events/test-event/admin')

    // Select topics for discussion
    await page.click('text=Select Topics for Round')

    // Choose some topics
    const topicCheckboxes = page.locator('input[type="checkbox"]')
    await topicCheckboxes.nth(0).check()
    await topicCheckboxes.nth(1).check()
    await topicCheckboxes.nth(2).check()

    // Start round
    await page.click('text=Start Round')

    // Should show confirmation
    await expect(page.locator('text=Round Started')).toBeVisible()
  })

  test('should show topic details modal', async ({ page }) => {
    // Click on topic title to open details
    await page.locator('.topic-card h3').first().click()

    // Should open modal with full topic details
    await expect(page.locator('.topic-details-modal')).toBeVisible()
    await expect(page.locator('text=Topic Details')).toBeVisible()
  })

  test('should validate topic submission form', async ({ page }) => {
    await page.click('text=Add Topic')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Should show validation errors
    await expect(page.locator('text=Topic title is required')).toBeVisible()
  })

  test('should display topic submission count per user', async ({ page }) => {
    await page.goto('/events/test-event/admin')

    // Should show user contribution statistics
    await expect(page.locator('text=Topic Contributions')).toBeVisible()
  })
})