import Phaser from "phaser";

import { PARRY, type Strike } from "../combat";
import { BloodFX } from "../effects/Blood";
import { Lighting } from "../effects/Lighting";
import { Parallax } from "../effects/Parallax";
import { Enemy, PenitentGreffe, SuppliantRampant } from "../entities/Enemy";
import { Pickup } from "../entities/Pickup";
import { Player } from "../entities/Player";
import type { BackdropKey } from "@/game/assets";
import { useGameStore } from "@/store/gameStore";

const ROOM_WIDTH = 2400;
const ROOM_HEIGHT = 900;
/** la ligne de sol est calee tout en bas du viewport : plus de bande vide */
const FLOOR_Y = 880;
/** soin par seconde en se reposant dans une flaque de sang */
const POOL_REGEN_PER_SEC = 6;
/** distance en dessous de laquelle une creature empeche de se soigner */
const SAFE_RADIUS = 300;

/** plateforme-ascenseur en bout de salle */
const LIFT_W = 220;
const LIFT_H = 26;
const LIFT_X = ROOM_WIDTH - 190;
const LIFT_TRAVEL = 300;
const LIFT_SPEED = 90;
const LIFT_RETURN_SPEED = 60;

/** enchainement des salles : l'ascenseur mene a la suivante */
const ROOM_ORDER: BackdropKey[] = ["cathedrale", "corridor", "throne", "exterieur"];


export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private blood!: BloodFX;
  private parallax!: Parallax;
  private lighting!: Lighting;
  private pickups: Pickup[] = [];
  /** salle courante : determine le decor et la palette */
  private backdropKey: BackdropKey = "cathedrale";

  /** plateforme-ascenseur de fin de salle */
  private lift!: Phaser.GameObjects.Rectangle;
  private liftEdge!: Phaser.GameObjects.Rectangle;
  private liftGlow!: Phaser.GameObjects.Rectangle;
  private liftBaseY = FLOOR_Y - 40;
  private liftTopY = FLOOR_Y - 40 - LIFT_TRAVEL;
  private exiting = false;


  constructor() {
    super("game");
  }

  init(data?: { backdrop?: BackdropKey }) {
    this.backdropKey = data?.backdrop ?? "cathedrale";
  }

  create() {
    this.enemies = [];
    this.pickups = [];
    this.exiting = false;
    this.physics.world.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBackgroundColor(0x14090b);
    this.cameras.main.fadeIn(500, 0, 0, 0);


    this.blood = new BloodFX(this, FLOOR_Y);

    this.buildBackdrop();
    this.buildGeometry();
    this.buildLift();

    this.player = new Player(this, 180, FLOOR_Y);
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.lift);


    this.spawn(new SuppliantRampant(this, 760, FLOOR_Y));
    this.spawn(new PenitentGreffe(this, 1180, FLOOR_Y));
    this.spawn(new SuppliantRampant(this, 1600, FLOOR_Y));
    this.spawn(new PenitentGreffe(this, 2060, FLOOR_Y));

    // suivi horizontal uniquement : au saut, l'image ne doit pas bouger
    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.12, 0, 0, 0);
    cam.setScroll(cam.scrollX, ROOM_HEIGHT - cam.height);

    this.events.on("player-strike", this.resolvePlayerStrike, this);
    this.events.on("enemy-strike", this.resolveEnemyStrike, this);
    this.events.on("fx-blood", this.onBlood, this);
    this.events.on("fx-gore", this.onGore, this);
    this.events.on("fx-sparks", this.onSparks, this);
    this.events.on("fx-heal", this.onHeal, this);
    this.events.on("enemy-died", this.onEnemyDied, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off("player-strike", this.resolvePlayerStrike, this);
      this.events.off("enemy-strike", this.resolveEnemyStrike, this);
      this.events.off("fx-blood", this.onBlood, this);
      this.events.off("fx-gore", this.onGore, this);
      this.events.off("fx-sparks", this.onSparks, this);
      this.events.off("fx-heal", this.onHeal, this);
      this.events.off("enemy-died", this.onEnemyDied, this);
    });
  }

  private spawn(enemy: Enemy) {
    this.physics.add.collider(enemy, this.platforms);
    this.enemies.push(enemy);
  }

  private onBlood(x: number, y: number, dir: number, intensity: number) {
    this.blood.splatter(x, y, dir, intensity);
  }

  private onGore(x: number, y: number, intensity: number) {
    this.blood.gore(x, y, intensity);
  }

  private onSparks(x: number, y: number) {
    this.blood.sparks(x, y);
  }

  /** Halo de soin lors d'une absorption reussie. */
  private onHeal(x: number, y: number) {
    const ring = this.add.circle(x, y, 18, 0xff6b7d, 0.25);
    ring.setStrokeStyle(3, 0xffb3bd, 0.9);
    ring.setDepth(8);
    this.tweens.add({
      targets: ring,
      scale: 3,
      alpha: 0,
      duration: 420,
      onComplete: () => ring.destroy(),
    });
  }

  /** Butin : orbes de chair, et parfois une fiole de sang. */
  private onEnemyDied(x: number, y: number, fleshReward: number, elite?: boolean) {
    const orbs = Phaser.Math.Between(2, 4);
    const per = Math.max(1, Math.round(fleshReward / orbs));
    for (let i = 0; i < orbs; i++) {
      this.pickups.push(
        new Pickup(
          this,
          x + Phaser.Math.Between(-40, 40),
          y + Phaser.Math.Between(-20, 20),
          "flesh",
          per,
        ),
      );
    }

    if (elite || Math.random() < 0.3) {
      this.pickups.push(new Pickup(this, x, y - 10, "blood", 12));
    }
  }


  /** Decor en trois calques de parallaxe, selon la salle courante. */
  private buildBackdrop() {
    this.parallax = new Parallax(this, this.backdropKey, FLOOR_Y, ROOM_HEIGHT, ROOM_WIDTH);
    this.lighting = new Lighting(this, ROOM_WIDTH, FLOOR_Y);
  }

  /**
   * Plateforme de pierre en bout de salle : le heros monte dessus et elle
   * s'eleve comme un ascenseur vers la salle suivante.
   */
  private buildLift() {
    const def = this.parallax.def;
    this.liftBaseY = FLOOR_Y - 34;
    this.liftTopY = this.liftBaseY - LIFT_TRAVEL;

    // halo discret : signale que la plateforme est interactive
    this.liftGlow = this.add
      .rectangle(LIFT_X, this.liftBaseY, LIFT_W * 1.1, LIFT_H * 2.4, def.dust, 0.09)
      .setDepth(-1);
    this.tweens.add({
      targets: this.liftGlow,
      alpha: { from: 0.05, to: 0.18 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });

    this.lift = this.add.rectangle(LIFT_X, this.liftBaseY, LIFT_W, LIFT_H, def.ground, 1);
    this.lift.setStrokeStyle(2, def.ledge, 1);
    this.lift.setDepth(2);

    this.liftEdge = this.add
      .rectangle(LIFT_X, this.liftBaseY - LIFT_H / 2, LIFT_W, 3, def.ledge, 0.75)
      .setDepth(3);

    this.physics.add.existing(this.lift, false);
    const body = this.lift.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setFriction(1, 1);
    // on ne bute pas dedans par en dessous ni sur les cotes
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
  }

  /** Montee automatique tant que le heros est pose dessus. */
  private updateLift(delta: number) {
    if (!this.lift || this.exiting) return;
    const body = this.lift.body as Phaser.Physics.Arcade.Body;
    const step = (delta / 1000) * LIFT_SPEED;

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body | null;
    const riding =
      !!playerBody &&
      playerBody.touching.down &&
      Math.abs(this.player.x - this.lift.x) < LIFT_W / 2 + 12 &&
      Math.abs(this.player.y - (this.lift.y - LIFT_H / 2)) < 40;

    let dy = 0;
    if (riding && this.lift.y > this.liftTopY) {
      dy = -Math.min(step, this.lift.y - this.liftTopY);
    } else if (!riding && this.lift.y < this.liftBaseY) {
      dy = Math.min((delta / 1000) * LIFT_RETURN_SPEED, this.liftBaseY - this.lift.y);
    }

    if (dy !== 0) {
      this.lift.y += dy;
      this.liftEdge.y = this.lift.y - LIFT_H / 2;
      this.liftGlow.y = this.lift.y;
      body.updateFromGameObject();
      // le heros est porte par la plateforme
      if (riding && dy < 0) this.player.y += dy;
    }

    if (riding && this.lift.y <= this.liftTopY + 0.5) this.exitRoom();
  }

  /** Fondu au noir puis passage a la salle suivante. */
  private exitRoom() {
    if (this.exiting) return;
    this.exiting = true;
    const cam = this.cameras.main;
    cam.fadeOut(650, 0, 0, 0);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const i = ROOM_ORDER.indexOf(this.backdropKey);
      const next = ROOM_ORDER[(i + 1) % ROOM_ORDER.length];
      this.scene.restart({ backdrop: next });
    });
  }


  private buildGeometry() {
    this.platforms = this.physics.add.staticGroup();

    // Le sol visible est peint par les calques de decor : ici on ne garde
    // qu'un corps de collision invisible sur toute la largeur de la salle.
    const groundH = ROOM_HEIGHT - FLOOR_Y;
    const ground = this.add.rectangle(
      ROOM_WIDTH / 2,
      FLOOR_Y + groundH / 2,
      ROOM_WIDTH,
      groundH,
    );
    ground.setVisible(false);
    this.platforms.add(ground);

    this.platforms.refresh();
  }


  /**
   * Se tenir au sol dans une flaque de sang fraiche, hors combat, rend
   * lentement de la vitalite ; la flaque se vide au fur et a mesure.
   */
  private regenerateFromBlood(safe: boolean, delta: number) {
    if (!safe) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (!body || !(body.blocked.down || body.touching.down)) return;

    const store = useGameStore.getState();
    if (store.health >= store.maxHealth) return;

    const pool = this.blood.poolAt(this.player.x);
    if (!pool) return;

    const healed = this.blood.drainPool(pool, (POOL_REGEN_PER_SEC * delta) / 1000);
    if (healed <= 0) return;
    store.heal(healed);

    if (Math.random() < 0.05) {
      this.onHeal(this.player.x, this.player.y - 40);
    }
  }

  private resolvePlayerStrike(strike: Strike, damageScale = 1) {
    const effects = useGameStore.getState().effects;
    const reach = strike.reach + effects.bonusReach;
    const damage = strike.damage * effects.damageMult * damageScale;
    const radial = strike.shape === "radial";
    const originX = radial ? this.player.x : this.player.x + this.player.facingDirection * (reach / 2);

    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.isDead) continue;
      const withinX = Math.abs(enemy.x - originX) < reach;
      const withinY = Math.abs(enemy.y - this.player.y) < strike.vertical;
      if (withinX && withinY) {
        enemy.takeHit(damage, {
          knockback: strike.knockback,
          breakGuard: strike.breakGuard,
          fromX: this.player.x,
        });
      }
    }

    this.cameras.main.shake(70, 0.004);
  }

  private resolveEnemyStrike(amount: number, source?: Enemy) {
    if (this.player.tryParry(this.time.now)) {
      const store = useGameStore.getState();
      store.registerParry();
      store.gainFlesh(PARRY.fleshReward);
      source?.stun(PARRY.stun);
      this.player.rumble(0.4, 120);
      this.cameras.main.flash(90, 240, 220, 160);
      this.blood.sparks(this.player.x + this.player.facingDirection * 30, this.player.y - 70);
      return;
    }
    this.player.receiveDamage(amount, this.time.now);
  }

  update(time: number, delta: number) {
    this.parallax.update();
    this.lighting.update(delta, this.player.x, this.player.y);

    const phase = useGameStore.getState().phase;
    if (phase !== "playing") {
      this.physics.world.isPaused = true;
      return;
    }
    this.physics.world.isPaused = false;

    this.player.tick(time);
    this.blood.tick(time);


    this.enemies = this.enemies.filter((e) => e.active);

    // aucune creature vivante a proximite : le soin par absorption est permis
    const threatened = this.enemies.some(
      (e) =>
        !e.isDead &&
        Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < SAFE_RADIUS,
    );
    this.player.setSafeToAbsorb(!threatened);
    this.regenerateFromBlood(!threatened, delta);

    for (const enemy of this.enemies) {
      enemy.think(this.player.x, this.player.y, time);
    }

    this.pickups = this.pickups.filter((p) => p.active);
    for (const pickup of this.pickups) {
      pickup.tick(this.player.x, this.player.y, time);
    }
  }
}

