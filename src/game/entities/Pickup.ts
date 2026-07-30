import Phaser from "phaser";

import { useGameStore } from "@/store/gameStore";

export type PickupKind = "blood" | "flesh";

/**
 * Ramassables laches par les creatures : fioles de sang (soin) et orbes de
 * chair (ressource). Les orbes volent vers le joueur, les fioles attendent.
 */
export class Pickup extends Phaser.GameObjects.Container {
  readonly kind: PickupKind;
  readonly amount: number;
  private collected = false;
  private bornAt: number;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: PickupKind, amount: number) {
    super(scene, x, y);
    this.kind = kind;
    this.amount = amount;
    this.bornAt = scene.time.now;

    const color = kind === "blood" ? 0xd93b3b : 0xff8a5c;
    const halo = scene.add.circle(0, 0, kind === "blood" ? 13 : 9, color, 0.25);
    const core = scene.add.circle(0, 0, kind === "blood" ? 7 : 4.5, color, 0.95);
    core.setStrokeStyle(1.5, 0xffd7c2, 0.8);
    this.add([halo, core]);
    this.setDepth(7);

    scene.add.existing(this);

    scene.tweens.add({
      targets: halo,
      scale: 1.5,
      alpha: 0.05,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
    this.bob = scene.tweens.add({
      targets: this,
      y: y - 10,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /** Deplacement vers le joueur puis absorption. Renvoie true si consomme. */
  tick(playerX: number, playerY: number, time: number) {
    if (this.collected || !this.active) return;

    const targetY = playerY - 60;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, targetY);
    const magnetRange = this.kind === "flesh" ? 900 : 130;
    const delay = this.kind === "flesh" ? 220 : 0;

    if (time - this.bornAt > delay && dist < magnetRange) {
      // le flottement doit cesser, sinon il annule l'attraction verticale
      if (this.bob) {
        this.bob.stop();
        this.bob = undefined;
      }
      const speed = this.kind === "flesh" ? 0.22 : 0.18;
      this.x = Phaser.Math.Linear(this.x, playerX, speed);
      this.y = Phaser.Math.Linear(this.y, targetY, speed);
    }

    if (dist < 48) this.collect();
  }



  private collect() {
    if (this.collected) return;
    this.collected = true;

    const store = useGameStore.getState();
    if (this.kind === "blood") store.heal(this.amount);
    else store.gainFlesh(this.amount);

    this.scene.tweens.add({
      targets: this,
      scale: 1.8,
      alpha: 0,
      duration: 180,
      onComplete: () => this.destroy(),
    });
  }
}
