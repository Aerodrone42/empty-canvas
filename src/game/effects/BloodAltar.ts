import Phaser from "phaser";

import { isKeyJustDown } from "../input";
import { padFor } from "../input";
import { useGameStore } from "@/store/gameStore";

/**
 * Autel de Sang : point de sauvegarde place juste avant chaque affrontement
 * majeur. Silhouette gothique fine (gradins, fut grave, vasque evasee) avec
 * du sang qui deborde et s'ecoule le long de la pierre.
 */

const TEX_GLOW = "blood-altar-glow";
const RANGE = 170;

// geometrie (repere : y = 0 au sol, valeurs negatives vers le haut)
const BOWL_Y = -132;
const BOWL_RX = 40;
const SHAFT_TOP = -126;
const SHAFT_BOTTOM = -46;

function ensureGlow(scene: Phaser.Scene) {
  if (scene.textures.exists(TEX_GLOW)) return;
  const size = 256;
  const canvas = scene.textures.createCanvas(TEX_GLOW, size, size);
  const ctx = canvas?.getContext();
  if (!ctx || !canvas) return;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(220,60,70,0.85)");
  g.addColorStop(0.45, "rgba(150,25,35,0.35)");
  g.addColorStop(1, "rgba(80,10,15,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  canvas.refresh();
}

type Rivulet = {
  /** decalage horizontal sur la levre de la vasque */
  x: number;
  /** longueur maximale de la coulee */
  reach: number;
  width: number;
  phase: number;
  speed: number;
  /** goutte detachee : progression 0..1, -1 = aucune */
  drop: number;
  dropDelay: number;
};

type Pool = { x: number; life: number; ttl: number };

export class BloodAltar {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private stone: Phaser.GameObjects.Graphics;
  private blood: Phaser.GameObjects.Graphics;
  private glow: Phaser.GameObjects.Image;
  private prompt: Phaser.GameObjects.Text;
  private haze?: Phaser.GameObjects.Particles.ParticleEmitter;
  private padWasDown = false;

  private rivulets: Rivulet[] = [];
  private pools: Pool[] = [];

  readonly x: number;
  private lit = false;

  constructor(scene: Phaser.Scene, x: number, floorY: number, lit = false) {
    this.scene = scene;
    this.x = x;
    ensureGlow(scene);

    this.stone = scene.add.graphics();
    this.drawStone();

    this.blood = scene.add.graphics();

    this.glow = scene.add
      .image(0, BOWL_Y - 10, TEX_GLOW)
      .setScale(0.85)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.prompt = scene.add
      .text(0, -210, "", {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#e0b6ba",
        align: "center",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.root = scene.add
      .container(x, floorY, [this.stone, this.blood, this.glow, this.prompt])
      .setDepth(24);

    // coulees reparties de part et d'autre de la vasque
    const seeds = [-32, -14, 13, 30];
    this.rivulets = seeds.map((sx, i) => ({
      x: sx,
      reach: 34 + ((i * 17) % 38),
      width: 2.2 + ((i * 7) % 3) * 0.6,
      phase: i * 1.37,
      speed: 0.0007 + i * 0.00016,
      drop: -1,
      dropDelay: 500 + i * 620,
    }));

    if (scene.textures.exists("__WHITE")) {
      this.haze = scene.add.particles(x, floorY + BOWL_Y - 6, "__WHITE", {
        speed: { min: 6, max: 20 },
        angle: { min: 250, max: 290 },
        lifespan: 1100,
        quantity: 1,
        frequency: 190,
        scale: { start: 1.6, end: 0 },
        alpha: { start: 0.5, end: 0 },
        tint: 0xd23a44,
        blendMode: Phaser.BlendModes.ADD,
      });
      this.haze.setDepth(25);
      this.haze.stop();
    }

    this.setLit(lit, true);
  }

  get isLit() {
    return this.lit;
  }

  /** Pierre : deux gradins bas, fut grave, vasque evasee. Dessine une fois. */
  private drawStone() {
    const g = this.stone;
    g.clear();

    const dark = 0x1c1518;
    const mid = 0x2e2429;
    const light = 0x3f3238;
    const rim = 0x4d3d43;

    // gradin inferieur
    g.fillStyle(mid, 1);
    g.fillRect(-39, -22, 78, 22);
    g.fillStyle(light, 1);
    g.fillRect(-39, -24, 78, 4);
    // gradin superieur
    g.fillStyle(mid, 1);
    g.fillRect(-30, -46, 60, 24);
    g.fillStyle(light, 1);
    g.fillRect(-30, -48, 60, 4);

    // fut galbe : polygone symetrique
    g.fillStyle(0x352a2f, 1);
    g.beginPath();
    g.moveTo(-19, SHAFT_BOTTOM);
    g.lineTo(-13, -78);
    g.lineTo(-15, -110);
    g.lineTo(-21, SHAFT_TOP);
    g.lineTo(21, SHAFT_TOP);
    g.lineTo(15, -110);
    g.lineTo(13, -78);
    g.lineTo(19, SHAFT_BOTTOM);
    g.closePath();
    g.fillPath();

    // gravures verticales
    g.lineStyle(1, dark, 0.8);
    for (const gx of [-8, 0, 8]) {
      g.beginPath();
      g.moveTo(gx, -54);
      g.lineTo(gx, -116);
      g.strokePath();
    }
    // sigil grave
    g.lineStyle(1.5, 0x5a1c24, 0.9);
    g.strokeCircle(0, -86, 7);
    g.beginPath();
    g.moveTo(0, -95);
    g.lineTo(0, -77);
    g.moveTo(-6, -86);
    g.lineTo(6, -86);
    g.strokePath();

    // vasque : coupe evasee
    g.fillStyle(0x2a2126, 1);
    g.beginPath();
    g.moveTo(-BOWL_RX, BOWL_Y);
    g.lineTo(-17, BOWL_Y + 22);
    g.lineTo(17, BOWL_Y + 22);
    g.lineTo(BOWL_RX, BOWL_Y);
    g.closePath();
    g.fillPath();

    // levre de pierre claire
    g.fillStyle(rim, 1);
    g.fillEllipse(0, BOWL_Y, BOWL_RX * 2 + 6, 15);
    g.fillStyle(0x150f11, 1);
    g.fillEllipse(0, BOWL_Y + 1, BOWL_RX * 2 - 6, 11);

    // ombre au sol
    g.fillStyle(0x0b0709, 0.5);
    g.fillEllipse(0, -2, 108, 12);
  }

  private setLit(lit: boolean, silent = false) {
    this.lit = lit;
    this.glow.setAlpha(lit ? 0.85 : 0.18);
    if (lit) this.haze?.start();
    else this.haze?.stop();
    if (lit && !silent) {
      this.scene.cameras.main.flash(160, 120, 20, 30);
      this.scene.tweens.add({
        targets: this.glow,
        scale: { from: 1.9, to: 0.85 },
        duration: 520,
        ease: "Cubic.easeOut",
      });
      // onde de choc rouge
      const ring = this.scene.add.circle(0, BOWL_Y, 8);
      ring.setStrokeStyle(3, 0xd23a44, 0.9);
      this.root.add(ring);
      this.scene.tweens.add({
        targets: ring,
        scale: 9,
        alpha: 0,
        duration: 620,
        ease: "Cubic.easeOut",
        onComplete: () => ring.destroy(),
      });
    }
  }

  /** Coulees, gouttes et flaques. */
  private drawBlood(time: number, delta: number) {
    const g = this.blood;
    g.clear();

    const surface = this.lit ? 0xc42734 : 0x431417;
    const stream = this.lit ? 0x9c1c28 : 0x300f12;
    const shine = this.lit ? 0xff8a92 : 0x6a2a2f;
    const act = this.lit ? 1 : 0.28;

    // surface du bassin : ondulation lente
    const wob = 1 + Math.sin(time / 520) * 0.02;
    g.fillStyle(surface, 1);
    g.fillEllipse(0, BOWL_Y + 1, (BOWL_RX * 2 - 10) * wob, 12 * wob);
    // reflet specluaire qui glisse
    const sx = Math.sin(time / 1400) * 14;
    g.fillStyle(shine, this.lit ? 0.45 : 0.18);
    g.fillEllipse(sx, BOWL_Y - 1, 16, 3.5);

    for (const r of this.rivulets) {
      const breathe = 0.72 + Math.sin(time * r.speed + r.phase) * 0.28;
      const len = r.reach * breathe * (this.lit ? 1 : 0.45);
      const top = BOWL_Y + 4;
      const edgeCurve = r.x * 0.18; // les coulees rentrent vers le fut

      // ruban qui s'affine
      g.fillStyle(stream, 0.92);
      g.beginPath();
      g.moveTo(r.x - r.width, top);
      g.lineTo(r.x + r.width, top);
      g.lineTo(r.x + edgeCurve + r.width * 0.35, top + len);
      g.lineTo(r.x + edgeCurve - r.width * 0.35, top + len);
      g.closePath();
      g.fillPath();
      // goutte terminale
      g.fillStyle(surface, 0.95);
      g.fillCircle(r.x + edgeCurve, top + len, r.width * 0.85);

      // detachement periodique
      if (this.lit) {
        r.dropDelay -= delta;
        if (r.drop < 0 && r.dropDelay <= 0) {
          r.drop = 0;
          r.dropDelay = 1400 + Math.random() * 1600;
        }
        if (r.drop >= 0) {
          r.drop += delta / 620;
          const fromY = top + len;
          const dy = fromY + (0 - fromY) * Math.min(1, r.drop * r.drop);
          g.fillStyle(surface, 0.9);
          g.fillEllipse(r.x + edgeCurve, dy, r.width * 1.5, r.width * 2.4);
          if (r.drop >= 1) {
            r.drop = -1;
            this.pools.push({ x: r.x + edgeCurve, life: 0, ttl: 1500 });
          }
        }
      } else {
        r.drop = -1;
      }
    }

    // flaques au sol
    for (const p of this.pools) {
      p.life += delta;
      const t = Math.min(1, p.life / p.ttl);
      g.fillStyle(stream, (1 - t) * 0.65 * act);
      g.fillEllipse(p.x, -2, 6 + t * 22, 2 + t * 5);
    }
    this.pools = this.pools.filter((p) => p.life < p.ttl);
  }

  /** Invite de proximite + activation. A appeler chaque frame. */
  tick(playerX: number, time: number, delta = 16) {
    const near = Math.abs(playerX - this.x) < RANGE;

    this.drawBlood(time, delta);

    // respiration de la lueur
    const pulse = this.lit ? 0.78 + Math.sin(time / 380) * 0.14 : 0.16 + Math.sin(time / 900) * 0.05;
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
