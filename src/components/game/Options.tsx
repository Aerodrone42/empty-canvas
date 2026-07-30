import { useEffect, useRef, useState } from "react";

import {
  ACTION_LABELS,
  ACTION_ORDER,
  keyLabel,
  padLabel,
  useBindingsStore,
  type ActionId,
} from "@/store/bindingsStore";
import { useGameStore } from "@/store/gameStore";

type Capture = { action: ActionId; device: "key" | "pad" } | null;

export function Options() {
  const bindings = useBindingsStore((s) => s.bindings);
  const setKey = useBindingsStore((s) => s.setKey);
  const setPad = useBindingsStore((s) => s.setPad);
  const reset = useBindingsStore((s) => s.reset);
  const closeOptions = useGameStore((s) => s.closeOptions);

  const [capture, setCapture] = useState<Capture>(null);
  const captureRef = useRef<Capture>(null);
  captureRef.current = capture;

  // capture clavier
  useEffect(() => {
    if (!capture || capture.device !== "key") return;
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.code !== "Escape") setKey(capture.action, event.code);
      setCapture(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [capture, setKey]);

  // capture manette
  useEffect(() => {
    if (!capture || capture.device !== "pad") return;
    let frame = 0;
    const poll = () => {
      frame = requestAnimationFrame(poll);
      const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
      if (!pad) return;
      const index = pad.buttons.findIndex((b) => b.pressed);
      if (index >= 0) {
        setPad(capture.action, index);
        setCapture(null);
      }
    };
    frame = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frame);
  }, [capture, setPad]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-y-auto bg-background/95 px-6 py-10 backdrop-blur-sm">
      <h2 className="font-display text-2xl tracking-[0.3em] text-bone uppercase">
        Commandes
      </h2>
      <p className="mt-2 text-xs text-muted-foreground">
        Clique sur une case puis appuie sur la touche ou le bouton à attribuer.
      </p>

      <div className="mt-8 w-full max-w-2xl border border-border bg-card/50">
        <div className="grid grid-cols-[1fr_auto_auto] gap-px border-b border-border bg-border/60 font-display text-[0.6rem] tracking-[0.3em] uppercase">
          <span className="bg-card px-4 py-2 text-muted-foreground">Action</span>
          <span className="w-36 bg-card px-4 py-2 text-center text-muted-foreground">
            Clavier
          </span>
          <span className="w-36 bg-card px-4 py-2 text-center text-muted-foreground">
            Manette
          </span>
        </div>

        {ACTION_ORDER.map((action) => (
          <div
            key={action}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-px bg-border/40"
          >
            <span className="bg-card/80 px-4 py-2 text-sm text-bone">
              {ACTION_LABELS[action]}
            </span>
            <BindCell
              width
              active={capture?.action === action && capture.device === "key"}
              onClick={() => setCapture({ action, device: "key" })}
            >
              {keyLabel(bindings[action].key)}
            </BindCell>
            <BindCell
              width
              active={capture?.action === action && capture.device === "pad"}
              onClick={() => setCapture({ action, device: "pad" })}
            >
              {padLabel(bindings[action].pad)}
            </BindCell>
          </div>
        ))}
      </div>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <OptionButton onClick={reset}>Réinitialiser</OptionButton>
        <OptionButton onClick={closeOptions}>Retour</OptionButton>
      </div>
    </div>
  );
}

function BindCell({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  width?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-36 px-4 py-2 text-center font-display text-[0.65rem] tracking-[0.2em] uppercase transition-colors ${
        active
          ? "bg-primary/30 text-bone"
          : "bg-card/80 text-muted-foreground hover:bg-primary/15 hover:text-bone"
      }`}
    >
      {active ? "…" : children}
    </button>
  );
}

function OptionButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="border border-border bg-card/70 px-6 py-3 font-display text-xs tracking-[0.3em] uppercase transition-colors hover:border-primary/70 hover:bg-primary/20 hover:text-bone"
    >
      {children}
    </button>
  );
}
