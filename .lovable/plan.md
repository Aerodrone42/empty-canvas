## Objectif

Remplacer le bouton « Continuer » (qui reprend simplement la partie) par un écran de sélection de salle listant les 4 stages, tous accessibles en permanence, pour tester n'importe quel niveau sans refaire les précédents.

## Ce qui existe aujourd'hui

- Le jeu enchaîne 4 décors : `cathedrale`, `corridor`, `throne`, `exterieur` (`ROOM_ORDER` dans `GameScene.ts`).
- `BootScene` lance toujours `game` sans paramètre : la partie démarre forcément à la cathédrale.
- Le store (`gameStore.ts`) ne mémorise ni la salle courante ni la progression ; `continueRun()` se contente de repasser en phase `playing`.
- Rien n'est persisté entre deux rechargements (vie, chair, mutations, salle).

## Ce qui sera construit

1. **Suivi de la salle courante dans le store**
   - Nouveau champ `stage` (clé de décor) mis à jour à chaque entrée dans une salle.
   - Sauvegarde de l'état de run (salle, vie, vie max, chair, mutations, kills, parades) dans le stockage local du navigateur, restaurée au lancement.

2. **Écran de sélection de salle**
   - Le bouton « Continuer » ouvre un panneau listant les 4 salles avec leur nom lisible (I — La Nef Suppurante, II — Le Corridor de Chair, III — Le Trône, IV — L'Extérieur), toutes cliquables en permanence.
   - La salle où l'on s'était arrêté est mise en avant (« reprise ici »).
   - Bouton Retour vers le menu principal.

3. **Chargement de la salle choisie**
   - Le clic démarre/redémarre la scène de jeu sur le décor choisi, en conservant l'état sauvegardé du héros (vie, chair, mutations) — pas de remise à zéro.
   - « Nouvelle partie » reste inchangée : salle 1, état neuf.

## Détails techniques

- `gameStore` : ajout de `stage`, `setStage`, `continueAtStage(key)`, plus persistance localStorage (clé dédiée, hydratation au montage comme `bindingsStore.hydrate()`).
- Nouvelle phase UI `stages` (ou état local du menu) pour l'écran de sélection ; nouveau composant `src/components/game/StageSelect.tsx` rendu depuis la même zone que `MainMenu`.
- `PhaserCanvas` / `BootScene` : lancement de la scène `game` avec `{ backdrop: stage }` ; côté React, changer de salle depuis le menu déclenche un `scene.restart({ backdrop })` sur l'instance Phaser existante.
- `GameScene.init/create` : appelle `setStage(this.backdropKey)` pour que la progression suive aussi les transitions in-game via `exitRoom()`.
- Les noms de salles sont définis dans une petite table à côté de `ROOM_ORDER` pour être partagés avec l'UI.
