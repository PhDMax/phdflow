const { _electron: electron } = require('@playwright/test')
const path = require('path')
const fs = require('fs')
const os = require('os')
const crypto = require('crypto')

const PROJECT_ROOT = path.join(__dirname, '../..')
const TEST_PASSWORD = 'testpassword123'
// Fixed salt so we can pre-compute the hash deterministically
const TEST_SALT = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
const TEST_NAME = 'Test User'

function makeAuthJson() {
  const hash = crypto
    .scryptSync(TEST_PASSWORD, Buffer.from(TEST_SALT, 'hex'), 32, { N: 16384, r: 8, p: 1 })
    .toString('hex')
  return {
    version: 1,
    initialized: true,
    name: TEST_NAME,
    passwordHash: hash,
    passwordSalt: TEST_SALT,
    createdAt: new Date().toISOString(),
  }
}

function makeStoreJson() {
  return {
    profile: { name: TEST_NAME, field: 'Computer Science', avatar: 'T' },
    theme: 'light',
  }
}

/**
 * Launch the Electron app against a fresh temp userData dir.
 * withAuth=true  → pre-seeds auth.json + app-data.json so the login form and app work immediately.
 * withAuth=false → completely fresh state (setup form will appear).
 */
async function launchApp({ withAuth = true } = {}) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phdflow-test-'))

  if (withAuth) {
    fs.writeFileSync(path.join(userDataDir, 'auth.json'), JSON.stringify(makeAuthJson()))
    const dataDir = path.join(userDataDir, 'data')
    fs.mkdirSync(dataDir, { recursive: true })
    fs.writeFileSync(path.join(dataDir, 'app-data.json'), JSON.stringify(makeStoreJson(), null, 2))
  }

  const electronApp = await electron.launch({
    args: [PROJECT_ROOT],
    env: { ...process.env, PHDFLOW_USER_DATA_DIR: userDataDir, NODE_ENV: 'test' },
  })

  electronApp._testUserDataDir = userDataDir

  return electronApp
}

/** Fill the password field and press Enter, then wait for the overlay to hide. */
async function login(page) {
  await page.waitForSelector('#ln-pw', { timeout: 10_000 })
  await page.fill('#ln-pw', TEST_PASSWORD)
  await page.keyboard.press('Enter')
  await page.waitForFunction(
    () => document.getElementById('login-overlay')?.style.display === 'none',
    { timeout: 10_000 }
  )
}

/** Close the app and remove its temp userData dir. */
async function closeApp(electronApp) {
  await electronApp.close()
  try { fs.rmSync(electronApp._testUserDataDir, { recursive: true, force: true }) } catch {}
}

module.exports = { launchApp, login, closeApp, TEST_PASSWORD, TEST_NAME }
