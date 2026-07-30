import Phaser from "phaser";

import { BACKDROPS, type BackdropDef, type BackdropKey } from "@/game/assets";

/**
 * Decor de salle en trois calques de profondeur.
 *
 * Les calques sont des tileSprite plein ecran fixes a la camera
 * (scrollFactor 0) : c'est `tilePositionX` qui defile, a des vitesses
 * differentes, ce qui donne la parallaxe meme quand la salle est bien
 * plus large que l'image source.
 *
 * Les feuilles fournies n'ont pas toutes la meme taille (le calque
 * lointain fait 1672x941, les deux autres 1536x1024) : on normalise donc
 * chaque calque sur la hauteur de salle et on ancre le bas de l'image sur
 * la ligne de sol, sinon l'architecture flotte ou se decale.
 */

/** vitesses de defilement, du plus lointain au plus proche */
const SPEEDS = [0.1, 0.3, 0.6] as const;

type Layer = {
  sprite: Phaser.GameObjects.TileSprite;
  speed: number;
};

export class Parallax {
  private layers: Layer[] = [];
  private near?: Phaser.GameObjects.TileSprite;
  readonly def: BackdropDef;

  constructor(
    private scene: Phaser.Scene,
    key: BackdropKey,
    private floorY: number,
  ) {
    this.def = BACKDROPS[key];

    const cam = scene.cameras.main;
    const viewW = cam.width;
    const viewH = cam.height;

    const keys = [this.def.far, this.def.mid, this.def.near];

    keys.forEach((textureKey, i) => {
      const source = scene.textures.get(textureKey).getSourceImage();
      const srcH = source.height || viewH;

      // hauteur affichee : l'image couvre la salle jusqu'a la ligne de sol
      const scale = this.floorY / srcH;

      const sprite = scene.add
        .tileSprite(0, 0, viewW, viewH, textureKey)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(-30 + i * 10);

      sprite.setTileScale(scale, scale);
      // le bas de l'image repose sur le plancher ; le calque proche
      // descend un peu plus bas pour accentuer la profondeur
      const overshoot = i === 2 ? 18 : 0;
      sprite.tilePositionY = (srcH - (viewH + overshoot) / scale) * -1 * 0 + 0;
      sprite.setPosition(0, this.floorY - viewH + overshoot);
      sprite.setSize(viewW, viewH);

      this.layers.push({ sprite, speed: SPEEDS[i] });
    });

    this.near = this.layers[2]?.sprite;

    this.addAmbience(viewW, viewH);
  }

  /** Voile colore, vignette, poussieres et vacillement de cierges. */
  private addAmbience(viewW: number, viewH: number) {
    const scene = this.scene;

    // voile d'ambiance par dessus les calques, sous les personnages
    scene.add
      .rectangle(0, 0, viewW, viewH, this.def.tint, this.def.tintAlpha)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-5);

    // vignette : quatre degrades assombrissant les bords
    const vignette = scene.add.graphics().setScrollFactor(0).setDepth(-4);
    const edge = Math.round(viewH * 0.28);
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.75, 0.75, 0, 0);
    vignette.fillRect(0, 0, viewW, edge);
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.85, 0.85);
    vignette.fillRect(0, viewH - edge, viewW, edge);
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0, 0.7, 0);
    vignette.fillRect(0, 0, edge, viewH);
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.7, 0, 0.7);
    vignette.fillRect(viewW - edge, 0, edge, viewH);

    this.ensureDustTexture();

    // cendres et poussieres flottantes, a mi-profondeur
    const dust = scene.add
      .particles(0, 0, "fx-dust", {
        x: { min: 0, max: viewW },
        y: { min: 0, max: viewH },
        lifespan: { min: 4000, max: 9000 },
        speedY: { min: -14, max: 10 },
        speedX: { min: -12, max: 12 },
        scale: { min: 0.4, max: 1.3 },
        alpha: { start: 0, end: 0 },
        tint: this.def.dust,
        quantity: 1,
        frequency: 240,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setScrollFactor(0.35)
      .setDepth(-6);

    // fondu d'entree/sortie des particules
    dust.addEmitZone({
      type: "random",
      source: new Phaser.Geom.Rectangle(0, 0, viewW, viewH),
      quantity: 1,
    });
    dust.setParticleAlpha({ start: 0.5, end: 0 });

    // vacillement des cierges sur le calque proche
    if (this.near) {
      scene.tweens.add({
        targets: this.near,
        alpha: { from: 1, to: 0.86 },
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
    }
  }

  /** Petite texture ronde pour les poussieres, generee une seule fois. */
  private ensureDustTexture() {
    if (this.scene.textures.exists("fx-dust")) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture("fx-dust", 6, 6);
    g.destroy();
  }

  /** A appeler dans update() : lie le defilement a la camera. */
  update() {
    const scrollX = this.scene.cameras.main.scrollX;
    for (const layer of this.layers) {
      layer.sprite.tilePositionX = (scrollX * layer.speed) / layer.sprite.tileScaleX;
    }
  }
}
