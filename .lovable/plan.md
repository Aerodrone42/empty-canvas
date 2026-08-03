## Cause confirmée

Dans la salle du trône, chaque grande peinture contient **à la fois le fond architectural et le sol en perspective**, mais l’image complète défile à `0,35×`. Les éléments solides posés dans la salle — autel, torches, colonne de sortie, pendus et mains — défilent à `1×` avec le héros et les collisions. Ils glissent donc inévitablement sur le sol peint.

## Correction

1. **Rattacher les peintures segmentées au monde**
   - Faire défiler l’image complète, sol compris, à `1×` comme tous les objets physiques.
   - Recalculer leur largeur et leur position pour conserver une couverture continue des segments.

2. **Conserver les transitions sans désolidariser le sol**
   - Garder les longs fondus entre les huit peintures.
   - Les deux peintures superposées pendant un fondu utiliseront exactement la même vitesse monde, évitant tout glissement ou raccord mobile.

3. **Réserver le parallaxe aux éléments réellement lointains**
   - Ne plus appliquer de parallaxe à une image qui contient le sol.
   - Garder uniquement les poussières et effets atmosphériques à une vitesse différente, puisqu’ils ne sont pas physiquement posés sur le sol.

4. **Vérifier toute la traversée**
   - Contrôler au début, au milieu et près du trône que l’autel, les torches, les pièges et la colonne restent fixés au même point du dallage.
   - Vérifier qu’aucun bord vide ni saut n’apparaît aux changements de segment.

## Fichier principal

- `src/game/effects/Parallax.ts`

Aucun décor, ennemi ou contenu narratif ne sera ajouté ou modifié.