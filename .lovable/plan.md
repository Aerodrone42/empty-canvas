## Objectif

Ajouter dans le corridor (salle 2) une **machine d'écartèlement vue de face** : une roue à chevalet, un supplicié écartelé au centre, et **deux bourreaux** qui tirent sur les cordes. Quand le héros s'approche, l'écartèlement s'achève (la victime se déchire), puis **les deux bourreaux lâchent les cordes et deviennent des ennemis jouables** qui attaquent le héros.

## Assets à générer

1. `torture_wheel_machine.png` — décor statique de face : bâti de bois massif, grande roue à rayons, cordes tendues, taches de sang, style pixel art cohérent avec les décors gothiques existants (fond transparent).
2. `victime_ecartelee_spritesheet.png` — la victime seule, ancrée au centre de la roue : cycle de convulsions + phase finale de déchirement (≈6 frames).
3. Bourreau : trois feuilles sur le gabarit ennemi normalisé (cellule 224x176, ligne de pieds y=168, comme le Pénitent) :
   - `bourreau_idle_spritesheet.png` (4 frames — en position de traction sur la corde puis debout)
   - `bourreau_walk_spritesheet.png` (6 frames)
   - `bourreau_attack_spritesheet.png` (5 frames — coup de masse/crochet)

## Comportement

```text
[repos]  roue qui grince, victime qui convulse, bourreaux qui tirent en boucle
   |  héros < 520 px
[final]  traction violente, la victime se déchire (gerbe de sang, secousse caméra)
   |  ~1,2 s
[éveil]  les deux bourreaux se détachent du décor et deviennent des ennemis
```

- La machine reste en place ensuite (roue immobile, victime démembrée), les cordes pendent.
- Le déclenchement n'a lieu qu'une fois par salle.
- Les deux bourreaux comptent comme ennemis : tant qu'ils sont vivants, la colonne de sortie reste verrouillée.

## Détails techniques

- Nouveau `src/game/effects/TortureWheel.ts` : classe décor gérant le bâti, la roue (rotation lente + à-coups), la victime animée, les deux bourreaux « décoratifs » (sprites figés sur l'anim idle), la gerbe de sang finale et l'appel `onRelease(x, y)` vers la scène.
- Nouveau `Bourreau extends Enemy` dans `src/game/entities/Enemy.ts` : stats intermédiaires entre Suppliant (rapide) et Pénitent (lourd), `animPrefix: "bourreau"`, portée de frappe moyenne, récompense de chair supérieure.
- `src/game/assets.ts` : ajout des 3 feuilles bourreau à `SHEETS` (gabarit `ENEMY_FRAME_W/H`, spacing 0).
- `src/game/scenes/BootScene.ts` : chargement de `torture_wheel_machine.png` et de la feuille victime.
- `src/game/scenes/GameScene.ts` :
  - instanciation de la machine dans `buildBackdrop()` pour `corridor` (placée contre le mur, hors zone de spawn du héros, en évitant les statues et la colonne de sortie) ;
  - `tick(player.x, time)` dans `update()` ;
  - callback de libération qui `spawn()` deux `Bourreau` aux positions des cordes.
- Profondeur : machine derrière le héros (`depth -3`), au niveau des statues ; les bourreaux passent en profondeur d'ennemi normale une fois libérés.
