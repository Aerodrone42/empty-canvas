import Phaser from "phaser";

/** cles des pistes chargees dans le BootScene */
export const MUSIC_AMBIENT = "music-ambient";
export const MUSIC_COMBAT = "music-combat";
/** choeur gothique : theme de la premiere salle */
export const MUSIC_CHOIR = "music-choir";
/** suspense cinematique : theme du corridor (salle 2) */
export const MUSIC_SUSPENSE = "music-suspense";

/** piste jouee par defaut dans les salles sans theme dedie */
const MAIN_TRACK = MUSIC_COMBAT;
const MAIN_VOLUME = 0.4;
/** le choeur est plus dense : un peu plus bas pour rester lisible */
const CHOIR_VOLUME = 0.34;
const SUSPENSE_VOLUME = 0.38;

/** toutes les pistes de salle : sert a couper celle de la salle precedente */
const ROOM_TRACKS = [MAIN_TRACK, MUSIC_CHOIR, MUSIC_SUSPENSE];

export type MusicOptions = {
  /** vrai dans la premiere salle : on lance le choeur gothique */
  intro?: boolean;
  /** vrai dans le corridor : on lance le suspense cinematique */
  suspense?: boolean;
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
    let key = MAIN_TRACK;
    let volume = MAIN_VOLUME;
    if (opts.intro) {
      key = MUSIC_CHOIR;
      volume = CHOIR_VOLUME;
    } else if (opts.suspense) {
      key = MUSIC_SUSPENSE;
      volume = SUSPENSE_VOLUME;
    }

    // coupe les pistes des autres salles si elles tournent encore
    for (const other of ROOM_TRACKS) {
      if (other === key) continue;
      const sound = manager.get(other);
      if (sound?.isPlaying) sound.stop();
    }

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
