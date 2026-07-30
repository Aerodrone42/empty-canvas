## Ce qui cloche aujourd'hui (vérifié dans le code)

1. **Le plancher « descend » quand on saute** — `GameScene.create()` fait `startFollow(player, true, 0.1, 0.1, 0, 120)` : la caméra suit aussi le héros en **vertical**. Or les calques de décor sont fixés à l'écran (`setScrollFactor(0)` dans `Parallax`). Résultat : au saut, le sol de collision et les ennemis montent/descendent alors que le décor reste immobile — l'impression que le plancher s'abaisse.
2. **Le décor suit le personnage** — mêmes `scrollFactor(0)` : les trois calques (peinture lointaine, piliers, cadre rocheux) sont collés à la caméra. Le cadre proche (`near`) ne bouge jamais et les piliers se répètent à l'identique, donc on a toujours exactement la même image sous les yeux.
3. **La bande marron en bas** — c'est `Parallax.addApron()` : 10 rectangles unis empilés sous la ligne de sol, parce que la ligne de sol du décor (`floorScreenY`) tombe au-dessus du bas du viewport (salle 900 px de haut pour 540 px visibles). Aucune texture, d'où l'aplat.
4. **La régénération** — il n'existe aujourd'hui que l'absorption de Chair (25 Chair → 20 PV) et les fioles. Les flaques (`BloodFX.stain`) sont purement décoratives et permanentes (plafond de 60).

## Corrections prévues

### A. Caméra et sol
- Suivi **horizontal uniquement** : `startFollow` avec lerpY à 0 et `scrollY` verrouillé en bas de salle (deadzone verticale nulle). Le héros peut sauter sans que l'image bouge.
- Ramener la ligne de sol jouable au niveau de la ligne de sol du décor pour le viewport 960x540 : la géométrie de collision et le `floorScreenY` du décor deviennent le même repère, calculé une seule fois et partagé (constante exportée) au lieu d'être recalculée dans deux fichiers.

### B. Suppression de la bande marron
- Suppression complète de `addApron()`.
- Le bas de l'écran est occupé par une **bande de dallage réelle** : on découpe le bas de la texture `mid` (ou `far`) en `tileSprite` répété horizontalement, assombri par un dégradé léger, au lieu d'aplats de couleur. Si la ligne de sol tombe pile en bas du viewport après le point A, cette bande est simplement inutile et on ne dessine rien.

### C. Décor réellement ancré dans la salle
- Calques `far` et `mid` gardent la parallaxe (défilement de `tilePositionX`) mais avec des vitesses plus contrastées (0.15 / 0.55) pour que l'avancée se ressente.
- Le cadre proche (`near`) passe en **objet du monde** posé aux extrémités de la salle (rochers à gauche et à droite) au lieu d'une vignette collée à l'écran : quand on avance, on le quitte vraiment.
- Le calque `mid` est décalé aléatoirement au démarrage et sa répétition brisée par quelques éléments ponctuels (lanternes/piliers déjà présents dans les torchères) afin d'éviter l'effet « même image en boucle ».

### D. Régénération par le sang au sol
- `BloodFX.stain()` enregistre chaque flaque avec un horodatage et une **durée de vie de 10 s** (fondu de sortie sur les 2 dernières secondes), remplaçant le plafond fixe de 60 taches.
- Nouvelle méthode `BloodFX.poolAt(x)` : renvoie la flaque active la plus proche sous le héros.
- Dans `GameScene.update()`, si le héros est **au sol, dans une flaque active, et hors combat** (rayon de sécurité déjà existant), il **régénère progressivement** (~6 PV/s) ; la flaque se consomme et s'estompe au fur et à mesure. Un halo rouge discret + le HUD existant (vignette / barre Vitalité) signalent la régénération.
- L'absorption de Chair reste inchangée ; les deux moyens de soin coexistent.

## Détails techniques

- `src/game/scenes/GameScene.ts` : `startFollow(player, true, 0.12, 0, 0, 0)` + `cameras.main.setScroll` vertical fixe ; branchement de la régénération dans `update()`.
- `src/game/effects/Parallax.ts` : suppression de `addApron`, `near` en world-space (`scrollFactor 1`), vitesses revues, bande de dallage tuilée.
- `src/game/effects/Blood.ts` : structure `{ ellipse, bornAt, charge }`, purge temporelle dans un `tick(time)` appelé depuis la scène, API `poolAt`.
- `src/game/effects/Lighting.ts` : les torchères sont déjà en coordonnées monde, rien à changer ; vérification que le halo héros reste sous les entités.
- Contrôle visuel final via captures d'écran du jeu (saut, déplacement long, mort d'un ennemi puis régénération sur la flaque).
