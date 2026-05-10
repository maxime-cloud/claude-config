---
name: code
description: Structured feature implementation workflow using Explore → Plan → Execute → Verify. Use this skill whenever the user asks to implement a feature, add functionality, fix a bug, refactor code, or make any substantial code changes. Triggers on phrases like "implement X", "add feature Y", "build Z", "fix the bug in", "create a component", "I need X to work", "make it so that", or any request to write or modify code. Also triggers when the user describes a desired behavior or outcome they want to achieve through code changes. Use this skill proactively — if the user wants code written or changed, run this skill. Even for seemingly simple requests, the explore phase prevents wasted effort from wrong assumptions.
---

# Code — Structured Implementation Workflow

Four phases: **Explore → Plan → Execute → Verify**. The explore phase is non-negotiable — it prevents you from implementing against stale assumptions about the codebase or outdated library APIs.

**Flag optionnel :** `--team` — Après validation du plan, délègue l'exécution à une équipe d'agents autonomes au lieu d'exécuter directement. Voir **Teams Mode** ci-dessous.

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

**Wait for user validation before proceeding.**

- **Si `--team` est passé :** Passer en **Teams Mode** (ci-dessous) au lieu de Phase 3.
- **Sinon :** Continuer vers Phase 3 : Execute.

---

## Teams Mode (si `--team` est actif)

Remplace Phase 3 + Phase 4. S'exécute de façon entièrement autonome après validation du plan.

### Step 1 — Créer l'équipe

```
TeamCreate({ team_name: "<kebab-feature-name>", description: "<task description>" })
```

### Step 2 — Créer les tâches depuis le plan

Une `TaskCreate` par étape du plan validé :

```
TaskCreate({ subject: "<titre étape>", description: "<détails complets de l'étape>" })
```

Puis configurer les dépendances avec `TaskUpdate` pour reproduire l'ordre d'exécution du plan :

```
TaskUpdate({ taskId: "N", addBlockedBy: ["M"] })
```

Créer aussi une tâche finale de vérification, bloquée par toutes les tâches dev :

```
TaskCreate({ subject: "Verify implementation", description: "Run tsc --noEmit, linter, tests. Trace execution paths. Fix any issues found." })
TaskUpdate({ taskId: "<verify-id>", addBlockedBy: ["<all-dev-task-ids>"] })
```

### Step 3 — Spawner les agents

Analyser le graphe de tâches et regrouper en streams parallèles indépendants. Spawner :
- 1 agent `dev-N` (general-purpose) par stream via `Agent({ subagent_type: "general-purpose", team_name: "<team-name>", name: "dev-N", prompt: "..." })`
- 1 agent `verifier` (general-purpose) pour la tâche de vérification finale

Prompt type pour les agents dev :
> Tu es dev-N dans l'équipe `<team-name>`. Vérifie TaskList, claim les tâches non bloquées (owner = "dev-N"), travaille dessus, marque-les completed. Répète jusqu'à ce qu'il n'y ait plus de tâches disponibles pour toi. Envoie un message au team lead quand tu as terminé.

Prompt type pour le verifier :
> Tu es le verifier dans l'équipe `<team-name>`. Attends que ta tâche soit débloquée, puis lance tsc --noEmit, le linter, et les tests. Corrige les issues trouvées. Marque la tâche completed et notifie le team lead.

### Step 4 — Assigner les premières tâches

```
TaskUpdate({ taskId: "<first-task-id>", owner: "dev-N" })
```

### Step 5 — Coordonner

- Répondre aux messages des teammates quand ils terminent des tâches
- Assigner les tâches nouvellement débloquées aux agents idle via `TaskUpdate`
- Aider si un agent est bloqué ou a besoin de contexte

### Step 6 — Shutdown

Quand `TaskList` montre toutes les tâches `completed` :

1. Envoyer `SendMessage({ to: "<name>", message: { type: "shutdown_request" } })` à chaque teammate
2. Appeler `TeamDelete`
3. Reporter à l'utilisateur : ce qui a été construit, par quels agents, et tout problème rencontré

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
