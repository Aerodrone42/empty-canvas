import Phaser from "phaser";

/** cles des deux pistes chargees dans le BootScene */
export const MUSIC_AMBIENT = "music-ambient";
export const MUSIC_COMBAT = "music-combat";

/** piste unique jouee en boucle pour l'instant */
const MAIN_TRACK = MUSIC_COMBAT;
const MAIN_VOLUME = 0.4;

/** Bande-son : une seule piste en boucle, independante des ennemis. */
export class MusicDirector {
  private track?: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene) {
    this.track = scene.sound.add(MAIN_TRACK, { loop: true, volume: MAIN_VOLUME });

    const start = () => this.track?.play();
    if (scene.sound.locked) {
      scene.sound.once(Phaser.Sound.Events.UNLOCKED, start);
    } else {
      start();
    }

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** conserve pour compatibilite : la musique ne change pas selon le combat */
  setCombat(_active: boolean) {
    // volontairement sans effet
  }

  destroy() {
    this.track?.stop();
    this.track?.destroy();
    this.track = undefined;
  }
}
