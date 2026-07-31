## Petites créatures d'ambiance : rats et chauves-souris

Ajout d'une vie de fond purement décorative dans les salles, sans aucune interaction avec le combat.

### Assets à générer
- `public/assets/sprites/props/ambient_rat_spritesheet.png` — 6 frames de course de profil (cellules 64×32), pixel art, palette charbon / brun sale, yeux rouges, queue qui fouette.
- `public/assets/sprites/props/ambient_bat_spritesheet.png` — 6 frames de battement d'ailes de profil (cellules 64×48), membrane rouge sombre translucide, corps noir.

Les deux feuilles seront produites en une seule bande horizontale sans marge, cohérentes avec le style des sprites existants (blob de chair, statue).

### Nouveau fichier `src/game/effects/AmbientCritters.ts`
Une classe `AmbientCritters` sur le même modèle que `FleshBlob` / `CorridorVein` :

- **Pool recyclé** : 4 rats + 3 chauves-souris préinstanciés, invisibles au repos. Aucun objet créé/détruit en cours de jeu (pas de pression GC, important vu les ralentissements déjà rencontrés).
- **Rats** : apparaissent hors champ à gauche ou à droite de la caméra, courent le long de la ligne sol/mur (`floorY - 10`, depth `-3`, donc derrière le héros), vitesse 220–320 px/s, avec de brèves pauses aléatoires (arrêt, tête qui bouge, reprise) puis sortie de l'écran. Petite ombre de contact ovale qui suit.
- **Chauves-souris** : traversent la partie haute de l'écran (entre `floorY - 620` et `floorY - 380`), depth `-4`, trajectoire sinusoïdale (oscillation verticale via tween sur un offset), vitesse 260–380 px/s, légère variation d'échelle pour simuler la profondeur, alpha 0.75.
- **Cadence** : un `TimerEvent` déclenche un passage toutes les 3–9 s aléatoirement, avec parfois un petit groupe de 2–3 chauves-souris décalées. Les passages sont suspendus si la caméra ne bouge pas depuis longtemps (évite l'effet de défilé).
- **Aucune physique** : positions mises à jour par tween/`tick(delta)`, pas de corps Arcade, donc aucune collision possible avec le héros ou les ennemis.
- **`destroy()`** qui nettoie tweens, timers et sprites, appelé au changement de salle.

### Chargement
- Ajout des deux spritesheets dans `BootScene.preload()`.
- Ajout des deux animations (`ambient-rat-run` 12 fps boucle, `ambient-bat-fly` 14 fps boucle) dans `BootScene.create()`.

### Intégration dans `GameScene.ts`
- Champ `private critters?: AmbientCritters`.
- Instanciation dans `buildBackdrop()` pour toutes les salles, avec un dosage par décor :
  - cathédrale : chauves-souris majoritaires (grands volumes) ;
  - corridor : rats majoritaires (couloir bas et étroit) ;
  - trône / extérieur : mélange équilibré.
- Appel de `this.critters?.tick(time, delta)` dans `update()`.
- Nettoyage dans la réinitialisation de `create()` et au `SHUTDOWN`, comme pour `blobs` et `wheel`.

### Vérification
Contrôle visuel : les rats passent bien derrière le héros au ras du sol, les chauves-souris traversent le haut sans jamais recouvrir le HUD, aucune créature ne bloque ou ne touche le joueur, et le compteur du profiler (F3) ne montre pas de chute de framerate.
