## Diagnostic

La spritesheet actuelle (`dread_mount_prey/fed_spritesheet.png`, 6 cases de 320×238) a été fabriquée en découpant et faisant pivoter les ailes **à l'intérieur** de la case existante. Résultat vérifié :
- les pointes d'ailes sortent de la case et sont rognées (« ailes coupées ») ;
- l'amplitude a dû être bridée et l'animation réduite à 4 poses (`[1,2,3,4,3,2]` à 7 fps) pour masquer les raccords → battement « à peine » visible.

Continuer à retoucher cette planche ne peut pas marcher : le problème est dans la méthode, pas dans les réglages.

## Nouvelle approche : monture articulée

Abandonner la spritesheet de vol. Générer **trois images séparées**, chacune détourée sur fond transparent :

1. `dread_mount_body.png` — corps osseux + tête + gueule ouverte avec l'humain qui dépasse + cavalier encapuchonné, **sans ailes**.
2. `dread_mount_wing.png` — une seule aile membraneuse, dessinée déployée, avec le point d'attache (épaule) au bord.
3. `dread_mount_body_fed.png` — même corps, gueule fermée, gorge gonflée (pour l'après-déglutition).

Puis, dans le jeu, assembler un `Phaser.GameObjects.Container` :

```text
        [aile arrière]  (derrière, teinte assombrie)
   [corps + cavalier + proie]
        [aile avant]
```

Le battement se fait **par rotation continue** de chaque aile autour de son origine à l'épaule (`setOrigin` au point d'attache), pilotée par un sinus dans `update()` :
- aile avant : angle = sin(phase) × ~38°
- aile arrière : même sinus, léger décalage de phase (~0,25 rad) et amplitude un peu moindre pour l'effet de perspective
- léger `scaleY` couplé au sinus pour simuler le repli de la membrane
- le corps monte/descend en opposition avec le battement (déjà en place)

Avantages : aucun rognage possible (les ailes sont des sprites libres), les deux ailes bougent forcément, amplitude réglable à volonté, animation fluide et non saccadée.

## Détails techniques

- `src/game/effects/DreadMount.ts` : remplacer le sprite unique par un container (corps + 2 ailes), garder la logique existante de trajectoire, parallaxe (`scrollFactor 0.55`, `depth -7`), déglutition, particules de sang, planification des passages. Le flip de direction s'applique au container (`setScale(-1, 1)`).
- `src/game/scenes/BootScene.ts` : remplacer les deux `load.spritesheet` de la monture par `load.image` des trois nouvelles textures ; supprimer les animations `dread-mount-prey-fly` / `dread-mount-fed-fly`.
- Suppression des anciens fichiers `dread_mount_prey_spritesheet.png` et `dread_mount_fed_spritesheet.png`.
- Vérification finale par capture in-game (plusieurs instants du battement) pour contrôler qu'aucune aile n'est coupée et que l'amplitude est lisible.
