---
name: update-uc
description: Update an existing use case document for the UC specified by the argument (e.g. `uc-01`). Interviews the creator about what changed, applies edits, and bumps the version. Writes no production code.
argument-hint: "[uc-XX]"
disable-model-invocation: true
---

Update an existing use case document for the UC specified by the argument (e.g. `uc-01`). Interviews the creator about what changed, applies the edits, and bumps the version. Writes no production code.

Steps:
1. Locate and read the UC doc at `docs/use-cases/$ARGUMENTS-*.md` (match by UC number prefix).
2. Read `docs/entity-model/` and `docs/architecture/ARCHITECTURE.md` if the change might touch domain concepts.
3. **Show a summary of the current doc** to the creator — list each section heading and its one-line current content — so they can orient quickly without re-reading the whole file.
4. **Interview the creator** — ask all questions in one batch and wait for answers:
   - Which sections are changing? (Business Context, Preconditions, Main Success Scenario, Alternative Flows, Postconditions, Business Rules, or Status)
   - For each changed section: what exactly should change? (new text, additions, removals, or rewording)
   - Are any Business Rules being added, removed, or renumbered? If so, what are the new rules?
   - Is the Status changing? If so, to what? (e.g. `🔄 In progress`, `✅ Complete`)
   - Is there anything that should *not* change?
5. **Apply the edits** — update only the sections the creator identified. Leave all other sections exactly as they are.
6. **Bump the version** using semver:
   - Patch (0.0.x): typos, wording clarifications, no structural change.
   - Minor (0.x.0): new or removed content within an existing section, new/removed Business Rules.
   - Major (x.0.0): scope changes, new sections, breaking restructuring.
7. **Show the full updated doc** to the creator and wait for explicit approval. If further changes are requested, apply them and bump the patch version again.
8. After approval, check whether the change affects the linked implementation plan at `docs/implementation-plan/$ARGUMENTS-*.md`:
   - If the plan exists and the UC change introduces new/removed business rules, steps, or scope — flag this to the creator and ask if the plan also needs updating. Do not modify the plan automatically.
   - If there is no plan yet, no action needed.
9. Stop. The updated doc is saved and ready.
