import Phaser from "phaser";

/**
 * Veine unique qui court le long du mur du corridor.
 *
 * Elle bat comme un vaisseau : gonflement rapide, relachement lent, puis
 * courte pause. L'onde traverse le corridor grace a un decalage de phase
 * entre trois troncons contigus. A chaque battement, quelques points de
 * fuite laissent tomber une goutte de sang le long du mur.
 */

/** hauteur affichee au repos */
const VEIN_H = 78;
/** nombre de troncons animes (onde qui parcourt le corridor) */
const SEGMENTS = 3;
/** points de fuite le long de la veine */
const LEAK_COUNT = 6;
/** gouttes recyclees */
const DROP_POOL = 10;

const TINT_REST = 0x9b3038;
const TINT_PEAK = 0xc4434c;

type Drop = {
  body: Phaser.GameObjects.Rectangle;
  trail: Phaser.GameObjects.Rectangle;
  busy: boolean;
};

export class CorridorVein {
  private readonly scene: Phaser.Scene;
  private readonly parts: Phaser.GameObjects.TileSprite[] = [];
  private readonly tweens: Phaser.Tweens.Tween[] = [];
  private readonly drops: Drop[] = [];
  private readonly leaks: number[] = [];
  private readonly baseScale: number;
  private readonly y: number;
  private beatEvent?: Phaser.Time.TimerEvent;
  private destroyed = false;

  constructor(scene: Phaser.Scene, floorY: number, roomWidth: number) {
    this.scene = scene;
    const tex = scene.textures.get("corridor-vein").getSourceImage();
    const srcH = tex.height || 1;
    const scale = VEIN_H / srcH;
    this.baseScale = scale;
    this.y = floorY - 430;

    const segW = roomWidth / SEGMENTS;

    // leger chevauchement pour masquer la jonction entre troncons
    const overlap = 12;

    for (let i = 0; i < SEGMENTS; i++) {
      const band = scene.add
        .tileSprite(
          i * segW,
          this.y,
          (segW + overlap) / scale,
          srcH,
          "corridor-vein",
        )
        .setOrigin(0, 0.5)
        .setScale(scale)
        .setScrollFactor(1)
        .setDepth(-4)
        .setAlpha(0.9)
        .setTint(TINT_REST);

      // continuite du motif : chaque troncon reprend la ou le precedent s'arrete
      band.tilePositionX = (i * segW) / scale;
      this.parts.push(band);

      const delay = i * 90;

      // Battement : gonflement rapide, relachement lent, pause.
      const t = scene.tweens.chain({
        targets: band,
        loop: -1,
        delay,
        tweens: [
          {
            scaleY: scale * 1.22,
            alpha: 1,
            duration: 180,
            ease: "Quad.easeOut",
            onStart: () => band.setTint(TINT_PEAK),
          },
          {
            scaleY: scale * 0.88,
            alpha: 0.85,
            duration: 700,
            ease: "Sine.easeInOut",
            onStart: () => band.setTint(TINT_REST),
          },
          {
            scaleY: scale,
            alpha: 0.9,
            duration: 900,
            ease: "Sine.easeInOut",
          },
        ],
      });
      this.tweens.push(t as unknown as Phaser.Tweens.Tween);

      // flux interne tres lent
      const flow = scene.tweens.add({
        targets: band,
        tilePositionX: band.tilePositionX + 240,
        duration: 14000,
        repeat: -1,
        ease: "Linear",
      });
      this.tweens.push(flow);
    }

    // points de fuite repartis sur la longueur
    for (let i = 0; i < LEAK_COUNT; i++) {
      this.leaks.push(
        roomWidth * ((i + 0.5) / LEAK_COUNT) +
          Phaser.Math.Between(-60, 60),
      );
    }

    // pool de gouttes
    for (let i = 0; i < DROP_POOL; i++) {
      const trail = scene.add
        .rectangle(0, 0, 2, 26, 0x4a0d12)
        .setOrigin(0.5, 0)
        .setDepth(-5)
        .setAlpha(0)
        .setVisible(false);
      const body = scene.add
        .rectangle(0, 0, 4, 9, 0x8e1c22)
        .setOrigin(0.5, 0)
        .setDepth(-4)
        .setAlpha(0)
        .setVisible(false);
      this.drops.push({ body, trail, busy: false });
    }

    // un battement -> une ou deux gouttes
    this.beatEvent = scene.time.addEvent({
      delay: 1780,
      loop: true,
      callback: () => this.bleed(),
    });
  }

  private visible(): boolean {
    const cam = this.scene.cameras.main;
    return !!cam && this.y > cam.scrollY - 200 && this.y < cam.scrollY + cam.height + 200;
  }

  private bleed() {
    if (this.destroyed || !this.visible()) return;
    const count = Phaser.Math.Between(1, 2);
    for (let i = 0; i < count; i++) {
      const x = Phaser.Utils.Array.GetRandom(this.leaks);
      this.spawnDrop(x + Phaser.Math.Between(-8, 8));
    }
  }

  private spawnDrop(x: number) {
    const drop = this.drops.find((d) => !d.busy);
    if (!drop) return;
    drop.busy = true;

    const startY = this.y + VEIN_H * 0.35;
    const fall = Phaser.Math.Between(150, 260);

    drop.body
      .setPosition(x, startY)
      .setScale(1, 0.4)
      .setAlpha(0)
      .setVisible(true);
    drop.trail
      .setPosition(x, startY)
      .setScale(1, 0.2)
      .setAlpha(0)
      .setVisible(true);

    // gonflement de la goutte avant la chute
    this.scene.tweens.add({
      targets: drop.body,
      alpha: 0.95,
      scaleY: 1,
      duration: 260,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.scene.tweens.add({
          targets: drop.body,
          y: startY + fall,
          scaleY: 1.6,
          duration: 620,
          ease: "Quad.easeIn",
        });
        this.scene.tweens.add({
          targets: drop.body,
          alpha: 0,
          delay: 380,
          duration: 260,
          ease: "Sine.easeIn",
          onComplete: () => {
            drop.body.setVisible(false);
            drop.trail.setVisible(false);
            drop.busy = false;
          },
        });
        // trainee courte qui s'efface
        drop.trail.setAlpha(0.5);
        this.scene.tweens.add({
          targets: drop.trail,
          scaleY: fall / 26,
          duration: 620,
          ease: "Quad.easeIn",
        });
        this.scene.tweens.add({
          targets: drop.trail,
          alpha: 0,
          delay: 300,
          duration: 700,
          ease: "Sine.easeIn",
        });
      },
    });
  }

  destroy() {
    this.destroyed = true;
    this.beatEvent?.remove();
    this.beatEvent = undefined;
    for (const t of this.tweens) t.remove?.();
    this.tweens.length = 0;
    for (const d of this.drops) {
      d.body.destroy();
      d.trail.destroy();
    }
    this.drops.length = 0;
    for (const p of this.parts) p.destroy();
    this.parts.length = 0;
  }
}
