# ⚗️ PhDFlow

**Your all-in-one research workspace — open source, local-first, free to use.**

All data stays on your device. No account required. No API keys needed.

---

## ✨ Features

### Workspace
- 🔗 **Pipeline** — See how papers, notes and boards connect per project
- ✍️ **Writing** — Academic writing assistant with grant, journal, and thesis templates
- 📋 **Projects** — Manage research projects and work threads
- 📝 **Notes** — Linked markdown notes and lab logs
- 🎨 **Whiteboard** — Visual brainstorming canvas with smart pen
- 📚 **Paper Library** — Store, annotate and cite your papers
- 📅 **Calendar** — Deadlines, milestones and iCal sync
- ✅ **To-Do List** — Tasks with time estimates and daily focus mode
- 👥 **Contacts** — Your academic network and collaborators

### Tools
- 📄 **PDF Tools** — Merge, split, rotate and process PDF files
- ✏️ **Citations** — Format references and count words
- ⚗️ **Unit Converter** — Convert scientific units with history
- 📊 **R Assistant** — Step-by-step guide to R statistical tests

### Feeds
- 📡 **Literature Feed** — Daily paper feed from arXiv & OpenAlex
- 💰 **Grant Scan** — Discover and track funding opportunities
- 🔍 **Discover** — Find researchers by name or research area

---

## 📥 Installation

1. Download **PhDFlow Setup 0.23.2.exe** from the [latest release](../../releases/latest) and run it
2. Create your account on first launch — everything stays on your device

> Windows SmartScreen may warn on first run — click **More info → Run anyway**

### Portable version
**PhDFlow-Portable-0.23.2.exe** — runs without installing, useful for USB drives or restricted machines.

---

## 🛠️ Build from Source

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [Git](https://git-scm.com/)

### Steps

```bash
git clone https://github.com/PhDMax/phdflow.git
cd phdflow
npm install
npm run build:css      # Compile Tailwind CSS
npm start              # Run in development
```

### Build Windows installer
```bash
npm run build          # Produces dist/PhDFlow-Setup-x.x.x.exe
```

---

## 📋 Changelog

### v0.23.2
- feat: dashboard
- chore: bump to v0.23.1
- feat: calendar
- chore: bump to v0.23.0
- chore: session updates
- chore: session notes
- chore: add push/release/wiki-push automation scripts
- chore: bump to v0.22.0
- feat: Writing Assistant — expert academic writing workspace
- chore: bump to v0.21.0
- feat: Research Pipeline view
- chore: bump to v0.20.0
- feat: in-app PDF reader with annotation support
- chore: bump to v0.19.2
- fix: async render functions break router + dead code cleanup
- chore: bump to v0.19.1
- fix: sidebar drag-and-drop not working
- chore: bump to v0.19.0
- feat: paper view modes + dashboard background images
- chore: bump to v0.18.0
- feat: drag-and-drop reordering for dashboard and sidebar
- chore: bump to v0.17.0
- feat: data-linked charts in whiteboard with Excel/CSV/PDF import
- chore: bump to v0.16.0
- feat: DuckDuckGo web search in Researcher Finder
- chore: bump to v0.15.1
- fix: rename template shape factories to avoid collision with notes.js _S
- chore: bump to v0.15.0
- feat: persistent tool workspaces, folder access, sidebar split
- chore: bump to v0.14.0
- feat: whiteboard templates, responsive design, sidebar redesign
- feat(whiteboard): rubber cursor, middle-mouse pan, numerical stroke/font sizes
- chore: bump to v0.13.5
- feat: QoL batch 4 — event times, PDF open, notes sort/trash, Ctrl+A, project progress
- chore: bump to v0.13.4
- fix: remove 'No API keys required' from installation steps — not an install step
- chore: bump to v0.13.3
- feat: QoL batch 3 — bulk task actions, calendar mini quick-add
- feat: QoL batch 2 — projects search, PhD progress bar, topic pills, calendar quick-add, event legend
- chore: bump to v0.13.2
- feat: QoL batch — BibTeX copy, clear filters, quick-save, defer, shortcuts modal
- fix: replace ⊕ FAB icon with labeled '+ Quick add' pill button
- fix: onboarding name pre-fill, 'Researcher' fallback, search focus-steal
- chore: bump to v0.13.1
- fix: dashboard AI banner dark mode — use ID-targeted CSS instead of gradient classes
- chore: bump to v0.13.0
- feat: in-app AI onboarding — dashboard prompt + improved setup UX
- feat: bundle Odysseus source inside PhDFlow — fully integrated AI engine
- feat: Odysseus auto-managed AI Engine — zero-config local AI
- chore: bump to v0.12.0
- feat(discover): Akinator learns from past sessions + multi-source candidates
- feat(discover): ORCID enrichment, DBLP+PubMed sources, profile cache
- feat(discover): Researcher Akinator — single consolidated finder
- fix(discover): institution filter + active researcher filter
- chore: bump to v0.11.0
- feat(ai): Odysseus-powered paper relevance scoring + natural language researcher search
- feat: Odysseus AI assistant integration
- fix(discover): researcher search accuracy + complete profiles
- feat(grants): comprehensive discovery overhaul — 173 grants, NIH/NSF live, relevance scoring
- chore: bump to v0.10.6
- fix: Discover hallucination, whiteboard cursor/paste, news filter, grant search
- chore: bump to v0.10.5
- fix: Endnote setup crash — backslashes in Windows paths inside onclick
- chore: bump to v0.10.4
- feat: Endnote auto-sync — folder setup, export script, in-app guide
- chore: bump to v0.10.3
- chore: remove bib parse test file
- fix: parseBib regex — remove /m flag causing empty entry bodies
- fix: Zotero BBT — use pull-export URL /better-bibtex/library?/[id]/library.bib
- fix: Zotero BBT — use named params object, omit citationKeys for full library export
- fix: Zotero — use BBT HTTP export endpoint instead of JSON-RPC
- fix: Zotero Better BibTeX — use item.export not item.exportLibrary
- chore: bump to v0.10.2
- fix: Zotero import — use Better BibTeX JSON-RPC instead of non-existent local REST API
- chore: bump to v0.10.1
- feat(grants): live multi-source search — Grants.gov, EU Horizon, UKRI
- chore: bump to v0.10.0
- feat(whiteboard): link boards to projects
- feat(whiteboard): z-order control, image drop/paste
- feat(whiteboard): multi-select — drag box and Ctrl+click
- feat(whiteboard): zoom + pan (infinite canvas)
- feat(whiteboard): Bezier pen smoothing, sticky colour palette
- fix(whiteboard): fill colour picker, triangle tool, selection property bar
- chore: bump to v0.9.1
- fix: dark mode flashbang on Notes and Support pages
- fix: release scripts — token length validation and graceful existing-release handling

---

## 💬 Feedback

Use the **Feedback** tab inside the app to send bug reports and feature ideas. Or [open an issue](https://github.com/PhDMax/phdflow/issues) on GitHub.

---

## 📄 License

MIT © PhDFlow
Free to use, modify, and distribute. No warranty expressed or implied.

---

## 🔒 Privacy

PhDFlow has **no servers, no telemetry, no accounts**.
Your data is stored locally in `%APPDATA%\phdflow\`.
The only outbound connections are:
- arXiv, OpenAlex, Semantic Scholar, CrossRef — paper/author search (open APIs)
- SMTP server — only for Vault OTP emails (configured by you)
- GitHub API — only for the update version check (no auth, no data sent)
