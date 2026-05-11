---
name: strike-uc
description: Run the full use case workflow for the argument (e.g. `uc-01`): plan, get approval, then implement.
argument-hint: "[uc-XX]"
disable-model-invocation: true
---

Run the full use case workflow for the argument (e.g. `uc-01`): plan, get approval, then implement.

This skill is a convenience wrapper that runs both planning and execution in sequence:
1. Run `/plan-uc $ARGUMENTS` — interview the creator, write the implementation plan, update the API spec, and wait for approval at each step.
2. Run `/exec-plan $ARGUMENTS` — implement backend + frontend, write E2E tests, verify, create a PR, and mark the UC complete.

To run the phases separately (e.g. plan today, implement tomorrow), use `/plan-uc` and `/exec-plan` directly.
