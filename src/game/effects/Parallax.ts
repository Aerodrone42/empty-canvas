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
      // filtrage lineaire : le jeu est en pixelArt (NEAREST) ce qui rendait
      // cette peinture etiree tres crenelee -> on lisse cette texture seule.
      scene.textures.get(this.def.far).setFilter(Phaser.Textures.FilterMode.LINEAR);
      scene.add
        .image(0, topWorldY, this.def.far)
        .setOrigin(0, 0)
        .setScrollFactor(1)
        .setDepth(-30)
        .setDisplaySize(roomWidth, drawH);
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



    this.addAmbience(viewW, viewH, floorScreenY);
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

