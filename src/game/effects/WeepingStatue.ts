import Phaser from "phaser";

/**
 * Statue de pleureuse encapuchonnee posee sur son socle.
 * Tant que le heros n'est pas arrive a sa hauteur, elle reste de pierre ;
 * des qu'il approche (et avant qu'il ne passe devant), du sang se met a
 * couler de ses yeux, puis les larmes se tarissent une fois depasse.
 */

/** hauteur affichee de la statue, socle compris */
const STATUE_H = 320;
/** distance de declenchement des larmes */
const TRIGGER_DIST = 420;

export class WeepingStatue {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly tears: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly trails: Phaser.GameObjects.Graphics;
  private readonly x: number;
  private readonly eyesY: number;
  private weeping = false;
  private trailAmount = 0;

  constructor(scene: Phaser.Scene, x: number, floorY: number) {
    this.scene = scene;
    this.x = x;

    const tex = scene.textures.get("statue-pleureuse").getSourceImage();
    const scale = STATUE_H / tex.height;
    const baseY = floorY - 6;

    this.sprite = scene.add
      .image(x, baseY, "statue-pleureuse")
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setDepth(-5);

    // les yeux se situent dans la capuche, tout en haut du corps
    this.eyesY = baseY - STATUE_H * 0.905;

    this.ensureTearTexture();

    // trainees de sang qui descendent sur le visage et la robe
    this.trails = scene.add.graphics().setDepth(-5);

    this.tears = scene.add
      .particles(x, this.eyesY, "fx-tear", {
        lifespan: { min: 1100, max: 2200 },
        speedY: { min: 20, max: 60 },
        speedX: { min: -3, max: 3 },
        gravityY: 260,
        scale: { min: 0.5, max: 1.1 },
        alpha: { start: 0.85, end: 0 },
        tint: [0x7a0f16, 0x9c1620, 0x4a070c],
        frequency: 260,
        quantity: 1,
        emitZone: {
          type: "random",
          source: new Phaser.Geom.Rectangle(-9, -2, 18, 4),
          quantity: 1,
        },
      })
      .setDepth(-5);
    this.tears.stop();
  }

  private ensureTearTexture() {
    if (this.scene.textures.exists("fx-tear")) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 2, 7);
    g.generateTexture("fx-tear", 2, 7);
    g.destroy();
  }

  /** a appeler chaque frame avec la position du heros */
  update(playerX: number) {
    const approaching = playerX < this.x && this.x - playerX < TRIGGER_DIST;

    if (approaching !== this.weeping) {
      this.weeping = approaching;
      if (approaching) this.tears.start();
      else this.tears.stop();
    }

    // les coulures grandissent tant qu'elle pleure, puis sechent doucement
    const target = this.weeping ? 1 : 0;
    this.trailAmount = Phaser.Math.Linear(this.trailAmount, target, 0.02);
    this.drawTrails();
  }

  private drawTrails() {
    this.trails.clear();
    if (this.trailAmount < 0.02) return;

    const len = 26 + this.trailAmount * 86;
    const alpha = 0.25 + this.trailAmount * 0.6;
    for (const dx of [-5, 5]) {
      this.trails.fillStyle(0x6d0d13, alpha);
      this.trails.fillRect(this.x + dx - 1.2, this.eyesY, 2.4, len);
      this.trails.fillStyle(0x9c1620, alpha * 0.7);
      this.trails.fillRect(this.x + dx - 0.5, this.eyesY, 1, len * 0.7);
    }
  }

  destroy() {
    this.sprite.destroy();
    this.tears.destroy();
    this.trails.destroy();
  }
}
