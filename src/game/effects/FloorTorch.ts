import Phaser from "phaser";

/**
 * Torcheres sur pied : brasero pose au sol, flamme animee, halo ambre qui
 * fluctue, fumee legere et braises. Purement decoratif — aucun corps physique,
 * aucun overlap : le heros et les ennemis traversent la torchere sans effet.
 */

export const TEX_TORCH = "floor-torch";
export const ANIM_TORCH = "floor-torch-burn";

const TEX_GLOW = "floor-torch-glow";
const TEX_SMOKE = "floor-torch-smoke";

/** dimensions d'une frame source */
const FRAME_W = 112;
const FRAME_H = 240;
/** position du foyer (vasque) dans la frame source */
const FIRE_X = 0.5;
const FIRE_Y = 88 / FRAME_H;

/** Textures radiales generees une seule fois, partagees par toutes les torches. */
function ensureTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists(TEX_GLOW)) {
    const size = 256;
    const c = scene.textures.createCanvas(TEX_GLOW, size, size);
    const ctx = c?.getContext();
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(255,196,110,1)");
      g.addColorStop(0.35, "rgba(255,140,52,0.45)");
      g.addColorStop(0.7, "rgba(150,60,20,0.14)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      c?.refresh();
    }
  }

  if (!scene.textures.exists(TEX_SMOKE)) {
    const size = 64;
    const c = scene.textures.createCanvas(TEX_SMOKE, size, size);
    const ctx = c?.getContext();
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(58,48,50,0.85)");
      g.addColorStop(0.6, "rgba(40,32,34,0.35)");
      g.addColorStop(1, "rgba(20,16,18,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      c?.refresh();
    }
  }
}

export class FloorTorch {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly glow: Phaser.GameObjects.Image;
  private readonly smoke: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly baseGlow: number;
  private readonly seed: number;
  /** sursaut de courant d'air en cours */
  private gust = 0;
  private nextGust = 0;
  private destroyed = false;

  /** @param groundY ligne de sol sur laquelle repose le pied de la torchere */
  constructor(
    scene: Phaser.Scene,
    x: number,
    groundY: number,
    scale = 1,
    depth = -6,
  ) {
    ensureTextures(scene);
    this.seed = Math.random() * Math.PI * 2;

    this.sprite = scene.add
      .sprite(x, groundY, TEX_TORCH, 0)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setDepth(depth);
    // desynchronisation : deux torches ne brulent jamais en phase
    this.sprite.play(ANIM_TORCH);
    this.sprite.anims.setProgress(Math.random());
    this.sprite.anims.msPerFrame = Phaser.Math.Between(88, 124);

    const fx = x + (FIRE_X - 0.5) * FRAME_W * scale;
    const fy = groundY - (1 - FIRE_Y) * FRAME_H * scale;

    this.baseGlow = 0.5 * scale;
    this.glow = scene.add
      .image(fx, fy, TEX_GLOW)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(depth - 1)
      .setScale(2.1 * scale)
      .setAlpha(this.baseGlow);

    this.smoke = scene.add.particles(fx, fy - 46 * scale, TEX_SMOKE, {
      speedY: { min: -34, max: -18 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.24 * scale, end: 0.85 * scale },
      alpha: { start: 0.3, end: 0 },
      lifespan: { min: 1600, max: 2600 },
      frequency: 420,
      quantity: 1,
      rotate: { min: -20, max: 20 },
    });
    this.smoke.setDepth(depth - 2);
  }

  /** Fluctuation continue + brefs sursauts aleatoires. */
  tick(time: number) {
    if (this.destroyed) return;

    if (time >= this.nextGust) {
      this.nextGust = time + Phaser.Math.Between(1400, 4200);
      this.gust = Phaser.Math.FloatBetween(0.14, 0.3);
    }
    if (this.gust > 0) this.gust = Math.max(0, this.gust - 0.006);

    const flicker =
      Math.sin(time * 0.006 + this.seed) * 0.06 +
      Math.sin(time * 0.017 + this.seed * 1.7) * 0.04 +
      Math.sin(time * 0.041 + this.seed * 2.3) * 0.025;

    const a = this.baseGlow + flicker + this.gust;
    this.glow.setAlpha(Phaser.Math.Clamp(a, 0.16, 0.95));
    this.glow.setScale((2.1 + flicker * 1.6 + this.gust * 0.8) * this.sprite.scaleX);
  }

  destroy() {
    this.destroyed = true;
    this.sprite.destroy();
    this.glow.destroy();
    this.smoke.destroy();
  }
}

/**
 * Place les torcheres au sol selon la salle.
 * Les positions evitent le crucifie, la colonne de sortie et la machine.
 */
export function placeTorches(
  scene: Phaser.Scene,
  floorY: number,
  roomWidth: number,
  backdropKey: string,
): FloorTorch[] {
  const torches: FloorTorch[] = [];

  if (backdropKey === "corridor") {
    // perspective fuyante : plus petites vers le centre du couloir
    const count = 6;
    const mid = roomWidth / 2;
    for (let i = 0; i < count; i++) {
      const x = 260 + (i * (roomWidth - 520)) / (count - 1);
      const t = 1 - Math.min(1, Math.abs(x - mid) / mid);
      const scale = 0.8 - t * 0.34;
      // le pied suit la ligne de sol qui remonte vers le point de fuite
      const y = floorY - t * 46;
      torches.push(new FloorTorch(scene, x, y, scale, -6));
    }
    return torches;
  }

  // cathedrale : quatre torcheres reparties, loin du crucifie et de la sortie
  for (const x of [340, 1080, 1720, 2380]) {
    torches.push(new FloorTorch(scene, x, floorY + Phaser.Math.Between(-3, 3), 0.9, -6));
  }
  return torches;
}
