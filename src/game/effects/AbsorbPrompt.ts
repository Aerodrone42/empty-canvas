import Phaser from "phaser";

import {
  detectPadBrand,
  keyLabel,
  padLabel,
  useBindingsStore,
} from "@/store/bindingsStore";

/**
 * Petit badge de commande affiche au-dessus du heros quand il peut absorber
 * le sang d'une flaque pour se soigner. Meme presentation que l'invite de
 * l'autel de sang : symbole de touche seul, sans phrase.
 */
export class AbsorbPrompt {
  private text: Phaser.GameObjects.Text;
  private shown = false;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add
      .text(0, 0, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#d8c9bb",
        backgroundColor: "#211b18",
        align: "center",
        padding: { x: 7, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setAlpha(0);
  }

  /** A appeler chaque frame : `visible` decide de l'affichage. */
  tick(visible: boolean, x: number, y: number, delta = 16) {
    this.text.setPosition(x, y);

    if (visible && !this.shown) {
      const pad = this.text.scene.input.gamepad?.getPad(0);
      const binding = useBindingsStore.getState().bindings.parry;
      this.text.setText(
        pad?.connected ? padLabel(binding.pad, detectPadBrand()) : keyLabel(binding.key),
      );
    }
    this.shown = visible;

    // fondu doux pour eviter le clignotement au bord des flaques
    const target = visible ? 0.9 : 0;
    const step = delta / 140;
    const alpha = Phaser.Math.Linear(
      this.text.alpha,
      target,
      Phaser.Math.Clamp(step, 0, 1),
    );
    this.text.setAlpha(Math.abs(alpha - target) < 0.02 ? target : alpha);
  }

  destroy() {
    this.text.destroy();
  }
}
