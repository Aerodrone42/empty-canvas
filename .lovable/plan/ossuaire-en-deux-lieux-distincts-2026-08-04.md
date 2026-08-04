# Ossuaire en deux lieux distincts

L'Ossuaire s'étale aujourd'hui sur 3200 px avec une seule peinture répétée en miroir : le joueur
voit littéralement deux fois le même décor. On le coupe en deux lieux différents qui se suivent
naturellement.

## Ce qui change

- Nouveau décor peint : **Les Catacombes Basses** (`throne_bg_catacombs.png`), suite logique de
  l'Ossuaire — voûtes plus basses, murs de crânes empilés, niches funéraires, brume au sol,
  même palette os/vert-gris que l'Ossuaire pour éviter tout choc visuel.
- Découpage du tronçon 3600 → 6800 :
  - L'Ossuaire : 3600 → 5200 (`throne-ossuary`)
  - Les Catacombes Basses : 5200 → 6800 (`throne-catacombs`)
- Teintes et poussières quasi identiques entre les deux (léger assombrissement progressif vers
  les catacombes), pour que la transition se lise comme un enfoncement et non comme une coupure.
- Fondus inchangés (2000 px), donc les deux lieux se recouvrent longuement.

## Détails techniques

- `src/game/assets.ts` : ajout de l'entrée `throne-catacombs`.
- `src/game/roomConfig.ts` : remplacement du segment Ossuaire par deux segments.
- Aucun changement dans `Parallax.ts` : la logique de fondu gère déjà N segments.
