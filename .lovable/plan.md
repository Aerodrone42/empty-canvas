## Constat

Deux problèmes confirmés dans la planche actuelle (`floor_torch_spritesheet.png`, 10 frames de 113x300) :

1. **Toute la torche bouge.** Les 10 vignettes de la planche de référence ont été rendues indépendamment : le brasero n'est pas au pixel près identique d'une frame à l'autre (légères variations de forme, d'ombre et de position). En jouant l'animation, c'est donc le candélabre entier qui tremble, alors que seule la flamme devrait vivre.
2. **Le design ne correspond plus.** La nouvelle référence (`image-27.png`) est un brasero-calice en fer forgé avec pointes, chaînes et loques rouges — pas le fût élancé actuel.

## Plan

1. **Re-découper la nouvelle planche `image-27.png`**
   - Grille 5x2, suppression des libellés au-dessus de chaque case, détourage du fond noir par seuillage de luminance.
   - Alignement des 10 vignettes sur une bounding-box commune du **socle** (le calice), pas sur la silhouette globale — c'est ce qui supprime le tremblement.

2. **Séparer socle et flamme en deux textures**
   - `floor_torch_base.png` : image unique, statique, prise sur la frame 1 (calice + chaînes + loques). Elle ne bougera jamais.
   - `floor_torch_flame_spritesheet.png` : uniquement la zone de flamme (au-dessus de la lèvre du calice), extraite des 10 frames, toutes recadrées sur la même boîte et donc parfaitement superposables.
   - Suppression de l'ancienne planche unique.

3. **Réécrire `src/game/effects/FloorTorch.ts`**
   - Une `Image` fixe pour le socle + un `Sprite` animé pour la flamme, ancré au foyer du calice.
   - Boucle de repos (idle → faible → moyenne → vacillement) et sursaut aléatoire (forte → embrasement → intensification → tourbillon → souffle → étincelles), synchronisés avec le halo et les braises déjà en place.
   - Petit `setScale` vertical léger sur la flamme uniquement, jamais sur le socle.

4. **`BootScene.ts`** : charger les deux nouveaux assets et redéfinir les animations `floor-torch-idle` / `floor-torch-flare` sur la spritesheet de flamme.

5. **Placement** : échelle ajustée au nouveau gabarit (brasero plus trapu que l'ancien fût), pied posé sur la ligne de sol, 4 torchères en cathédrale, 6 en perspective dans le corridor.

6. **Vérification** : capture en jeu dans les deux salles pour confirmer que le socle est parfaitement immobile et que seule la flamme vit.
