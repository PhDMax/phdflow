// Recovery / publish-only script — uploads all release assets for the current version.
// Reads GITHUB_TOKEN from .env automatically — no manual env setup required.
// Safe to re-run: assets already present on the release are skipped.
//
// Usage:  node scripts/publish.mjs
import { readFileSync, existsSync } from 'fs'
import { execSync }                 from 'child_process'
import { resolve, dirname, join }   from 'path'
import { fileURLToPath }            from 'url'

const ROOT  = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OWNER = 'PhDMax'
const REPO  = 'phdflow'

// ── Token loader (same logic as release.mjs) ──────────────────────────────────
function loadToken() {
  if (process.env.GITHUB_TOKEN) {
    const t = process.env.GITHUB_TOKEN.trim()
    if (t.length < 10) throw new Error('GITHUB_TOKEN env var looks truncated. Check your token.')
    return t
  }
  const envPath = resolve(ROOT, '.env')
  if (existsSync(envPath)) {
    let raw = readFileSync(envPath)
    let text
    if (raw[0] === 0xFF && raw[1] === 0xFE) text = raw.slice(2).toString('utf16le')
    else if (raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF) text = raw.slice(3).toString('utf8')
    else text = raw.toString('utf8')
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^GITHUB_TOKEN\s*=\s*(.+)/)
      if (m) {
        const t = m[1].trim()
        if (t.length < 10) throw new Error(`.env GITHUB_TOKEN looks truncated ("${t}"). Paste the full token.`)
        return t
      }
    }
  }
  throw new Error('No GITHUB_TOKEN found.\nCreate a .env file with:\n  GITHUB_TOKEN=ghp_...')
}

// ── Main ──────────────────────────────────────────────────────────────────────
;(async () => {
  const token   = loadToken()
  console.log('✓ GitHub token loaded')

  const pkg     = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
  const version = pkg.version
  console.log(`\nPublishing / repairing PhDFlow v${version}…`)

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  // Collect changelog (fetch tags first so local repo is up to date)
  let changelog = '- Minor improvements and bug fixes'
  try {
    execSync('git fetch --tags', { cwd: ROOT, stdio: 'pipe' })
    const log = execSync(`git log v${version}..HEAD --pretty=format:"- %s" --no-merges`, { cwd: ROOT, encoding: 'utf-8' }).trim()
    if (log) changelog = log
  } catch { /* no prior tag or empty log */ }

  const releaseBody = `## PhDFlow v${version}

Your all-in-one research workspace. Open source, local-first, free to use.

### Changes
${changelog}

### Installation
1. Download **PhDFlow Setup ${version}.exe** and run it
2. Create your account on first launch — everything stays on your device

> Windows SmartScreen may warn on first run — click **More info → Run anyway**

### Portable version
**PhDFlow-Portable-${version}.exe** — runs without installing, useful for USB drives.

---
☕ If PhDFlow saves you time, [buy me a coffee](https://buymeacoffee.com/phdmax)`

  // Find or create release
  let release
  console.log(`\nChecking for existing release v${version}…`)
  const existingRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/v${version}`, { headers })
  if (existingRes.ok) {
    release = await existingRes.json()
    console.log(`  ✓  Found existing release: ${release.html_url}`)
  } else {
    console.log('  Creating GitHub release…')
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_name: `v${version}`, target_commitish: 'master', name: `PhDFlow v${version}`, body: releaseBody, draft: false, prerelease: false }),
    })
    const text = await res.text()
    if (!res.ok) { console.error(`  ✗  Failed to create release: ${res.status} ${text}`); process.exit(1) }
    release = JSON.parse(text)
    console.log(`  ✓  Release created: ${release.html_url}`)
  }

  // Build the full asset list (all 6 expected files)
  const expectedAssets = [
    join(ROOT, 'dist', `PhDFlow-Setup-${version}.exe`),
    join(ROOT, 'dist', `PhDFlow-Portable-${version}.exe`),
    join(ROOT, 'dist', 'latest.yml'),
    join(ROOT, 'dist', `PhDFlow-Source-${version}.zip`),
    join(ROOT, 'dist', `PhDFlow-Source-${version}.tar.gz`),
    join(ROOT, 'README.md'),
  ]

  // Build set of asset names already on the release — skip these to avoid 422 duplicates
  const alreadyUploaded = new Set((release.assets || []).map(a => a.name))
  if (alreadyUploaded.size > 0) {
    console.log(`\n  Already uploaded: ${[...alreadyUploaded].join(', ')}`)
  }

  console.log('\n📤  Uploading missing assets…')
  let uploaded = 0
  let skipped  = 0
  let missing  = 0

  for (const assetPath of expectedAssets) {
    const name = assetPath.split(/[\\/]/).pop()

    if (alreadyUploaded.has(name)) {
      console.log(`  ⏭  ${name} — already on release, skipping`)
      skipped++
      continue
    }
    if (!existsSync(assetPath)) {
      console.warn(`  ⚠  ${name} — file not found locally: ${assetPath}`)
      missing++
      continue
    }

    const data = readFileSync(assetPath)
    const mime = name.endsWith('.yml') ? 'text/yaml'
      : name.endsWith('.md')  ? 'text/markdown'
      : name.endsWith('.zip') ? 'application/zip'
      : name.endsWith('.gz')  ? 'application/gzip'
      : 'application/octet-stream'

    console.log(`  ⬆  Uploading ${name} (${(data.length / 1024 / 1024).toFixed(1)} MB)…`)
    const up = await fetch(release.upload_url.replace('{?name,label}', `?name=${encodeURIComponent(name)}`), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': mime },
      body: data,
    })
    if (!up.ok) { console.error(`  ✗  Upload failed: ${up.status} ${await up.text()}`); process.exit(1) }
    console.log(`  ✓  ${name} uploaded`)
    uploaded++
  }

  console.log(`\n✅  PhDFlow v${version} release complete!`)
  console.log(`   ${release.html_url}`)
  if (uploaded)  console.log(`   ${uploaded} asset(s) uploaded`)
  if (skipped)   console.log(`   ${skipped} asset(s) already present — skipped`)
  if (missing)   console.log(`   ⚠  ${missing} asset(s) not found locally — build first with: npm run build`)
})().catch(e => { console.error('\n✗', e.message); process.exit(1) })
