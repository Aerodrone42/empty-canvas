import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AgeGate } from "@/components/game/AgeGate";
import { FleshPath } from "@/components/game/FleshPath";
import { Hud } from "@/components/game/Hud";

import { MainMenu } from "@/components/game/MainMenu";
import { Options } from "@/components/game/Options";
import { DeathScreen, PauseMenu } from "@/components/game/PauseMenu";
import { PhaserCanvas } from "@/components/game/PhaserCanvas";
import { useGamepadUi } from "@/hooks/useGamepadUi";
import { useGameStore } from "@/store/gameStore";

const TITLE = "Sanguine Vigile — Metroidvania d'horreur gothique";
const DESCRIPTION =
  "Incarnez le Vigile Muet dans une cathédrale de chair. Explorez la Nef Suppurante, affrontez les Pénitents-Greffés et suivez la Voie de la Chair. Contenu 18+.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const phase = useGameStore((s) => s.phase);
  const optionsReturnPhase = useGameStore((s) => s.optionsReturnPhase);
  const [hydrated, setHydrated] = useState(false);

  useGamepadUi();
  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return (
      <main className="vignette flex min-h-screen items-center justify-center bg-background">
        <h1 className="text-glow-blood font-display text-3xl tracking-[0.35em] text-primary uppercase">
          Sanguine Vigile
        </h1>
      </main>
    );
  }

  if (phase === "warning") {
    return (
      <main>
        <h1 className="sr-only">Sanguine Vigile</h1>
        <AgeGate />
      </main>
    );
  }

  if (phase === "menu" || (phase === "options" && optionsReturnPhase === "menu")) {
    return (
      <main className="relative min-h-screen">
        <MainMenu />
        {phase === "options" && <Options />}
      </main>
    );
  }


  return (
    <main className="vignette relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <h1 className="sr-only">Sanguine Vigile — Chapitre I</h1>
      <div className="relative aspect-video w-full max-w-[1280px]">
        <PhaserCanvas />
        <Hud />
        {phase === "paused" && <PauseMenu />}
        {phase === "flesh" && <FleshPath />}
        {phase === "dead" && <DeathScreen />}
      </div>
    </main>
  );
}

