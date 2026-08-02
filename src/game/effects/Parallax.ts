import Phaser from "phaser";

import { BACKDROPS, type BackdropDef, type BackdropKey } from "@/game/assets";
import type { SegmentDef } from "@/game/roomConfig";

/**
 * Decor de salle.
 *
 * Deux modes :
 *  - salle simple : UNE peinture repetee sur toute la largeur, ancree au
 *    monde (scrollFactor 1), le dallage defile a la vitesse des pas.
 *  - salle segmentee (la marche vers le Trone) : chaque troncon a sa propre
 *    peinture, son voile d'ambiance et sa hauteur de dessin. Les jointures
 *    passent par un rideau d'ombre progressif, ce qui donne une transition
 *    douce de decor et une impression de perspective qui s'ouvre.
 */

/** part de la peinture situee sous la ligne de sol jouable */
const BELOW_FLOOR = 0.06;
/** debordement d'une peinture sous le rideau d'ombre voisin */
const SEG_PAD = 220;
/** demi-largeur du rideau d'ombre a chaque jointure */
const SEAM = 300;

export type ParallaxOptions = {
  segments?: SegmentDef[];
  floorTexture?: string;
  onSegment?: (segment: SegmentDef, index: number) => void;
};

export class Parallax {
  readonly def: BackdropDef;
  private segments: SegmentDef[] = [];
  private onSegment?: (segment: SegmentDef, index: number) => void;
  private currentSegment = -1;

  constructor(
    private scene: Phaser.Scene,
    key: BackdropKey,
    floorY: number,
    roomHeight: number,
    roomWidth: number,
    options: ParallaxOptions = {},
  ) {
    this.def = BACKDROPS[key];
    this.segments = options.segments ?? [];
    this.onSegment = options.onSegment;

    const cam = scene.cameras.main;
    const viewW = cam.width;
    const viewH = cam.height;

    const camTop = Math.max(0, roomHeight - viewH);
    const floorScreenY = floorY - camTop;

    if (this.segments.length > 0) {
      this.buildSegments(floorY, viewH, roomHeight);
      if (options.floorTexture) {
        this.buildFloor(options.floorTexture, floorY, roomHeight, roomWidth);
      }
      this.addAmbience(viewW, viewH, floorScreenY, true);
      return;
    }

    const drawH = viewH * 1.12;

    // la peinture descend legerement sous la ligne de sol pour que le
    // dallage passe sous les pieds du heros sans laisser de vide
    const bottomWorldY = floorY + drawH * BELOW_FLOOR;
    const topWorldY = bottomWorldY - drawH;

    // rendu d'origine des autres salles : peinture repetee a l'echelle
    const source = scene.textures.get(this.def.far).getSourceImage();
    const srcH = source.height || 1;
    const scale = drawH / srcH;

    scene.add
      .tileSprite(0, topWorldY, roomWidth, drawH, this.def.far)
      .setOrigin(0, 0)
      .setScrollFactor(1)
      .setDepth(-30)
      .setTileScale(scale, scale);

    this.addAmbience(viewW, viewH, floorScreenY);
  }

  /** Peintures successives + voiles + rideaux d'ombre aux jointures. */
  private buildSegments(floorY: number, viewH: number, roomHeight: number) {
    const scene = this.scene;
    const last = this.segments.length - 1;

    this.segments.forEach((seg, i) => {
      // la peinture grandit doucement vers le Trone : les voutes montent,
      // l'espace parait s'ouvrir a mesure que le heros avance
      const grow = 1.1 + (last > 0 ? (i / last) * 0.24 : 0);
      const drawH = viewH * grow;
      const bottomWorldY = floorY + drawH * BELOW_FLOOR;
      const topWorldY = bottomWorldY - drawH;

      const key = scene.textures.exists(seg.bg) ? seg.bg : this.def.far;
      const source = scene.textures.get(key).getSourceImage();
      const srcH = source.height || 1;
      const scale = drawH / srcH;

      const from = Math.max(0, seg.from - SEG_PAD);
      const to = seg.to + SEG_PAD;

      scene.add
        .tileSprite(from, topWorldY, to - from, drawH, key)
        .setOrigin(0, 0)
        .setScrollFactor(1)
        .setDepth(-30 + i * 0.01)
        .setTileScale(scale, scale);

      // voile d'ambiance propre au troncon, ancre au monde
      scene.add
        .rectangle(seg.from, 0, seg.to - seg.from, roomHeight, seg.tint, seg.tintAlpha)
        .setOrigin(0, 0)
        .setScrollFactor(1)
        .setDepth(-8);

      // rideau d'ombre a la jointure avec le troncon suivant
      if (i < last) {
        const g = scene.add.graphics().setScrollFactor(1).setDepth(-7);
        g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.96, 0, 0.96);
        g.fillRect(seg.to - SEAM, 0, SEAM, roomHeight);
        g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.96, 0, 0.96, 0);
        g.fillRect(seg.to, 0, SEAM, roomHeight);
      }
    });
  }

  /** Dallage repete sous les pieds du heros, cale sur la ligne de sol. */
  private buildFloor(
    texture: string,
    floorY: number,
    roomHeight: number,
    roomWidth: number,
  ) {
    const scene = this.scene;
    if (!scene.textures.exists(texture)) return;

    const top = floorY - 26;
    const h = roomHeight - top + 40;
    const source = scene.textures.get(texture).getSourceImage();
    const srcH = source.height || 1;
    const scale = h / srcH;

    scene.add
      .tileSprite(0, top, roomWidth, h, texture)
      .setOrigin(0, 0)
      .setScrollFactor(1)
      .setDepth(-12)
      .setAlpha(0.9)
      .setTileScale(scale, scale);
  }

  /** Voile colore, poussieres flottantes, braises et vignettage. */
  private addAmbience(
    viewW: number,
    viewH: number,
    floorScreenY: number,
    dense = false,
  ) {
    const scene = this.scene;

    if (!dense) {
      scene.add
        .rectangle(0, 0, viewW, viewH, this.def.tint, this.def.tintAlpha)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(-5);
    }

    this.ensureDustTexture();

    const dust = scene.add
      .particles(0, 0, "fx-dust", {
        x: { min: 0, max: viewW },
        y: { min: 0, max: floorScreenY },
        lifespan: { min: 4000, max: 9000 },
        speedY: { min: -14, max: 10 },
        speedX: { min: -12, max: 12 },
        scale: { min: 0.4, max: 1.3 },
        alpha: { start: 0, end: 0 },
        tint: this.def.dust,
        quantity: 1,
        frequency: dense ? 110 : 240,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setScrollFactor(0.35)
      .setDepth(-6);

    dust.setParticleAlpha({ start: 0.5, end: 0 });
    this.dust = dust;

    if (!dense) return;

    // braises rouges qui montent du sol
    const embers = scene.add
      .particles(0, 0, "fx-dust", {
        x: { min: 0, max: viewW },
        y: { min: floorScreenY - 40, max: floorScreenY + 10 },
        lifespan: { min: 2200, max: 4200 },
        speedY: { min: -46, max: -18 },
        speedX: { min: -10, max: 10 },
        scale: { min: 0.3, max: 0.8 },
        alpha: { start: 0, end: 0 },
        tint: 0xff5a3c,
        quantity: 1,
        frequency: 260,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setScrollFactor(0.5)
      .setDepth(-6);

    embers.setParticleAlpha({ start: 0.7, end: 0 });

    // vignettage lateral : les extremites du couloir se perdent dans le noir
    const vw = Math.round(viewW * 0.22);
    for (const left of [true, false]) {
      const g = scene.add.graphics().setScrollFactor(0).setDepth(-4);
      g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.85, 0, 0.85, 0);
      g.fillRect(left ? 0 : viewW - vw, 0, vw, viewH);
      if (!left) {
        g.clear();
        g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.85, 0, 0.85);
        g.fillRect(viewW - vw, 0, vw, viewH);
      }
    }
  }

  private dust?: Phaser.GameObjects.Particles.ParticleEmitter;

  /** Petite texture ronde pour les poussieres, generee une seule fois. */
  private ensureDustTexture() {
    if (this.scene.textures.exists("fx-dust")) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture("fx-dust", 6, 6);
    g.destroy();
  }

  /**
   * Salle simple : rien a calculer. Salle segmentee : on suit le troncon
   * courant pour changer la couleur des poussieres et prevenir la scene.
   */
  update(worldX = 0) {
    if (this.segments.length === 0) return;

    const i = this.segments.findIndex((s) => worldX >= s.from && worldX < s.to);
    const index = i < 0 ? this.segments.length - 1 : i;
    if (index === this.currentSegment) return;

    this.currentSegment = index;
    const seg = this.segments[index];
    this.dust?.setParticleTint(seg.dust);
    this.onSegment?.(seg, index);
  }
}
