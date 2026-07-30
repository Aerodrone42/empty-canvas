# Sanguine Vigile — Sprites des ennemis (Chapitre 1)

Pack pixel art regenere sur le meme gabarit normalise que le Vigile Muet :
**cellule 224x176, aucune marge, ligne de pieds a y=168**, fond transparent,
palette quantifiee a 32 couleurs par creature.

## Contenu

### Pénitent-Greffé (ennemi lourd, lent, résistant — corps-à-corps)
| Animation | Fichier | Frames | Silhouette |
|-----------|---------|--------|------------|
| Idle    | `penitent_greffe_idle_spritesheet.png`   | 4 | 118 px |
| Marche  | `penitent_greffe_walk_spritesheet.png`   | 6 | 118 px |
| Attaque | `penitent_greffe_attack_spritesheet.png` | 5 | 118 px |

### Suppliant Rampant (ennemi rapide, faible, quadrupède — attaque au sol)
| Animation | Fichier | Frames | Silhouette |
|-----------|---------|--------|------------|
| Idle        | `suppliant_rampant_idle_spritesheet.png`   | 4 | 62 px |
| Déplacement | `suppliant_rampant_walk_spritesheet.png`   | 4 | 62 px |
| Attaque     | `suppliant_rampant_attack_spritesheet.png` | 4 | 62 px |

## Intégration Phaser 3

```js
this.load.spritesheet('penitent-idle', 'assets/sprites/enemies/penitent_greffe_idle_spritesheet.png', {
  frameWidth: 224, frameHeight: 176, spacing: 0
});
// idem pour toutes les autres feuilles : meme cellule, seul frameCount change
```

Le code du jeu lit ces valeurs depuis `src/game/assets.ts`
(`ENEMY_FRAME_W`, `ENEMY_FRAME_H`, `ENEMY_BASELINE_Y`).

Ajoutez `pixelArt: true` dans la config Phaser pour garder un rendu net.

## Notes de design

- **Pénitent-Greffé** : lourd, marche en 6 frames, masse-chaîne rouillée fusionnée au bras, attaque avec anticipation lisible (2 frames de charge) puis impact au sol.
- **Suppliant Rampant** : quadrupède bas et véloce, cycle de course en 4 frames à jouer rapidement, attaque = bond + morsure au ras du sol.
- Toutes les frames partagent la même échelle et la même ligne de pieds : plus aucun rétrécissement entre animations.
