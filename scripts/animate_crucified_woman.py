"""Rebuild the crucified woman spritesheet.

Regle absolue : la croix, les cordes et les bras ne bougent JAMAIS.
Seules la tete (avec la chevelure) et le buste sont animes, via des masques
doux calques sur l'anatomie, puis les trous laisses derriere sont reboucles
par un remplissage au plus proche voisin (aucune coupure, aucune frange).
"""

from math import cos, pi, sin
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import distance_transform_edt

FRAME_W = 284
FRAME_H = 697
FRAME_COUNT = 12

ASSET = Path("public/assets/sprites/props/crucifiee_femme_spritesheet.png")
BASE = Path("scripts/crucifiee_femme_base.png")

# --- anatomie mesuree sur la frame source -------------------------------
# tete + chevelure : strictement entre les bras, jamais sur les cordes
HEAD_POLY = [
    (120, 136),
    (150, 130),
    (180, 138),
    (185, 190),
    (182, 250),
    (172, 276),
    (150, 282),
    (128, 276),
    (117, 250),
    (114, 190),
]
NECK = (149, 216)

# buste + haut de la robe : colonne centrale uniquement
TORSO_POLY = [(112, 244), (188, 244), (200, 424), (100, 424)]
TORSO_ANCHOR_Y = 424


def soft_mask(points, feather):
    mask = Image.new("L", (FRAME_W, FRAME_H), 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(feather))


def extract(source, mask):
    """Couche isolee : couleurs d'origine, alpha pondere par le masque."""
    layer = source.copy()
    alpha = np.array(source.getchannel("A"), dtype=np.float32)
    weight = np.array(mask, dtype=np.float32) / 255.0
    layer.putalpha(Image.fromarray((alpha * weight).astype(np.uint8)))
    return layer


def plate(source, mask):
    """Fond sans la zone animee, trou rebouche par le plus proche voisin."""
    rgba = np.array(source, dtype=np.uint8)
    weight = np.array(mask, dtype=np.float32) / 255.0
    hole = weight > 0.12

    known = ~hole
    if known.any() and hole.any():
        _, idx = distance_transform_edt(~known, return_indices=True)
        for c in range(4):
            channel = rgba[..., c]
            channel[hole] = channel[idx[0][hole], idx[1][hole]]
            rgba[..., c] = channel

    # jamais de matiere inventee hors de la silhouette d'origine
    alpha = np.array(source.getchannel("A"), dtype=np.float32)
    rgba[..., 3] = np.minimum(alpha, rgba[..., 3].astype(np.float32)).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def suffering(t):
    """Courbe de souffrance : la nuque cede lentement puis se tend d'un coup."""
    fall = 1.0 - cos(2.0 * pi * t)  # 0 -> 2 -> 0, lent
    spasm = max(0.0, sin(6.0 * pi * t)) ** 3  # secousses breves
    return fall, spasm


def animate(source, index):
    t = index / FRAME_COUNT
    fall, spasm = suffering(t)

    head_mask = soft_mask(HEAD_POLY, 3)
    torso_mask = soft_mask(TORSO_POLY, 6)

    # --- respiration : etirement vertical ancre sur le bassin ------------
    breath = 1.0 + 0.014 * ((sin(2.0 * pi * t + 0.9) + 1.0) / 2.0) + 0.006 * spasm
    torso = extract(source, torso_mask)
    stretched = torso.resize((FRAME_W, round(FRAME_H * breath)), Image.Resampling.BICUBIC)
    result = source.copy()
    result.alpha_composite(stretched, (0, TORSO_ANCHOR_Y - round(TORSO_ANCHOR_Y * breath)))

    # --- tete : la nuque tombe puis se redresse par saccade --------------
    result = plate(result, head_mask)
    head = extract(source, head_mask)
    angle = -6.5 * (fall / 2.0) + 3.0 * spasm
    head = head.rotate(angle, resample=Image.Resampling.BICUBIC, center=NECK)
    dy = round(4.0 * (fall / 2.0) - 2.0 * spasm)
    dx = round(1.5 * sin(2.0 * pi * t + pi / 3.0) + spasm)
    result.alpha_composite(head, (dx, dy))


    # --- tete : la nuque tombe puis se redresse par saccade --------------
    head = extract(source, head_mask)
    angle = -6.5 * (fall / 2.0) + 3.0 * spasm
    head = head.rotate(angle, resample=Image.Resampling.BICUBIC, center=NECK)
    dy = round(4.0 * (fall / 2.0) - 2.0 * spasm)
    dx = round(1.5 * sin(2.0 * pi * t + pi / 3.0) + spasm)
    result.alpha_composite(head, (dx, dy))

    return result


def check_arms(sheet):
    """Les bras et la croix doivent etre strictement identiques partout."""
    frames = [np.array(sheet.crop((i * FRAME_W, 0, (i + 1) * FRAME_W, FRAME_H))) for i in range(FRAME_COUNT)]
    zone = np.ones((FRAME_H, FRAME_W), dtype=bool)
    zone[120:440, 95:205] = False  # zone animee exclue du controle
    worst = max(int(np.abs(f.astype(int) - frames[0].astype(int)).max(2)[zone].max()) for f in frames)
    print("ecart max hors zone animee :", worst)
    return worst


def main():
    if not BASE.exists():
        Image.open(ASSET).convert("RGBA").crop((0, 0, FRAME_W, FRAME_H)).save(BASE)
    source = Image.open(BASE).convert("RGBA")

    sheet = Image.new("RGBA", (FRAME_W * FRAME_COUNT, FRAME_H))
    for index in range(FRAME_COUNT):
        sheet.alpha_composite(animate(source, index), (index * FRAME_W, 0))

    # defrange : aucun pixel clair semi-transparent en bordure
    data = np.array(sheet).astype(np.float32)
    edge = (data[..., 3] > 0) & (data[..., 3] < 200)
    for c in range(3):
        data[..., c][edge] *= 0.72
    sheet = Image.fromarray(data.astype(np.uint8), "RGBA")

    sheet.save(ASSET, optimize=True)
    check_arms(sheet)
    print("frames :", FRAME_COUNT, "taille :", sheet.size)


if __name__ == "__main__":
    main()
