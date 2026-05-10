---
name: Design system DNGBlog
description: Charte graphique du projet analysée et documentée pour éviter toute dérive de style
type: project
originSessionId: c3fc216b-6984-421a-87d4-74140ec670b5
---
Le design a été analysé et documenté dans `.claude/rules/design.md`.

**Why:** Le projet a une identité visuelle forte (angles droits, ombres 3D, bordures pointillées, palette noir/blanc stricte) qu'il ne faut pas altérer accidentellement lors de l'ajout de nouvelles fonctionnalités.

**How to apply:** Toujours lire `.claude/rules/design.md` avant d'écrire du HTML/CSS ou des composants Vue. Ne jamais ajouter de `rounded-*` (sauf `rounded-none`), ne jamais utiliser `UButton`/`UInput` directement, toujours respecter le triple shadow et les variables CSS définies.
