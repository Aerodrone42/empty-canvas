## Problème

Sur la planche d'esquive, la découpe verticale tombe en plein milieu du héros : la tête/capuche de la frame 1 se retrouve collée dans la cellule 2 (entourée en rouge), et la frame 1 se retrouve décapitée. La méthode actuelle coupe aux « minima » de densité à intervalle régulier, ce qui traverse le personnage quand deux poses se chevauchent ou se touchent.

## Correction

1. **Segmentation par composantes connexes** au lieu de coupes verticales :
   - détourage du fond (déjà en place),
   - étiquetage des blobs de pixels opaques,
   - regroupement des blobs dont les boîtes englobantes se chevauchent ou sont distantes de moins de ~10 px horizontalement (une cape déchirée ou une botte détachée reste rattachée à son personnage),
   - conservation des N plus gros groupes (N = nombre de frames attendu), triés de gauche à droite.
2. **Aucune coupe droite** : chaque frame est extraite via sa propre boîte englobante, donc une tête ne peut plus passer dans la cellule voisine.
3. **Garde-fou** : si le nombre de groupes détectés ≠ N attendu, le script s'arrête avec un message plutôt que de produire une planche fausse ; on ajuste alors le seuil de fusion.
4. Conservation du reste : échelle unique par animation (pose la plus haute = 150 px), alignement au sol, centrage horizontal, cellules 256×192.

## Sorties

`public/assets/sprites/hero/vigile_muet_{jump,dodge,parry,hurt,death}_spritesheet.png`
(3, 5, 3, 2 et 5 frames — 768×192, 1280×192, 768×192, 512×192, 1280×192)

## QA

Rendu de contrôle de chaque planche sur fond sombre avec grille de cellules superposée, inspection visuelle frame par frame : tête entière, aucun fragment d'une pose voisine, pieds sur la ligne de sol.

## Détails techniques

Script Python (PIL + numpy) en `/tmp`, étiquetage via `scipy.ndimage.label`, masque alpha par distance colorimétrique au fond (seuil 34), redimensionnement LANCZOS.
