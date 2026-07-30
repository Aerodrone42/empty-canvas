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

export function installKeyboardTracking() {
  if (installed || typeof window === "undefined") return () => {};
  installed = true;
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", () => {
    down.clear();
    consumed.clear();
  });
  return () => {
    installed = false;
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
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
