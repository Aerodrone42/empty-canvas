## Constat

Tu as raison : il n'existe aucune feuille de sprites de saut. Dans `public/assets/sprites/` il n'y a que `idle`, `walk` et `attack` pour le Vigile Muet. Le saut réutilisait donc l'animation idle, et ma dernière modif n'a fait qu'écraser/étirer cette image — aucun mouvement de jambes, juste une déformation moche.

La vraie correction est de dessiner l'animation manquante.

## Plan

### 1. Générer une feuille de sprites « saut »
Nouvelle image `vigile_muet_jump_spritesheet.png`, même gabarit que les autres feuilles du héros (cellules 192x144, silhouette 110 px, ligne de pieds à y=138), 6 frames dessinées :

```text
1  flexion    genoux pliés, buste avancé, bras en arrière
2  détente    jambes tendues vers le bas, poussée
3  montée     jambe avant repliée, jambe arrière tendue, manteau soulevé
4  apex       jambes groupées sous le corps
5  chute      jambes écartées, jambe avant tendue vers le sol
6  réception  atterrissage, genoux fléchis, une main au sol
```

### 2. Normaliser la feuille
Passage par le même script de normalisation que les autres feuilles du héros : recadrage de chaque silhouette sur la ligne de pieds commune, hauteur cohérente avec idle/walk, fond transparent. Sans cette étape, le héros grandirait/rétrécirait au saut comme avant.

### 3. Déclarer et charger la feuille
- `src/game/assets.ts` : nouvelle entrée `vigile-jump` avec le gabarit héros.
- La scène de boot crée trois animations découpées dans cette feuille :
  - `vigile-crouch` (frames 1-2, jouée une fois, sans boucle) — l'élan
  - `vigile-air` (frames 3-5, pilotée par la vitesse verticale)
  - `vigile-land` (frame 6, courte)

### 4. Brancher l'animation dans le héros
Dans `src/game/entities/Player.ts` :
- Supprimer complètement la déformation procédurale ajoutée au tour précédent (`poseX/poseY`, `setPose`, `relaxPose`) et remettre l'échelle fixe.
- Garder la brève phase d'élan avant décollage, mais la faire jouer `vigile-crouch` au lieu d'écraser le sprite.
- En l'air : frame de montée si la vitesse verticale est négative, frame d'apex proche de zéro, frame de chute si positive.
- À l'atterrissage : `vigile-land` pendant ~120 ms, puis retour à idle/walk.
- Double saut : rejoue la phase de détente en l'air.

### 5. Vérification
Capture du héros en jeu aux différentes phases (élan, montée, chute, réception) pour confirmer que les jambes bougent, que la taille reste constante et que les pieds retombent bien sur la ligne de sol.

## Détails techniques

Les feuilles du héros sont déjà normalisées via les constantes `HERO_FRAME_W=192`, `HERO_FRAME_H=144`, `HERO_CHAR_H=110`, `HERO_BASELINE_Y=138` d'`src/game/assets.ts` ; la nouvelle feuille doit respecter exactement ces valeurs pour que `alignBody()` fonctionne sans compensation. Aucun changement de hitbox : le corps physique reste constant (58x120) pendant tout le saut, seule l'apparence change.
