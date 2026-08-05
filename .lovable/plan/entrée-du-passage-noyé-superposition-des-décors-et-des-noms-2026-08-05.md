# Entrée du Passage Noyé : superposition des décors et des noms

À l'approche du Passage Noyé, on voit littéralement les deux lieux l'un à travers l'autre, et les
deux cartouches de nom s'affichent en même temps au même endroit. Deux causes distinctes.

## 1. Les décors se fusionnent

Le fondu actuel baisse l'opacité du lieu sortant pendant qu'il monte celle du lieu entrant. Au
milieu, les deux sont à moitié transparents : on voit les colonnes de l'ossuaire à travers l'eau,
d'où l'effet de double exposition sur 2000 px.

Correction : le lieu qui arrive se dessine **par-dessus** le précédent, qui reste opaque jusqu'au
bout. Seule la peinture entrante monte de 0 à 1 ; l'ancienne n'est masquée qu'une fois la nouvelle
complètement posée. Plus jamais deux décors semi-transparents en même temps, tout en gardant une
arrivée progressive.

- Fondu resserré : 1400 px de transition totale (au lieu de 2000), centré sur la jointure, pour
  que la montée soit franche mais pas brutale.
- Le voile de teinte et la couleur des poussières continuent d'être interpolés normalement : c'est
  ce qui donne la sensation d'entrer dans l'eau.

## 2. Les deux noms se superposent

Le cartouche reste affiché 2,7 s et rien n'empêche un second cartouche de s'afficher par-dessus.
Entre les Catacombes Basses et le Passage Noyé la distance est courte, donc les deux titres se
chevauchent.

Correction : un seul cartouche vivant à la fois. L'arrivée d'un nouveau lieu efface immédiatement
le précédent (fondu de sortie rapide) avant d'afficher le nouveau nom. Le titre s'affiche aussi au
franchissement réel de la borne du lieu, pas pendant le fondu.

## Détails techniques

- `src/game/effects/Parallax.ts` : `TRANSITION_HALF` à 700 ; dans `update()`, la peinture sortante
  garde `alpha = 1` et la peinture entrante passe de 0 à 1 avec la même courbe lissée ; les
  peintures déjà traversées repassent à 0. Ordre de profondeur déjà croissant par segment, donc
  l'entrante est bien au-dessus.
- `src/game/scenes/GameScene.ts` : `showSegmentTitle` mémorise les objets courants (`label`,
  `rule`) et les détruit avant d'en créer de nouveaux, via un tween d'arrêt.
