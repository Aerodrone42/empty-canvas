import { useBindingsStore, type ActionId } from "@/store/bindingsStore";

/**
 * Lecture d'entrées basée sur les attributions du joueur (clavier + manette).
 * Un seul listener global : Phaser lit l'état via les helpers ci-dessous.
 */
const down = new Set<string>();
const consumed = new Set<string>();
let installed = false;

function onKeyDown(event: KeyboardEvent) {
  if (event.repeat) return;
  down.add(event.code);
}

function onKeyUp(event: KeyboardEvent) {
  down.delete(event.code);
  consumed.delete(event.code);
}

function onBlur() {
  down.clear();
  consumed.clear();
}

export function installKeyboardTracking() {
  if (installed || typeof window === "undefined") return () => {};
  installed = true;
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  return () => {
    installed = false;
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
  };
}

function keyFor(action: ActionId) {
  return useBindingsStore.getState().bindings[action].key;
}

export function padFor(action: ActionId) {
  return useBindingsStore.getState().bindings[action].pad;
}

export function isKeyDown(action: ActionId) {
  const key = keyFor(action);
  return !!key && down.has(key);
}

/** true une seule fois par appui. */
export function isKeyJustDown(action: ActionId) {
  const key = keyFor(action);
  if (!key || !down.has(key)) return false;
  if (consumed.has(key)) return false;
  consumed.add(key);
  return true;
}

type ActionState = {
  down: boolean;
  justDown: boolean;
  justUp: boolean;
  /** durée de maintien en ms (0 si relâché) */
  heldMs: number;
  /** durée du dernier maintien terminé, lue au moment du justUp */
  releasedHeldMs: number;
  downAt: number;
};

const TRACKED: ActionId[] = [
  "left",
  "right",
  "jump",
  "attack",
  "dodge",
  "parry",
  "special",
];

/**
 * Agrège clavier + manette pour chaque action, avec détection des fronts
 * (appui / relâchement) et du temps de maintien nécessaire au coup chargé.
 */
export class ActionInput {
  private state = new Map<ActionId, ActionState>();

  constructor() {
    for (const action of TRACKED) {
      this.state.set(action, {
        down: false,
        justDown: false,
        justUp: false,
        heldMs: 0,
        releasedHeldMs: 0,
        downAt: 0,
      });
    }
  }

  update(pad: Phaser.Input.Gamepad.Gamepad | undefined, time: number) {
    const axisX = pad?.axes[0]?.getValue() ?? 0;

    const padDown = (action: ActionId) => {
      const index = padFor(action);
      if (index < 0) return false;
      const button = pad?.buttons[index];
      if (!button) return false;
      // gâchettes analogiques : on lit la valeur en plus de `pressed`
      return button.pressed || (button.value ?? 0) > 0.35;
    };

    for (const action of TRACKED) {
      const s = this.state.get(action)!;
      let isDown = isKeyDown(action) || padDown(action);
      if (action === "left") isDown = isDown || axisX < -0.3;
      if (action === "right") isDown = isDown || axisX > 0.3;

      s.justDown = isDown && !s.down;
      s.justUp = !isDown && s.down;
      if (s.justDown) s.downAt = time;
      if (s.justUp) s.releasedHeldMs = time - s.downAt;
      s.heldMs = isDown ? time - s.downAt : 0;
      s.down = isDown;
    }
  }

  isDown(action: ActionId) {
    return this.state.get(action)?.down ?? false;
  }

  justDown(action: ActionId) {
    return this.state.get(action)?.justDown ?? false;
  }

  justUp(action: ActionId) {
    return this.state.get(action)?.justUp ?? false;
  }

  heldMs(action: ActionId) {
    return this.state.get(action)?.heldMs ?? 0;
  }

  releasedHeldMs(action: ActionId) {
    return this.state.get(action)?.releasedHeldMs ?? 0;
  }
}
