## Problème

Quand le personnage avance, il apparaît en l'air au lieu de rester au sol.

Ce que montre l'analyse des feuilles de sprites (mesure alpha réelle, frame par frame) :

```text
idle   (4 frames) : silhouette haute de 72 px, pieds à y=102 sur toutes les frames
walk   (6 frames) : silhouette de 33-34 px, pieds à y = 81, 127, 82, 83, 81, 82
attack (5 frames) : silhouette de 27-40 px, pieds à y = 82, 82, 83, 82, 82
```

Deux constats :
- Les dessins de marche sont incohérents entre eux : la frame 2 est dessinée 45 px plus bas que les autres dans sa cellule.
- La table `METRICS` codée en dur dans `src/game/entities/Player.ts` ne correspond pas exactement aux mesures (`charH: 35` au lieu de 33/34, `footY` décalés d'un pixel), et la normalisation qui en découle décale le personnage verticalement en marche.

## Correctif

1. **Mesurer les métriques automatiquement au chargement** (nouveau module `src/game/spriteMetrics.ts`)
   - Au boot, pour chaque feuille chargée, lire les pixels de la texture Phaser et calculer, par frame : haut, bas (pieds), gauche, droite de la silhouette.
   - Stocker le résultat dans une table accessible par clé de texture + index de frame.
   - Plus aucune valeur codée en dur : si un sprite est remplacé sur GitHub, l'alignement suit automatiquement.

2. **Aligner le héros sur ces mesures** (`src/game/entities/Player.ts`)
   - Supprimer la constante `METRICS`.
   - `alignBody()` utilise l'échelle de référence de l'animation idle (silhouette de 72 px → 130 px monde) pour **toutes** les animations, au lieu de re-normaliser chaque animation : le personnage garde la même stature et la marche cesse de « grandir » artificiellement.
   - L'origine verticale est fixée sur la ligne de pieds mesurée de la frame courante, donc les pieds restent collés au sol même sur la frame décalée.
   - Hitbox physique constante (largeur/hauteur en pixels monde), indépendante de la frame, pour éviter tout rebond ou décalage Arcade.

3. **Même traitement pour les ennemis** (`src/game/entities/Enemy.ts`)
   - Appliquer l'alignement mesuré aux Pénitents et Suppliants pour supprimer les mêmes flottements/enfoncements sur leurs animations.

4. **Vérification**
   - Test Playwright : lancer le jeu, marcher vers la droite, capturer plusieurs frames et comparer la position du bas du personnage par rapport au sol, en idle, en marche et en attaque.

## Détails techniques

- Lecture des pixels via `scene.textures.getPixelAlpha(x, y, key, frameIndex)` (coûteux uniquement au boot, exécuté une seule fois par feuille, avec échantillonnage par colonnes/lignes pour rester rapide).
- Échelle héros : `scale = 130 / charH(idle)`, constante ; ainsi seule l'origine varie par frame.
- Hitbox : `body.setSize(w/scale, h/scale, false)` puis offset calculé depuis la ligne de pieds mesurée.
