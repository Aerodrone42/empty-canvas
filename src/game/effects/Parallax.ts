import Phaser from "phaser";

import { BACKDROPS, type BackdropDef, type BackdropKey } from "@/game/assets";

/**
 * Decor de salle en trois calques de profondeur.
 *
 * Les feuilles fournies n'ont pas le meme role :
 *  - `far`  : peinture pleine, opaque, tuilable horizontalement ;
 *  - `mid`  : bande d'architecture posee au sol, fond transparent ;
 *  - `near` : cadre d'encadrement (rochers / chaines) a fond transparent,
 *             NON tuilable : il sert de vignette et reste fixe.
 *
 * Tous les calques sont fixes a la camera (scrollFactor 0) ; c'est
 * `tilePositionX` qui defile a des vitesses differentes pour les deux
 * premiers, ce qui donne la parallaxe meme quand la salle est bien plus
 * large que l'image source. Le bas de chaque image est cale sur la ligne
 * de sol, sinon l'architecture flotte.
 */

/** vitesses de defilement, du plus lointain au plus proche */
const SPEEDS = [0.15, 0.55] as const;

type Layer = {
  sprite: Phaser.GameObjects.TileSprite;
  speed: number;
  /** decalage initial : casse la symetrie des repetitions */
  offset: number;
};

export class Parallax {
  private layers: Layer[] = [];
  private frame?: Phaser.GameObjects.Image;
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

    // ligne de sol exprimee en coordonnees ecran : la camera est bloquee
    // en bas de la salle la plupart du temps
    const floorScreenY = floorY - Math.max(0, roomHeight - viewH);

    // --- calque lointain : la peinture, plein cadre ------------------
    // seul le fond profond defile lentement (ciel, flecheS lointaines)
    this.addTiled(this.def.far, viewW, viewH * 1.12, floorScreenY, -30, SPEEDS[0]);

    // --- calque median : l'architecture, ancree dans le monde ---------
    // Plus de repetition en continu : quelques massifs poses a des
    // endroits precis de la salle, solidaires du sol (scrollFactor 1),
    // donc ils ne "glissent" plus quand le joueur avance.
    this.addAnchoredMid(this.def.mid, viewH * 0.78, floorScreenY, roomWidth);

    // --- cadre rocheux : ancre aux deux extremites de la salle -------
    // (objets du monde : on les quitte vraiment quand on avance)
    const frameW = viewW * 0.42;
    const frameH = viewH * 1.04;
    this.frame = scene.add
      .image(0, floorScreenY, this.def.near)
      .setOrigin(0, 1)
      .setDisplaySize(frameW, frameH)
      .setScrollFactor(1)
      .setDepth(-8);
    scene.add
      .image(roomWidth, floorScreenY, this.def.near)
      .setOrigin(0, 1)
      .setDisplaySize(-frameW, frameH)
      .setScrollFactor(1)
      .setDepth(-8);

    this.addAmbience(viewW, viewH, floorScreenY);
  }

  /**
   * Pose l'architecture median comme de vrais objets du monde, espaces,
   * plutot qu'une colonnade repetee a l'infini.
   */
  private addAnchoredMid(
    textureKey: string,
    drawH: number,
    floorScreenY: number,
    roomWidth: number,
  ) {
    const source = this.scene.textures.get(textureKey).getSourceImage();
    const srcW = source.width || 1;
    const srcH = source.height || 1;
    const drawW = (srcW / srcH) * drawH;

    // un massif, puis un vide au moins aussi large : la salle respire
    const step = drawW * 2.1;

    for (let i = 0, x = -drawW * 0.15; x < roomWidth; i++, x += step) {
      this.scene.add
        .image(x, floorScreenY, textureKey)
        .setOrigin(0, 1)
        .setDisplaySize(i % 2 === 0 ? drawW : -drawW, drawH)
        .setScrollFactor(1)
        .setDepth(-20);
    }
  }

  /** Cree un calque tuile horizontalement, bas cale sur la ligne de sol. */
  private addTiled(
    textureKey: string,
    viewW: number,
    drawH: number,
    floorScreenY: number,
    depth: number,
    speed: number,
  ) {
    const source = this.scene.textures.get(textureKey).getSourceImage();
    const srcH = source.height || drawH;
    const scale = drawH / srcH;

    const sprite = this.scene.add
      .tileSprite(0, floorScreenY - drawH, viewW, drawH, textureKey)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth);

    sprite.setTileScale(scale, scale);
    const offset = Phaser.Math.Between(0, source.width || 0);
    sprite.tilePositionX = offset;
    this.layers.push({ sprite, speed, offset });
  }


  /** Voile colore, poussieres et vacillement de cierges. */
  private addAmbience(viewW: number, viewH: number, floorScreenY: number) {
    const scene = this.scene;

    // voile d'ambiance par dessus les calques, sous les personnages
    scene.add
      .rectangle(0, 0, viewW, viewH, this.def.tint, this.def.tintAlpha)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-5);

    this.ensureDustTexture();

    // cendres et poussieres flottantes, a mi-profondeur
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

    // vacillement des cierges sur le cadre proche
    if (this.frame) {
      scene.tweens.add({
        targets: this.frame,
        alpha: { from: 1, to: 0.88 },
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
    }
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

  /** A appeler dans update() : lie le defilement a la camera. */
  update() {
    const scrollX = this.scene.cameras.main.scrollX;
    for (const layer of this.layers) {
      layer.sprite.tilePositionX =
        layer.offset + (scrollX * layer.speed) / layer.sprite.tileScaleX;
    }
  }
}
