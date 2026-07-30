import Phaser from "phaser";

import { BACKDROPS, FRAME_SPACING, SHEETS } from "../assets";
import { MUSIC_AMBIENT, MUSIC_COMBAT } from "../audio/Music";
import ambientTrack from "@/assets/music_obscura_piano.mp3.asset.json";
import combatTrack from "@/assets/music_sinister_power.mp3.asset.json";


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

    // colonne de fin de salle (visceres animes)
    this.load.image("gate-column-shaft", "/assets/sprites/props/gate_column_shaft.png");
    this.load.image("gate-column-base", "/assets/sprites/props/gate_column_base.png");

    // bande-son : ambiance piano + theme de combat
    this.load.audio(MUSIC_AMBIENT, ambientTrack.url);
    this.load.audio(MUSIC_COMBAT, combatTrack.url);
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

    // Saut du Vigile : la feuille est decoupee en trois phases.
    this.anims.create({
      key: "vigile-crouch",
      frames: this.anims.generateFrameNumbers("vigile-jump", { start: 0, end: 1 }),
      frameRate: 22,
      repeat: 0,
    });
    this.anims.create({
      key: "vigile-rise",
      frames: this.anims.generateFrameNumbers("vigile-jump", { start: 2, end: 2 }),
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: "vigile-apex",
      frames: this.anims.generateFrameNumbers("vigile-jump", { start: 3, end: 3 }),
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: "vigile-fall",
      frames: this.anims.generateFrameNumbers("vigile-jump", { start: 4, end: 4 }),
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: "vigile-land",
      frames: this.anims.generateFrameNumbers("vigile-jump", { start: 5, end: 5 }),
      frameRate: 1,
      repeat: 0,
    });

    // Esquive du Vigile : depart/plongee, roulade, recuperation.
    this.anims.create({
      key: "vigile-dodge-start",
      frames: this.anims.generateFrameNumbers("vigile-dodge", { start: 0, end: 2 }),
      frameRate: 26,
      repeat: 0,
    });
    this.anims.create({
      key: "vigile-dodge-roll",
      frames: this.anims.generateFrameNumbers("vigile-dodge", { start: 3, end: 4 }),
      frameRate: 18,
      repeat: 0,
    });
    this.anims.create({
      key: "vigile-dodge-recover",
      frames: this.anims.generateFrameNumbers("vigile-dodge", { start: 5, end: 7 }),
      frameRate: 16,
      repeat: 0,
    });

    this.scene.start("game");
  }
}

