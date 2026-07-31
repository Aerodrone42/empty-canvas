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

    // statue de pleureuse (larmes de sang a l'approche du heros)
    this.load.image("statue-pleureuse", "/assets/sprites/props/weeping_statue.png");

    // amas de chair animes le long du mur du corridor
    this.load.spritesheet(
      "flesh-blob",
      "/assets/sprites/props/flesh_blob_spritesheet.png",
      { frameWidth: 240, frameHeight: 180, spacing: 0 },
    );

    // grosse veine animee du corridor (decor de fond)
    this.load.image("corridor-vein", "/assets/sprites/props/corridor_vein.png");

    // torchere sur pied : socle fixe + planche de flamme animee
    this.load.image("floor-torch-base", "/assets/sprites/props/floor_torch_base.png");
    this.load.spritesheet(
      "floor-torch-flame",
      "/assets/sprites/props/floor_torch_flame_spritesheet.png",
      { frameWidth: 150, frameHeight: 112, spacing: 0 },
    );


    // vie de fond : rats au ras du sol, chauves-souris en hauteur
    this.load.spritesheet(
      "ambient-rat",
      "/assets/sprites/props/ambient_rat_spritesheet.png",
      { frameWidth: 64, frameHeight: 40, spacing: 0 },
    );
    this.load.spritesheet(
      "ambient-bat",
      "/assets/sprites/props/ambient_bat_spritesheet.png",
      { frameWidth: 64, frameHeight: 48, spacing: 0 },
    );


    // chevalet d'ecartellement du corridor : bati, supplicie et bourreaux
    this.load.image("torture-rack", "/assets/sprites/props/torture_rack_frame.png");
    this.load.spritesheet(
      "torture-rack-victim",
      "/assets/sprites/props/torture_rack_victim_spritesheet.png",
      { frameWidth: 512, frameHeight: 256, spacing: 0 },
    );
    this.load.image("bourreau-crank", "/assets/sprites/enemies/bourreau_crank.png");

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

    // Torcheres sur pied : respiration de repos + sursaut d'embrasement.
    this.anims.create({
      key: "floor-torch-idle",
      frames: this.anims.generateFrameNumbers("floor-torch-flame", {
        frames: [0, 1, 2, 4, 2, 1, 0, 4],
      }),
      frameRate: 9,
      repeat: -1,
    });
    this.anims.create({
      key: "floor-torch-flare",
      frames: this.anims.generateFrameNumbers("floor-torch-flame", {
        frames: [3, 5, 6, 7, 8, 9, 6, 3, 2],
      }),
      frameRate: 11,
      repeat: 0,
    });


    // Vie de fond : rats et chauves-souris.
    this.anims.create({
      key: "ambient-rat-run",
      frames: this.anims.generateFrameNumbers("ambient-rat", { start: 0, end: 5 }),
      frameRate: 12,
      repeat: -1,
    });
    this.anims.create({
      key: "ambient-bat-fly",
      frames: this.anims.generateFrameNumbers("ambient-bat", { start: 0, end: 5 }),
      frameRate: 14,
      repeat: -1,
    });

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

