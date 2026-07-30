import { create } from "zustand";

export type ActionId = "left" | "right" | "jump" | "attack" | "pause" | "flesh";

export type Binding = {
  /** KeyboardEvent.code, ex: "KeyQ", "Space" */
  key: string;
  /** index de bouton manette (standard mapping) */
  pad: number;
};

export type Bindings = Record<ActionId, Binding>;

export const ACTION_LABELS: Record<ActionId, string> = {
  left: "Aller à gauche",
  right: "Aller à droite",
  jump: "Sauter",
  attack: "Frapper",
  pause: "Pause",
  flesh: "Voie de la Chair",
};

export const ACTION_ORDER: ActionId[] = [
  "left",
  "right",
  "jump",
  "attack",
  "pause",
  "flesh",
];

export const DEFAULT_BINDINGS: Bindings = {
  left: { key: "KeyQ", pad: 14 },
  right: { key: "KeyD", pad: 15 },
  jump: { key: "Space", pad: 0 },
  attack: { key: "KeyE", pad: 2 },
  pause: { key: "Escape", pad: 9 },
  flesh: { key: "KeyF", pad: 8 },
};

const STORAGE_KEY = "sanguine-vigile:bindings";

function loadBindings(): Bindings {
  if (typeof window === "undefined") return DEFAULT_BINDINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BINDINGS;
    const parsed = JSON.parse(raw) as Partial<Bindings>;
    const merged = { ...DEFAULT_BINDINGS };
    for (const action of ACTION_ORDER) {
      const value = parsed[action];
      if (value && typeof value.key === "string" && typeof value.pad === "number") {
        merged[action] = { key: value.key, pad: value.pad };
      }
    }
    return merged;
  } catch {
    return DEFAULT_BINDINGS;
  }
}

function persist(bindings: Bindings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
  } catch {
    /* stockage indisponible : on garde la config en mémoire */
  }
}

export type BindingsState = {
  bindings: Bindings;
  hydrate: () => void;
  setKey: (action: ActionId, key: string) => void;
  setPad: (action: ActionId, pad: number) => void;
  reset: () => void;
};

export const useBindingsStore = create<BindingsState>((set, get) => ({
  bindings: DEFAULT_BINDINGS,

  hydrate: () => set({ bindings: loadBindings() }),

  setKey: (action, key) => {
    const bindings = { ...get().bindings };
    // libère la touche si elle est déjà attribuée ailleurs
    for (const other of ACTION_ORDER) {
      if (other !== action && bindings[other].key === key) {
        bindings[other] = { ...bindings[other], key: "" };
      }
    }
    bindings[action] = { ...bindings[action], key };
    persist(bindings);
    set({ bindings });
  },

  setPad: (action, pad) => {
    const bindings = { ...get().bindings };
    for (const other of ACTION_ORDER) {
      if (other !== action && bindings[other].pad === pad) {
        bindings[other] = { ...bindings[other], pad: -1 };
      }
    }
    bindings[action] = { ...bindings[action], pad };
    persist(bindings);
    set({ bindings });
  },

  reset: () => {
    persist(DEFAULT_BINDINGS);
    set({ bindings: DEFAULT_BINDINGS });
  },
}));

/** Libellé lisible pour une touche clavier (KeyboardEvent.code). */
export function keyLabel(code: string) {
  if (!code) return "—";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Arrow")) return "↑↓←→"[["Up", "Down", "Left", "Right"].indexOf(code.slice(5))] ?? code;
  if (code.startsWith("Numpad")) return "Pav. " + code.slice(6);
  const map: Record<string, string> = {
    Space: "Espace",
    Escape: "Échap",
    ShiftLeft: "Maj G",
    ShiftRight: "Maj D",
    ControlLeft: "Ctrl G",
    ControlRight: "Ctrl D",
    AltLeft: "Alt",
    AltRight: "Alt Gr",
    Enter: "Entrée",
    Tab: "Tab",
  };
  return map[code] ?? code;
}

/** Libellé lisible pour un bouton de manette. */
export function padLabel(index: number) {
  if (index < 0) return "—";
  const map: Record<number, string> = {
    0: "A / Croix",
    1: "B / Cercle",
    2: "X / Carré",
    3: "Y / Triangle",
    4: "LB",
    5: "RB",
    6: "LT",
    7: "RT",
    8: "Select",
    9: "Start",
    10: "L3",
    11: "R3",
    12: "D-Pad ↑",
    13: "D-Pad ↓",
    14: "D-Pad ←",
    15: "D-Pad →",
  };
  return map[index] ?? `Bouton ${index}`;
}
