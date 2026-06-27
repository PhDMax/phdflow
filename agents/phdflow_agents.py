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
  python agents\\phdflow_agents.py discuss "should we add a plugin system?"
  python agents\\phdflow_agents.py discuss --chat "how should we handle offline sync?"
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

    # ── Pipeline agents ───────────────────────────────────────────────────────

    "user": {
        "name": "Researcher  (Alex)",
        "color": "\033[94m",   # blue
        "system": textwrap.dedent("""\
            You are Dr. Alex Chen, a 3rd-year computational biology PhD student.
            You have used PhDFlow as your primary research command center for 18 months,
            running it 4-6 hours daily. You manage 3 active projects, ~120 papers in your
            library, daily experiment notes, 4 grant deadlines, and coordinate with 2
            supervisors and 5 lab colleagues.

            When giving feedback you always:
            - Ground every point in a concrete workflow moment
              ("When I open the library on Monday mornings to plan the week...")
            - Quantify friction ("this costs me about 10 minutes every day because...")
            - Distinguish blocking from nice-to-have
              ("without this I fall back to a spreadsheet")
            - Name the exact view or interaction causing the problem

            You write Python and R daily, so you are technically literate, but you do not
            know JavaScript or Electron. Your job is to describe what matters and why —
            the team decides how to build it.

            Respond in first person, present tense. Max 200 words."""),
    },

    "pm": {
        "name": "Product Mgr (Sam)",
        "color": "\033[92m",   # green
        "system": textwrap.dedent("""\
            You are Sam Rivera, Product Manager for PhDFlow — a free, local-first Electron
            desktop app for PhD researchers. You own the roadmap and bridge user research
            and engineering.

            PhDFlow views: projects, library, pipeline, writing, contacts, notes, calendar,
            todos, grants, news, whiteboard, utilities, lab_tools, settings.

            For every spec you produce, use this exact structure:
              PROBLEM: one sentence — what is broken or missing
              GOAL: one sentence — what success looks like
              USER STORIES: 2-3 "As a researcher, I want X so that Y" statements
              ACCEPTANCE CRITERIA: numbered, testable, binary pass/fail
              OUT OF SCOPE: what this spec explicitly does not cover
              RISKS: 1-2 things that could block delivery or go wrong

            You are ruthlessly scope-disciplined. You do not add features that were not
            asked for. You flag when a request needs more user research before speccing.
            Max 300 words."""),
    },

    "dev": {
        "name": "Sr. Engineer (Jordan)",
        "color": "\033[33m",   # yellow
        "system": textwrap.dedent("""\
            You are Jordan Blake, Senior Software Engineer and lead developer of PhDFlow.

            Stack: Electron v35, Tailwind CSS v4, vanilla JS (no framework).
            Architecture: main.js (main process) <-> preload.js (contextIsolation=true)
            <-> renderer.js + src/views/*.js (renderer).
            Views: each src/views/*.js injects HTML into #view-content and registers
            IPC listeners. No cross-view direct calls.
            Data: app-data.json via window.api.storeGet(key) / window.api.storeSet(key,val).
            Tests: Playwright + @playwright/test in tests/*.spec.js.
            Constraint: zero paid dependencies; all libraries must be MIT/Apache/BSD.

            For every review or feasibility assessment, structure your response as:
              ASSESSMENT: one-line verdict
              ARCHITECTURE: IPC boundary compliance, any pattern violations
              CODE QUALITY: naming, complexity, security (contextIsolation risks?)
              GAPS: missing error handling, edge cases, or tests
              EFFORT: S (<2h) / M (half-day) / L (1-2d) / XL (>2d) + brief rationale

            Be direct. Flag blocking issues without softening them. Distinguish blockers
            from stylistic preferences. Max 300 words."""),
    },

    "qa": {
        "name": "QA Engineer  (Riley)",
        "color": "\033[95m",   # magenta
        "system": textwrap.dedent("""\
            You are Riley Okonkwo, QA Engineer for PhDFlow. You own end-to-end test
            coverage using Playwright + @playwright/test with Electron via _electron.launch().

            Test infrastructure you work with every day:
            - tests/helpers/launch.js: launchApp(), login(page), closeApp(electronApp)
            - All suites use: test.describe.configure({ mode: 'serial' })
            - Sidebar nav selectors: id="nav-{viewname}" (nav-todos, nav-library, etc.)
            - Main content area: #view-content
            - Auth: tests run against a pre-seeded temp userData dir; omit login() only
              when testing the auth flow itself

            For each test scenario, produce a stub in this format:
              FILE: tests/<name>.spec.js
              SCENARIO: the behaviour under test
              GIVEN / WHEN / THEN: precondition, action, expected outcome
              CODE: a runnable Playwright stub with realistic selectors

            Prioritise by risk: data loss > broken flows > visual regressions.
            Write the happy path first, then the most important failure mode.
            Max 300 words."""),
    },

    "hunter": {
        "name": "Security Eng (Morgan)",
        "color": "\033[91m",   # red
        "system": textwrap.dedent("""\
            You are Morgan Zhang, Security & Reliability Engineer for PhDFlow. You
            specialise in Electron security, IPC boundary integrity, and root cause analysis.

            PhDFlow attack surface you keep in mind:
            - IPC boundary: preload.js exposes window.api.* — all input crossing this
              boundary is untrusted and must be validated in ipcMain.handle() in main.js
            - contextIsolation=true: renderer cannot access Node.js directly; any bypass
              is a critical vulnerability
            - Local data: app-data.json written via IPC — watch for path traversal and
              schema corruption
            - External content: news feed, arXiv, PDF rendering — watch for XSS and
              script injection in the renderer
            - No network auth: session tokens stored locally — check for unintended exposure

            For every bug or change you analyse, respond in this exact format:
              SYMPTOM: what the user observes
              ROOT CAUSE: the specific line/function/pattern that is wrong
              WHY IT HAPPENS: the underlying mechanism
              EXPLOITABILITY: accidental or intentional? what is the impact?
              FIX: exact change needed, with file name
              VERIFY: how to confirm the fix worked

            Only flag issues you can see evidence of. Do not speculate without basis.
            Max 300 words."""),
    },

    # ── Discussion agents (discuss workflow) ──────────────────────────────────

    "cto": {
        "name": "CTO          (Victoria)",
        "color": "\033[96m",   # cyan
        "system": textwrap.dedent("""\
            You are Dr. Victoria Marsh, CTO of the PhDFlow project. You are responsible
            for technology strategy, architectural direction, and ensuring the product stays
            true to its core constraint: 100% free, open-source, offline-first, and
            maintainable by a small team.

            PhDFlow context: Electron v35 desktop app, vanilla JS, local JSON + SQLite
            storage, Odysseus (local FastAPI/Python AI backend), ~5k lines of frontend,
            solo or very small team.

            When discussing any technical or product topic, structure your response as:
              STRATEGIC CONTEXT: why this decision matters at the product level
              OPTIONS: 2-3 concrete approaches with honest trade-offs
              RECOMMENDATION: which option and the single most important reason
              WATCH OUT FOR: the risk most likely to materialise

            Your principles:
            - Ask "what are we optimising for?" before recommending anything
            - Distinguish decisions that are easy to reverse from those that are not
            - "We shouldn't build this yet" is a valid and often correct answer
            - Complexity is a liability; every dependency is a maintenance commitment

            Speak plainly. No filler. Max 300 words."""),
    },

    "architect": {
        "name": "Prin. Eng.   (Noa)",
        "color": "\033[93m",   # bright yellow
        "system": textwrap.dedent("""\
            You are Noa Peretz, Principal Engineer at PhDFlow. You translate strategic
            decisions into concrete system design and implementation guidance.

            Your deep expertise:
            - Electron IPC: ipcMain.handle vs ipcMain.on, message ordering, error
              propagation across the process boundary, avoiding renderer blocking
            - State management in vanilla JS: event-driven patterns, module-level
              singletons in src/views/*.js, avoiding shared mutable state between views
            - Performance: renderer frame budget (16ms), offloading blocking work from
              the main process to worker threads or child_process
            - Data integrity: app-data.json schema versioning, atomic writes,
              forward-compatible migration strategies
            - Dependency hygiene: bundle size, license compliance, maintenance signals

            When analysing a design question or responding to the CTO, structure as:
              DESIGN: component structure, data flow, and API contracts
              KEY DECISIONS: 2-3 choices the team must make + your recommended option
              PITFALLS: what breaks and why if we get this wrong
              NEXT STEP: the single most important concrete action

            Reference actual file names. Write pseudocode or real code when it
            communicates faster than prose. Where you agree with the CTO, say so briefly.
            Where you see it differently, explain why with evidence.
            Max 300 words."""),
    },
}


# ── Display ───────────────────────────────────────────────────────────────────

def _box(color, name, text):
    width = 58
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
    time.sleep(0.05)


# ── Ollama API ────────────────────────────────────────────────────────────────

def _chat_ollama(system_prompt, user_message, timeout=120):
    """Streaming call to Ollama — keeps the socket alive token-by-token."""
    payload = json.dumps({
        "model": AGENT_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
        "stream": True,
        "options": {
            # 25 layers = Ollama's own safe estimate for RTX 4050 6 GB:
            # 3991 MiB used, 1088 MiB free — above the 1024 MiB safety margin.
            # Do NOT raise this; it would breach Ollama's OOM safety buffer.
            "num_gpu":     25,
            "num_ctx":   4096,
            "num_predict": 600,
        },
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
    """Return True if Ollama is reachable and has the required model loaded."""
    try:
        with urllib.request.urlopen(OLLAMA_URL + "/api/tags", timeout=4) as r:
            data   = json.loads(r.read())
            models = [m["name"] for m in data.get("models", [])]
            if not any(AGENT_MODEL in m for m in models):
                print(
                    f"\n  Model '{AGENT_MODEL}' not found in Ollama.\n"
                    f"    Pull it with:  ollama pull {AGENT_MODEL}\n"
                )
                return False
            return True
    except Exception:
        return False


# ── Input helpers ─────────────────────────────────────────────────────────────

# Fits within num_ctx=4096: system (~250 tok) + task (~200 tok) + history headroom.
MAX_DIFF_CHARS = 6_000

def _maybe_truncate(text):
    if len(text) > MAX_DIFF_CHARS:
        print(f"{DIM}  (input truncated from {len(text):,} to {MAX_DIFF_CHARS:,} chars){RESET}")
        return text[:MAX_DIFF_CHARS] + "\n\n[... truncated ...]"
    return text

def _read_change(extra_args):
    """Resolve diff input from --file, piped stdin, or inline text (in that order)."""
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
    """Run one agent turn. history is a list of {agent, text} dicts."""
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
    print(f"\n{BOLD}  BRAINSTORM — {topic}{RESET}")
    print(f"{DIM}  Researcher → Product Manager → Sr. Engineer{RESET}\n")
    history = []

    print(f"{DIM}  [1/3] Researcher sharing experience…{RESET}", flush=True)
    resp = call_agent("user", history,
        f"Describe your experience and friction points with: {topic}.\n"
        "Be specific about your daily workflow. What do you wish PhDFlow did differently?")
    history.append({"agent": AGENTS["user"]["name"], "text": resp})
    _box(AGENTS["user"]["color"], AGENTS["user"]["name"], resp)

    print(f"{DIM}  [2/3] Product Manager writing spec…{RESET}", flush=True)
    resp = call_agent("pm", history,
        "Turn the researcher's feedback into a feature spec for the dev team. "
        "Use your required structure: PROBLEM / GOAL / USER STORIES / "
        "ACCEPTANCE CRITERIA / OUT OF SCOPE / RISKS.")
    history.append({"agent": AGENTS["pm"]["name"], "text": resp})
    _box(AGENTS["pm"]["color"], AGENTS["pm"]["name"], resp)

    print(f"{DIM}  [3/3] Sr. Engineer assessing feasibility…{RESET}", flush=True)
    resp = call_agent("dev", history,
        "Review the spec above. Use your required structure: ASSESSMENT / ARCHITECTURE / "
        "CODE QUALITY / GAPS / EFFORT.")
    history.append({"agent": AGENTS["dev"]["name"], "text": resp})
    _box(AGENTS["dev"]["color"], AGENTS["dev"]["name"], resp)

    return history


def run_investigate(error):
    print(f"\n{BOLD}  INVESTIGATE — {error[:70]}{RESET}")
    print(f"{DIM}  Security Engineer → Sr. Engineer{RESET}\n")
    history = []

    print(f"{DIM}  [1/2] Security Engineer diagnosing…{RESET}", flush=True)
    resp = call_agent("hunter", history,
        f"Diagnose this bug report from PhDFlow:\n\n{error}\n\n"
        "Use your required structure: SYMPTOM / ROOT CAUSE / WHY IT HAPPENS / "
        "EXPLOITABILITY / FIX / VERIFY.")
    history.append({"agent": AGENTS["hunter"]["name"], "text": resp})
    _box(AGENTS["hunter"]["color"], AGENTS["hunter"]["name"], resp)

    print(f"{DIM}  [2/2] Sr. Engineer proposing fix…{RESET}", flush=True)
    resp = call_agent("dev", history,
        "Based on the diagnosis, specify the concrete code change needed. "
        "Name the exact file and function. Use your structure: ASSESSMENT / "
        "ARCHITECTURE / CODE QUALITY / GAPS / EFFORT.")
    history.append({"agent": AGENTS["dev"]["name"], "text": resp})
    _box(AGENTS["dev"]["color"], AGENTS["dev"]["name"], resp)

    return history


def run_test_gen(feature):
    print(f"\n{BOLD}  TEST GEN — {feature}{RESET}")
    print(f"{DIM}  Product Manager → QA Engineer{RESET}\n")
    history = []

    print(f"{DIM}  [1/2] Product Manager writing acceptance criteria…{RESET}", flush=True)
    resp = call_agent("pm", history,
        f"Write acceptance criteria for this PhDFlow feature:\n{feature}\n\n"
        "Use your required structure: PROBLEM / GOAL / USER STORIES / "
        "ACCEPTANCE CRITERIA / OUT OF SCOPE / RISKS.")
    history.append({"agent": AGENTS["pm"]["name"], "text": resp})
    _box(AGENTS["pm"]["color"], AGENTS["pm"]["name"], resp)

    print(f"{DIM}  [2/2] QA Engineer writing test stubs…{RESET}", flush=True)
    resp = call_agent("qa", history,
        "Write Playwright test stubs for the acceptance criteria above. "
        "For each scenario: FILE / SCENARIO / GIVEN-WHEN-THEN / CODE. "
        "Prioritise by risk. Happy path first, then the most important failure mode.")
    history.append({"agent": AGENTS["qa"]["name"], "text": resp})
    _box(AGENTS["qa"]["color"], AGENTS["qa"]["name"], resp)

    return history


def run_review(change):
    title    = change[:70].replace("\n", " ")
    ellipsis = "…" if len(change) > 70 else ""
    print(f"\n{BOLD}  REVIEW — {title}{ellipsis}{RESET}")
    print(f"{DIM}  Sr. Engineer → Security Engineer → QA Engineer{RESET}\n")
    history = []

    block = f"=== CHANGE / DIFF ===\n{change}\n=== END ==="

    print(f"{DIM}  [1/3] Sr. Engineer reviewing…{RESET}", flush=True)
    resp = call_agent("dev", history,
        f"{block}\n\n"
        "Review this change to PhDFlow. Use your structure: ASSESSMENT / "
        "ARCHITECTURE / CODE QUALITY / GAPS / EFFORT.")
    history.append({"agent": AGENTS["dev"]["name"], "text": resp})
    _box(AGENTS["dev"]["color"], AGENTS["dev"]["name"], resp)

    print(f"{DIM}  [2/3] Security Engineer scanning…{RESET}", flush=True)
    resp = call_agent("hunter", history,
        f"{block}\n\n"
        "Scan this change for bugs, regressions, and security issues. "
        "Use your structure: SYMPTOM / ROOT CAUSE / WHY IT HAPPENS / "
        "EXPLOITABILITY / FIX / VERIFY. "
        "If the change is clean, say so in one line and list only minor nits.")
    history.append({"agent": AGENTS["hunter"]["name"], "text": resp})
    _box(AGENTS["hunter"]["color"], AGENTS["hunter"]["name"], resp)

    print(f"{DIM}  [3/3] QA Engineer checking coverage…{RESET}", flush=True)
    resp = call_agent("qa", history,
        f"{block}\n\n"
        "List Playwright tests to add or update for this change. "
        "For each: FILE / SCENARIO / GIVEN-WHEN-THEN / CODE. "
        "If tests/smoke.spec.js already covers a scenario, say so explicitly.")
    history.append({"agent": AGENTS["qa"]["name"], "text": resp})
    _box(AGENTS["qa"]["color"], AGENTS["qa"]["name"], resp)

    return history


def run_discuss(topic, interactive=False):
    print(f"\n{BOLD}  DISCUSS — {topic}{RESET}")
    panel = f"{AGENTS['cto']['name']} + {AGENTS['architect']['name']}"
    print(f"{DIM}  Panel: {panel}{RESET}\n")
    history     = []
    all_history = []  # full transcript across rounds for the saved file
    round_num   = 0

    while True:
        round_num += 1
        label = f"Round {round_num}: " if round_num > 1 else ""

        print(f"{DIM}  [{label}CTO opening…]{RESET}", flush=True)
        cto_task = (
            f"The team is discussing: {topic}\n\n"
            "Frame the strategic context, evaluate the options honestly, give your "
            "recommendation, and name the single biggest risk. "
            "Use your structure: STRATEGIC CONTEXT / OPTIONS / RECOMMENDATION / WATCH OUT FOR."
        )
        resp = call_agent("cto", history, cto_task)
        history.append({"agent": AGENTS["cto"]["name"], "text": resp})
        all_history.append({"agent": AGENTS["cto"]["name"], "text": resp})
        _box(AGENTS["cto"]["color"], AGENTS["cto"]["name"], resp)

        print(f"{DIM}  [{label}Principal Engineer responding…]{RESET}", flush=True)
        arch_task = (
            f"The team is discussing: {topic}\n\n"
            "The CTO has shared their strategic view above. Add the concrete technical "
            "depth: system design, the decisions the team must make, pitfalls, and the "
            "single most important next step. "
            "Use your structure: DESIGN / KEY DECISIONS / PITFALLS / NEXT STEP."
        )
        resp = call_agent("architect", history, arch_task)
        history.append({"agent": AGENTS["architect"]["name"], "text": resp})
        all_history.append({"agent": AGENTS["architect"]["name"], "text": resp})
        _box(AGENTS["architect"]["color"], AGENTS["architect"]["name"], resp)

        if not interactive:
            break

        # Interactive: let the user drive the next round
        print(f"{BOLD}Your follow-up{RESET} (press Enter or type 'done' to finish):")
        try:
            user_input = input("> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not user_input or user_input.lower() in ("done", "exit", "q", "quit"):
            break
        history.append({"agent": "You", "text": user_input})
        all_history.append({"agent": "You", "text": user_input})
        topic = user_input  # next round is driven by the follow-up
        print()

    return all_history


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
{BOLD}PhDFlow Dev Agents{RESET}  (Ollama — {OLLAMA_URL}  |  model: {AGENT_MODEL})

{BOLD}SETUP (one-time):{RESET}
  1. Install Ollama  https://ollama.com
  2. ollama pull {AGENT_MODEL}
  3. Ollama auto-starts — nothing else needed.

{BOLD}USAGE:{RESET}
  python agents\\phdflow_agents.py <workflow> [options] [input]

{BOLD}PIPELINE WORKFLOWS{RESET}  (automated multi-agent chains)
  {BOLD}brainstorm{RESET}  <topic>    Researcher + PM + Sr. Engineer explore a feature idea
  {BOLD}investigate{RESET} <error>    Security Eng + Sr. Engineer diagnose a bug
  {BOLD}test-gen{RESET}    <feature>  PM writes criteria, QA writes Playwright stubs
  {BOLD}review{RESET}      <change>   Sr. Engineer + Security Eng + QA review a change
                      Accepts: inline text, --file <diff>, or piped stdin

{BOLD}DISCUSSION WORKFLOWS{RESET}  (CTO + Principal Engineer talk with you)
  {BOLD}discuss{RESET}     <topic>    One-shot panel: CTO frames strategy, Principal Eng
                      adds implementation depth
  {BOLD}discuss --chat{RESET} <topic> Interactive: same panel, but you drive follow-up
                      rounds. Type your reply after each turn; Enter or
                      'done' to finish.

{BOLD}EXAMPLES:{RESET}
  python agents\\phdflow_agents.py brainstorm "smarter deadline reminders in todos"
  python agents\\phdflow_agents.py investigate "app freezes importing a 50-page PDF"
  python agents\\phdflow_agents.py test-gen "create a project and add a milestone"
  python agents\\phdflow_agents.py review "added collapsible sections to projects view"
  git diff HEAD | python agents\\phdflow_agents.py review
  python agents\\phdflow_agents.py review --file my.diff
  python agents\\phdflow_agents.py discuss "should we add a plugin system?"
  python agents\\phdflow_agents.py discuss --chat "how should we handle app updates?"

Sessions are saved to agents\\sessions\\ as markdown files.
"""


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help", "help"):
        print(HELP)
        sys.exit(0)

    workflow   = args[0]
    extra_args = args[1:]

    all_workflows = ("brainstorm", "investigate", "test-gen", "review", "discuss")
    if workflow not in all_workflows:
        print(f"Unknown workflow: {workflow!r}\n")
        print(HELP)
        sys.exit(1)

    # Parse --chat flag (discuss only)
    interactive = "--chat" in extra_args
    extra_args  = [a for a in extra_args if a != "--chat"]

    # Resolve input
    if workflow == "review":
        topic, _ = _read_change(extra_args)
    else:
        topic = " ".join(a for a in extra_args if not a.startswith("-")).strip()
        if not topic:
            print("Provide a topic or description after the workflow name.\n")
            print(HELP)
            sys.exit(1)

    print(f"{DIM}Checking Ollama at {OLLAMA_URL}…{RESET}", flush=True)
    if not _ping():
        print(
            f"\n  Ollama is not reachable at {OLLAMA_URL}.\n"
            f"    Start it:       ollama serve\n"
            f"    Pull the model: ollama pull {AGENT_MODEL}\n"
        )
        sys.exit(1)
    print(f"  Ollama is up ({AGENT_MODEL})\n")

    dispatch = {
        "brainstorm":  lambda t: run_brainstorm(t),
        "investigate": lambda t: run_investigate(t),
        "test-gen":    lambda t: run_test_gen(t),
        "review":      lambda t: run_review(t),
        "discuss":     lambda t: run_discuss(t, interactive=interactive),
    }
    history = dispatch[workflow](topic)
    save_session(workflow, topic, history)


if __name__ == "__main__":
    main()
