/** Descripteurs des attaques du Vigile : une seule source de vérité. */
export type StrikeShape = "arc" | "radial" | "slam";

export type Strike = {
  id: string;
  /** portée horizontale de base, en pixels */
  reach: number;
  /** demi-hauteur de la zone touchée */
  vertical: number;
  /** dégâts de base (avant multiplicateurs de mutation) */
  damage: number;
  /** recul appliqué à l'ennemi touché */
  knockback: number;
  /** brise la garde du Pénitent-Greffé */
  breakGuard: boolean;
  shape: StrikeShape;
  /** durée d'immobilisation du joueur pendant l'attaque */
  duration: number;
  /** décalage vertical du centre de la zone par rapport aux pieds du héros */
  centerY?: number;
  /** marge derrière le héros (les coups d'arc ne touchent pas dans le dos) */
  backReach?: number;
};


export const STRIKES: Record<string, Strike> = {
  combo1: {
    id: "combo1",
    reach: 96,
    vertical: 130,
    damage: 20,
    knockback: 90,
    breakGuard: false,
    shape: "arc",
    duration: 300,
  },
  combo2: {
    id: "combo2",
    reach: 104,
    vertical: 130,
    damage: 22,
    knockback: 110,
    breakGuard: false,
    shape: "arc",
    duration: 300,
  },
  combo3: {
    id: "combo3",
    reach: 124,
    vertical: 140,
    damage: 38,
    knockback: 260,
    breakGuard: false,
    shape: "arc",
    duration: 460,
  },
  heavy: {
    id: "heavy",
    reach: 136,
    vertical: 150,
    damage: 48,
    knockback: 300,
    breakGuard: true,
    shape: "arc",
    duration: 520,
  },
  dive: {
    id: "dive",
    reach: 130,
    vertical: 110,
    damage: 34,
    knockback: 200,
    breakGuard: false,
    shape: "slam",
    duration: 260,
  },
  special: {
    id: "special",
    reach: 220,
    vertical: 190,
    damage: 60,
    knockback: 420,
    breakGuard: true,
    shape: "radial",
    duration: 620,
  },
};

/** Durée maximale entre deux coups pour enchaîner le combo. */
export const COMBO_WINDOW = 500;
/** Maintien nécessaire pour déclencher le coup lourd. */
export const HEAVY_CHARGE_MS = 450;
/** Coût en Chair du Rugissement. */
export const SPECIAL_COST = 40;
/** Chair récupérée à chaque coup porté (mise à l'échelle par les dégâts). */
export const FLESH_PER_HIT = 3;
/** Bonus de chair pour le finisher de combo / coup lourd. */
export const FLESH_HEAVY_BONUS = 4;
/** Paramètres de l'esquive. */
export const DODGE = {
  distance: 220,
  duration: 260,
  invuln: 220,
  cooldown: 700,
};
/** Paramètres de la parade. */
export const PARRY = {
  window: 180,
  recovery: 320,
  stun: 1200,
  fleshReward: 6,
};
