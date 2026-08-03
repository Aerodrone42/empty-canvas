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
 *    peinture, ancree au meme monde que le sol et les objets physiques. Les
 *    jointures passent par un fondu progressif entre les deux peintures.
 */

/** part de la peinture situee sous la ligne de sol jouable */
const BELOW_FLOOR = 0.06;
/** demi-longueur du fondu entre deux lieux : transition totale de 1040 px */
const TRANSITION_HALF = 520;
export type ParallaxOptions = {
  segments?: SegmentDef[];
  floorTexture?: string;
  onSegment?: (segment: SegmentDef, index: number) => void;
};

export class Parallax {
  readonly def: BackdropDef;
  private segments: SegmentDef[] = [];
  private segmentPaintings: Phaser.GameObjects.Image[] = [];
  private segmentVeil?: Phaser.GameObjects.Rectangle;
  private viewWidth = 0;
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

  /**
   * Peintures plein ecran superposees. Le sol en perspective appartient a
   * chaque peinture : aucun dallage artificiel ne vient plus le recouvrir.
   * Le changement de lieu se fait ensuite par fondu dans update(), sans
   * bord vertical ni redemarrage visible de texture.
   */
  private buildSegments(floorY: number, viewH: number, roomHeight: number) {
    const scene = this.scene;
    const cam = scene.cameras.main;
    this.viewWidth = cam.width;

    this.segments.forEach((seg, i) => {
      const key = scene.textures.exists(seg.bg) ? seg.bg : this.def.far;
      const source = scene.textures.get(key).getSourceImage();
      const srcH = source.height || 1;
      const drawH = viewH * 1.08;
      const bottomWorldY = floorY + drawH * BELOW_FLOOR;

      // Chaque peinture doit couvrir son troncon, un ecran de debord de
      // chaque cote et la zone de fondu. Elle reste ainsi continue pendant
      // toute la traversee sans etre repositionnee par rapport au dallage.
      const segmentWidth = Math.max(0, seg.to - seg.from);
      const drawW = Math.max(
        (source.width || 1) * (drawH / srcH),
        segmentWidth + TRANSITION_HALF * 2,
      );

      // Le sol fait partie de la peinture : elle doit donc partager le meme
      // espace monde (facteur 1) que l'autel, les torches et les collisions.
      const segCenter = (seg.from + seg.to) / 2;

      const painting = scene.add
        .image(segCenter, bottomWorldY, key)
        .setOrigin(0.5, 1)
        .setScrollFactor(1)
        .setDepth(-30 + i * 0.01)
        .setDisplaySize(drawW, drawH)
        .setAlpha(i === 0 ? 1 : 0);
      this.segmentPaintings.push(painting);
    });

    this.segmentVeil = scene.add
      .rectangle(0, 0, cam.width, viewH, this.segments[0].tint, this.segments[0].tintAlpha)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-8);
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

    let fromIndex = index;
    let toIndex = index;
    let blend = 0;
    for (let boundary = 0; boundary < this.segments.length - 1; boundary += 1) {
      const seamX = this.segments[boundary].to;
      if (worldX < seamX - TRANSITION_HALF || worldX > seamX + TRANSITION_HALF) continue;
      fromIndex = boundary;
      toIndex = boundary + 1;
      blend = Phaser.Math.Clamp(
        (worldX - (seamX - TRANSITION_HALF)) / (TRANSITION_HALF * 2),
        0,
        1,
      );
      // courbe douce : aucune acceleration visible au debut ou a la fin
      blend = blend * blend * (3 - 2 * blend);
      break;
    }

    this.segmentPaintings.forEach((painting, paintingIndex) => {
      const alpha = paintingIndex === fromIndex ? 1 - blend : paintingIndex === toIndex ? blend : 0;
      painting.setAlpha(alpha);
      // Position fixe dans le monde : aucun glissement par rapport au sol.
    });

    const from = this.segments[fromIndex];
    const to = this.segments[toIndex];
    const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(from.tint),
      Phaser.Display.Color.IntegerToColor(to.tint),
      1000,
      Math.round(blend * 1000),
    );
    this.segmentVeil
      ?.setFillStyle(Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b), 1)
      .setAlpha(Phaser.Math.Linear(from.tintAlpha, to.tintAlpha, blend));

    const dust = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(from.dust),
      Phaser.Display.Color.IntegerToColor(to.dust),
      1000,
      Math.round(blend * 1000),
    );
    this.dust?.setParticleTint(Phaser.Display.Color.GetColor(dust.r, dust.g, dust.b));

    if (index === this.currentSegment) return;

    this.currentSegment = index;
    const seg = this.segments[index];
    this.onSegment?.(seg, index);
  }
}
