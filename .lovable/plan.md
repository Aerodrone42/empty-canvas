## Objectif

Remplir le grand vide du ciel de la salle 1 (cathédrale) par une créature volante monumentale qui traverse lentement l'arrière-plan : une chauve-souris démoniaque montée par un cavalier terrifiant, tenant un humain vivant dans sa gueule et le gobant progressivement.

## Assets à produire

1. `public/assets/sprites/props/dread_mount_spritesheet.png` — vol de la monture, 8 frames (grande cellule, ~320x256), pixel art cohérent avec le reste (palette ocre/os/sang, fond transparent).
   - Ailes membranaires déchirées, ossature apparente, chaînes et encensoirs pendants (référence image 2, mais plus détaillée et plus sombre).
   - Cavalier retravaillé pour faire peur : silhouette haute encapuchonnée, masque d'os cornu, bras filiformes tenant des rênes de tendons, cape en lambeaux qui claque au vent.
2. `public/assets/sprites/props/dread_mount_prey_spritesheet.png` — la proie humaine dans la gueule, 6 frames : gigote (jambes qui battent, bras qui griffent) → happée plus profond → deux dernières frames = déglutition (jambes qui disparaissent, gorge de la bête qui se gonfle), puis boucle de repos.

## Code

3. Nouveau `src/game/effects/DreadMount.ts` :
   - Sprite unique recyclé, `setScrollFactor` ~0.55 (parallaxe de fond, derrière les colonnes, devant le décor lointain), profondeur négative, aucune physique ni collision.
   - Traversée lente de gauche à droite ou inversement, ondulation verticale sinusoïdale, légère variation d'échelle pour l'effet d'éloignement.
   - Sprite de proie ancré à la gueule (offset suivi frame par frame), joue le cycle de gigotage puis, une fois par traversée, la séquence d'avalement (gerbe de sang + secousse de tête), après quoi la gueule reste vide jusqu'au passage suivant.
   - Cri lointain / battements d'ailes optionnels via événements existants (pas de nouvel audio si non fourni).
4. `src/game/scenes/BootScene.ts` : chargement des deux spritesheets et déclaration des animations.
5. `src/game/scenes/GameScene.ts` : instanciation uniquement pour `backdropKey === "cathedrale"`, passage toutes les ~18-25 s, destruction dans le cleanup existant à côté de `critters`/`crucified`.

## Vérification

Capture Playwright de la salle 1 pour confirmer que la bête occupe bien la zone vide entourée en rouge, qu'elle passe derrière les colonnes du premier plan et que la proie est visible puis avalée.
