import Phaser from "phaser";

import { FRAME_SPACING, SHEETS } from "../assets";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    for (const sheet of SHEETS) {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
        spacing: FRAME_SPACING,
      });
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
