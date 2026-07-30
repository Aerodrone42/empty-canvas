import { useGameStore } from "@/store/gameStore";

export function Hud() {
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const flesh = useGameStore((s) => s.flesh);
  const maxFlesh = useGameStore((s) => s.maxFlesh);
  const kills = useGameStore((s) => s.kills);

  return (
    <div className="pointer-events-none absolute top-0 left-0 z-10 flex flex-col gap-2 p-5">
      <Gauge
        label="Vitalité"
        value={health}
        max={maxHealth}
        barClass="bg-primary"
        width="w-56"
      />
      <Gauge label="Chair" value={flesh} max={maxFlesh} barClass="bg-accent" width="w-40" />
      <p className="mt-1 font-display text-[0.6rem] tracking-[0.35em] text-muted-foreground uppercase">
        Absous · {kills}
      </p>
    </div>
  );
}

function Gauge({
  label,
  value,
  max,
  barClass,
  width,
}: {
  label: string;
  value: number;
  max: number;
  barClass: string;
  width: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={width}>
      <p className="font-display text-[0.55rem] tracking-[0.4em] text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-1 h-2 border border-border bg-card/80">
        <div
          className={`h-full transition-[width] duration-200 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
