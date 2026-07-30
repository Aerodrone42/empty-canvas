import Phaser from "phaser";

import { ENEMY_BASELINE_Y, ENEMY_FRAME_H } from "@/game/assets";

/** duree de la saisie : le heros reste bloque 3 secondes */
const GRAB_MS = 3000;
/** temps minimum / maximum avant qu'un piege se rearme ailleurs */
const COOLDOWN_MIN_MS = 7000;
const COOLDOWN_MAX_MS = 14000;
/** probabilite qu'un piege arme se declenche vraiment au passage */
const TRIGGER_CHANCE = 0.5;
/** annonce : le sol tremble 1 seconde avant que les mains jaillissent */
const TELL_MS = 1000;
/** cooldown court quand le heros s'echappe pendant l'annonce */
const ABORT_COOLDOWN_MS = 900;

/** decalages, echelles et retards de la grappe de mains */
const CLUSTER = [
  { dx: -34, scale: 0.21, delay: 70, flip: true },
  { dx: -12, scale: 0.26, delay: 0, flip: false },
  { dx: 14, scale: 0.24, delay: 40, flip: true },
  { dx: 36, scale: 0.2, delay: 90, flip: false },
];

/**
 * Mains qui jaillissent du sol : le sol tremble et crache de la terre,
 * puis une grappe de mains agrippe les jambes du heros pendant 3 secondes.
 */
export class GraspingHands {
  private readonly sprites: Phaser.GameObjects.Sprite[] = [];
  private readonly soil: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly scene: Phaser.Scene;
  private x: number;
  private readonly floorY: number;
  /** bornes de la zone dans laquelle le piege se redeploie au hasard */
  private readonly zoneMin: number;
  private readonly zoneMax: number;
  private readonly radius: number;
  private grabUntil = 0;
  private readyAt = 0;
  private tellUntil = 0;
  /** minuterie de l'annonce : gerbes de terre de plus en plus fortes */
  private tellEvent?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    zoneMin: number,
    zoneMax: number,
    floorY: number,
    radius = 90,
  ) {
    this.scene = scene;
    this.zoneMin = zoneMin;
    this.zoneMax = zoneMax;
    this.floorY = floorY;
    this.radius = radius;
    const x = Phaser.Math.Between(zoneMin, zoneMax);
    this.x = x;
    // premier armement decale au hasard : aucun piege ne sort d'entree
    this.readyAt = Phaser.Math.Between(1500, 6000);

    for (const part of CLUSTER) {
      this.sprites.push(
        scene.add
          .sprite(x + part.dx, floorY + 4, "mains-sol", 0)
          .setOrigin(0.5, ENEMY_BASELINE_Y / ENEMY_FRAME_H)
          .setScale(part.scale)
          .setFlipX(part.flip)
          .setDepth(7)
          .setAlpha(0),
      );
    }

    this.ensureSoilTexture();
    this.soil = scene.add
      .particles(x, floorY - 2, "fx-soil", {
        lifespan: { min: 260, max: 520 },
        speed: { min: 40, max: 130 },
        angle: { min: -125, max: -55 },
        gravityY: 620,
        scale: { min: 0.6, max: 1.5 },
        alpha: { start: 0.9, end: 0 },
        tint: [0x4a3526, 0x35251a, 0x5d4230],
        emitting: false,
      })
      .setDepth(6);
  }

  /** deplace le piege au hasard dans sa zone : jamais deux fois au meme endroit */
  private relocate() {
    let next = this.x;
    for (let i = 0; i < 8 && Math.abs(next - this.x) < 220; i++) {
      next = Phaser.Math.Between(this.zoneMin, this.zoneMax);
    }
    this.x = next;
    this.soil.setPosition(next, this.floorY - 2);
    for (const [i, sprite] of this.sprites.entries()) {
      sprite.setPosition(next + CLUSTER[i].dx, this.floorY + 4).setAlpha(0);
    }
  }

  /** delai aleatoire avant le prochain armement */
  private rearm(time: number) {
    this.readyAt = time + Phaser.Math.Between(COOLDOWN_MIN_MS, COOLDOWN_MAX_MS);
    this.relocate();
  }

  /** petits fragments de terre generes une seule fois */
  private ensureSoilTexture() {
    if (this.scene.textures.exists("fx-soil")) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture("fx-soil", 4, 4);
    g.destroy();
  }

  /** phase d'annonce : monticule qui vibre + gerbe de terre montante */
  private startTell(time: number) {
    this.tellUntil = time + TELL_MS;
    this.soil.explode(4, this.x, this.floorY - 2);

    // la terre bouge de plus en plus fort pendant la seconde d'annonce
    let step = 0;
    this.tellEvent?.remove();
    this.tellEvent = this.scene.time.addEvent({
      delay: 110,
      repeat: Math.floor(TELL_MS / 110) - 1,
      callback: () => {
        step += 1;
        const ratio = Math.min(1, (step * 110) / TELL_MS);
        const spread = 30 + ratio * 30;
        this.soil.explode(
          2 + Math.round(ratio * 8),
          this.x + Phaser.Math.Between(-spread, spread),
          this.floorY - 2,
        );
      },
    });

    for (const [i, sprite] of this.sprites.entries()) {
      const base = this.x + CLUSTER[i].dx;
      sprite.setFrame(0).setAlpha(0.3).setPosition(base, this.floorY + 4);
      this.scene.tweens.add({
        targets: sprite,
        x: { from: base - 3, to: base + 3 },
        y: { from: this.floorY + 6, to: this.floorY + 2 },
        alpha: { from: 0.3, to: 0.7 },
        duration: 90,
        yoyo: true,
        repeat: Math.ceil(TELL_MS / 180),
        onComplete: () => sprite.setPosition(base, this.floorY + 4),
      });
    }
  }

  private cancelTell() {
    this.tellUntil = 0;
    this.tellEvent?.remove();
    this.tellEvent = undefined;
    this.readyAt = this.scene.time.now + ABORT_COOLDOWN_MS;
    this.scene.time.delayedCall(ABORT_COOLDOWN_MS, () => this.relocate());
    this.scene.tweens.killTweensOf(this.sprites);
    for (const [i, sprite] of this.sprites.entries()) {
      sprite.setAlpha(0).setPosition(this.x + CLUSTER[i].dx, this.floorY + 4);
    }
  }

  /** sortie effective des mains */
  private burst(time: number) {
    this.tellUntil = 0;
    this.tellEvent?.remove();
    this.tellEvent = undefined;
    this.grabUntil = time + GRAB_MS;
    this.soil.explode(22, this.x, this.floorY - 4);
    this.scene.tweens.killTweensOf(this.sprites);

    for (const [i, sprite] of this.sprites.entries()) {
      sprite.setPosition(this.x + CLUSTER[i].dx, this.floorY + 4).setAlpha(1);
      this.scene.time.delayedCall(CLUSTER[i].delay, () => {
        if (sprite.active) sprite.play("mains-sol-anim", true);
      });
    }

    this.scene.events.emit("fx-blood", this.x, this.floorY - 10, 1, 0.6);
  }

  /** @returns true a l'instant precis ou la saisie se declenche */
  update(playerX: number, playerY: number, floorY: number, time: number): boolean {
    const onGround = Math.abs(playerY - floorY) < 90;
    const near = Math.abs(playerX - this.x) < this.radius && onGround;

    // retrait des mains a la fin de la saisie
    if (this.grabUntil > 0 && time >= this.grabUntil) {
      this.grabUntil = 0;
      for (const [i, sprite] of this.sprites.entries()) {
        this.scene.time.delayedCall(CLUSTER[i].delay, () => {
          if (sprite.active) sprite.playReverse("mains-sol-anim", true);
        });
        this.scene.time.delayedCall(360 + CLUSTER[i].delay, () => sprite.setAlpha(0));
      }
      this.scene.time.delayedCall(700, () => this.rearm(this.scene.time.now));
    }

    if (this.grabUntil > 0) return false;

    // annonce en cours
    if (this.tellUntil > 0) {
      if (!near) {
        this.cancelTell();
        return false;
      }
      if (time >= this.tellUntil) {
        this.burst(time);
        return true;
      }
      return false;
    }

    if (near && time >= this.readyAt) {
      // une fois sur deux le piege reste dormant et repart ailleurs
      if (Math.random() < TRIGGER_CHANCE) this.startTell(time);
      else this.rearm(time);
    }

    return false;
  }

  destroy() {
    this.tellEvent?.remove();
    this.scene.tweens.killTweensOf(this.sprites);
    for (const sprite of this.sprites) sprite.destroy();
    this.soil.destroy();
  }
}
