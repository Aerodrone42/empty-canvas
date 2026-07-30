import Phaser from "phaser";

import { useGameStore } from "@/store/gameStore";

const SPEED = 190;
const JUMP = 520;
const ATTACK_COOLDOWN = 420;
const INVULN_MS = 750;

/**
 * Le sprite du Vigile n'occupe qu'une partie de sa cellule :
 * silhouette 32x73 px, pieds a 26 px du bas de la frame.
 */
const SPRITE_W = 32;
const SPRITE_H = 73;
const FOOT_GAP = 26;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private keys!: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    jump: Phaser.Input.Keyboard.Key;
    attack: Phaser.Input.Keyboard.Key;
  };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attacking = false;
  private lastAttackAt = -Infinity;
  private invulnUntil = 0;
  private facing = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "vigile-idle");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(1.8);
    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);
    this.alignBody();

    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.keys = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      attack: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };

    this.play("vigile-idle-anim");
    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + "vigile-attack-anim", () => {
      this.attacking = false;
    });
  }

  /** Les frames n'ont pas toutes la meme largeur : on recentre le corps. */
  private alignBody() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(SPRITE_W, SPRITE_H);
    body.setOffset(
      (this.width - SPRITE_W) / 2,
      this.height - FOOT_GAP - SPRITE_H,
    );
  }


  get facingDirection() {
    return this.facing;
  }

  get isAttacking() {
    return this.attacking;
  }

  receiveDamage(amount: number, time: number) {
    if (time < this.invulnUntil) return;
    this.invulnUntil = time + INVULN_MS;
    useGameStore.getState().damage(amount);

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

  tick(time: number) {
    this.alignBody();
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    const left = this.keys.left.isDown || this.cursors.left?.isDown;
    const right = this.keys.right.isDown || this.cursors.right?.isDown;
    const jump =
      Phaser.Input.Keyboard.JustDown(this.keys.jump) ||
      (this.cursors.up ? Phaser.Input.Keyboard.JustDown(this.cursors.up) : false);
    const attack = Phaser.Input.Keyboard.JustDown(this.keys.attack);

    if (attack && !this.attacking && time - this.lastAttackAt >= ATTACK_COOLDOWN) {
      this.attacking = true;
      this.lastAttackAt = time;
      body.setVelocityX(0);
      this.play("vigile-attack-anim", true);
      this.scene.events.emit("player-strike");
      return;
    }

    if (this.attacking) {
      if (onGround) body.setVelocityX(0);
      return;
    }

    if (left) {
      body.setVelocityX(-SPEED);
      this.facing = -1;
      this.setFlipX(true);
    } else if (right) {
      body.setVelocityX(SPEED);
      this.facing = 1;
      this.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    if (jump && onGround) {
      body.setVelocityY(-JUMP);
    }

    if (!onGround) {
      this.play("vigile-idle-anim", true);
    } else if (left || right) {
      this.play("vigile-walk-anim", true);
    } else {
      this.play("vigile-idle-anim", true);
    }
  }
}
