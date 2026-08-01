import Phaser from "phaser";

/**
 * Monture d'Effroi : mini-boss aerien de la cathedrale.
 *
 * Elle surgit dans la seconde moitie de la salle, avant la colonne de sortie,
 * et reste en vol pendant tout le combat. Elle enchaine trois attaques :
 * le pique (charge horizontale), la morsure (gueule qui claque de pres) et
 * les griffes (fauchage des serres). Chaque attaque est telegraphie par une
 * montee et un eclat rouge, pour laisser la parade et l'esquive jouables.
 *
 * Elle n'est vulnerable que lorsqu'elle descend (pique, morsure, griffes) :
 * pendant la remontee, les coups du heros la traversent.
 */

export const TEX_MOUNT_FLY = "dread-mount-fly";
export const TEX_MOUNT_DIVE = "dread-mount-dive";
export const TEX_MOUNT_BITE = "dread-mount-bite";
export const TEX_MOUNT_CLAW = "dread-mount-claw";
export const TEX_MOUNT_DEATH = "dread-mount-death";

export const ANIM_MOUNT_FLY = "dread-mount-fly-anim";
export const ANIM_MOUNT_DIVE = "dread-mount-dive-anim";
export const ANIM_MOUNT_BITE = "dread-mount-bite-anim";
export const ANIM_MOUNT_CLAW = "dread-mount-claw-anim";
export const ANIM_MOUNT_DEATH = "dread-mount-death-anim";

/** cadre d'une frame de la feuille */
const FRAME_W = 512;
/** largeur affichee de la bete, ailes deployees */
const MOUNT_W = 620;
/** altitude de croisiere (hors de portee) */
const HIGH_Y = 300;
/** altitude d'attaque : a hauteur du heros */
const LOW_OFFSET = 150;

export const MOUNT_MAX_HP = 420;
/** en dessous de ce ratio, la bete s'enrage */
const ENRAGE_AT = 0.35;

export interface DreadMountOptions {
  floorY: number;
  roomWidth: number;
  /** abscisse a partir de laquelle le combat se declenche */
  triggerX: number;
  getPlayer: () => { x: number; y: number };
  /** degats infliges au heros (passe par la parade de la scene) */
  onStrike: (amount: number) => void;
  /** gerbes de sang optionnelles */
  onGore?: (x: number, y: number) => void;
}

export function registerDreadMountAnims(scene: Phaser.Scene) {
  const make = (
    key: string,
    tex: string,
    end: number,
    frameRate: number,
    repeat: number,
  ) => {
    if (scene.anims.exists(key)) return;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(tex, { start: 0, end }),
      frameRate,
      repeat,
    });
  };

  make(ANIM_MOUNT_FLY, TEX_MOUNT_FLY, 7, 9, -1);
  make(ANIM_MOUNT_DIVE, TEX_MOUNT_DIVE, 3, 12, -1);
  make(ANIM_MOUNT_BITE, TEX_MOUNT_BITE, 5, 11, 0);
  make(ANIM_MOUNT_CLAW, TEX_MOUNT_CLAW, 5, 12, 0);
  make(ANIM_MOUNT_DEATH, TEX_MOUNT_DEATH, 5, 7, 0);
}

type MountState =
  | "dormant"
  | "arrival"
  | "hover"
  | "telegraph"
  | "dive"
  | "bite"
  | "claw"
  | "recover"
  | "dying"
  | "gone";

export class DreadMount {
  private readonly scene: Phaser.Scene;
  private readonly opts: DreadMountOptions;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly gore: Phaser.GameObjects.Particles.ParticleEmitter;

  private state: MountState = "dormant";
  private stateTime = 0;
  private hp = MOUNT_MAX_HP;
  private bob = 0;
  private vx = 0;
  private targetX = 0;
  private targetY = HIGH_Y;
  private nextAttack: "dive" | "bite" | "claw" = "dive";
  private struckThisPass = false;
  private destroyed = false;
  private readonly bar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, opts: DreadMountOptions) {
    this.scene = scene;
    this.opts = opts;

    registerDreadMountAnims(scene);

    this.sprite = scene.add
      .sprite(-9999, HIGH_Y, TEX_MOUNT_FLY, 0)
      .setOrigin(0.5, 0.5)
      .setScale(MOUNT_W / FRAME_W)
      .setDepth(18)
      .setVisible(false);

    this.ensureGoreTexture();
    this.gore = scene.add
      .particles(0, 0, "fx-mount-gore", {
        lifespan: { min: 600, max: 1400 },
        speedY: { min: 30, max: 160 },
        speedX: { min: -70, max: 70 },
        gravityY: 320,
        scale: { min: 0.6, max: 1.8 },
        alpha: { start: 0.9, end: 0 },
        tint: [0x5a0c12, 0x7d151c, 0x3a070b],
        frequency: -1,
        quantity: 1,
      })
      .setDepth(19);

    // jauge de vie du mini-boss, ancree en haut de l'ecran
    this.bar = scene.add.graphics().setScrollFactor(0).setDepth(70).setVisible(false);
  }

  /** redessine la jauge du boss */
  private drawBar() {
    const cam = this.scene.cameras.main;
    const w = Math.min(560, cam.width * 0.6);
    const x = (cam.width - w) / 2;
    const y = 46;
    this.bar.clear();
    this.bar.fillStyle(0x160a0c, 0.85).fillRect(x - 3, y - 3, w + 6, 16);
    this.bar.fillStyle(0x3b1013, 1).fillRect(x, y, w, 10);
    this.bar.fillStyle(this.enraged ? 0xd23b3b : 0x8d1b21, 1)
      .fillRect(x, y, w * this.healthRatio, 10);
    this.bar.lineStyle(1, 0x6b4a3a, 0.9).strokeRect(x - 3, y - 3, w + 6, 16);
  }


  private ensureGoreTexture() {
    if (this.scene.textures.exists("fx-mount-gore")) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 3, 5);
    g.generateTexture("fx-mount-gore", 3, 5);
    g.destroy();
  }

  get isEngaged() {
    return this.state !== "dormant" && this.state !== "gone";
  }

  get isDead() {
    return this.state === "dying" || this.state === "gone";
  }

  get isDefeated() {
    return this.state === "gone";
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  get healthRatio() {
    return Phaser.Math.Clamp(this.hp / MOUNT_MAX_HP, 0, 1);
  }

  private get enraged() {
    return this.healthRatio <= ENRAGE_AT;
  }

  /** touchable uniquement quand elle descend au contact */
  get isVulnerable() {
    return this.state === "dive" || this.state === "bite" || this.state === "claw";
  }

  /** appele par la scene quand un coup du heros porte */
  takeHit(damage: number, fromX: number) {
    if (this.isDead || !this.isVulnerable) return false;
    this.hp -= damage;
    this.sprite.setTint(0xffdcdc);
    this.scene.time.delayedCall(70, () => {
      if (!this.destroyed) this.sprite.clearTint();
    });
    this.gore.setPosition(this.sprite.x, this.sprite.y + 20);
    this.gore.explode(12);
    this.opts.onGore?.(this.sprite.x, this.sprite.y + 20);

    const dir = Math.sign(this.sprite.x - fromX) || 1;
    this.sprite.x += dir * 8;

    if (this.hp <= 0) this.die();
    return true;
  }

  private setState(next: MountState) {
    this.state = next;
    this.stateTime = 0;
  }

  private engage() {
    const player = this.opts.getPlayer();
    this.sprite.x = player.x - 700;
    this.sprite.y = HIGH_Y - 80;
    this.sprite.setVisible(true).setAlpha(0).setAngle(0);
    this.sprite.play(ANIM_MOUNT_FLY);
    this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 700 });
    this.scene.cameras.main.shake(500, 0.006);
    this.bar.setVisible(true);
    this.drawBar();
    this.setState("arrival");
  }

  private pickAttack() {
    const roll = Math.random();
    this.nextAttack = roll < 0.45 ? "dive" : roll < 0.75 ? "bite" : "claw";
  }

  private startTelegraph() {
    this.pickAttack();
    this.sprite.play(ANIM_MOUNT_FLY, true);
    this.sprite.setTint(0xff8a8a);
    this.setState("telegraph");
  }

  private launchAttack() {
    this.sprite.clearTint();
    const player = this.opts.getPlayer();
    const dir = player.x >= this.sprite.x ? 1 : -1;
    this.sprite.setFlipX(dir < 0);
    this.struckThisPass = false;

    if (this.nextAttack === "dive") {
      // pique : elle traverse a hauteur du heros
      this.sprite.play(ANIM_MOUNT_DIVE, true);
      this.vx = dir * (this.enraged ? 620 : 470);
      this.targetY = player.y - LOW_OFFSET + 60;
      this.setState("dive");
      return;
    }

    // morsure / griffes : vol stationnaire bas, juste devant le heros
    this.targetX = player.x - dir * 190;
    this.targetY = player.y - LOW_OFFSET;
    this.sprite.play(
      this.nextAttack === "bite" ? ANIM_MOUNT_BITE : ANIM_MOUNT_CLAW,
      true,
    );
    this.setState(this.nextAttack);
  }

  /** contact avec le heros pendant une attaque */
  private tryStrike(reachX: number, reachY: number, damage: number) {
    if (this.struckThisPass) return;
    const player = this.opts.getPlayer();
    if (
      Math.abs(player.x - this.sprite.x) < reachX &&
      Math.abs(player.y - this.sprite.y) < reachY
    ) {
      this.struckThisPass = true;
      this.opts.onStrike(damage);
      this.scene.cameras.main.shake(120, 0.008);
    }
  }

  private die() {
    this.setState("dying");
    this.sprite.clearTint();
    this.sprite.play(ANIM_MOUNT_DEATH, true);
    this.gore.setPosition(this.sprite.x, this.sprite.y);
    this.gore.explode(60);
    this.opts.onGore?.(this.sprite.x, this.sprite.y + 30);
    this.scene.cameras.main.shake(420, 0.012);

    this.scene.tweens.add({
      targets: this.sprite,
      y: this.opts.floorY - 60,
      angle: 32,
      alpha: 0,
      duration: 1300,
      ease: "Quad.easeIn",
      onComplete: () => {
        if (this.destroyed) return;
        this.gore.setPosition(this.sprite.x, this.opts.floorY - 40);
        this.gore.explode(50);
        this.opts.onGore?.(this.sprite.x, this.opts.floorY - 20);
        this.sprite.setVisible(false);
        this.bar.clear();
        this.bar.setVisible(false);
        this.setState("gone");
      },
    });
  }

  update(_time: number, delta: number) {
    if (this.destroyed || this.state === "gone") return;
    const dt = delta / 1000;
    this.stateTime += delta;
    const player = this.opts.getPlayer();

    if (this.state === "dormant") {
      if (player.x >= this.opts.triggerX) this.engage();
      return;
    }

    this.drawBar();

    if (this.state === "dying") return;

    this.bob += dt * 2.4;

    switch (this.state) {
      case "arrival": {
        this.sprite.x = Phaser.Math.Linear(this.sprite.x, player.x - 260, 1 - Math.pow(0.001, dt));
        this.sprite.y = Phaser.Math.Linear(this.sprite.y, HIGH_Y, 1 - Math.pow(0.004, dt));
        this.sprite.setFlipX(player.x < this.sprite.x);
        if (this.stateTime > 1500) this.setState("hover");
        break;
      }

      case "hover": {
        // elle tourne au dessus du heros, hors de portee
        const side = Math.sin(this.stateTime / 900) * 240;
        this.sprite.x = Phaser.Math.Linear(this.sprite.x, player.x + side, 1 - Math.pow(0.05, dt));
        this.sprite.y = Phaser.Math.Linear(
          this.sprite.y,
          HIGH_Y + Math.sin(this.bob) * 18,
          1 - Math.pow(0.02, dt),
        );
        this.sprite.setFlipX(player.x < this.sprite.x);
        this.sprite.setAngle(0);
        if (this.stateTime > (this.enraged ? 700 : 1300)) this.startTelegraph();
        break;
      }

      case "telegraph": {
        // montee seche + eclat rouge : le joueur a le temps de reagir
        this.sprite.y = Phaser.Math.Linear(this.sprite.y, HIGH_Y - 70, 1 - Math.pow(0.01, dt));
        this.sprite.x = Phaser.Math.Linear(this.sprite.x, player.x - 320, 1 - Math.pow(0.2, dt));
        this.sprite.setFlipX(player.x < this.sprite.x);
        this.sprite.setAlpha(0.7 + 0.3 * Math.abs(Math.sin(this.stateTime / 70)));
        if (this.stateTime > (this.enraged ? 380 : 620)) {
          this.sprite.setAlpha(1);
          this.launchAttack();
        }
        break;
      }

      case "dive": {
        this.sprite.x += this.vx * dt;
        this.sprite.y = Phaser.Math.Linear(this.sprite.y, this.targetY, 1 - Math.pow(0.005, dt));
        this.sprite.setAngle(this.vx > 0 ? 8 : -8);
        this.tryStrike(150, 130, 16);
        const beyond = this.vx > 0
          ? this.sprite.x > player.x + 520
          : this.sprite.x < player.x - 520;
        if (beyond || this.stateTime > 2200) this.setState("recover");
        break;
      }

      case "bite":
      case "claw": {
        this.sprite.x = Phaser.Math.Linear(this.sprite.x, this.targetX, 1 - Math.pow(0.004, dt));
        this.sprite.y = Phaser.Math.Linear(
          this.sprite.y,
          this.targetY + Math.sin(this.bob * 2) * 10,
          1 - Math.pow(0.004, dt),
        );
        // la fenetre de degat s'ouvre au milieu de l'animation
        if (this.stateTime > 260 && this.stateTime < 620) {
          this.tryStrike(
            this.state === "bite" ? 175 : 210,
            this.state === "bite" ? 110 : 135,
            this.state === "bite" ? 18 : 13,
          );
        }
        if (this.stateTime > 900) this.setState("recover");
        break;
      }

      case "recover": {
        this.sprite.setAngle(0);
        this.sprite.play(ANIM_MOUNT_FLY, true);
        this.sprite.y = Phaser.Math.Linear(this.sprite.y, HIGH_Y, 1 - Math.pow(0.01, dt));
        this.sprite.x = Phaser.Math.Linear(this.sprite.x, player.x + 300, 1 - Math.pow(0.3, dt));
        this.sprite.setFlipX(player.x < this.sprite.x);
        if (this.stateTime > (this.enraged ? 450 : 800)) this.setState("hover");
        break;
      }

      default:
        break;
    }

    // elle reste dans la salle
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 120, this.opts.roomWidth - 120);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, 120, this.opts.floorY - 90);
  }

  destroy() {
    this.destroyed = true;
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.destroy();
    this.gore.destroy();
  }
}
