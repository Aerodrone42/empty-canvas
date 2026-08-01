## Objectif

Archiver la bible narrative « Sanguine Vigile : Les Neuf Cercles » dans le projet pour pouvoir y puiser à chaque étape, sans toucher au jeu maintenant.

J'ai déjà lu le document : ~60 000 caractères, structuré en postulat, arc du protagoniste en 6 actes, les neuf cercles de Dante en 100 niveaux, Mère-Suture révélée comme geôlière de Lucifer, système de choix moral (achever/épargner) menant à deux fins, le Phlégéthon comme cœur thématique.

## Ce que je vais faire

1. **`docs/bible-narrative.md`** — conversion Markdown complète et fidèle du document, versionnée dans le dépôt (donc récupérable sur ton GitHub). C'est la source de vérité que je relirai à chaque demande.
2. **`docs/bible-index.md`** — un sommaire court : liste des cercles, des niveaux, des boss, des personnages et des mécaniques annoncées, avec renvois vers les sections de la bible. Ça me permet de retrouver instantanément la bonne partie sans relire 60 000 caractères à chaque fois.
3. **Pointeur d'asset vers le .docx d'origine** (`src/assets/bible-narrative.docx.asset.json`) pour conserver le fichier source intact sans alourdir le dépôt.
4. **Note dans `AGENTS.md`** : une ligne indiquant que toute évolution narrative/contenu doit se référer à `docs/bible-narrative.md`.

## Ce que je ne fais pas maintenant

Aucune modification du jeu : pas de nouveaux niveaux, pas d'ennemis, pas de refonte du scénario en place. On avancera cercle par cercle, à ta demande.

## Détails techniques

Conversion via `pandoc` (déjà validée), écriture des deux fichiers Markdown, création du pointeur avec `lovable-assets create`. Aucun code applicatif touché, aucun impact sur le build.
