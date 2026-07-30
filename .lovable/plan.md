## Objectif

Au bout de la salle (côté droit, là où se trouve la plateforme de pierre du décor), ajouter une **plateforme praticable** sur laquelle le héros peut monter. Une fois dessus, elle s'active comme un **ascenseur** qui monte — point de sortie prévu pour enchaîner plus tard sur une nouvelle map.

## Ce qui sera fait

Dans `src/game/scenes/GameScene.ts` :

1. **Plateforme physique en bout de salle**
   - Un corps statique (`staticGroup`) posé à l'extrémité droite, calé sur la ligne de sol, largeur ~220 px, épaisseur fine.
   - Collision uniquement par le dessus (le héros peut sauter dessus, pas se cogner en dessous) via `checkCollision.down/left/right = false`.
   - Un visuel discret en pierre (rectangle sombre + liseré clair) aligné sur la plateforme du décor, pour que le joueur comprenne qu'elle est praticable.

2. **Comportement d'ascenseur**
   - Le corps devient un `staticBody` déplacé manuellement (ou un body cinématique) : tant que le héros est posé dessus, la plateforme monte à vitesse constante (~90 px/s).
   - Le héros est porté : sa position Y suit le déplacement de la plateforme tant qu'il reste au contact.
   - Si le héros saute ou descend, l'ascenseur s'arrête puis redescend lentement à sa position de départ.

3. **Sortie vers la map suivante (préparation)**
   - Quand l'ascenseur atteint le haut de la salle, on déclenche un événement `room-exit` avec un fondu au noir de la caméra.
   - Pour l'instant ce fondu relance la scène sur le décor suivant (`this.scene.restart({ backdrop: ... })`) — le point d'accroche est prêt pour brancher une vraie nouvelle salle plus tard.

4. **Repère visuel**
   - Léger halo/pulsation lumineuse sur la plateforme quand elle est inactive, pour signaler qu'il y a quelque chose à faire là.

## Détails techniques

Aucune modification des ennemis, du combat ni du HUD. La plateforme est ajoutée au `staticGroup` existant `platforms` (déjà collisionné avec le joueur et les ennemis) — les ennemis pourront donc aussi s'y poser, ce qui est cohérent. Le décor `Parallax` n'est pas touché : la plateforme est positionnée pour coïncider visuellement avec le socle de pierre déjà peint à droite. Vérification par capture Playwright : montée sur la plateforme, déclenchement de la montée, fondu en haut.

Question ouverte que je peux trancher par défaut : l'ascenseur monte **automatiquement** dès qu'on est dessus (choix retenu), plutôt que sur appui d'une touche « interagir ».
