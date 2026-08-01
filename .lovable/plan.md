## Objectif

Ajouter une **suppliciée** à droite du supplicié existant (salle 1), strictement dans le même style pixel art que `crucifie_ecorche_spritesheet.png` — pas d'illustration réaliste, pas de style "moderne".

Ce qui a été produit précédemment (femme réaliste, robe rouge, pose libre) est rejeté et sera supprimé.

## Spécification de l'asset

Référence de style : le supplicié pixel art (silhouette pendue à une croix en X, palette sépia/brun, contraste faible, grain pixel, fond transparent).

Le nouvel asset doit respecter :
- Femme, **cheveux roux longs** retombant devant le visage
- **Robe blanche déchirée**, imbibée et éclaboussée de sang
- **Bras écartés en haut et jambes écartées en bas**, poignets et chevilles **attachés par des liens/fers** à la croix en X
- Sang coulant depuis les poignets et le torse vers le bas
- Même échelle, même palette gothique désaturée, même rendu pixel art que le supplicié
- Fond transparent, spritesheet 8 frames (léger balancement + respiration)

## Animation / comportement

La suppliciée aura **exactement les mêmes animations** que le supplicié existant :
- Balancement lent du corps et de la croix en X
- Respiration subtile (torse qui se soulève légèrement)
- Gouttes de sang qui tombent régulièrement
- Même profondeur de rendu, même ancrage au sol, même hitbox (pas de collision)

Seule la texture change.

## Implémentation technique

1. Supprimer l'ébauche rejetée (`crucifiee_femme_src.png` et dérivés).
2. Générer la nouvelle spritesheet `crucifiee_femme_spritesheet.png` en repartant visuellement de `crucifie_ecorche_spritesheet.png` pour garantir la cohérence de style, d'échelle et de croix.
3. Contrôle qualité : vérification par script de la transparence, du découpage des frames et de la taille par frame — identique au supplicié.
4. Déclarer l'asset dans `src/game/assets.ts` (clé `crucifiee-idle`).
5. Rendre `CrucifiedProp.ts` paramétrable (texture + clé d'animation) sans changer son comportement actuel.
6. Instancier dans `GameScene.ts` à `x = 690` (≈260 px à droite du supplicié à `x = 430`), même `FLOOR_Y`, même profondeur.
7. Vérification en jeu via capture d'écran de la salle 1 pour valider le rendu côte à côte.

Si le résultat ne correspond pas au style, je te montre la capture avant d'enchaîner.