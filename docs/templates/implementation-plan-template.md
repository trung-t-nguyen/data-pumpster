# UC-XX — [Title]: Implementation Plan

**Version:** v1.0.0
**Status:** Not started
**Use Case:** [docs/use-cases/uc-XX-[slug].md](../use-cases/uc-XX-[slug].md)

---

## Overview

[1–2 paragraphs describing what this UC delivers end-to-end and how the work splits across layers (frontend / backend / both). Call out any key architectural choice at the top — e.g. "entirely client-side", "spans both layers", "backend-only".]

---

## Files Changed

### Frontend (`data-pumpster-app/`)

| File | Role |
|------|------|
| `app/[path]/[File].tsx` | [What this file does and why it exists for this UC] |

### Backend (`data-pumpster-service/`)

| File | Role |
|------|------|
| `[package]/[File].kt` | [What this file does and why it exists for this UC] |

### E2E Tests (`e2e/`)

| File | Role |
|------|------|
| `tests/uc-XX-[slug].spec.ts` | [Number] test cases covering [brief scope] |
| `pages/[Page].ts` | Page Object Model for [surface] — locators and helper methods |

> [Note any areas intentionally excluded — e.g. "No backend changes needed for this UC."]

---

## Key Design Decisions

### [Decision title] ([BR reference if applicable])
[Explain the non-obvious choice and why it was made. Reference the business rule or constraint it satisfies. One paragraph per decision.]

### [Decision title]
[Explanation.]

---

## [Optional: Processing / State Flow]

```
[ASCII diagram of the key flow, state machine, or sequence if it aids understanding]
```

---

## Business Rules Enforced

| Rule | Where enforced |
|------|----------------|
| BR-01: [rule summary] | [File/method that enforces it] |
| BR-02: [rule summary] | [File/method that enforces it] |

---

## E2E Test Coverage

| Test | Scenario |
|------|----------|
| [Test description] | Main success scenario |
| [Test description] | Alternative flow A |
| [Test description] | [Edge case or BR assertion] |
