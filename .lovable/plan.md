## Problème

La herse actuelle est dessinée **de face** (grille large de 5 barreaux, 96 px de large à l'écran). Or le jeu est vu de côté : une grille qui barre le couloir doit se voir **par la tranche**, c'est-à-dire comme une fine colonne de fer, pas comme un panneau.

## Correctif

1. **Nouveau sprite** `public/assets/sprites/props/iron_gate.png`
   - Vue de profil : une seule barre verticale épaisse de fer forgé, pointe acérée en bas, pointe en haut, avec les traverses vues par la tranche (petits blocs/rivets réguliers) et un léger décalage des barreaux du fond pour donner l'épaisseur.
   - Même palette que l'image de référence : fer sombre, rouille bordeaux, reflets bronze — cohérent avec le gothique du jeu.
   - Fond transparent, format vertical étroit (env. 128 × 640).

2. **`src/game/scenes/GameScene.ts` — `lockArena`**
   - `gate.setDisplaySize(96, 500)` → largeur réduite (env. 30 px) pour respecter la vue de tranche, hauteur inchangée (500).
   - Chute, secousse de caméra, poussière à l'impact et remontée à la victoire : inchangés.
   - Le collider invisible (36 px) reste aligné sur la nouvelle largeur.

Aucun changement de gameplay : seule l'apparence de la herse est corrigée.