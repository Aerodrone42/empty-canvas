## Objectif

Les piliers d'avant-plan flottent : leur base s'arrête en l'air et un vide apparaît en haut de l'écran. On les colle au **haut de la salle**, de sorte qu'ils descendent depuis le plafond — le joueur lit alors « colonne dont le bas est détruit », ce qui est cohérent avec les ruines.

## Ce qui sera fait

Dans `src/game/effects/Parallax.ts`, méthode `addForegroundPillars` :

1. **Ancrage haut** : origine passée de `(0.5, 1)` (base au sol) à `(0.5, 0)` avec `y` calé sur le haut de la salle (y = 0, voire légèrement au-dessus, -20 px) pour qu'aucun bord supérieur ne soit visible.
2. **Hauteur variable** : chaque pilier reçoit une hauteur différente (entre ~55 % et ~85 % de la hauteur visible) au lieu d'une hauteur unique, pour éviter l'effet « peigne » régulier et suggérer une destruction inégale.
3. **Bas cassé** : la tranche de texture est choisie pour finir sur une section brisée, et un léger fondu vers le bas (dégradé alpha ou masque sombre sur les ~40 derniers px) évite la coupe nette.
4. **Espacement conservé** : toujours 4 piliers max, marge de sécurité autour du spawn du héros, même largeur (~12 % de l'écran) et même parallaxe (`scrollFactor 1.1`, teinte sombre) — le héros continue de passer derrière.

## Détails techniques

Aucun changement de gameplay, de collision ni d'ascenseur. Les piliers restent purement décoratifs à `depth 12`. Vérification par capture Playwright : contrôle qu'aucun pilier ne touche le sol, qu'aucun bord supérieur n'est visible, et que le héros reste lisible au spawn.
