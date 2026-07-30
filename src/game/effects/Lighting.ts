import Phaser from "phaser";

/**
 * Eclairage de salle : torcheres vacillantes + lent cycle jour/nuit.
 *
 * Regle absolue : rien n'est dessine au dessus des personnages. Le voile
 * d'obscurite vit a une profondeur negative (derriere le heros et les
 * creatures) et son alpha est plafonne, si bien que la silhouette du
 * Vigile reste toujours lisible. Le HUD est du DOM : il n'est pas touche.
 */

/** profondeurs : tout reste sous les entites (depth >= 0) */
const DEPTH_VEIL = -4;
const DEPTH_GLOW = -4.5;
const DEPTH_HERO_LIGHT = -3.5;

/** alpha maximal du voile : au dela le decor devient illisible */
const VEIL_MAX = 0.42;
const VEIL_MIN = 0.1;

/** duree d'un cycle complet jour -> nuit -> jour (ms) */
const CYCLE_MS = 96000;

type Torch = {
  glow: Phaser.GameObjects.Image;
  baseScale: number;
  phase: number;
};

export class Lighting {
  private veil: Phaser.GameObjects.Rectangle;
  private torches: Torch[] = [];
  private heroLight: Phaser.GameObjects.Image;
  private t = 0;

  constructor(
    private scene: Phaser.Scene,
    roomWidth: number,
    floorY: number,
    private warmTint = 0xffa14a,
  ) {
    const cam = scene.cameras.main;

    this.ensureGlowTexture();

    // --- torcheres reparties le long de la nef -----------------------
    const count = Math.max(3, Math.round(roomWidth / 520));
    for (let i = 0; i < count; i++) {
      const x = ((i + 0.5) * roomWidth) / count;
      const y = floorY - Phaser.Math.Between(210, 260);
      const baseScale = Phaser.Math.FloatBetween(1.5, 2.1);

      const glow = scene.add
        .image(x, y, "fx-glow")
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(warmTint)
        .setAlpha(0.28)
        .setScale(baseScale)
        .setDepth(DEPTH_GLOW);

      // petite flamme au coeur du halo
      const flame = scene.add
        .image(x, y, "fx-glow")
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(0xffd9a0)
        .setAlpha(0.5)
        .setScale(baseScale * 0.28)
        .setDepth(DEPTH_GLOW);

      scene.tweens.add({
        targets: flame,
        alpha: { from: 0.5, to: 0.28 },
        scale: { from: baseScale * 0.3, to: baseScale * 0.24 },
        duration: Phaser.Math.Between(420, 780),
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });

      this.torches.push({ glow, baseScale, phase: Math.random() * Math.PI * 2 });
    }

    // --- halo doux qui suit le heros : garantit sa lisibilite --------
    this.heroLight = scene.add
      .image(0, 0, "fx-glow")
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0xff8a6a)
      .setAlpha(0.16)
      .setScale(1.9)
      .setDepth(DEPTH_HERO_LIGHT);

    // --- voile d'obscurite, fixe a l'ecran, derriere les entites -----
    this.veil = scene.add
      .rectangle(0, 0, cam.width, cam.height, 0x080a16, VEIL_MIN)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_VEIL);
  }

  /** Texture de halo radial, generee une seule fois. */
  private ensureGlowTexture() {
    if (this.scene.textures.exists("fx-glow")) return;
    const size = 256;
    const tex = this.scene.textures.createCanvas("fx-glow", size, size);
    const ctx = tex?.getContext();
    if (!tex || !ctx) return;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
  }

  /**
   * @param delta ms depuis la frame precedente
   * @param heroX,heroY position du heros pour son halo
   */
  update(delta: number, heroX: number, heroY: number) {
    this.t += delta;

    // cycle jour/nuit : 0 = plein jour, 1 = nuit profonde
    const night = 0.5 - 0.5 * Math.cos((this.t / CYCLE_MS) * Math.PI * 2);
    this.veil.setAlpha(VEIL_MIN + (VEIL_MAX - VEIL_MIN) * night);
    this.veil.setFillStyle(
      Phaser.Display.Color.Interpolate.ColorWithColor(
        new Phaser.Display.Color(0x2a, 0x1a, 0x18),
        new Phaser.Display.Color(0x08, 0x0a, 0x16),
        100,
        Math.round(night * 100),
      ).color ?? 0x080a16,
      this.veil.fillAlpha,
    );

    // les torcheres brillent davantage la nuit et vacillent en continu
    for (const torch of this.torches) {
      const flicker = 0.85 + 0.15 * Math.sin(this.t / 90 + torch.phase);
      torch.glow.setAlpha((0.18 + 0.24 * night) * flicker);
      torch.glow.setScale(torch.baseScale * (0.97 + 0.06 * flicker));
    }

    // le halo du heros se renforce quand il fait sombre
    this.heroLight.setPosition(heroX, heroY - 60);
    this.heroLight.setAlpha(0.1 + 0.16 * night);
  }
}
