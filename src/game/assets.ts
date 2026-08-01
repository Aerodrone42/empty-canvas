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
export const HERO_FRAME_W = 256;
export const HERO_FRAME_H = 192;
/** hauteur de silhouette dessinee, identique sur toutes les frames */
export const HERO_CHAR_H = 150;
/** ligne de pieds dans la cellule */
export const HERO_BASELINE_Y = 184;

/** gabarit commun des feuilles d'ennemis, regenerees et normalisees */
export const ENEMY_FRAME_W = 224;
export const ENEMY_FRAME_H = 176;
/** ligne de pieds dans la cellule ennemie */
export const ENEMY_BASELINE_Y = 168;
/** hauteurs de silhouette dessinees */
export const PENITENT_CHAR_H = 118;
export const SUPPLIANT_CHAR_H = 62;

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
  {
    key: "vigile-dodge",
    path: `${SPRITES}/vigile_muet_dodge_spritesheet.png`,
    frameWidth: HERO_FRAME_W,
    frameHeight: HERO_FRAME_H,
    frameCount: 8,
    frameRate: 20,
    repeat: 0,
    spacing: 0,
  },
  {
    key: "vigile-jump",
    path: `${SPRITES}/vigile_muet_jump_spritesheet.png`,
    frameWidth: HERO_FRAME_W,
    frameHeight: HERO_FRAME_H,
    frameCount: 6,
    frameRate: 12,
    repeat: 0,
    spacing: 0,
  },


  // --- Penitent-Greffe (lourd, lent, resistant) ---
  // feuilles regenerees : cellule 224x176, silhouette 118px, pieds a y=168
  {
    key: "penitent-idle",
    path: `${ENEMIES}/penitent_greffe_idle_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 4,
    frameRate: 4,
    repeat: -1,
    spacing: 0,
  },
  {
    key: "penitent-walk",
    path: `${ENEMIES}/penitent_greffe_walk_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 6,
    frameRate: 6,
    repeat: -1,
    spacing: 0,
  },
  {
    key: "penitent-attack",
    path: `${ENEMIES}/penitent_greffe_attack_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 5,
    frameRate: 8,
    repeat: 0,
    spacing: 0,
  },

  // --- Suppliant Rampant (rapide, faible, quadrupede) ---
  {
    key: "suppliant-idle",
    path: `${ENEMIES}/suppliant_rampant_idle_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 4,
    frameRate: 4,
    repeat: -1,
    spacing: 0,
  },
  {
    key: "suppliant-walk",
    path: `${ENEMIES}/suppliant_rampant_walk_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 4,
    frameRate: 10,
    repeat: -1,
    spacing: 0,
  },
  {
    key: "suppliant-attack",
    path: `${ENEMIES}/suppliant_rampant_attack_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 4,
    frameRate: 10,
    repeat: 0,
    spacing: 0,
  },

  // --- Bourreau (libere par la machine d'ecartelement du corridor) ---
  {
    key: "bourreau-idle",
    path: `${ENEMIES}/bourreau_idle_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 4,
    frameRate: 4,
    repeat: -1,
    spacing: 0,
  },
  {
    key: "bourreau-walk",
    path: `${ENEMIES}/bourreau_walk_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 6,
    frameRate: 8,
    repeat: -1,
    spacing: 0,
  },
  {
    // 6 frames : armement (0-1), swing (2-3), impact + retour (4-5)
    key: "bourreau-attack",
    path: `${ENEMIES}/bourreau_attack_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 6,
    frameRate: 12,
    repeat: 0,
    spacing: 0,
  },


  // --- Ecorche-Pendu (tombe du plafond, onde de sang, explose a la mort) ---
  {
    key: "ecorche-hang",
    path: `${ENEMIES}/ecorche_pendu_hang_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 4,
    frameRate: 3,
    repeat: -1,
    spacing: 0,
  },
  {
    key: "ecorche-fall",
    path: `${ENEMIES}/ecorche_pendu_fall_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 1,
    frameRate: 1,
    repeat: -1,
    spacing: 0,
  },
  {
    key: "ecorche-land",
    path: `${ENEMIES}/ecorche_pendu_land_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 4,
    frameRate: 8,
    repeat: 0,
    spacing: 0,
  },
  {
    key: "ecorche-idle",
    path: `${ENEMIES}/ecorche_pendu_idle_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 4,
    frameRate: 4,
    repeat: -1,
    spacing: 0,
  },
  {
    key: "ecorche-walk",
    path: `${ENEMIES}/ecorche_pendu_walk_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 4,
    frameRate: 8,
    repeat: -1,
    spacing: 0,
  },
  {
    key: "ecorche-attack",
    path: `${ENEMIES}/ecorche_pendu_attack_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 4,
    frameRate: 9,
    repeat: 0,
    spacing: 0,
  },
  {
    key: "ecorche-burst",
    path: `${ENEMIES}/ecorche_pendu_burst_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 3,
    frameRate: 10,
    repeat: 0,
    spacing: 0,
  },

  // --- Supplicie ecorche (decor anime, premiere salle) ---
  {
    key: "crucifie-idle",
    path: `${SPRITES}/props/crucifie_ecorche_spritesheet.png`,
    frameWidth: 223,
    frameHeight: 665,
    frameCount: 8,
    frameRate: 5,
    repeat: -1,
    spacing: 0,
  },

  // --- Suppliciee (femme rousse, robe blanche ensanglantee) ---
  {
    key: "crucifiee-idle",
    path: `${SPRITES}/props/crucifiee_femme_spritesheet.png?v=5`,
    frameWidth: 284,
    frameHeight: 697,
    frameCount: 12,
    frameRate: 7,
    repeat: -1,
    spacing: 0,
  },


  // --- Mains du sol (piege : agrippent et ralentissent le heros) ---
  {
    key: "mains-sol",
    path: `${ENEMIES}/mains_sol_spritesheet.png`,
    frameWidth: ENEMY_FRAME_W,
    frameHeight: ENEMY_FRAME_H,
    frameCount: 5,
    frameRate: 14,
    repeat: 0,
    spacing: 0,
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

