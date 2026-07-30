/** Bascule plein écran navigateur (fonctionne aussi depuis l'iframe de prévisualisation
 *  tant que celle-ci autorise `allowfullscreen`). */
export function isFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.fullscreenElement);
}

export async function toggleFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") return false;

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return false;
    }
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    return true;
  } catch {
    // refus du navigateur (geste utilisateur manquant ou iframe verrouillée)
    return isFullscreen();
  }
}
