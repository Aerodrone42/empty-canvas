import { useEffect, useRef } from "react";

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
    })();

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const { phase, pause, resume } = useGameStore.getState();
      if (phase === "playing") pause();
      else if (phase === "paused") resume();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full w-full [&>canvas]:h-full [&>canvas]:w-full [&>canvas]:object-contain"
    />
  );
}
