import { create } from "zustand";

export type ActionId =
  | "left"
  | "right"
  | "jump"
  | "attack"
  | "dodge"
  | "parry"
  | "special"
  | "pause"
  | "flesh";

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
  attack: "Frapper (maintenir = coup lourd)",
  dodge: "Esquive / roulade",
  parry: "Parade",
  special: "Rugissement de Chair",
  pause: "Pause",
  flesh: "Voie de la Chair",
};

export const ACTION_ORDER: ActionId[] = [
  "left",
  "right",
  "jump",
  "attack",
  "dodge",
  "parry",
  "special",
  "pause",
  "flesh",
];

export const DEFAULT_BINDINGS: Bindings = {
  left: { key: "KeyQ", pad: 14 },
  right: { key: "KeyD", pad: 15 },
  jump: { key: "Space", pad: 0 },
  attack: { key: "KeyE", pad: 2 },
  dodge: { key: "ShiftLeft", pad: 1 },
  parry: { key: "KeyA", pad: 4 },
  special: { key: "KeyR", pad: 5 },
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
    // migration douce : les actions inconnues de l'ancienne config gardent le defaut
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
  if (code.startsWith("Arrow")) {
    const arrows: Record<string, string> = {
      ArrowUp: "↑",
      ArrowDown: "↓",
      ArrowLeft: "←",
      ArrowRight: "→",
    };
    return arrows[code] ?? code;
  }
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

export type PadBrand = "xbox" | "playstation" | "generic";

/** Devine la famille de manette branchée pour afficher les bons libellés. */
export function detectPadBrand(): PadBrand {
  if (typeof navigator === "undefined" || !navigator.getGamepads) return "generic";
  const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
  const id = pad?.id?.toLowerCase() ?? "";
  if (!id) return "generic";
  if (/playstation|dualshock|dualsense|054c|sony|wireless controller/.test(id)) {
    return "playstation";
  }
  if (/xbox|xinput|045e|microsoft/.test(id)) return "xbox";
  return "generic";
}

const PAD_NAMES: Record<number, [xbox: string, ps: string]> = {
  0: ["A", "Croix"],
  1: ["B", "Cercle"],
  2: ["X", "Carré"],
  3: ["Y", "Triangle"],
  4: ["LB", "L1"],
  5: ["RB", "R1"],
  6: ["LT", "L2"],
  7: ["RT", "R2"],
  8: ["View", "Share"],
  9: ["Menu", "Options"],
  10: ["L3", "L3"],
  11: ["R3", "R3"],
  12: ["D-Pad ↑", "D-Pad ↑"],
  13: ["D-Pad ↓", "D-Pad ↓"],
  14: ["D-Pad ←", "D-Pad ←"],
  15: ["D-Pad →", "D-Pad →"],
};

/** Libellé lisible pour un bouton de manette, adapté à la marque détectée. */
export function padLabel(index: number, brand: PadBrand = "generic") {
  if (index < 0) return "—";
  const names = PAD_NAMES[index];
  if (!names) return `Bouton ${index}`;
  const [xbox, ps] = names;
  if (brand === "xbox") return xbox;
  if (brand === "playstation") return ps;
  return xbox === ps ? xbox : `${xbox} / ${ps}`;
}
