## Correction du Vigile

### Constat vérifié
- Les feuilles `idle`, `walk` et `attack` contiennent encore des pixels clairs parasites sur les contours, notamment autour du sabre et des pieds.
- Les poses n’ont pas une échelle visuelle homogène : les frames d’attaque descendent de 150 px à 122–127 px, et la première frame de saut ne mesure que 91 px contre 145–150 px pour les suivantes.
- Phaser applique une échelle constante, mais il ne peut pas compenser ces différences déjà présentes à l’intérieur des images.

### Travail prévu
1. **Reprendre le détourage des sprites sources**
   - Supprimer le fond clair et les franges blanches par décontamination des couleurs de bord, pas par une simple suppression des pixels blancs.
   - Nettoyer spécialement le contour du sabre, de la cape, des bottes et les pixels semi-transparents.
   - Préserver les véritables reflets métalliques du masque et de la lame.

2. **Normaliser l’échelle visuelle frame par frame**
   - Recaler chaque pose sur une silhouette de référence issue de l’idle.
   - Garder une ligne de pieds commune à `y = 184`.
   - Corriger les frames d’attaque trop petites.
   - Remplacer/corriger la pose de saut comprimée de 91 px afin que le corps conserve la même stature pendant l’impulsion, la montée, l’apogée et la chute.

3. **Sécuriser le rendu Phaser**
   - Conserver une échelle et une origine uniques dans `Player.ts`.
   - Vérifier que chaque état de saut utilise la bonne frame et qu’aucune animation ne modifie temporairement la taille.
   - Incrémenter la version des assets pour empêcher le navigateur de conserver les anciennes feuilles en cache.

4. **Validation en jeu**
   - Comparer au même zoom : idle, marche, attaque, départ du saut, montée, apogée, chute et double saut.
   - Contrôler visuellement l’absence de halo sur fond sombre et l’absence de variation de taille.
   - Vérifier les transitions et l’alignement de la hitbox au sol.