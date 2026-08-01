import Phaser from "phaser";

/**
 * Monture funebre : chauve-souris osseuse colossale montee par un cavalier
 * encapuchonne, qui traverse lentement le ciel de la cathedrale en tenant un
 * humain vivant dans sa gueule, puis l'avale a mi-parcours.
 *
 * Purement decoratif : aucun corps physique, aucune collision.
 */

export const TEX_MOUNT_PREY = "dread-mount-prey";
export const TEX_MOUNT_FED = "dread-mount-fed";
export const ANIM_MOUNT_PREY = "dread-mount-prey-fly";
export const ANIM_MOUNT_FED = "dread-mount-fed-fly";

/** envergure affichee de la bete */
const MOUNT_W = 460;
/** hauteur de croisiere dans le ciel */
const CRUISE_Y = 360;
/** parallaxe : la bete est loin derriere l'architecture de premier plan */
const SCROLL_FACTOR = 0.55;

export class DreadMount {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly gore: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly viewWidth: number;
  private timer?: Phaser.Time.TimerEvent;
  private flying = false;
  private vx = 0;
  private baseY = CRUISE_Y;
  private phase = 0;
  private swallowAt = 0;
  private swallowed = false;
  private destroyed = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.viewWidth = scene.scale.width;

    const tex = scene.textures.get(TEX_MOUNT_PREY).get(0);
    const scale = MOUNT_W / tex.width;

    this.sprite = scene.add
      .sprite(-9999, CRUISE_Y, TEX_MOUNT_PREY)
      .setOrigin(0.5, 0.5)
      .setScale(scale)
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
        alpha: { start: 0.75, end: 0 },
        tint: [0x5a0c12, 0x7d151c, 0x3a070b],
        frequency: -1,
        quantity: 1,
      })
      .setScrollFactor(SCROLL_FACTOR)
      .setDepth(-6);

    // premier passage rapidement apres l'entree dans la salle
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
      delay: Phaser.Math.Between(18000, 26000),
      callback: () => this.launch(),
      loop: false,
    });
  }

  private launch() {
    if (this.destroyed || this.flying) return;

    const cam = this.scene.cameras.main;
    const toRight = Math.random() < 0.5;
    const margin = MOUNT_W * 0.8;

    // en coordonnees "monde de parallaxe" : on travaille dans le referentiel
    // du sprite (scrollFactor applique par Phaser sur l'axe X).
    const left = cam.scrollX * SCROLL_FACTOR - margin;
    const right = cam.scrollX * SCROLL_FACTOR + this.viewWidth + margin;

    this.sprite.x = toRight ? left : right;
    this.vx = (toRight ? 1 : -1) * Phaser.Math.Between(120, 155);
    this.baseY = Phaser.Math.Between(CRUISE_Y - 40, CRUISE_Y + 60);
    this.phase = Math.random() * Math.PI * 2;
    this.swallowed = false;
    this.swallowAt = Phaser.Math.Between(1600, 3200);

    // la bete regarde toujours dans son sens de vol (sprite dessine vers la droite)
    this.sprite.setFlipX(!toRight);
    this.sprite.setTexture(TEX_MOUNT_PREY);
    this.sprite.play(ANIM_MOUNT_PREY, true);
    this.sprite.setAlpha(0);
    this.sprite.setVisible(true);
    this.scene.tweens.add({ targets: this.sprite, alpha: 0.92, duration: 900 });

    this.flying = true;
  }

  /** la gueule se referme : secousse de tete, gerbe de sang, gorge qui gonfle */
  private swallow() {
    this.swallowed = true;

    this.sprite.setTexture(TEX_MOUNT_FED);
    this.sprite.play(ANIM_MOUNT_FED, true);

    const dir = this.sprite.flipX ? -1 : 1;
    const mouthX = this.sprite.x + dir * MOUNT_W * 0.42;
    const mouthY = this.sprite.y + MOUNT_W * 0.06;
    this.gore.setPosition(mouthX, mouthY);
    this.gore.explode(26);

    // coup de machoire : la bete pique du nez puis se redresse
    this.scene.tweens.add({
      targets: this.sprite,
      angle: { from: 0, to: dir * 7 },
      duration: 130,
      yoyo: true,
      repeat: 1,
      ease: "Quad.easeOut",
    });
  }

  update(_time: number, delta: number) {
    if (!this.flying || this.destroyed) return;

    const dt = delta / 1000;
    this.sprite.x += this.vx * dt;
    this.phase += dt * 1.1;
    this.sprite.y = this.baseY + Math.sin(this.phase) * 16;

    if (!this.swallowed) {
      this.swallowAt -= delta;
      // le supplicie se debat : la tete de la bete tressaute tant qu'il vit
      this.sprite.y += Math.sin(this.phase * 7.3) * 1.6;
      if (this.swallowAt <= 0) this.swallow();
    }

    const cam = this.scene.cameras.main;
    const margin = MOUNT_W;
    const left = cam.scrollX * SCROLL_FACTOR - margin;
    const right = cam.scrollX * SCROLL_FACTOR + this.viewWidth + margin;

    if (this.sprite.x < left - 40 || this.sprite.x > right + 40) {
      this.flying = false;
      this.sprite.setVisible(false);
      this.sprite.setAngle(0);
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
