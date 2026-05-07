---
name: a11y
description: >
  Validate accessibility and keyboard usability to prevent regressions in
  core vault workflows.
owner: frontend
scope: ui
---

# Accessibility Skill

## Trigger

- Screen/component/form/button/modal changes
- New page creation or admin interface modifications

## Checklist

- Every input and interactive control has an accessible label
  (`aria-label` or `aria-labelledby`)
- Click-only interactions have keyboard alternatives (`Enter` / `Space`)
- Focus visibility and `focus-visible` behavior is preserved
- Main pages reviewed: `/dashboard`, `/files`, `/files/[id]`,
  `/files/[id]/history`, `/admin/*`

## Commands

```bash
pnpm --filter @plainvault/app lint
pnpm --filter @plainvault/app typecheck
```

## Output

- Accessibility check list per page with severity and repro path
- Items verified manually are marked as `done`
