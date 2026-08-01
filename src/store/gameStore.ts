import { create } from "zustand";

import type { BackdropKey } from "@/game/assets";
import {
  BASE_EFFECTS,
  MUTATIONS,
  computeEffects,
  isAvailable,
  mutationSummary,
  type MutationEffects,
} from "@/game/mutations";

export type Phase =
  | "warning"
  | "menu"
  | "stages"
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
  /** derniere greffe obtenue : sert au bandeau de confirmation en jeu */
  lastUnlocked: { id: string; name: string; summary: string; at: number } | null;
  optionsReturnPhase: Phase;
  /** horodatage (Date.now) de fin de recharge de l'esquive */
  dodgeReadyAt: number;
  dodgeCooldownMs: number;
  /** absorption de chair en cours : progression 0 → 1 */
  absorbProgress: number;
  absorbing: boolean;
  /** l'autel n'offre son soin complet qu'une fois par salle */
  altarHealUsed: boolean;
  /** salle courante : sert de point de reprise */
  stage: BackdropKey;
  /** autel scelle dans la salle courante : point de reapparition */
  checkpoint: { stage: BackdropKey; x: number } | null;
  /** nombre de morts de la run en cours */
  deaths: number;
  /** incremente a chaque reapparition : la scene se relance dessus */
  respawnToken: number;

  enter: () => void;
  startNewRun: () => void;
  continueRun: () => void;
  /** reprise directe sur une salle choisie dans le menu */
  continueAtStage: (stage: BackdropKey) => void;
  openStageSelect: () => void;
  setStage: (stage: BackdropKey) => void;
  /** restaure la sauvegarde locale (appelee au montage de la page) */
  hydrateRun: () => void;
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
  /** l'autel de sang enregistre la position de reapparition */
  setCheckpoint: (x: number) => void;
  /** mort : on repart a l'autel (ou au debut de la salle), sans la Chair */
  respawnAtCheckpoint: () => void;
  unlockMutation: (id: string) => void;
  clearLastUnlocked: () => void;
};

const BASE_MAX_HEALTH = 100;
const MAX_FLESH = 250;

/** cout en chair et soin rendu par une absorption */
export const ABSORB_COST = 25;
export const ABSORB_HEAL = 20;
export const ABSORB_DURATION = 900;

/** cle de sauvegarde locale de la progression */
const SAVE_KEY = "sanguine-vigile-run";

type SavedRun = {
  stage: BackdropKey;
  health: number;
  maxHealth: number;
  flesh: number;
  kills: number;
  parries: number;
  mutations: string[];
  checkpointX: number | null;
  deaths: number;
};

function readSave(): SavedRun | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SavedRun>;
    if (!data || typeof data.stage !== "string") return null;
    return {
      stage: data.stage as BackdropKey,
      health: typeof data.health === "number" ? data.health : BASE_MAX_HEALTH,
      maxHealth: typeof data.maxHealth === "number" ? data.maxHealth : BASE_MAX_HEALTH,
      flesh: typeof data.flesh === "number" ? data.flesh : 0,
      kills: typeof data.kills === "number" ? data.kills : 0,
      parries: typeof data.parries === "number" ? data.parries : 0,
      mutations: Array.isArray(data.mutations) ? data.mutations : [],
      checkpointX: typeof data.checkpointX === "number" ? data.checkpointX : null,
      deaths: typeof data.deaths === "number" ? data.deaths : 0,
    };
  } catch {
    return null;
  }
}

function writeSave(state: GameState) {
  if (typeof window === "undefined") return;
  try {
    const save: SavedRun = {
      stage: state.stage,
      health: state.health,
      maxHealth: state.maxHealth,
      flesh: state.flesh,
      kills: state.kills,
      parries: state.parries,
      mutations: state.mutations,
      checkpointX: state.checkpoint?.x ?? null,
      deaths: state.deaths,
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // stockage indisponible : la progression reste en memoire
  }
}

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
  lastUnlocked: null,
  optionsReturnPhase: "menu",
  dodgeReadyAt: 0,
  dodgeCooldownMs: 700,
  absorbProgress: 0,
  absorbing: false,
  altarHealUsed: false,
  stage: "cathedrale",
  checkpoint: null,
  deaths: 0,
  respawnToken: 0,

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
      stage: "cathedrale",
      checkpoint: null,
      deaths: 0,
    }),

  /** le bouton Continuer ouvre desormais la selection de salle */
  continueRun: () => set({ phase: "stages" }),
  openStageSelect: () => set({ phase: "stages" }),

  /** reprise sur la salle choisie, en conservant l'etat du heros */
  continueAtStage: (stage) =>
    set({
      phase: "playing",
      stage,
      hasSave: true,
      absorbing: false,
      absorbProgress: 0,
      altarHealUsed: false,
      checkpoint: null,
    }),

  // changer de salle invalide l'autel scelle dans la precedente
  setStage: (stage) =>
    set((s) => ({
      stage,
      hasSave: true,
      checkpoint: s.checkpoint && s.checkpoint.stage === stage ? s.checkpoint : null,
    })),

  hydrateRun: () => {
    const save = readSave();
    if (!save) return;
    const effects = computeEffects(save.mutations);
    set({
      stage: save.stage,
      health: save.health,
      maxHealth: save.maxHealth,
      flesh: save.flesh,
      kills: save.kills,
      parries: save.parries,
      mutations: save.mutations,
      effects,
      hasSave: true,
      deaths: save.deaths,
      checkpoint:
        save.checkpointX !== null ? { stage: save.stage, x: save.checkpointX } : null,
    });
  },


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
      return health === 0
        ? { ...base, phase: "dead" as Phase, deaths: s.deaths + 1 }
        : base;
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




  setCheckpoint: (x) => set((s) => ({ checkpoint: { stage: s.stage, x }, hasSave: true })),

  /**
   * Reapparition : plus de renaissance gratuite. Le heros repart a l'autel
   * scelle (ou au debut de la salle si aucun), la Chair accumulee est perdue
   * et la salle est repeuplee par le relancement de la scene.
   */
  respawnAtCheckpoint: () =>
    set((s) => ({
      phase: "playing" as Phase,
      health: s.maxHealth,
      flesh: 0,
      absorbing: false,
      absorbProgress: 0,
      altarHealUsed: false,
      respawnToken: s.respawnToken + 1,
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
      lastUnlocked: {
        id: mutation.id,
        name: mutation.name,
        summary: mutationSummary(mutation, state.mutations),
        at: Date.now(),
      },
    });
  },

  clearLastUnlocked: () => set({ lastUnlocked: null }),
}));

// sauvegarde locale : salle atteinte + etat du heros, ecrite a chaque changement
let saveTimer: ReturnType<typeof setTimeout> | undefined;
useGameStore.subscribe((state) => {
  if (!state.hasSave) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => writeSave(useGameStore.getState()), 300);
});

