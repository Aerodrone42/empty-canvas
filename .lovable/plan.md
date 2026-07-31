## Problème

Sur la capture, à l'endroit des flèches, on voit une marche nette : le fût s'arrête et la base commence avec une largeur différente, sans transition.

Dans `src/game/effects/GateColumn.ts` :
- le fût fait `SHAFT_W = 112` px de large, la base `BASE_W = 150` px : la différence de 38 px crée une arête franche au raccord ;
- le fût est un `TileSprite` : son motif se coupe brutalement en bas (`shaftBottom = baseTopY + 24`), sans correspondance avec le haut sculpté de la base ;
- la base est dessinée **par-dessus** le fût (depth 21 vs 20), donc la coupe est visible comme un bord horizontal net.

## Correction (uniquement `src/game/effects/GateColumn.ts`)

1. **Chapiteau de transition** : insérer un court tronçon de fût évasé entre le fût droit et la base — un second `TileSprite` (ou une copie du fût) de ~70 px de haut, dont le `scaleX` passe progressivement de la largeur du fût à celle de la base, pour que l'élargissement soit graduel au lieu d'une marche.

2. **Recouvrement accru** : faire descendre le fût plus profondément dans la base (chevauchement porté de 24 px à ~60 px) pour que la coupe du motif tombe derrière la partie sculptée pleine de la base, jamais à l'air libre.

3. **Adoucissement du bord** : ajouter un dégradé sombre (rectangle ou image tintée en `MULTIPLY`, alpha faible) sur ~40 px à la jonction, pour fondre les deux textures et éliminer la ligne visible.

4. **Alignement du décalage de texture** : caler `tilePositionY` du fût pour que le motif de pierre se termine sur une rangée complète au niveau du raccord, et appliquer le même calage au calque rouge `glowShaft` afin que les viscères restent continus sur la jonction.

5. **Viscères continus** : prolonger le calque de veines du fût jusque sur le haut de la base pour que la spirale rouge traverse la jonction sans interruption (comme sur l'image de référence).

## Détails techniques

- Fichier touché : `src/game/effects/GateColumn.ts` uniquement.
- Aucun changement d'asset, de position `x`, de `floorY`, ni de profondeurs globales (20-23) ; le nouveau tronçon s'insère entre les depths existants.
- Le système de gouttes (`fx-drip`) et la logique `open()` restent inchangés.
