## Refonte complète de la monture (une seule illustration, pas de collage)

Le flou vient du fait que la victime a été bricolée dans des frames déformées puis réduites. Pas de sprite rapporté par-dessus : on repart de l'illustration originale et on regénère toute la planche, monture + cavalier + victime peints ensemble.

### 1. Générer la monture à la bonne taille
- Générer les frames directement à la résolution d'affichage réelle (environ 500 px de large), et non plus en 696 px réduits ensuite.
- Une seule passe de rendu : plus aucun ré-échantillonnage successif, donc plus de perte de détail sur la victime.
- La victime fait partie du dessin, tenue dans la gueule, dans le même style et le même niveau de détail que le reste de la bête.

### 2. Séquences d'animation cohérentes
- **Vol** : battement d'ailes, ondulation de la queue, victime qui se débat dans la gueule — chaque frame est une illustration complète et nette, pas une déformation de la précédente.
- **Avalement** : la mâchoire se referme, la victime disparaît progressivement dans la gorge, gerbe de sang.
- **Après repas** : même monture, gueule ensanglantée et vide.

### 3. Nettoyage technique
- Remplacer les trois planches actuelles et supprimer les frames défectueuses.
- Adapter le chargement et l'échelle à la nouvelle taille (affichage au ratio natif, sans réduction fractionnaire).
- Nouvelle version d'asset pour éliminer tout reste de cache.

### 4. Validation
- Capture rapprochée de la gueule à l'échelle réelle du jeu, en vol et pendant l'avalement.
- Validation seulement si la victime reste nette et lisible sur toute la séquence, y compris quand la monture est retournée.