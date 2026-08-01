"""Rebuild the crucified woman sheet while keeping the wooden cross fixed."""

from math import pi, sin
from pathlib import Path

from PIL import Image, ImageDraw


FRAME_W = 284
FRAME_H = 697
FRAME_COUNT = 8
ASSET = Path("public/assets/sprites/props/crucifiee_femme_spritesheet.png")


def polygon_mask(points: list[tuple[int, int]], blur: int = 0) -> Image.Image:
    mask = Image.new("L", (FRAME_W, FRAME_H), 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    if blur:
        from PIL import ImageFilter

        mask = mask.filter(ImageFilter.GaussianBlur(blur))
    return mask


def masked_layer(source: Image.Image, mask: Image.Image) -> Image.Image:
    layer = source.copy()
    layer.putalpha(Image.composite(source.getchannel("A"), Image.new("L", source.size), mask))
    return layer


def clear_mask(image: Image.Image, mask: Image.Image) -> None:
    alpha = image.getchannel("A")
    alpha.paste(0, mask=mask)
    image.putalpha(alpha)


def animate_frame(source: Image.Image, phase: float) -> Image.Image:
    result = source.copy()

    # Respiration visible dans la cage thoracique et les plis de la robe.
    torso_mask = polygon_mask([(99, 210), (184, 210), (204, 386), (79, 386)], 2)
    torso = masked_layer(source, torso_mask)
    clear_mask(result, torso_mask)
    breath = 1.0 + 0.026 * ((sin(phase) + 1.0) / 2.0)
    torso = torso.resize((round(FRAME_W * breath), FRAME_H), Image.Resampling.BICUBIC)
    result.alpha_composite(torso, (round((FRAME_W - torso.width) / 2), 0))

    # Tête, visage et cheveux oscillent autour du cou, indépendamment du bois.
    head_mask = polygon_mask([(104, 116), (177, 116), (193, 166), (180, 232), (103, 232), (90, 166)], 1)
    head = masked_layer(source, head_mask)
    clear_mask(result, head_mask)
    angle = 4.5 * sin(phase)
    head = head.rotate(angle, resample=Image.Resampling.BICUBIC, center=(142, 224))
    head_y = round(2.0 * sin(phase + pi / 2.0))
    result.alpha_composite(head, (0, head_y))

    # Petite tension des poignets : les liens restent ancrés, seuls les mains
    # et avant-bras frémissent d'un pixel.
    wrist_mask = polygon_mask(
        [(69, 94), (105, 125), (112, 193), (92, 198), (77, 139),
         (177, 124), (214, 94), (207, 141), (191, 198), (171, 193)],
        1,
    )
    wrists = masked_layer(source, wrist_mask)
    wrist_shift = round(sin(phase * 2.0))
    result.alpha_composite(wrists, (wrist_shift, 0))
    return result


def main() -> None:
    sheet = Image.open(ASSET).convert("RGBA")
    source = sheet.crop((0, 0, FRAME_W, FRAME_H))
    output = Image.new("RGBA", (FRAME_W * FRAME_COUNT, FRAME_H))
    for index in range(FRAME_COUNT):
        phase = 2.0 * pi * index / FRAME_COUNT
        output.alpha_composite(animate_frame(source, phase), (index * FRAME_W, 0))
    output.save(ASSET, optimize=True)


if __name__ == "__main__":
    main()