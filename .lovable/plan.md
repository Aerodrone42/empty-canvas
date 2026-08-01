## Constat

En inspectant `floor_torch_flame_spritesheet.png`, chaque vignette contient encore **la couronne métallique du brasero** (les pointes claires en bas de chaque frame), en plus du feu. Comme les 10 vignettes de la planche de référence ont été rendues indépendamment, cette couronne n'est pas identique au pixel près d'une frame à l'autre : en animation, c'est elle qui tremble autour de la flamme.

Le socle statique, lui, est correct et ne bouge pas.

## Plan

1. **Régénérer `floor_torch_flame_spritesheet.png` avec un masque strictement chromatique**
   - Ne conserver que les pixels réellement en feu : teinte orange/rouge/jaune (rouge dominant, saturation élevée, luminance élevée).
   - Éliminer tous les pixels gris/métalliques/bruns sombres (là où R ≈ V ≈ B, ou saturation faible) — c'est ce qui supprime la couronne et les éclats de fer.
   - Nettoyage des pixels isolés (petit filtre de taille de composante) pour éviter les points parasites blancs visibles autour des flammes actuelles.
   - Léger adoucissement du canal alpha en bordure pour éviter l'aliasing dur.

2. **Régénérer `floor_torch_base.png` en y intégrant la couronne**
   - La couronne + les pointes appartiennent au socle : les inclure dans l'image fixe pour qu'elles restent parfaitement immobiles.
   - Prendre la frame de référence à flamme la plus faible pour minimiser la lumière projetée figée sur le métal.

3. **Recaler l'ancrage dans `src/game/effects/FloorTorch.ts`**
   - Ajuster `FLAME_H` / la position `topY` pour que la base du feu se pose sur la lèvre de la vasque désormais incluse dans le socle.
   - Aucun changement de logique d'animation : la boucle repos + sursaut restent en place.

4. **`BootScene.ts`** : mettre à jour `frameWidth` / `frameHeight` de la spritesheet de flamme si le recadrage change les dimensions.

5. **Vérification** : capture en jeu pour confirmer que le métal est strictement immobile et que seules les langues de feu vivent.

## Détails techniques

Masque de feu appliqué par pixel (Python/PIL) :
- garder si `R > 90` et `R - B > 45` et `max(R,G,B) > 100`
- rejeter si `max-min < 40` (gris/métal)
- alpha proportionnel à l'intensité du rouge pour un fondu naturel des bords
