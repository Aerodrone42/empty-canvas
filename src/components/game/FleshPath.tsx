import { useState } from "react";

import {
  BRANCHES,
  MUTATIONS,
  STAT_ROWS,
  computeEffects,
  isAvailable,
  type Mutation,
} from "@/game/mutations";
import { useGameStore } from "@/store/gameStore";

export function FleshPath() {
  const flesh = useGameStore((s) => s.flesh);
  const unlocked = useGameStore((s) => s.mutations);
  const unlockMutation = useGameStore((s) => s.unlockMutation);
  const close = useGameStore((s) => s.closeFleshPath);

  const [hovered, setHovered] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const current = computeEffects(unlocked);
  const preview =
    hovered && !unlocked.includes(hovered) ? computeEffects([...unlocked, hovered]) : null;

  const buy = (id: string) => {
    unlockMutation(id);
    setFlash(id);
    window.setTimeout(() => setFlash((f) => (f === id ? null : f)), 600);
  };

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-background/92 px-6 py-8 backdrop-blur-sm">
      <header className="text-center">
        <h2 className="text-glow-blood font-display text-3xl tracking-[0.35em] text-primary uppercase">
          La Voie de la Chair
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          La Chair arrachée aux cadavres se greffe sur le Vigile. Chaque greffe est définitive et
          altère ses statistiques ; les greffes profondes exigent celle qui les précède.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Chair disponible :{" "}
          <span className="font-display tracking-[0.2em] text-accent">{flesh}</span>
        </p>
      </header>

      <div className="mx-auto mt-8 grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_1fr_1fr_260px]">
        {BRANCHES.map((branch) => (
          <section key={branch} className="flex flex-col gap-3">
            <h3 className="font-display text-[0.6rem] tracking-[0.4em] text-muted-foreground uppercase">
              {branch}
            </h3>
            {MUTATIONS.filter((m) => m.branch === branch).map((mutation) => (
              <MutationCard
                key={mutation.id}
                mutation={mutation}
                owned={unlocked.includes(mutation.id)}
                available={isAvailable(mutation, unlocked)}
                affordable={flesh >= mutation.cost}
                flashing={flash === mutation.id}
                onHover={setHovered}
                onUnlock={() => buy(mutation.id)}
              />
            ))}
          </section>
        ))}

        <aside className="h-fit border border-border bg-card/60 p-4 lg:sticky lg:top-4">
          <h3 className="font-display text-[0.6rem] tracking-[0.4em] text-muted-foreground uppercase">
            Anatomie du Vigile
          </h3>
          <dl className="mt-3 space-y-1.5">
            {STAT_ROWS.map((row) => {
              const now = row.format(current);
              const next = preview ? row.format(preview) : null;
              const improved = preview ? row.score(preview) !== row.score(current) : false;
              return (
                <div key={row.key} className="flex items-baseline justify-between gap-2 text-xs">
                  <dt className="font-display text-[0.55rem] tracking-[0.25em] text-muted-foreground uppercase">
                    {row.label}
                  </dt>
                  <dd
                    className={
                      improved
                        ? "text-right text-accent"
                        : "text-right text-bone/80"
                    }
                  >
                    {improved ? (
                      <>
                        <span className="text-muted-foreground/70 line-through">{now}</span>{" "}
                        <span>{next}</span>
                      </>
                    ) : (
                      now
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground/70">
            Survolez une greffe pour voir le gain avant de payer.
          </p>
        </aside>
      </div>

      <div className="flex justify-center">
        <button
          onClick={close}
          className="mt-8 border border-border bg-card/70 px-8 py-3 font-display text-xs tracking-[0.3em] uppercase transition-colors hover:border-primary/70 hover:bg-primary/20 hover:text-bone"
        >
          Refermer la plaie
        </button>
      </div>
    </div>
  );
}

function MutationCard({
  mutation,
  owned,
  available,
  affordable,
  flashing,
  onHover,
  onUnlock,
}: {
  mutation: Mutation;
  owned: boolean;
  available: boolean;
  affordable: boolean;
  flashing: boolean;
  onHover: (id: string | null) => void;
  onUnlock: () => void;
}) {
  const locked = !available;
  const canBuy = !owned && available && affordable;

  return (
    <button
      onClick={canBuy ? onUnlock : undefined}
      onMouseEnter={() => onHover(mutation.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(mutation.id)}
      onBlur={() => onHover(null)}
      disabled={!canBuy}
      className={[
        "border px-4 py-3 text-left transition-colors",
        owned
          ? "border-accent bg-accent/15 shadow-[0_0_18px_-6px_hsl(var(--accent))]"
          : locked
            ? "border-border/50 bg-card/30 opacity-45"
            : canBuy
              ? "border-primary/50 bg-card/70 hover:border-primary hover:bg-primary/20"
              : "border-border bg-card/40 opacity-70",
        flashing ? "animate-pulse border-primary bg-primary/40" : "",
        canBuy ? "cursor-pointer" : "cursor-not-allowed",
      ].join(" ")}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-xs tracking-[0.2em] text-bone uppercase">
          {mutation.name}
        </span>
        <span
          className={`font-display text-[0.6rem] tracking-[0.2em] ${
            owned ? "text-accent" : "text-muted-foreground"
          }`}
        >
          {owned ? "◈ GREFFÉE" : `${mutation.cost}`}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {locked ? "Une greffe antérieure manque." : mutation.description}
      </p>
    </button>
  );
}
