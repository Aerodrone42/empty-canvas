import type { BackdropKey } from "@/game/assets";

/** types de creatures instanciables depuis la configuration d'une salle */
export type SpawnKind = "suppliant" | "penitent" | "bourreau";

export type SpawnDef = {
  kind: SpawnKind;
  x: number;
  /** variante elite : plus resistante, plus dangereuse, meilleure recompense */
  elite?: boolean;
};

/** plateau suspendu : le heros peut sauter dessus */
export type PlatformDef = { x: number; y: number; width: number };

/** fosse : segment de sol manquant, la chute renvoie le heros au bord */
export type PitDef = { from: number; to: number };

/**
 * Segment de parcours : tronçon de salle avec son propre decor peint,
 * son voile d'ambiance et son nom affiche a l'entree.
 */
export type SegmentDef = {
  /** nom du lieu, affiche en cartouche a l'entree du segment */
  name: string;
  /** bornes du segment en abscisse monde */
  from: number;
  to: number;
  /** cle de texture du decor peint */
  bg: string;
  /** voile colore applique sur ce troncon */
  tint: number;
  tintAlpha: number;
  /** couleur des poussieres flottantes du troncon */
  dust: number;
};


export type RoomConfig = {
  /** largeur jouable de la salle */
  width: number;
  /** abscisse d'apparition par defaut du heros */
  spawnX: number;
  /** autel de sang (point de sauvegarde) ; absent = pas d'autel */
  altarX?: number;
  /** creatures presentes des l'entree */
  spawns: SpawnDef[];
  /** vagues successives (arene) : la vague suivante arrive une fois la precedente nettoyee */
  waves?: SpawnDef[][];
  /** arene : un mur de chair se referme derriere le heros a cette abscisse */
  arenaLockX?: number;
  /** ecorches suspendus au plafond */
  hangers: number[];
  /** mains agrippantes : segments [debut, fin] */
  hands: [number, number][];
  /** plateaux suspendus */
  platforms: PlatformDef[];
  /** fosses dans le sol */
  pits: PitDef[];
  /** piste musicale de la salle */
  music: "choir" | "suspense" | "main";
  /** parcours segmente : decors successifs le long de la salle */
  segments?: SegmentDef[];
  /** texture de sol repetee le long de la salle */
  floorTexture?: string;
};

/** marge entre la colonne de sortie et le bord droit de la salle */
const GATE_MARGIN = 250;

export function gateXOf(config: RoomConfig) {
  return config.width - GATE_MARGIN;
}

export const ROOM_CONFIG: Record<BackdropKey, RoomConfig> = {
  // I — La Nef Suppurante : introduction, rythme lent, un mini-boss aerien
  cathedrale: {
    width: 2400,
    spawnX: 180,
    altarX: 1400,
    spawns: [
      { kind: "suppliant", x: 760 },
      { kind: "penitent", x: 1180 },
      { kind: "suppliant", x: 1600 },
      { kind: "penitent", x: 2060, elite: true },
    ],
    hangers: [1400, 1900],
    hands: [
      [520, 1150],
      [1200, 1800],
      [1850, 2400],
    ],
    platforms: [],
    pits: [],
    music: "choir",
  },

  // II — Le Corridor de Chair : couloir d'embuscade, la densite monte
  corridor: {
    width: 2400,
    spawnX: 180,
    altarX: 1200,
    spawns: [
      { kind: "suppliant", x: 620 },
      { kind: "suppliant", x: 900 },
      { kind: "penitent", x: 1150 },
      { kind: "suppliant", x: 1450 },
      { kind: "penitent", x: 1720 },
      { kind: "penitent", x: 2050, elite: true },
    ],
    hangers: [1000, 1600, 2200],
    hands: [
      [420, 900],
      [950, 1500],
      [1550, 2000],
      [2050, 2400],
    ],
    platforms: [],
    pits: [],
    music: "suspense",
  },

  // III — La Marche vers le Trone : longue traversee, aucun combat pour l'instant
  throne: {
    width: 16000,
    spawnX: 160,
    altarX: 900,
    spawns: [],
    hangers: [
      2400, 4300, 5200, 6400, 8200, 9000, 10400, 11500, 12800, 14600,
    ],
    hands: [
      [1500, 2300],
      [3000, 3800],
      [4400, 5200],
      [6000, 6800],
      [7900, 8700],
      [9200, 10000],
      [10600, 11400],
      [12200, 13000],
      [13600, 14400],
      [14900, 15600],
    ],
    platforms: [],
    pits: [],
    music: "main",
    segments: [
      {
        name: "Le Seuil",
        from: 0,
        to: 1800,
        bg: "throne-far",
        tint: 0x1a0508,
        tintAlpha: 0.34,
        dust: 0xff8a9a,
      },
      {
        name: "La Nef Rouge",
        from: 1800,
        to: 3600,
        bg: "throne-nave",
        tint: 0x40060f,
        tintAlpha: 0.2,
        dust: 0xffb08a,
      },
      {
        name: "L'Ossuaire",
        from: 3600,
        to: 5200,
        bg: "throne-ossuary",
        tint: 0x180a0c,
        tintAlpha: 0.24,
        dust: 0xd8c4b0,
      },
      {
        name: "Les Catacombes Basses",
        from: 5200,
        to: 6800,
        bg: "throne-catacombs",
        tint: 0x140809,
        tintAlpha: 0.26,
        dust: 0xcbb9a6,
      },
      {
        name: "Le Passage Noye",
        from: 6800,
        to: 8900,
        bg: "throne-flooded",
        tint: 0x2c0308,
        tintAlpha: 0.28,
        dust: 0xff6a72,
      },
      {
        name: "Le Cloitre des Supplicies",
        from: 8900,
        to: 10800,
        bg: "throne-cloister",
        tint: 0x3a0a06,
        tintAlpha: 0.2,
        dust: 0xffa06a,
      },
      {
        name: "La Galerie des Bannieres",
        from: 10800,
        to: 12600,
        bg: "throne-gallery",
        tint: 0x2a0c05,
        tintAlpha: 0.2,
        dust: 0xffc27a,
      },
      {
        name: "L'Ascension",
        from: 12600,
        to: 14300,
        bg: "throne-near",
        tint: 0x38060d,
        tintAlpha: 0.22,
        dust: 0xff9a86,
      },
      {
        name: "Le Parvis du Trone",
        from: 14300,
        to: 16000,
        bg: "throne-mid",
        tint: 0x4a060f,
        tintAlpha: 0.24,
        dust: 0xff8a9a,
      },
    ],
  },



  // IV — L'Exterieur : parvis long et accidente, combats espaces, verticalite
  exterieur: {
    width: 3200,
    spawnX: 160,
    altarX: 480,
    spawns: [
      { kind: "suppliant", x: 900 },
      { kind: "suppliant", x: 1150 },
      { kind: "penitent", x: 1600 },
      { kind: "bourreau", x: 2150 },
      { kind: "suppliant", x: 2500, elite: true },
      { kind: "penitent", x: 2850, elite: true },
    ],
    hangers: [1350, 2350],
    hands: [
      [700, 1300],
      [1700, 2200],
      [2600, 3100],
    ],
    platforms: [
      { x: 1000, y: 700, width: 220 },
      { x: 1320, y: 610, width: 220 },
      { x: 1640, y: 700, width: 220 },
      { x: 2320, y: 660, width: 240 },
      { x: 2700, y: 580, width: 200 },
    ],
    pits: [
      { from: 1250, to: 1430 },
      { from: 2380, to: 2560 },
    ],
    music: "main",
  },
};
