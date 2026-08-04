# Coupure verticale dans la salle du Trône

## Cause confirmée

Les huit peintures de la salle du Trône font toutes 1920 × 1088 px. Chaque tronçon
mesure environ 2840 à 3240 px de large et la peinture y est **répétée** (tuilage)
pour couvrir la longueur.

Comme le bord droit d'une peinture ne correspond pas à son bord gauche, la
répétition crée une **arête verticale nette** au moment où la texture recommence —
exactement la coupure entourée sur la capture (colonne coupée net, changement
brutal de luminosité).

## Correction

1. **Répétition en miroir**
   - Remplacer le tuilage simple par une suite de copies de la peinture dont une
     sur deux est retournée horizontalement. Le bord droit d'une copie devient
     alors identique au bord gauche de la suivante : plus aucune arête.

2. **Fondu de jointure**
   - Ajouter un léger recouvrement dégradé (environ 200 px) entre deux copies pour
     effacer la symétrie trop lisible et masquer toute différence résiduelle.

3. **Aucune déformation**
   - Les copies gardent l'échelle uniforme actuelle (ratio natif conservé), calée
     sur la hauteur de vue ; seule la façon de couvrir la longueur change.

4. **Fondus entre zones inchangés**
   - Le crossfade de 1040 px entre deux lieux et l'ancrage monde à vitesse 1×
     restent identiques ; chaque tronçon devient simplement un groupe de copies
     dont l'opacité est pilotée ensemble.

5. **Vérification visuelle**
   - Contrôler au début, au milieu et à la fin de chaque tronçon qu'aucune arête
     verticale ne subsiste et que les colonnes restent proportionnées.

## Fichier principal

- `src/game/effects/Parallax.ts`

Aucun décor, ennemi ni contenu narratif ne sera ajouté ou modifié.
