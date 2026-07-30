import Phaser from "phaser";

/**
 * Grosse veine de chair qui court sur toute la longueur du corridor.
 *
 * Purement decoratif : deux bandes tuilees posees contre le mur du fond,
 * rendues DERRIERE les statues (depth -25 contre -20) et derriere le heros.
 * Elles gonflent et se retractent en battements decales, comme un vaisseau
 * qui pompe le sang le long du couloir.
 */

/** hauteur affichee de la veine principale */
const MAIN_H = 150;
/** hauteur affichee de la veine secondaire */
const THIN_H = 84;

export class CorridorVein {
  private readonly parts: Phaser.GameObjects.TileSprite[] = [];

  constructor(scene: Phaser.Scene, floorY: number, roomWidth: number) {
    const tex = scene.textures.get("corridor-vein").getSourceImage();
    const srcW = tex.width || 1;
    const srcH = tex.height || 1;

    // veine principale : a hauteur de poitrine du mur, elle traverse la salle
    const main = this.makeBand(scene, roomWidth, MAIN_H, floorY - 300, srcW, srcH, {
      depth: -25,
      alpha: 0.72,
      tint: 0x6d1017,
      scrollFactor: 0.92,
    });

    // veine secondaire : plus fine, plus haute, plus sombre, battement decale
    const thin = this.makeBand(scene, roomWidth, THIN_H, floorY - 520, srcW, srcH, {
      depth: -26,
      alpha: 0.5,
      tint: 0x460a10,
      scrollFactor: 0.86,
    });

    this.pulse(scene, main, 1.22, 1580, 0);
    this.pulse(scene, thin, 1.14, 2260, 420);

    // leger flux interne : la matiere derive tres lentement dans la veine
    scene.tweens.add({
      targets: main,
      tilePositionX: srcW,
      duration: 60000,
      repeat: -1,
    });
    scene.tweens.add({
      targets: thin,
      tilePositionX: -srcW,
      duration: 90000,
      repeat: -1,
    });
  }

  private makeBand(
    scene: Phaser.Scene,
    roomWidth: number,
    height: number,
    y: number,
    srcW: number,
    srcH: number,
    opts: { depth: number; alpha: number; tint: number; scrollFactor: number },
  ) {
    const scale = height / srcH;
    const band = scene.add
      .tileSprite(0, y, roomWidth / scale, srcH, "corridor-vein")
      .setOrigin(0, 0.5)
      .setScale(scale)
      .setScrollFactor(opts.scrollFactor)
      .setDepth(opts.depth)
      .setAlpha(opts.alpha)
      .setTint(opts.tint)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    // conserve l'echelle horizontale d'origine, seule la verticale respire
    band.setData("baseScaleY", scale);
    this.parts.push(band);
    return band;
  }

  /** Battement organique : gonflement rapide, retraction plus lente. */
  private pulse(
    scene: Phaser.Scene,
    band: Phaser.GameObjects.TileSprite,
    amount: number,
    duration: number,
    delay: number,
  ) {
    const base = band.getData("baseScaleY") as number;
    const alpha = band.alpha;

    scene.tweens.add({
      targets: band,
      scaleY: base * amount,
      alpha: Math.min(1, alpha + 0.14),
      duration: duration * 0.35,
      delay,
      ease: "Sine.easeOut",
      yoyo: true,
      hold: 90,
      repeat: -1,
      repeatDelay: duration * 0.4,
    });
  }

  destroy() {
    for (const p of this.parts) p.destroy();
    this.parts.length = 0;
  }
}
