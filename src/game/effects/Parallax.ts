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
const SPEEDS = [0.1, 0.35] as const;

type Layer = {
  sprite: Phaser.GameObjects.TileSprite;
  speed: number;
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
  ) {
    this.def = BACKDROPS[key];

    const cam = scene.cameras.main;
    const viewW = cam.width;
    const viewH = cam.height;

    // ligne de sol exprimee en coordonnees ecran : la camera est bloquee
    // en bas de la salle la plupart du temps
    const floorScreenY = floorY - Math.max(0, roomHeight - viewH);

    // --- calque lointain : la peinture, plein cadre ------------------
    this.addTiled(this.def.far, viewW, viewH * 1.12, floorScreenY, -30, SPEEDS[0]);

    // --- calque median : les piliers poses sur le sol ----------------
    this.addTiled(this.def.mid, viewW, viewH * 0.78, floorScreenY, -20, SPEEDS[1]);

    // --- tablier de sol : prolonge le dallage jusqu'au bas de l'ecran -
    this.addApron(viewW, viewH, floorScreenY);

    // --- calque proche : cadre fixe, jamais repete -------------------
    this.frame = scene.add
      .image(0, floorScreenY - viewH * 1.04, this.def.near)
      .setOrigin(0, 0)
      .setDisplaySize(viewW, viewH * 1.04)
      .setScrollFactor(0)
      .setDepth(-8);

    this.addAmbience(viewW, viewH, floorScreenY);
  }

  /**
   * Sous la ligne de sol, les images de decor n'ont plus de matiere.
   * On y prolonge la bande basse du calque median (le dallage) puis on
   * l'assombrit en degrade, plutot que de poser un aplat de couleur.
   */
  private addApron(viewW: number, viewH: number, floorScreenY: number) {
    const apronH = Math.max(0, viewH - floorScreenY);
    if (apronH <= 0) return;

    const key = this.def.mid;
    const source = this.scene.textures.get(key).getSourceImage();
    const srcH = source.height || apronH;
    // meme echelle que le calque median pour que le dallage reste continu
    const scale = (viewH * 0.78) / srcH;

    const apron = this.scene.add
      .tileSprite(0, floorScreenY, viewW, apronH, key)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-19);

    apron.setTileScale(scale, scale);
    // on affiche la bande la plus basse de l'image (le dallage au sol)
    apron.tilePositionY = srcH - apronH / scale;
    this.layers.push({ sprite: apron, speed: SPEEDS[1] });

    // degrade d'assombrissement pour poser les pieds et garder le HUD lisible
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const h = apronH / steps;
      this.scene.add
        .rectangle(0, floorScreenY + i * h, viewW, h + 1, 0x000000, 0.12 + i * 0.13)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(-9);
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
    this.layers.push({ sprite, speed });
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
      layer.sprite.tilePositionX = (scrollX * layer.speed) / layer.sprite.tileScaleX;
    }
  }
}
