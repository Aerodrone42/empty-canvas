## Constat

Deux problèmes distincts :
1. **Le style** : l'autel est dessiné en vecteur (`Phaser.Graphics`) — formes plates, aplats unis, aucun grain pixel-art. Ça jure avec les décors du jeu qui sont des sprites pixel-art peints (croix du supplicié, machine de torture, colonne de viscères).
2. **La profondeur** : l'autel est en `depth 24`, le héros en `depth 5`. Le héros passe donc *derrière* l'autel.

## Correctif 1 — vrai sprite pixel-art

Abandon du dessin vectoriel. Génération d'un **asset pixel-art** de l'autel dans le style exact du jeu (même palette pierre brun-violacé / sang, même niveau de détail que la croix du supplicié, même éclairage latéral chaud) :
- `blood-altar.png` : autel gothique élancé — base à gradins usés, fût sculpté étroit avec gravures et sigil, vasque en pierre ciselée remplie de sang, coulées séchées le long du fût. Fond transparent, cadrage serré.
- Vérification de la transparence et du recadrage via script Python (comme pour les autres props), puis publication en asset et import dans le jeu.
- Deux teintes issues du même sprite : état éteint (sprite assombri/désaturé par `setTint`) et état scellé (teinte normale + halo).

## Correctif 2 — profondeur

`depth` de l'autel passé de `24` à `-2` (comme les autres props de sol : `TortureRack`, `CrucifiedProp`, `FleshBlob`) : **le héros passe devant l'autel**. Le halo et les particules suivent la même couche, l'invite texte reste au-dessus.

## Sang animé par-dessus le sprite

Overlay léger conservé, mais discret et calé sur la vasque du sprite :
- surface de sang qui ondule et scintille dans la vasque ;
- 2 à 3 coulées fines le long du fût, longueur qui respire, avec goutte qui se détache et petite flaque au sol qui s'estompe ;
- halo rouge pulsant + vapeur uniquement quand l'autel est scellé ;
- flash caméra et onde de choc au moment du scellement.

## Détails techniques

- Fichier touché : `src/game/effects/BloodAltar.ts` (remplacement du `Graphics` pierre par `scene.add.image(...)`), plus le chargement de la texture dans le préchargement de `GameScene.ts`.
- API publique inchangée (`constructor`, `isLit`, `tick`, `destroy`).
- Contrôle visuel par capture Playwright dans la Nef : autel éteint, héros passant devant, puis autel scellé.
