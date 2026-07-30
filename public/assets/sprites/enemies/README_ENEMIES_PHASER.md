# Sanguine Vigile — Sprites des ennemis (Chapitre 1)

Pack pixel art low-res prêt pour Phaser 3, cohérent avec le style et la palette du Vigile Muet.

## Contenu

### Pénitent-Greffé (ennemi lourd, lent, résistant — attaque au corps-à-corps)
| Animation | Fichier                                   | Frames | Taille cellule |
|-----------|--------------------------------------------|--------|-----------------|
| Idle      | `penitent_greffe_idle_spritesheet.png`     | 4      | 102×128 (+4px padding entre frames) |
| Marche    | `penitent_greffe_walk_spritesheet.png`     | 6      | 126×128 (+4px padding) |
| Attaque   | `penitent_greffe_attack_spritesheet.png`   | 5      | 172×128 (+4px padding) |

### Suppliant Rampant (ennemi rapide, faible, quadrupède — attaque au sol)
| Animation | Fichier                                     | Frames | Taille cellule |
|-----------|-----------------------------------------------|--------|-----------------|
| Idle      | `suppliant_rampant_idle_spritesheet.png`      | 4      | 240×128 (+4px padding) |
| Déplacement | `suppliant_rampant_walk_spritesheet.png`    | 4      | 275×128 (+4px padding) |
| Attaque   | `suppliant_rampant_attack_spritesheet.png`    | 4      | 322×128 (+4px padding) |

Chaque frame individuelle est aussi fournie séparément (`<creature>_<anim>_frameN.png`) si vous préférez charger des textures atlas personnalisées plutôt que des spritesheets à grille fixe.

Un fichier `<creature>_atlas.json` décrit la position/largeur/hauteur de chaque frame dans sa feuille (format simple, à adapter si besoin en `Phaser.Types.Textures.Frame`).

## Intégration Phaser 3

Dans `preload()` :

```js
// Pénitent-Greffé
this.load.spritesheet('penitent-idle', 'assets/sprites/penitent_greffe_idle_spritesheet.png', {
  frameWidth: 106, frameHeight: 128 // largeur cellule + 4px padding
});
this.load.spritesheet('penitent-walk', 'assets/sprites/penitent_greffe_walk_spritesheet.png', {
  frameWidth: 130, frameHeight: 128
});
this.load.spritesheet('penitent-attack', 'assets/sprites/penitent_greffe_attack_spritesheet.png', {
  frameWidth: 176, frameHeight: 128
});

// Suppliant Rampant
this.load.spritesheet('suppliant-idle', 'assets/sprites/suppliant_rampant_idle_spritesheet.png', {
  frameWidth: 244, frameHeight: 128
});
this.load.spritesheet('suppliant-walk', 'assets/sprites/suppliant_rampant_walk_spritesheet.png', {
  frameWidth: 279, frameHeight: 128
});
this.load.spritesheet('suppliant-attack', 'assets/sprites/suppliant_rampant_attack_spritesheet.png', {
  frameWidth: 326, frameHeight: 128
});
```

Dans `create()` :

```js
this.anims.create({
  key: 'penitent-idle-anim',
  frames: this.anims.generateFrameNumbers('penitent-idle', { start: 0, end: 3 }),
  frameRate: 4,
  repeat: -1
});
this.anims.create({
  key: 'penitent-walk-anim',
  frames: this.anims.generateFrameNumbers('penitent-walk', { start: 0, end: 5 }),
  frameRate: 6,
  repeat: -1
});
this.anims.create({
  key: 'penitent-attack-anim',
  frames: this.anims.generateFrameNumbers('penitent-attack', { start: 0, end: 4 }),
  frameRate: 8,
  repeat: 0
});

this.anims.create({
  key: 'suppliant-idle-anim',
  frames: this.anims.generateFrameNumbers('suppliant-idle', { start: 0, end: 3 }),
  frameRate: 4,
  repeat: -1
});
this.anims.create({
  key: 'suppliant-walk-anim',
  frames: this.anims.generateFrameNumbers('suppliant-walk', { start: 0, end: 3 }),
  frameRate: 10, // plus rapide que le Pénitent, créature véloce
  repeat: -1
});
this.anims.create({
  key: 'suppliant-attack-anim',
  frames: this.anims.generateFrameNumbers('suppliant-attack', { start: 0, end: 3 }),
  frameRate: 10,
  repeat: 0
});
```

**Important** : ajoutez `pixelArt: true` dans la config du jeu Phaser pour désactiver le lissage bilinéaire et conserver le rendu pixel art net :

```js
const config = {
  type: Phaser.AUTO,
  pixelArt: true,
  // ...
};
```

## Notes de design

- **Pénitent-Greffé** : lent et lourd, animation de marche plus longue (6 frames) pour rendre la lourdeur de son pas, arme = masse-chaîne en fer rouillé fusionnée au bras.
- **Suppliant Rampant** : rapide et véloce, quadrupède, cycle de déplacement plus court (4 frames) mais à jouer avec un `frameRate` plus élevé pour rendre la vitesse ; attaque = morsure/griffure au sol.
- Palette limitée à ~32 couleurs par créature (quantification partagée entre toutes ses animations) pour garantir une cohérence visuelle sur toutes les poses, dans la continuité stylistique du Vigile Muet (crimson sang, os, charbon, ocre, quelques accents dorés/rouillés).
- Toutes les feuilles ont un fond transparent et une hauteur de sprite normalisée à 128px.
