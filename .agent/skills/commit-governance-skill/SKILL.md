---
name: commit-governance
description: >
  Enforce Lore Commit Protocol for this repository and keep commit messages
  tied to validation evidence.
owner: governance
scope: git-history
---

# Commit Governance Skill

## Trigger

- Before and after any commit
- Security, DB, route, or agent-ops changes before commit

## Repository commit convention (derived from git log)

In this repo, commit subjects should generally follow:

```text
<type>(<scope>): short intent
```

where `<type>` is `feat`, `refactor`, `fix`, `chore`, `docs`, `security`, etc.

Use this format for normal code changes. For governance/operations commits that set repository policy (like `.agent` updates), use a clear non-functional subject such as:

```text
chore(agent): ...
```

## Required Commit Format (Lore + OmX trailer)

```text
<intent line>

<short body>

Constraint: <external constraint>
Rejected: <alternative considered> | <reason>
Confidence: <low|medium|high>
Scope-risk: <narrow|moderate|broad>
Directive: <follow-up warning or requirement>
Tested: <what was verified>
Not-tested: <known gaps>
Co-authored-by: OmX <omx@oh-my-codex.dev>
```

- Subject is the **intent-first** reason, not a raw changelist.
- One trailing blank line between subject and body.
- `Body` should state why/decision context (not just file list).
- All trailer labels must be present.
- `Co-authored-by: OmX <omx@oh-my-codex.dev>` is required by the active pre-tool hook.
- Security/auth/DB/route commits should include meaningful `Tested` evidence.

## Rules

- Prefer repository Conventional Commit subject for implementation work, and keep the body in Lore protocol.
- Never use editor-file commit input (`-F`, `-c`, `-C`, `--reuse-message`, `--reedit-message`) for automated checks in this environment because pre-tool hook cannot validate external sources.
- Use inline paragraphs only:

```bash
git commit \
  -m "<type>(<scope>): <intent-first subject>" \
  -m "<short body: why, decision, and approach>" \
  -m "Constraint: <external constraint>" \
  -m "Rejected: <alternative considered> | <reason>" \
  -m "Confidence: <low|medium|high>" \
  -m "Scope-risk: <narrow|moderate|broad>" \
  -m "Directive: <follow-up warning/requirement>" \
  -m "Tested: <commands or checks>" \
  -m "Not-tested: <known gaps>" \
  -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
```

## Examples

### Pass (valid)

```bash
git commit \
  -m "chore(agent): codify commit-governance protocol" \
  -m "Align commit rules with repository history style so future messages are deterministic and auditable." \
  -m "Constraint: repository history uses scoped Conventional Commit subjects plus Lore-style decision trailers." \
  -m "Rejected: free-form commit summaries | they are hard to review for intent and evidence." \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: enforce this template before commit for agent or process-file changes." \
  -m "Tested: reviewed git log --pretty=format:'%h %s' -n 30; updated .agent/AGENTS.md and .agent/skills/commit-governance-skill/SKILL.md" \
  -m "Not-tested: app/runtime behavior tests; process metadata only." \
  -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
```

### Fail (invalid)

```bash
# OmX trailer 누락
git commit -m "fix: do change" -m "small fix" -m "Constraint: ..."

# Subject-Body 구분 개행 누락
git commit -m "fix: do change" -m "no blank line before body" -m "Constraint: ..."
```


## Acceptance

- All trailer fields exist: `Constraint`, `Rejected`, `Confidence`,
  `Scope-risk`, `Directive`, `Tested`, `Not-tested`, `Co-authored-by`.
