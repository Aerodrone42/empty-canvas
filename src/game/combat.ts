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
    reach: 104,
    vertical: 118,
    damage: 14,
    knockback: 90,
    breakGuard: false,
    shape: "arc",
    duration: 300,
    centerY: -76,
    backReach: 14,
  },
  combo2: {
    id: "combo2",
    reach: 112,
    vertical: 118,
    damage: 16,
    knockback: 110,
    breakGuard: false,
    shape: "arc",
    duration: 300,
    centerY: -76,
    backReach: 14,
  },
  combo3: {
    id: "combo3",
    reach: 132,
    vertical: 132,
    damage: 34,
    knockback: 260,
    breakGuard: false,
    shape: "arc",
    duration: 460,
    centerY: -74,
    backReach: 22,
  },
  heavy: {
    id: "heavy",
    reach: 148,
    vertical: 142,
    damage: 46,
    knockback: 300,
    breakGuard: true,
    shape: "arc",
    duration: 520,
    centerY: -72,
    backReach: 26,
  },
  upper: {
    id: "upper",
    reach: 92,
    vertical: 110,
    damage: 20,
    knockback: 120,
    breakGuard: false,
    shape: "arc",
    duration: 320,
    centerY: -170,
    backReach: 40,
  },
  dive: {
    id: "dive",
    reach: 118,
    vertical: 84,
    damage: 28,
    knockback: 200,
    breakGuard: false,
    shape: "slam",
    duration: 260,
    centerY: -40,
    backReach: 96,
  },
  special: {
    id: "special",
    reach: 220,
    vertical: 190,
    damage: 58,
    knockback: 420,
    breakGuard: true,
    shape: "radial",
    duration: 620,
    centerY: -84,
  },
};

/** Chance de critique de base (les talents viendront s'y ajouter plus tard). */
export const CRIT_CHANCE = 0.05;
/** Multiplicateur de dégâts d'un critique. */
export const CRIT_MULT = 2;

export type HitBox = { left: number; right: number; top: number; bottom: number };

/**
 * Zone de frappe reelle d'un coup : rectangle devant le heros (ou centre sur
 * lui pour les coups radiaux), au lieu d'un simple test de distance.
 */
export function strikeBox(
  strike: Strike,
  x: number,
  footY: number,
  facing: number,
  bonusReach = 0,
): HitBox {
  const reach = strike.reach + bonusReach;
  const cy = footY + (strike.centerY ?? -80);
  const half = strike.vertical;

  if (strike.shape === "radial") {
    return { left: x - reach, right: x + reach, top: cy - half, bottom: cy + half };
  }

  const back = strike.backReach ?? 16;
  const front = facing >= 0 ? reach : back;
  const rear = facing >= 0 ? back : reach;
  return { left: x - rear, right: x + front, top: cy - half, bottom: cy + half };
}

/** Intersection rectangle de frappe / hurtbox (centre + demi-dimensions). */
export function boxHitsBody(
  box: HitBox,
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
): boolean {
  return (
    cx + halfW > box.left &&
    cx - halfW < box.right &&
    cy + halfH > box.top &&
    cy - halfH < box.bottom
  );
}


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
/** Paramètres de la garde et de la parade parfaite. */
export const PARRY = {
  /** fenêtre de parade parfaite au début du maintien */
  perfectWindow: 200,
  /** tolérance : un appui juste après le coup compte encore comme parfait */
  buffer: 120,
  /** multiplicateur de dégâts quand la garde est simplement tenue */
  guardDamageMult: 0.25,
  /** récupération courte au relâchement */
  recovery: 120,
  stun: 1200,
  fleshReward: 6,
};
