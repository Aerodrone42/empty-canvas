import Phaser from "phaser";

import { ENEMY_BASELINE_Y, ENEMY_FRAME_H } from "@/game/assets";

/**
 * Mains qui jaillissent du sol : quand le heros passe au-dessus, elles
 * emergent, l'agrippent et le ralentissent tant qu'il reste dans la zone.
 * Elles se retirent ensuite sous terre.
 */
export class GraspingHands {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly scene: Phaser.Scene;
  private readonly x: number;
  private readonly radius: number;
  private active = false;
  private nextGrabAt = 0;

  constructor(scene: Phaser.Scene, x: number, floorY: number, radius = 90) {
    this.scene = scene;
    this.x = x;
    this.radius = radius;

    this.sprite = scene.add
      .sprite(x, floorY + 6, "mains-sol", 0)
      .setOrigin(0.5, ENEMY_BASELINE_Y / ENEMY_FRAME_H)
      .setScale(1.05)
      .setDepth(7)
      .setAlpha(0);
  }

  /** @returns true si le heros est agrippe (donc ralenti) */
  update(playerX: number, playerY: number, floorY: number, time: number): boolean {
    const near =
      Math.abs(playerX - this.x) < this.radius && Math.abs(playerY - floorY) < 90;

    if (near && !this.active && time > this.nextGrabAt) {
      this.active = true;
      this.sprite.setAlpha(1);
      this.sprite.play("mains-sol-anim", true);
      this.scene.events.emit("fx-blood", this.x, floorY - 12, 1, 0.7);
    }

    if (!near && this.active) {
      this.active = false;
      this.nextGrabAt = time + 900;
      this.sprite.playReverse("mains-sol-anim", true);
      this.scene.time.delayedCall(340, () => this.sprite.setAlpha(0));
    }

    return this.active && near;
  }

  destroy() {
    this.sprite.destroy();
  }
}
