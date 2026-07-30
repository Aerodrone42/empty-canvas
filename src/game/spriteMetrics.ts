import Phaser from "phaser";

/**
 * Les feuilles de sprites du jeu ne dessinent pas la silhouette a la meme
 * taille ni a la meme hauteur d'une frame a l'autre. Plutot que de coder des
 * valeurs en dur (qui deviennent fausses des qu'un sprite est remplace), on
 * mesure la boite englobante opaque de chaque frame au chargement.
 */
export type FrameMetrics = {
  /** y du haut de la silhouette, en pixels de texture */
  top: number;
  /** y des pieds (dernier pixel opaque + 1), en pixels de texture */
  footY: number;
  /** hauteur de la silhouette */
  charH: number;
  /** x gauche de la silhouette */
  left: number;
  /** x droit de la silhouette */
  right: number;
  /** largeur de la silhouette */
  charW: number;
};

const CACHE = new Map<string, FrameMetrics[]>();

/** Mesure toutes les frames d'une texture (resultat mis en cache). */
export function measureTexture(
  scene: Phaser.Scene,
  key: string,
): FrameMetrics[] {
  const cached = CACHE.get(key);
  if (cached) return cached;

  const texture = scene.textures.get(key);
  const frameNames = texture.getFrameNames();
  const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;

  // On dessine la feuille une seule fois dans un canvas pour lire les alphas
  // en bloc : getPixelAlpha frame par frame serait bien trop lent.
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const result: FrameMetrics[] = [];

  if (!ctx) {
    CACHE.set(key, result);
    return result;
  }

  ctx.drawImage(source as CanvasImageSource, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  for (const name of frameNames) {
    const frame = texture.get(name);
    const fx = frame.cutX;
    const fy = frame.cutY;
    const fw = frame.cutWidth;
    const fh = frame.cutHeight;

    let top = -1;
    let bottom = -1;
    let left = fw;
    let right = -1;

    for (let y = 0; y < fh; y += 1) {
      for (let x = 0; x < fw; x += 1) {
        const alpha = data[((fy + y) * canvas.width + (fx + x)) * 4 + 3];
        if (alpha > 10) {
          if (top < 0) top = y;
          bottom = y;
          if (x < left) left = x;
          if (x > right) right = x;
        }
      }
    }

    if (top < 0) {
      result.push({ top: 0, footY: fh, charH: fh, left: 0, right: fw, charW: fw });
    } else {
      result.push({
        top,
        footY: bottom + 1,
        charH: bottom + 1 - top,
        left,
        right: right + 1,
        charW: right + 1 - left,
      });
    }
  }

  CACHE.set(key, result);
  return result;
}

/** Metriques d'une frame precise, avec repli sur la premiere frame. */
export function frameMetrics(
  scene: Phaser.Scene,
  key: string,
  index: number,
): FrameMetrics | null {
  const all = measureTexture(scene, key);
  if (all.length === 0) return null;
  const i = Math.min(Math.max(index, 0), all.length - 1);
  return all[i];
}

/** Hauteur mediane de silhouette d'une texture : sert d'echelle de reference. */
export function referenceHeight(scene: Phaser.Scene, key: string): number {
  const all = measureTexture(scene, key);
  if (all.length === 0) return 1;
  const heights = all.map((m) => m.charH).sort((a, b) => a - b);
  return heights[Math.floor(heights.length / 2)] || 1;
}
