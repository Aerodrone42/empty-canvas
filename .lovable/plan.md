## Problèmes constatés

Dans `src/game/effects/Parallax.ts`, la branche `corridor` empile trois couches :
1. un fond fixe (`corridor_bg_far`) redimensionné en `viewW × drawH`,
2. des travées latérales (`corridor_bg_mid`) en tileSprite à scrollFactor 0.45,
3. des « piliers de premier plan » (`corridor_bg_near`) en tileSprite à scrollFactor 1.25, ancrés à `floorY + 24`.

La couche 3 produit les deux colonnes qui flottent devant le héros (elles n'ont pas de base posée au sol et défilent plus vite que lui). Et aucune des couches ne peint un vrai sol à la hauteur de collision `FLOOR_Y = 880` : la ligne de sol des images tombe plus haut, d'où le vide sous les pieds et la statue (`WeepingStatue`, posée à `floorY - 6`) qui paraît en lévitation.

## Correctifs prévus

1. **Supprimer la couche des piliers de premier plan** (bloc `near`) dans la branche corridor de `Parallax.ts`. Le héros ne passera plus derrière des colonnes flottantes.
2. **Ajouter un sol réel au corridor**, dans le style du jeu :
   - générer une texture de dallage `corridor_floor.png` (pierre sombre humide, joints rougis, reflets de lanternes, cohérente avec la cathédrale),
   - la charger dans `src/game/scenes/BootScene.ts`,
   - l'afficher en `tileSprite` ancré au monde (scrollFactor 1) depuis `FLOOR_Y` jusqu'au bas de la salle, sur toute la largeur `ROOM_WIDTH`, en profondeur intermédiaire (au-dessus du fond, sous les personnages).
3. **Raccorder le fond au sol** : abaisser/recadrer la couche `far` fixe pour que sa ligne de fuite rejoigne exactement `FLOOR_Y`, plus un léger dégradé sombre à la jonction pour éviter la ligne de coupe nette.
4. **Recaler la statue** : vérifier que `WeepingStatue` (et les travées `mid`) reposent sur la nouvelle ligne de sol, en ajustant l'ancrage si un décalage subsiste.

## Détails techniques

- Fichiers touchés : `src/game/effects/Parallax.ts`, `src/game/scenes/BootScene.ts`, éventuellement `src/game/effects/WeepingStatue.ts` (ancrage seulement).
- Nouvel asset : `public/assets/sprites/backgrounds/corridor_floor.png` (tuilable horizontalement).
- Aucun changement de gameplay, de collisions ou de logique de salle : `FLOOR_Y` et les colliders restent inchangés.
