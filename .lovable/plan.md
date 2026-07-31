## Objectif

Les torches actuelles sont accrochées au mur du fond, ce qui les fait "flotter dans le vide" quand rien ne les soutient. On les remplace par des **torchères sur pied** posées au sol, alignées sur la ligne de sol de chaque salle.

## Ce qui change visuellement

- Un pied haut en fer forgé (base évasée, fût élancé, vasque en haut) vu **de face**, dans le style gothique du jeu.
- La flamme reste animée (même logique de flicker, halo ambre additif, fumée et braises).
- Chaque torchère repose exactement sur la ligne de sol (`FLOOR_Y`), donc plus jamais de suspension dans le vide.
- Elles restent purement décoratives : aucune collision, aucun effet gameplay. Le héros peut passer devant/derrière.

## Détails techniques

1. **Nouvel asset** : génération d'une spritesheet `floor_torch_spritesheet.png` (6 frames, silhouette haute ~ 96x224 par frame) via PIL — pied métallique fixe + flamme animée centrée dans la vasque. Remplace `wall_torch_spritesheet.png` dans `BootScene.ts` (nouvelles dimensions de frame).
2. **`src/game/effects/WallTorch.ts`** renommé en `src/game/effects/FloorTorch.ts` :
   - classe `FloorTorch` avec origine `(0.5, 1)` posée à `y = floorY` (léger offset aléatoire de quelques pixels pour éviter l'alignement parfait).
   - recalcul du foyer (`FIRE_X`/`FIRE_Y`) sur les nouvelles dimensions pour que halo, fumée et braises partent de la vasque.
   - profondeur : légèrement derrière le héros (arrière-plan proche) pour les torchères du fond, et une variante possible au premier plan si besoin de profondeur.
3. **`placeTorches()`** revu :
   - Cathédrale : 4 torchères contre le mur du fond, aux positions déjà validées (340, 1080, 1720, 2380), échelle uniforme, posées au sol.
   - Corridor : 6 torchères en perspective, échelle décroissante vers le point de fuite, chacune posée sur la dalle correspondante (y suit la ligne de sol perspective au lieu d'un offset arbitraire).
4. **`GameScene.ts`** : mise à jour des imports/types (`FloorTorch`), le reste du cycle `tick` reste identique.
5. Suppression des références à l'ancien sprite mural (`sconce_front.png`, `wall_torch_spritesheet.png`).
