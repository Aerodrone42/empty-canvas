/**
 * La Voie de la Chair — arbre de mutations.
 *
 * Chaque mutation coute de la Chair (monnaie recoltee sur les cadavres) et
 * altere durablement le Vigile. Certaines exigent une mutation parente :
 * la chair pousse sur la chair.
 */

export type MutationEffects = {
  /** Points de vie maximum ajoutes. */
  bonusHealth: number;
  /** Multiplicateur de degats de la frappe. */
  damageMult: number;
  /** Multiplicateur de vitesse de course. */
  speedMult: number;
  /** Multiplicateur de puissance de saut. */
  jumpMult: number;
  /** Multiplicateur du delai entre deux frappes (< 1 = plus rapide). */
  attackCooldownMult: number;
  /** Portee ajoutee a la frappe, en pixels. */
  bonusReach: number;
  /** Vie volee par ennemi tue. */
  lifesteal: number;
  /** Chair supplementaire par ennemi tue, en pourcentage. */
  fleshGainMult: number;
  /** Saut supplementaire en l'air. */
  doubleJump: boolean;
  /** Reduction des degats subis (0 = aucune, 0.3 = -30%). */
  damageReduction: number;
  /** Allonge la roulade d'esquive. */
  dodgeDistanceMult: number;
  /** Millisecondes ajoutees a la fenetre de parade. */
  parryWindowBonus: number;
  /** Multiplicateur du cout en Chair du Rugissement. */
  specialCostMult: number;
  /** Rayon ajoute a l'onde du Rugissement. */
  specialRadiusBonus: number;
};

export const BASE_EFFECTS: MutationEffects = {
  bonusHealth: 0,
  damageMult: 1,
  speedMult: 1,
  jumpMult: 1,
  attackCooldownMult: 1,
  bonusReach: 0,
  lifesteal: 0,
  fleshGainMult: 1,
  doubleJump: false,
  damageReduction: 0,
  dodgeDistanceMult: 1,
  parryWindowBonus: 0,
  specialCostMult: 1,
  specialRadiusBonus: 0,
};

export type Mutation = {
  id: string;
  name: string;
  branch: "Ossuaire" | "Tendon" | "Sanie";
  tier: 1 | 2 | 3;
  cost: number;
  requires?: string;
  description: string;
  effects: Partial<MutationEffects>;
};

export const MUTATIONS: Mutation[] = [
  // --- Ossuaire : encaisser ---
  {
    id: "os-carapace",
    name: "Carapace Ossifiée",
    branch: "Ossuaire",
    tier: 1,
    cost: 20,
    description: "Des plaques d'os percent le dos. La chair tient plus longtemps.",
    effects: { bonusHealth: 30 },
  },
  {
    id: "os-cuir",
    name: "Cuir Tanné",
    branch: "Ossuaire",
    tier: 2,
    cost: 35,
    requires: "os-carapace",
    description: "La peau durcit jusqu'à ne plus saigner. Les coups portent moins.",
    effects: { damageReduction: 0.25 },
  },
  {
    id: "os-reliquaire",
    name: "Reliquaire Vivant",
    branch: "Ossuaire",
    tier: 3,
    cost: 60,
    requires: "os-cuir",
    description: "Un second cœur bat dans la cage thoracique.",
    effects: { bonusHealth: 45, damageReduction: 0.1 },
  },

  // --- Tendon : bouger ---
  {
    id: "ten-jarret",
    name: "Jarrets Greffés",
    branch: "Tendon",
    tier: 1,
    cost: 18,
    description: "Les tendons se retendent comme des cordes d'arc.",
    effects: { speedMult: 1.25 },
  },
  {
    id: "ten-ailes",
    name: "Membranes Dorsales",
    branch: "Tendon",
    tier: 2,
    cost: 40,
    requires: "ten-jarret",
    description: "Des lambeaux de peau se déploient : un second envol.",
    effects: { doubleJump: true, jumpMult: 1.08 },
  },
  {
    id: "ten-fievre",
    name: "Fièvre Nerveuse",
    branch: "Tendon",
    tier: 3,
    cost: 55,
    requires: "ten-ailes",
    description: "Les nerfs brûlent. Le bras frappe avant que l'œil ne voie.",
    effects: { attackCooldownMult: 0.6, speedMult: 1.1 },
  },

  // --- Sanie : tuer ---
  {
    id: "san-serres",
    name: "Serres Fusionnées",
    branch: "Sanie",
    tier: 1,
    cost: 22,
    description: "Les doigts se soudent en lames d'os.",
    effects: { damageMult: 1.4 },
  },
  {
    id: "san-langue",
    name: "Langue Suceuse",
    branch: "Sanie",
    tier: 2,
    cost: 38,
    requires: "san-serres",
    description: "Chaque mort nourrit le Vigile.",
    effects: { lifesteal: 8, fleshGainMult: 1.35 },
  },
  {
    id: "san-bras",
    name: "Bras Étiré",
    branch: "Sanie",
    tier: 3,
    cost: 50,
    requires: "san-langue",
    description: "L'humérus s'allonge d'une paume de trop.",
    effects: { bonusReach: 55, damageMult: 1.25 },
  },

  // --- Greffes de combat ---
  {
    id: "ten-roulade",
    name: "Genoux Inversés",
    branch: "Tendon",
    tier: 2,
    cost: 30,
    requires: "ten-jarret",
    description: "La roulade porte deux fois plus loin.",
    effects: { dodgeDistanceMult: 1.7 },
  },
  {
    id: "os-parade",
    name: "Avant-bras Ossifié",
    branch: "Ossuaire",
    tier: 2,
    cost: 34,
    requires: "os-carapace",
    description: "L'os encaisse : la fenêtre de parade s'élargit.",
    effects: { parryWindowBonus: 120 },
  },
  {
    id: "san-rugissement",
    name: "Gorge Béante",
    branch: "Sanie",
    tier: 3,
    cost: 58,
    requires: "san-langue",
    description: "Le Rugissement coûte moins de Chair et porte plus loin.",
    effects: { specialCostMult: 0.6, specialRadiusBonus: 90 },
  },
];

export const BRANCHES: Array<Mutation["branch"]> = ["Ossuaire", "Tendon", "Sanie"];

export function computeEffects(unlocked: string[]): MutationEffects {
  const effects: MutationEffects = { ...BASE_EFFECTS };

  for (const id of unlocked) {
    const mutation = MUTATIONS.find((m) => m.id === id);
    if (!mutation) continue;
    const e = mutation.effects;

    effects.bonusHealth += e.bonusHealth ?? 0;
    effects.bonusReach += e.bonusReach ?? 0;
    effects.lifesteal += e.lifesteal ?? 0;
    effects.damageMult *= e.damageMult ?? 1;
    effects.speedMult *= e.speedMult ?? 1;
    effects.jumpMult *= e.jumpMult ?? 1;
    effects.attackCooldownMult *= e.attackCooldownMult ?? 1;
    effects.fleshGainMult *= e.fleshGainMult ?? 1;
    effects.doubleJump = effects.doubleJump || (e.doubleJump ?? false);
    effects.damageReduction = 1 - (1 - effects.damageReduction) * (1 - (e.damageReduction ?? 0));
    effects.dodgeDistanceMult *= e.dodgeDistanceMult ?? 1;
    effects.parryWindowBonus += e.parryWindowBonus ?? 0;
    effects.specialCostMult *= e.specialCostMult ?? 1;
    effects.specialRadiusBonus += e.specialRadiusBonus ?? 0;
  }

  return effects;
}

export function isAvailable(mutation: Mutation, unlocked: string[]) {
  return !mutation.requires || unlocked.includes(mutation.requires);
}
