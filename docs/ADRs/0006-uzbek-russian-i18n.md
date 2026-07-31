# ADR-0006: Uzbek and Russian Language Support

**Date:** 2026-07-31
**Status:** Accepted

---

## Context

Sovereign Messenger must serve Uzbekistan government employees. Russian is widely used as a working language in Uzbek government offices. Uzbek is the official state language and should be the default.

---

## Decision

Support three languages:
- **Uzbek (`uz`)** — default, primary
- **Russian (`ru`)** — secondary option
- **English (`en_EN`)** — fallback for untranslated strings (never shown to end users as a choice on its own; only used internally)

**Implementation:**

1. `uz.json` — custom translation file created for this project, 350+ keys
2. `I18nWebpackPlugin.ts` — modified to include `uz`, `ru`, `en_EN` in the build output
3. `utils.ts` — language selector updated to show only the 3 relevant languages
4. `config.json` — `setting_defaults.language: "uz"` sets Uzbek as default

**Fallback strategy:** `uz` → `en_EN`

Any key missing from `uz.json` silently falls back to English. This means the UI is never broken by an incomplete translation — missing keys show English rather than raw key identifiers.

---

## Advantages

- Meets government language requirements (Uzbek official state language)
- Russian support serves bilingual staff
- Fallback prevents broken UI from incomplete translations
- Incremental: can add more Uzbek translations over time without any structural changes

## Disadvantages

- `uz.json` is manually maintained — must be updated when new UI strings are added to Element Web
- Russian translation (`ru.json`) depends on the community — may have gaps
- Some technical terms (like "end-to-end encryption") are difficult to translate naturally into Uzbek

---

## Related Documents

- [Internationalization](../Frontend/i18n.md)
- [Element Web Customization](../Frontend/element-customization.md)
