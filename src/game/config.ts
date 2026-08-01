import Phaser from "phaser";

import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    pixelArt: false,
    render: {
      antialias: true,
      antialiasGL: true,
      roundPixels: true,
    },
    backgroundColor: "#14090b",
    input: {
      gamepad: true,
    },
    scale: {
      // ENVELOP remplit toute la fenêtre (pas de bandes noires) : le décor
      // déborde légèrement au lieu d'être encadré.
      mode: Phaser.Scale.ENVELOP,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      fullscreenTarget: parent,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 1500 },
        debug: false,
      },
    },
    scene: [BootScene, GameScene],
  };
}
