import Phaser from "phaser";

/** cles des pistes chargees dans le BootScene */
export const MUSIC_AMBIENT = "music-ambient";
export const MUSIC_COMBAT = "music-combat";
/** choeur gothique : theme de la premiere salle */
export const MUSIC_CHOIR = "music-choir";

/** piste jouee dans les salles suivantes */
const MAIN_TRACK = MUSIC_COMBAT;
const MAIN_VOLUME = 0.4;
/** le choeur est plus dense : un peu plus bas pour rester lisible */
const CHOIR_VOLUME = 0.34;

export type MusicOptions = {
  /** vrai dans la premiere salle : on lance le choeur gothique */
  intro?: boolean;
};

/**
 * Bande-son : une piste en boucle par salle, persistante d'un restart a
 * l'autre. Le son est attache au jeu (pas a la scene) pour ne jamais se
 * couper lors d'un changement de salle.
 */
export class MusicDirector {
  private track?: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene, opts: MusicOptions = {}) {
    const manager = scene.sound;
    const key = opts.intro ? MUSIC_CHOIR : MAIN_TRACK;
    const volume = opts.intro ? CHOIR_VOLUME : MAIN_VOLUME;

    // coupe la piste de l'autre salle si elle tourne encore
    const other = manager.get(opts.intro ? MAIN_TRACK : MUSIC_CHOIR);
    if (other?.isPlaying) other.stop();

    // reprend la piste deja en cours si elle existe
    const existing = manager.get(key);
    this.track = existing ?? manager.add(key, { loop: true, volume });

    const start = () => {
      if (!this.track) return;
      if (!this.track.isPlaying) this.track.play({ loop: true, volume });
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
