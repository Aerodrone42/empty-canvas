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
    width: 9600,
    spawnX: 160,
    altarX: 900,
    spawns: [],
    hangers: [1800, 3000, 4200, 5400, 6600, 7800, 8800],
    hands: [
      [1500, 2300],
      [2800, 3600],
      [4100, 4900],
      [5300, 6100],
      [6500, 7300],
      [7700, 8500],
      [8700, 9400],
    ],
    platforms: [],
    pits: [],
    music: "main",
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
