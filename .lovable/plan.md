## Problème

La veine est découpée en 3 tronçons (`SEGMENTS = 3`) dans `src/game/effects/CorridorVein.ts`. Chaque tronçon :
- démarre avec un décalage de texture arbitraire (`tilePositionX = i * 137`), donc le motif ne se raccorde pas d'un tronçon à l'autre ;
- est animé avec un retard de phase (`delay = i * 220`), donc les hauteurs (`scaleY`) diffèrent au moment du raccord.

Résultat : une marche nette au point de jonction, exactement là où c'est entouré sur la capture.

## Correction

Dans `src/game/effects/CorridorVein.ts` uniquement :

1. **Continuité de la texture** : calculer le décalage de chaque tronçon à partir de sa position réelle (`tilePositionX = i * segW / scale`) au lieu d'une valeur arbitraire, pour que le motif se poursuive sans couture. Le tween de flux interne applique le même déplacement à tous les tronçons, avec la même durée et le même démarrage, pour rester synchrone.

2. **Suppression de la marche verticale** : le décalage de phase entre tronçons est ce qui crée la rupture de hauteur. Deux options combinées :
   - réduire fortement le retard (de 220 ms à ~90 ms) et l'amplitude du battement aux extrémités ;
   - faire se **chevaucher** les tronçons de quelques pixels (largeur + ~12 px) pour que la transition soit masquée.

3. **Origine verticale cohérente** : garder `origin(0, 0.5)` sur tous les tronçons et une teinte identique au même instant, pour que la variation de hauteur reste centrée sur la même ligne.

## Détails techniques

- Fichier touché : `src/game/effects/CorridorVein.ts`.
- Aucun changement d'asset, de position (`floorY - 430`), de profondeur (`-4`) ni de teinte.
- Le saignement (pool de gouttes) reste inchangé.
