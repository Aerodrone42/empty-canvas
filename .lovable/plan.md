## Constat

La torchère actuelle est un dessin vectoriel grossier (base ronde, flamme en polygone) — trop "cubique", aucun rapport avec l'ambiance gothique du jeu. La planche fournie (10 poses : idle → flamme faible/moyenne/forte, vacillement, embrasement, intensification, tourbillon, souffle, étincelles) est exactement le bon rendu : haut candélabre en fer forgé ouvragé, silhouette élancée, flamme volumétrique avec braises.

## Plan

1. **Extraire la planche fournie en spritesheet propre**
   - Découper les 10 vignettes de `image-25.png` (grille 5x2), en supprimant les libellés texte au-dessus de chaque case.
   - Recadrer chaque frame sur la silhouette réelle de la torche (bounding box alpha commune aux 10 frames pour éviter tout tremblement), puis normaliser toutes les frames à une taille identique.
   - Assembler en une bande horizontale de 10 frames → `public/assets/sprites/props/floor_torch_spritesheet.png`, fond transparent (le noir de la planche est retiré par seuillage de luminance).
   - Léger passage en pixel-art (downscale/upscale NEAREST) uniquement si nécessaire pour coller au grain du reste du jeu ; sinon on garde le rendu original, plus fin.

2. **Adapter le code (`src/game/effects/FloorTorch.ts`)**
   - Nouvelles dimensions de frame et nouveau point de foyer (haut de la vasque) pour que le halo, la fumée et les braises partent du bon endroit.
   - Ordre de lecture non linéaire : la flamme ne joue pas les 10 poses en boucle bête. Séquence de repos (idle → faible → moyenne → vacillement) jouée en continu, et déclenchement aléatoire d'un "sursaut" (forte → embrasement → intensification → tourbillon → souffle → étincelles) toutes les quelques secondes, synchronisé avec le gust du halo déjà en place.
   - Suppression de la génération PIL vectorielle précédente.

3. **`BootScene.ts`** : chargement de la nouvelle spritesheet (10 frames) et définition des deux animations (`floor-torch-idle`, `floor-torch-flare`).

4. **Placement inchangé** : pieds posés sur la ligne de sol, 4 torchères en cathédrale, 6 en perspective dans le corridor, échelle ajustée à la nouvelle hauteur (silhouette bien plus élancée que l'ancienne).

5. **Vérification visuelle** : capture du jeu dans les deux salles pour valider proportions, contact au sol et rendu de la flamme.
