## Ce qu'on ajoute

Le corps écorché crucifié sur la croix de bois (planche uploadée) devient un **élément de décor animé**, placé à l'endroit marqué par la croix rouge : au centre de la première salle (cathédrale), derrière la balustrade, dans le décor.

## Comportement visuel

- **Animation en boucle lente** (~5 fps) à partir des 8 poses de la planche : léger balancement du corps, respiration/spasmes, viscères qui palpitent.
- **Sang qui coule** : fines gouttes sombres qui perlent depuis le ventre ouvert et coulent le long des jambes, par intermittence (même famille de particules que la colonne de sortie, désaturées).
- **Plan d'arrière-plan** : le héros et les monstres passent **devant** lui ; il ne bloque rien, aucune collision, aucun combat.
- Ancré au monde (`scrollFactor 1`), il ne suit pas la caméra ; il reste planté à sa position quand on marche.
- Uniquement dans la **première salle** (cathédrale), pas dans les suivantes.

## Placement

- Position ≈ `x = 1150`, base de la croix posée derrière la balustrade (pieds légèrement au-dessus de la ligne de sol pour donner la profondeur).
- Taille : croix ≈ 2× la hauteur du héros, imposante sans masquer le décor central.

## Détails techniques

- **Asset** : la planche uploadée (1836×856, fond noir) est découpée en 8 frames de 229×856, fond noir rendu transparent, puis réenregistrée en spritesheet propre dans `public/assets/sprites/props/crucifie_ecorche_spritesheet.png` + entrée dans `src/game/assets.ts` (`crucifie-idle`).
- **Nouveau fichier** `src/game/effects/CrucifiedProp.ts` : crée le sprite animé, la profondeur (entre le fond et le sol, sous le héros), et l'émetteur de gouttes de sang ; expose `destroy()`.
- `BootScene.ts` : chargement de la feuille.
- `GameScene.ts` : instanciation dans `buildBackdrop()` (ou juste après) **si** `backdropKey === "cathedrale"`, destruction lors du changement de salle.
- Aucune modification du combat, des ennemis ou de la logique de sortie.
