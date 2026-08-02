"""Supprime le halo blanc autour du Vigile Muet.

Les frames ont des pixels de bordure semi-transparents dont la couleur est
restee claire (matte blanc). On recolore ces pixels avec la couleur opaque la
plus proche, puis on durcit l'alpha (pixel art : opaque ou rien).
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt

ALPHA_KEEP = 128

for path in sorted(Path("public/assets/sprites").glob("vigile_muet_*.png")):
    img = Image.open(path).convert("RGBA")
    data = np.array(img)
    alpha = data[..., 3]
    solid = alpha >= 250
    if not solid.any():
        continue
    _, idx = distance_transform_edt(~solid, return_indices=True)
    fringe = (alpha > 0) & ~solid
    for c in range(3):
        ch = data[..., c]
        ch[fringe] = ch[idx[0][fringe], idx[1][fringe]]
        data[..., c] = ch
    data[..., 3] = np.where(alpha >= ALPHA_KEEP, 255, 0).astype(np.uint8)
    # couleur nulle sur les pixels totalement transparents (pas de halo au filtrage)
    clear = data[..., 3] == 0
    for c in range(3):
        ch = data[..., c]
        ch[clear] = 0
        data[..., c] = ch
    Image.fromarray(data, "RGBA").save(path, optimize=True)
    print("defrange :", path.name, int(fringe.sum()), "pixels")
