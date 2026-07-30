import Phaser from "phaser";

import { PARRY, type Strike } from "../combat";
import { BloodFX } from "../effects/Blood";
import { Enemy, PenitentGreffe, SuppliantRampant } from "../entities/Enemy";
import { Pickup } from "../entities/Pickup";
import { Player } from "../entities/Player";
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

  constructor() {
    super("game");
  }

  create() {
    this.enemies = [];
    this.physics.world.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBackgroundColor(0x14090b);

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
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off("player-strike", this.resolvePlayerStrike, this);
      this.events.off("enemy-strike", this.resolveEnemyStrike, this);
    });
  }

  private spawn(enemy: Enemy) {
    this.physics.add.collider(enemy, this.platforms);
    this.enemies.push(enemy);
  }

  private buildBackdrop() {
    const g = this.add.graphics();
    g.fillStyle(0x1b0f12, 1);
    g.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

    // Arches gothiques en arriere-plan
    g.fillStyle(0x241417, 1);
    for (let x = 60; x < ROOM_WIDTH; x += 320) {
      g.fillRect(x, 240, 150, FLOOR_Y - 240);
      g.fillEllipse(x + 75, 240, 150, 190);
    }

    g.fillStyle(0x0e070a, 1);
    for (let x = 90; x < ROOM_WIDTH; x += 320) {
      g.fillRect(x, 290, 90, FLOOR_Y - 290);
      g.fillEllipse(x + 45, 290, 90, 130);
    }
    g.setScrollFactor(0.35);
    g.setDepth(-10);
  }

  private buildGeometry() {
    this.platforms = this.physics.add.staticGroup();

    const ground = this.add.rectangle(
      ROOM_WIDTH / 2,
      FLOOR_Y + 40,
      ROOM_WIDTH,
      80,
      0x2a181b,
    );
    this.platforms.add(ground);

    const ledges: Array<[number, number, number]> = [
      [520, 620, 220],
      [900, 500, 180],
      [1400, 590, 240],
      [1900, 470, 200],
    ];

    for (const [x, y, w] of ledges) {
      const ledge = this.add.rectangle(x, y, w, 24, 0x3a2226);
      this.platforms.add(ledge);
    }

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
      return;
    }
    this.player.receiveDamage(amount, this.time.now);
  }

  update(time: number) {
    const phase = useGameStore.getState().phase;
    if (phase !== "playing") {
      this.physics.world.isPaused = true;
      return;
    }
    this.physics.world.isPaused = false;

    this.player.tick(time);

    this.enemies = this.enemies.filter((e) => e.active);
    for (const enemy of this.enemies) {
      enemy.think(this.player.x, this.player.y, time);
    }
  }
}
