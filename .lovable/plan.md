## Constat vérifié

En décomposant `public/assets/sprites/props/dread_mount_prey_spritesheet.png` (6 frames de 320x238), la zone de l'aile arrière (droite, derrière le cavalier) est :
- **vide sur les frames 1, 2, 5, 6**
- **dessinée uniquement sur les frames 3 et 4**

Résultat à l'écran : l'aile droite « clignote » — elle surgit puis disparaît, au lieu de battre. La cause est le script de génération (`order=[0,1,2,2,1,0]`) : seule l'image source n°2 contient cette aile, les deux autres sources n'en ont pas.

## Correction proposée

1. **Extraire l'aile arrière** depuis la frame source qui la contient (masque polygonal autour de la zone aile droite, avec léger feathering pour éviter la couture), et la conserver comme calque réutilisable.
2. **La recomposer sur les 6 frames**, derrière le cavalier et le corps (ordre de composition : aile arrière → corps/cavalier → aile avant), pour qu'elle soit toujours présente.
3. **L'animer** par rotation autour de son point d'attache à l'épaule, en opposition de phase avec l'aile avant (cycle type : +9°, +3°, -6°, -9°, -3°, +5°), avec une légère compression horizontale sur les frames d'extension pour simuler la perspective.
4. **Nettoyer les résidus** de l'aile dans les frames sources 3 et 4 avant recomposition, pour éviter une double aile.
5. Appliquer le même traitement aux deux planches : `dread_mount_prey_spritesheet.png` et `dread_mount_fed_spritesheet.png`.
6. **Vérification** : re-découpage des 6 frames et contrôle visuel que la zone aile droite est non vide et varie progressivement sur tout le cycle.

## Détails techniques

- Script Python/PIL (hors dépôt, dans `/tmp`) régénérant les deux spritesheets à partir des originaux `/tmp/prey_orig.png` et `/tmp/fed_orig.png`.
- Dimensions inchangées : 6 frames × 320×238 → 1920×238, donc **aucune modification** de `src/game/scenes/BootScene.ts` ni de `src/game/effects/DreadMount.ts` n'est nécessaire.
