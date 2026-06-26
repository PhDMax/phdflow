const { test, expect } = require('@playwright/test')
const { launchApp, login, closeApp, TEST_NAME } = require('./helpers/launch')

// Run all tests in this file serially — they share one app instance
test.describe.configure({ mode: 'serial' })

test.describe('smoke', () => {
  let electronApp, page

  test.beforeAll(async () => {
    electronApp = await launchApp({ withAuth: true })
    page = await electronApp.firstWindow()
    await page.waitForLoadState('domcontentloaded')
  })

  test.afterAll(async () => {
    await closeApp(electronApp)
  })

  test('app launches and shows login screen', async () => {
    await expect(page.locator('#login-overlay')).toBeVisible()
    await expect(page.locator('h1')).toContainText('PhDFlow')
  })

  test('can log in with test password', async () => {
    await login(page)
    await expect(page.locator('#app-sidebar')).toBeVisible()
    await expect(page.locator('#sidebar-nav')).toBeVisible()
  })

  test('profile name is set after login', async () => {
    await expect(page.locator('#profile-name')).toContainText(TEST_NAME)
  })

  test('can navigate to dashboard', async () => {
    await page.click('#nav-dashboard')
    await page.waitForTimeout(300)
    await expect(page.locator('#view-content')).toBeVisible()
  })

  test('can navigate to projects', async () => {
    await page.click('#nav-projects')
    await page.waitForTimeout(300)
    await expect(page.locator('#view-content')).toBeVisible()
  })

  test('can navigate to library', async () => {
    await page.click('#nav-library')
    await page.waitForTimeout(300)
    await expect(page.locator('#view-content')).toBeVisible()
  })

  test('can navigate to todos', async () => {
    await page.click('#nav-todos')
    await page.waitForTimeout(300)
    await expect(page.locator('#view-content')).toBeVisible()
  })

  test('can navigate to notes', async () => {
    await page.click('#nav-notes')
    await page.waitForTimeout(300)
    await expect(page.locator('#view-content')).toBeVisible()
  })

  test('global search opens and closes', async () => {
    await page.keyboard.press('Control+k')
    await expect(page.locator('#gsearch-overlay')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('#gsearch-overlay')).toBeHidden()
  })
})
