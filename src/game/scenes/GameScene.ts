import Phaser from "phaser";

import { FLESH_HEAVY_BONUS, FLESH_PER_HIT, PARRY, type Strike } from "../combat";
import { BloodFX } from "../effects/Blood";
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


/** enchainement des salles : l'ascenseur mene a la suivante */
const ROOM_ORDER: BackdropKey[] = ["cathedrale", "corridor", "throne", "exterieur"];


export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private blood!: BloodFX;
  private parallax!: Parallax;
  private pickups: Pickup[] = [];
  /** panneau de diagnostic des performances (F3) */
  private profiler!: Profiler;
  /** salle courante : determine le decor et la palette */
  private backdropKey: BackdropKey = "cathedrale";

  private exiting = false;
  /** le heros touche le plateau (mis a jour par le collider) */


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

    this.player = new Player(this, 180, FLOOR_Y);
    this.physics.add.collider(this.player, this.platforms);


    this.spawn(new SuppliantRampant(this, 760, FLOOR_Y));
    this.spawn(new PenitentGreffe(this, 1180, FLOOR_Y));
    this.spawn(new SuppliantRampant(this, 1600, FLOOR_Y));
    this.spawn(new PenitentGreffe(this, 2060, FLOOR_Y));

    // suivi horizontal uniquement : au saut, l'image ne doit pas bouger
    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.2, 0, 0, 0);
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

  /** Soin : le sang remonte le long du corps, sans anneau. */
  private onHeal(x: number, y: number) {
    this.blood.siphon(x, this.player ? this.player.y : y, 120);
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

    // le sang de la flaque remonte le long du corps pendant tout le drainage
    this.blood.siphon(this.player.x, this.player.y, 120);
  }


  private resolvePlayerStrike(strike: Strike, damageScale = 1) {
    const store = useGameStore.getState();
    const effects = store.effects;
    const reach = strike.reach + effects.bonusReach;
    const damage = strike.damage * effects.damageMult * damageScale;
    const radial = strike.shape === "radial";
    const originX = radial ? this.player.x : this.player.x + this.player.facingDirection * (reach / 2);

    let hits = 0;
    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.isDead) continue;
      const withinX = Math.abs(enemy.x - originX) < reach;
      const withinY = Math.abs(enemy.y - this.player.y) < strike.vertical;
      if (withinX && withinY) {
        hits += 1;
        enemy.takeHit(damage, {
          knockback: strike.knockback,
          breakGuard: strike.breakGuard,
          fromX: this.player.x,
        });
      }
    }

    // chaque coup porté recharge la jauge de Chair qui alimente le Rugissement
    if (hits > 0 && strike.id !== "special") {
      const bonus = strike.breakGuard || strike.id === "combo3" ? FLESH_HEAVY_BONUS : 0;
      store.gainFlesh((FLESH_PER_HIT + bonus) * hits);
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
    const t0 = performance.now();
    const prof = this.profiler;

    prof.measure("parallax", () => this.parallax.update());

    const phase = useGameStore.getState().phase;
    if (phase !== "playing") {
      this.physics.world.isPaused = true;
      prof.frame(time, delta, performance.now() - t0);
      return;
    }
    this.physics.world.isPaused = false;

    prof.measure("player", () => this.player.tick(time));
    prof.measure("sang", () => this.blood.tick(time));

    this.enemies = this.enemies.filter((e) => e.active);

    // aucune creature vivante a proximite : le soin par absorption est permis
    prof.measure("absorption", () => {
      const threatened = this.enemies.some(
        (e) =>
          !e.isDead &&
          Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < SAFE_RADIUS,
      );
      this.player.setSafeToAbsorb(!threatened);
      this.regenerateFromBlood(!threatened, delta);
    });

    prof.measure("ennemis", () => {
      for (const enemy of this.enemies) {
        enemy.think(this.player.x, this.player.y, time);
      }
    });

    prof.measure("ramassages", () => {
      this.pickups = this.pickups.filter((p) => p.active);
      for (const pickup of this.pickups) {
        pickup.tick(this.player.x, this.player.y, time);
      }
    });

    prof.frame(time, delta, performance.now() - t0);
  }
}

