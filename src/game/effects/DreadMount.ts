import Phaser from "phaser";

/**
 * Monture funebre : le dragon squelettique monte par son cavalier encapuchonne,
 * decoupe directement dans l'illustration de reference.
 *
 * Les cinq calques (corps+cavalier+crane, aile haute, aile basse, queue,
 * supplicie dans la gueule) proviennent du meme dessin et conservent leurs
 * coordonnees d'origine : au repos, l'assemblage reproduit l'illustration au
 * pixel pres. L'animation ne fait que pivoter chaque calque autour de son
 * articulation reelle, avec une amplitude assez faible pour que la silhouette
 * du dessin ne soit jamais trahie.
 *
 * Purement decoratif : aucun corps physique, aucune collision.
 */

export const TEX_MOUNT_BODY = "dread-body";
export const TEX_MOUNT_WING_TOP = "dread-wing-top";
export const TEX_MOUNT_WING_BOT = "dread-wing-bot";
export const TEX_MOUNT_TAIL = "dread-tail";
export const TEX_MOUNT_VICTIM = "dread-victim";

/** cadre source de l'illustration */
const SRC_W = 1200;
const SRC_H = 896;
/** centre de reference de la bete dans ce cadre */
const CX = 603;
const CY = 463;

/** coin haut-gauche de chaque calque dans le cadre source (issu de la decoupe) */
const OFFSETS: Record<string, { x: number; y: number }> = {
  [TEX_MOUNT_BODY]: { x: 11, y: 37 },
  [TEX_MOUNT_WING_TOP]: { x: 13, y: 39 },
  [TEX_MOUNT_WING_BOT]: { x: 225, y: 596 },
  [TEX_MOUNT_TAIL]: { x: 43, y: 560 },
  [TEX_MOUNT_VICTIM]: { x: 1033, y: 476 },
};

/** articulation reelle de chaque calque, en coordonnees source */
const PIVOTS: Record<string, { x: number; y: number }> = {
  [TEX_MOUNT_BODY]: { x: CX, y: CY },
  [TEX_MOUNT_WING_TOP]: { x: 601, y: 249 },
  [TEX_MOUNT_WING_BOT]: { x: 1014, y: 608 },
  [TEX_MOUNT_TAIL]: { x: 516, y: 648 },
  [TEX_MOUNT_VICTIM]: { x: 1072, y: 508 },
};

/** largeur affichee de la bete entiere, ailes deployees */
const MOUNT_W = 470;
/** hauteur de croisiere dans le ciel */
const CRUISE_Y = 400;
/** parallaxe : la bete est loin derriere l'architecture de premier plan */
const SCROLL_FACTOR = 0.55;
/** cadence du battement : lente et pesante, c'est une carcasse */
const FLAP_SPEED = 1.9;

export class DreadMount {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly wingTop: Phaser.GameObjects.Image;
  private readonly wingBot: Phaser.GameObjects.Image;
  private readonly tail: Phaser.GameObjects.Image;
  private readonly victim: Phaser.GameObjects.Image;
  private readonly gore: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly viewWidth: number;
  private readonly scale: number;
  private timer?: Phaser.Time.TimerEvent;
  private flying = false;
  private vx = 0;
  private baseY = CRUISE_Y;
  private flap = 0;
  private swallowAt = 0;
  private swallowed = false;
  private destroyed = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.viewWidth = scene.scale.width;
    this.scale = MOUNT_W / SRC_W;

    const body = this.piece(TEX_MOUNT_BODY);
    this.wingTop = this.piece(TEX_MOUNT_WING_TOP);
    this.wingBot = this.piece(TEX_MOUNT_WING_BOT);
    this.tail = this.piece(TEX_MOUNT_TAIL);
    this.victim = this.piece(TEX_MOUNT_VICTIM);

    // ordre de profondeur : l'aile haute passe derriere le cavalier, la
    // membrane basse drape devant le poitrail.
    this.root = scene.add
      .container(-9999, CRUISE_Y, [
        this.wingTop,
        this.tail,
        body,
        this.wingBot,
        this.victim,
      ])
      .setScrollFactor(SCROLL_FACTOR)
      .setDepth(-7)
      .setVisible(false);

    this.ensureGoreTexture();
    this.gore = scene.add
      .particles(0, 0, "fx-mount-gore", {
        lifespan: { min: 700, max: 1500 },
        speedY: { min: 40, max: 140 },
        speedX: { min: -30, max: 30 },
        gravityY: 220,
        scale: { min: 0.6, max: 1.6 },
        alpha: { start: 0.85, end: 0 },
        tint: [0x5a0c12, 0x7d151c, 0x3a070b],
        frequency: -1,
        quantity: 1,
      })
      .setScrollFactor(SCROLL_FACTOR)
      .setDepth(-6);

    this.timer = scene.time.addEvent({
      delay: 2500,
      callback: () => this.launch(),
      loop: false,
    });
  }

  /**
   * Positionne un calque : son pivot local tombe exactement sur l'articulation
   * du dessin, et sa position replace le calque a sa place d'origine.
   */
  private piece(key: string): Phaser.GameObjects.Image {
    const tex = this.scene.textures.get(key).getSourceImage();
    const off = OFFSETS[key];
    const piv = PIVOTS[key];
    return this.scene.add
      .image(
        (piv.x - CX) * this.scale,
        (piv.y - CY) * this.scale,
        key,
      )
      .setOrigin((piv.x - off.x) / tex.width, (piv.y - off.y) / tex.height)
      .setScale(this.scale);
  }

  private ensureGoreTexture() {
    if (this.scene.textures.exists("fx-mount-gore")) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 3, 5);
    g.generateTexture("fx-mount-gore", 3, 5);
    g.destroy();
  }

  private scheduleNext() {
    if (this.destroyed) return;
    this.timer = this.scene.time.addEvent({
      delay: Phaser.Math.Between(16000, 24000),
      callback: () => this.launch(),
      loop: false,
    });
  }

  private launch() {
    if (this.destroyed || this.flying) return;

    const cam = this.scene.cameras.main;
    const toRight = Math.random() < 0.5;
    const margin = MOUNT_W * 1.2;

    const left = cam.scrollX * SCROLL_FACTOR - margin;
    const right = cam.scrollX * SCROLL_FACTOR + this.viewWidth + margin;

    this.root.x = toRight ? left : right;
    this.vx = (toRight ? 1 : -1) * Phaser.Math.Between(95, 130);
    this.baseY = Phaser.Math.Between(CRUISE_Y - 40, CRUISE_Y + 60);
    this.flap = 0;
    this.swallowed = false;
    this.swallowAt = Phaser.Math.Between(1800, 3400);

    // le dessin regarde vers la droite : on retourne tout le groupe si besoin
    this.root.setScale(toRight ? 1 : -1, 1);

    this.victim.setVisible(true).setAlpha(1).setScale(this.scale);
    this.root.setAlpha(0);
    this.root.setVisible(true);
    this.scene.tweens.add({ targets: this.root, alpha: 1, duration: 900 });

    this.flying = true;
  }

  /** la gueule se referme : gerbe de sang, le supplicie est aspire */
  private swallow() {
    this.swallowed = true;

    const dir = this.root.scaleX >= 0 ? 1 : -1;
    const mouthX = this.root.x + dir * (1090 - CX) * this.scale;
    const mouthY = this.root.y + (560 - CY) * this.scale;
    this.gore.setPosition(mouthX, mouthY);
    this.gore.explode(34);

    this.scene.tweens.add({
      targets: this.victim,
      alpha: 0,
      scaleX: this.scale * 0.35,
      scaleY: this.scale * 0.5,
      duration: 220,
      ease: "Quad.easeIn",
      onComplete: () => this.victim.setVisible(false),
    });

    // coup de machoire : la bete pique du nez puis se redresse
    this.scene.tweens.add({
      targets: this.root,
      angle: { from: 0, to: dir * 4 },
      duration: 140,
      yoyo: true,
      repeat: 1,
      ease: "Quad.easeOut",
    });
  }

  update(_time: number, delta: number) {
    if (!this.flying || this.destroyed) return;

    const dt = delta / 1000;
    this.root.x += this.vx * dt;
    this.flap += dt * FLAP_SPEED;

    const beat = Math.sin(this.flap);
    // Battement contenu : les deux membranes travaillent en opposition autour
    // de la pose exacte du dessin.
    this.wingTop.setAngle(beat * 5.5);
    this.wingBot.setAngle(Math.sin(this.flap + Math.PI) * 4);
    // La queue ondule a contretemps, tres legerement.
    this.tail.setAngle(Math.sin(this.flap - 1.0) * 3);
    // Tangage du corps sur la poussee des ailes.
    this.root.y = this.baseY - beat * 7;

    if (!this.swallowed) {
      this.swallowAt -= delta;
      // le supplicie se debat par soubresauts
      this.victim.setAngle(Math.sin(this.flap * 6.3) * 5);
      if (this.swallowAt <= 0) this.swallow();
    }

    const cam = this.scene.cameras.main;
    const margin = MOUNT_W * 1.4;
    const left = cam.scrollX * SCROLL_FACTOR - margin;
    const right = cam.scrollX * SCROLL_FACTOR + this.viewWidth + margin;

    if (this.root.x < left - 40 || this.root.x > right + 40) {
      this.flying = false;
      this.root.setVisible(false);
      this.root.setAngle(0);
      this.scheduleNext();
    }
  }

  destroy() {
    this.destroyed = true;
    this.timer?.remove();
    this.timer = undefined;
    this.scene.tweens.killTweensOf(this.root);
    this.scene.tweens.killTweensOf(this.victim);
    this.root.destroy(true);
    this.gore.destroy();
  }
}
