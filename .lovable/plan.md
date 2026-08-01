## Diagnostic confirmé

Le problème ne vient pas de Phaser ni du découpage des frames : les trois feuilles d’animation ont les bonnes dimensions (`696 × 544` par frame) et sont chargées correctement.

Les rectangles marron sont **déjà incrustés dans les images PNG générées**, précisément dans la zone où l’ancien script a essayé d’effacer l’humain pour simuler la gorge. Comme le script de génération n’a pas été conservé dans le dépôt, il faut reconstruire proprement cette séquence au lieu de masquer l’erreur dans le code du jeu.

## Correction

1. Repartir de la frame nette où l’humain est entièrement visible, sans utiliser les frames marron existantes.
2. Isoler proprement l’humain avec sa transparence, ainsi que les mâchoires au premier plan.
3. Recréer les 5 frames d’avalement par **translation de l’humain derrière les mâchoires**, sans étirement, flou ni rectangle de remplissage.
4. Créer l’état après avalement avec une gueule sombre organique aux contours transparents, limitée à l’intérieur de la bouche — aucun aplat rectangulaire.
5. Régénérer `dread_mount_swallow.png` et `dread_mount_fly_fed.png`, sans modifier le battement des ailes ni le comportement de la monture.
6. Vérifier visuellement chaque frame isolée puis l’animation complète dans le jeu, notamment avec le retournement horizontal.