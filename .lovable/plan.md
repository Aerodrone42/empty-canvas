## Objectif

Supprimer la renaissance gratuite illimitée. À la mort, le héros repart au dernier **Autel de Sang** activé (juste avant le boss), en perdant toute sa Chair accumulée, et la zone se recharge en ennemis.

## Règles de mort

- Plus de bouton « Renaître » qui relance une run neuve.
- L'écran de mort propose : **Se relever à l'autel** (si un autel est activé dans la salle) et **Retour au menu**.
- Si aucun autel n'a été activé dans la salle, la reprise se fait au début de la salle courante (pas au niveau 1).
- Coût d'une mort :
  - toute la Chair (`flesh`) est perdue ;
  - la vie repart au maximum ;
  - les ennemis de la salle (et le boss s'il n'est pas mort) réapparaissent au complet ;
  - les mutations déjà greffées sont conservées (progression permanente).
- Un compteur de morts est affiché sur l'écran de mort et dans le HUD de fin de salle.

## Autel de Sang (point de sauvegarde)

- Nouveau décor interactif `src/game/effects/BloodAltar.ts` : vasque de pierre remplie de sang, braise et lueur pulsante, particules quand il est éteint → allumé.
- Placement Salle I : à `x ≈ 1350`, juste avant le déclencheur de la Monture d'Effroi (`MOUNT_TRIGGER_X = 1500`), donc impossible de manquer l'autel avant le boss.
- Placement Salle II : avant la machine d'écartèlement (`x ≈ 1150`).
- Activation : en s'approchant, une invite « Sceller le sang » apparaît ; l'action d'interaction (touche/bouton déjà mappable) allume l'autel, soigne à bloc et enregistre le point de réapparition.
- Une fois allumé, il reste allumé pour la salle et sert de point de retour à chaque mort.

## Sauvegarde

- Le store mémorise `checkpoint: { stage, x } | null` et `deaths`.
- Sauvegardé en local avec le reste de la run, donc le checkpoint survit à un rechargement de page.
- Le checkpoint est remis à zéro en entrant dans une nouvelle salle et à chaque nouvelle run.

## Détails techniques

- `src/store/gameStore.ts` : ajout de `checkpoint`, `deaths`, `setCheckpoint()`, `respawnAtCheckpoint()` (flesh → 0, health → maxHealth, phase → `playing`), sérialisation dans `SavedRun`, reset dans `startNewRun` / `continueAtStage` / `setStage`.
- `src/game/scenes/GameScene.ts` : instanciation de l'autel selon `backdropKey`, appel `tick()` dans la boucle, écoute du passage en phase `dead` puis, à la reprise, `scene.restart({ backdrop, spawnX })` pour respawner à l'autel avec ennemis et boss régénérés.
- `create()` accepte un `spawnX` optionnel ; si l'autel de la salle était déjà scellé, il démarre allumé.
- `src/components/game/PauseMenu.tsx` : refonte de `DeathScreen` (bouton autel, mention de la Chair perdue, compteur de morts).
- `src/components/game/Hud.tsx` : petit repère « autel scellé » quand un checkpoint est actif.

Aucun changement d'équilibrage des dégâts ni des stats du boss.