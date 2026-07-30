## Objectif

Ajouter dans le corridor un élément de décor animé : une grosse veine charnue qui court sur toute la longueur du couloir, qui gonfle et se rétracte par pulsations, et qui passe **derrière** les statues pleureuses.

## Ce qui sera fait

**1. Nouvel asset**
- `public/assets/sprites/props/corridor_vein.png` : une veine horizontale tuilable (bords gauche/droit alignés) en chair sombre, rouge sang veiné, avec ramifications qui plongent dans la pierre. Fond transparent.

**2. Nouveau fichier `src/game/effects/CorridorVein.ts`**
- `tileSprite` de la largeur de la salle (2400 px), posé à hauteur de mur (environ un tiers au-dessus de la ligne de sol), origine gauche.
- Animation de battement : tween en boucle yoyo sur `tileScaleY` / `scaleY` (gonflement ~1.0 → 1.18) plus légère variation d'alpha et de teinte, période irrégulière (~1,6 s) pour un rythme organique de cœur.
- Deuxième passe décalée en phase (petite veine secondaire plus fine, plus lente et plus sombre) pour éviter l'effet mécanique.
- Optionnel léger décalage `tilePositionX` très lent pour un flux interne.

**3. Profondeur (l'important)**
- Fond du corridor : depth `-30`. Statues : depth `-20`.
- La veine sera placée à depth `-25` : donc **devant le mur peint, derrière les statues** et derrière le héros.

**4. Branchements**
- `BootScene.ts` : chargement de `corridor-vein`.
- `GameScene.ts` : instanciation uniquement quand `backdropKey === "corridor"`, à côté des statues, et appel de la mise à jour dans la boucle si nécessaire (sinon tout est géré par tweens, coût nul par frame).

## Notes techniques
Pas de particules supplémentaires ni de logique de jeu : purement décoratif, aucun impact sur les collisions, le combat ou les performances (un seul tileSprite + tweens).
