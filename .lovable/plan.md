## Monture volante — direction validée

Référence retenue : dragon-squelette ailé, cavalier encapuchonné masqué, humain vivant dans la gueule (l'image sert de référence visuelle, elle n'est pas intégrée telle quelle).

### Ce qui change
- Remplacement des spritesheets actuelles (ailes coupées, aile fixe, zones translucides).
- Nouvelle monture au style de la référence : ossature de dragon, longue queue épineuse, crâne cornu à mâchoire garnie de crocs, cavalier drapé en haillons tenant des rênes-chaînes, encensoirs suspendus, éclaboussures de sang.
- Rendu en pièces séparées plutôt qu'en planche unique : corps + cavalier (image fixe), aile avant, aile arrière, queue. Les ailes et la queue sont animées par pivot autour de leur articulation, donc plus aucune aile ne peut disparaître, se couper ou clignoter d'une frame à l'autre.

### Animation de vol
- Battement continu des deux ailes en opposition correcte (aile arrière légèrement déphasée pour la profondeur), amplitude régulière.
- Balancement de la queue synchronisé au battement, léger tangage du corps.
- Opacité pleine, aucun effet translucide.

### Scène de la victime
- Phase 1 : l'humain se débat dans la gueule (soubresauts).
- Phase 2 : coup de mâchoire, gerbe de sang, la victime disparaît, gorge contractée.
- Phase 3 : la bête poursuit sa traversée, repue.

### Intégration
- Passages périodiques dans le ciel de la salle 1, dans les deux sens, en arrière-plan (aucune collision).
- Taille contenue pour rester lisible sans écraser la scène.
- Vérification visuelle en jeu, en vol, avant de conclure.