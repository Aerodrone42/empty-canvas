import Phaser from "phaser";

/**
 * Gestion centralisee du sang : gerbes d'impact, brume, taches persistantes
 * au sol et gibs de chair. Les textures sont generees a la volee, aucun
 * asset externe n'est necessaire.
 */

const DROP_KEY = "fx-blood-drop";
const MIST_KEY = "fx-blood-mist";
const SPARK_KEY = "fx-parry-spark";
const BLOT_KEY = "fx-blood-blot";

const MAX_STAINS = 40;
/** duree de vie d'une flaque au sol (ms) */
export const POOL_LIFE = 10000;
/** debut du fondu de sortie */
const POOL_FADE = 2000;
/** hauteur de la bande de sol rendue dans la texture des flaques */
const POOL_BAND = 90;
/** rafraichissement de la texture des flaques (ms) */
const POOL_REDRAW = 90;

function ensureTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists(DROP_KEY)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture(DROP_KEY, 8, 8);
    g.destroy();
  }
  if (!scene.textures.exists(MIST_KEY)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(16, 16, 16);
    g.generateTexture(MIST_KEY, 32, 32);
    g.destroy();
  }
  if (!scene.textures.exists(SPARK_KEY)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 6, 2);
    g.generateTexture(SPARK_KEY, 6, 2);
    g.destroy();
  }
  if (!scene.textures.exists(BLOT_KEY)) {
    // tache elliptique unique, reutilisee comme tampon pour toutes les flaques
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(32, 16, 62, 30);
    g.generateTexture(BLOT_KEY, 64, 32);
    g.destroy();
  }
}

// teintes sourdes et desaturees : sang veineux, pas rouge vif
const CRIMSON = [0x4a0c12, 0x5e1218, 0x741a1c, 0x2e070c];

/** un tampon d'une flaque : decalage local, taille, teinte */
type Blot = {
  dx: number;
  dy: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
  tint: number;
};

type Pool = {
  blots: Blot[];
  x: number;
  bornAt: number;
  /** reserve de soin restante dans la flaque */
  charge: number;
  maxCharge: number;
  width: number;
};

export class BloodFX {
  private scene: Phaser.Scene;
  private stains: Pool[] = [];
  /** ordonnee du sol utilisee pour les taches persistantes */
  private floorY: number;
  /** anti-spam de l'effet de siphon */
  private lastSiphon = 0;
  /** toutes les flaques sont dessinees dans une seule texture */
  private canvas?: Phaser.GameObjects.RenderTexture;
  private lastRedraw = 0;

  constructor(scene: Phaser.Scene, floorY: number) {
    this.scene = scene;
    this.floorY = floorY;
    ensureTextures(scene);

    const bounds = scene.physics.world.bounds;
    this.canvas = scene.add
      .renderTexture(bounds.x, floorY - POOL_BAND * 0.5, Math.max(1, bounds.width), POOL_BAND)
      .setOrigin(0, 0)
      .setDepth(1);
  }

  /** Redessine l'ensemble des flaques : un seul objet rendu, cout constant. */
  private redraw() {
    const rt = this.canvas;
    if (!rt) return;
    rt.clear();
    const now = this.scene.time.now;
    for (const pool of this.stains) {
      const age = now - pool.bornAt;
      const fade = Math.max(0, Math.min(1, (POOL_LIFE - age) / POOL_FADE));
      const left = Math.max(0.15, pool.charge / pool.maxCharge);
      for (const b of pool.blots) {
        rt.draw(
          BLOT_KEY,
          pool.x - rt.x + b.dx * left,
          this.floorY - rt.y + b.dy,
          b.alpha * fade * left,
          b.tint,
        );
      }
    }
  }




  /** Gerbe orientee : dirX = -1 vers la gauche, 1 vers la droite. */
  splatter(x: number, y: number, dirX: number, intensity = 1) {
    const count = Math.round(Phaser.Math.Clamp(10 * intensity, 4, 44));

    const emitter = this.scene.add.particles(x, y, DROP_KEY, {
      lifespan: { min: 320, max: 760 },
      speed: { min: 90 * intensity, max: 340 * intensity },
      angle: dirX >= 0 ? { min: -70, max: 25 } : { min: 155, max: 250 },
      gravityY: 900,
      scale: { start: Phaser.Math.FloatBetween(0.4, 1.1) * intensity, end: 0.15 },
      tint: CRIMSON,
      quantity: count,
      blendMode: Phaser.BlendModes.NORMAL,
      emitting: false,
    });
    emitter.setDepth(6);
    emitter.explode(count);
    this.scene.time.delayedCall(900, () => emitter.destroy());

    // brume au point d'impact
    const mist = this.scene.add.image(x, y, MIST_KEY);
    mist.setTint(0x5e1218);
    mist.setAlpha(0.3);
    mist.setScale(0.6 * intensity);
    mist.setDepth(6);
    this.scene.tweens.add({
      targets: mist,
      alpha: 0,
      scale: 1.5 * intensity,
      duration: 240,
      onComplete: () => mist.destroy(),
    });

    // quelques taches au sol
    const stains = Math.max(1, Math.round(intensity * 2));
    for (let i = 0; i < stains; i++) {
      this.scene.time.delayedCall(120 + i * 60, () =>
        this.stain(x + Phaser.Math.Between(-60, 60) + dirX * 40, intensity),
      );
    }
  }

  /** Flaque au sol : amas organique qui persiste 10 s puis s'estompe. */
  stain(x: number, intensity = 1) {
    if (!this.scene.scene.isActive()) return;
    const clamped = Phaser.Math.Clamp(intensity, 0.6, 2);
    const w = Phaser.Math.Between(20, 46) * clamped;
    const blots: Blot[] = [];

    // masse centrale, plus sombre et plus opaque
    blots.push({
      dx: 0,
      dy: Phaser.Math.Between(-1, 3),
      scaleX: w / 62,
      scaleY: (w * 0.3) / 30,
      alpha: 0.7,
      tint: CRIMSON[3],
    });

    // eclaboussures satellites : silhouette irreguliere
    const blobs = Phaser.Math.Between(3, 5);
    for (let i = 0; i < blobs; i++) {
      const bw = w * Phaser.Math.FloatBetween(0.28, 0.7);
      blots.push({
        dx: Phaser.Math.Between(-Math.round(w * 0.55), Math.round(w * 0.55)),
        dy: Phaser.Math.Between(-3, 5),
        scaleX: bw / 62,
        scaleY: (bw * Phaser.Math.FloatBetween(0.22, 0.34)) / 30,
        alpha: Phaser.Math.FloatBetween(0.35, 0.55),
        tint: Phaser.Utils.Array.GetRandom(CRIMSON),
      });
    }

    const charge = 6 * Phaser.Math.Clamp(intensity, 0.5, 2);
    this.stains.push({
      blots,
      x,
      bornAt: this.scene.time.now,
      charge,
      maxCharge: charge,
      width: w,
    });
    while (this.stains.length > MAX_STAINS) this.stains.shift();
    this.lastRedraw = 0;
  }

  /** Purge temporelle : a appeler chaque frame depuis la scene. */
  tick(time: number) {
    const before = this.stains.length;
    this.stains = this.stains.filter(
      (pool) => time - pool.bornAt < POOL_LIFE && pool.charge > 0,
    );
    if (this.stains.length !== before) this.lastRedraw = 0;

    if (time - this.lastRedraw >= POOL_REDRAW) {
      this.lastRedraw = time;
      this.redraw();
    }
  }

  /** Flaque active la plus proche sous une abscisse donnee, s'il y en a une. */
  poolAt(x: number): Pool | undefined {
    let best: Pool | undefined;
    let bestDist = Infinity;
    for (const pool of this.stains) {
      const dist = Math.abs(pool.x - x);
      if (dist < pool.width * 0.7 && dist < bestDist) {
        best = pool;
        bestDist = dist;
      }
    }
    return best;
  }

  /**
   * Le heros boit la flaque : retire de la reserve, retrecit l'amas et
   * renvoie ce qui a reellement ete consomme.
   */
  drainPool(pool: Pool, amount: number) {
    const taken = Math.min(pool.charge, amount);
    pool.charge -= taken;
    return taken;
  }


  /**
   * Siphon : le sang quitte le sol et remonte le long du corps du heros.
   * Appelable a chaque frame, l'effet est throttle en interne.
   */
  siphon(x: number, footY: number, bodyHeight = 120) {
    const now = this.scene.time.now;
    if (now - this.lastSiphon < 120) return;
    this.lastSiphon = now;

    // filets de sang qui grimpent depuis les pieds
    const emitter = this.scene.add.particles(x, footY, DROP_KEY, {
      lifespan: { min: 340, max: 620 },
      speedY: { min: -bodyHeight * 2.2, max: -bodyHeight * 1.2 },
      speedX: { min: -18, max: 18 },
      gravityY: -140,
      scale: { start: 0.75, end: 0.1 },
      alpha: { start: 0.7, end: 0 },
      tint: CRIMSON,
      quantity: 5,
      emitting: false,
    });
    emitter.setDepth(5);
    emitter.explode(5);
    this.scene.time.delayedCall(700, () => emitter.destroy());

    // filaments verticaux qui s'enroulent autour du corps
    const veins = Phaser.Math.Between(2, 3);
    for (let i = 0; i < veins; i++) {
      const offset = Phaser.Math.Between(-16, 16);
      const vein = this.scene.add.rectangle(
        x + offset,
        footY - 6,
        Phaser.Math.FloatBetween(1.5, 3),
        Phaser.Math.Between(10, 22),
        Phaser.Utils.Array.GetRandom(CRIMSON),
        0.85,
      );
      vein.setDepth(5);
      this.scene.tweens.add({
        targets: vein,
        y: footY - bodyHeight * Phaser.Math.FloatBetween(0.7, 1),
        x: x + offset * -0.6,
        alpha: 0,
        scaleY: 1.8,
        duration: Phaser.Math.Between(320, 520),
        ease: "Sine.easeOut",
        onComplete: () => vein.destroy(),
      });
    }

    // lueur diffuse derriere le heros, jamais de contour net devant lui
    const glow = this.scene.add.image(x, footY - bodyHeight * 0.5, MIST_KEY);
    glow.setTint(0x3d0a10);
    glow.setAlpha(0.12);
    glow.setScale(1.6, 2.6);
    glow.setDepth(3);
    this.scene.tweens.add({
      targets: glow,
      alpha: 0,
      scaleX: 2.1,
      scaleY: 3.1,
      duration: 420,
      onComplete: () => glow.destroy(),
    });
  }


  /** Explosion de mort : beaucoup de sang + morceaux de chair qui rebondissent. */
  gore(x: number, y: number, intensity = 1) {
    this.splatter(x, y, 1, 2.2 * intensity);
    this.splatter(x, y, -1, 2.2 * intensity);

    const gibs = Math.round(Phaser.Math.Clamp(4 * intensity, 3, 9));
    for (let i = 0; i < gibs; i++) {
      const gib = this.scene.add.ellipse(
        x,
        y,
        Phaser.Math.Between(6, 14),
        Phaser.Math.Between(5, 11),
        Phaser.Utils.Array.GetRandom(CRIMSON),
        1,
      );
      gib.setDepth(6);
      const targetX = x + Phaser.Math.Between(-140, 140);
      this.scene.tweens.add({
        targets: gib,
        x: targetX,
        y: this.floorY - 2,
        angle: Phaser.Math.Between(-360, 360),
        ease: "Quad.easeIn",
        duration: Phaser.Math.Between(420, 700),
        onComplete: () => {
          this.stain(targetX, 0.8);
          this.scene.tweens.add({
            targets: gib,
            alpha: 0,
            duration: 1200,
            delay: 600,
            onComplete: () => gib.destroy(),
          });
        },
      });
    }

    // flaque finale
    this.scene.time.delayedCall(320, () => {
      this.stain(x, 2 * intensity);
      this.stain(x + Phaser.Math.Between(-30, 30), 1.4 * intensity);
    });
  }

  /** Etincelles dorees d'une parade reussie. */
  sparks(x: number, y: number) {
    const emitter = this.scene.add.particles(x, y, SPARK_KEY, {
      lifespan: { min: 180, max: 380 },
      speed: { min: 120, max: 320 },
      angle: { min: 0, max: 360 },
      gravityY: 320,
      scale: { start: 1.2, end: 0.2 },
      tint: [0xf2d9a0, 0xffe9b0, 0xffffff],
      quantity: 14,
      emitting: false,
    });
    emitter.setDepth(7);
    emitter.explode(14);
    this.scene.time.delayedCall(600, () => emitter.destroy());
  }
}
