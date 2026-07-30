import { useEffect, useRef } from "react";

import { toggleFullscreen } from "@/game/fullscreen";
import { installKeyboardTracking } from "@/game/input";
import { useBindingsStore } from "@/store/bindingsStore";
import { useGameStore } from "@/store/gameStore";


export function PhaserCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<{ destroy: (removeCanvas: boolean) => void } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    (async () => {
      const [{ default: Phaser }, { createGameConfig }] = await Promise.all([
        import("phaser"),
        import("@/game/config"),
      ]);
      if (cancelled || !containerRef.current) return;
      gameRef.current = new Phaser.Game(createGameConfig(containerRef.current));
      // utile pour l'inspection en dev (alignement des sprites, debug physique)
      (window as unknown as { __PHASER_GAME__?: unknown }).__PHASER_GAME__ =
        gameRef.current;
    })();

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    useBindingsStore.getState().hydrate();
    const uninstall = installKeyboardTracking();

    const onKey = (event: KeyboardEvent) => {
      const { phase, pause, resume, openFleshPath, closeFleshPath } = useGameStore.getState();
      const bindings = useBindingsStore.getState().bindings;

      if (event.code === "KeyF" || event.code === "F11") {
        event.preventDefault();
        void toggleFullscreen();
        return;
      }

      if (event.code === bindings.pause.key || event.code === "Escape") {
        if (phase === "playing") pause();
        else if (phase === "paused") resume();
        else if (phase === "flesh") closeFleshPath();
        return;
      }

      if (event.code === bindings.flesh.key) {
        event.preventDefault();
        if (phase === "playing") openFleshPath();
        else if (phase === "flesh") closeFleshPath();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      uninstall();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full w-full [&>canvas]:!h-full [&>canvas]:!w-full"
    />
  );
}
