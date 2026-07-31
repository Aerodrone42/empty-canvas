import Phaser from "phaser";

/**
 * Chevalet d'ecartellement (Streckbett) vu de face, plaque contre le mur du
 * corridor : bati de bois et de fer, un supplicie sangle sur la table et deux
 * bourreaux qui tirent chacun de leur cote.
 *
 * L'ecartellement se joue par crans : chaque cran fait avancer la frame du
 * supplicie, tend les chaines et secoue la machine, pour que l'oeil suive.
 */

const TEX_RACK = "torture-rack";
const TEX_VICTIM = "torture-rack-victim";
const TEX_CRANK = "bourreau-crank";

/** largeur affichee du bati */
const RACK_W = 340;
/** hauteur de la plinthe du mur : la machine est plaquee contre le fond */
const WALL_LIFT = 100;
/** longueur du supplicie a l'ecran (homme d'environ 1,75 m) */
const VICTIM_LEN = 150;
/** largeur dessinee du corps dans une cellule de 512 px */
const VICTIM_ART_W = 330;
/** distance de declenchement */
const TRIGGER_RANGE = 520;
/** duree d'un cran */
const STEP_MS = 450;


type Phase = "idle" | "effort" | "done";

export class TortureRack {
  private readonly scene: Phaser.Scene;
  private readonly rack: Phaser.GameObjects.Image;
  private readonly victim: Phaser.GameObjects.Sprite;
  private readonly torturers: Phaser.GameObjects.Image[] = [];
  private readonly x: number;
  private readonly floorY: number;
  private readonly rackH: number;
  private readonly victimScale: number;
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
    // le bati est plaque contre le mur du fond, pas sur le plan de jeu
    this.floorY = floorY - WALL_LIFT;

    const src = scene.textures.get(TEX_RACK).getSourceImage();
    const scale = RACK_W / (src.width || 1);
    this.rackH = (src.height || 1) * scale;

    // bati pose sur la plinthe du mur
    this.rack = scene.add
      .image(x, this.floorY, TEX_RACK)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setTint(0x6d5a56)
      .setDepth(-6);

    // supplicie sangle sur la table, centre dans l'axe des chaines
    this.victimScale = VICTIM_LEN / VICTIM_ART_W;
    this.victim = scene.add
      .sprite(x, this.floorY - this.rackH * 0.5, TEX_VICTIM, 0)
      .setOrigin(0.5, 0.5)
      .setScale(this.victimScale)
      .setTint(0x9c7a74)
      .setDepth(-5);

    // les deux bourreaux, arc-boutes sur les treuils, tournes vers la machine
    for (const side of [-1, 1] as const) {
      const t = scene.add
        .image(x + side * RACK_W * 0.58, this.floorY + 6, TEX_CRANK)
        .setOrigin(0.5, 1)
        .setScale(0.85)
        .setFlipX(side > 0)
        .setTint(0x8b7a76)
        .setDepth(-4);
      this.torturers.push(t);
    }


    this.nextTwitchAt = scene.time.now + Phaser.Math.Between(600, 1800);
  }

  /** repos : la machine grince, les bourreaux tirent par a-coups */
  private twitch(time: number) {
    this.nextTwitchAt = time + Phaser.Math.Between(1800, 3800);

    this.scene.tweens.add({
      targets: this.victim,
      scaleX: this.victimScale * 1.02,
      duration: 320,
      yoyo: true,
      ease: "Sine.easeInOut",
    });

    for (const [i, t] of this.torturers.entries()) {
      const dir = i === 0 ? -1 : 1;
      this.scene.tweens.add({
        targets: t,
        x: t.x + dir * 5,
        duration: 300,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    }

    this.scene.events.emit("fx-blood", this.x, this.floorY - this.rackH * 0.34, 0, 0.4);
  }

  /** un cran de treuil : frame suivante, chaines tendues, secousse */
  private crank(step: number, frame: number, stretch: number) {
    if (this.destroyed) return;

    this.victim.setFrame(frame);
    this.scene.tweens.add({
      targets: this.victim,
      scaleX: this.victimScale * stretch,
      duration: 220,
      ease: "Cubic.easeOut",
    });

    for (const [i, t] of this.torturers.entries()) {
      const dir = i === 0 ? -1 : 1;
      this.scene.tweens.add({
        targets: t,
        x: t.x + dir * 6,
        angle: dir * 3,
        duration: 200,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    }

    this.scene.cameras.main.shake(140, 0.003 + step * 0.001);
    this.scene.events.emit(
      "fx-blood",
      this.x + Phaser.Math.Between(-50, 50),
      this.floorY - this.rackH * 0.4,
      0,
      0.6 + step * 0.3,
    );
  }

  /** effort final : trois crans, puis la rupture */
  private finale() {
    this.phase = "effort";
    const vy = this.floorY - this.rackH * 0.44;

    // approche : les bourreaux se calent, les chaines se tendent
    for (const [i, t] of this.torturers.entries()) {
      const dir = i === 0 ? -1 : 1;
      this.scene.tweens.add({
        targets: t,
        x: t.x + dir * 10,
        duration: 320,
        ease: "Sine.easeOut",
      });
    }

    const steps: { frame: number; stretch: number }[] = [
      { frame: 1, stretch: 1.04 },
      { frame: 2, stretch: 1.1 },
      { frame: 3, stretch: 1.18 },
    ];

    steps.forEach((s, i) => {
      this.scene.time.delayedCall(400 + i * STEP_MS, () =>
        this.crank(i, s.frame, s.stretch),
      );
    });

    // rupture
    this.scene.time.delayedCall(400 + steps.length * STEP_MS, () => {
      if (this.destroyed) return;
      this.victim.setFrame(4);
      this.scene.cameras.main.shake(320, 0.013);
      this.scene.events.emit("fx-gore", this.x, vy, 2.6);
      this.scene.events.emit("fx-blood", this.x, vy, 1, 2.8);
      this.scene.events.emit("fx-blood", this.x - 50, vy, -1, 1.8);
      this.scene.events.emit("fx-blood", this.x + 50, vy, 1, 1.8);

      // le corps rompu retombe, la machine vibre encore
      this.scene.time.delayedCall(260, () => {
        if (this.destroyed) return;
        this.victim.setFrame(5);
        this.scene.tweens.add({
          targets: this.victim,
          scaleX: this.victimScale * 1.12,
          duration: 300,
          ease: "Quad.easeOut",
        });
        for (const t of this.torturers) {
          this.scene.tweens.add({
            targets: t,
            x: t.x + Phaser.Math.Between(-4, 4),
            duration: 90,
            yoyo: true,
            repeat: 4,
          });
        }
        this.scene.events.emit("fx-blood", this.x, vy + 20, 0, 1.4);
      });
    });

    this.scene.time.delayedCall(400 + steps.length * STEP_MS + 1200, () =>
      this.release(),
    );
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
