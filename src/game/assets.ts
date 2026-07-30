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
};

const SPRITES = "/assets/sprites";
const ENEMIES = `${SPRITES}/enemies`;

export const SHEETS: SheetDef[] = [
  // --- Vigile Muet (heros) ---
  {
    key: "vigile-idle",
    path: `${SPRITES}/vigile_muet_idle_spritesheet.png`,
    frameWidth: 57,
    frameHeight: 128,
    frameCount: 4,
    frameRate: 5,
    repeat: -1,
  },
  {
    key: "vigile-walk",
    path: `${SPRITES}/vigile_muet_walk_spritesheet.png`,
    frameWidth: 47,
    frameHeight: 128,
    frameCount: 6,
    frameRate: 10,
    repeat: -1,
  },
  {
    key: "vigile-attack",
    path: `${SPRITES}/vigile_muet_attack_spritesheet.png`,
    frameWidth: 43,
    frameHeight: 128,
    frameCount: 5,
    frameRate: 14,
    repeat: 0,
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
