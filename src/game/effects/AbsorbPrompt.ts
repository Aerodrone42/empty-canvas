import Phaser from "phaser";

import {
  detectPadBrand,
  keyLabel,
  padLabel,
  useBindingsStore,
} from "@/store/bindingsStore";

/**
 * Petit badge de commande affiche au-dessus du heros quand il peut absorber
 * le sang d'une flaque pour se soigner : une pastille discrete contenant
 * uniquement le symbole de la touche, dessinee a la taille du glyphe.
 */
export class AbsorbPrompt {
  private root: Phaser.GameObjects.Container;
  private plate: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private shown = false;
  private label = "";

  constructor(scene: Phaser.Scene) {
    this.plate = scene.add.graphics();

    this.text = scene.add
      .text(0, 0, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#e2d6c8",
        align: "center",
      })
      .setOrigin(0.5);

    this.root = scene.add
      .container(0, 0, [this.plate, this.text])
      .setDepth(20)
      .setAlpha(0)
      .setVisible(false);
  }

  private redraw(label: string) {
    this.label = label;
    this.text.setText(label);

    const w = Math.max(20, this.text.width + 12);
    const h = Math.max(18, this.text.height + 6);

    this.plate.clear();
    if (!label) return;
    this.plate.fillStyle(0x1a1513, 0.82);
    this.plate.fillRoundedRect(-w / 2, -h / 2, w, h, 5);
    this.plate.lineStyle(1, 0x6b4a41, 0.9);
    this.plate.strokeRoundedRect(-w / 2, -h / 2, w, h, 5);
  }

  /** A appeler chaque frame : `visible` decide de l'affichage. */
  tick(visible: boolean, x: number, y: number, delta = 16) {
    this.root.setPosition(x, y);

    if (visible) {
      const pad = this.root.scene.input.gamepad?.getPad(0);
      const binding = useBindingsStore.getState().bindings.absorb;
      const raw = pad?.connected
        ? padLabel(binding.pad, detectPadBrand())
        : keyLabel(binding.key);
      const label = raw && raw.trim() && raw.trim() !== "—" ? raw.trim() : "C";
      if (label !== this.label) this.redraw(label);
    }
    this.shown = visible;

    // fondu doux pour eviter le clignotement au bord des flaques
    const target = visible && this.label ? 0.9 : 0;
    const step = Phaser.Math.Clamp(delta / 140, 0, 1);
    let alpha = Phaser.Math.Linear(this.root.alpha, target, step);
    if (Math.abs(alpha - target) < 0.02) alpha = target;
    this.root.setAlpha(alpha).setVisible(alpha > 0.01);
  }

  destroy() {
    this.root.destroy();
  }
}
