## Nouvel ennemi : le Pendu-Écorché (tombe du plafond)

Un troisième type d'ennemi basé sur tes trois planches : il attend suspendu au plafond par ses veines, se décroche quand le joueur passe dessous, s'écrase au sol dans une gerbe de sang, se redresse, puis chasse et attaque.

### 1. Préparation des sprites
- Découpage automatique des trois PNG (script Python/PIL) : détection des silhouettes par colonnes de pixels non transparents, puis recadrage de chaque pose.
- Recomposition en feuilles normalisées au gabarit ennemi existant (cellule 224x176, pieds à y=168, sans marge), pour rester cohérent avec `Penitent` et `Suppliant` :
  - `ecorche_hang` (suspendu, boucle) — 3 poses de la planche 1
  - `ecorche_fall` (chute) — pose de chute de la planche 1
  - `ecorche_land` (impact au sol + relevé) — poses impact/accroupi/redressé de la planche 1
  - `ecorche_idle` / `ecorche_walk` (planche 2, cycle de marche)
  - `ecorche_attack` (planche 2 : élan + frappe avec l'onde rouge)
  - `ecorche_burst` (planche 3, poses 5 et 6 : explosion de sang) → utilisée à la mort
- Les feuilles générées seront placées dans `public/assets/sprites/enemies/`, comme les autres.

### 2. Déclaration des animations
- Ajout des entrées correspondantes dans `src/game/assets.ts` (mêmes conventions : `frameWidth 224`, `frameHeight 176`, `spacing 0`), pour qu'elles soient chargées et animées par `BootScene`.

### 3. Comportement (nouvelle classe `EcorchePendu` dans `Enemy.ts`)
Machine à états ajoutée par-dessus l'IA existante :
- **hanging** : accroché au plafond (gravité désactivée), animation de balancement, aucune collision avec le joueur.
- **falling** : déclenché quand le joueur entre dans un rayon horizontal (~180 px) — gravité activée, filet de sang qui se rompt, tremblement de caméra léger.
- **landing** : à l'atterrissage, éclaboussure de sang (`fx-gore` court), petite onde de choc, ~450 ms d'immobilité pour laisser le joueur réagir (esquive/parade).
- **active** : reprend l'IA standard (`think`) — patrouille, poursuite, attaque télégraphée avec l'anticipation existante.
- **Attaque spéciale** : griffade rapide à deux temps (dégâts moyens, portée courte) + une variante à distance courte qui projette l'onde de sang visible sur ta planche 2, avec le même signal d'anticipation que les autres ennemis (pour rester parable/esquivable).
- **Mort** : utilise les frames d'éclatement (planche 3) au lieu de la simple chute, avec la gerbe et les orbes de chair existantes.

### 4. Placement dans la scène
- Dans `GameScene.ts`, ajout de 2 pendus accrochés au plafond de la Nef (positions choisies entre les ennemis existants), avec un `ceilingY` en haut de l'écran, ainsi que leur intégration dans les boucles `think()` et de collision actuelles.
- Stats : santé 40, dégâts 14, rapide mais pas blindé, récompense de chair 10.

### 5. Vérification
- Contrôle visuel automatisé (script navigateur) : capture après déclenchement de la chute pour valider l'alignement au sol, l'échelle et l'absence d'erreurs console.

### Détails techniques
- Fichiers touchés : `src/game/assets.ts`, `src/game/entities/Enemy.ts`, `src/game/scenes/GameScene.ts`, + nouvelles feuilles PNG dans `public/assets/sprites/enemies/`.
- Aucune modification du héros, du HUD ou du décor.
