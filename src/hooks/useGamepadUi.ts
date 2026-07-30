import { useEffect } from "react";

import { useBindingsStore } from "@/store/bindingsStore";
import { useGameStore } from "@/store/gameStore";

/**
 * Navigation des menus a la manette : croix directionnelle / stick gauche pour
 * deplacer le focus, A pour valider, B pour revenir, Start pour pause.
 * N'agit que hors phase de jeu (le gameplay lit la manette dans Player.ts).
 */
export function useGamepadUi() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.getGamepads) return;

    let frame = 0;
    let prevUp = false;
    let prevDown = false;
    let prevA = false;
    let prevB = false;
    let prevStart = false;
    let prevSelect = false;

    const focusables = () =>
      Array.from(
        document.querySelectorAll<HTMLButtonElement>("button:not([disabled])"),
      ).filter((el) => el.offsetParent !== null);

    const moveFocus = (delta: number) => {
      const items = focusables();
      if (items.length === 0) return;
      const current = document.activeElement as HTMLElement | null;
      const index = current ? items.indexOf(current as HTMLButtonElement) : -1;
      const next = (index + delta + items.length) % items.length;
      items[next]?.focus();
    };

    const poll = () => {
      frame = requestAnimationFrame(poll);

      const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
      if (!pad) return;

      const { phase, pause, resume, openFleshPath, closeFleshPath, closeOptions } =
        useGameStore.getState();
      const bindings = useBindingsStore.getState().bindings;
      const btn = (index: number) => (index >= 0 ? !!pad.buttons[index]?.pressed : false);

      const start = btn(bindings.pause.pad);
      if (start && !prevStart) {
        if (phase === "playing") pause();
        else if (phase === "paused") resume();
        else if (phase === "flesh") closeFleshPath();
        else if (phase === "options") closeOptions();
      }
      prevStart = start;

      const select = btn(bindings.flesh.pad);
      if (select && !prevSelect) {
        if (phase === "playing") openFleshPath();
        else if (phase === "flesh") closeFleshPath();
      }
      prevSelect = select;

      if (phase === "options") {
        // en attribution : on laisse l'ecran d'options lire la manette
        prevUp = prevDown = prevA = prevB = false;
        return;
      }

      if (phase === "playing") {
        prevUp = prevDown = prevA = prevB = false;
        return;
      }


      const axisY = pad.axes[1] ?? 0;
      const up = !!pad.buttons[12]?.pressed || axisY < -0.6;
      const down = !!pad.buttons[13]?.pressed || axisY > 0.6;
      const a = !!pad.buttons[0]?.pressed;
      const b = !!pad.buttons[1]?.pressed;

      if (up && !prevUp) moveFocus(-1);
      if (down && !prevDown) moveFocus(1);
      if (a && !prevA) {
        const items = focusables();
        const current = document.activeElement as HTMLElement | null;
        if (current && items.includes(current as HTMLButtonElement)) current.click();
        else items[0]?.focus();
      }
      if (b && !prevB) {
        if (phase === "paused") resume();
        else if (phase === "flesh") closeFleshPath();
      }

      prevUp = up;
      prevDown = down;
      prevA = a;
      prevB = b;
    };

    frame = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frame);
  }, []);
}
