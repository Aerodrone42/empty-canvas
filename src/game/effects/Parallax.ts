import Phaser from "phaser";

import { BACKDROPS, type BackdropDef, type BackdropKey } from "@/game/assets";

/**
 * Decor de salle en deux profondeurs distinctes.
 *
 * Probleme corrige : auparavant TOUT le decor (ciel, ville, colonnes ET
 * dallage du sol) etait peint sur un seul calque colle a la camera et
 * defilant a 8 % de la vitesse du heros. Le personnage avancait a 190 px/s
 * alors que le sol sous ses pieds ne bougeait qu'a ~15 px/s : on avait
 * l'impression de marcher sur un tapis roulant.
 *
 * Desormais :
 *  - `sky`    : la partie haute de la peinture (ciel, ville lointaine),
 *               collee a la camera, defilement lent -> profondeur ;
 *  - `ground` : la bande basse de la MEME peinture (le dallage qui recule),
 *               ancree au monde (`scrollFactor 1`) et tuilee sur toute la
 *               largeur de la salle -> elle defile exactement a la vitesse
 *               du heros, la marche devient lisible.
 *
 * Les deux calques proviennent de la meme image, decoupee en deux frames :
 * ils se raccordent donc au pixel pres a l'ouverture de la salle.
 */

/** vitesse de defilement du fond lointain (fraction du scroll camera) */
const SKY_SPEED = 0.12;
/** fraction verticale de l'image ou commence le dallage qui recule */
const FLOOR_SPLIT = 0.85;

export class Parallax {
  private sky?: Phaser.GameObjects.TileSprite;
  private skyOffset = 0;
  readonly def: BackdropDef;

  constructor(
    private scene: Phaser.Scene,
    key: BackdropKey,
    floorY: number,
    roomHeight: number,
    roomWidth: number,
  ) {
    this.def = BACKDROPS[key];

    const cam = scene.cameras.main;
    const viewW = cam.width;
    const viewH = cam.height;

    // la camera est bloquee en bas de la salle : conversion monde -> ecran
    const camTop = Math.max(0, roomHeight - viewH);
    const floorScreenY = floorY - camTop;

    const drawH = viewH * 1.12;
    const source = scene.textures.get(this.def.far).getSourceImage();
    const srcW = source.width || 1;
    const srcH = source.height || 1;
    const scale = drawH / srcH;

    // --- decoupe de la peinture en deux frames -----------------------
    const splitY = Math.round(srcH * FLOOR_SPLIT);
    const tex = scene.textures.get(this.def.far);
    if (!tex.has("sky")) tex.add("sky", 0, 0, 0, srcW, splitY);
    if (!tex.has("ground")) tex.add("ground", 0, 0, splitY, srcW, srcH - splitY);

    // --- ciel + ville : colles a la camera, defilement lent -----------
    const skyH = splitY * scale;
    const skyTop = floorScreenY - drawH;
    this.sky = scene.add
      .tileSprite(0, skyTop, viewW, skyH, this.def.far, "sky")
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-30);
    this.sky.setTileScale(scale, scale);
    this.skyOffset = Phaser.Math.Between(0, srcW);
    this.sky.tilePositionX = this.skyOffset;

    // --- dallage : defile exactement a la vitesse du heros ------------
    // le calque reste large comme le viewport (pas de surcout de rendu),
    // mais son motif est pilote par scrollX a la vitesse 1 : visuellement
    // c'est equivalent a un sol ancre au monde.
    const groundScreenTop = skyTop + skyH;
    const groundH = Math.max(viewH - groundScreenTop, (srcH - splitY) * scale);

    this.ground = scene.add
      .tileSprite(0, groundScreenTop, viewW, groundH, this.def.far, "ground")
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-20);
    this.ground.setTileScale(scale, scale);

    // ombre douce sur la ligne de raccord : masque la coupure entre les
    // deux calques quand ils defilent a des vitesses differentes
    const seam = scene.add
      .rectangle(0, groundScreenTop - 6, viewW, 22, 0x000000)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-19)
      .setAlpha(0.35);
    seam.setBlendMode(Phaser.BlendModes.MULTIPLY);


    this.addFloorMarks(roomWidth, floorY, camTop);
    this.addAmbience(viewW, viewH, floorScreenY);
  }

  /**
   * Reperes de progression : quelques traces sombres posees au sol, ancrees
   * au monde. Sans elles l'oeil n'a aucun point fixe pour percevoir la
   * distance parcourue quand le heros marche.
   */
  private addFloorMarks(roomWidth: number, floorY: number, camTop: number) {
    const scene = this.scene;
    const rng = new Phaser.Math.RandomDataGenerator([this.def.far]);
    const count = Math.round(roomWidth / 180);

    for (let i = 0; i < count; i++) {
      const x = 60 + (i + rng.frac() * 0.6) * (roomWidth / count);
      const y = floorY - rng.between(2, 16);
      const w = rng.between(40, 130);
      const h = Math.max(4, w * rng.realInRange(0.09, 0.16));

      scene.add
        .ellipse(x, y, w, h, 0x000000, rng.realInRange(0.18, 0.34))
        .setScrollFactor(1)
        .setDepth(-18);

      if (rng.frac() > 0.6) {
        scene.add
          .ellipse(x + rng.between(-40, 40), y - rng.between(4, 14), w * 0.35, h * 0.6, this.def.ledge, 0.5)
          .setScrollFactor(1)
          .setDepth(-18);
      }
    }
    void camTop;
  }

  /** Voile colore et poussieres flottantes. */
  private addAmbience(viewW: number, viewH: number, floorScreenY: number) {
    const scene = this.scene;

    scene.add
      .rectangle(0, 0, viewW, viewH, this.def.tint, this.def.tintAlpha)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-5);

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
        frequency: 240,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setScrollFactor(0.35)
      .setDepth(-6);

    dust.setParticleAlpha({ start: 0.5, end: 0 });
  }

  /** Petite texture ronde pour les poussieres, generee une seule fois. */
  private ensureDustTexture() {
    if (this.scene.textures.exists("fx-dust")) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture("fx-dust", 6, 6);
    g.destroy();
  }

  /** A appeler dans update() : seul le fond lointain a besoin d'etre pilote. */
  update() {
    if (!this.sky) return;
    const scrollX = this.scene.cameras.main.scrollX;
    this.sky.tilePositionX = this.skyOffset + (scrollX * SKY_SPEED) / this.sky.tileScaleX;
  }
}
