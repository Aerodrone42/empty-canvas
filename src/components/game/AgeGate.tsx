import { useGameStore } from "@/store/gameStore";

export function AgeGate() {
  const enter = useGameStore((s) => s.enter);

  return (
    <div className="vignette flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-display text-xs tracking-[0.5em] text-muted-foreground uppercase">
        Avertissement
      </p>

      <h1 className="text-glow-blood mt-6 text-5xl text-primary sm:text-6xl">18+</h1>

      <div className="mt-8 max-w-xl space-y-4 text-base leading-relaxed text-foreground/80">
        <p>
          <span className="font-display tracking-widest text-bone">Sanguine Vigile</span> contient
          de la violence graphique, du gore, de l&apos;horreur corporelle et des thèmes religieux
          dérangeants.
        </p>
        <p className="text-muted-foreground">
          Ce jeu est destiné à un public averti. En entrant, vous confirmez avoir 18 ans ou plus.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={enter}
          className="border border-primary/70 bg-primary/15 px-8 py-3 font-display text-sm tracking-[0.25em] text-bone uppercase transition-colors hover:bg-primary/35"
        >
          Entrer
        </button>
        <a
          href="https://www.google.com"
          className="border border-border px-8 py-3 font-display text-sm tracking-[0.25em] text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          Quitter
        </a>
      </div>
    </div>
  );
}
