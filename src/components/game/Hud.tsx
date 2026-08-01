import { useEffect, useState } from "react";

import { SPECIAL_COST } from "@/game/combat";
import { keyLabel, useBindingsStore } from "@/store/bindingsStore";
import { ABSORB_COST, ABSORB_HEAL, useGameStore } from "@/store/gameStore";

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
  const absorbing = useGameStore((s) => s.absorbing);
  const absorbProgress = useGameStore((s) => s.absorbProgress);
  const bindings = useBindingsStore((s) => s.bindings);
  const lastUnlocked = useGameStore((s) => s.lastUnlocked);
  const clearLastUnlocked = useGameStore((s) => s.clearLastUnlocked);

  useEffect(() => {
    if (!lastUnlocked) return;
    const id = window.setTimeout(clearLastUnlocked, 6000);
    return () => window.clearTimeout(id);
  }, [lastUnlocked, clearLastUnlocked]);

  const dodgePct = useDodgeCharge(dodgeReadyAt, dodgeCooldownMs);
  const specialCost = Math.round(SPECIAL_COST * effects.specialCostMult);
  const specialReady = flesh >= specialCost;
  const healthPct = (health / maxHealth) * 100;
  const critical = healthPct <= 30;

  return (
    <>
      {/* vignette sanglante quand la vitalité est basse */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500"
        style={{
          opacity: critical ? 0.55 + (30 - healthPct) / 100 : 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(120,8,20,0.55) 78%, rgba(80,4,12,0.9) 100%)",
          animation: critical ? "pulse 1.6s ease-in-out infinite" : undefined,
        }}
      />

      {lastUnlocked && (
        <div className="pointer-events-none absolute inset-x-0 top-6 z-20 flex justify-center">
          <div className="border border-accent/60 bg-card/90 px-6 py-2 text-center">
            <p className="font-display text-[0.6rem] tracking-[0.4em] text-accent uppercase">
              Greffe · {lastUnlocked.name}
            </p>
            <p className="mt-1 text-[0.7rem] text-bone/80">{lastUnlocked.summary}</p>
          </div>
        </div>
      )}

      {absorbing && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex justify-center">
          <div className="w-56 text-center">
            <p className="font-display text-[0.6rem] tracking-[0.4em] text-primary uppercase">
              Absorption
            </p>
            <div className="mt-1 h-1.5 border border-primary/50 bg-card/80">
              <div
                className="h-full bg-primary transition-[width] duration-100"
                style={{ width: `${Math.round(absorbProgress * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* voile sombre pour garder le HUD lisible par-dessus le decor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-56"
        style={{
          background:
            "linear-gradient(to bottom, rgba(8,4,5,0.85) 0%, rgba(8,4,5,0.55) 45%, transparent 100%)",
        }}
      />

      <div className="pointer-events-none absolute top-0 left-0 z-10 flex flex-col gap-2 p-5">

        <div className="w-56">
          <p className="font-display text-[0.55rem] tracking-[0.4em] text-muted-foreground uppercase">
            Vitalité{" "}
            {effects.bonusHealth > 0 && (
              <span className="text-accent">+{effects.bonusHealth} greffés</span>
            )}
          </p>
          <div className="relative mt-1 h-2 border border-border bg-card/80">
            <div
              className={`h-full transition-[width] duration-200 ${
                critical ? "bg-destructive animate-pulse" : "bg-primary"
              }`}
              style={{ width: `${Math.max(0, Math.min(100, (health / maxHealth) * 100))}%` }}
            />
            {effects.bonusHealth > 0 && (
              <>
                {/* portion de vitalite issue des greffes, teintee a part */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 bg-accent/60"
                  style={{
                    left: `${(100 / maxHealth) * 100}%`,
                    width: `${Math.max(0, ((Math.min(health, maxHealth) - 100) / maxHealth) * 100)}%`,
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 w-px bg-bone/70"
                  style={{ left: `${(100 / maxHealth) * 100}%` }}
                />
              </>
            )}
          </div>
        </div>
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
        <p
          className={`font-display text-[0.55rem] tracking-[0.3em] uppercase ${
            flesh >= ABSORB_COST ? "text-accent" : "text-muted-foreground/50"
          }`}
        >
          Maintenir {keyLabel(bindings.parry.key)} hors combat · Absorber ({ABSORB_COST} chair →{" "}
          {ABSORB_HEAL} PV)
        </p>
        <p className="font-display text-[0.55rem] tracking-[0.3em] text-muted-foreground/60 uppercase">
          {keyLabel(bindings.attack.key)} frappe / maintenir = lourd ·{" "}
          {keyLabel(bindings.dodge.key)} esquive · {keyLabel(bindings.parry.key)} parade ·{" "}
          {keyLabel(bindings.flesh.key)} autel
        </p>
        <AltarLine />
        <p className="font-display text-[0.55rem] tracking-[0.3em] text-muted-foreground/60 uppercase">
          Haut + frappe · coup ascendant — Bas + frappe en l'air · piquée
        </p>
      </div>
    </>
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

/** Rappel du point de sauvegarde : autel scelle ou non dans la salle courante. */
function AltarLine() {
  const stage = useGameStore((s) => s.stage);
  const checkpoint = useGameStore((s) => s.checkpoint);
  const bindings = useBindingsStore((s) => s.bindings);
  const sealed = checkpoint?.stage === stage;

  return (
    <p
      className={`font-display text-[0.55rem] tracking-[0.3em] uppercase ${
        sealed ? "text-accent" : "text-muted-foreground/60"
      }`}
    >
      {sealed
        ? "Autel de sang scellé · réapparition assurée"
        : `Autel de sang non scellé · ${keyLabel(bindings.interact.key)} devant la vasque`}
    </p>
  );
}
