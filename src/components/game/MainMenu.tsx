import { useGameStore } from "@/store/gameStore";

export function MainMenu() {
  const startNewRun = useGameStore((s) => s.startNewRun);
  const continueRun = useGameStore((s) => s.continueRun);
  const hasSave = useGameStore((s) => s.hasSave);

  return (
    <div className="vignette flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-display text-[0.65rem] tracking-[0.6em] text-muted-foreground uppercase">
        Chapitre I — La Nef Suppurante
      </p>

      <h1 className="text-glow-blood mt-6 text-5xl leading-tight text-bone sm:text-7xl">
        Sanguine
        <br />
        <span className="text-primary">Vigile</span>
      </h1>

      <div className="mt-12 flex w-full max-w-xs flex-col gap-3">
        <MenuButton onClick={startNewRun}>Nouvelle partie</MenuButton>
        <MenuButton onClick={continueRun} disabled={!hasSave}>
          Continuer
        </MenuButton>
        <MenuButton disabled>Options</MenuButton>
      </div>

      <p className="mt-12 max-w-md text-sm text-muted-foreground">
        Q / D pour marcher · Espace pour sauter · E pour frapper · Échap pour la pause
      </p>
    </div>
  );
}

function MenuButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="border border-border bg-card/60 px-6 py-3 font-display text-sm tracking-[0.3em] uppercase transition-colors hover:border-primary/70 hover:bg-primary/20 hover:text-bone disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-card/60"
    >
      {children}
    </button>
  );
}
