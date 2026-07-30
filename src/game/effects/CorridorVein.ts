import Phaser from "phaser";

/**
 * Veine unique qui court le long du mur du corridor.
 *
 * Purement decoratif : une seule bande fine, sombre et humide, posee haut
 * sur le mur, rendue DERRIERE les statues (depth -22 contre -20). Elle
 * fremit tres legerement, comme un vaisseau qui pompe lentement.
 */

/** hauteur affichee de la veine */
const VEIN_H = 62;

export class CorridorVein {
  private readonly parts: Phaser.GameObjects.TileSprite[] = [];

  constructor(scene: Phaser.Scene, floorY: number, roomWidth: number) {
    const tex = scene.textures.get("corridor-vein").getSourceImage();
    const srcH = tex.height || 1;
    const scale = VEIN_H / srcH;

    const band = scene.add
      .tileSprite(0, floorY - 540, roomWidth / scale, srcH, "corridor-vein")
      .setOrigin(0, 0.5)
      .setScale(scale)
      .setScrollFactor(1)
      .setDepth(-22)
      .setAlpha(0.95)
      .setTint(0x7e1a22);

    this.parts.push(band);

    // fremissement a peine perceptible
    scene.tweens.add({
      targets: band,
      scaleY: scale * 1.04,
      alpha: 1,
      duration: 2600,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  destroy() {
    for (const p of this.parts) p.destroy();
    this.parts.length = 0;
  }
}
