import Phaser from "phaser";

/**
 * Monture funebre : le dragon squelettique monte par son cavalier encapuchonne,
 * avec le supplicie coince dans la gueule.
 *
 * C'est un sprite unique : chaque frame est l'illustration complete, deformee
 * pour produire le battement des ailes et l'ondulation de la queue. Le cadre de
 * la feuille englobe tout le mouvement, donc rien ne peut etre rogne, et la
 * silhouette du dessin d'origine est conservee telle quelle.
 *
 * Purement decoratif : aucun corps physique, aucune collision.
 */

export const TEX_MOUNT_FLY = "dread-mount-fly";
export const TEX_MOUNT_FLY_FED = "dread-mount-fly-fed";
export const TEX_MOUNT_SWALLOW = "dread-mount-swallow";

export const ANIM_MOUNT_FLY = "dread-mount-fly-anim";
export const ANIM_MOUNT_FLY_FED = "dread-mount-fly-fed-anim";
export const ANIM_MOUNT_SWALLOW = "dread-mount-swallow-anim";

/** cadre d'une frame de la feuille : deja a la taille d'affichage (aucun rescale) */
const FRAME_W = 512;
/** largeur affichee de la bete entiere, ailes deployees */
const MOUNT_W = 512;
/** hauteur de croisiere dans le ciel */
const CRUISE_Y = 400;
/** parallaxe : la bete est loin derriere l'architecture de premier plan */
const SCROLL_FACTOR = 0.55;

/** enregistre les trois animations, une seule fois pour la scene */
export function registerDreadMountAnims(scene: Phaser.Scene) {
  if (!scene.anims.exists(ANIM_MOUNT_FLY)) {
    scene.anims.create({
      key: ANIM_MOUNT_FLY,
      frames: scene.anims.generateFrameNumbers(TEX_MOUNT_FLY, { start: 0, end: 7 }),
      frameRate: 9,
      repeat: -1,
    });
  }
  if (!scene.anims.exists(ANIM_MOUNT_FLY_FED)) {
    scene.anims.create({
      key: ANIM_MOUNT_FLY_FED,
      frames: scene.anims.generateFrameNumbers(TEX_MOUNT_FLY_FED, { start: 0, end: 7 }),
      frameRate: 9,
      repeat: -1,
    });
  }
  if (!scene.anims.exists(ANIM_MOUNT_SWALLOW)) {
    scene.anims.create({
      key: ANIM_MOUNT_SWALLOW,
      frames: scene.anims.generateFrameNumbers(TEX_MOUNT_SWALLOW, { start: 0, end: 3 }),
      frameRate: 6,
      repeat: 0,
    });
  }
}

export class DreadMount {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly gore: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly viewWidth: number;
  private timer?: Phaser.Time.TimerEvent;
  private flying = false;
  private vx = 0;
  private baseY = CRUISE_Y;
  private bob = 0;
  private swallowAt = 0;
  private swallowed = false;
  private destroyed = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.viewWidth = scene.scale.width;

    registerDreadMountAnims(scene);

    this.sprite = scene.add
      .sprite(-9999, CRUISE_Y, TEX_MOUNT_FLY, 0)
      .setOrigin(0.5, 0.5)
      .setScale(MOUNT_W / FRAME_W)
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

    this.sprite.on(
      Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ANIM_MOUNT_SWALLOW,
      () => {
        if (!this.destroyed) this.sprite.play(ANIM_MOUNT_FLY_FED);
      },
    );

    this.timer = scene.time.addEvent({
      delay: 2500,
      callback: () => this.launch(),
      loop: false,
    });
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

    this.sprite.x = toRight ? left : right;
    this.vx = (toRight ? 1 : -1) * Phaser.Math.Between(95, 130);
    this.baseY = Phaser.Math.Between(CRUISE_Y - 40, CRUISE_Y + 60);
    this.bob = 0;
    this.swallowed = false;
    this.swallowAt = Phaser.Math.Between(1800, 3400);

    // le dessin regarde vers la droite : on retourne le sprite si besoin
    this.sprite.setFlipX(!toRight);
    this.sprite.play(ANIM_MOUNT_FLY);

    this.sprite.setAlpha(0).setAngle(0).setVisible(true);
    this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 900 });

    this.flying = true;
  }

  /** la gueule se referme : gerbe de sang, le supplicie est aspire */
  private swallow() {
    this.swallowed = true;
    this.sprite.play(ANIM_MOUNT_SWALLOW);

    const dir = this.sprite.flipX ? -1 : 1;
    const s = this.sprite.scaleX;
    const mouthX = this.sprite.x + dir * 200 * Math.abs(s);
    const mouthY = this.sprite.y + 40 * Math.abs(s);
    this.gore.setPosition(mouthX, mouthY);
    this.gore.explode(34);

    // coup de machoire : la bete pique du nez puis se redresse
    this.scene.tweens.add({
      targets: this.sprite,
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
    this.sprite.x += this.vx * dt;
    this.bob += dt * 1.9;
    this.sprite.y = this.baseY - Math.sin(this.bob) * 7;

    if (!this.swallowed) {
      this.swallowAt -= delta;
      if (this.swallowAt <= 0) this.swallow();
    }

    const cam = this.scene.cameras.main;
    const margin = MOUNT_W * 1.4;
    const left = cam.scrollX * SCROLL_FACTOR - margin;
    const right = cam.scrollX * SCROLL_FACTOR + this.viewWidth + margin;

    if (this.sprite.x < left - 40 || this.sprite.x > right + 40) {
      this.flying = false;
      this.sprite.setVisible(false).setAngle(0);
      this.sprite.stop();
      this.scheduleNext();
    }
  }

  destroy() {
    this.destroyed = true;
    this.timer?.remove();
    this.timer = undefined;
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.destroy();
    this.gore.destroy();
  }
}
