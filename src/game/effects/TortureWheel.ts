import Phaser from "phaser";

/**
 * Machine d'ecartellement, vue de face, posee contre le mur du corridor.
 *
 * Au repos : la roue grince et tourne par a-coups, la victime attachee en X
 * convulse, deux bourreaux tirent sur les cordes.
 * Quand le heros approche, la traction finale acheve le supplice (la victime
 * se dechire dans une gerbe de sang) puis les deux bourreaux lachent les
 * cordes : la scene les remplace par de vrais ennemis.
 */

const TEX_MACHINE = "torture-wheel";
const TEX_VICTIM = "torture-victim";
const ANIM_VICTIM = "torture-victim-anim";

/** hauteur affichee du bati */
const MACHINE_H = 420;
/** distance de declenchement */
const TRIGGER_RANGE = 520;

type Phase = "idle" | "finale" | "done";

export class TortureWheel {
  private readonly scene: Phaser.Scene;
  private readonly machine: Phaser.GameObjects.Image;
  private readonly victim: Phaser.GameObjects.Sprite;
  /** silhouettes decoratives des deux bourreaux, avant leur liberation */
  private readonly torturers: Phaser.GameObjects.Sprite[] = [];
  private readonly x: number;
  private readonly floorY: number;
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
    TortureWheel.ensureAnim(scene);

    const src = scene.textures.get(TEX_MACHINE).getSourceImage();
    const scale = MACHINE_H / (src.height || 1);

    // bati complet
    this.machine = scene.add
      .image(x, floorY, TEX_MACHINE)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setTint(0x9a7d78)
      .setDepth(-4);

    // victime attachee au centre de la roue
    this.victim = scene.add
      .sprite(x, floorY - MACHINE_H * 0.28, TEX_VICTIM, 0)
      .setOrigin(0.5, 1)
      .setScale((MACHINE_H * 0.42) / 240)
      .setTint(0xa8575a)
      .setDepth(-3);

    // les deux bourreaux, de part et d'autre, penches sur les cordes
    for (const side of [-1, 1] as const) {
      const s = scene.add
        .sprite(x + side * MACHINE_H * 0.58, floorY, "bourreau-idle", 0)
        .setOrigin(0.5, 1)
        .setScale(1.2)
        .setFlipX(side > 0)
        .setTint(0x9c8a86)
        .setDepth(-2);
      s.play("bourreau-idle-anim");
      this.torturers.push(s);
    }

    this.nextTwitchAt = scene.time.now + Phaser.Math.Between(800, 2200);
  }

  private static ensureAnim(scene: Phaser.Scene) {
    if (scene.anims.exists(ANIM_VICTIM)) return;
    scene.anims.create({
      key: ANIM_VICTIM,
      frames: scene.anims.generateFrameNumbers(TEX_VICTIM, { start: 0, end: 4 }),
      frameRate: 7,
      repeat: 0,
      yoyo: true,
    });
  }

  /** convulsion au repos : la victime se tend, les bourreaux tirent */
  private twitch(time: number) {
    this.nextTwitchAt = time + Phaser.Math.Between(2200, 5200);
    this.victim.play(ANIM_VICTIM, true);

    for (const [i, t] of this.torturers.entries()) {
      const dir = i === 0 ? -1 : 1;
      this.scene.tweens.add({
        targets: t,
        x: t.x + dir * 8,
        duration: 260,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    }

    // une goutte de sang tombe de la roue
    this.scene.events.emit("fx-blood", this.x, this.floorY - MACHINE_H * 0.4, 0, 0.5);
  }

  /** traction finale : la victime cede, puis les bourreaux se retournent */
  private finale() {
    this.phase = "finale";
    this.victim.setFrame(4);

    this.scene.tweens.add({
      targets: this.victim,
      scaleX: this.victim.scaleX * 1.22,
      duration: 700,
      ease: "Cubic.easeIn",
      onComplete: () => {
        if (this.destroyed) return;
        this.victim.setFrame(5);
        this.victim.setScale(this.victim.scaleY);
        this.scene.cameras.main.shake(260, 0.010);
        this.scene.events.emit("fx-gore", this.x, this.floorY - MACHINE_H * 0.32, 2.2);
        this.scene.events.emit(
          "fx-blood",
          this.x,
          this.floorY - MACHINE_H * 0.32,
          1,
          2.4,
        );
      },
    });

    for (const [i, t] of this.torturers.entries()) {
      const dir = i === 0 ? -1 : 1;
      this.scene.tweens.add({
        targets: t,
        x: t.x + dir * 26,
        duration: 700,
        ease: "Cubic.easeIn",
      });
    }

    this.scene.time.delayedCall(1200, () => this.release());
  }

  /** les bourreaux lachent la corde : la scene prend le relais */
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

    if (this.phase === "idle") {
      if (Math.abs(playerX - this.x) < TRIGGER_RANGE) {
        this.finale();
        return;
      }
      if (time >= this.nextTwitchAt) this.twitch(time);
    }
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
    this.machine.destroy();
  }
}
