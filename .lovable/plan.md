## Problème

Dans `src/game/effects/Parallax.ts`, les peintures de segments sont créées avec `setScrollFactor(0)` et repositionnées à `x = viewWidth/2 + …` en coordonnées écran. Le décor est donc **collé à la caméra** : il ne bouge pas quand le héros avance, alors que tous les objets de monde (autel, herses, mains, écorchés, ennemis) défilent normalement. D'où l'impression que « le décor bouge et le fond est fixe ».

Le léger travelling actuel (`overflow * (0.5 - progress) * 0.32`) est calculé sur la progression dans le segment, pas sur la caméra, ce qui ne produit aucun vrai parallaxe.

## Correction prévue

1. **Ancrer les peintures au monde avec un facteur de parallaxe**
   - Chaque peinture de segment reçoit un `scrollFactor` de fond (~0.35) au lieu de 0.
   - Sa position X est recalculée à chaque frame à partir de `camera.scrollX`, de manière à rester centrée sur son segment tout en dérivant plus lentement que le sol : le fond avance, mais moins vite que le héros.

2. **Couvrir toute la longueur du segment**
   - Une peinture unique de ~1920 px ne couvre pas un segment de 1800–2200 px lorsqu'elle défile plus lentement. La peinture sera étirée/échantillonnée pour couvrir la largeur de segment vue à travers son facteur de parallaxe, sans déformation verticale (ratio conservé, débord latéral rogné par la caméra).

3. **Conserver les fondus longs entre zones**
   - Le crossfade actuel (1040 px de transition, courbe lissée) reste inchangé ; seule la position/le scrollFactor change. Les deux peintures en fondu défilent au même rythme, donc aucun décalage visible au raccord.

4. **Éléments d'ambiance cohérents**
   - Le voile coloré et le vignettage restent fixes à l'écran (correct pour une ambiance).
   - Les poussières passent à un scrollFactor proche de celui du fond pour ne plus « glisser » par rapport à lui ; les braises restent liées au sol.

5. **Vérification**
   - Contrôle en déplacement continu depuis le spawn jusqu'au trône : le fond doit défiler visiblement plus lentement que le sol et les props, sans bande vide, sans saut au passage d'un segment à l'autre.

## Détails techniques

- Fichier concerné : `src/game/effects/Parallax.ts` (méthodes `buildSegments` et `update`).
- `update(worldX)` reçoit déjà la position ; on utilisera en plus `scene.cameras.main.scrollX` pour le placement.
- Aucun changement dans `roomConfig.ts`, `assets.ts` ni `GameScene.ts`.
