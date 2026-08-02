## Objectif

Supprimer les plateaux suspendus qui cassent le style visuel (simples rectangles bordeaux dessinés à la volée, sans sprite ni intégration au décor).

## Changements

1. **`src/game/roomConfig.ts`** — vider le tableau `platforms` pour les salles intérieures :
   - `cathedrale` : suppression des 2 plateaux
   - `corridor` : suppression des 2 plateaux
   - `throne` : suppression des 3 plateaux (l'arène reste au sol, les vagues sont inchangées)
   - `exterieur` : plateaux conservés (verticalité assumée du parvis, accompagnée des fosses)

2. **`src/game/scenes/GameScene.ts`** — la boucle de création des plateaux (`buildGeometry`, l. 683-689) reste en place mais ne produira plus rien dans les salles vidées. Aucun autre code à toucher : les collisions joueur/ennemis passent par le même `staticGroup`.

## Résultat

Nef, Corridor et Trône redeviennent des espaces au sol cohérents avec le décor peint ; seul l'Extérieur garde du relief.
