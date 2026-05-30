// Publish-only script — run AFTER build when version is already bumped.
// Usage:  $env:GITHUB_TOKEN="ghp_xxx"; node scripts/publish.mjs
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname, join }   from 'path'
import { fileURLToPath }            from 'url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const token = process.env.GITHUB_TOKEN?.trim()
if (!token || token.length < 10) {
  console.error('GITHUB_TOKEN is missing or truncated.\nExample: $env:GITHUB_TOKEN="ghp_xxx"; node scripts/publish.mjs')
  process.exit(1)
}

const pkg     = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
const version = pkg.version
console.log(`Publishing PhDFlow v${version}…`)

const headers = {
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}

// Collect changelog since last tag
let changelog = '- Minor improvements and bug fixes'
try {
  const { execSync } = await import('child_process')
  const lastTag = execSync('git describe --tags --abbrev=0', { cwd: ROOT, encoding: 'utf-8' }).trim()
  const log = execSync(`git log ${lastTag}..HEAD --pretty=format:"- %s"`, { cwd: ROOT, encoding: 'utf-8' }).trim()
  if (log) changelog = log
} catch { /* no prior tag */ }

const releaseBody = `## PhDFlow v${version}

Your all-in-one research workspace. Open source, local-first, free to use.

### Changes
${changelog}

### Installation
1. Download **PhDFlow Setup ${version}.exe** and run it
2. No API keys, no account required

> Windows SmartScreen may warn on first run — click **More info → Run anyway**

### Portable version
**PhDFlow-Portable-${version}.exe** — runs without installing, useful for USB drives.

---
☕ If PhDFlow saves you time, [buy me a coffee](https://buymeacoffee.com/phdmax)`

// Try to find an existing release for this tag first
let release
console.log(`Checking for existing release v${version}…`)
const existingRes = await fetch(`https://api.github.com/repos/PhDMax/phdflow/releases/tags/v${version}`, { headers })
if (existingRes.ok) {
  release = await existingRes.json()
  console.log(`  ✓  Found existing release: ${release.html_url}`)
} else {
  console.log('Creating GitHub release…')
  const res = await fetch(`https://api.github.com/repos/PhDMax/phdflow/releases`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_name: `v${version}`, target_commitish: 'master', name: `PhDFlow v${version}`, body: releaseBody, draft: false, prerelease: false }),
  })
  release = await res.json()
  if (!release.upload_url) { console.error('Failed to create release:', JSON.stringify(release, null, 2)); process.exit(1) }
  console.log(`  ✓  Release created: ${release.html_url}`)
}

const assets = [
  join(ROOT, 'dist', `PhDFlow-Setup-${version}.exe`),
  join(ROOT, 'dist', `PhDFlow-Portable-${version}.exe`),
  join(ROOT, 'dist', 'latest.yml'),
]

for (const asset of assets) {
  if (!existsSync(asset)) { console.warn(`  ⚠  Skipping (not found): ${asset}`); continue }
  const name = asset.split(/[\\/]/).pop()
  const data = readFileSync(asset)
  console.log(`  ⬆  Uploading ${name} (${(data.length / 1024 / 1024).toFixed(1)} MB)…`)
  const up = await fetch(release.upload_url.replace('{?name,label}', `?name=${encodeURIComponent(name)}`), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: data,
  })
  if (!up.ok) { console.error(`  ✗  Upload failed: ${await up.text()}`); process.exit(1) }
  console.log(`  ✓  ${name} uploaded`)
}

console.log(`\n✅  PhDFlow v${version} published!\n   ${release.html_url}`)
