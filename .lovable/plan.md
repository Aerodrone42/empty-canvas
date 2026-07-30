## Le problème

Le dallage est aujourd'hui un `TileSprite` collé à la caméra dont le motif est décalé manuellement (`tilePositionX = scrollX`). Mathématiquement il défile à la bonne vitesse, mais visuellement c'est **le même motif qui se répète toutes les ~1670 px** : l'œil voit une texture qui glisse en boucle sous les pieds au lieu d'un sol réel. En plus, la bande basse d'une peinture en perspective est étirée horizontalement quand on la tuile, ce qui renforce l'effet « tapis roulant ».

## Ce que je propose

1. **Sol vraiment ancré au monde.** Remplacer le `TileSprite` collé caméra par une image de sol posée une seule fois sur toute la largeur de la salle (`scrollFactor 1`, largeur `ROOM_WIDTH`), cuite dans une texture unique au chargement de la salle — un seul objet, un seul appel de rendu.

2. **Supprimer la répétition visible.** Cette texture de sol est composée de plusieurs copies de la bande basse, une sur deux **retournée horizontalement**, avec un léger décalage vertical et un fondu aux jonctions : plus de motif identique qui revient en boucle.

3. **Géométrie fixe par-dessus.** Renforcer les repères déjà présents (`addFloorMarks`) en vraies **dalles en perspective** : lignes de joints qui convergent vers le point de fuite, espacées irrégulièrement, plus quelques fissures/débris. Ce sont ces éléments fixes qui donnent la sensation de marcher sur un sol solide.

4. **Ligne d'horizon stable.** Garder ciel/ville à défilement lent (0,12) mais rendre le raccord net : une bande d'ombre au sol sous le mur du fond, pour que la transition ne bouge plus visiblement.

5. **Vérification** : capture pendant la marche + F3, contrôler qu'on reste à 60 im/s et que le nombre d'objets en scène ne bouge quasiment pas.

## Détails techniques

- `src/game/effects/Parallax.ts` :
  - frame `ground` rendue N fois (N = `ceil(ROOM_WIDTH / bandW)`) dans un `Phaser.GameObjects.RenderTexture` de `ROOM_WIDTH × groundH`, `flipX` une fois sur deux, puis affichée par un seul `image` à `scrollFactor 1`, `depth -20` ;
  - `update()` ne pilote plus que `sky.tilePositionX` — le sol n'a plus aucun calcul par frame ;
  - `addFloorMarks` : dessiner en plus des joints de dallage (lignes obliques convergentes) dans la même texture cuite, aucun objet supplémentaire.
- Aucun changement de physique : `FLOOR_Y = 880`, collisions et caméra inchangées.
