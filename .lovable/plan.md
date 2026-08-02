Objectif : transformer le fond de la salle du Trône actuel (une seule image répétée sur 9600 px) en un environnement colossal, profond et cinématographique, sans ennemis ni arène pour l'instant.

Etat actuel vérifié
- `src/game/roomConfig.ts` : salle `throne` = 9600 px, `spawns: []`, `arenaLockX` absent.
- `src/game/effects/Parallax.ts` : n'utilise qu'un seul calque `far` en `tileSprite` ; les calques `mid` et `near` sont chargés mais inutilisés.
- `public/assets/sprites/backgrounds/throne_bg_far.png` a été regénéré à 18:13 ; les fichiers `mid` et `near` datent d'avant et ne correspondent pas forcément au nouveau style.
- Le sol est un collider invisible ; aucune texture visible ne recouvre le sol.

Plan de travail

1. Générer les calques manquants et cohérents
   - Regénérer `throne_bg_mid.png` : plan médian avec colonnes d'os, trône de chair lointain, bannières dorées déchirées, arches gothiques.
   - Regénérer `throne_bg_near.png` : avant-plan avec piliers de pierre, braseros vivants, chaînes, dalles de marbre noir.
   - Les trois images doivent partager la même palette (rouge sang, noir, or terni, pierre grise) et la même ligne de sol.
   - Avant intégration, te montrer les 3 images pour validation.

2. Refaire le système de parallaxe pour la salle du Trône
   - Modifier `src/game/effects/Parallax.ts` : si la salle est `throne`, empiler 3 `tileSprite` avec des facteurs de défilement différents :
     - `far` : scrollFactor 0.15, scale 1.0 → profondeur immense
     - `mid` : scrollFactor 0.45, scale 1.0 → colonnes et trône
     - `near` : scrollFactor 0.85, scale 1.0 → piliers et braseros
   - Conserver le rendu actuel à un seul calque pour les autres salles (`cathedrale`, `corridor`, `exterieur`) afin de ne pas tout casser.
   - Aligner le bas de chaque calque sur `floorY` avec la même marge `BELOW_FLOOR`.

3. Ajouter un sol texturé visible
   - Générer une texture de sol en marbre noir veiné de sang, répétable horizontalement (`throne_floor.png`).
   - L'afficher en `tileSprite` au-dessus du collider invisible, entre le joueur et le fond, avec un léger défilement (scrollFactor 1).
   - Ajouter des reflets de lumière rouge sur le sol à intervalles réguliers.

4. Renforcer l'atmosphère
   - Activer le mode `dense` d'ambiance pour la salle du Trône : braises rouges qui montent, poussières dorées, vignettage latéral.
   - Ajouter des rayons de lumière (god rays) depuis le haut en teintes rouge sang, défilant légèrement avec la caméra.
   - Ajouter des braseros statiques supplémentaires le long du chemin pour rythmer la progression.

5. Vérification
   - Lancer l'aperçu et marcher sur toute la longueur de la salle pour vérifier :
     - aucune répétition visible ou moche,
     - les calques sont alignés au sol,
     - le joueur reste devant le sol et derrière les piliers de l'avant-plan,
     - les performances restent stables.

Critères de validation
- Le fond doit donner l'impression d'une nef colossale qu'on traverse pendant plusieurs minutes.
- Les 3 calques doivent créer une profondeur évidente sans décalage de ligne de sol.
- Le sol doit être visible, sombre, et cohérent avec le marbre noir du décor.
- Aucun ajout d'ennemis, d'arène ou de boss dans cette étape.