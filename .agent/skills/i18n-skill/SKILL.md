---
name: i18n
description: >
  Verify missing hardcoded strings, locale switching, and translation key
  completeness after UI changes.
owner: localization
scope: ui
---

# I18n Skill

## Trigger

- Text updates in UI pages/components
- New routes or locale-specific behavior changes

## Scope

- `apps/app/messages/*.json`
- `apps/app/i18n/*`
- UI files containing hardcoded user-facing strings

## Checklist

- Confirm `useTranslations()`/`useTranslations` usage for visible strings
- Ensure locale keys exist for each new message
- Remove hardcoded default language assumptions where possible
- Validate default locale resolution

## Commands

```bash
pnpm --filter @plainvault/app lint
pnpm --filter @plainvault/app typecheck
pnpm --filter @plainvault/app test
```

## Output

- Missing translation keys
- Pages with untranslated text
- Remediation list for hardcoded strings
