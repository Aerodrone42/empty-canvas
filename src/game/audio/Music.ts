import Phaser from "phaser";

/** cles des deux pistes chargees dans le BootScene */
export const MUSIC_AMBIENT = "music-ambient";
export const MUSIC_COMBAT = "music-combat";

/** piste unique jouee en boucle pour l'instant */
const MAIN_TRACK = MUSIC_COMBAT;
const MAIN_VOLUME = 0.4;

/**
 * Bande-son : une seule piste en boucle, persistante d'une salle a l'autre.
 * Le son est attache au jeu (pas a la scene) pour ne jamais se couper lors
 * d'un changement de salle ou d'un restart de scene.
 */
export class MusicDirector {
  private track?: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene) {
    const manager = scene.sound;
    // reprend la piste deja en cours si elle existe
    const existing = manager.get(MAIN_TRACK);
    this.track = existing ?? manager.add(MAIN_TRACK, { loop: true, volume: MAIN_VOLUME });

    const start = () => {
      if (!this.track) return;
      if (!this.track.isPlaying) this.track.play({ loop: true, volume: MAIN_VOLUME });
    };

    if (manager.locked) {
      manager.once(Phaser.Sound.Events.UNLOCKED, start);
    } else {
      start();
    }

    // relance automatique si la piste se termine (fin de buffer, perte de boucle)
    this.track.on(Phaser.Sound.Events.COMPLETE, start);
  }

  /** conserve pour compatibilite : la musique ne change pas selon le combat */
  setCombat(_active: boolean) {
    // volontairement sans effet
  }

  /** arret explicite : uniquement si l'on veut vraiment couper la bande-son */
  destroy() {
    this.track?.stop();
    this.track?.destroy();
    this.track = undefined;
  }
}

