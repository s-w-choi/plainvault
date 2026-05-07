<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Operations Guide (PlainVault)

This repository uses `.agent` as a local operations layer for skills and
verification artifacts.

### Required `.agent` structure

- `.agent/AGENTS.md`: project-specific operational instructions for `.agent`.
- `.agent/skills/INDEX.md`: skill catalog for human-readable overview.
- `.agent/skills/registry.json`: machine-readable skill registry.
- `.agent/skills/*-skill/SKILL.md`: skill definitions (folder + `SKILL.md`).
- `.agent/harnesses/session-analyzer.ts`: session/harness entrypoint.

### Skill governance

- Do not add a new skill file without updating:
  1. `.agent/skills/<slug>-skill/SKILL.md`
  2. `.agent/skills/registry.json`
  3. `.agent/skills/INDEX.md`
- Skill names should be registered in `registry.json` without the `vault-` prefix.

### Validation and traceability

- Use harness workflows when scope includes:
  - integration/security-sensitive changes
  - commit readiness
  - major DB/session/secret work
- Default checks for skill registry integrity:
  - every `registry.json` entry must point to an existing `SKILL.md`
  - every entry in `INDEX.md` should have a corresponding `SKILL.md`

### Commit protocol

- This repo follows the Lore Commit Protocol format from `.agent/AGENTS.md` and
  `.agent/skills/commit-governance-skill/SKILL.md`.
- Security/DB/auth/route commits must include concrete verification in the commit
  body.
