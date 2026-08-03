## Cause confirmée

Les huit peintures de la salle du trône font toutes **1920 × 1088** (ratio 1,76).

Dans `Parallax.ts`, chaque peinture est affichée avec une largeur imposée :
`largeur = largeur du segment + 1040 px`, soit environ **2840 à 3240 px**, pour une
hauteur d'environ un écran seulement. L'image est donc **étirée horizontalement
d'environ 1,7 à 2×** : colonnes trop larges, arches aplaties, personnages et
statues déformés.

La hauteur, elle, reste correcte — seule la largeur est forcée.

## Correction

1. **Respecter le ratio natif de chaque image**
   - Calculer la largeur d'affichage à partir de la hauteur choisie et du ratio
     réel de la texture, jamais à partir de la longueur du segment.

2. **Couvrir la longueur du segment sans étirer**
   - Les segments (1800 à 2200 px) sont plus longs qu'une peinture au ratio natif.
   - Rendre chaque segment avec une peinture répétée horizontalement (tuilage à
     l'échelle correcte) plutôt qu'une seule image dilatée, en conservant
     l'ancrage monde à vitesse 1× déjà en place.

3. **Conserver les fondus entre zones**
   - Le fondu progressif de 1040 px entre deux zones reste identique ; seules les
     dimensions d'affichage changent.

4. **Vérifier visuellement**
   - Contrôler au début, au milieu et près du trône que les colonnes et arches
     retrouvent des proportions verticales normales et qu'aucun vide n'apparaît
     aux extrémités des segments.

## Fichier principal

- `src/game/effects/Parallax.ts`

Aucun décor, ennemi ni contenu narratif ne sera ajouté ou modifié.
