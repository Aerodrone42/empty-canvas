## Problème

Le socle `floor_torch_base.png` (154x220) n'a aucun pixel opaque au-dessus de la couronne : tout ce qui se trouve entre la lèvre de la vasque (y≈50) et le haut de l'image est transparent. La flamme étant ancrée à 56 px du haut du socle, on voit le décor du fond à travers la zone que devrait occuper la vasque et son lit de braises — d'où le trou signalé par la flèche.

## Correction

1. **Retoucher `public/assets/sprites/props/floor_torch_base.png`** (script Python/PIL, pas de régénération IA) :
   - Peindre une vasque opaque en fer forgé fermée au niveau de la couronne (y ≈ 44-64), avec la lèvre déjà présente comme repère.
   - Ajouter à l'intérieur un lit de braises statique (charbons sombres + rougeoiement) qui remplit la coupe, entièrement opaque.
   - Ne toucher à rien en dessous : le fût et le pied restent inchangés.

2. **Réaligner la flamme dans `src/game/effects/FloorTorch.ts`** :
   - Ajuster `FLAME_DY` pour que le bas de la flamme repose exactement sur le lit de braises nouvellement peint (aucun vide, aucun chevauchement).

3. **Vérification** : capture Playwright de la salle cathédrale et de la salle 2 pour confirmer qu'aucun fond ne transparaît sous la flamme, à petite comme à grande échelle.

## Détails techniques

Aucune modification de gameplay, de collision ou de scène. Seuls l'asset PNG du socle et les constantes d'offset de flamme changent ; les dimensions du socle (BASE_W/BASE_H) et des frames de flamme (81x102) restent identiques, donc `BootScene.ts` n'a pas besoin d'être modifié.
