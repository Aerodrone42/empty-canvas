import { create } from "zustand";

export type Phase = "warning" | "menu" | "playing" | "paused" | "dead";

export type GameState = {
  phase: Phase;
  health: number;
  maxHealth: number;
  flesh: number;
  maxFlesh: number;
  kills: number;
  hasSave: boolean;

  enter: () => void;
  startNewRun: () => void;
  continueRun: () => void;
  pause: () => void;
  resume: () => void;
  toMenu: () => void;

  damage: (amount: number) => void;
  heal: (amount: number) => void;
  gainFlesh: (amount: number) => void;
  registerKill: () => void;
};

const MAX_HEALTH = 100;
const MAX_FLESH = 100;

export const useGameStore = create<GameState>((set, get) => ({
  phase: "warning",
  health: MAX_HEALTH,
  maxHealth: MAX_HEALTH,
  flesh: 0,
  maxFlesh: MAX_FLESH,
  kills: 0,
  hasSave: false,

  enter: () => set({ phase: "menu" }),

  startNewRun: () =>
    set({
      phase: "playing",
      health: MAX_HEALTH,
      flesh: 0,
      kills: 0,
      hasSave: true,
    }),

  continueRun: () => set({ phase: get().hasSave ? "playing" : "menu" }),

  pause: () => set((s) => (s.phase === "playing" ? { phase: "paused" } : s)),
  resume: () => set((s) => (s.phase === "paused" ? { phase: "playing" } : s)),
  toMenu: () => set({ phase: "menu" }),

  damage: (amount) =>
    set((s) => {
      const health = Math.max(0, s.health - amount);
      return health === 0 ? { health, phase: "dead" as Phase } : { health };
    }),

  heal: (amount) => set((s) => ({ health: Math.min(s.maxHealth, s.health + amount) })),

  gainFlesh: (amount) => set((s) => ({ flesh: Math.min(s.maxFlesh, s.flesh + amount) })),

  registerKill: () => set((s) => ({ kills: s.kills + 1 })),
}));
