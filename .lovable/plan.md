## Correction définitive de la Monture d’Effroi

Le bug est confirmé dans les fichiers actuellement chargés : la grande aile proche est copiée sans mouvement dans les 8 frames, seule l’aile arrière change de pose, et la victime n’existe plus dans la séquence après avalement.

1. **Repartir d’une seule frame anatomiquement valide**
   - Conserver exactement deux ailes et leurs deux attaches aux épaules.
   - Verrouiller le dragon, le cavalier, la tête, les pattes et la queue.
   - Ne générer aucune nouvelle anatomie complète susceptible d’ajouter ou supprimer une aile.

2. **Animer séparément les deux ailes existantes**
   - Détourer l’aile proche et l’aile arrière en deux calques indépendants.
   - Construire trois poses contrôlées pour chacune : haute, médiane et basse.
   - Produire les 8 frames avec un vrai cycle bilatéral synchronisé, sans conserver une aile fixe.

3. **Restaurer la victime et l’avalement**
   - La victime reste nettement visible, tenue dans la gueule pendant le vol initial.
   - La séquence `swallow` montre son mouvement vers la gueule sur 4 frames, puis sa disparition seulement à la fermeture de la mâchoire.
   - La planche `fly-fed` démarre uniquement après cette disparition.

4. **Validation bloquante avant intégration**
   - Créer une planche de contrôle agrandie montrant toutes les frames.
   - Vérifier visuellement, frame par frame : exactement deux ailes, mouvement des deux ailes, cavalier présent, humain présent avant ingestion et absent seulement après.
   - Vérifier ensuite l’animation dans le jeu avant de remplacer les assets et d’incrémenter leur version de cache.