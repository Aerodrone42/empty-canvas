## Objectif

Chaque piège ne montre qu'une seule main. Il en faut une petite grappe (3-4 mains), et surtout une phase d'annonce : le sol tremble et projette des débris de terre juste avant que les mains jaillissent.

## Grappe de mains

Dans `src/game/entities/GraspingHands.ts` : remplacer le sprite unique par 3-4 sprites répartis autour de `x` (décalages ~ -34, -12, +14, +36 px), avec :
- échelle légèrement variable (0.20 à 0.28) pour un rendu organique,
- frame de départ décalée et léger retard (30-80 ms) sur le `play`, pour qu'elles ne sortent pas toutes en même temps,
- `flipX` alterné et profondeurs proches (7) pour éviter l'effet « copié-collé ».

Le retrait à la fin des 3 secondes joue `playReverse` sur chaque main avec le même décalage.

## Phase d'annonce : sol qui bouge

Nouvelle étape avant la saisie, ~350 ms :
1. Le héros entre dans le rayon et le piège est prêt → état « éveil ».
2. Un petit monticule de terre (frame 0 de la planche, alpha faible) apparaît et vibre légèrement en boucle (tween sur x/y de quelques pixels).
3. Des particules de terre sont projetées vers le haut depuis le point de sortie (texture générée en code : petits carrés bruns, gravité positive, courte durée de vie), plus une secousse de caméra très faible si le héros est proche.
4. À la fin des 350 ms, les mains jaillissent et la saisie de 3 s démarre comme aujourd'hui.

Si le héros quitte le rayon pendant l'éveil, le piège s'annule et retourne en cooldown court — le joueur peut donc éviter le piège en réagissant vite.

## Détails techniques

- Ajout d'une texture `fx-soil` générée une fois (petits fragments bruns), sur le modèle de `fx-dust` dans `Parallax.ts`.
- L'émetteur de terre est créé une seule fois par piège et déclenché via `explode()` pour ne pas coûter en performances.
- Aucun changement côté `Player.ts` (la mécanique de blocage 3 s reste identique) ; `GameScene.ts` continue de relayer l'événement de saisie inchangé.
- Pas de nouvel asset : on réutilise `mains_sol_spritesheet.png`.
