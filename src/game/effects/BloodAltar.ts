import Phaser from "phaser";

import { isKeyJustDown } from "../input";
import { padFor } from "../input";
import { useGameStore } from "@/store/gameStore";

/**
 * Autel de Sang : point de sauvegarde place juste avant chaque affrontement
 * majeur. Tant qu'il est eteint, une invite apparait quand le heros s'approche.
 * Une fois scelle, il soigne a bloc et devient le point de reapparition.
 */

const TEX_GLOW = "blood-altar-glow";
const RANGE = 170;

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

export class BloodAltar {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private glow: Phaser.GameObjects.Image;
  private liquid: Phaser.GameObjects.Ellipse;
  private prompt: Phaser.GameObjects.Text;
  private embers?: Phaser.GameObjects.Particles.ParticleEmitter;
  private padWasDown = false;

  readonly x: number;
  private lit = false;

  constructor(scene: Phaser.Scene, x: number, floorY: number, lit = false) {
    this.scene = scene;
    this.x = x;
    ensureGlow(scene);

    const gfx = scene.add.graphics();
    // socle : trois blocs de pierre empiles, taille grossierement
    gfx.fillStyle(0x2a2226, 1);
    gfx.fillRect(-46, -30, 92, 30);
    gfx.fillStyle(0x34292d, 1);
    gfx.fillRect(-38, -76, 76, 46);
    gfx.fillStyle(0x3d3035, 1);
    gfx.fillRect(-56, -104, 112, 28);
    // veinures sombres
    gfx.lineStyle(2, 0x1b1416, 0.9);
    gfx.strokeRect(-56, -104, 112, 28);
    gfx.strokeRect(-38, -76, 76, 46);
    gfx.strokeRect(-46, -30, 92, 30);
    // vasque
    gfx.fillStyle(0x241c1f, 1);
    gfx.fillEllipse(0, -104, 108, 34);

    this.liquid = scene.add.ellipse(0, -105, 88, 24, 0x8e1420, 1);
    this.glow = scene.add.image(0, -118, TEX_GLOW).setScale(1.05).setBlendMode(Phaser.BlendModes.ADD);

    this.prompt = scene.add
      .text(0, -190, "", {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#e0b6ba",
        align: "center",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.root = scene.add
      .container(x, floorY, [gfx, this.liquid, this.glow, this.prompt])
      .setDepth(24);

    // gouttes qui debordent de la vasque une fois l'autel scelle
    if (scene.textures.exists("__WHITE")) {
      this.embers = scene.add.particles(x, floorY - 110, "__WHITE", {
        speed: { min: 8, max: 34 },
        angle: { min: 250, max: 290 },
        lifespan: 900,
        quantity: 1,
        frequency: 140,
        scale: { start: 2.4, end: 0 },
        alpha: { start: 0.8, end: 0 },
        tint: 0xd23a44,
        blendMode: Phaser.BlendModes.ADD,
      });
      this.embers.setDepth(25);
      this.embers.stop();
    }

    this.setLit(lit, true);
  }

  get isLit() {
    return this.lit;
  }

  private setLit(lit: boolean, silent = false) {
    this.lit = lit;
    this.liquid.setFillStyle(lit ? 0xc42734 : 0x4a1a1e, 1);
    this.glow.setAlpha(lit ? 0.85 : 0.18);
    if (lit) this.embers?.start();
    else this.embers?.stop();
    if (lit && !silent) {
      this.scene.cameras.main.flash(160, 120, 20, 30);
      this.scene.tweens.add({
        targets: this.glow,
        scale: { from: 2.1, to: 1.05 },
        duration: 520,
        ease: "Cubic.easeOut",
      });
    }
  }

  /** Invite de proximite + activation. A appeler chaque frame. */
  tick(playerX: number, time: number) {
    const near = Math.abs(playerX - this.x) < RANGE;

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
    this.embers?.destroy();
    this.root.destroy(true);
  }
}
