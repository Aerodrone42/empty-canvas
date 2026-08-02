import { useEffect } from "react";

import { useBindingsStore } from "@/store/bindingsStore";
import { useGameStore } from "@/store/gameStore";

/**
 * Navigation des menus a la manette : croix directionnelle / stick gauche pour
 * deplacer le focus, A pour valider, B pour revenir, Start pour pause.
 * N'agit que hors phase de jeu (le gameplay lit la manette dans Player.ts).
 */
const FOCUS_CLASS = "pad-focus";

export function useGamepadUi() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.getGamepads) return;

    let frame = 0;
    let prevUp = false;
    let prevDown = false;
    let prevLeft = false;
    let prevRight = false;
    let prevA = false;
    let prevB = false;
    let prevStart = false;
    let prevSelect = false;
    let lastPhase = "";
    let repeatAt = 0;

    const focusables = () =>
      Array.from(
        document.querySelectorAll<HTMLButtonElement>("button:not([disabled])"),
      ).filter((el) => el.offsetParent !== null);

    const mark = (el: HTMLElement | null) => {
      document
        .querySelectorAll("." + FOCUS_CLASS)
        .forEach((node) => node.classList.remove(FOCUS_CLASS));
      if (el) el.classList.add(FOCUS_CLASS);
    };

    const focusAt = (items: HTMLButtonElement[], index: number) => {
      const el = items[index];
      if (!el) return;
      el.focus({ preventScroll: false });
      mark(el);
    };

    const moveFocus = (delta: number) => {
      const items = focusables();
      if (items.length === 0) return;
      const current = document.activeElement as HTMLElement | null;
      const index = current ? items.indexOf(current as HTMLButtonElement) : -1;
      if (index < 0) {
        focusAt(items, delta > 0 ? 0 : items.length - 1);
        return;
      }
      focusAt(items, (index + delta + items.length) % items.length);
    };

    const poll = () => {
      frame = requestAnimationFrame(poll);

      const pad = Array.from(navigator.getGamepads?.() ?? []).find(
        (p) => p && p.connected,
      );
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

      if (phase === "options" || phase === "playing") {
        // options : l'ecran d'attribution lit la manette lui-meme
        prevUp = prevDown = prevLeft = prevRight = prevA = prevB = false;
        lastPhase = phase;
        mark(null);
        return;
      }

      // a l'arrivee sur un menu : on place le focus sur le premier bouton
      if (phase !== lastPhase) {
        lastPhase = phase;
        const items = focusables();
        if (items.length) focusAt(items, 0);
      }

      const axisX = pad.axes[0] ?? 0;
      const axisY = pad.axes[1] ?? 0;
      const up = !!pad.buttons[12]?.pressed || axisY < -0.6;
      const down = !!pad.buttons[13]?.pressed || axisY > 0.6;
      const left = !!pad.buttons[14]?.pressed || axisX < -0.6;
      const right = !!pad.buttons[15]?.pressed || axisX > 0.6;
      const a = !!pad.buttons[0]?.pressed;
      const b = !!pad.buttons[1]?.pressed;

      const now = performance.now();
      const held = (value: boolean, prev: boolean) => {
        if (value && !prev) {
          repeatAt = now + 380;
          return true;
        }
        if (value && now >= repeatAt) {
          repeatAt = now + 120;
          return true;
        }
        return false;
      };

      if (held(up, prevUp) || held(left, prevLeft)) moveFocus(-1);
      else if (held(down, prevDown) || held(right, prevRight)) moveFocus(1);

      if (a && !prevA) {
        const items = focusables();
        const current = document.activeElement as HTMLElement | null;
        if (current && items.includes(current as HTMLButtonElement)) current.click();
        else if (items.length) focusAt(items, 0);
      }
      if (b && !prevB) {
        if (phase === "paused") resume();
        else if (phase === "flesh") closeFleshPath();
      }

      prevUp = up;
      prevDown = down;
      prevLeft = left;
      prevRight = right;
      prevA = a;
      prevB = b;
    };

    frame = requestAnimationFrame(poll);
    return () => {
      cancelAnimationFrame(frame);
      mark(null);
    };
  }, []);
}
