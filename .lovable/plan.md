## Problème

Le passage à la salle suivante existe déjà dans le code (`exitRoom()` dans `GameScene.ts` : fondu au noir puis salle suivante selon `ROOM_ORDER` = cathédrale → corridor → trône → extérieur), mais **plus rien ne l'appelle** depuis la suppression de l'ascenseur. Le héros est donc bloqué dans la première salle.

## La colonne de fin de salle

Une seule colonne gothique, celle de l'image de référence : pierre sombre, base sculptée en arches, et **viscères/veines rouges enroulés en spirale** autour du fût.

- Elle est plantée en fin de salle (x ≈ 2150), posée au sol.
- **Le haut n'est jamais visible** : le fût est étiré jusqu'au-dessus du bord haut de l'écran, la colonne sort du cadre. Aucune extrémité flottante dans le vide.
- Elle est au premier plan : le héros passe derrière elle.
- **Viscères animés** : les spirales rouges pulsent lentement (respiration, léger gonflement + variation de luminosité), avec de fines gouttes de sang qui perlent et coulent le long de la pierre par intermittence. L'animation s'intensifie quand la salle est nettoyée.

Asset : une planche de colonne est générée à partir de la référence (fût seul, tuilable verticalement + base sculptée), pour que la hauteur puisse être étirée sans déformer la base.

## La sortie

- Derrière la colonne, un seuil sombre = le passage vers la salle suivante.
- **Tant qu'il reste des monstres vivants** : le seuil est obstrué (voile noir/rouge), et un mur invisible arrête le héros au niveau de la colonne.
- **Quand le dernier monstre meurt** : les viscères de la colonne s'illuminent brièvement, le voile se dissipe, le mur disparaît, et un texte discret s'affiche (« Le passage s'ouvre »).
- Marcher au-delà de la colonne déclenche alors `exitRoom()` : fondu au noir, puis salle suivante, héros à gauche, vie et Chair conservées.

## Détails techniques

- Nouveau fichier `src/game/effects/GateColumn.ts` : construit la colonne (fût `TileSprite` étiré du sol jusqu'à `y < 0`, base en `Image`), gère les tweens de pulsation des viscères et les gouttes.
- `GameScene.ts` : compteur d'ennemis vivants mis à jour dans `onEnemyDied`, état `roomCleared`, corps statique `exitGate` dans `this.platforms` retiré à l'ouverture, et test de position dans `update()` appelant `exitRoom()`.
- Profondeurs : décor < héros < colonne (premier plan) < HUD. `scrollFactor 1` pour rester ancrée au monde.
- `exitRoom()` reste inchangé ; on ne fait que le déclencher.
