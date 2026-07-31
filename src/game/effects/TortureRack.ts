import Phaser from "phaser";

/**
 * Chevalet d'ecartellement (Streckbett) vu de face, plaque contre le mur du
 * corridor : bati massif de bois et de fer, deux treuils, un supplicie sangle
 * sur la table et deux bourreaux monstrueux qui tirent chacun de leur cote.
 *
 * Sequence : repos -> preparation -> effort -> dechirement -> les bourreaux
 * lachent les manivelles et deviennent de vrais ennemis.
 */

const TEX_RACK = "torture-rack";
const TEX_VICTIM = "torture-rack-victim";
const TEX_VICTIM_TORN = "torture-rack-victim-torn";
const TEX_CRANK = "bourreau-crank";

/** largeur affichee du bati */
const RACK_W = 620;
/** distance de declenchement */
const TRIGGER_RANGE = 560;

type Phase = "idle" | "effort" | "done";

export class TortureRack {
  private readonly scene: Phaser.Scene;
  private readonly rack: Phaser.GameObjects.Image;
  private readonly victim: Phaser.GameObjects.Image;
  private readonly torturers: Phaser.GameObjects.Image[] = [];
  private readonly x: number;
  private readonly floorY: number;
  private readonly rackH: number;
  private phase: Phase = "idle";
  private nextTwitchAt = 0;
  private destroyed = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    floorY: number,
    private readonly onRelease: (spots: { x: number; y: number }[]) => void,
  ) {
    this.scene = scene;
    this.x = x;
    this.floorY = floorY;

    const src = scene.textures.get(TEX_RACK).getSourceImage();
    const scale = RACK_W / (src.width || 1);
    this.rackH = (src.height || 1) * scale;

    // bati massif, pose au sol contre le mur
    this.rack = scene.add
      .image(x, floorY, TEX_RACK)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setTint(0x8d7570)
      .setDepth(-4);

    // supplicie sangle sur la table
    const vs = scene.textures.get(TEX_VICTIM).getSourceImage();
    this.victim = scene.add
      .image(x, floorY - this.rackH * 0.44, TEX_VICTIM)
      .setOrigin(0.5, 0.5)
      .setScale((RACK_W * 0.62) / (vs.width || 1))
      .setTint(0xa06a66)
      .setDepth(-3);

    // les deux bourreaux, arc-boutes sur les treuils
    for (const side of [-1, 1] as const) {
      const t = scene.add
        .image(x + side * RACK_W * 0.52, floorY + 6, TEX_CRANK)
        .setOrigin(0.5, 1)
        .setScale(1.45)
        .setFlipX(side < 0)
        .setTint(0x9a8884)
        .setDepth(-2);
      this.torturers.push(t);
    }

    this.nextTwitchAt = scene.time.now + Phaser.Math.Between(600, 1800);
  }

  /** repos : la machine grince, les bourreaux tirent par a-coups */
  private twitch(time: number) {
    this.nextTwitchAt = time + Phaser.Math.Between(1800, 3800);

    this.scene.tweens.add({
      targets: this.victim,
      scaleX: this.victim.scaleX * 1.03,
      duration: 320,
      yoyo: true,
      ease: "Sine.easeInOut",
    });

    for (const [i, t] of this.torturers.entries()) {
      const dir = i === 0 ? -1 : 1;
      this.scene.tweens.add({
        targets: t,
        x: t.x + dir * 7,
        duration: 300,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    }

    this.scene.events.emit("fx-blood", this.x, this.floorY - this.rackH * 0.34, 0, 0.5);
  }

  /** effort final : la machine se tend, le corps cede */
  private finale() {
    this.phase = "effort";
    const baseScaleX = this.victim.scaleX;

    this.scene.tweens.add({
      targets: this.victim,
      scaleX: baseScaleX * 1.26,
      duration: 900,
      ease: "Cubic.easeIn",
      onUpdate: () => this.scene.cameras.main.shake(40, 0.0018),
      onComplete: () => {
        if (this.destroyed) return;
        // dechirement
        this.victim.setTexture(TEX_VICTIM_TORN);
        this.victim.setScale(baseScaleX * 1.3, baseScaleX * 1.02);
        this.scene.cameras.main.shake(300, 0.012);
        const vy = this.floorY - this.rackH * 0.4;
        this.scene.events.emit("fx-gore", this.x, vy, 2.6);
        this.scene.events.emit("fx-blood", this.x, vy, 1, 2.8);
        this.scene.events.emit("fx-blood", this.x - 60, vy, -1, 1.8);
        this.scene.events.emit("fx-blood", this.x + 60, vy, 1, 1.8);
      },
    });

    for (const [i, t] of this.torturers.entries()) {
      const dir = i === 0 ? -1 : 1;
      this.scene.tweens.add({
        targets: t,
        x: t.x + dir * 30,
        duration: 900,
        ease: "Cubic.easeIn",
      });
    }

    this.scene.time.delayedCall(1500, () => this.release());
  }

  /** les bourreaux lachent les manivelles : la scene prend le relais */
  private release() {
    if (this.destroyed || this.phase === "done") return;
    this.phase = "done";

    const spots = this.torturers.map((t) => ({ x: t.x, y: this.floorY }));
    for (const t of this.torturers) {
      this.scene.tweens.killTweensOf(t);
      t.destroy();
    }
    this.torturers.length = 0;

    this.onRelease(spots);
  }

  tick(playerX: number, time: number) {
    if (this.destroyed) return;
    if (this.phase !== "idle") return;

    if (Math.abs(playerX - this.x) < TRIGGER_RANGE) {
      this.finale();
      return;
    }
    if (time >= this.nextTwitchAt) this.twitch(time);
  }

  destroy() {
    this.destroyed = true;
    for (const t of this.torturers) {
      this.scene.tweens.killTweensOf(t);
      t.destroy();
    }
    this.torturers.length = 0;
    this.scene.tweens.killTweensOf(this.victim);
    this.victim.destroy();
    this.rack.destroy();
  }
}
