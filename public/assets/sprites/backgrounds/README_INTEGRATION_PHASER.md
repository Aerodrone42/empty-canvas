# Sanguine Vigile — Décors du Chapitre 1 (parallaxe)

Quatre scènes en pixel art très détaillé, chacune découpée en 3 calques de profondeur pour un vrai effet de parallaxe façon Blasphemous, dans le style de la référence fournie.

## Contenu

| Scène | Calque lointain (opaque) | Calque intermédiaire (transparent) | Calque proche (transparent) |
|---|---|---|---|
| Cathédrale principale | `cathedrale_bg_far.png` | `cathedrale_bg_mid.png` | `cathedrale_bg_near.png` |
| Corridor intérieur | `corridor_bg_far.png` | `corridor_bg_mid.png` | `corridor_bg_near.png` |
| Salle du trône (Mère-Suture) | `throne_bg_far.png` | `throne_bg_mid.png` | `throne_bg_near.png` |
| Parvis extérieur en ruine | `exterieur_bg_far.png` | `exterieur_bg_mid.png` | `exterieur_bg_near.png` |

Les fichiers `PREVIEW_<scene>.png` montrent le rendu des 3 calques superposés, pour référence visuelle uniquement (ne pas les charger dans le jeu).

Toutes les images sont en résolution native ~1536×864 (16:9). Le calque lointain est opaque (ciel/architecture distante) ; les calques intermédiaire et proche ont un fond transparent pour laisser voir les calques derrière eux.

## Intégration Phaser 3 (parallaxe)

Dans `preload()` :

```js
this.load.image('cathedrale-far', 'assets/decors/cathedrale_bg_far.png');
this.load.image('cathedrale-mid', 'assets/decors/cathedrale_bg_mid.png');
this.load.image('cathedrale-near', 'assets/decors/cathedrale_bg_near.png');
```

Dans `create()`, avec `TileSprite` pour un défilement horizontal fluide (recommandé si le niveau scrolle plus large que l'image) :

```js
const width = this.scale.width;
const height = this.scale.height;

this.bgFar = this.add.tileSprite(0, 0, width, height, 'cathedrale-far').setOrigin(0, 0).setScrollFactor(0);
this.bgMid = this.add.tileSprite(0, 0, width, height, 'cathedrale-mid').setOrigin(0, 0).setScrollFactor(0.3);
this.bgNear = this.add.tileSprite(0, 0, width, height, 'cathedrale-near').setOrigin(0, 0).setScrollFactor(0.6);
```

Dans `update()`, pour lier le défilement à la caméra/au joueur :

```js
this.bgFar.tilePositionX = this.cameras.main.scrollX * 0.1;
this.bgMid.tilePositionX = this.cameras.main.scrollX * 0.3;
this.bgNear.tilePositionX = this.cameras.main.scrollX * 0.6;
```

Alternative plus simple avec des `Image` fixes (si le niveau ne dépasse pas la largeur d'un écran) :

```js
this.add.image(width/2, height/2, 'cathedrale-far').setScrollFactor(0);
this.add.image(width/2, height/2, 'cathedrale-mid').setScrollFactor(0.3);
this.add.image(width/2, height/2, 'cathedrale-near').setScrollFactor(0.6);
```

**Important** : gardez `pixelArt: true` dans la config du jeu Phaser (déjà recommandé pour les sprites de personnages) pour un rendu net sans lissage.

## Notes de design

- **Cathédrale principale** : nef gothique avec statues de pénitents encastrées dans les piliers, lanternes suspendues, vue sur la cité lointaine à travers les arches — zone d'exploration principale.
- **Corridor intérieur** : passage resserré, murs fusionnés de chair et d'os, éclairage à la bougie — zones de transition/couloirs entre salles.
- **Salle du trône (Mère-Suture)** : arène de boss, grande rosace fissurée en arrière-plan, trône organique au centre — combat de boss du Chapitre 1.
- **Parvis extérieur en ruine** : zone extérieure avec statues de pénitents, pont brisé, vue sur la skyline de la cité — transition entre intérieur/extérieur ou zone à ciel ouvert.
- Palette cohérente par scène (ocre/sépia/charbon/or pour l'intérieur cathédrale et l'extérieur, crimson/charbon/os pour le corridor et la salle du trône), assortie au style de l'image de référence fournie par l'utilisateur.
