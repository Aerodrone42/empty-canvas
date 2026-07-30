## Objectif

Les mains du sol sont beaucoup trop grandes (elles recouvrent tout le héros) et leur effet est trop faible. Elles doivent monter au genou et immobiliser le héros pendant 3 secondes quand elles l'attrapent.

## Taille

Le héros mesure 130 px à l'écran. Le genou se situe donc vers 38-42 px au-dessus du sol. La main la plus haute de la planche fait ~160 px dans sa cellule et est actuellement affichée à l'échelle 1.35 (soit ~216 px, plus grande que le héros).

- `src/game/entities/GraspingHands.ts` : passer l'échelle de `1.35` à `0.25`, ce qui donne une main d'environ 40 px — exactement au genou.
- Passer la profondeur d'affichage devant le héros restreinte au bas du corps (garder `depth 7`), pour que les mains agrippent visiblement les jambes sans masquer le torse.

## Agrippement de 3 secondes

Aujourd'hui l'effet est un simple ralentissement renouvelé tant que le héros reste dans la zone. On le remplace par une vraie saisie :

- `GraspingHands` : quand le héros entre dans la zone et que le piège est prêt, déclencher une saisie unique — mains qui jaillissent, gerbe de sang, et signal `grab` au joueur pour 3000 ms. Ensuite les mains replongent et le piège se remet en cooldown (~2,5 s) pour qu'il ne réattrape pas immédiatement.
- `src/game/entities/Player.ts` : la méthode `snare` devient une vraie immobilisation :
  - vitesse horizontale bloquée à 0 (léger dégagement possible à ~10 % pour que le joueur sente qu'il lutte),
  - esquive impossible (comportement déjà en place, conservé),
  - saut impossible pendant la saisie,
  - teinte rougeâtre et petites gerbes de sang régulières pour signaler l'état,
  - fin automatique après 3 secondes.
- `src/game/scenes/GameScene.ts` : la boucle n'applique plus le ralentissement image par image ; elle relaie uniquement l'événement de saisie envoyé par les mains.

## Détails techniques

- Rayon de déclenchement conservé (90 px) et vérification que le héros est au sol (`|playerY - floorY| < 90`), pour qu'un saut par-dessus évite le piège.
- L'animation `mains-sol-anim` (5 frames) est jouée à l'endroit pour la sortie, puis en `playReverse` pour le retrait après les 3 secondes.
- Aucune modification des assets : la planche `mains_sol_spritesheet.png` reste identique, seul le facteur d'échelle change.
