---
name: clean-code
description: Review code for clean code compliance based on standards from Google, Vercel, Convex, Prisma, Stripe, and Linear. Checks naming conventions, function design, type safety, error handling, comments, module structure, duplication, and security. Use when the user asks to review code quality, check clean code standards, audit a file, or ensure code meets professional standards. Triggers on "clean code", "code quality", "review my code", "check this code", "is this clean", "code standards", "audit".
---

# Clean Code Review

Analyse le code contre les standards publiés par Google, Vercel, Convex, Prisma, Stripe et Linear. Produit un rapport catégorisé par sévérité avec des fixes précis.

## Arguments optionnels

- **`[fichier ou glob]`** — Cible spécifique. Ex: `/clean-code src/api/users.ts` ou `/clean-code src/**/*.ts`
- **Sans argument** — Analyse les changements du branch courant (`git diff main...HEAD`)
- **`--fix`** — Applique automatiquement les fixes low-risk après le rapport

---

## Phase 1 — Identifier le code à analyser

Si un argument est fourni → lire les fichiers ciblés.

Si pas d'argument :
```bash
git diff main...HEAD --name-only
```
Si aucun changement vs main :
```bash
git diff HEAD --name-only
```
Lire les fichiers identifiés. Si plus de 10 fichiers, prioriser par taille de diff.

---

## Phase 2 — Contexte codebase

Avant d'analyser, comprendre les conventions existantes du projet :

1. **Lire 2-3 fichiers similaires** au code analysé (même domaine, même type) pour extraire :
   - Style d'imports (named/default, ordering)
   - Pattern d'error handling utilisé
   - Conventions de nommage réelles du projet
   - Pattern d'auth/sécurité

2. **Vérifier les configs** si présentes : `eslint.config.*`, `tsconfig.json`, `biome.json`

> But : distinguer une violation réelle des clean code standards vs une convention locale délibérée.

---

## Phase 3 — Analyse parallèle (8 dimensions)

Spawner des subagents parallèles pour analyser chaque dimension. Chaque agent reçoit le code complet à analyser + le contexte extrait en Phase 2.

### Agent 1 — Naming & Readability
Vérifie :
- **Classes/Types/Interfaces/Enums** : `UpperCamelCase` (Google TS Style)
- **Variables/Fonctions/Méthodes** : `lowerCamelCase`
- **Constantes globales** : `CONSTANT_CASE`
- **Booléens** : préfixe `is`, `has`, `can`, `should` obligatoire
- **Abréviations** : traiter comme mots entiers (`loadHttpUrl` pas `loadHTTPURL`)
- **Noms vagues** : `data`, `info`, `temp`, `obj`, `item` → nommer précisément
- **Magic strings/numbers** : extraire en constante nommée
- **Noms trop courts** : variables < 3 chars hors boucles scoped (i, j, k OK)

### Agent 2 — Function Design
Vérifie :
- **Responsabilité unique** : une fonction = une chose (test : peut-on la décrire sans "et" ?)
- **Taille** : fonctions > 40 lignes → signaler, > 80 lignes → bloquant
- **Return type explicite** : toutes les fonctions exportées doivent typer le retour
- **Flag parameters** : `doThing(true)` interdit → nommer ou séparer
- **Niveau d'abstraction** : tout le code d'une fonction au même niveau
- **Paramètres** : > 3 params → utiliser un objet de config
- **Fonctions pures** : éviter side effects cachés, les documenter si nécessaires

### Agent 3 — Type Safety
Vérifie (TypeScript) :
- **`any`** : interdit → utiliser `unknown` + type guard, ou type précis
- **`as` assertions** : suspect → vérifier si évitable avec type guard
- **Types dupliqués** : utiliser `Pick`, `Omit`, `Partial`, `Required`, `ReturnType`
- **Discriminated unions** : préférer à `type | undefined` pour états complexes
- **Génériques inutilisés** : un type param doit être référencé au moins 2 fois
- **`Readonly`** : données qui ne changent pas doivent être `readonly`
- **`null` vs `undefined`** : choisir l'un, pas mixer les deux patterns

### Agent 4 — Error Handling
Vérifie :
- **Bare `throw new Error("string")`** dans la business logic → utiliser custom error class ou Result type
- **`catch (e) {}`** vide : interdit — loguer ou rethrow
- **`try/catch` dans hot loops** : performance issue → validate-first pattern
- **Erreurs user-facing** : doivent avoir `code` + `message` + `statusCode` (pas juste un string)
- **`Promise.all` avec échecs possibles** : préférer `Promise.allSettled` si partial failure acceptable
- **Erreurs silencieuses** : tout path d'erreur doit être explicite

Custom error class pattern (référence) :
```typescript
class DomainError extends Error {
  constructor(message: string, public readonly code: string, public readonly statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

Result pattern (référence) :
```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
```

### Agent 5 — Comments & Documentation
Vérifie :
- **Fonctions/classes exportées** : JSDoc `/** ... */` obligatoire (Vercel Conformance)
- **Commentaires redondants** : `// Increment counter` au-dessus de `counter++` → supprimer
- **Commentaires "quoi"** : décrire le WHY, jamais le WHAT (le code dit le WHAT)
- **TODO sans ticket** : `// TODO` sans référence → `// TODO(#123):`
- **Commentaires datés/faux** : plus dangereux qu'aucun commentaire
- **JSDoc format** : avant les decorators, pas entre

### Agent 6 — Module Structure & Imports
Vérifie :
- **Circular imports** : interdit (Vercel Conformance)
- **Default exports** : éviter pour les modules réutilisables (discovery difficile)
- **Organisation feature-based** : pas layer-based (`users/` regroupe query + types + utils, pas `queries/user`, `types/user`)
- **Helpers wrapper existants** : si `lib/api.ts` ou `lib/fetch.ts` existe → ne pas raw-fetcher
- **Import ordering** : 1. node_modules 2. internal aliases 3. relative — séparer par ligne vide
- **Barrel files** : utiliser avec précaution (tree-shaking impact)

### Agent 7 — Code Duplication
Vérifie :
- **Blocs identiques > 5 lignes** : extraire en fonction
- **Types dupliqués** : utiliser utility types TypeScript
- **Helpers réimplémentés** : si une util similaire existe dans le codebase → utiliser celle-là
- **Patterns copy-paste** : même structure répétée 3+ fois → abstraction
- **String literals répétées** : constante ou enum

### Agent 8 — Security & Validation
Vérifie :
- **Secrets hardcodés** : API keys, passwords, tokens en dur → variables d'env
- **Inputs non validés** : toute entrée externe (body, params, env) doit être validée/parsée (zod, etc.)
- **SQL/NoSQL injection** : concaténation de strings dans des queries → parameterized
- **`eval()` / `Function()`** : interdit
- **`dangerouslySetInnerHTML`** sans sanitization : bloquant
- **Authorization check** : toute route/mutation privée vérifie l'identité, pas juste l'authentification

---

## Phase 4 — Rapport

Synthétiser les résultats de tous les agents dans ce format :

```
## Clean Code Report — [nom du fichier ou "branch diff"]
Analysé le: [date]  |  Fichiers: N  |  Lignes: N

### 🔴 BLOQUANT (N issues)
Issues qui compromettent la sécurité, la correctness, ou la maintenabilité critique.
Doit être corrigé avant merge.

[fichier:ligne] **[catégorie]** — Description précise
→ Fix : code exact ou approche

### 🟡 IMPORTANT (N issues)
Violations des standards clean code qui dégradent la qualité sur le long terme.
Corriger dans ce sprint.

[fichier:ligne] **[catégorie]** — Description précise
→ Fix : code exact ou approche

### 🔵 SUGGESTION (N issues)
Améliorations de lisibilité ou cohérence. Non bloquantes.

[fichier:ligne] **[catégorie]** — Description précise
→ Fix : code exact ou approche

### ✅ Respecté
- [liste des dimensions sans issues]

---
Score estimé : X/10
Effort fix bloquants : ~Xmin
```

**Règles du rapport :**
- Citer le fichier + numéro de ligne exact pour chaque issue
- Proposer le fix précis (pas juste "rename this") — montrer le code corrigé
- Si une déviation du standard est une convention locale délibérée du projet → noter comme INFO, pas comme issue
- Ne pas signaler ce qu'ESLint/TypeScript/Prettier enforce déjà automatiquement (sauf si la config est absente)

---

## Phase 5 — Fix (si `--fix` ou si l'utilisateur accepte)

Après le rapport, proposer d'appliquer les fixes :
- **Auto-apply** : issues Naming, Comments redondants, Import ordering — low risk
- **Propose + confirm** : Error handling redesign, Type changes — structural changes
- **Never auto-apply** : Security issues, Architecture changes — toujours confirmer

Appliquer avec Edit tool, un fichier à la fois. Après chaque fichier : re-lire pour vérifier.

---

## Standards de référence

| Dimension | Source principale |
|-----------|------------------|
| Naming | Google TypeScript Style Guide, ts.dev |
| Function design | Google Engineering Practices, Clean Code |
| Type safety | TypeScript Handbook, Convex best practices |
| Error handling | Convex, Plain.com, TypeScript community |
| Comments | Google TS Style, Vercel Conformance |
| Module structure | Vercel Conformance, tRPC/Theo patterns |
| Duplication | TypeScript utility types, DRY principle |
| Security | Stripe best practices, Convex, OWASP |
