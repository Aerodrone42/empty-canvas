/**
 * Table des feuilles de sprites, transcrite depuis
 * public/assets/sprites/enemies/README_ENEMIES_PHASER.md
 *
 * Chaque cellule est suivie d'une marge de 4px : on utilise donc
 * frameWidth = largeur de cellule + spacing 4.
 */

export type SheetDef = {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  frameRate: number;
  repeat: number;
  /** marge entre cellules (les feuilles du heros sont regenerees sans marge) */
  spacing?: number;
};

const SPRITES = "/assets/sprites";
const ENEMIES = `${SPRITES}/enemies`;

/** gabarit commun des feuilles du Vigile Muet, regenerees et normalisees */
export const HERO_FRAME_W = 192;
export const HERO_FRAME_H = 144;
/** hauteur de silhouette dessinee, identique sur toutes les frames */
export const HERO_CHAR_H = 110;
/** ligne de pieds dans la cellule */
export const HERO_BASELINE_Y = 138;

export const SHEETS: SheetDef[] = [
  // --- Vigile Muet (heros) ---
  {
    key: "vigile-idle",
    path: `${SPRITES}/vigile_muet_idle_spritesheet.png`,
    frameWidth: HERO_FRAME_W,
    frameHeight: HERO_FRAME_H,
    frameCount: 4,
    frameRate: 5,
    repeat: -1,
    spacing: 0,
  },
  {
    key: "vigile-walk",
    path: `${SPRITES}/vigile_muet_walk_spritesheet.png`,
    frameWidth: HERO_FRAME_W,
    frameHeight: HERO_FRAME_H,
    frameCount: 5,
    frameRate: 10,
    repeat: -1,
    spacing: 0,
  },
  {
    key: "vigile-attack",
    path: `${SPRITES}/vigile_muet_attack_spritesheet.png`,
    frameWidth: HERO_FRAME_W,
    frameHeight: HERO_FRAME_H,
    frameCount: 5,
    frameRate: 14,
    repeat: 0,
    spacing: 0,
  },


  // --- Penitent-Greffe (lourd, lent, resistant) ---
  {
    key: "penitent-idle",
    path: `${ENEMIES}/penitent_greffe_idle_spritesheet.png`,
    frameWidth: 102,
    frameHeight: 128,
    frameCount: 4,
    frameRate: 4,
    repeat: -1,
  },
  {
    key: "penitent-walk",
    path: `${ENEMIES}/penitent_greffe_walk_spritesheet.png`,
    frameWidth: 126,
    frameHeight: 128,
    frameCount: 6,
    frameRate: 6,
    repeat: -1,
  },
  {
    key: "penitent-attack",
    path: `${ENEMIES}/penitent_greffe_attack_spritesheet.png`,
    frameWidth: 172,
    frameHeight: 128,
    frameCount: 5,
    frameRate: 8,
    repeat: 0,
  },

  // --- Suppliant Rampant (rapide, faible, quadrupede) ---
  {
    key: "suppliant-idle",
    path: `${ENEMIES}/suppliant_rampant_idle_spritesheet.png`,
    frameWidth: 240,
    frameHeight: 128,
    frameCount: 4,
    frameRate: 4,
    repeat: -1,
  },
  {
    key: "suppliant-walk",
    path: `${ENEMIES}/suppliant_rampant_walk_spritesheet.png`,
    frameWidth: 275,
    frameHeight: 128,
    frameCount: 4,
    frameRate: 10,
    repeat: -1,
  },
  {
    key: "suppliant-attack",
    path: `${ENEMIES}/suppliant_rampant_attack_spritesheet.png`,
    frameWidth: 322,
    frameHeight: 128,
    frameCount: 4,
    frameRate: 10,
    repeat: 0,
  },
];

export const FRAME_SPACING = 4;

/* ------------------------------------------------------------------ */
/* Decors du Chapitre 1 : 4 scenes x 3 calques de parallaxe            */
/* ------------------------------------------------------------------ */

const BACKGROUNDS = `${SPRITES}/backgrounds`;

export type BackdropKey = "cathedrale" | "corridor" | "throne" | "exterieur";

export type BackdropDef = {
  /** cles de texture Phaser */
  far: string;
  mid: string;
  near: string;
  /** chemins des images */
  paths: [string, string, string];
  /** voile d'ambiance applique par dessus les calques */
  tint: number;
  tintAlpha: number;
  /** couleur du sol dessine en code, assortie a la scene */
  ground: number;
  ledge: number;
  /** couleur des poussieres flottantes */
  dust: number;
};

function backdrop(
  name: BackdropKey,
  tint: number,
  tintAlpha: number,
  ground: number,
  ledge: number,
  dust: number,
): BackdropDef {
  return {
    far: `${name}-far`,
    mid: `${name}-mid`,
    near: `${name}-near`,
    paths: [
      `${BACKGROUNDS}/${name}_bg_far.png`,
      `${BACKGROUNDS}/${name}_bg_mid.png`,
      `${BACKGROUNDS}/${name}_bg_near.png`,
    ],
    tint,
    tintAlpha,
    ground,
    ledge,
    dust,
  };
}

export const BACKDROPS: Record<BackdropKey, BackdropDef> = {
  cathedrale: backdrop("cathedrale", 0x2a0d12, 0.18, 0x140d0e, 0x2b1f1c, 0xd8b877),
  corridor: backdrop("corridor", 0x36070d, 0.24, 0x130b0a, 0x281512, 0xc98a7a),
  throne: backdrop("throne", 0x40060f, 0.26, 0x16090c, 0x301216, 0xff8a9a),
  exterieur: backdrop("exterieur", 0x1b1410, 0.16, 0x161210, 0x2d251e, 0xcfc0a0),

};

