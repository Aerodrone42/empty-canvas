import { toggleFullscreen } from "@/game/fullscreen";
import { useGameStore } from "@/store/gameStore";

export function PauseMenu() {
  const resume = useGameStore((s) => s.resume);
  const toMenu = useGameStore((s) => s.toMenu);
  const openFleshPath = useGameStore((s) => s.openFleshPath);
  const openOptions = useGameStore((s) => s.openOptions);

  return (
    <Overlay>
      <h2 className="font-display text-3xl tracking-[0.3em] text-bone uppercase">Suspendu</h2>
      <p className="mt-3 text-sm text-muted-foreground">La chair attend.</p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <OverlayButton onClick={resume}>Reprendre</OverlayButton>
        <OverlayButton onClick={openFleshPath}>Voie de la Chair</OverlayButton>
        <OverlayButton onClick={() => void toggleFullscreen()}>Plein écran</OverlayButton>
        <OverlayButton onClick={openOptions}>Options</OverlayButton>
        <OverlayButton onClick={toMenu}>Retour au menu</OverlayButton>
      </div>
    </Overlay>
  );
}


export function DeathScreen() {
  const respawn = useGameStore((s) => s.respawnAtCheckpoint);
  const toMenu = useGameStore((s) => s.toMenu);
  const kills = useGameStore((s) => s.kills);
  const deaths = useGameStore((s) => s.deaths);
  const stage = useGameStore((s) => s.stage);
  const checkpoint = useGameStore((s) => s.checkpoint);
  const sealed = checkpoint?.stage === stage;

  return (
    <Overlay>
      <h2 className="text-glow-blood font-display text-4xl tracking-[0.3em] text-primary uppercase">
        Tu t&apos;es éteint
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">
        {kills} âme{kills > 1 ? "s" : ""} libérée{kills > 1 ? "s" : ""} avant la chute — mort n°
        {deaths}.
      </p>
      <p className="mt-2 max-w-sm text-xs text-primary/80">
        Toute la Chair accumulée se déverse dans la pierre. Les créatures de la salle se
        relèvent. Tes greffes, elles, restent.
      </p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <OverlayButton onClick={respawn}>
          {sealed ? "Se relever à l'autel" : "Reprendre la salle au début"}
        </OverlayButton>
        <OverlayButton onClick={toMenu}>Retour au menu</OverlayButton>
      </div>
    </Overlay>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/85 text-center backdrop-blur-sm">
      {children}
    </div>
  );
}

function OverlayButton({
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
      className="border border-border bg-card/70 px-6 py-3 font-display text-xs tracking-[0.3em] uppercase transition-colors hover:border-primary/70 hover:bg-primary/20 hover:text-bone disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}
