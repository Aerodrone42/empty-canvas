## Problème constaté (capture)

1. Le chevalet occupe presque tout l'écran : le bâti fait ~620 px de large mais le supplicié rendu par-dessus déborde bien au-delà, il est plus haut que le héros entier.
2. Le supplicié est mal dessiné : anatomie difforme, tête surdimensionnée, couleurs plates, il ne ressemble pas au reste du pixel art.
3. L'écartèlement ne se lit pas : le corps est simplement étiré en `scaleX` puis remplacé d'un coup par une texture déchirée. Aucune progression visible, pas de tension de chaînes, pas de rotation de roues.

## Correctifs

### 1. Échelle du dispositif
- `RACK_W` : 620 → **420 px**, soit une machine de la hauteur d'environ 1,5 héros, plaquée au mur.
- Supplicié recalé en proportion du bâti (largeur ≈ 0,55 × bâti) et posé exactement sur la ligne de table, plus au-dessus.
- Bourreaux repositionnés aux extrémités du nouveau gabarit, échelle réduite pour rester massifs sans écraser le décor.

### 2. Nouveau supplicié
Régénération d'un **spritesheet 6 frames** `torture_rack_victim_spritesheet.png` (au lieu des deux images fixes intact/déchiré) : homme charnu vu de dessus/trois-quarts, sanglé aux poignets et chevilles, pixel art cohérent avec les ennemis existants, palette bordeaux/chair sale.

```text
f0 repos    f1 tension  f2 étirement  f3 craquement  f4 déchirure  f5 corps rompu
```

Suppression de `torture_rack_victim_intact.png` et `torture_rack_victim_torn.png`.

### 3. Écartèlement lisible
Séquence retravaillée dans `TortureRack.ts`, jouée par crans plutôt qu'en une seule interpolation :

```text
[approche]  les bourreaux se calent, chaînes qui se tendent, grincement
[cran 1]    roues +1 cran, frame f1, secousse courte, cri
[cran 2]    roues +1 cran, frame f2, corps allongé de ~8 %
[cran 3]    roues +1 cran, frame f3, tremblement caméra continu
[rupture]   frame f4 → f5, gerbe de sang, gros shake, chaînes qui claquent
[retour]    la machine vibre, le sang goutte, puis les bourreaux lâchent
```

- Chaque cran dure ~450 ms avec un temps mort, pour que l'œil suive.
- L'allongement total reste modeste (≈ 20 %) mais accompagné du changement de frame : c'est le dessin qui porte l'effet, pas le `scaleX`.
- Ajout d'un léger zoom/recentrage caméra pendant la séquence pour attirer le regard.

## Détails techniques

- `src/game/scenes/BootScene.ts` : remplacer les deux `load.image` victime par un `load.spritesheet` sur le nouveau fichier.
- `src/game/effects/TortureRack.ts` : `RACK_W = 420`, victime en `Sprite` avec `setFrame()`, machine d'états à crans (`Phaser.Time.TimelineEvent` ou `delayedCall` chaînés), tension de chaînes via petits décalages `x` des bourreaux à chaque cran.
- `src/game/scenes/GameScene.ts` : inchangé hormis vérification que `TORTURE_RACK_X = 1320` reste dégagé avec la machine plus étroite.
