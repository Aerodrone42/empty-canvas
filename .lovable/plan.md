## Problème

La barre « ABSORPTION » reste affichée en salle 2 alors qu'aucune absorption n'est en cours.

Cause identifiée dans `src/game/entities/Player.ts` : à la fin de l'absorption (ligne ~296), le code appelle `consumeFleshForHealth()` puis remet l'état du joueur à `idle` — mais il n'appelle jamais `setAbsorb(false, 0)`. Or `consumeFleshForHealth()` ne remet le flag `absorbing` à `false` que s'il réussit ; si la vie est déjà pleine ou la chair insuffisante, il sort en `return false` sans rien changer. Le flag `absorbing` du store reste donc à `true`, et le HUD (`src/components/game/Hud.tsx`, condition `absorbing &&`) garde la barre à l'écran — y compris après un changement de salle, puisque `scene.restart()` ne réinitialise pas ce flag.

## Correctifs

1. `src/game/entities/Player.ts`
   - À la fin de l'absorption réussie ou non : toujours appeler `setAbsorb(false, 0)` avant de repasser en `idle`.
   - Rendre `cancelAbsorb()` inconditionnel côté store (remettre `absorbing:false` même si `moveState` n'est plus `absorb`), pour couvrir les sorties d'état par d'autres chemins (dégâts, esquive, attaque, saut).
   - Au démarrage du joueur (constructeur / création de la scène), remettre `setAbsorb(false, 0)` pour repartir propre à chaque salle.

2. `src/game/scenes/GameScene.ts`
   - Filet de sécurité dans la boucle : si le joueur n'est pas en état d'absorption, forcer `absorbing:false` dans le store (uniquement quand la valeur diffère, pour éviter des rendus inutiles).

Aucun changement de gameplay ni d'équilibrage : seul l'affichage résiduel est corrigé.
