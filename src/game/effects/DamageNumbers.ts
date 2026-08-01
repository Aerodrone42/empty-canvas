import Phaser from "phaser";

export type DamageKind = "normal" | "crit" | "blocked";

type Slot = {
  text: Phaser.GameObjects.Text;
  free: boolean;
};

const POOL_SIZE = 18;

const STYLE: Record<
  DamageKind,
  { color: string; stroke: string; size: number; rise: number; life: number }
> = {
  normal: { color: "#e8c4bd", stroke: "#2a0508", size: 20, rise: 54, life: 620 },
  crit: { color: "#ffd166", stroke: "#4a1206", size: 34, rise: 82, life: 820 },
  blocked: { color: "#9aa7b5", stroke: "#12181e", size: 15, rise: 34, life: 480 },
};

/**
 * Petit pool de textes flottants : chaque coup affiche sa valeur au point
 * d'impact, dore et agrandi lorsqu'il s'agit d'un critique.
 */
export class DamageNumbers {
  private readonly slots: Slot[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    for (let i = 0; i < POOL_SIZE; i += 1) {
      const text = scene.add
        .text(0, 0, "", {
          fontFamily: "monospace",
          fontStyle: "bold",
          fontSize: "20px",
          color: "#e8c4bd",
        })
        .setOrigin(0.5, 1)
        .setDepth(60)
        .setVisible(false);
      text.setShadow(0, 2, "#000000", 4, true, true);
      this.slots.push({ text, free: true });
    }
  }

  show(x: number, y: number, amount: number, kind: DamageKind = "normal", boosted = false) {
    const slot = this.slots.find((s) => s.free);
    if (!slot) return;

    const style = STYLE[kind];
    slot.free = false;

    const label = kind === "crit" ? `${Math.round(amount)}!` : `${Math.round(amount)}`;
    const jitter = Phaser.Math.Between(-14, 14);

    // teinte distincte quand une greffe amplifie la frappe : la montee en
    // puissance se lit coup apres coup
    const color = boosted && kind !== "blocked" ? (kind === "crit" ? "#ff9d4d" : "#d97a86") : style.color;

    slot.text
      .setText(label)
      .setColor(color)
      .setStroke(style.stroke, kind === "crit" ? 6 : 4)
      .setFontSize(style.size)
      .setPosition(x + jitter, y)
      .setAlpha(1)
      .setAngle(kind === "crit" ? Phaser.Math.Between(-8, 8) : 0)
      .setScale(kind === "crit" ? 0.4 : 0.8)
      .setVisible(true);

    this.scene.tweens.add({
      targets: slot.text,
      scale: 1,
      duration: kind === "crit" ? 170 : 110,
      ease: "Back.easeOut",
    });

    this.scene.tweens.add({
      targets: slot.text,
      y: y - style.rise,
      alpha: 0,
      duration: style.life,
      delay: kind === "crit" ? 120 : 60,
      ease: "Quad.easeOut",
      onComplete: () => {
        slot.text.setVisible(false);
        slot.free = true;
      },
    });
  }

  destroy() {
    for (const slot of this.slots) slot.text.destroy();
    this.slots.length = 0;
  }
}
