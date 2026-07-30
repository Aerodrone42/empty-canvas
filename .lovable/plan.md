## Problème

Aujourd'hui la salle 2 utilise une seule image (`corridor_bg_far.png`) étirée sur toute la largeur de la salle avec `scrollFactor 1`. Résultat : on longe **un mur latéral** au lieu de remonter le couloir, l'image se déforme sur 2 800 px et le sol peint ne colle pas à la ligne de sol jouable.

## Objectif

Un vrai couloir traversé **en enfilade** : voûte et dallage qui fuient vers un point de fuite, arches qui défilent de part et d'autre du héros, profondeur qui reste stable quand on avance.

## Ce qui sera fait

**1. Nouveaux visuels du corridor (3 calques)**
- `corridor_bg_far.png` (1920x1080) — fond de perspective : enfilade d'arches gothiques vers un point de fuite central, voûte nervurée en fuite, dallage en perspective, brume et lanterne rouge au fond. Statique, très sombre.
- `corridor_bg_mid.png` (1920x1080, **tuilable horizontalement**) — travées de couloir : piliers et arcs latéraux vus de trois quarts, ossuaires, grilles, chaînes, alignés sur la ligne de sol.
- `corridor_bg_near.png` (1920x1080, **tuilable**, fond transparent) — piliers de premier plan largement espacés, sombres, derrière lesquels le héros passe.

Les images sont générées puis ajoutées à `public/assets/sprites/backgrounds/`, chargées dans `BootScene.ts` (les clés `corridor-mid` / `corridor-near` existent déjà dans `assets.ts`).

**2. `src/game/effects/Parallax.ts`**
- Branche `corridor` réécrite : trois couches au lieu d'une.
  - far : image unique fixée à l'écran (`scrollFactor 0.05`) → le point de fuite reste devant nous, on ne « traverse » plus l'image.
  - mid : `tileSprite` ancré au sol, `scrollFactor 0.45` → les travées défilent, l'impression est celle d'avancer dans le couloir.
  - near : `tileSprite` transparent, `scrollFactor 1.25`, depth au-dessus du héros → les piliers passent devant la caméra.
- Alignement de chaque couche sur `floorY` (plus d'étirement arbitraire), pour que le dallage rejoigne la ligne de sol jouable.
- Vignettage latéral conservé, densité de poussière/braises inchangée.

**3. Ajustement du décor de salle**
- Les trois statues pleureuses sont repositionnées entre les travées pour ne pas se superposer aux piliers de premier plan (`GameScene.buildBackdrop`).

## Détails techniques

- Aucune modification du gameplay, des ennemis, des pièges ou de la porte de fin de salle.
- Les autres salles (cathédrale, trône, extérieur) gardent leur rendu actuel : la nouvelle logique reste dans la branche `key === "corridor"`.
- Perf : trois `tileSprite`/`image` statiques, aucun calcul par frame ajouté (`update()` reste vide).
