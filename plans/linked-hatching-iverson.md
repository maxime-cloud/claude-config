# Plan: Add `--team` flag to `/code` skill

## Context

L'utilisateur veut enrichir le skill `/code` avec un mode équipe autonome. Quand `--team` est passé, après validation du plan, au lieu d'exécuter directement, Claude crée une équipe d'agents, distribue les tâches du plan, et coordonne l'exécution jusqu'à complétion — sans intervention manuelle.

---

## Fichier à modifier

`/home/Maxime/.claude/skills/code/SKILL.md` — fichier unique, aucun autre fichier touché.

---

## Changements

### 1. Mention du flag en haut du fichier

Après le paragraphe d'intro, ajouter une ligne :

```
**Flag optionnel :** `--team` — Délègue l'exécution à une équipe d'agents autonomes après validation du plan.
```

### 2. Fin de Phase 2 — branchement conditionnel

Après "Wait for user validation", ajouter :

```
**Si `--team` est passé :** Passer en **Teams Mode** (ci-dessous) au lieu de Phase 3.
**Sinon :** Continuer vers Phase 3 : Execute.
```

### 3. Nouvelle section "Teams Mode"

Insérer entre Phase 2 et Phase 3. Workflow complet :

#### Step 1 — Créer l'équipe
```
TeamCreate({ team_name: "<kebab-feature>", description: "<task>" })
```

#### Step 2 — Créer les tâches depuis le plan
- Une `TaskCreate` par étape du plan validé
- Chaque tâche a : subject (titre de l'étape), description (détails complets)
- Ajouter les dépendances avec `TaskUpdate({ addBlockedBy: [...] })` en miroir de l'ordre d'exécution du plan
- Créer une tâche finale "Verify implementation" bloquée par toutes les tâches dev

#### Step 3 — Spawner les agents
Analyser le graphe de tâches, regrouper en streams parallèles indépendants :
- 1 agent `dev-N` (general-purpose) par stream, via `Agent({ team_name, name: "dev-N", ... })`
- 1 agent `verifier` (general-purpose) pour la tâche de vérification finale
- Prompt de chaque dev : checker TaskList, claim les tâches non bloquées, travailler, marquer completed, notifier le team lead quand terminé
- Prompt verifier : attendre que sa tâche soit débloquée, lancer tsc/linter/tests, corriger les issues, marquer completed

#### Step 4 — Assigner les premières tâches
`TaskUpdate({ taskId: "...", owner: "dev-N" })` pour chaque agent

#### Step 5 — Coordonner
- Répondre aux messages des teammates quand ils terminent des tâches
- Assigner les nouvelles tâches débloquées aux agents idle
- Aider si un agent est bloqué

#### Step 6 — Shutdown
Quand TaskList montre tout completed :
1. `SendMessage({ to: "<name>", message: { type: "shutdown_request" } })` pour chaque teammate
2. `TeamDelete`
3. Rapport à l'utilisateur : ce qui a été construit, par qui, problèmes rencontrés

---

## Vérification

Tester manuellement avec :
```bash
/code --team add a simple utility function
```
Vérifier que :
- La mention `--team` apparaît bien en haut du skill
- Le branchement s'active après validation du plan
- `TeamCreate` → `TaskCreate` x N → `Agent` x N → coordination → `TeamDelete` s'enchaînent correctement
