---
name: code
description: Structured feature implementation workflow using Explore → Plan → Execute → Verify. Use this skill whenever the user asks to implement a feature, add functionality, fix a bug, refactor code, or make any substantial code changes. Triggers on phrases like "implement X", "add feature Y", "build Z", "fix the bug in", "create a component", "I need X to work", "make it so that", or any request to write or modify code. Also triggers when the user describes a desired behavior or outcome they want to achieve through code changes. Use this skill proactively — if the user wants code written or changed, run this skill. Even for seemingly simple requests, the explore phase prevents wasted effort from wrong assumptions.
---

# Code — Structured Implementation Workflow

Four phases: **Explore → Plan → Execute → Verify**. The explore phase is non-negotiable — it prevents you from implementing against stale assumptions about the codebase or outdated library APIs.

---

## Phase 1: Explore

Spawn parallel subagents to gather context before writing any code. Don't skip this, even if the task seems straightforward — wrong assumptions here compound into wasted effort later.

### Subagent A: Codebase
Use `subagent_type: explore-codebase`. Ask it to:
- Find files and modules relevant to the feature
- Identify existing patterns to follow (naming, architecture, data flow, error handling style)
- Locate where the new code will integrate
- Find similar implementations already in the codebase

### Subagent B: Library Documentation
For every library, framework, or API touched by this task, fetch current docs using context7 MCP (`resolve-library-id` then `query-docs`). Do **not** rely on training data — APIs change between versions and you will get it wrong. Focus on:
- Exact API signatures and options
- Configuration requirements
- Version-specific behavior
- Known pitfalls in the docs

If context7 doesn't have the library, fall back to `fast-websearch`.

### Subagent C: Web Research (when relevant)
Use `fast-websearch` when:
- The task involves external services or underdocumented behavior
- You need real-world examples or known issues
- The library version is recent enough that training data is unreliable

### Synthesis
After all subagents complete, consolidate findings:
- List the files to modify
- Note the APIs and function signatures to use
- Identify patterns to follow
- Flag any risks, constraints, or open questions

---

## Phase 2: Plan

Enter plan mode with the full context from Phase 1.

Call `EnterPlanMode` and produce a plan covering:
1. **Files to change** — exact paths, what changes in each
2. **New code to add** — functions, components, endpoints, etc.
3. **Integration points** — how new code connects to existing code
4. **Execution order** — dependencies between steps
5. **Edge cases** — error paths, null handling, boundary conditions
6. **Tests** — what to write or update

Be specific. "Update the auth module" is not a plan step. "Add `refreshToken(userId: string)` to `src/auth/service.ts` using the `jwt.sign()` pattern from line 42" is.

**Wait for user validation before proceeding to Phase 3.**

---

## Phase 3: Execute

Work through the plan exactly as validated. No scope creep.

- Follow the patterns found in Phase 1
- Use the exact APIs found in Phase 1 documentation
- If you discover something worth doing that's outside the plan, **note it** but don't act on it
- After each meaningful chunk, one-line status: what's done, what's next

---

## Phase 4: Verify

After implementation, confirm correctness before declaring done.

1. **Types** — run `tsc --noEmit` (or equivalent) and fix all errors
2. **Lint** — run the project linter; fix anything that fails
3. **Tests** — run the test suite; fix any regressions
4. **Logic trace** — read through changed files, trace the execution path mentally — does it hold for the happy path? For error paths?
5. **Imports/exports** — check that all imports resolve and exports are correctly wired

Fix any issues found before reporting done. Tell the user what was verified and flag any warnings they should know about (deprecations, missing tests, known limitations).
