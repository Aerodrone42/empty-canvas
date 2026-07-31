## Problème

Chaque case du spritesheet `public/assets/sprites/props/flesh_blob_spritesheet.png` est coupée net en bas et sur les côtés : la flaque de chair est tronquée par un bord horizontal droit sur toute la largeur, ce qui donne cette « dalle » rectangulaire visible au sol dans le corridor.

## Correctif

1. **Retouche du spritesheet (Python/PIL)** — traiter chaque frame indépendamment :
   - éroder les coins bas-gauche / bas-droit avec un masque elliptique doux, pour que la flaque se termine en pointe organique au lieu d'un angle droit ;
   - ajouter un dégradé d'alpha sur les ~18 dernières lignes de pixels (fondu vers 0), avec un léger bruit horizontal pour éviter une ligne parfaitement droite ;
   - conserver la grille (même largeur/hauteur de cellule, même alignement bas) pour ne rien casser côté animation.

2. **Ombre de contact** dans `src/game/effects/FleshBlob.ts` — ajouter une ellipse sombre très diffuse (mode `MULTIPLY`, alpha faible) sous le blob, légèrement plus large que lui, afin d'ancrer la masse au sol et de masquer la limite basse restante. Elle suit la pulsation du blob.

3. **Vérification** — relancer le script Playwright existant sur la salle corridor et comparer la capture : plus aucun bord droit visible sous les amas.

## Détails techniques

- Le spritesheet fait 8 frames ; le traitement s'applique frame par frame pour éviter les bavures entre cellules.
- Aucun changement de dimension de cellule → `BootScene.ts` et l'animation restent inchangés.
