import Phaser from "phaser";

import { isKeyJustDown } from "../input";
import { padFor } from "../input";
import { useGameStore } from "@/store/gameStore";

/**
 * Autel de Sang : point de sauvegarde place juste avant chaque affrontement
 * majeur. Sprite pixel-art (vasque de pierre gravee) pose au sol, derriere le
 * heros, avec du sang qui ondule dans la vasque et s'ecoule sur le fut.
 */

const TEX_GLOW = "blood-altar-glow";
const TEX_ALTAR = "blood-altar";
const RANGE = 170;

/** hauteur affichee de l'autel (le heros fait ~130px) */
const PROP_H = 190;
/** profondeur : sous le heros (depth 5) comme les autres props de sol */
const DEPTH = -2;

function ensureGlow(scene: Phaser.Scene) {
  if (scene.textures.exists(TEX_GLOW)) return;
  const size = 256;
  const canvas = scene.textures.createCanvas(TEX_GLOW, size, size);
  const ctx = canvas?.getContext();
  if (!ctx || !canvas) return;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(140,28,28,0.7)");
  g.addColorStop(0.45, "rgba(96,16,20,0.28)");
  g.addColorStop(1, "rgba(50,6,8,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  canvas.refresh();
}

type Rivulet = {
  x: number;
  reach: number;
  width: number;
  phase: number;
  speed: number;
  drop: number;
  dropDelay: number;
};

type Pool = { x: number; life: number; ttl: number };

export class BloodAltar {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private sprite: Phaser.GameObjects.Image;
  private blood: Phaser.GameObjects.Graphics;
  private glow: Phaser.GameObjects.Image;
  private prompt: Phaser.GameObjects.Text;
  private haze?: Phaser.GameObjects.Particles.ParticleEmitter;
  private padWasDown = false;

  private rivulets: Rivulet[] = [];
  private pools: Pool[] = [];

  /** geometrie derivee du sprite, en coordonnees locales (y=0 au sol) */
  private bowlY = -150;
  private bowlRx = 40;

  readonly x: number;
  private lit = false;

  constructor(scene: Phaser.Scene, x: number, floorY: number, lit = false) {
    this.scene = scene;
    this.x = x;
    ensureGlow(scene);

    const src = scene.textures.get(TEX_ALTAR).getSourceImage();
    const scale = PROP_H / src.height;
    const wScale = scale * 0.62;

    this.sprite = scene.add.image(0, 0, TEX_ALTAR).setOrigin(0.5, 1).setScale(wScale, scale);

    // la vasque occupe environ le quart superieur du sprite
    this.bowlY = -PROP_H * 0.9;
    this.bowlRx = (src.width * wScale) / 2 - 5;

    this.blood = scene.add.graphics();

    this.glow = scene.add
      .image(0, this.bowlY, TEX_GLOW)
      .setScale(0.55)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.prompt = scene.add
      .text(0, -PROP_H - 34, "", {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#e0b6ba",
        align: "center",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.root = scene.add
      .container(x, floorY, [this.sprite, this.blood, this.glow, this.prompt])
      .setDepth(DEPTH);

    const seeds = [-0.55, -0.2, 0.25, 0.6];
    this.rivulets = seeds.map((f, i) => ({
      x: this.bowlRx * f,
      reach: 28 + ((i * 19) % 40),
      width: 1.6 + ((i * 7) % 3) * 0.5,
      phase: i * 1.37,
      speed: 0.0007 + i * 0.00016,
      drop: -1,
      dropDelay: 500 + i * 620,
    }));

    if (scene.textures.exists("__WHITE")) {
      this.haze = scene.add.particles(x, floorY + this.bowlY - 4, "__WHITE", {
        speed: { min: 6, max: 18 },
        angle: { min: 250, max: 290 },
        lifespan: 1100,
        quantity: 1,
        frequency: 240,
        scale: { start: 1.1, end: 0 },
        alpha: { start: 0.22, end: 0 },
        tint: 0x7d1c22,
      });
      this.haze.setDepth(DEPTH);
      this.haze.stop();
    }

    this.setLit(lit, true);
  }

  get isLit() {
    return this.lit;
  }

  private setLit(lit: boolean, silent = false) {
    this.lit = lit;
    // pierre chaude accordee au dallage/balustrade ; eteinte = plus sombre
    this.sprite.setTint(lit ? 0x8a7f70 : 0x6b6158);
    this.glow.setAlpha(lit ? 0.4 : 0.1);
    if (lit) this.haze?.start();
    else this.haze?.stop();
    if (lit && !silent) {
      this.scene.cameras.main.flash(140, 70, 12, 18);
      this.scene.tweens.add({
        targets: this.glow,
        scale: { from: 1.1, to: 0.55 },
        duration: 520,
        ease: "Cubic.easeOut",
      });
      const ring = this.scene.add.circle(0, this.bowlY, 8);
      ring.setStrokeStyle(3, 0x8e1c26, 0.8);
      this.root.add(ring);
      this.scene.tweens.add({
        targets: ring,
        scale: 8,
        alpha: 0,
        duration: 620,
        ease: "Cubic.easeOut",
        onComplete: () => ring.destroy(),
      });
    }
  }

  /** Surface du bassin, coulees, gouttes et flaques, par-dessus le sprite. */
  private drawBlood(time: number, delta: number) {
    const g = this.blood;
    g.clear();

    const surface = this.lit ? 0xb52230 : 0x4a161a;
    const stream = this.lit ? 0x8e1c26 : 0x2c1013;
    const shine = this.lit ? 0xff8a92 : 0x6a2a2f;

    // surface du sang dans la vasque : ondulation lente
    const wob = 1 + Math.sin(time / 520) * 0.02;
    g.fillStyle(surface, this.lit ? 0.95 : 0.8);
    g.fillEllipse(0, this.bowlY + 2, this.bowlRx * 1.42 * wob, this.bowlRx * 0.42 * wob);
    const sx = Math.sin(time / 1400) * this.bowlRx * 0.35;
    g.fillStyle(shine, this.lit ? 0.4 : 0.14);
    g.fillEllipse(sx, this.bowlY, this.bowlRx * 0.34, 3);

    for (const r of this.rivulets) {
      const breathe = 0.7 + Math.sin(time * r.speed + r.phase) * 0.3;
      const len = r.reach * breathe * (this.lit ? 1 : 0.4);
      const top = this.bowlY + this.bowlRx * 0.24;
      const curve = -r.x * 0.35;

      g.fillStyle(stream, 0.9);
      g.beginPath();
      g.moveTo(r.x - r.width, top);
      g.lineTo(r.x + r.width, top);
      g.lineTo(r.x + curve + r.width * 0.3, top + len);
      g.lineTo(r.x + curve - r.width * 0.3, top + len);
      g.closePath();
      g.fillPath();
      g.fillStyle(surface, 0.92);
      g.fillCircle(r.x + curve, top + len, r.width * 0.8);

      if (this.lit) {
        r.dropDelay -= delta;
        if (r.drop < 0 && r.dropDelay <= 0) {
          r.drop = 0;
          r.dropDelay = 1400 + Math.random() * 1600;
        }
        if (r.drop >= 0) {
          r.drop += delta / 640;
          const fromY = top + len;
          const dy = fromY + (0 - fromY) * Math.min(1, r.drop * r.drop);
          g.fillStyle(surface, 0.9);
          g.fillEllipse(r.x + curve, dy, r.width * 1.4, r.width * 2.2);
          if (r.drop >= 1) {
            r.drop = -1;
            this.pools.push({ x: r.x + curve, life: 0, ttl: 1500 });
          }
        }
      } else {
        r.drop = -1;
      }
    }

    for (const p of this.pools) {
      p.life += delta;
      const t = Math.min(1, p.life / p.ttl);
      g.fillStyle(stream, (1 - t) * 0.6);
      g.fillEllipse(p.x, -3, 6 + t * 20, 2 + t * 4);
    }
    this.pools = this.pools.filter((p) => p.life < p.ttl);
  }

  /** Invite de proximite + activation. A appeler chaque frame. */
  tick(playerX: number, time: number, delta = 16) {
    const near = Math.abs(playerX - this.x) < RANGE;

    this.drawBlood(time, delta);

    const pulse = this.lit ? 0.74 + Math.sin(time / 380) * 0.13 : 0.14 + Math.sin(time / 900) * 0.05;
    this.glow.setAlpha(pulse);

    if (this.lit) {
      this.prompt.setText(near ? "Autel scellé" : "");
      this.prompt.setAlpha(near ? 0.55 : 0);
      return;
    }

    this.prompt.setText(near ? "Sceller le sang" : "");
    this.prompt.setAlpha(near ? 0.9 : 0);
    if (!near) return;

    if (this.interactPressed()) this.seal();
  }

  private interactPressed() {
    if (isKeyJustDown("interact")) return true;
    const pad = this.scene.input.gamepad?.getPad(0);
    const index = padFor("interact");
    const pressed = index >= 0 ? !!pad?.buttons[index]?.pressed : false;
    const justDown = pressed && !this.padWasDown;
    this.padWasDown = pressed;
    return justDown;
  }

  private seal() {
    this.setLit(true);
    const store = useGameStore.getState();
    store.setCheckpoint(this.x);
    store.heal(store.maxHealth);
  }

  destroy() {
    this.haze?.destroy();
    this.root.destroy(true);
  }
}
