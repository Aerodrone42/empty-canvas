import { useEffect, useState } from "react";

import { SPECIAL_COST } from "@/game/combat";
import { keyLabel, useBindingsStore } from "@/store/bindingsStore";
import { useGameStore } from "@/store/gameStore";

export function Hud() {
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const flesh = useGameStore((s) => s.flesh);
  const maxFlesh = useGameStore((s) => s.maxFlesh);
  const kills = useGameStore((s) => s.kills);
  const parries = useGameStore((s) => s.parries);
  const mutations = useGameStore((s) => s.mutations);
  const effects = useGameStore((s) => s.effects);
  const dodgeReadyAt = useGameStore((s) => s.dodgeReadyAt);
  const dodgeCooldownMs = useGameStore((s) => s.dodgeCooldownMs);
  const bindings = useBindingsStore((s) => s.bindings);

  const dodgePct = useDodgeCharge(dodgeReadyAt, dodgeCooldownMs);
  const specialCost = Math.round(SPECIAL_COST * effects.specialCostMult);
  const specialReady = flesh >= specialCost;

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
      <Gauge
        label="Esquive"
        value={dodgePct}
        max={100}
        barClass={dodgePct >= 100 ? "bg-bone" : "bg-muted-foreground"}
        width="w-28"
      />
      <p className="mt-1 font-display text-[0.6rem] tracking-[0.35em] text-muted-foreground uppercase">
        Absous · {kills} — Parades · {parries} — Greffes · {mutations.length}
      </p>
      <p
        className={`font-display text-[0.55rem] tracking-[0.3em] uppercase ${
          specialReady ? "text-primary" : "text-muted-foreground/50"
        }`}
      >
        {keyLabel(bindings.special.key)} · Rugissement ({specialCost} chair)
      </p>
      <p className="font-display text-[0.55rem] tracking-[0.3em] text-muted-foreground/60 uppercase">
        {keyLabel(bindings.attack.key)} frappe / maintenir = lourd ·{" "}
        {keyLabel(bindings.dodge.key)} esquive · {keyLabel(bindings.parry.key)} parade ·{" "}
        {keyLabel(bindings.flesh.key)} autel
      </p>
    </div>
  );
}

/** Recharge de l'esquive, en pourcentage. */
function useDodgeCharge(readyAt: number, cooldown: number) {
  const [pct, setPct] = useState(100);

  useEffect(() => {
    const tick = () => {
      const remaining = readyAt - Date.now();
      setPct(remaining <= 0 ? 100 : Math.max(0, 100 - (remaining / cooldown) * 100));
    };
    tick();
    const id = window.setInterval(tick, 80);
    return () => window.clearInterval(id);
  }, [readyAt, cooldown]);

  return pct;
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
