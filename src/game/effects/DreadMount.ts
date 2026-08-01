import Phaser from "phaser";

/**
 * Monture funebre : dragon squelettique aile monte par un cavalier encapuchonne,
 * qui traverse le ciel de la cathedrale en tenant un humain vivant dans sa
 * gueule, puis l'avale a mi-parcours.
 *
 * La bete est assemblee en pieces separees (corps, aile arriere, aile avant,
 * queue, victime) animees par pivot : aucune planche de frames, donc aucune
 * aile ne peut disparaitre, se couper ou clignoter d'une image a l'autre.
 *
 * Purement decoratif : aucun corps physique, aucune collision.
 */

export const TEX_MOUNT_BODY = "dread-mount-body";
export const TEX_MOUNT_WING = "dread-mount-wing";
export const TEX_MOUNT_TAIL = "dread-mount-tail";
export const TEX_MOUNT_VICTIM = "dread-mount-victim";

/** largeur affichee du corps (sans les ailes) */
const BODY_W = 300;
/** hauteur de croisiere dans le ciel */
const CRUISE_Y = 360;
/** parallaxe : la bete est loin derriere l'architecture de premier plan */
const SCROLL_FACTOR = 0.55;
/** cadence du battement d'ailes (radians/seconde) */
const FLAP_SPEED = 3.4;

export class DreadMount {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly body: Phaser.GameObjects.Image;
  private readonly wingBack: Phaser.GameObjects.Image;
  private readonly wingFront: Phaser.GameObjects.Image;
  private readonly tail: Phaser.GameObjects.Image;
  private readonly victim: Phaser.GameObjects.Image;
  private readonly gore: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly viewWidth: number;
  private readonly bodyH: number;
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

    const bodyTex = scene.textures.get(TEX_MOUNT_BODY).getSourceImage();
    const scale = BODY_W / bodyTex.width;
    this.bodyH = bodyTex.height * scale;

    const wingTex = scene.textures.get(TEX_MOUNT_WING).getSourceImage();
    const wingScale = (BODY_W * 0.92) / wingTex.width;
    const tailTex = scene.textures.get(TEX_MOUNT_TAIL).getSourceImage();
    const tailScale = (BODY_W * 0.62) / tailTex.width;
    const victimTex = scene.textures.get(TEX_MOUNT_VICTIM).getSourceImage();
    const victimScale = (this.bodyH * 0.2) / victimTex.height;

    // Repere local : (0,0) au centre du corps. Le sprite regarde vers la droite.
    const halfW = BODY_W / 2;
    const halfH = this.bodyH / 2;

    // Aile arriere : plus petite et assombrie pour donner la profondeur.
    this.wingBack = scene.add
      .image(-halfW * 0.02, -halfH * 0.42, TEX_MOUNT_WING)
      .setOrigin(0.96, 0.42)
      .setScale(wingScale * 0.86)
      .setTint(0x8a8378);

    this.tail = scene.add
      .image(-halfW * 0.72, -halfH * 0.02, TEX_MOUNT_TAIL)
      .setOrigin(0.95, 0.35)
      .setScale(tailScale)
      .setTint(0xc9c3b8);

    this.body = scene.add
      .image(0, 0, TEX_MOUNT_BODY)
      .setOrigin(0.5, 0.5)
      .setScale(scale);

    // La proie pend hors de la gueule, cote droit du crane.
    this.victim = scene.add
      .image(halfW * 0.86, -halfH * 0.24, TEX_MOUNT_VICTIM)
      .setOrigin(0.5, 0.35)
      .setScale(victimScale)
      .setAngle(24);

    // Aile avant : pleine lumiere, devant le cavalier.
    this.wingFront = scene.add
      .image(halfW * 0.06, -halfH * 0.3, TEX_MOUNT_WING)
      .setOrigin(0.96, 0.42)
      .setScale(wingScale);

    this.root = scene.add
      .container(-9999, CRUISE_Y, [
        this.wingBack,
        this.tail,
        this.body,
        this.victim,
        this.wingFront,
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
    const margin = BODY_W * 1.4;

    const left = cam.scrollX * SCROLL_FACTOR - margin;
    const right = cam.scrollX * SCROLL_FACTOR + this.viewWidth + margin;

    this.root.x = toRight ? left : right;
    this.vx = (toRight ? 1 : -1) * Phaser.Math.Between(110, 145);
    this.baseY = Phaser.Math.Between(CRUISE_Y - 40, CRUISE_Y + 50);
    this.flap = 0;
    this.swallowed = false;
    this.swallowAt = Phaser.Math.Between(1800, 3400);

    // les pieces sont dessinees vers la droite : on retourne tout le groupe
    this.root.setScale(toRight ? 1 : -1, 1);

    this.victim.setVisible(true).setAlpha(1);
    this.root.setAlpha(0);
    this.root.setVisible(true);
    this.scene.tweens.add({ targets: this.root, alpha: 1, duration: 900 });

    this.flying = true;
  }

  /** la gueule se referme : gerbe de sang, la proie disparait */
  private swallow() {
    this.swallowed = true;

    const dir = this.root.scaleX >= 0 ? 1 : -1;
    const mouthX = this.root.x + dir * BODY_W * 0.43;
    const mouthY = this.root.y - this.bodyH * 0.12;
    this.gore.setPosition(mouthX, mouthY);
    this.gore.explode(30);

    this.scene.tweens.add({
      targets: this.victim,
      alpha: 0,
      scaleX: this.victim.scaleX * 0.4,
      duration: 180,
      onComplete: () => this.victim.setVisible(false),
    });

    // coup de machoire : la bete pique du nez puis se redresse
    this.scene.tweens.add({
      targets: this.root,
      angle: { from: 0, to: dir * 6 },
      duration: 130,
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
    // Battement : l'aile avant mene, l'aile arriere suit avec un leger retard
    // pour la profondeur. Les deux battent en permanence, jamais figees.
    this.wingFront.setAngle(beat * 30 - 6);
    this.wingBack.setAngle(Math.sin(this.flap - 0.45) * 26 - 4);
    // La queue ondule a contretemps du battement.
    this.tail.setAngle(Math.sin(this.flap - 1.1) * 9);
    // Le corps monte a la poussee des ailes, redescend a la remontee.
    this.root.y = this.baseY - beat * 9;

    if (!this.swallowed) {
      this.swallowAt -= delta;
      // le supplicie se debat dans la gueule
      this.victim.setAngle(24 + Math.sin(this.flap * 5.7) * 12);
      if (this.swallowAt <= 0) this.swallow();
    }

    const cam = this.scene.cameras.main;
    const margin = BODY_W * 1.6;
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
