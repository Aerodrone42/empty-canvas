## Objectif

Ajouter le blob de chair (sprite fourni) comme élément de décor animé dans la salle 2 (corridor) : plusieurs exemplaires placés aléatoirement le long de la jonction sol/mur, chacun jouant son animation par à-coups aléatoires.

## Préparation de l'asset

Le fichier envoyé fait 1920x823 avec 8 poses alignées sur une seule rangée, entourées de beaucoup de vide blanc.

- Détourer le fond blanc (transparence), rogner la bande utile, découper en 8 cellules de largeur égale et régénérer une spritesheet normalisée (cellule ~240x180, ligne de base des blobs alignée en bas de cellule).
- Sortie : `public/assets/sprites/props/flesh_blob_spritesheet.png` + entrée dans `src/game/assets.ts` (clé, frameWidth, frameHeight, frameCount = 8).

## Nouveau composant `src/game/effects/FleshBlob.ts`

- Charge la spritesheet, crée l'animation `blob-pulse` (8 frames, ~10 fps, aller-retour `yoyo` pour un cycle gonflement/rétraction fluide).
- Un blob = un sprite posé sur la ligne sol/mur, origine bas-centre, `depth` juste devant le décor de fond mais derrière le joueur.
- État repos : frame 0 figée, légère teinte sombre pour se fondre dans le mur.
- Réveil aléatoire : chaque blob tire un délai aléatoire (ex. 3–9 s) ; à l'échéance il joue 1 à 2 cycles d'animation, avec un léger tremblement/variation de teinte, puis retourne au repos et retire un nouveau délai.
- Variation d'aspect par instance : échelle aléatoire (~0.55–0.9), `flipX` aléatoire, décalage de phase, pour éviter l'effet clone.
- Méthode `tick(time)` appelée depuis la boucle de la scène, `destroy()` au changement de salle.

## Placement dans la scène

Dans `GameScene.ts`, section `backdropKey === "corridor"` (là où sont déjà créées la veine et les statues) :

- Générer 4 à 6 blobs à des abscisses aléatoires réparties sur la largeur de la salle, avec un espacement minimal pour éviter les chevauchements, et en évitant les zones sensibles (spawn du joueur, colonne de sortie).
- Ordonnée = jonction sol/mur, c'est-à-dire la ligne de plinthe visible sur la capture (légèrement au-dessus de `FLOOR_Y`, calée sur le même repère que la base des statues) — exactement là où sont les cercles rouges de l'annotation.
- Les blobs restent purement décoratifs : aucune collision, aucun impact sur le gameplay ni sur la condition de nettoyage de la salle.
- Appel de `tick()` dans `update()` et nettoyage dans la transition de salle.

## Vérification

Capture Playwright de la salle 2 pour contrôler l'ancrage sur la ligne sol/mur, la taille relative et la visibilité des blobs dans l'ambiance sombre, puis ajustement de l'échelle/opacité si nécessaire.
