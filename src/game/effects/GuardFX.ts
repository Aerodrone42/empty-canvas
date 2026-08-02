import Phaser from "phaser";

/**
 * Retour visuel de la garde. Aucun bouclier n'est dessine : seule une parade
 * reussie au bon moment produit des etincelles et l'eclat "PARADE".
 */
export class GuardFX {
  constructor(private scene: Phaser.Scene) {}

  /** Blocage simple : sursaut discret, aucune etincelle. */
  blockThud(x: number, y: number, dir: number) {
    const g = this.scene.add.graphics();
    g.setDepth(6);
    g.fillStyle(0x2c3a4a, 0.35);
    g.fillCircle(0, 0, 16);
    g.setPosition(x + dir * 26, y - 62);
    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      scale: 1.6,
      duration: 180,
      ease: "Quad.easeOut",
      onComplete: () => g.destroy(),
    });
  }

  /** Parade parfaite : etincelles, anneau et mention "PARADE". */
  perfectFlash(x: number, y: number, dir: number) {
    const cx = x + dir * 32;
    const cy = y - 68;

    // anneau qui se dilate
    const ring = this.scene.add.graphics();
    ring.setDepth(7);
    ring.lineStyle(3, 0xffeeb0, 0.95);
    ring.strokeCircle(0, 0, 18);
    ring.setPosition(cx, cy);
    this.scene.tweens.add({
      targets: ring,
      scale: 2.6,
      alpha: 0,
      duration: 260,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });

    // gerbe d'etincelles
    for (let i = 0; i < 14; i++) {
      const s = this.scene.add.graphics();
      s.setDepth(7);
      s.fillStyle(i % 3 === 0 ? 0xfff6d0 : 0xffc86a, 1);
      s.fillRect(-1.5, -1.5, 3, 3);
      s.setPosition(cx, cy);
      const angle = Phaser.Math.DegToRad(
        Phaser.Math.Between(-70, 70) + (dir >= 0 ? 0 : 180),
      );
      const dist = Phaser.Math.Between(40, 120);
      this.scene.tweens.add({
        targets: s,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist * 0.7,
        alpha: 0,
        scale: 0.4,
        duration: Phaser.Math.Between(220, 400),
        ease: "Quad.easeOut",
        onComplete: () => s.destroy(),
      });
    }

    // mention "PARADE"
    const label = this.scene.add
      .text(x, y - 168, "PARADE", {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: "#ffe9a8",
        stroke: "#2a1206",
        strokeThickness: 5,
      })
      .setOrigin(0.5, 1)
      .setDepth(9);

    this.scene.tweens.add({
      targets: label,
      y: y - 208,
      alpha: 0,
      duration: 620,
      ease: "Quad.easeOut",
      onComplete: () => label.destroy(),
    });
  }
}
