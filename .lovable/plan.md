# Corriger le sol des Catacombes Basses

Sur la peinture `throne_bg_catacombs.png`, le dallage s'arrête sur un rebord surélevé et retombe
en marche dans le bas de l'image. Le héros marche sur la ligne de sol du jeu (`FLOOR_Y = 880`),
donc il se retrouve visuellement au-dessus du vide : effet de lévitation.

## Ce qui change

- Retouche de la peinture des Catacombes Basses : suppression de la marche / du rebord au premier
  plan, le dallage se prolonge sans rupture jusqu'au bas de l'image.
- Hauteur de l'horizon de sol alignée sur celle des autres décors du Trône (Ossuaire, Passage
  Noyé), pour que le héros pose les pieds au même endroit d'un lieu à l'autre.
- Ambiance conservée à l'identique : murs de crânes, niches, statue, bougies, brume basse.

## Vérification

Contrôle en jeu : parcours 3600 → 6800 px de la salle du Trône, capture d'écran pour confirmer
que les pieds du héros touchent le dallage sur toute la traversée, y compris dans le fondu.

## Détails techniques

- `public/assets/sprites/backgrounds/throne_bg_catacombs.png` régénéré/retouché ; aucune
  modification de code nécessaire (`BELOW_FLOOR` et l'ancrage de `Parallax.ts` restent inchangés).
- Si l'écart persiste après retouche, ajustement fin de l'ancrage vertical du décor plutôt que de
  déplacer `FLOOR_Y`, qui est partagé par toutes les salles.
