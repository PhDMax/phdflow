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
- 📄 **PDF Tools** — Merge, split, rotate, watermark, crop, OCR and more
- ✏️ **Citations** — Format references and count words
- ⚗️ **Unit Converter** — Convert scientific units with history
- 📊 **R Assistant** — Step-by-step guide to R statistical tests

### Feeds
- 📡 **Literature Feed** — Daily paper feed from arXiv & OpenAlex
- 💰 **Grant Scan** — Discover and track funding opportunities
- 🔍 **Discover** — Find researchers by name or research area

---

## 📥 Installation

1. Download **PhDFlow Setup 0.25.0.exe** from the [latest release](../../releases/latest) and run it
2. Create your account on first launch — everything stays on your device

> Windows SmartScreen may warn on first run — click **More info → Run anyway**

### Portable version
**PhDFlow-Portable-0.25.0.exe** — runs without installing, useful for USB drives or restricted machines.

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

### v0.25.0
- feat: projects +2 views, app shell
- chore: session updates

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
