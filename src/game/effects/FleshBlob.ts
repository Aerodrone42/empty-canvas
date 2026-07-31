import Phaser from "phaser";

/**
 * Amas de chair pose a la jonction du sol et du mur du corridor.
 *
 * Au repos il reste fige sur sa premiere pose, sombre, fondu dans la pierre.
 * A intervalle aleatoire il se reveille : la masse gonfle, les tentacules
 * jaillissent puis se retractent (animation aller-retour), accompagnee d'un
 * leger tremblement et d'un eclat de teinte.
 */

const ANIM_KEY = "flesh-blob-pulse";
const TEX_KEY = "flesh-blob";

/** hauteur affichee de reference (avant variation d'echelle) */
const BLOB_H = 118;

const TINT_REST = 0x8f3c3e;
const TINT_WAKE = 0xd05a5e;

export class FleshBlob {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.GameObjects.Sprite;
  /** ombre de contact diffuse : ancre la masse au sol */
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly baseY: number;
  private nextWakeAt: number;
  private busy = false;
  private destroyed = false;

  constructor(scene: Phaser.Scene, x: number, y: number, scaleFactor = 1) {
    this.scene = scene;
    FleshBlob.ensureAnim(scene);

    const tex = scene.textures.get(TEX_KEY).getSourceImage();
    const frameH = tex.height || 1;
    const scale = ((BLOB_H * scaleFactor) / frameH) * 1;

    this.baseY = y;

    const shadowW = 200 * scaleFactor;
    this.shadow = scene.add
      .ellipse(x, y + 2, shadowW, shadowW * 0.22, 0x1a0508, 0.5)
      .setDepth(-3);
    this.shadow.setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.sprite = scene.add
      .sprite(x, y, TEX_KEY, 0)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setTint(TINT_REST)
      .setAlpha(1)
      .setDepth(-2);

    if (Math.random() < 0.5) this.sprite.setFlipX(true);

    this.nextWakeAt = scene.time.now + Phaser.Math.Between(1200, 8000);
  }


  private static ensureAnim(scene: Phaser.Scene) {
    if (scene.anims.exists(ANIM_KEY)) return;
    scene.anims.create({
      key: ANIM_KEY,
      frames: scene.anims.generateFrameNumbers(TEX_KEY, { start: 0, end: 7 }),
      frameRate: 9,
      repeat: 0,
      yoyo: true,
    });
  }

  /** Reveil : un ou deux cycles de gonflement, puis retour au repos. */
  private wake() {
    if (this.destroyed || this.busy) return;
    this.busy = true;

    const cycles = Math.random() < 0.35 ? 2 : 1;
    let done = 0;

    this.scene.tweens.add({
      targets: this.sprite,
      duration: 420,
      yoyo: true,
      ease: "Sine.easeInOut",
      onUpdate: (tw) => {
        const t = tw.progress;
        this.sprite.setTint(
          Phaser.Display.Color.ObjectToColor(
            Phaser.Display.Color.Interpolate.ColorWithColor(
              Phaser.Display.Color.IntegerToColor(TINT_REST),
              Phaser.Display.Color.IntegerToColor(TINT_WAKE),
              100,
              Math.round(t * 100),
            ),
          ).color,
        );
      },
    });

    const playOnce = () => {
      if (this.destroyed) return;
      this.sprite.play(ANIM_KEY);
    };

    const onComplete = () => {
      done += 1;
      if (this.destroyed) return;
      if (done < cycles) {
        playOnce();
        return;
      }
      this.sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE, onComplete);
      this.sprite.setFrame(0);
      this.sprite.setTint(TINT_REST);
      this.busy = false;
      this.nextWakeAt = this.scene.time.now + Phaser.Math.Between(4000, 12000);
    };

    this.sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, onComplete);
    playOnce();

    // frisson : la masse se tasse legerement sur elle-meme
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.baseY + 2,
      duration: 140,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeInOut",
      onComplete: () => this.sprite.setY(this.baseY),
    });
  }

  tick(time: number) {
    if (this.destroyed || this.busy) return;
    if (time >= this.nextWakeAt) this.wake();
  }

  destroy() {
    this.destroyed = true;
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.destroy();
  }
}

/**
 * Repartit des amas le long de la jonction sol/mur, en evitant le spawn du
 * heros et la sortie de salle.
 */
export function scatterFleshBlobs(
  scene: Phaser.Scene,
  floorY: number,
  roomWidth: number,
  opts: { count?: number; minX?: number; maxX?: number; lift?: number } = {},
): FleshBlob[] {
  const count = opts.count ?? Phaser.Math.Between(4, 6);
  const minX = opts.minX ?? 380;
  const maxX = opts.maxX ?? roomWidth - 320;
  const lift = opts.lift ?? 70;

  const span = maxX - minX;
  const slot = span / count;
  const blobs: FleshBlob[] = [];

  for (let i = 0; i < count; i++) {
    const x = minX + slot * i + Phaser.Math.Between(40, Math.max(60, Math.round(slot - 60)));
    blobs.push(new FleshBlob(scene, x, floorY - lift, Phaser.Math.FloatBetween(0.6, 1)));
  }
  return blobs;
}
