import Phaser from "phaser";

import { frameMetrics } from "@/game/spriteMetrics";
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
  /** garde : seuls les coups brise-garde passent en plein */
  guarded?: boolean;
};

/** Temps d'anticipation avant que le coup ne parte : laisse esquiver ou parer. */
const TELEGRAPH_MS = 350;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  protected stats: EnemyStats;
  protected health: number;
  protected direction = -1;
  protected lastAttackAt = -Infinity;
  protected attacking = false;
  protected dying = false;
  protected patrolOrigin: number;
  protected stunnedUntil = 0;
  protected guardBrokenUntil = 0;

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

  /** hurtbox reelle de la creature (centre + demi-dimensions) */
  get hurtbox() {
    return {
      cx: this.x,
      cy: this.y - this.stats.bodyHeight / 2,
      halfW: this.stats.bodyWidth / 2,
      halfH: this.stats.bodyHeight / 2,
    };
  }

  /** hauteur de la zone faible (tete / haut du torse) : critique garanti */
  get weakPointY() {
    return this.y - this.stats.bodyHeight * 0.82;
  }

  takeHit(
    amount: number,
    options: {
      knockback?: number;
      breakGuard?: boolean;
      fromX?: number;
      crit?: boolean;
    } = {},
  ) {
    if (this.dying) return;

    const time = this.scene.time.now;
    const guarding =
      !!this.stats.guarded && !options.breakGuard && time > this.guardBrokenUntil;

    const dealt = guarding ? amount * 0.25 : amount;
    this.health -= dealt;

    if (options.breakGuard) this.guardBrokenUntil = time + 1500;

    const dir = options.fromX !== undefined ? Math.sign(this.x - options.fromX) || 1 : 1;
    const crit = !!options.crit && !guarding;

    // chiffre flottant : dore et agrandi sur critique, grise sur garde
    this.scene.events.emit(
      "fx-damage",
      this.x,
      this.y - this.stats.bodyHeight * 0.95,
      dealt,
      guarding ? "blocked" : crit ? "crit" : "normal",
    );

    if (guarding) {
      this.scene.events.emit("fx-sparks", this.x + dir * 20, this.y - 60);
    } else {
      // gerbe proportionnelle aux degats encaisses, renforcee sur critique
      this.scene.events.emit(
        "fx-blood",
        this.x + dir * 14,
        this.y - this.stats.bodyHeight * 0.55,
        dir,
        Phaser.Math.Clamp((crit ? 1.4 : 0.7) + dealt / 22, 0.7, 3),
      );
      if (crit) {
        this.scene.cameras.main.shake(120, 0.008);
        this.scene.events.emit("fx-sparks", this.x + dir * 16, this.weakPointY);
      }
    }

    this.setTint(guarding ? 0x9aa7b5 : crit ? 0xffd166 : 0xd94b4b);
    this.scene.time.delayedCall(crit ? 130 : 90, () => {
      if (this.active && !this.dying) this.clearTint();
    });

    const knockback =
      (options.knockback ?? 0) * (guarding ? 0.25 : 1) * (crit ? 1.35 : 1);
    if (knockback > 0 && this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(dir * knockback);
      body.setVelocityY(-Math.min(220, knockback * 0.5));
    }

    if (this.health <= 0) {
      this.die(Phaser.Math.Clamp(dealt / 20, 0.8, 2.2));
    }
  }


  /** Etourdissement (parade réussie) : l'ennemi reste ouvert. */
  stun(durationMs: number) {
    if (this.dying) return;
    this.stunnedUntil = this.scene.time.now + durationMs;
    this.attacking = false;
    this.setTint(0x6fa8dc);
    this.scene.time.delayedCall(durationMs, () => {
      if (this.active && !this.dying) this.clearTint();
    });
  }


  protected die(intensity = 1) {
    this.dying = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;

    useGameStore.getState().registerKill();

    const cx = this.x;
    const cy = this.y - this.stats.bodyHeight * 0.5;

    // giclee massive + morceaux de chair
    this.scene.events.emit("fx-gore", cx, cy, intensity);
    // butin : orbes de chair et, parfois, une fiole de sang
    this.scene.events.emit("enemy-died", cx, cy, this.stats.fleshReward, this.stats.guarded);

    this.scene.cameras.main.shake(140, 0.006 * intensity);

    // le corps s'affaisse, se vide de son sang, puis disparait
    this.setTint(0x6a0d18);
    this.scene.tweens.add({
      targets: this,
      scaleY: this.scaleY * 0.82,
      scaleX: this.scaleX * 1.08,
      angle: this.direction * 82,
      y: this.y + 10,
      ease: "Quad.easeIn",
      duration: 300,
      onComplete: () => {
        this.scene?.tweens.add({
          targets: this,
          alpha: 0,
          duration: 520,
          delay: 320,
          onComplete: () => this.destroy(),
        });
      },
    });
  }

  think(playerX: number, playerY: number, time: number) {
    if (this.dying || !this.body) return;
    this.alignBody();
    const body = this.body as Phaser.Physics.Arcade.Body;

    const dx = playerX - this.x;
    const distance = Math.abs(dx);
    const sameLevel = Math.abs(playerY - this.y) < 140;

    if (time < this.stunnedUntil) {
      body.setVelocityX(0);
      this.play(`${this.stats.animPrefix}-idle-anim`, true);
      return;
    }

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

        // anticipation lisible : la creature se teinte avant de frapper
        this.setTint(0xffcf6b);
        this.play(`${this.stats.animPrefix}-idle-anim`, true);

        this.scene.time.delayedCall(TELEGRAPH_MS, () => {
          if (!this.active || this.dying) return;
          if (this.scene.time.now < this.stunnedUntil) {
            this.attacking = false;
            return;
          }
          this.clearTint();
          this.play(`${this.stats.animPrefix}-attack-anim`, true);
          this.scene.time.delayedCall(180, () => {
            if (!this.active || this.dying) return;
            if (this.scene.time.now < this.stunnedUntil) return;
            this.scene.events.emit("enemy-strike", this.stats.damage, this);
          });
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
      health: 72,
      speed: 28,
      chaseSpeed: 52,
      damage: 16,
      detectRange: 320,
      attackRange: 90,
      attackCooldown: 1700,
      // silhouette de 118 px dans la cellule -> ~150 px a l'ecran
      scale: 1.27,
      // masse large : hurtbox elargie pour coller au torse et a la chaine
      bodyWidth: 68,
      bodyHeight: 122,
      fleshReward: 14,
      animPrefix: "penitent",
      guarded: true,
    });
  }
}

export class SuppliantRampant extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      health: 30,
      speed: 70,
      chaseSpeed: 170,
      damage: 6,
      detectRange: 420,
      attackRange: 62,
      attackCooldown: 800,
      // creature rampante : silhouette de 62 px -> ~70 px a l'ecran
      scale: 1.13,
      // quadrupede : boite basse et allongee, plus haute que large
      bodyWidth: 80,
      bodyHeight: 46,
      fleshReward: 6,
      animPrefix: "suppliant",
    });

  }
}

/**
 * Ecorche-Pendu : suspendu au plafond par ses veines, il se decroche quand le
 * heros passe dessous, s'ecrase au sol puis attaque avec une onde de sang.
 * A la mort, il explose en gerbe.
 */
type EcorcheState = "hanging" | "falling" | "landing" | "active";

export class EcorchePendu extends Enemy {
  private phase: EcorcheState = "hanging";
  private readonly floorY: number;
  private readonly triggerRange: number;
  /** condition externe : la chute n'a lieu que si le heros est seul */
  public dropGate: (() => boolean) | null = null;

  constructor(scene: Phaser.Scene, x: number, floorY: number, ceilingY = 40) {
    super(scene, x, ceilingY, {
      health: 52,
      speed: 34,
      chaseSpeed: 118,
      damage: 12,
      detectRange: 420,
      attackRange: 120,
      attackCooldown: 1900,
      scale: 1.2,
      bodyWidth: 58,
      bodyHeight: 120,
      fleshReward: 12,
      animPrefix: "ecorche",
    });


    this.floorY = floorY;
    this.triggerRange = 200;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(0, 0);

    this.setTexture("ecorche-hang");
    this.play("ecorche-hang-anim", true);
  }

  /** suspendu, le corps pend vers le bas : la hurtbox suit la silhouette */
  get hurtbox() {
    const base = super.hurtbox;
    if (this.phase !== "hanging") return base;
    return { ...base, cy: this.y + base.halfH };
  }

  get weakPointY() {
    return this.phase === "hanging" ? this.y + 100 : super.weakPointY;
  }

  /** le frapper au plafond le decroche immediatement */
  takeHit(
    amount: number,
    options: { knockback?: number; breakGuard?: boolean; fromX?: number; crit?: boolean } = {},
  ) {
    if (this.phase === "hanging" && !this.isDead) this.drop();
    super.takeHit(amount, options);
  }


    this.phase = "falling";
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setVelocityY(120);
    this.setTexture("ecorche-fall");
    this.play("ecorche-fall-anim", true);
    this.scene.events.emit("fx-blood", this.x, this.y - 40, 1, 0.9);
  }

  private land() {
    this.phase = "landing";
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    this.setTexture("ecorche-land");
    this.play("ecorche-land-anim", true);
    this.scene.cameras.main.shake(180, 0.008);
    this.scene.events.emit("fx-gore", this.x, this.y - 20, 1.3);
    this.once(
      Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + "ecorche-land-anim",
      () => {
        if (!this.active || this.isDead) return;
        this.phase = "active";
        this.setTexture("ecorche-idle");
        this.play("ecorche-idle-anim", true);
      },
    );
  }

  /** onde de sang circulaire projetee au sol */
  private bloodWave() {
    const wave = this.scene.add.circle(this.x, this.floorY - 8, 20, 0x7a1220, 0.42);
    wave.setStrokeStyle(6, 0xa81e2c, 0.85);
    wave.setDepth(6);
    this.scene.tweens.add({
      targets: wave,
      radius: 150,
      alpha: 0,
      duration: 420,
      ease: "Quad.easeOut",
      onComplete: () => wave.destroy(),
    });
    for (let i = 0; i < 5; i += 1) {
      const dir = i % 2 === 0 ? 1 : -1;
      this.scene.events.emit(
        "fx-blood",
        this.x + dir * (20 + i * 22),
        this.floorY - 20,
        dir,
        1.1,
      );
    }
  }

  think(playerX: number, playerY: number, time: number) {
    if (this.isDead || !this.body) return;
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.phase === "hanging") {
      body.setVelocity(0, 0);
      this.setFlipX(playerX < this.x);
      if (Math.abs(playerX - this.x) < this.triggerRange) {
        if (!this.dropGate || this.dropGate()) this.drop();
      }
      return;
    }

    if (this.phase === "falling") {
      if (body.blocked.down || this.y >= this.floorY - 1) this.land();
      return;
    }

    if (this.phase === "landing") {
      body.setVelocityX(0);
      return;
    }

    const wasAttacking = this.anims.currentAnim?.key === "ecorche-attack-anim";
    super.think(playerX, playerY, time);
    const nowAttacking = this.anims.currentAnim?.key === "ecorche-attack-anim";
    if (nowAttacking && !wasAttacking) this.bloodWave();
  }

  protected die(intensity = 1) {
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (body) body.setVelocity(0, 0);
    this.setTexture("ecorche-burst");
    this.play("ecorche-burst-anim", true);
    this.scene.cameras.main.shake(220, 0.012);
    super.die(Math.max(intensity, 1.8));
  }
}

/**
 * Bourreau : liberé par la machine d'ecartellement une fois le supplice
 * acheve. Plus rapide que le Penitent, moins massif, frappe au crochet.
 */
export class Bourreau extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      health: 78,
      speed: 40,
      chaseSpeed: 92,
      damage: 19,
      detectRange: 1000,
      attackRange: 104,
      attackCooldown: 1400,
      scale: 1.7,
      bodyWidth: 64,
      bodyHeight: 150,
      fleshReward: 16,
      animPrefix: "bourreau",
    });
  }
}

