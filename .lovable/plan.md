## Problème

La machine actuelle est une roue verticale avec une victime maigre (lisible comme un squelette) et deux bourreaux humains standard. Ce n'est pas la direction demandée.

## Nouvelle direction

Un **chevalet d'écartèlement horizontal** (type Streckbett), collé contre le mur du fond du corridor, pas au milieu de la pièce.

```text
[ROUE G]===== table de bois =====[ROUE D]
 bourreau            victime            bourreau
   massif        écartelée à plat        massif
```

## Assets à régénérer

Tous les anciens fichiers de torture sont remplacés (roue verticale + victime verticale supprimées).

1. `torture_rack_frame.png` — chevalet vu de face/trois-quarts : poutres massives noircies, deux grandes roues à rochet aux extrémités, chaînes, leviers, câbles tendus, flaque de sang et cordes au sol, traces de lutte. Format large (≈1600x600).
2. `torture_victim_rack_spritesheet.png` — humain **charnu** (pas squelettique), allongé sur la table, poignets et chevilles enchaînés. 8 frames : convulsions → tension → étirement extrême → déchirement → corps rompu.
3. Bourreaux monstrueux, nouveau gabarit élargi (cellule 288x224, ligne de pieds y=214) pour supporter la carrure :
  - `bourreau_idle_spritesheet.png` (4 f) — respiration lourde, épaules énormes
  - `bourreau_crank_spritesheet.png` (6 f) — tirée sur la roue, effort, corps arc-bouté
  - `bourreau_walk_spritesheet.png` (6 f)
  - `bourreau_attack_spritesheet.png` (5 f) — coup de masse à deux bras
  - Design : très grand, bras surdéveloppés, masque de bourreau dechiré, peau sale et corrompue, silhouette quasi bestiale.

## Séquence d'animation

```text
[idle]        les deux bourreaux respirent, la table grince
   | héros < 560 px
[préparation] chacun saisit sa roue, chaînes qui se tendent
[effort]      les roues tournent par crans, la victime s'étire, cris
[impact]      déchirement : gerbe de sang qui gicle, 
[retour]      la machine vibre encore, les chaînes oscillent, sang qui goutte
   | ~1 s
[éveil]       les deux bourreaux lâchent les roues et attaquent le héros
```

## Détails techniques

- `src/game/effects/TortureWheel.ts` → renommé `TortureRack.ts`, réécrit : bâti horizontal ancré contre le mur (`depth -4`), roues gauche/droite en sprites indépendants tournant par crans pendant l'effort, victime allongée avec `scaleX` croissant lors de l'étirement, bourreaux jouant `bourreau-crank` puis `bourreau-idle` avant libération.
- Machine plaquée au mur : `y = FLOOR_Y - 40` avec les bourreaux en avant du bâti mais en retrait du couloir de marche du héros.
- `src/game/assets.ts` : nouvelles constantes `BOURREAU_FRAME_W/H/BASELINE_Y` (288/224/214) et les 4 feuilles bourreau ; suppression des anciennes entrées 224x176.
- `src/game/scenes/BootScene.ts` : chargement de `torture_rack_frame.png`, des deux roues et de la nouvelle feuille victime.
- `src/game/entities/Enemy.ts` : `Bourreau` conserve ses stats mais passe sur le nouveau gabarit (échelle et hitbox élargies, portée de frappe augmentée).
- `src/game/scenes/GameScene.ts` : `TORTURE_RACK_X` recalé pour que le chevalet occupe la niche du mur entre les statues (700 et 2050) sans gêner la colonne de sortie ; `tick()` inchangé, callback de libération identique.
- Suppression des fichiers `torture_wheel_machine.png` et `torture_victim_spritesheet.png`.