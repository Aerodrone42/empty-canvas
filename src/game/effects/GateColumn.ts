import Phaser from "phaser";

/**
 * Colonne gothique de fin de salle : pierre sombre, base sculptee et
 * visceres rouges enroules en spirale qui respirent lentement.
 *
 * Le fut est etire jusqu'au dessus du bord haut de l'ecran : on ne voit
 * jamais le sommet, la colonne sort du cadre.
 */

/** largeur affichee de la base sculptee */
const BASE_W = 150;
/** largeur affichee du fut (plus etroit que la base) */
const SHAFT_W = 112;
/** le fut monte bien au dessus du viewport */
const TOP_Y = -260;
/** la base mord un peu dans le sol : plus de vide sous la colonne */
const BASE_SINK = 34;
/** hauteur du raccord evase entre le fut et la base */
const FLARE_H = 72;
/** nombre de tranches qui composent l'evasement */
const FLARE_SLICES = 6;
/** enfoncement du fut dans la base (masque la coupe du motif) */
const SHAFT_OVERLAP = 60;

export class GateColumn {
  private readonly scene: Phaser.Scene;
  private readonly base: Phaser.GameObjects.Image;
  private readonly shaft: Phaser.GameObjects.TileSprite;
  /** tranches qui forment l'evasement fut -> base */
  private readonly flare: Phaser.GameObjects.TileSprite[] = [];
  private readonly flareGlow: Phaser.GameObjects.TileSprite[] = [];
  /** fondu sombre qui masque la ligne de jonction */
  private readonly seam: Phaser.GameObjects.Rectangle[] = [];
  /** calques rouges superposes : la pulsation des visceres */
  private readonly glowBase: Phaser.GameObjects.Image;
  private readonly glowShaft: Phaser.GameObjects.TileSprite;
  private readonly drips: Phaser.GameObjects.Particles.ParticleEmitter;
  private opened = false;

  readonly x: number;

  constructor(scene: Phaser.Scene, x: number, floorY: number) {
    this.scene = scene;
    this.x = x;

    const baseTex = scene.textures.get("gate-column-base").getSourceImage();
    const baseScale = BASE_W / baseTex.width;
    const groundY = floorY + BASE_SINK;
    const baseTopY = groundY - baseTex.height * baseScale;

    const shaftTex = scene.textures.get("gate-column-shaft").getSourceImage();
    const srcH = shaftTex.height || 1;
    const tileScale = SHAFT_W / shaftTex.width;
    // le fut plonge profondement dans la base : la coupe du motif
    // tombe derriere la partie sculptee, jamais a l'air libre
    const shaftBottom = baseTopY + SHAFT_OVERLAP;
    const shaftH = shaftBottom - TOP_Y;
    // le motif se termine sur une rangee complete au niveau du raccord
    const tileY = (shaftH / tileScale) % srcH;

    this.shaft = scene.add
      .tileSprite(x, shaftBottom, SHAFT_W, shaftH, "gate-column-shaft")
      .setOrigin(0.5, 1)
      .setTileScale(tileScale, tileScale)
      .setScrollFactor(1)
      .setDepth(20);
    this.shaft.tilePositionY = tileY;

    this.base = scene.add
      .image(x, groundY, "gate-column-base")
      .setOrigin(0.5, 1)
      .setScale(baseScale)
      .setScrollFactor(1)
      .setDepth(21);

    // doublons rouges en fondu additif : seules les veines ressortent
    this.glowShaft = scene.add
      .tileSprite(x, shaftBottom, SHAFT_W, shaftH, "gate-column-shaft")
      .setOrigin(0.5, 1)
      .setTileScale(tileScale, tileScale)
      .setScrollFactor(1)
      .setDepth(22)
      .setTint(0x8e1220)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.12);
    this.glowShaft.tilePositionY = tileY;

    this.glowBase = scene.add
      .image(x, groundY, "gate-column-base")
      .setOrigin(0.5, 1)
      .setScale(baseScale)
      .setScrollFactor(1)
      .setDepth(23)
      .setTint(0x8e1220)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.12);

    // --- raccord evase : la largeur passe progressivement du fut a la base
    const flareBottom = baseTopY + 14;
    const sliceH = FLARE_H / FLARE_SLICES;
    const flareMaxW = BASE_W * 0.94;
    for (let i = 0; i < FLARE_SLICES; i++) {
      // i = 0 en haut (largeur du fut) -> i = n-1 en bas (largeur de la base)
      const tTop = i / FLARE_SLICES;
      const t = tTop * tTop; // evasement en courbe, pas lineaire
      const w = SHAFT_W + (flareMaxW - SHAFT_W) * t;
      const bottom = flareBottom - (FLARE_SLICES - 1 - i) * sliceH;
      // +1 px de recouvrement vertical pour eviter les liseres entre tranches
      const h = sliceH + 1;

      const slice = scene.add
        .tileSprite(x, bottom, w, h, "gate-column-shaft")
        .setOrigin(0.5, 1)
        .setTileScale(tileScale, tileScale)
        .setScrollFactor(1)
        .setDepth(20.5);
      slice.tilePositionY = (bottom - TOP_Y) / tileScale % srcH;
      this.flare.push(slice);

      const sliceGlow = scene.add
        .tileSprite(x, bottom, w, h, "gate-column-shaft")
        .setOrigin(0.5, 1)
        .setTileScale(tileScale, tileScale)
        .setScrollFactor(1)
        .setDepth(22.5)
        .setTint(0x8e1220)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.12);
      sliceGlow.tilePositionY = slice.tilePositionY;
      this.flareGlow.push(sliceGlow);
    }

    // fondu sombre progressif sur la jonction : la ligne disparait
    for (let i = 0; i < 8; i++) {
      const h = 6;
      const yy = flareBottom - FLARE_H * 0.35 + i * h;
      const shade = scene.add
        .rectangle(x, yy, flareMaxW, h + 1, 0x0b0608)
        .setOrigin(0.5, 0)
        .setScrollFactor(1)
        .setDepth(21.5)
        .setBlendMode(Phaser.BlendModes.MULTIPLY)
        .setAlpha(0.1 + i * 0.035);
      this.seam.push(shade);
    }


    // respiration lente des visceres
    scene.tweens.add({
      targets: [this.glowShaft, this.glowBase, ...this.flareGlow],
      alpha: { from: 0.08, to: 0.3 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    scene.tweens.add({
      targets: [this.shaft, this.glowShaft],
      scaleX: { from: 1, to: 1.015 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.ensureDripTexture();
    this.drips = scene.add
      .particles(x, floorY - 260, "fx-drip", {
        lifespan: { min: 700, max: 1500 },
        speedY: { min: 40, max: 110 },
        speedX: { min: -6, max: 6 },
        gravityY: 220,
        scale: { min: 0.6, max: 1.4 },
        alpha: { start: 0.75, end: 0 },
        tint: [0x6d0f16, 0x8a1a20, 0x4a0a10],
        frequency: 420,
        quantity: 1,
        emitZone: {
          type: "random",
          source: new Phaser.Geom.Rectangle(-SHAFT_W / 2, -320, SHAFT_W, 560),
          quantity: 1,
        },
      })
      .setDepth(21);
  }

  private ensureDripTexture() {
    if (this.scene.textures.exists("fx-drip")) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 2, 6);
    g.generateTexture("fx-drip", 2, 6);
    g.destroy();
  }

  /** la salle est nettoyee : les visceres s'embrasent puis restent vifs */
  open() {
    if (this.opened) return;
    this.opened = true;
    this.scene.tweens.add({
      targets: [this.glowShaft, this.glowBase],
      alpha: 0.85,
      duration: 260,
      yoyo: true,
      repeat: 1,
    });
    this.drips.frequency = 160;
  }

  destroy() {
    this.scene.tweens.killTweensOf([this.shaft, this.glowShaft, this.glowBase]);
    this.shaft.destroy();
    this.base.destroy();
    this.glowShaft.destroy();
    this.glowBase.destroy();
    this.drips.destroy();
  }
}
