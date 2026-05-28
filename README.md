# ⚗️ PhDFlow

> **Closed Alpha — v0.3.0**  
> This is an early access build shared with trusted testers. Features are incomplete and things will break. Feedback is welcome and extremely valuable.

**Your all-in-one research workspace — open source, local-first. All data stays on your device.**

---

## ✨ Features

### Research
- 📋 **Projects** — Track research projects with status, milestones, and notes
- 📚 **Paper Library** — Import, annotate, and organise PDFs and citations (BibTeX/RIS)
- ✍️ **Grant Writing** — Draft, version, and manage grant applications
- 📡 **Literature Feed** — Automated paper discovery via arXiv & OpenAlex by topic

### Workspace
- 📝 **Notes** — Rich markdown notes with full formatting
- 🎨 **Whiteboard** — Freehand brainstorming, sticky notes, and argument maps
- 🔧 **Utilities** — PDF toolkit: merge, split, rotate, page numbers, export

### Network
- 🔍 **Discover** — Find researchers by name across Semantic Scholar & OpenAlex
- 👥 **Contacts** — Research network with affiliation tracking

### Planning
- 📅 **Calendar** — Month/week/agenda views, deadline countdowns, PhD goals & milestones
- ✅ **To-Do List** — Today focus mode, effort levels, grouped tasks

### Security
- 🔐 **Vault** — 3-factor encrypted password storage (master password + TOTP + email OTP)
- 🔒 **App Login** — Password-protected startup; hides to system tray on close

---

## 📥 Installation (Alpha Testers)

1. Download `PhDFlow-Setup-0.3.0.exe` from the [Releases page](../../releases)
2. Run the installer — you can choose any installation directory
3. Launch **PhDFlow** from the desktop shortcut or Start Menu
4. Create your account (name + password) on first launch

> **No account required. No data leaves your device. No API keys needed.**

---

## 🛠️ Build from Source

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [Git](https://git-scm.com/)

### Steps

```bash
git clone https://github.com/PhDMax/phd-command-center.git
cd phd-command-center
npm install
npm run build:css      # Compile Tailwind CSS
npm start              # Run in development
```

### Build Windows installer
```bash
npm run build          # Produces dist/PhDFlow-Setup-x.x.x.exe
```

> **Note:** Code signing is disabled for alpha builds. Windows Defender SmartScreen may show a warning — click "More info → Run anyway" to proceed.

---

## 🐛 Known Alpha Issues

- Whiteboard: large canvases may slow down on older machines
- Literature Feed: rate limits on arXiv can delay results  
- Vault SMTP: some providers (e.g. Outlook) require app-specific passwords
- Update check requires an internet connection on login

---

## 💬 Feedback

Use the **Feedback** tab inside the app to send bug reports and feature ideas directly to Discord. Or open an issue here on GitHub.

---

## 📄 License

MIT © 2025 PhDFlow  
Free to use, modify, and distribute. No warranty expressed or implied.

---

## 🔒 Privacy

PhDFlow has **no servers, no telemetry, no accounts**.  
Your data is stored locally in `%APPDATA%\phdflow\`.  
The only outbound connections are:
- arXiv, OpenAlex, Semantic Scholar, CrossRef — paper/author search (open APIs)
- Your own Discord webhook — only when you click "Send" in Feedback
- Your own SMTP server — only for Vault OTP emails
- GitHub API — only for the update version check (no auth, no data sent)
