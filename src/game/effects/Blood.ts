import Phaser from "phaser";

/**
 * Gestion centralisee du sang : gerbes d'impact, brume, taches persistantes
 * au sol et gibs de chair. Les textures sont generees a la volee, aucun
 * asset externe n'est necessaire.
 */

const DROP_KEY = "fx-blood-drop";
const MIST_KEY = "fx-blood-mist";
const SPARK_KEY = "fx-parry-spark";

const MAX_STAINS = 60;

function ensureTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists(DROP_KEY)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture(DROP_KEY, 8, 8);
    g.destroy();
  }
  if (!scene.textures.exists(MIST_KEY)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(16, 16, 16);
    g.generateTexture(MIST_KEY, 32, 32);
    g.destroy();
  }
  if (!scene.textures.exists(SPARK_KEY)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 6, 2);
    g.generateTexture(SPARK_KEY, 6, 2);
    g.destroy();
  }
}

const CRIMSON = [0x8e1220, 0xb01f2b, 0xd93b3b, 0x6a0d18];

export class BloodFX {
  private scene: Phaser.Scene;
  private stains: Phaser.GameObjects.Ellipse[] = [];
  /** ordonnee du sol utilisee pour les taches persistantes */
  private floorY: number;

  constructor(scene: Phaser.Scene, floorY: number) {
    this.scene = scene;
    this.floorY = floorY;
    ensureTextures(scene);
  }

  /** Gerbe orientee : dirX = -1 vers la gauche, 1 vers la droite. */
  splatter(x: number, y: number, dirX: number, intensity = 1) {
    const count = Math.round(Phaser.Math.Clamp(10 * intensity, 4, 44));

    const emitter = this.scene.add.particles(x, y, DROP_KEY, {
      lifespan: { min: 320, max: 760 },
      speed: { min: 90 * intensity, max: 340 * intensity },
      angle: dirX >= 0 ? { min: -70, max: 25 } : { min: 155, max: 250 },
      gravityY: 900,
      scale: { start: Phaser.Math.FloatBetween(0.4, 1.1) * intensity, end: 0.15 },
      tint: CRIMSON,
      quantity: count,
      blendMode: Phaser.BlendModes.NORMAL,
      emitting: false,
    });
    emitter.setDepth(6);
    emitter.explode(count);
    this.scene.time.delayedCall(900, () => emitter.destroy());

    // brume au point d'impact
    const mist = this.scene.add.image(x, y, MIST_KEY);
    mist.setTint(0xb01f2b);
    mist.setAlpha(0.55);
    mist.setScale(0.6 * intensity);
    mist.setDepth(6);
    this.scene.tweens.add({
      targets: mist,
      alpha: 0,
      scale: 1.5 * intensity,
      duration: 240,
      onComplete: () => mist.destroy(),
    });

    // quelques taches au sol
    const stains = Math.max(1, Math.round(intensity * 2));
    for (let i = 0; i < stains; i++) {
      this.scene.time.delayedCall(120 + i * 60, () =>
        this.stain(x + Phaser.Math.Between(-60, 60) + dirX * 40, intensity),
      );
    }
  }

  /** Tache persistante au sol, limitee en nombre. */
  stain(x: number, intensity = 1) {
    if (!this.scene.scene.isActive()) return;
    const w = Phaser.Math.Between(20, 46) * Phaser.Math.Clamp(intensity, 0.6, 2);
    const stain = this.scene.add.ellipse(
      x,
      this.floorY + Phaser.Math.Between(-2, 4),
      w,
      w * 0.28,
      Phaser.Utils.Array.GetRandom(CRIMSON),
      0.75,
    );
    stain.setDepth(1);
    this.stains.push(stain);
    while (this.stains.length > MAX_STAINS) {
      const old = this.stains.shift();
      old?.destroy();
    }
  }

  /** Explosion de mort : beaucoup de sang + morceaux de chair qui rebondissent. */
  gore(x: number, y: number, intensity = 1) {
    this.splatter(x, y, 1, 2.2 * intensity);
    this.splatter(x, y, -1, 2.2 * intensity);

    const gibs = Math.round(Phaser.Math.Clamp(4 * intensity, 3, 9));
    for (let i = 0; i < gibs; i++) {
      const gib = this.scene.add.ellipse(
        x,
        y,
        Phaser.Math.Between(6, 14),
        Phaser.Math.Between(5, 11),
        Phaser.Utils.Array.GetRandom(CRIMSON),
        1,
      );
      gib.setDepth(6);
      const targetX = x + Phaser.Math.Between(-140, 140);
      this.scene.tweens.add({
        targets: gib,
        x: targetX,
        y: this.floorY - 2,
        angle: Phaser.Math.Between(-360, 360),
        ease: "Quad.easeIn",
        duration: Phaser.Math.Between(420, 700),
        onComplete: () => {
          this.stain(targetX, 0.8);
          this.scene.tweens.add({
            targets: gib,
            alpha: 0,
            duration: 1200,
            delay: 600,
            onComplete: () => gib.destroy(),
          });
        },
      });
    }

    // flaque finale
    this.scene.time.delayedCall(320, () => {
      this.stain(x, 2 * intensity);
      this.stain(x + Phaser.Math.Between(-30, 30), 1.4 * intensity);
    });
  }

  /** Etincelles dorees d'une parade reussie. */
  sparks(x: number, y: number) {
    const emitter = this.scene.add.particles(x, y, SPARK_KEY, {
      lifespan: { min: 180, max: 380 },
      speed: { min: 120, max: 320 },
      angle: { min: 0, max: 360 },
      gravityY: 320,
      scale: { start: 1.2, end: 0.2 },
      tint: [0xf2d9a0, 0xffe9b0, 0xffffff],
      quantity: 14,
      emitting: false,
    });
    emitter.setDepth(7);
    emitter.explode(14);
    this.scene.time.delayedCall(600, () => emitter.destroy());
  }
}
