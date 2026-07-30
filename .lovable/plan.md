## Problème

Le corridor (salle 2) utilise une seule image (`corridor_bg_far.png`) étirée sur les 2400 px de la salle, sans aucune couche intermédiaire. Résultat : un mur uniforme, sans profondeur ni détail — la salle paraît vide même avec les ennemis.

## Ce que je vais faire

**1. Nouveau fond panoramique dense**
Régénérer `corridor_bg_far.png` en format large (1920×1080, cohérent avec le style de la cathédrale : même pierre, mêmes lanternes rouges, même dallage) mais avec un vrai contenu architectural réparti sur toute la longueur :
- suite d'arches gothiques en enfilade avec ouvertures sombres
- alcôves latérales, niches à ossements, grilles rouillées
- chaînes suspendues, drapés en lambeaux tachés de sang
- variations de lumière (halos de torches espacés) pour casser la monotonie

**2. Couche intermédiaire (midground) pour la profondeur**
Ajouter dans `Parallax.ts` une couche de props de midground pour le corridor uniquement : piliers/arches partiels dessinés devant le fond avec un `scrollFactor` légèrement différent (≈0.85) et espacés tous les ~600 px. Le héros passe devant, ça crée un vrai effet de traversée plutôt qu'un mur plat.

**3. Ambiance renforcée**
Pour le corridor : poussière plus dense, quelques particules de braises rouges qui montent, et un léger vignettage latéral pour que les extrémités du couloir se perdent dans le noir.

## Détails techniques

- `src/game/assets.ts` : entrée `corridor` inchangée côté clés, dimensions du `far` mises à jour.
- `src/game/effects/Parallax.ts` : branche `key === "corridor"` étendue — image de fond étirée + boucle de placement des props de midground + réglage `addAmbience` paramétré par salle.
- Les autres salles (cathédrale) gardent strictement le rendu `tileSprite` actuel.
