## Objectif

Garder l'emplacement et la couleur actuels de la veine, mais lui donner une vraie vie : elle gonfle et se rétracte de façon visible, et elle saigne par endroits.

## 1. Pulsation visible (gonflement / rétraction)

Dans `src/game/effects/CorridorVein.ts` :

- Passer d'un frémissement de 4 % à un vrai battement cardiaque : amplitude verticale d'environ 35 % (échelle de 0,88 à 1,22) avec un rythme en deux temps (contraction rapide ~180 ms, relâchement lent ~700 ms, pause ~900 ms) plutôt qu'un yoyo sinusoïdal uniforme.
- Coupler la teinte au battement : légèrement plus claire/plus rouge au pic de gonflement, plus sombre au repos.
- Ajouter un léger défilement de la texture (`tilePositionX`) très lent pour donner l'impression d'un flux interne.
- Décaler la phase par tronçons : découper la bande en 3 segments contigus animés avec un léger retard entre eux, pour que l'onde parcoure le corridor sur toute sa longueur au lieu de pulser d'un bloc.

## 2. Saignement

- Ajouter 4 à 6 points de fuite répartis le long de la veine.
- À chaque battement, une ou deux de ces sources lâchent une goutte : petite gouttelette sombre qui s'allonge, tombe le long du mur en accélérant, puis s'estompe avant d'atteindre le sol.
- Traînée courte laissée derrière la goutte, qui s'efface progressivement.
- Rendu dans la même tranche de profondeur que la veine (derrière les statues et le joueur) pour ne rien masquer.

## 3. Performance

- Utiliser un petit pool de gouttes réutilisées (pas de création/destruction continue).
- Suspendre les tweens et le saignement quand la veine est hors du champ visible de la caméra.

## Détails techniques

- Fichiers touchés : `src/game/effects/CorridorVein.ts` uniquement (l'instanciation dans `GameScene.ts` reste inchangée).
- Aucun nouvel asset requis : les gouttes sont dessinées par `Graphics`/rectangles teintés réutilisés.
- Profondeur conservée (`-4`), position `floorY - 430`, teinte de base `0x9b3038`.
