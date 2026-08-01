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

/** duree du fondu enchaine entre deux salles (ms) */
const CROSSFADE_MS = 1200;

/**
 * Bande-son : une piste en boucle par salle, persistante d'un restart a
 * l'autre. Le passage d'une salle a l'autre se fait en fondu enchaine :
 * l'ancienne piste descend pendant que la nouvelle monte.
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

    // fondu sortant des pistes des autres salles encore en cours
    for (const other of ROOM_TRACKS) {
      if (other === key) continue;
      const sound = manager.get(other) as Phaser.Sound.BaseSound & {
        volume?: number;
      };
      if (!sound?.isPlaying) continue;
      scene.tweens.add({
        targets: sound,
        volume: 0,
        duration: CROSSFADE_MS,
        onComplete: () => sound.stop(),
      });
    }

    // reprend la piste deja en cours si elle existe
    const existing = manager.get(key);
    this.track = existing ?? manager.add(key, { loop: true, volume: 0 });

    const start = () => {
      const track = this.track as
        | (Phaser.Sound.BaseSound & { volume: number })
        | undefined;
      if (!track) return;
      if (!track.isPlaying) track.play({ loop: true, volume: 0 });
      // fondu entrant vers le volume cible de la salle
      scene.tweens.add({
        targets: track,
        volume,
        duration: CROSSFADE_MS,
      });
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
