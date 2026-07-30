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
  hasSave: boolean;
  mutations: string[];
  effects: MutationEffects;
  optionsReturnPhase: Phase;

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
  registerKill: () => void;
  unlockMutation: (id: string) => void;
};

const BASE_MAX_HEALTH = 100;
const MAX_FLESH = 250;

export const useGameStore = create<GameState>((set, get) => ({
  phase: "warning",
  health: BASE_MAX_HEALTH,
  maxHealth: BASE_MAX_HEALTH,
  flesh: 0,
  maxFlesh: MAX_FLESH,
  kills: 0,
  hasSave: false,
  mutations: [],
  effects: BASE_EFFECTS,
  optionsReturnPhase: "menu",

  enter: () => set({ phase: "menu" }),

  startNewRun: () =>
    set({
      phase: "playing",
      health: BASE_MAX_HEALTH,
      maxHealth: BASE_MAX_HEALTH,
      flesh: 0,
      kills: 0,
      hasSave: true,
      mutations: [],
      effects: BASE_EFFECTS,
    }),

  continueRun: () => set({ phase: get().hasSave ? "playing" : "menu" }),

  pause: () => set((s) => (s.phase === "playing" ? { phase: "paused" } : s)),
  resume: () =>
    set((s) => (s.phase === "paused" || s.phase === "flesh" ? { phase: "playing" } : s)),
  openFleshPath: () =>
    set((s) => (s.phase === "playing" || s.phase === "paused" ? { phase: "flesh" } : s)),
  closeFleshPath: () => set((s) => (s.phase === "flesh" ? { phase: "playing" } : s)),
  toMenu: () => set({ phase: "menu" }),

  damage: (amount) =>
    set((s) => {
      const reduced = Math.max(1, Math.round(amount * (1 - s.effects.damageReduction)));
      const health = Math.max(0, s.health - reduced);
      return health === 0 ? { health, phase: "dead" as Phase } : { health };
    }),

  heal: (amount) => set((s) => ({ health: Math.min(s.maxHealth, s.health + amount) })),

  gainFlesh: (amount) =>
    set((s) => ({
      flesh: Math.min(s.maxFlesh, s.flesh + Math.round(amount * s.effects.fleshGainMult)),
    })),

  registerKill: () =>
    set((s) => ({
      kills: s.kills + 1,
      health: Math.min(s.maxHealth, s.health + s.effects.lifesteal),
    })),

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
