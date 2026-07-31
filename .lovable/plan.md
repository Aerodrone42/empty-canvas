# Torches murales animées

Ajouter des torchères le long des murs des deux salles : flamme animée, halo de lumière qui fluctue, fine fumée qui monte. Purement décoratif — aucune collision, aucun impact sur le gameplay ni sur le HUD.

## Rendu visé

- Torche fixée au mur du fond, à environ 2/3 de hauteur, avec support en fer forgé et coupe de braises.
- Flamme en boucle (spritesheet), légèrement désynchronisée d'une torche à l'autre pour éviter l'effet « clones ».
- Halo : disque lumineux additif ambré dont le rayon et l'opacité oscillent en continu, avec de brefs sursauts aléatoires (courant d'air).
- Fumée : quelques particules sombres semi-transparentes qui montent, s'élargissent et s'effacent au-dessus de la flamme.
- Quelques braises orange qui montent occasionnellement.

## Placement

- Cathédrale : 4 torches réparties le long du mur, en évitant le crucifié et la colonne de sortie.
- Corridor : 5 à 6 torches espacées régulièrement, placées derrière et la veine, cohérentes avec la perspective (légèrement plus petites vers le point de fuite).
- Profondeur : derrière le héros et les ennemis, devant le fond peint.

## Détails techniques

- Nouvel asset `public/assets/sprites/props/wall_torch_spritesheet.png` : torche + flamme, boucle de 6 frames, généré puis assemblé au format spritesheet.
- Chargement et animation `wall-torch-burn` déclarés dans `src/game/scenes/BootScene.ts`.
- Nouveau `src/game/effects/WallTorch.ts` :
  - classe `WallTorch` (sprite + halo + émetteurs), méthode `tick(time)` pour la fluctuation, `destroy()` pour le nettoyage.
  - helper `placeTorches(scene, floorY, roomWidth, backdropKey)` qui retourne le tableau des torches placées.
  - halo via `Phaser.GameObjects.Image` en `ADD` avec une texture radiale générée une seule fois, pas de light pipeline (le rendu reste compatible avec le HUD et la lisibilité du héros).
  - fumée et braises via un seul `ParticleEmitter` par torche, à faible débit, pour rester léger.
- Branchement dans `src/game/scenes/GameScene.ts` : instanciation dans `buildBackdrop()`, appel dans la boucle `update`, libération dans le nettoyage de salle (au même endroit que `critters` / `vein`).
- Aucun corps physique, aucun overlap : le héros et les ennemis traversent les torches sans effet.

## Vérification

Chargement du jeu sans erreur console, puis capture d'écran des deux salles pour valider l'intensité de la lueur et la lisibilité du personnage.