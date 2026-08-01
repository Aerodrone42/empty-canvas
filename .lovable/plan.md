## Invite d'absorption sur les flaques de sang

Aujourd'hui, se soigner en absorbant la Chair est possible (maintenir la touche de parade au sol, hors combat), mais aucun indicateur ne l'annonce à l'écran : le joueur ne sait plus quand ni sur quoi appuyer. Le seul rappel existe dans une ligne d'aide du HUD.

### Ce qui sera ajouté

- Un petit badge de commande flottant au-dessus du héros, dans le même style que celui de l'autel de sang : fond sombre compact, symbole de la touche seule, sans phrase.
- Le badge affiche la touche clavier réellement attribuée à l'action de parade/absorption, ou le bouton correspondant (Xbox, PlayStation, générique) si une manette est branchée.
- Apparition uniquement quand le héros se tient sur une flaque de sang ou un cadavre frais, au sol, hors combat, blessé, et avec assez de Chair.
- Disparition immédiate dès que l'absorption démarre (la barre de progression existante prend le relais) et dès que le héros quitte la flaque.
- Léger fondu d'apparition/disparition pour éviter le clignotement quand on marche sur le bord d'une flaque.

### Détails techniques

- Nouveau petit composant d'invite dans la scène de jeu, positionné chaque frame au-dessus du héros, réutilisant `keyLabel` / `padLabel` / `detectPadBrand` comme `BloodAltar`.
- Détection de la flaque via `BloodFX.poolAt(x)` déjà présent dans `src/game/effects/Blood.ts`.
- Conditions de visibilité alignées sur celles de `Player` (`canAbsorb`, coût en Chair, santé non pleine, au sol, pas d'absorption en cours) — aucune règle de gameplay modifiée.
- Fichiers concernés : `src/game/scenes/GameScene.ts` (+ un petit fichier d'invite dans `src/game/effects/`).

### Hors périmètre

Le personnage : la version actuelle des sprites est conservée telle quelle, aucun retour ni régénération d'assets du héros.
