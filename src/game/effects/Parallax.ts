import Phaser from "phaser";

import { BACKDROPS, type BackdropDef, type BackdropKey } from "@/game/assets";

/**
 * Decor de salle : la peinture d'origine, entiere.
 *
 * Historique du bug : la peinture avait ete decoupee en deux (ciel / sol)
 * a 85 % de sa hauteur. Or le magnifique dallage en pierre occupe les
 * ~30 % du bas de l'image : la decoupe laissait le vrai sol colle au ciel
 * et etirait le simple bandeau sombre du bas sur toute la salle -> aplat
 * marronnasse.
 *
 * Desormais : UNE seule couche affiche l'image complete (ciel, colonnes,
 * dallage en perspective), repetee horizontalement sur la largeur de la
 * salle et ancree au monde (scrollFactor 1). Le dallage defile donc
 * exactement a la vitesse des pas, et rien n'est redessine en code.
 */

/** part de la peinture situee sous la ligne de sol jouable */
const BELOW_FLOOR = 0.06;

export class Parallax {
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

    const camTop = Math.max(0, roomHeight - viewH);
    const floorScreenY = floorY - camTop;

    const drawH = viewH * 1.12;

    // la peinture descend legerement sous la ligne de sol pour que le
    // dallage passe sous les pieds du heros sans laisser de vide
    const bottomWorldY = floorY + drawH * BELOW_FLOOR;
    const topWorldY = bottomWorldY - drawH;

    if (key === "corridor") {
      // fond panoramique : UNE seule image etiree sur toute la salle,
      // aucune repetition, aucune couture visible.
      scene.add
        .image(0, topWorldY, this.def.far)
        .setOrigin(0, 0)
        .setScrollFactor(1)
        .setDepth(-30)
        .setDisplaySize(roomWidth, drawH);

      this.addCorridorMidground(roomWidth, floorY, drawH);
    } else {
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
    }



    this.addAmbience(viewW, viewH, floorScreenY, key === "corridor");
  }

  /**
   * Couche intermediaire du corridor : arches de pierre placees devant le
   * fond, legerement plus lentes que le monde -> vraie sensation de
   * traversee au lieu d'un mur plat.
   */
  private addCorridorMidground(roomWidth: number, floorY: number, drawH: number) {
    const scene = this.scene;
    if (!scene.textures.exists("corridor-arch")) return;

    const src = scene.textures.get("corridor-arch").getSourceImage();
    const archH = drawH * 0.82;
    const scale = archH / (src.height || 1);
    const step = 600;

    for (let x = 260; x < roomWidth - 120; x += step) {
      const jitter = ((x / step) % 2 === 0 ? 1 : -1) * 24;
      scene.add
        .image(x + jitter, floorY + 8, "corridor-arch")
        .setOrigin(0.5, 1)
        .setScale(scale)
        .setScrollFactor(0.85, 1)
        .setDepth(-20)
        .setAlpha(0.9)
        .setTint(0x8d8a92);
    }
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

  /** Le decor est ancre au monde : plus aucun calcul par frame. */
  update() {}
}

