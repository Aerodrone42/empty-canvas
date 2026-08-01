## Correction anatomique stricte — exactement deux ailes

L’image annotée confirme l’erreur : elle contient la grande aile gauche, l’aile arrière supérieure, puis une troisième aile parasite sous le ventre. Cette génération sera rejetée intégralement et aucun de ces fichiers temporaires ne sera ajouté au jeu.

1. **Repartir de la dernière illustration valide à deux ailes**
   - Utiliser la frame originale du projet, pas la nouvelle image fautive.
   - Conserver exactement les deux attaches d’ailes existantes au niveau des épaules.
   - Verrouiller totalement le corps, la tête, l’humain, le cavalier, les pattes et la queue.

2. **Créer un cycle anatomiquement contrôlé**
   - Aile proche : modifier uniquement sa membrane et ses os à gauche du corps.
   - Aile arrière : modifier uniquement l’aile visible derrière le cavalier.
   - Interdire toute création de forme ailée sous la cage thoracique ou derrière les pattes.
   - Utiliser des masques séparés et bornés pour les deux zones afin qu’aucune déformation ne puisse produire une troisième aile.

3. **Limiter le cycle à des poses validées**
   - Produire d’abord trois images isolées : ailes hautes, médianes et basses.
   - Contrôler chaque image avant d’assembler la spritesheet.
   - Construire ensuite les 8 frames par interpolation uniquement entre ces trois poses propres, sans nouvelle génération anatomique.

4. **Validation bloquante avant intégration**
   - Compter visuellement et par zones les deux silhouettes d’ailes sur chaque frame.
   - Rejeter toute frame avec plus de deux ailes, une aile fixe, un humain flou ou un artefact.
   - Afficher la planche complète de contrôle avant de remplacer les assets actuels.
   - Tester enfin le vol et l’avalement dans le jeu, puis seulement incrémenter la version des sprites.