#!/usr/bin/env python3
"""
PhDFlow Dev Agents — multi-agent AI sessions for development assistance.
Powered by Ollama (local, free, no API key needed).
Requires: ollama running + qwen2.5-coder:7b pulled.

Usage:
  python agents\\phdflow_agents.py brainstorm "better citation export from library"
  python agents\\phdflow_agents.py investigate "TypeError in calendar when adding recurring event"
  python agents\\phdflow_agents.py test-gen "add todo item and mark complete"
  python agents\\phdflow_agents.py review "added dark mode toggle to settings"
  git diff HEAD | python agents\\phdflow_agents.py review
  python agents\\phdflow_agents.py review --file my.diff
  python agents\\phdflow_agents.py help
"""

import sys, json, urllib.request, urllib.error
import datetime, os, textwrap, time

# Force UTF-8 output on Windows terminals that default to cp1252
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

OLLAMA_URL  = "http://localhost:11434"
AGENT_MODEL = "qwen2.5-coder:7b"

# ── Terminal colours ──────────────────────────────────────────────────────────

RESET = "\033[0m"
BOLD  = "\033[1m"
DIM   = "\033[2m"

# ── Agent definitions ─────────────────────────────────────────────────────────

AGENTS = {
    "user": {
        "name": "PhD User  (Alex)",
        "color": "\033[94m",   # blue
        "system": textwrap.dedent("""\
            You are Alex, a 3rd-year PhD student in molecular biology who uses PhDFlow daily
            as your main research command center. You are technically literate but not a developer.
            You think in terms of your daily research workflows: reading papers, tracking experiments,
            managing deadlines, collaborating with supervisors and collaborators.
            Be specific about what you do and don't do in the app. Mention concrete daily scenarios.
            Keep responses focused and under 200 words. No bullet soup — prose is fine."""),
    },
    "pm": {
        "name": "Product Mgr (Sam)",
        "color": "\033[92m",   # green
        "system": textwrap.dedent("""\
            You are Sam, a product manager synthesising user research into dev-ready specs.
            PhDFlow is a free, local-first Electron desktop app for PhD researchers.
            Views: projects, library, pipeline, writing, contacts, notes, calendar,
            todos, grants, news, whiteboard, utilities, lab_tools, settings.
            Turn user feedback into a crisp, actionable feature spec:
            1) Problem statement  2) Proposed solution  3) Acceptance criteria  4) Edge cases.
            Be concise. No marketing fluff. Under 300 words."""),
    },
    "dev": {
        "name": "Developer   (Jordan)",
        "color": "\033[33m",   # yellow
        "system": textwrap.dedent("""\
            You are Jordan, a senior Electron developer reviewing feature specs.
            PhDFlow's stack: Electron v35, Tailwind CSS v4, vanilla JS (no framework).
            Each view is a separate src/views/*.js file that injects HTML into #view-content.
            Data stored locally in app-data.json via IPC (window.api.storeGet / storeSet).
            All dependencies must be free/open-source — no paid APIs.
            Review for: technical feasibility, implementation approach, gotchas,
            and effort estimate (S / M / L / XL). Be direct. Flag real concerns. Under 300 words."""),
    },
    "qa": {
        "name": "QA Tester   (Riley)",
        "color": "\033[95m",   # magenta
        "system": textwrap.dedent("""\
            You are Riley, a QA engineer writing Playwright tests for PhDFlow.
            PhDFlow is an Electron app tested with @playwright/test + _electron.launch().
            Sidebar nav buttons have id="nav-{viewname}". Main content is #view-content.
            Tests live in tests/*.spec.js, use helpers from tests/helpers/launch.js
            (launchApp, login, closeApp), and run serially:
              test.describe.configure({ mode: 'serial' })
            Write concrete, runnable Playwright test stubs with realistic selectors.
            Happy path first, then one important edge case. Suggest the file path at the top.
            Under 250 words."""),
    },
    "hunter": {
        "name": "Bug Hunter  (Morgan)",
        "color": "\033[91m",   # red
        "system": textwrap.dedent("""\
            You are Morgan, a senior debugger specialising in Electron apps.
            PhDFlow architecture: main process (main.js) <-> preload (preload.js,
            contextIsolation=true) <-> renderer (renderer.js + src/views/*.js).
            IPC: renderer calls window.api.* -> preload bridges -> ipcMain.handle() in main.js.
            Data: localStorage for UI state, app-data.json for persistent data via IPC.
            Format your answer as:
              Root Cause:
              Why it happens:
              Fix:
              How to verify:
            Reference actual file names. Under 300 words."""),
    },
}


def _box(color, name, text):
    width = 56
    label = f"┌─ {name} "
    top   = label + "─" * max(0, width - len(label)) + "┐"
    bot   = "└" + "─" * (width + 1) + "┘"
    lines = []
    for raw in text.strip().splitlines():
        for chunk in textwrap.wrap(raw, width - 2) or [""]:
            lines.append(f"│ {chunk:<{width - 2}} │")
    print(f"\n{BOLD}{color}{top}{RESET}")
    for l in lines:
        print(f"{color}{l}{RESET}")
    print(f"{BOLD}{color}{bot}{RESET}\n")
    time.sleep(0.1)


# ── Ollama API helpers ────────────────────────────────────────────────────────

def _chat_ollama(system_prompt, user_message, timeout=120):
    """Call Ollama's OpenAI-compatible /v1/chat/completions endpoint (streaming).

    Streaming keeps the socket alive token-by-token, avoiding timeout errors
    on long responses from slow/large models.
    """
    payload = json.dumps({
        "model": AGENT_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
        "stream": True,
        "options": {"num_gpu": 99},
    }).encode()
    req = urllib.request.Request(
        OLLAMA_URL + "/v1/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        chunks = []
        with urllib.request.urlopen(req, timeout=timeout) as r:
            for raw_line in r:
                line = raw_line.decode("utf-8", errors="replace").strip()
                if not line or not line.startswith("data:"):
                    continue
                payload_str = line[len("data:"):].strip()
                if payload_str == "[DONE]":
                    break
                chunk = json.loads(payload_str)
                delta = chunk["choices"][0].get("delta", {})
                if "content" in delta:
                    chunks.append(delta["content"])
        return "".join(chunks).strip()
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Ollama HTTP {e.code}: {body[:500]}") from None


def _ping():
    """Return True if Ollama is reachable and has the required model."""
    try:
        with urllib.request.urlopen(OLLAMA_URL + "/api/tags", timeout=4) as r:
            data = json.loads(r.read())
            models = [m["name"] for m in data.get("models", [])]
            if not any(AGENT_MODEL in m for m in models):
                print(
                    f"\n⚠️   Model '{AGENT_MODEL}' not found in Ollama.\n"
                    f"    Pull it with:  ollama pull {AGENT_MODEL}\n"
                )
                return False
            return True
    except Exception:
        return False


# ── Review input helpers ──────────────────────────────────────────────────────

MAX_DIFF_CHARS = 12_000

def _maybe_truncate(text):
    if len(text) > MAX_DIFF_CHARS:
        print(f"{DIM}  (input truncated from {len(text):,} to {MAX_DIFF_CHARS:,} chars){RESET}")
        return text[:MAX_DIFF_CHARS] + "\n\n[... truncated ...]"
    return text

def _read_change(extra_args):
    """
    Resolve the change/diff to review from one of three sources (priority order):
      1. --file <path>       explicit diff file
      2. piped stdin         git diff HEAD | python … review
      3. command-line text   python … review "added dark mode toggle"
    Returns (change_text, short_title).
    """
    if "--file" in extra_args:
        idx  = extra_args.index("--file")
        path = extra_args[idx + 1] if idx + 1 < len(extra_args) else ""
        if not path:
            print("--file requires a path.\n")
            sys.exit(1)
        with open(path, encoding="utf-8", errors="replace") as fh:
            return _maybe_truncate(fh.read()), os.path.basename(path)

    if not sys.stdin.isatty():
        return _maybe_truncate(sys.stdin.read()), "piped diff"

    text = " ".join(a for a in extra_args if not a.startswith("-")).strip()
    if not text:
        print("Provide a description, pipe a diff, or use --file <path>.\n")
        sys.exit(1)
    return text, text[:60]


# ── Core agent call ───────────────────────────────────────────────────────────

def call_agent(key, history, task):
    """
    Run one agent turn via Ollama.
    history: list of {"agent": name, "text": response}
    task:    specific instruction for this turn
    Returns the agent's response text.
    """
    agent = AGENTS[key]
    parts = []
    if history:
        parts.append("=== CONVERSATION SO FAR ===")
        for turn in history:
            parts.append(f"\n[{turn['agent']}]:\n{turn['text']}")
        parts.append("\n=== END OF CONVERSATION ===\n")
    parts.append(f"YOUR TASK:\n{task}")
    parts.append("\nRespond now in your assigned role:")
    return _chat_ollama(agent["system"], "\n".join(parts))


# ── Workflows ─────────────────────────────────────────────────────────────────

def run_brainstorm(topic):
    print(f"\n{BOLD}🧠  BRAINSTORM — {topic}{RESET}")
    print(f"{DIM}  Agents: PhD User → Product Manager → Developer{RESET}\n")
    history = []

    print(f"{DIM}  [1/3] Asking PhD User…{RESET}", flush=True)
    resp = call_agent("user", history,
        f"Describe your experience and frustrations related to: {topic}.\n"
        "What do you wish PhDFlow did better or differently in this area?")
    history.append({"agent": AGENTS["user"]["name"], "text": resp})
    _box(AGENTS["user"]["color"], AGENTS["user"]["name"], resp)

    print(f"{DIM}  [2/3] Product Manager synthesising…{RESET}", flush=True)
    resp = call_agent("pm", history,
        "Based on the user feedback above, write a feature spec for the PhDFlow dev team.")
    history.append({"agent": AGENTS["pm"]["name"], "text": resp})
    _box(AGENTS["pm"]["color"], AGENTS["pm"]["name"], resp)

    print(f"{DIM}  [3/3] Developer reviewing…{RESET}", flush=True)
    resp = call_agent("dev", history,
        "Review the feature spec. Is it feasible? "
        "Sketch the implementation approach and give an effort estimate (S/M/L/XL).")
    history.append({"agent": AGENTS["dev"]["name"], "text": resp})
    _box(AGENTS["dev"]["color"], AGENTS["dev"]["name"], resp)

    return history


def run_investigate(error):
    print(f"\n{BOLD}🔍  INVESTIGATE — {error[:70]}{RESET}")
    print(f"{DIM}  Agents: Bug Hunter → Developer{RESET}\n")
    history = []

    print(f"{DIM}  [1/2] Bug Hunter analysing…{RESET}", flush=True)
    resp = call_agent("hunter", history,
        f"Diagnose this bug report from PhDFlow:\n\n{error}")
    history.append({"agent": AGENTS["hunter"]["name"], "text": resp})
    _box(AGENTS["hunter"]["color"], AGENTS["hunter"]["name"], resp)

    print(f"{DIM}  [2/2] Developer proposing fix…{RESET}", flush=True)
    resp = call_agent("dev", history,
        "Based on the diagnosis, describe the concrete code change needed. "
        "Reference the actual file (main.js, src/views/*.js, renderer.js, preload.js).")
    history.append({"agent": AGENTS["dev"]["name"], "text": resp})
    _box(AGENTS["dev"]["color"], AGENTS["dev"]["name"], resp)

    return history


def run_test_gen(feature):
    print(f"\n{BOLD}🧪  TEST GEN — {feature}{RESET}")
    print(f"{DIM}  Agents: Product Manager → QA Tester{RESET}\n")
    history = []

    print(f"{DIM}  [1/2] PM writing acceptance criteria…{RESET}", flush=True)
    resp = call_agent("pm", history,
        f"Write acceptance criteria for this PhDFlow feature:\n{feature}")
    history.append({"agent": AGENTS["pm"]["name"], "text": resp})
    _box(AGENTS["pm"]["color"], AGENTS["pm"]["name"], resp)

    print(f"{DIM}  [2/2] QA Tester writing Playwright tests…{RESET}", flush=True)
    resp = call_agent("qa", history,
        "Write Playwright test stubs covering the acceptance criteria above. "
        "Use helpers from tests/helpers/launch.js. Suggest the file path at the top.")
    history.append({"agent": AGENTS["qa"]["name"], "text": resp})
    _box(AGENTS["qa"]["color"], AGENTS["qa"]["name"], resp)

    return history


def run_review(change):
    title    = change[:70].replace("\n", " ")
    ellipsis = "…" if len(change) > 70 else ""
    print(f"\n{BOLD}🔎  REVIEW — {title}{ellipsis}{RESET}")
    print(f"{DIM}  Agents: Developer → Bug Hunter → QA Tester{RESET}\n")
    history = []

    block = f"=== CHANGE / DIFF ===\n{change}\n=== END ==="

    print(f"{DIM}  [1/3] Developer reviewing…{RESET}", flush=True)
    resp = call_agent("dev", history,
        f"{block}\n\n"
        "Review this change to PhDFlow. Address:\n"
        "1. Architecture fit — does it follow the IPC pattern and view structure?\n"
        "2. Code quality — style, naming, unnecessary complexity?\n"
        "3. Missing pieces — error handling, edge cases left unaddressed?\n"
        "4. Verdict: Approve / Request changes / Needs discussion.")
    history.append({"agent": AGENTS["dev"]["name"], "text": resp})
    _box(AGENTS["dev"]["color"], AGENTS["dev"]["name"], resp)

    print(f"{DIM}  [2/3] Bug Hunter scanning…{RESET}", flush=True)
    resp = call_agent("hunter", history,
        f"{block}\n\n"
        "Scan this change for bugs, regressions, and security issues. "
        "Be concrete — only flag problems you can actually see in the code. "
        "If the change looks clean, say so in one sentence and list only minor nits.")
    history.append({"agent": AGENTS["hunter"]["name"], "text": resp})
    _box(AGENTS["hunter"]["color"], AGENTS["hunter"]["name"], resp)

    print(f"{DIM}  [3/3] QA Tester checking coverage…{RESET}", flush=True)
    resp = call_agent("qa", history,
        f"{block}\n\n"
        "List what Playwright tests need to be added or updated for this change. "
        "For each test: file path in tests/, what scenario it covers, key assertion. "
        "If the existing smoke tests in tests/smoke.spec.js already cover it, say so.")
    history.append({"agent": AGENTS["qa"]["name"], "text": resp})
    _box(AGENTS["qa"]["color"], AGENTS["qa"]["name"], resp)

    return history


# ── Save ──────────────────────────────────────────────────────────────────────

def save_session(workflow, topic, history):
    out_dir = os.path.join(os.path.dirname(__file__), "sessions")
    os.makedirs(out_dir, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%Y-%m-%d_%H%M%S")
    slug  = "".join(c if c.isalnum() or c in "-_ " else "" for c in topic)
    slug  = slug.strip().replace(" ", "-")[:40]
    fname = os.path.join(out_dir, f"{workflow}-{stamp}-{slug}.md")
    with open(fname, "w", encoding="utf-8", errors="replace") as f:
        f.write(f"# {workflow.title()} — {topic}\n")
        f.write(f"_{datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}_\n\n")
        for turn in history:
            f.write(f"## {turn['agent']}\n\n{turn['text']}\n\n---\n\n")
    print(f"{DIM}  Saved → {os.path.relpath(fname)}{RESET}\n")
    return fname


# ── CLI ───────────────────────────────────────────────────────────────────────

HELP = f"""
{BOLD}PhDFlow Dev Agents{RESET}  (Ollama local — {OLLAMA_URL}, model: {AGENT_MODEL})

{BOLD}SETUP:{RESET}
  1. Install Ollama: https://ollama.com
  2. Pull the model:  ollama pull {AGENT_MODEL}
  3. Ollama starts automatically — no extra steps needed.

{BOLD}USAGE:{RESET}
  python agents\\phdflow_agents.py <workflow> [input]

{BOLD}WORKFLOWS:{RESET}
  {BOLD}brainstorm{RESET}  <topic>    PhD User + PM + Developer discuss a feature idea
  {BOLD}investigate{RESET} <error>    Bug Hunter + Developer diagnose and propose a fix
  {BOLD}test-gen{RESET}    <feature>  PM writes criteria + QA writes Playwright tests
  {BOLD}review{RESET}      <change>   Developer + Bug Hunter + QA review a code change
              Accepts: text description, --file <diff>, or piped stdin

{BOLD}EXAMPLES:{RESET}
  python agents\\phdflow_agents.py brainstorm "smarter deadline reminders in todos"
  python agents\\phdflow_agents.py investigate "app freezes when importing a 50-page PDF"
  python agents\\phdflow_agents.py test-gen "create a new project and add a milestone"
  python agents\\phdflow_agents.py review "added dark mode toggle to settings view"
  git diff HEAD | python agents\\phdflow_agents.py review
  python agents\\phdflow_agents.py review --file my.diff

Sessions are saved to agents\\sessions\\ as markdown files.
"""


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help", "help"):
        print(HELP)
        sys.exit(0)

    workflow   = args[0]
    extra_args = args[1:]

    if workflow not in ("brainstorm", "investigate", "test-gen", "review"):
        print(f"Unknown workflow: {workflow!r}\n")
        print(HELP)
        sys.exit(1)

    if workflow == "review":
        topic, _ = _read_change(extra_args)
    else:
        topic = " ".join(extra_args).strip()
        if not topic:
            print("Provide a topic/description after the workflow name.\n")
            print(HELP)
            sys.exit(1)

    print(f"{DIM}Checking Ollama at {OLLAMA_URL}…{RESET}", flush=True)
    if not _ping():
        print(
            f"\n❌  Ollama is not reachable at {OLLAMA_URL}.\n"
            f"    Start it with:  ollama serve\n"
            f"    Then pull the model:  ollama pull {AGENT_MODEL}\n"
        )
        sys.exit(1)
    print(f"✓  Ollama is up ({AGENT_MODEL})\n")

    dispatch = {
        "brainstorm":  run_brainstorm,
        "investigate": run_investigate,
        "test-gen":    run_test_gen,
        "review":      run_review,
    }
    history = dispatch[workflow](topic)
    save_session(workflow, topic, history)


if __name__ == "__main__":
    main()
