## Problème

Pendant l'absorption, un anneau rose (`onHeal` dans `GameScene.ts`, émis à chaque tick depuis `Player.ts`) se superpose au héros : lisible mais très moche. Les flaques au sol sont de simples ellipses plates unies, du même registre visuel pauvre.

## Ce qui sera fait

### 1. Suppression de l'anneau

Dans `src/game/scenes/GameScene.ts`, `onHeal` ne crée plus de cercle avec contour. L'événement `fx-heal` est conservé (même signature, émis depuis `Player.ts` ligne 269) mais délègue à un nouvel effet de siphon.

### 2. Sang qui remonte le long du corps

Nouvelle méthode `siphon(x, y)` dans `src/game/effects/Blood.ts` :

- **Filets ascendants** : émetteur de particules `DROP_KEY` teintées crimson, `gravityY` négatif, position de départ au niveau des pieds, vitesse verticale vers le haut, dispersion horizontale faible (± largeur du corps) et durée de vie calée pour atteindre le torse puis s'estomper — donne l'impression que le sang grimpe le long des jambes et du manteau.
- **Veines lumineuses** : 2-3 courtes traînées verticales (rectangles fins tweenés de bas en haut, alpha en fondu) pour matérialiser des filaments qui s'enroulent autour du corps.
- **Lueur d'absorption** : léger pulse de teinte crimson sur le sprite du héros (`setTint` / `clearTint` ou halo `MIST_KEY` très diffus derrière lui, depth inférieur au joueur) au lieu d'un contour net devant lui.
- **Nourrissage continu** : l'effet est peu coûteux et non cumulatif — un garde-fou empêche de relancer un nouvel émetteur à chaque tick (throttle ~120 ms).

### 3. Flaques au sol dans le même esprit

Toujours dans `Blood.ts`, `stain()` est retravaillée :

- Chaque flaque devient un petit amas de 3-5 ellipses de tailles et d'opacités différentes (une masse centrale plus sombre + éclaboussures satellites plus claires), légèrement décalées et aplaties — silhouette organique au lieu d'un ovale parfait.
- Palette resserrée sur les rouges profonds existants (`CRIMSON`), la couche centrale plus sombre pour donner de la profondeur.
- Le drainage (`drainPool`) fait rétrécir et pâlir l'ensemble de l'amas de façon cohérente, et déclenche quelques gouttelettes qui décollent du sol vers le héros — liaison visuelle directe avec l'effet de siphon.

## Détails techniques

Aucun changement de gameplay, d'équilibrage ni de logique de soin : `ABSORB_COST`, `ABSORB_HEAL`, la durée et le drainage restent identiques. Modifications limitées à `src/game/effects/Blood.ts` et à `onHeal` dans `src/game/scenes/GameScene.ts`. Vérification par capture Playwright pendant une absorption pour contrôler que le héros reste lisible et qu'aucun anneau ne subsiste.
