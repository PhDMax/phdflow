// One-command release script
// Usage:  node scripts/release.mjs [patch|minor|major]
//
// Steps:
//  1. Bump version in package.json + src/index.html
//  2. Regenerate README.md
//  3. Commit "chore: bump to vX.X.X"
//  4. Build (npm run build)
//  5. Create source archives (zip + tar.gz via git archive)
//  6. Push to GitHub
//  7. Create GitHub release with auto-generated notes
//  8. Upload: Setup.exe · Portable.exe · latest.yml · source.zip · source.tar.gz · README.md
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
  const out = execSync(cmd, { cwd: ROOT, encoding: 'utf-8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts })
  return out ? out.trim() : ''
}

function loadToken() {
  if (process.env.GITHUB_TOKEN) {
    const t = process.env.GITHUB_TOKEN.trim()
    if (t.length < 10) throw new Error('GITHUB_TOKEN env var looks truncated (too short). Check your token.')
    return t
  }
  const envPath = resolve(ROOT, '.env')
  if (existsSync(envPath)) {
    // Strip BOM (UTF-16 LE or UTF-8) that Notepad adds on Windows
    let raw = readFileSync(envPath)
    let text
    if (raw[0] === 0xFF && raw[1] === 0xFE) text = raw.slice(2).toString('utf16le')
    else if (raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF) text = raw.slice(3).toString('utf8')
    else text = raw.toString('utf8')
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^GITHUB_TOKEN\s*=\s*(.+)/)
      if (m) {
        const t = m[1].trim()
        if (t.length < 10) throw new Error(`.env GITHUB_TOKEN looks truncated ("${t}"). Paste the full ghp_... token.`)
        return t
      }
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
  const mime = name.endsWith('.yml') ? 'text/yaml'
    : name.endsWith('.md') ? 'text/markdown'
    : name.endsWith('.zip') ? 'application/zip'
    : name.endsWith('.gz') ? 'application/gzip'
    : 'application/octet-stream'
  console.log(`  ⬆  Uploading ${name} (${(data.length / 1024 / 1024).toFixed(1)} MB)…`)
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': mime },
    body: data,
  })
  if (!r.ok) throw new Error(`Upload ${name} failed: ${r.status} ${await r.text()}`)
  console.log(`  ✓  ${name} uploaded`)
}

function gitLogSinceLastTag(oldVersion) {
  // GitHub releases create tags remotely; fetch them so the local repo
  // knows about the previous release's tag too.
  try { run('git fetch --tags', { silent: true }) } catch {}
  try {
    const log = run(`git log v${oldVersion}..HEAD --pretty=format:"- %s" --no-merges`, { silent: true })
    return log || '- Minor improvements and bug fixes'
  } catch {
    return '- Initial release'
  }
}

// ── README generator ──────────────────────────────────────────────────────────

function generateReadme(version, changelog) {
  // Parse ALL_TOOLS from renderer.js
  const rendererSrc = readFileSync(join(ROOT, 'src', 'renderer.js'), 'utf-8')
  const toolsMatch  = rendererSrc.match(/const ALL_TOOLS\s*=\s*\[([\s\S]*?)\]/)
  let featuresMd = ''

  if (toolsMatch) {
    const toolEntries = []
    const rx = /\{\s*id:'[^']+',\s*label:'([^']+)',\s*icon:'([^']+)',\s*section:'([^']+)',\s*desc:'([^']+)'/g
    let m
    while ((m = rx.exec(toolsMatch[1])) !== null) {
      toolEntries.push({ label: m[1], icon: m[2], section: m[3], desc: m[4] })
    }

    // Group by section
    const sections = {}
    for (const t of toolEntries) {
      if (!sections[t.section]) sections[t.section] = []
      sections[t.section].push(t)
    }

    for (const [section, tools] of Object.entries(sections)) {
      featuresMd += `### ${section}\n`
      for (const t of tools) {
        featuresMd += `- ${t.icon} **${t.label}** — ${t.desc}\n`
      }
      featuresMd += '\n'
    }
  }

  return `# ⚗️ PhDFlow

**Your all-in-one research workspace — open source, local-first, free to use.**

All data stays on your device. No account required. No API keys needed.

---

## ✨ Features

${featuresMd.trim()}

---

## 📥 Installation

1. Download **PhDFlow Setup ${version}.exe** from the [latest release](../../releases/latest) and run it
2. Create your account on first launch — everything stays on your device

> Windows SmartScreen may warn on first run — click **More info → Run anyway**

### Portable version
**PhDFlow-Portable-${version}.exe** — runs without installing, useful for USB drives or restricted machines.

---

## 🛠️ Build from Source

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [Git](https://git-scm.com/)

### Steps

\`\`\`bash
git clone https://github.com/PhDMax/phdflow.git
cd phdflow
npm install
npm run build:css      # Compile Tailwind CSS
npm start              # Run in development
\`\`\`

### Build Windows installer
\`\`\`bash
npm run build          # Produces dist/PhDFlow-Setup-x.x.x.exe
\`\`\`

---

## 📋 Changelog

### v${version}
${changelog}

---

## 💬 Feedback

Use the **Feedback** tab inside the app to send bug reports and feature ideas. Or [open an issue](https://github.com/${OWNER}/${REPO}/issues) on GitHub.

---

## 📄 License

MIT © PhDFlow
Free to use, modify, and distribute. No warranty expressed or implied.

---

## 🔒 Privacy

PhDFlow has **no servers, no telemetry, no accounts**.
Your data is stored locally in \`%APPDATA%\\phdflow\\\`.
The only outbound connections are:
- arXiv, OpenAlex, Semantic Scholar, CrossRef — paper/author search (open APIs)
- SMTP server — only for Vault OTP emails (configured by you)
- GitHub API — only for the update version check (no auth, no data sent)
`
}

// ── Main ──────────────────────────────────────────────────────────────────────

;(async () => {
  const bumpType = process.argv[2] || 'patch'
  if (!['patch', 'minor', 'major'].includes(bumpType)) {
    console.error('Usage: node scripts/release.mjs [patch|minor|major]'); process.exit(1)
  }

  // 1. Load token early and validate it against the GitHub API before doing any work
  const token = loadToken()
  console.log('✓ GitHub token loaded')
  const authCheck = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}`, {
    headers: ghHeaders(token),
  })
  if (!authCheck.ok) {
    const body = await authCheck.text()
    console.error(`✗ GitHub token validation failed (${authCheck.status}): ${body}`)
    console.error('  Update your GITHUB_TOKEN in .env and try again.')
    process.exit(1)
  }
  console.log('✓ GitHub token validated')

  // 2. Check working tree (untracked files are fine, only block on modified/staged)
  const dirty = run('git status --porcelain', { silent: true })
    .split('\n').filter(l => l && !l.startsWith('??')).join('\n')
  if (dirty) { console.error('✗ Working tree has uncommitted changes. Run `node scripts/push.mjs` first.\n' + dirty); process.exit(1) }

  // 3. Read current version
  const pkg        = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
  const oldVersion = pkg.version
  const newVersion = bumpVersion(oldVersion, bumpType)
  console.log(`\n📦  ${oldVersion}  →  ${newVersion}  (${bumpType})`)

  // 4. Collect changelog since the last release tag
  const changelog = gitLogSinceLastTag(oldVersion)

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

  // 5. Regenerate README
  console.log('\n📄  Regenerating README.md…')
  const newReadme = generateReadme(newVersion, changelog)
  writeFileSync(join(ROOT, 'README.md'), newReadme, 'utf-8')
  console.log('  ✓  README.md updated')

  // 6. Commit version bump + README
  console.log('\n📝  Committing version bump…')
  run('git add package.json src/index.html README.md')
  run(`git commit -m "chore: bump to v${newVersion}"`)

  // 7. Build
  console.log('\n🔨  Building…')
  run('npm run build')

  // 8. Create source archives (git archive from HEAD after commit)
  console.log('\n📦  Creating source archives…')
  const zipPath = join(ROOT, 'dist', `PhDFlow-Source-${newVersion}.zip`)
  const tgzPath = join(ROOT, 'dist', `PhDFlow-Source-${newVersion}.tar.gz`)
  run(`git archive --format=zip HEAD -o "${zipPath}"`)
  run(`git archive --format=tar.gz HEAD -o "${tgzPath}"`)
  console.log('  ✓  Source archives created')

  // 9. Push
  console.log('\n🚀  Pushing to GitHub…')
  run('git push origin master')

  // 10. Create release
  console.log('\n📋  Creating GitHub release…')
  const releaseBody = `## PhDFlow v${newVersion}

Your all-in-one research workspace. Open source, local-first, free to use.

### Changes
${changelog}

### Installation
1. Download **PhDFlow Setup ${newVersion}.exe** and run it
2. Create your account on first launch — everything stays on your device

> Windows SmartScreen may warn on first run — click **More info → Run anyway**

### Portable version
**PhDFlow-Portable-${newVersion}.exe** — runs without installing, useful for USB drives or restricted machines.

---
☕ If PhDFlow saves you time, [buy me a coffee](https://buymeacoffee.com/phdmax)`

  const release = await ghPost('/releases', {
    tag_name:         `v${newVersion}`,
    target_commitish: 'master',
    name:             `PhDFlow v${newVersion}`,
    body:             releaseBody,
    draft:            false,
    prerelease:       false,
  }, token)
  console.log(`  ✓  Release created: ${release.html_url}`)

  // 11. Upload all assets
  console.log('\n📤  Uploading assets…')
  const assets = [
    join(ROOT, 'dist', `PhDFlow-Setup-${newVersion}.exe`),
    join(ROOT, 'dist', `PhDFlow-Portable-${newVersion}.exe`),
    join(ROOT, 'dist', 'latest.yml'),
    zipPath,
    tgzPath,
    join(ROOT, 'README.md'),
  ]
  for (const asset of assets) {
    if (!existsSync(asset)) { console.warn(`  ⚠  Not found, skipping: ${asset}`); continue }
    try {
      await uploadAsset(release.upload_url, asset, token)
    } catch (uploadErr) {
      console.error(`\n✗  Asset upload failed: ${uploadErr.message}`)
      console.error('  The release was created and the build is done.')
      console.error('  To upload the remaining assets, run:')
      console.error('    node scripts/publish.mjs')
      console.error('  (reads .env automatically, skips assets already uploaded)')
      process.exit(1)
    }
  }

  console.log(`\n✅  PhDFlow v${newVersion} published!\n   ${release.html_url}\n`)
  console.log('👉  Next: update the wiki, then run:  node scripts/wiki-push.mjs\n')
})().catch(e => { console.error('\n✗', e.message); process.exit(1) })
