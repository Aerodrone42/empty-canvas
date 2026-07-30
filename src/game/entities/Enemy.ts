import Phaser from "phaser";

import { useGameStore } from "@/store/gameStore";

export type EnemyStats = {
  health: number;
  speed: number;
  chaseSpeed: number;
  damage: number;
  detectRange: number;
  attackRange: number;
  attackCooldown: number;
  scale: number;
  bodyWidth: number;
  bodyHeight: number;
  fleshReward: number;
  animPrefix: string;
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  protected stats: EnemyStats;
  protected health: number;
  protected direction = -1;
  protected lastAttackAt = -Infinity;
  protected attacking = false;
  protected dying = false;
  protected patrolOrigin: number;

  constructor(scene: Phaser.Scene, x: number, y: number, stats: EnemyStats) {
    super(scene, x, y, `${stats.animPrefix}-idle`);
    this.stats = stats;
    this.health = stats.health;
    this.patrolOrigin = x;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(stats.scale);
    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);

    this.alignBody();

    this.play(`${stats.animPrefix}-idle-anim`);

    this.on(
      Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + `${stats.animPrefix}-attack-anim`,
      () => {
        this.attacking = false;
      },
    );
  }

  /**
   * Les frames d'une meme creature n'ont ni la meme largeur ni la meme ligne
   * de pieds : on mesure la silhouette et on la cale sur le sol.
   */
  protected alignBody() {
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    const index = Math.max((this.anims.currentFrame?.index ?? 1) - 1, 0);
    const metrics = frameMetrics(this.scene, this.texture.key, index);
    const footY = metrics ? metrics.footY : this.height;

    this.setOrigin(0.5, footY / this.height);
    body.setSize(this.stats.bodyWidth, this.stats.bodyHeight, false);
    body.setOffset(
      (this.width - this.stats.bodyWidth) / 2,
      footY - this.stats.bodyHeight,
    );
  }


  get isDead() {
    return this.dying;
  }


  takeHit(amount: number) {
    if (this.dying) return;
    this.health -= amount;
    this.setTint(0xd94b4b);
    this.scene.time.delayedCall(90, () => this.clearTint());

    if (this.health <= 0) {
      this.die();
    }
  }

  protected die() {
    this.dying = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;

    useGameStore.getState().registerKill();
    useGameStore.getState().gainFlesh(this.stats.fleshReward);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      angle: this.direction * 25,
      y: this.y + 8,
      duration: 420,
      onComplete: () => this.destroy(),
    });
  }

  think(playerX: number, playerY: number, time: number) {
    if (this.dying || !this.body) return;
    this.alignBody();
    const body = this.body as Phaser.Physics.Arcade.Body;

    const dx = playerX - this.x;
    const distance = Math.abs(dx);
    const sameLevel = Math.abs(playerY - this.y) < 140;

    if (this.attacking) {
      body.setVelocityX(0);
      return;
    }

    if (sameLevel && distance <= this.stats.attackRange) {
      this.direction = dx >= 0 ? 1 : -1;
      this.setFlipX(this.direction < 0);
      body.setVelocityX(0);

      if (time - this.lastAttackAt >= this.stats.attackCooldown) {
        this.lastAttackAt = time;
        this.attacking = true;
        this.play(`${this.stats.animPrefix}-attack-anim`, true);
        this.scene.time.delayedCall(180, () => {
          if (!this.active || this.dying) return;
          const stillClose = Math.abs(playerX - this.x) <= this.stats.attackRange + 20;
          if (stillClose) {
            this.scene.events.emit("enemy-strike", this.stats.damage);
          }
        });
      }
      return;
    }

    if (sameLevel && distance <= this.stats.detectRange) {
      this.direction = dx >= 0 ? 1 : -1;
      body.setVelocityX(this.direction * this.stats.chaseSpeed);
    } else {
      if (Math.abs(this.x - this.patrolOrigin) > 160) {
        this.direction = this.x > this.patrolOrigin ? -1 : 1;
      }
      if (body.blocked.left) this.direction = 1;
      if (body.blocked.right) this.direction = -1;
      body.setVelocityX(this.direction * this.stats.speed);
    }

    this.setFlipX(this.direction < 0);
    this.play(`${this.stats.animPrefix}-walk-anim`, true);
  }
}

export class PenitentGreffe extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      health: 60,
      speed: 28,
      chaseSpeed: 52,
      damage: 18,
      detectRange: 320,
      attackRange: 90,
      attackCooldown: 1700,
      scale: 1.15,
      bodyWidth: 60,
      bodyHeight: 128,
      fleshReward: 14,
      animPrefix: "penitent",
    });
  }
}

export class SuppliantRampant extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      health: 24,
      speed: 70,
      chaseSpeed: 170,
      damage: 7,
      detectRange: 420,
      attackRange: 62,
      attackCooldown: 800,
      scale: 0.5,
      bodyWidth: 150,
      bodyHeight: 128,
      fleshReward: 6,
      animPrefix: "suppliant",
    });
  }
}
