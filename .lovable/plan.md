## Problème

Le corridor empile 4 couches mal alignées (fond « perspective » fixe, travées tuilées, dallage tuilé, dégradé de raccord) → rendu brouillon. Et surtout le sol actuel est une texture de pierre vue **de face** : elle se lit comme un mur au lieu d'un plancher. Les statues sont en plus posées en plein milieu de la voie de marche.

## Correctifs

**1. Un seul décor pour le corridor (`src/game/effects/Parallax.ts`)**
- Supprimer le cas spécial `corridor` : plus de couche `far` fixe à l'écran, plus de tileSprite `mid`, plus de `addFloor()` ni de dégradé de raccord.
- Le corridor rendu comme les autres salles : une peinture unique répétée horizontalement, ancrée au monde (scrollFactor 1), sol peint inclus dans l'image. Le sol défile donc pile à la vitesse des pas.
- Nettoyer les assets/chargements devenus inutiles (`corridor_bg_mid`, `corridor_bg_near`, `corridor-floor` dans `BootScene.ts` et `assets.ts`), supprimer les fichiers PNG correspondants.

**2. Décor de corridor régénéré, avec un vrai sol au sol**
- Régénérer `corridor_bg_far.png` (1920×1080) dans le style exact de la salle 1 (cathédrale), avec la contrainte clé : **le dallage du bas doit être vu en fuite, pas de face**.
  - dalles en perspective (trapèzes qui s'élargissent vers le bas de l'image), lignes de joints convergentes, reflets et flaques allongés horizontalement ;
  - occupe environ le tiers inférieur de l'image, éclairage rasant plus clair près du bord bas, plus sombre vers le mur du fond ;
  - transition nette mur/sol (plinthe, base des colonnes) pour que l'œil lise immédiatement un plancher ;
  - bords gauche/droite raccordables pour éviter la couture visible en tuilage.
- Vérifier après génération que la ligne de sol peinte tombe bien sur `FLOOR_Y` (héros posé dessus, pas flottant ni enfoncé) et ajuster l'ancrage vertical de la peinture si besoin.

**3. Statues hors du chemin (`src/game/scenes/GameScene.ts`)**
- Réduire à 2 statues au lieu de 3.
- Les reculer dans le décor : contre le mur du fond, rendues derrière le joueur et les ennemis (depth inférieur), légèrement réduites et posées sur la ligne de sol peinte — plus rien au milieu du passage.
- `WeepingStatue.ts` accepte une échelle et une profondeur en paramètre.

**4. Ambiance allégée**
- Garder poussières et vignettage, retirer les braises et la densité doublée qui surchargeaient l'écran.

## Résultat attendu

Un corridor lisible : un fond unique dont le sol se lit clairement comme un plancher en fuite sous les pieds du héros, aucune superposition décalée, et des statues intégrées au décor de fond.
