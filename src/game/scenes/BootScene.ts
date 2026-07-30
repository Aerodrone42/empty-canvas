import Phaser from "phaser";

import { BACKDROPS, FRAME_SPACING, SHEETS } from "../assets";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    for (const sheet of SHEETS) {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
        spacing: sheet.spacing ?? FRAME_SPACING,
      });
    }

    // decors de parallaxe : 4 scenes x 3 calques
    for (const def of Object.values(BACKDROPS)) {
      this.load.image(def.far, def.paths[0]);
      this.load.image(def.mid, def.paths[1]);
      this.load.image(def.near, def.paths[2]);
    }
  }


  create() {
    for (const sheet of SHEETS) {
      this.anims.create({
        key: `${sheet.key}-anim`,
        frames: this.anims.generateFrameNumbers(sheet.key, {
          start: 0,
          end: sheet.frameCount - 1,
        }),
        frameRate: sheet.frameRate,
        repeat: sheet.repeat,
      });
    }

    this.scene.start("game");
  }
}
