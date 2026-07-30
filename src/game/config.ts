import Phaser from "phaser";

import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    pixelArt: true,
    backgroundColor: "#14090b",
    input: {
      gamepad: true,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
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
