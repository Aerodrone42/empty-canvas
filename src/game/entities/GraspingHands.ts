import Phaser from "phaser";

import { ENEMY_BASELINE_Y, ENEMY_FRAME_H } from "@/game/assets";

/** duree de la saisie : le heros reste bloque 3 secondes */
const GRAB_MS = 3000;
/** temps avant qu'un meme piege puisse reattraper */
const COOLDOWN_MS = 2500;

/**
 * Mains qui jaillissent du sol : quand le heros passe dessus, elles
 * l'agrippent aux jambes et le clouent sur place pendant 3 secondes.
 */
export class GraspingHands {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly scene: Phaser.Scene;
  private readonly x: number;
  private readonly radius: number;
  private grabUntil = 0;
  private readyAt = 0;

  constructor(scene: Phaser.Scene, x: number, floorY: number, radius = 90) {
    this.scene = scene;
    this.x = x;
    this.radius = radius;

    this.sprite = scene.add
      .sprite(x, floorY + 4, "mains-sol", 0)
      // ~40 px de haut : la main arrive au genou du heros (130 px)
      .setOrigin(0.5, ENEMY_BASELINE_Y / ENEMY_FRAME_H)
      .setScale(0.25)
      .setDepth(7)
      .setAlpha(0);
  }

  /** @returns true a l'instant precis ou la saisie se declenche */
  update(playerX: number, playerY: number, floorY: number, time: number): boolean {
    // retrait des mains a la fin de la saisie
    if (this.grabUntil > 0 && time >= this.grabUntil) {
      this.grabUntil = 0;
      this.readyAt = time + COOLDOWN_MS;
      this.sprite.playReverse("mains-sol-anim", true);
      this.scene.time.delayedCall(360, () => this.sprite.setAlpha(0));
    }

    if (this.grabUntil > 0) return false;

    const onGround = Math.abs(playerY - floorY) < 90;
    const near = Math.abs(playerX - this.x) < this.radius && onGround;

    if (near && time >= this.readyAt) {
      this.grabUntil = time + GRAB_MS;
      this.sprite.setAlpha(1);
      this.sprite.play("mains-sol-anim", true);
      this.scene.events.emit("fx-blood", this.x, floorY - 10, 1, 0.6);
      return true;
    }

    return false;
  }

  destroy() {
    this.sprite.destroy();
  }
}
