// One-command release script
// Usage:  node scripts/release.mjs patch   → 0.4.1 → 0.4.2
//         node scripts/release.mjs minor   → 0.4.x → 0.5.0
//         node scripts/release.mjs major   → 0.x.x → 1.0.0
//
// Requires GITHUB_TOKEN in .env (see .env.example)

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { execSync }                                from 'child_process'
import { resolve, dirname, join }                 from 'path'
import { fileURLToPath }                          from 'url'

const ROOT  = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OWNER = 'PhDMax'
const REPO  = 'phdflow'

// ── Helpers ───────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts }).trim()
}

function loadToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim()
  const envPath = resolve(ROOT, '.env')
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
      const m = line.match(/^GITHUB_TOKEN\s*=\s*(.+)/)
      if (m) return m[1].trim()
    }
  }
  throw new Error('No GITHUB_TOKEN found.\nCreate a .env file with:\n  GITHUB_TOKEN=ghp_...')
}

function bumpVersion(v, type) {
  const [maj, min, pat] = v.split('.').map(Number)
  if (type === 'major') return `${maj + 1}.0.0`
  if (type === 'minor') return `${maj}.${min + 1}.0`
  return `${maj}.${min}.${pat + 1}`
}

function ghHeaders(token) {
  return { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
}

async function ghPost(path, body, token) {
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`, {
    method: 'POST', headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`GitHub API ${path} → ${r.status}: ${text}`)
  return JSON.parse(text)
}

async function uploadAsset(uploadUrl, filePath, token) {
  const name = filePath.split(/[\\/]/).pop()
  const data = readFileSync(filePath)
  const url  = uploadUrl.replace('{?name,label}', `?name=${encodeURIComponent(name)}`)
  console.log(`  ⬆  Uploading ${name} (${(data.length / 1024 / 1024).toFixed(1)} MB)…`)
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: data,
    // Node 18 fetch: no built-in timeout, but uploads are local→GitHub so should be fast
  })
  if (!r.ok) throw new Error(`Upload ${name} failed: ${r.status} ${await r.text()}`)
  console.log(`  ✓  ${name} uploaded`)
}

function gitLogSinceLastTag() {
  try {
    const lastTag = run('git describe --tags --abbrev=0', { silent: true })
    const log = run(`git log ${lastTag}..HEAD --pretty=format:"- %s" --no-merges`, { silent: true })
    return log || '- Minor improvements and bug fixes'
  } catch {
    return '- Initial release'
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

;(async () => {
  const bumpType = process.argv[2] || 'patch'
  if (!['patch', 'minor', 'major'].includes(bumpType)) {
    console.error('Usage: node scripts/release.mjs [patch|minor|major]'); process.exit(1)
  }

  // 1. Load token early so we fail fast if missing
  const token = loadToken()
  console.log('✓ GitHub token loaded')

  // 2. Check working tree (untracked files are fine, only block on modified/staged)
  const dirty = run('git status --porcelain', { silent: true })
    .split('\n').filter(l => l && !l.startsWith('??')).join('\n')
  if (dirty) { console.error('✗ Working tree has uncommitted changes. Commit or stash first.\n' + dirty); process.exit(1) }

  // 3. Collect changelog before bumping
  const changelog = gitLogSinceLastTag()

  // 4. Bump version
  const pkg        = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
  const oldVersion = pkg.version
  const newVersion = bumpVersion(oldVersion, bumpType)
  console.log(`\n📦  ${oldVersion}  →  ${newVersion}  (${bumpType})`)

  pkg.version = newVersion
  writeFileSync(join(ROOT, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf-8')

  // Update sidebar version string
  const htmlPath = join(ROOT, 'src', 'index.html')
  const html = readFileSync(htmlPath, 'utf-8')
  const newHtml = html.replace(
    /v\d+\.\d+(?:\.\d+)? · open source/,
    `v${newVersion} · open source`
  )
  writeFileSync(htmlPath, newHtml, 'utf-8')

  // 5. Commit version bump
  console.log('\n📝  Committing version bump…')
  run('git add package.json package-lock.json src/index.html')
  run(`git commit -m "chore: bump to v${newVersion}"`)

  // 6. Build
  console.log('\n🔨  Building…')
  run('npm run build')

  // 7. Push
  console.log('\n🚀  Pushing to GitHub…')
  run('git push origin master')

  // 8. Create release
  console.log('\n📋  Creating GitHub release…')
  const releaseBody = `## PhDFlow v${newVersion}\n\n### Changes\n${changelog}\n\n---\n☕ [Buy me a coffee](https://buymeacoffee.com/phdmax)`
  const release = await ghPost('/releases', {
    tag_name:         `v${newVersion}`,
    target_commitish: 'master',
    name:             `PhDFlow v${newVersion}`,
    body:             releaseBody,
    draft:            false,
    prerelease:       false,
  }, token)
  console.log(`  ✓  Release created: ${release.html_url}`)

  // 9. Upload assets
  console.log('\n📤  Uploading assets…')
  const assets = [
    join(ROOT, 'dist', `PhDFlow Setup ${newVersion}.exe`),
    join(ROOT, 'dist', `PhDFlow-Portable-${newVersion}.exe`),
    join(ROOT, 'dist', 'latest.yml'),
  ]
  for (const asset of assets) {
    if (!existsSync(asset)) { console.warn(`  ⚠  Not found, skipping: ${asset}`); continue }
    await uploadAsset(release.upload_url, asset, token)
  }

  console.log(`\n✅  PhDFlow v${newVersion} published!\n   ${release.html_url}\n`)
})().catch(e => { console.error('\n✗', e.message); process.exit(1) })
