---
priority: critical
applies-to: all-agents
load: always
model: qwen3.5-4b
conflicts: []
---

# Karpathy LLM Coding Rules

Behavioral guidelines to reduce common LLM coding mistakes. Derived from Andrej Karpathy's observations.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## 5. Tool Boundaries — NEVER HALLUCINATE WRITES ⛔

**You have zero local filesystem write access. This is a hard constraint, not a preference.**

### Two codebases — venture-scoped tool rules ⚠️

There are always two separate codebases in scope. Which one matters depends on the **active venture**.

| Codebase | What it is | Tools |
|----------|-----------|-------|
| **YVON OS** | The AI operating system — Next.js at `/Users/novysingh/StudioProjects/YVON2.0/` | `Read`, `Bash`, `Glob`, `Grep` |
| **Venture app** | The actual product (Hourbour Flutter, Novizio store, etc.) | `Github(action=...)` only |

**When active venture = Hourbour (or any non-YVON venture):**
- ALL questions about the venture's code, commits, files, bugs → `Github(action=...)` only
- `Read` / `Bash` / `Glob` / `Grep` are permitted ONLY for loading your own MEMORY.md and YVON system docs (WORKFLOW.md, SESSION.md). They cannot see the venture's codebase.
- `Bash git log` shows YVON's commits. Running it to answer questions about Hourbour returns wrong data. Always use `Github(action=commits)` for the venture's history.

**When active venture = YVON Dashboard:**
- The codebase in question IS the YVON OS local filesystem
- `Read` / `Bash` / `Glob` / `Grep` are valid for exploring it
- `Github` targets the YVON OS repo if one is configured

**The test before every tool call:**
> "Is the user asking about [venture name]'s product, or about YVON itself?"
> Venture product → Github. YVON OS → Read/Bash.

### What you CAN do
- Read YVON OS files with `Read(file_path)` — docs, agent memory, YVON source code
- Search YVON OS code with `Glob` / `Grep`
- Run read-only shell commands with `Bash`: `ls`, `cat`, `find`, `git log`, `git status`, `git diff` — against the YVON OS directory only
- Read or write the venture's GitHub repo with `Github(action=...)` — this is the only path to the venture's actual codebase

### What you CANNOT do — ever
- Write, edit, create, or delete files on the local machine
- Run `Bash` write commands (`echo >`, `sed -i`, `mkdir`, `cp`, `mv`, `rm`, etc.) — they are blocked
- There is no `Write` tool, no `Edit` tool, no `Save` tool in your palette

### The only write path
`Github(action=write_file)` — creates or updates a file directly in the venture's GitHub repo via the API. No git push needed. It commits immediately.
`Github(action=delete_file)` — deletes a file from the repo. Same mechanism.

### Forbidden phrases — never say these
- "I've updated the file locally"
- "I've edited X"
- "I've saved the changes"
- "Done — I've written the file"
- "The file has been modified"
- Any past-tense claim about a local write you did not make via a tool call

### Correct behavior when asked to write a file
1. If a venture repo is configured: call `Github(action=write_file, path=..., content=..., message=...)` — the tool call is the proof. The user sees it happen.
2. If no repo is configured or the write fails: say exactly that. Do not pretend it worked.
3. Never generate a code block and claim you "saved it" — generating text is not writing a file.