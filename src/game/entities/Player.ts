import Phaser from "phaser";

import { HERO_BASELINE_Y, HERO_CHAR_H, HERO_FRAME_H } from "@/game/assets";
import {
  COMBO_WINDOW,
  DODGE,
  HEAVY_CHARGE_MS,
  PARRY,
  SPECIAL_COST,
  STRIKES,
  type Strike,
} from "@/game/combat";
import { ActionInput } from "@/game/input";
import { ABSORB_COST, ABSORB_DURATION, useGameStore } from "@/store/gameStore";

const SPEED = 190;
const JUMP = 520;
const ATTACK_COOLDOWN = 240;
const INVULN_MS = 750;

/**
 * Les feuilles du Vigile ont ete regenerees sur un gabarit unique : meme
 * cellule 192x144, silhouette de 110 px et ligne de pieds a y=138 sur toutes
 * les frames. L'echelle et l'origine sont donc constantes.
 */

/** hauteur affichee constante, en pixels monde */
const TARGET_H = 130;

const SCALE = TARGET_H / HERO_CHAR_H;
const ORIGIN_Y = HERO_BASELINE_Y / HERO_FRAME_H;

/** hitbox constante, en pixels monde */
const BODY_W = 58;
const BODY_H = 120;

export type PlayerState =
  | "idle"
  | "run"
  | "air"
  | "attack"
  | "heavy"
  | "dive"
  | "dodge"
  | "parry"
  | "absorb"
  | "special";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private actions = new ActionInput();

  private moveState: PlayerState = "idle";
  /** fin de l'etat verrouille (attaque, esquive, parade...) */
  private stateUntil = 0;
  private comboStep = 0;
  private comboExpiresAt = 0;
  private lastAttackAt = -Infinity;
  private dodgeReadyAt = 0;
  private invulnUntil = 0;
  private parryUntil = 0;
  private charging = false;
  private facing = 1;
  private airJumpsUsed = 0;
  private diveStrikeDone = false;
  /** aucun ennemi proche : l'absorption de chair est possible */
  private canAbsorb = false;
  /** flexion d'elan avant decollage */
  private crouchUntil = 0;
  private pendingJump = 0;
  private wasOnGround = true;
  /** fin de l'animation de reception */
  private landUntil = 0;




  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "vigile-idle");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);
    this.alignBody();

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.play("vigile-idle-anim");
  }

  /** Echelle et origine fixes (gabarit normalise), hitbox constante. */
  private alignBody() {
    this.setScale(SCALE * this.poseX, SCALE * this.poseY);
    this.setOrigin(0.5, ORIGIN_Y);

    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    const bodyW = BODY_W / SCALE;
    const bodyH = BODY_H / SCALE;
    body.setSize(bodyW, bodyH, false);
    body.setOffset((this.width - bodyW) / 2, HERO_BASELINE_Y - bodyH);
  }

  /** Deformation (flexion / etirement) pendant le saut et la reception. */
  private setPose(sx: number, sy: number, duration = 90) {
    this.poseTween?.remove();
    this.poseTween = this.scene.tweens.add({
      targets: this,
      poseX: sx,
      poseY: sy,
      duration,
      ease: "Quad.easeOut",
    });
  }

  /** Retour progressif au gabarit neutre. */
  private relaxPose(delta = 1) {
    if (this.poseTween?.isPlaying()) return;
    const k = Math.min(1, delta * 0.18);
    this.poseX += (1 - this.poseX) * k;
    this.poseY += (1 - this.poseY) * k;
  }


  get facingDirection() {
    return this.facing;
  }

  get isAttacking() {
    return this.moveState === "attack" || this.moveState === "heavy" || this.moveState === "special";
  }

  /** Vrai si la parade est active : le coup est annulé et l'ennemi étourdi. */
  tryParry(time: number) {
    return this.moveState === "parry" && time < this.parryUntil;
  }

  /** La scene indique s'il n'y a aucune creature a proximite. */
  setSafeToAbsorb(safe: boolean) {
    this.canAbsorb = safe;
  }

  receiveDamage(amount: number, time: number) {
    if (time < this.invulnUntil) return;
    this.invulnUntil = time + INVULN_MS;
    useGameStore.getState().damage(amount);
    this.cancelAbsorb();
    this.rumble(0.6, 180);
    this.scene.events.emit("fx-blood", this.x, this.y - 70, -this.facing, 1.6);
    this.scene.cameras.main.flash(110, 90, 0, 8);


    this.setTint(0xff6b6b);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.35,
      duration: 90,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.setAlpha(1);
        this.clearTint();
      },
    });

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(-this.facing * 160, -180);
  }

  /** Vibration si la manette la supporte (Xbox, DualSense, DualShock). */
  rumble(intensity: number, duration: number) {
    const pad = this.scene.input.gamepad?.getPad(0) as
      | (Phaser.Input.Gamepad.Gamepad & {
          vibration?: {
            playEffect?: (type: string, options: Record<string, number>) => void;
          };
        })
      | undefined;
    try {
      pad?.vibration?.playEffect?.("dual-rumble", {
        duration,
        strongMagnitude: intensity,
        weakMagnitude: intensity * 0.6,
      });
    } catch {
      /* la manette ne supporte pas la vibration */
    }
  }

  private emitStrike(strike: Strike, damageScale = 1) {
    this.scene.events.emit("player-strike", strike, damageScale);
  }

  private beginState(state: PlayerState, time: number, duration: number) {
    this.moveState = state;
    this.stateUntil = time + duration;
  }

  /** Interrompt l'absorption de chair en cours. */
  private cancelAbsorb() {
    if (this.moveState !== "absorb") return;
    this.moveState = "idle";
    this.clearTint();
    useGameStore.getState().setAbsorb(false, 0);
  }


  tick(time: number) {
    this.alignBody();
    const store = useGameStore.getState();
    const effects = store.effects;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    const pad = this.scene.input.gamepad?.getPad(0) ?? undefined;

    this.actions.update(pad, time);

    if (onGround) this.airJumpsUsed = 0;

    const speed = SPEED * effects.speedMult;
    const jumpPower = JUMP * effects.jumpMult;
    const cooldown = ATTACK_COOLDOWN * effects.attackCooldownMult;

    const left = this.actions.isDown("left") || !!this.cursors.left?.isDown;
    const right = this.actions.isDown("right") || !!this.cursors.right?.isDown;
    const jump =
      this.actions.justDown("jump") ||
      (this.cursors.up ? Phaser.Input.Keyboard.JustDown(this.cursors.up) : false);
    const downHeld = !!this.cursors.down?.isDown || (pad?.axes[1]?.getValue() ?? 0) > 0.5;

    // ---------- etats verrouilles ----------
    if (this.moveState === "dodge") {
      if (time >= this.stateUntil) {
        this.moveState = "idle";
        this.clearTint();
        this.setAlpha(1);
      } else {
        return;
      }
    }

    if (this.moveState === "dive") {
      if (!this.diveStrikeDone && onGround) {
        this.diveStrikeDone = true;
        this.emitStrike(STRIKES.dive);
        this.rumble(0.5, 150);
        this.scene.cameras.main.shake(120, 0.008);
        this.beginState("dive", time, STRIKES.dive.duration);
      }
      if (this.diveStrikeDone && time >= this.stateUntil) {
        this.moveState = "idle";
      } else {
        if (onGround) body.setVelocityX(0);
        return;
      }
    }

    if (this.moveState === "parry") {
      if (time >= this.stateUntil) {
        this.moveState = "idle";
        this.clearTint();
      } else {
        if (onGround) body.setVelocityX(0);
        return;
      }
    }

    // ---------- absorption de chair (soin) ----------
    if (this.moveState === "absorb") {
      const holding = this.actions.isDown("parry");
      if (!holding || !onGround || left || right) {
        this.cancelAbsorb();
      } else if (time >= this.stateUntil) {
        useGameStore.getState().consumeFleshForHealth();
        this.moveState = "idle";
        this.clearTint();
        this.scene.events.emit("fx-heal", this.x, this.y - 70);
        this.rumble(0.35, 200);
      } else {
        body.setVelocityX(0);
        const progress = 1 - (this.stateUntil - time) / ABSORB_DURATION;
        useGameStore.getState().setAbsorb(true, Phaser.Math.Clamp(progress, 0, 1));
        this.play("vigile-idle-anim", true);
        return;
      }
    }


    if (this.moveState === "attack" || this.moveState === "heavy" || this.moveState === "special") {
      if (time >= this.stateUntil) {
        this.moveState = "idle";
        this.clearTint();
        this.setScale(SCALE);
      } else {
        if (onGround) body.setVelocityX(0);
        return;
      }
    }

    // ---------- esquive ----------
    if (this.actions.justDown("dodge") && time >= this.dodgeReadyAt) {
      const distance = DODGE.distance * effects.dodgeDistanceMult;
      this.dodgeReadyAt = time + DODGE.cooldown;
      useGameStore.getState().setDodgeCooldown(DODGE.cooldown);
      this.invulnUntil = time + DODGE.invuln;
      this.beginState("dodge", time, DODGE.duration);
      const dir = left ? -1 : right ? 1 : this.facing;
      this.facing = dir;
      this.setFlipX(dir < 0);
      body.setVelocityX(dir * (distance / (DODGE.duration / 1000)));
      this.setTint(0x8ea9c9);
      this.setAlpha(0.6);
      this.play("vigile-walk-anim", true);
      return;
    }

    // ---------- parade / absorption de chair ----------
    if (this.actions.justDown("parry") && onGround) {
      const canHeal =
        this.canAbsorb && store.flesh >= ABSORB_COST && store.health < store.maxHealth;

      if (canHeal && !left && !right) {
        this.beginState("absorb", time, ABSORB_DURATION);
        body.setVelocityX(0);
        this.setTint(0xff6b7d);
        useGameStore.getState().setAbsorb(true, 0);
        this.play("vigile-idle-anim", true);
        return;
      }

      this.parryUntil = time + PARRY.window + effects.parryWindowBonus;
      this.beginState("parry", time, PARRY.window + effects.parryWindowBonus + PARRY.recovery);
      body.setVelocityX(0);
      this.setTint(0xf2d9a0);
      this.play("vigile-idle-anim", true);
      return;
    }


    // ---------- rugissement de chair ----------
    if (this.actions.justDown("special")) {
      const cost = Math.round(SPECIAL_COST * effects.specialCostMult);
      if (useGameStore.getState().spendFlesh(cost)) {
        this.beginState("special", time, STRIKES.special.duration);
        body.setVelocityX(0);
        this.play("vigile-attack-anim", true);
        this.setTint(0xff4d5e);
        this.spawnWave(effects.specialRadiusBonus);
        this.emitStrike({
          ...STRIKES.special,
          reach: STRIKES.special.reach + effects.specialRadiusBonus,
        });
        this.rumble(0.9, 300);
        this.scene.cameras.main.shake(220, 0.012);
        return;
      }
    }

    // ---------- attaque aerienne piquee ----------
    if (!onGround && this.actions.justDown("attack") && downHeld) {
      this.diveStrikeDone = false;
      this.beginState("dive", time, 2000);
      body.setVelocityX(0);
      body.setVelocityY(900);
      this.play("vigile-attack-anim", true);
      this.setTint(0xffc9a0);
      return;
    }

    // ---------- coup lourd (relachement apres charge) ----------
    if (this.actions.isDown("attack")) this.charging = true;

    const releasedHeld = this.actions.justUp("attack") ? this.actions.releasedHeldMs("attack") : 0;
    if (this.actions.justUp("attack")) this.charging = false;

    if (releasedHeld >= HEAVY_CHARGE_MS && time - this.lastAttackAt >= cooldown) {
      this.lastAttackAt = time;
      this.comboStep = 0;
      this.beginState("heavy", time, STRIKES.heavy.duration);
      body.setVelocityX(this.facing * 60);
      this.play("vigile-attack-anim", true);
      this.setTint(0xff8a5c);
      this.emitStrike(STRIKES.heavy);
      this.rumble(0.8, 220);
      this.scene.cameras.main.shake(140, 0.009);
      return;
    }

    // ---------- combo 3 coups (relachement court) ----------
    const lightAttack = releasedHeld > 0 && releasedHeld < HEAVY_CHARGE_MS;
    if (lightAttack && time - this.lastAttackAt >= cooldown) {
      this.lastAttackAt = time;
      this.comboStep = time <= this.comboExpiresAt ? Math.min(this.comboStep + 1, 2) : 0;
      const strike = [STRIKES.combo1, STRIKES.combo2, STRIKES.combo3][this.comboStep];
      this.comboExpiresAt = time + strike.duration + COMBO_WINDOW;
      this.beginState("attack", time, strike.duration);
      body.setVelocityX(this.facing * (this.comboStep === 2 ? 90 : 30));
      this.play("vigile-attack-anim", true);
      if (this.comboStep === 2) {
        this.setTint(0xffb36b);
        this.rumble(0.5, 160);
        this.scene.cameras.main.shake(110, 0.006);
      }
      this.emitStrike(strike);
      return;
    }

    if (time > this.comboExpiresAt) this.comboStep = 0;

    // ---------- deplacement ----------
    if (left) {
      body.setVelocityX(-speed);
      this.facing = -1;
      this.setFlipX(true);
    } else if (right) {
      body.setVelocityX(speed);
      this.facing = 1;
      this.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    // ---------- saut : flexion d'elan puis detente ----------
    const CROUCH_MS = 90;
    const LAND_MS = 130;

    if (jump) {
      if (onGround) {
        // le heros plie les jambes avant de decoller
        this.crouchUntil = time + CROUCH_MS;
        this.pendingJump = jumpPower;
        this.landUntil = 0;
        this.play("vigile-crouch", true);
      } else if (effects.doubleJump && this.airJumpsUsed < 1) {
        this.airJumpsUsed += 1;
        body.setVelocityY(-jumpPower * 0.9);
        this.play("vigile-crouch", true);
      }
    }

    if (this.pendingJump > 0) {
      // pendant l'elan : le heros reste plante au sol
      body.setVelocityX(body.velocity.x * 0.35);
      if (time >= this.crouchUntil) {
        body.setVelocityY(-this.pendingJump);
        this.pendingJump = 0;
      }
    }

    // reception : les jambes amortissent
    if (onGround && !this.wasOnGround) {
      this.landUntil = time + LAND_MS;
      this.play("vigile-land", true);
    }
    this.wasOnGround = onGround;

    if (!onGround) {
      this.moveState = "air";
      const vy = body.velocity.y;
      if (this.anims.currentAnim?.key === "vigile-crouch" && this.anims.isPlaying) {
        // laisse la detente se terminer
      } else if (vy < -120) {
        this.play("vigile-rise", true);
      } else if (vy < 120) {
        this.play("vigile-apex", true);
      } else {
        this.play("vigile-fall", true);
      }
    } else if (this.pendingJump > 0) {
      this.moveState = "idle";
    } else if (time < this.landUntil) {
      this.moveState = "idle";
    } else if (left || right) {
      this.moveState = "run";
      this.play("vigile-walk-anim", true);
    } else {
      this.moveState = "idle";
      this.play("vigile-idle-anim", true);
    }


  }

  /** Onde sanglante du Rugissement. */
  private spawnWave(bonusRadius: number) {
    const radius = STRIKES.special.reach + bonusRadius;
    const wave = this.scene.add.circle(this.x, this.y - 60, 20, 0xb01f2b, 0.35);
    wave.setStrokeStyle(3, 0xff5566, 0.9);
    wave.setDepth(5);
    this.scene.tweens.add({
      targets: wave,
      radius,
      scale: radius / 20,
      alpha: 0,
      duration: 420,
      onComplete: () => wave.destroy(),
    });
  }
}
