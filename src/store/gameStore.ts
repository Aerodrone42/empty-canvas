import { create } from "zustand";

import {
  BASE_EFFECTS,
  MUTATIONS,
  computeEffects,
  isAvailable,
  type MutationEffects,
} from "@/game/mutations";

export type Phase =
  | "warning"
  | "menu"
  | "playing"
  | "paused"
  | "flesh"
  | "options"
  | "dead";

export type GameState = {
  phase: Phase;
  health: number;
  maxHealth: number;
  flesh: number;
  maxFlesh: number;
  kills: number;
  parries: number;
  hasSave: boolean;
  mutations: string[];
  effects: MutationEffects;
  optionsReturnPhase: Phase;
  /** horodatage (Date.now) de fin de recharge de l'esquive */
  dodgeReadyAt: number;
  dodgeCooldownMs: number;
  /** absorption de chair en cours : progression 0 → 1 */
  absorbProgress: number;
  absorbing: boolean;
  /** l'autel n'offre son soin complet qu'une fois par salle */
  altarHealUsed: boolean;

  enter: () => void;
  startNewRun: () => void;
  continueRun: () => void;
  pause: () => void;
  resume: () => void;
  openFleshPath: () => void;
  closeFleshPath: () => void;
  openOptions: () => void;
  closeOptions: () => void;
  toMenu: () => void;

  damage: (amount: number) => void;
  heal: (amount: number) => void;
  gainFlesh: (amount: number) => void;
  spendFlesh: (amount: number) => boolean;
  registerKill: () => void;
  registerParry: () => void;
  setDodgeCooldown: (durationMs: number) => void;
  setAbsorb: (absorbing: boolean, progress: number) => void;
  consumeFleshForHealth: () => boolean;
  unlockMutation: (id: string) => void;
};

const BASE_MAX_HEALTH = 100;
const MAX_FLESH = 250;

/** cout en chair et soin rendu par une absorption */
export const ABSORB_COST = 25;
export const ABSORB_HEAL = 20;
export const ABSORB_DURATION = 900;

export const useGameStore = create<GameState>((set, get) => ({
  phase: "warning",
  health: BASE_MAX_HEALTH,
  maxHealth: BASE_MAX_HEALTH,
  flesh: 0,
  maxFlesh: MAX_FLESH,
  kills: 0,
  parries: 0,
  hasSave: false,
  mutations: [],
  effects: BASE_EFFECTS,
  optionsReturnPhase: "menu",
  dodgeReadyAt: 0,
  dodgeCooldownMs: 700,
  absorbProgress: 0,
  absorbing: false,
  altarHealUsed: false,

  enter: () => set({ phase: "menu" }),

  startNewRun: () =>
    set({
      phase: "playing",
      health: BASE_MAX_HEALTH,
      maxHealth: BASE_MAX_HEALTH,
      flesh: 0,
      kills: 0,
      parries: 0,
      hasSave: true,
      mutations: [],
      effects: BASE_EFFECTS,
      absorbing: false,
      absorbProgress: 0,
      altarHealUsed: false,
    }),

  continueRun: () => set({ phase: get().hasSave ? "playing" : "menu" }),

  pause: () => set((s) => (s.phase === "playing" ? { phase: "paused" } : s)),
  resume: () =>
    set((s) => (s.phase === "paused" || s.phase === "flesh" ? { phase: "playing" } : s)),
  openFleshPath: () =>
    set((s) => {
      if (s.phase !== "playing" && s.phase !== "paused") return s;
      // premiere visite de l'autel : soin complet
      if (!s.altarHealUsed) {
        return { phase: "flesh" as Phase, altarHealUsed: true, health: s.maxHealth };
      }
      return { phase: "flesh" as Phase };
    }),
  closeFleshPath: () => set((s) => (s.phase === "flesh" ? { phase: "playing" } : s)),
  openOptions: () =>
    set((s) =>
      s.phase === "options" ? s : { phase: "options" as Phase, optionsReturnPhase: s.phase },
    ),
  closeOptions: () =>
    set((s) => (s.phase === "options" ? { phase: s.optionsReturnPhase } : s)),
  toMenu: () => set({ phase: "menu" }),

  damage: (amount) =>
    set((s) => {
      const reduced = Math.max(1, Math.round(amount * (1 - s.effects.damageReduction)));
      const health = Math.max(0, s.health - reduced);
      const base = { health, absorbing: false, absorbProgress: 0 };
      return health === 0 ? { ...base, phase: "dead" as Phase } : base;
    }),

  heal: (amount) => set((s) => ({ health: Math.min(s.maxHealth, s.health + amount) })),

  gainFlesh: (amount) =>
    set((s) => ({
      flesh: Math.min(s.maxFlesh, s.flesh + Math.round(amount * s.effects.fleshGainMult)),
    })),

  spendFlesh: (amount) => {
    if (get().flesh < amount) return false;
    set((s) => ({ flesh: Math.max(0, s.flesh - amount) }));
    return true;
  },

  registerKill: () =>
    set((s) => ({
      kills: s.kills + 1,
      health: Math.min(s.maxHealth, s.health + s.effects.lifesteal),
    })),

  registerParry: () => set((s) => ({ parries: s.parries + 1 })),

  setDodgeCooldown: (durationMs) =>
    set({ dodgeCooldownMs: durationMs, dodgeReadyAt: Date.now() + durationMs }),

  setAbsorb: (absorbing, progress) => set({ absorbing, absorbProgress: progress }),

  consumeFleshForHealth: () => {
    const s = get();
    if (s.flesh < ABSORB_COST || s.health >= s.maxHealth) return false;
    set({
      flesh: s.flesh - ABSORB_COST,
      health: Math.min(s.maxHealth, s.health + ABSORB_HEAL),
      absorbing: false,
      absorbProgress: 0,
    });
    return true;
  },




  unlockMutation: (id) => {
    const state = get();
    const mutation = MUTATIONS.find((m) => m.id === id);
    if (!mutation) return;
    if (state.mutations.includes(id)) return;
    if (!isAvailable(mutation, state.mutations)) return;
    if (state.flesh < mutation.cost) return;

    const mutations = [...state.mutations, id];
    const effects = computeEffects(mutations);
    const maxHealth = BASE_MAX_HEALTH + effects.bonusHealth;
    const gainedHealth = maxHealth - state.maxHealth;

    set({
      mutations,
      effects,
      maxHealth,
      health: Math.min(maxHealth, state.health + Math.max(0, gainedHealth)),
      flesh: state.flesh - mutation.cost,
    });
  },
}));
