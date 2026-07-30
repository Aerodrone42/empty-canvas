## Objectif

Les colonnes actuelles sont posées en arrière-plan (`depth -20`), répétées tout le long de la salle, et le calque lointain qui défile donne l'impression que tout bouge. On passe à un vrai effet de perspective : **4 colonnes maximum, larges, au premier plan**, derrière lesquelles le héros passe.

## Ce qui sera fait

Uniquement dans `src/game/effects/Parallax.ts` :

1. **Colonnes en avant-plan (`addAnchoredMid` remplacé par `addForegroundPillars`)**
   - Exactement 4 colonnes réparties sur la largeur de la salle (2400 px), avec un écart régulier et une marge aux extrémités, positions légèrement variées pour éviter la régularité mécanique.
   - `setScrollFactor(1.12)` : elles défilent un peu plus vite que le joueur — c'est ce qui crée la perspective, sans "glissement" gênant puisqu'elles restent ancrées au sol.
   - `setDepth(12)` : au-dessus du joueur (depth par défaut 0, effets jusqu'à 8), donc **le personnage passe derrière**.
   - Base calée sur la ligne de sol, hauteur portée à ~1.15x la hauteur du viewport pour qu'elles sortent du cadre en haut et en bas — c'est ce qui vend l'avant-plan.
   - Assombrissement (`setTint`) et légère désaturation : un avant-plan proche est en contre-jour, ce qui garde le héros lisible au milieu.

2. **Fond plus calme**
   - Le calque lointain garde une parallaxe très faible (0.08 au lieu de 0.15) pour que le décor ne semble plus "bouger" tout seul.
   - Le cadre rocheux `near` aux deux extrémités reste, mais passe aussi en avant-plan (depth 12) pour rester cohérent avec les nouvelles colonnes.

3. **Lisibilité du HUD/héros**
   - Aucune colonne placée à moins de ~300 px du point de spawn du joueur (x=180), pour ne pas masquer le personnage au démarrage.

## Détails techniques

Le HUD est en React au-dessus du canvas : monter les colonnes à depth 12 n'a aucun impact dessus. Les colonnes sont purement décoratives (aucun corps de collision ajouté), donc la logique de jeu, les ennemis et le sol restent inchangés. Une capture Playwright validera l'occlusion du héros et l'espacement.
