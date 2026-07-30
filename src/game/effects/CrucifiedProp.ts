import Phaser from "phaser";

/**
 * Supplicie ecorche cloue sur une croix de bois : element de decor anime
 * plante en fond de la premiere salle, derriere la balustrade.
 *
 * Aucune collision, aucun combat : le heros et les monstres passent devant.
 */

/** hauteur affichee de la croix (environ 2x le heros) */
const PROP_H = 340;

export class CrucifiedProp {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly drips: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, floorY: number) {
    this.scene = scene;

    const tex = scene.textures.get("crucifie-idle").getSourceImage();
    const scale = PROP_H / tex.height;

    // pose derriere la balustrade : legerement au dessus de la ligne de sol
    const baseY = floorY - 42;

    this.sprite = scene.add
      .sprite(x, baseY, "crucifie-idle")
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setScrollFactor(1)
      .setDepth(-4);
    this.sprite.play("crucifie-idle-anim");

    // respiration / balancement tres lent du corps
    scene.tweens.add({
      targets: this.sprite,
      angle: { from: -0.7, to: 0.7 },
      duration: 4200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    scene.tweens.add({
      targets: this.sprite,
      scaleY: { from: scale, to: scale * 1.012 },
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.ensureDripTexture();

    const bellyY = baseY - PROP_H * 0.42;
    this.drips = scene.add
      .particles(x, bellyY, "fx-drip", {
        lifespan: { min: 900, max: 1800 },
        speedY: { min: 30, max: 90 },
        speedX: { min: -4, max: 4 },
        gravityY: 180,
        scale: { min: 0.5, max: 1.1 },
        alpha: { start: 0.6, end: 0 },
        tint: [0x5a0c12, 0x76141a, 0x3d080d],
        frequency: 520,
        quantity: 1,
        emitZone: {
          type: "random",
          source: new Phaser.Geom.Rectangle(-22, -10, 44, 26),
          quantity: 1,
        },
      })
      .setDepth(-4);
  }

  private ensureDripTexture() {
    if (this.scene.textures.exists("fx-drip")) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 2, 6);
    g.generateTexture("fx-drip", 2, 6);
    g.destroy();
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.destroy();
    this.drips.destroy();
  }
}
