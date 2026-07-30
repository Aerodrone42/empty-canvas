import Phaser from "phaser";

/** cles des deux pistes chargees dans le BootScene */
export const MUSIC_AMBIENT = "music-ambient";
export const MUSIC_COMBAT = "music-combat";

const AMBIENT_VOLUME = 0.35;
const COMBAT_VOLUME = 0.45;
const FADE_MS = 1200;

/**
 * Bande-son adaptative : piano d'horreur en exploration, nappe gothique
 * epique des qu'une creature engage le heros.
 */
export class MusicDirector {
  private scene: Phaser.Scene;
  private ambient?: Phaser.Sound.BaseSound;
  private combat?: Phaser.Sound.BaseSound;
  private inCombat = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.ambient = scene.sound.add(MUSIC_AMBIENT, { loop: true, volume: 0 });
    this.combat = scene.sound.add(MUSIC_COMBAT, { loop: true, volume: 0 });

    const start = () => {
      this.ambient?.play();
      this.combat?.play();
      this.fade(this.ambient, AMBIENT_VOLUME);
    };

    if (scene.sound.locked) {
      scene.sound.once(Phaser.Sound.Events.UNLOCKED, start);
    } else {
      start();
    }

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** bascule douce entre les deux pistes */
  setCombat(active: boolean) {
    if (active === this.inCombat) return;
    this.inCombat = active;
    this.fade(this.ambient, active ? 0 : AMBIENT_VOLUME);
    this.fade(this.combat, active ? COMBAT_VOLUME : 0);
  }

  private fade(sound: Phaser.Sound.BaseSound | undefined, volume: number) {
    if (!sound) return;
    this.scene.tweens.add({
      targets: sound,
      volume,
      duration: FADE_MS,
      ease: "Sine.easeInOut",
    });
  }

  destroy() {
    this.ambient?.stop();
    this.combat?.stop();
    this.ambient?.destroy();
    this.combat?.destroy();
    this.ambient = undefined;
    this.combat = undefined;
  }
}
