import Phaser from "phaser";

/**
 * Vie de fond : rats qui filent au ras du sol, chauves-souris qui traversent
 * la partie haute du decor.
 *
 * Purement decoratif : aucun corps physique, aucune collision possible avec
 * le heros ou les creatures. Les sprites sont pre-instancies et recycles :
 * rien n'est cree ni detruit pendant la partie.
 */

export const TEX_RAT = "ambient-rat";
export const TEX_BAT = "ambient-bat";
export const ANIM_RAT = "ambient-rat-run";
export const ANIM_BAT = "ambient-bat-fly";

/** hauteur affichee d'un rat */
const RAT_H = 26;
/** envergure affichee d'une chauve-souris */
const BAT_W = 56;

type Critter = {
  sprite: Phaser.GameObjects.Sprite;
  shadow?: Phaser.GameObjects.Ellipse;
  busy: boolean;
  /** vitesse horizontale signee, px/s */
  vx: number;
  /** ordonnee de reference (les chauves-souris ondulent autour) */
  baseY: number;
  /** amplitude et phase de l'ondulation */
  amp: number;
  phase: number;
  freq: number;
  /** pause au sol restante (rats) */
  pause: number;
  /** prochaine pause possible */
  nextPause: number;
  /** bornes de sortie */
  minX: number;
  maxX: number;
};

export type CritterMix = {
  /** nombre de rats dans le pool */
  rats?: number;
  /** nombre de chauves-souris dans le pool */
  bats?: number;
  /** poids de tirage du rat contre la chauve-souris (0..1) */
  ratBias?: number;
};

export class AmbientCritters {
  private readonly scene: Phaser.Scene;
  private readonly rats: Critter[] = [];
  private readonly bats: Critter[] = [];
  private readonly floorY: number;
  private readonly roomWidth: number;
  private readonly ratBias: number;
  private timer?: Phaser.Time.TimerEvent;
  private destroyed = false;

  constructor(
    scene: Phaser.Scene,
    floorY: number,
    roomWidth: number,
    mix: CritterMix = {},
  ) {
    this.scene = scene;
    this.floorY = floorY;
    this.roomWidth = roomWidth;
    this.ratBias = mix.ratBias ?? 0.5;

    const ratCount = mix.rats ?? 4;
    const batCount = mix.bats ?? 3;

    for (let i = 0; i < ratCount; i++) this.rats.push(this.makeRat());
    for (let i = 0; i < batCount; i++) this.bats.push(this.makeBat());

    this.timer = scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.maybeRelease(),
    });
  }

  /* ----------------------------------------------------------------- */

  private makeRat(): Critter {
    const scene = this.scene;
    const tex = scene.textures.get(TEX_RAT).get(0);
    const scale = RAT_H / (tex?.height || 40);

    const shadow = scene.add
      .ellipse(0, 0, 34, 7, 0x120406, 0.45)
      .setDepth(-4)
      .setVisible(false);
    shadow.setBlendMode(Phaser.BlendModes.MULTIPLY);

    const sprite = scene.add
      .sprite(0, 0, TEX_RAT, 0)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setTint(0x8b7a76)
      .setDepth(-3)
      .setVisible(false);

    return {
      sprite,
      shadow,
      busy: false,
      vx: 0,
      baseY: 0,
      amp: 0,
      phase: 0,
      freq: 0,
      pause: 0,
      nextPause: 0,
      minX: 0,
      maxX: 0,
    };
  }

  private makeBat(): Critter {
    const scene = this.scene;
    const tex = scene.textures.get(TEX_BAT).get(0);
    const scale = BAT_W / (tex?.width || 64);

    const sprite = scene.add
      .sprite(0, 0, TEX_BAT, 0)
      .setOrigin(0.5, 0.5)
      .setScale(scale)
      .setAlpha(0.75)
      .setTint(0x6d5a60)
      .setDepth(-4)
      .setVisible(false);

    return {
      sprite,
      busy: false,
      vx: 0,
      baseY: 0,
      amp: 0,
      phase: 0,
      freq: 0,
      pause: 0,
      nextPause: 0,
      minX: 0,
      maxX: 0,
    };
  }

  /* ----------------------------------------------------------------- */

  /** Un passage de temps en temps, jamais deux d'affilee. */
  private maybeRelease() {
    if (this.destroyed) return;
    if (Math.random() > 0.32) return;

    if (Math.random() < this.ratBias) {
      this.releaseRat();
      return;
    }

    // les chauves-souris passent parfois en petit groupe
    const flock = Math.random() < 0.4 ? Phaser.Math.Between(2, 3) : 1;
    for (let i = 0; i < flock; i++) {
      this.scene.time.delayedCall(i * Phaser.Math.Between(120, 320), () => {
        if (!this.destroyed) this.releaseBat();
      });
    }
  }

  /** bornes horizontales du passage, calees hors champ de part et d'autre */
  private lane(margin: number) {
    const cam = this.scene.cameras.main;
    const left = Math.max(-margin, cam.scrollX - margin);
    const right = Math.min(this.roomWidth + margin, cam.scrollX + cam.width + margin);
    return { left, right };
  }

  private releaseRat() {
    const c = this.rats.find((r) => !r.busy);
    if (!c) return;

    const { left, right } = this.lane(120);
    const toRight = Math.random() < 0.5;
    const speed = Phaser.Math.Between(220, 320);

    c.busy = true;
    c.vx = toRight ? speed : -speed;
    c.minX = left;
    c.maxX = right;
    c.baseY = this.floorY - 10;
    c.pause = 0;
    c.nextPause = this.scene.time.now + Phaser.Math.Between(400, 1400);

    const scaleVar = Phaser.Math.FloatBetween(0.8, 1.1);
    const ratScale = (RAT_H * scaleVar) / (c.sprite.frame.height || RAT_H);
    c.sprite
      .setPosition(toRight ? left : right, c.baseY)
      .setFlipX(toRight)
      .setScale(ratScale)
      .setVisible(true);
    c.sprite.play(ANIM_RAT);
    c.shadow?.setScale(scaleVar);


    c.shadow?.setPosition(c.sprite.x, c.baseY + 2).setVisible(true);
  }

  private releaseBat() {
    const c = this.bats.find((b) => !b.busy);
    if (!c) return;

    const { left, right } = this.lane(160);
    const toRight = Math.random() < 0.5;
    const speed = Phaser.Math.Between(260, 380);
    const depth = Phaser.Math.FloatBetween(0.7, 1.15);

    c.busy = true;
    c.vx = toRight ? speed : -speed;
    c.minX = left;
    c.maxX = right;
    c.baseY = this.floorY - Phaser.Math.Between(380, 620);
    c.amp = Phaser.Math.Between(14, 38);
    c.freq = Phaser.Math.FloatBetween(0.0016, 0.0032);
    c.phase = Math.random() * Math.PI * 2;

    const base = BAT_W / (c.sprite.frame.width || BAT_W);
    c.sprite
      .setPosition(toRight ? left : right, c.baseY)
      .setFlipX(!toRight)
      .setScale(base * depth)
      .setAlpha(0.55 + depth * 0.2)
      .setVisible(true);
    c.sprite.play(ANIM_BAT);
  }

  /* ----------------------------------------------------------------- */

  /** A appeler chaque frame. */
  tick(time: number, delta: number) {
    if (this.destroyed) return;
    const dt = delta / 1000;

    for (const c of this.rats) {
      if (!c.busy) continue;

      // arrets brefs : le rat s'immobilise, renifle, repart
      if (c.pause > 0) {
        c.pause -= delta;
        if (c.pause <= 0) c.sprite.play(ANIM_RAT);
      } else {
        c.sprite.x += c.vx * dt;
        if (time >= c.nextPause && Math.random() < 0.02) {
          c.pause = Phaser.Math.Between(160, 420);
          c.nextPause = time + Phaser.Math.Between(900, 2200);
          c.sprite.stop();
          c.sprite.setFrame(0);
        }
      }

      c.shadow?.setPosition(c.sprite.x, c.baseY + 2);

      if (c.sprite.x < c.minX - 80 || c.sprite.x > c.maxX + 80) this.park(c);
    }

    for (const c of this.bats) {
      if (!c.busy) continue;
      c.sprite.x += c.vx * dt;
      c.sprite.y = c.baseY + Math.sin(time * c.freq + c.phase) * c.amp;
      if (c.sprite.x < c.minX - 120 || c.sprite.x > c.maxX + 120) this.park(c);
    }
  }

  private park(c: Critter) {
    c.busy = false;
    c.sprite.stop();
    c.sprite.setVisible(false);
    c.shadow?.setVisible(false);
  }

  destroy() {
    this.destroyed = true;
    this.timer?.remove();
    this.timer = undefined;
    for (const c of [...this.rats, ...this.bats]) {
      this.scene.tweens.killTweensOf(c.sprite);
      c.sprite.destroy();
      c.shadow?.destroy();
    }
    this.rats.length = 0;
    this.bats.length = 0;
  }
}
