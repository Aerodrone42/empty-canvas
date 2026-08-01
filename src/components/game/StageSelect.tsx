import type { BackdropKey } from "@/game/assets";
import { ROOM_LABELS, ROOM_ORDER } from "@/game/rooms";
import { useGameStore } from "@/store/gameStore";

/**
 * Selection de salle : toutes les salles sont accessibles en permanence,
 * pour pouvoir tester n'importe quel niveau sans refaire les precedents.
 */
export function StageSelect() {
  const continueAtStage = useGameStore((s) => s.continueAtStage);
  const toMenu = useGameStore((s) => s.toMenu);
  const stage = useGameStore((s) => s.stage);

  return (
    <div className="vignette flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-display text-[0.65rem] tracking-[0.6em] text-muted-foreground uppercase">
        Continuer
      </p>
      <h2 className="text-glow-blood mt-5 font-display text-3xl tracking-[0.25em] text-bone uppercase">
        Choisir une salle
      </h2>

      <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
        {ROOM_ORDER.map((key: BackdropKey) => (
          <button
            key={key}
            onClick={() => continueAtStage(key)}
            className={`flex items-center justify-between border px-5 py-4 text-left font-display text-sm tracking-[0.2em] uppercase transition-colors hover:border-primary/70 hover:bg-primary/20 hover:text-bone ${
              key === stage
                ? "border-primary/70 bg-primary/15 text-bone"
                : "border-border bg-card/60"
            }`}
          >
            <span>{ROOM_LABELS[key]}</span>
            {key === stage && (
              <span className="text-[0.6rem] tracking-[0.25em] text-primary">
                Reprise ici
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={toMenu}
        className="mt-10 border border-border bg-card/60 px-6 py-3 font-display text-xs tracking-[0.3em] uppercase transition-colors hover:border-primary/70 hover:bg-primary/20 hover:text-bone"
      >
        Retour
      </button>
    </div>
  );
}
