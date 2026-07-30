import Phaser from "phaser";

/**
 * Profileur de scene : mesure le cout de chaque systeme appele dans update()
 * et affiche un panneau de diagnostic par dessus le jeu.
 *
 * Activation / desactivation : touche F3 (ou `?profile` dans l'URL).
 */

type Section = {
  /** cumul des mesures depuis le dernier rafraichissement */
  total: number;
  /** pic observe sur la fenetre courante */
  peak: number;
  samples: number;
  /** moyenne affichee (ms) */
  avg: number;
  /** pic affiche (ms) */
  worst: number;
};

/** rafraichissement du panneau (ms) */
const REFRESH = 400;

export class Profiler {
  private scene: Phaser.Scene;
  private sections = new Map<string, Section>();
  /** ordre d'apparition, pour un affichage stable */
  private order: string[] = [];
  private label?: Phaser.GameObjects.Text;
  private enabled = false;
  private lastRefresh = 0;

  /** temps total d'une frame de update() */
  private frameTotal = 0;
  private frameSamples = 0;
  private frameWorst = 0;
  /** deltas bruts du moteur : detecte les frames sautees */
  private deltaTotal = 0;
  private deltaWorst = 0;
  private longFrames = 0;

  /** mesures en cours (nom -> horodatage de debut) */
  private open = new Map<string, number>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.label = scene.add
      .text(10, 10, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#d8f5c8",
        backgroundColor: "#000000cc",
        padding: { x: 8, y: 6 },
        lineSpacing: 2,
      })
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);

    const url = typeof window !== "undefined" ? window.location.search : "";
    if (url.includes("profile")) this.setEnabled(true);

    scene.input.keyboard?.on("keydown-F3", () => this.setEnabled(!this.enabled));

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.label?.destroy();
      this.label = undefined;
    });
  }

  get isEnabled() {
    return this.enabled;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    this.label?.setVisible(on);
    if (!on) return;
    this.sections.clear();
    this.order = [];
    this.frameTotal = 0;
    this.frameSamples = 0;
    this.frameWorst = 0;
    this.deltaTotal = 0;
    this.deltaWorst = 0;
    this.longFrames = 0;
  }

  private section(name: string) {
    let s = this.sections.get(name);
    if (!s) {
      s = { total: 0, peak: 0, samples: 0, avg: 0, worst: 0 };
      this.sections.set(name, s);
      this.order.push(name);
    }
    return s;
  }

  /** Debut d'une mesure nommee. Sans effet si le profilage est coupe. */
  begin(name: string) {
    if (!this.enabled) return;
    this.open.set(name, performance.now());
  }

  /** Fin de la mesure nommee, ouverte par `begin`. */
  end(name: string) {
    if (!this.enabled) return;
    const started = this.open.get(name);
    if (started === undefined) return;
    this.open.delete(name);
    const ms = performance.now() - started;
    const s = this.section(name);
    s.total += ms;
    s.samples += 1;
    if (ms > s.peak) s.peak = ms;
  }

  /** Enveloppe pratique : mesure l'execution d'une fonction. */
  measure<T>(name: string, fn: () => T): T {
    if (!this.enabled) return fn();
    this.begin(name);
    try {
      return fn();
    } finally {
      this.end(name);
    }
  }

  /**
   * A appeler en toute fin de `update()` : consolide la frame et rafraichit
   * le panneau. `frameMs` est le cout total mesure de update().
   */
  frame(time: number, delta: number, frameMs: number) {
    if (!this.enabled) return;

    this.frameTotal += frameMs;
    this.frameSamples += 1;
    if (frameMs > this.frameWorst) this.frameWorst = frameMs;

    this.deltaTotal += delta;
    if (delta > this.deltaWorst) this.deltaWorst = delta;
    // au dela de 20 ms, l'affichage descend sous 50 im/s : c'est une saccade
    if (delta > 20) this.longFrames += 1;

    if (time - this.lastRefresh < REFRESH) return;
    this.lastRefresh = time;
    this.render();

    for (const name of this.order) {
      const s = this.sections.get(name)!;
      s.avg = s.samples ? s.total / s.samples : 0;
      s.worst = s.peak;
      s.total = 0;
      s.peak = 0;
      s.samples = 0;
    }
  }

  /** Nombre d'objets et de corps physiques : detecte les fuites. */
  private counts() {
    const displayList = this.scene.children.list.length;
    const world = this.scene.physics.world;
    const bodies = world.bodies.size + world.staticBodies.size;
    const tweens = this.scene.tweens.getTweens().length;
    return { displayList, bodies, tweens };
  }

  private render() {
    if (!this.label) return;

    const avgFrame = this.frameSamples ? this.frameTotal / this.frameSamples : 0;
    const avgDelta = this.frameSamples ? this.deltaTotal / this.frameSamples : 0;
    const fps = avgDelta > 0 ? 1000 / avgDelta : 0;
    const { displayList, bodies, tweens } = this.counts();

    // le systeme le plus couteux en tete, pour lire le coupable d'un coup d'oeil
    const rows = this.order
      .map((name) => {
        const s = this.sections.get(name)!;
        return {
          name,
          avg: s.samples ? s.total / s.samples : s.avg,
          worst: Math.max(s.peak, s.worst),
        };
      })
      .sort((a, b) => b.avg - a.avg);

    const lines = [
      "PROFILAGE  (F3)",
      `im/s ${fps.toFixed(0).padStart(3)}   frame ${avgDelta.toFixed(1)} ms   pic ${this.deltaWorst.toFixed(1)} ms`,
      `update ${avgFrame.toFixed(2)} ms (pic ${this.frameWorst.toFixed(2)})   saccades ${this.longFrames}`,
      `objets ${displayList}  corps ${bodies}  tweens ${tweens}`,
      "-- systemes (moy / pic ms) --",
      ...rows.map(
        (r) => `${r.name.padEnd(12)} ${r.avg.toFixed(2).padStart(6)} / ${r.worst.toFixed(2)}`,
      ),
    ];

    this.label.setText(lines);

    this.frameTotal = 0;
    this.frameSamples = 0;
    this.frameWorst = 0;
    this.deltaTotal = 0;
    this.deltaWorst = 0;
    this.longFrames = 0;
  }
}
