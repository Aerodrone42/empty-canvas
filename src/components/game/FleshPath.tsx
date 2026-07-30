import { BRANCHES, MUTATIONS, isAvailable, type Mutation } from "@/game/mutations";
import { useGameStore } from "@/store/gameStore";

export function FleshPath() {
  const flesh = useGameStore((s) => s.flesh);
  const unlocked = useGameStore((s) => s.mutations);
  const unlockMutation = useGameStore((s) => s.unlockMutation);
  const close = useGameStore((s) => s.closeFleshPath);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/92 px-6 py-8 backdrop-blur-sm">
      <header className="text-center">
        <h2 className="text-glow-blood font-display text-3xl tracking-[0.35em] text-primary uppercase">
          La Voie de la Chair
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Chair disponible :{" "}
          <span className="font-display tracking-[0.2em] text-accent">{flesh}</span>
        </p>
      </header>

      <div className="mt-8 grid w-full max-w-5xl gap-5 md:grid-cols-3">
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
                onUnlock={() => unlockMutation(mutation.id)}
              />
            ))}
          </section>
        ))}
      </div>

      <button
        onClick={close}
        className="mt-8 border border-border bg-card/70 px-8 py-3 font-display text-xs tracking-[0.3em] uppercase transition-colors hover:border-primary/70 hover:bg-primary/20 hover:text-bone"
      >
        Refermer la plaie
      </button>
    </div>
  );
}

function MutationCard({
  mutation,
  owned,
  available,
  affordable,
  onUnlock,
}: {
  mutation: Mutation;
  owned: boolean;
  available: boolean;
  affordable: boolean;
  onUnlock: () => void;
}) {
  const locked = !available;
  const canBuy = !owned && available && affordable;

  return (
    <button
      onClick={canBuy ? onUnlock : undefined}
      disabled={!canBuy}
      className={[
        "border px-4 py-3 text-left transition-colors",
        owned
          ? "border-accent/60 bg-accent/10"
          : locked
            ? "border-border/50 bg-card/30 opacity-45"
            : canBuy
              ? "border-primary/50 bg-card/70 hover:border-primary hover:bg-primary/20"
              : "border-border bg-card/40 opacity-70",
        canBuy ? "cursor-pointer" : "cursor-not-allowed",
      ].join(" ")}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-xs tracking-[0.2em] text-bone uppercase">
          {mutation.name}
        </span>
        <span className="font-display text-[0.6rem] tracking-[0.2em] text-muted-foreground">
          {owned ? "GREFFÉE" : `${mutation.cost}`}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {locked ? "Une greffe antérieure manque." : mutation.description}
      </p>
    </button>
  );
}
