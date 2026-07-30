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
const FLOOR_Y = 780;
/** distance en dessous de laquelle une creature empeche de se soigner */
const SAFE_RADIUS = 300;

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

  constructor() {
    super("game");
  }

  init(data?: { backdrop?: BackdropKey }) {
    this.backdropKey = data?.backdrop ?? "cathedrale";
  }

  create() {
    this.enemies = [];
    this.pickups = [];
    this.physics.world.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBackgroundColor(0x14090b);


    this.blood = new BloodFX(this, FLOOR_Y);

    this.buildBackdrop();
    this.buildGeometry();

    this.player = new Player(this, 180, FLOOR_Y);
    this.physics.add.collider(this.player, this.platforms);

    this.spawn(new SuppliantRampant(this, 760, FLOOR_Y));
    this.spawn(new PenitentGreffe(this, 1180, FLOOR_Y));
    this.spawn(new SuppliantRampant(this, 1600, FLOOR_Y));
    this.spawn(new PenitentGreffe(this, 2060, FLOOR_Y));

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, 0, 120);

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
    this.parallax = new Parallax(this, this.backdropKey, FLOOR_Y, ROOM_HEIGHT);
    this.lighting = new Lighting(this, ROOM_WIDTH, FLOOR_Y);
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


    this.enemies = this.enemies.filter((e) => e.active);

    // aucune creature vivante a proximite : le soin par absorption est permis
    const threatened = this.enemies.some(
      (e) =>
        !e.isDead &&
        Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < SAFE_RADIUS,
    );
    this.player.setSafeToAbsorb(!threatened);

    for (const enemy of this.enemies) {
      enemy.think(this.player.x, this.player.y, time);
    }

    this.pickups = this.pickups.filter((p) => p.active);
    for (const pickup of this.pickups) {
      pickup.tick(this.player.x, this.player.y, time);
    }
  }
}

