## Ce que j'ai mesuré

J'ai lancé une partie et tenu la touche de marche pendant 5 secondes, panneau F3 activé.

Relevés :
- Panneau de profilage en jeu : **60 im/s, frame 16,7 ms, pic 16,7 ms, saccades 0**, update total **0,15 ms**.
- Détail par système : player 0,06 / ennemis 0,03 / absorption 0,02 / parallax 0,02 / sang 0,00 ms.
- Scène : **11 objets, 6 corps physiques, 0 tween** — c'est extrêmement léger.
- Marche vs immobile : temps de frame identique (aucune dégradation quand le héros avance).

Conclusion : **il n'y a pas de perte de performance pendant la marche.** Le jeu tourne à 60 im/s sans saccade. Ce que tu ressens n'est donc pas un ralentissement machine, mais un problème de **lisibilité du mouvement**.

## Cause identifiée

Dans `Parallax.ts`, un seul calque est créé (`far`), collé à la caméra (`scrollFactor 0`) et défilant à la vitesse **0,08**. Or ce calque contient tout ce qu'on voit : la ville, les colonnes **et le dallage du sol**.

Le héros avance à 190 px/s, mais l'image (sol compris) ne défile qu'à ~15 px/s. Résultat : on marche « sur un tapis roulant », le sol ne défile quasiment pas, et sur un saut le décor est totalement figé — d'où l'impression de « ne pas avancer » ou de « ramer ».

S'ajoute le fait que la caméra ne bouge pas du tout tant que le héros n'a pas dépassé le milieu de l'écran, ni au-delà de x≈1920 : dans ces zones, ni le décor ni la caméra ne bougent.

## Ce que je propose de faire

1. **Séparer sol et fond.** Poser le dallage/l'avant-plan sur un calque défilant à vitesse **1** (ancré au monde), et ne garder la vitesse lente (0,1–0,2) que pour la ville lointaine et le ciel. Le sol défilera alors exactement à la vitesse du héros.
2. **Réintroduire un calque intermédiaire** (`mid`, déjà présent dans les assets, actuellement inutilisé) à ~0,5 pour retrouver la profondeur sans le côté « décor qui suit le personnage ».
3. **Repères de progression** : quelques éléments fixes du monde (dalles, débris, marques au sol) posés en `scrollFactor 1` pour que l'œil ait des points de référence quand on marche.
4. **Caméra** : réduire la zone morte au centre pour qu'elle réagisse plus tôt, tout en gardant l'axe vertical bloqué (déjà en place).
5. **Vérification** : re-mesurer après coup (F3 + capture pendant la marche) et confirmer que le décor défile bien à la même vitesse que le héros, sans dépasser 16,7 ms par frame.

## Détails techniques

- `src/game/effects/Parallax.ts` : passer d'un `TileSprite` unique `scrollFactor 0` + `tilePositionX` manuel à trois calques (`far` 0,15 / `mid` 0,5 / sol 1,0), le calque sol étant un `TileSprite` ancré au monde sur toute la largeur de `ROOM_WIDTH`.
- Les images de fond font 1536–1672 px de large pour une salle de 2400 px : le calque sol doit être tuilé horizontalement (`setTileScale`) pour couvrir la salle sans étirement.
- `src/game/scenes/GameScene.ts` : ajuster le `startFollow` (deadzone horizontale) ; `FLOOR_Y = 880` reste inchangé.
- Aucun changement côté physique, combat ou sang : la mesure montre qu'ils ne coûtent rien.
