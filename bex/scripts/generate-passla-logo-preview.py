"""PASSLA logo preview — navy bg, gold-bronze SS swap mark, white wordmark on top."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
DESKTOP = Path.home() / "Desktop"
WORDMARK_SRC = (
    Path(__file__).resolve().parents[2]
    / ".cursor"
    / "projects"
    / "c-Users-ERDEM-Desktop-BEX-CURSOR"
    / "assets"
    / "c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08_images_passla-logo-16ad13f1-2eac-46ea-a3ae-36f812e40487.png"
)
SWAP_MARK_SRC = ROOT / "assets" / "branding" / "passla-icon-mark.png"
FALLBACK_WORDMARK = ROOT / "assets" / "branding" / "passla-logo-full.png"

NAVY = (5, 31, 69)
GOLD = np.array([231, 198, 99], dtype=np.float32)
BRONZE = np.array([159, 118, 51], dtype=np.float32)
GOLD_MID = np.array([196, 160, 74], dtype=np.float32)


def extract_white_wordmark(src: Path) -> Image.Image:
    img = Image.open(src).convert("RGBA")
    data = np.array(img, dtype=np.float32)
    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]
    brightness = (r + g + b) / 3.0
    # Distressed white letters on navy — permissive threshold for rough edges.
    text_mask = (brightness > 95) & (a > 8)
    out = np.zeros((*text_mask.shape, 4), dtype=np.uint8)
    out[text_mask] = (255, 255, 255, 255)
    wordmark = Image.fromarray(out, "RGBA")
    bbox = wordmark.getbbox()
    if not bbox:
        raise RuntimeError(f"Could not extract wordmark from {src}")
    return wordmark.crop(bbox)


def recolor_swap_mark(src: Path) -> Image.Image:
    img = Image.open(src).convert("RGBA")
    data = np.array(img, dtype=np.float32)
    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]
    brightness = (r + g + b) / 3.0
    visible = a > 16

    purple = visible & (b > 95) & (r > 70) & (g < r * 0.82) & (b > g)
    gold = visible & ~purple & (r > 120) & (g > 90) & (brightness > 70)
    dark = visible & (brightness < 45)
    # Remove specular white highlights — wordmark carries the white SS detail.
    specular = visible & (brightness > 210) & ~dark

    out = np.zeros_like(data)
    alpha = np.where(dark | specular, 0, a)
    out[:, :, 3] = alpha

    for channel in range(3):
        ch = out[:, :, channel]
        ch[gold] = GOLD[channel] * 0.58 + r[gold] * 0.2 + g[gold] * 0.22
        ch[purple] = BRONZE[channel] * 0.65 + r[purple] * 0.12 + b[purple] * 0.06
        mid = visible & ~dark & ~gold & ~purple & ~specular
        ch[mid] = GOLD_MID[channel] * 0.55 + data[:, :, channel][mid] * 0.45
        out[:, :, channel] = np.clip(ch, 0, 255)

    mark = Image.fromarray(out.astype(np.uint8), "RGBA")
    bbox = mark.getbbox()
    if not bbox:
        raise RuntimeError("Swap mark recolor failed")
    return mark.crop(bbox)


def soften_edges(layer: Image.Image, opacity: float = 0.92) -> Image.Image:
    alpha = layer.split()[3].point(lambda p: int(p * opacity))
    layer = layer.copy()
    layer.putalpha(alpha)
    return layer


def fit_layer(layer: Image.Image, max_w: int, max_h: int) -> Image.Image:
    ratio = min(max_w / layer.width, max_h / layer.height)
    size = (max(1, int(layer.width * ratio)), max(1, int(layer.height * ratio)))
    return layer.resize(size, Image.Resampling.LANCZOS)


def compose(canvas_w: int, canvas_h: int) -> Image.Image:
    canvas = Image.new("RGBA", (canvas_w, canvas_h), NAVY + (255,))

    wordmark_src = WORDMARK_SRC if WORDMARK_SRC.exists() else FALLBACK_WORDMARK
    wordmark = extract_white_wordmark(wordmark_src)
    swap = recolor_swap_mark(SWAP_MARK_SRC)

    # Wordmark is hero; swap mark sits behind as large watermark.
    wordmark = fit_layer(wordmark, int(canvas_w * 0.92), int(canvas_h * 0.38))
    swap = fit_layer(swap, int(canvas_w * 0.55), int(canvas_h * 0.72))
    swap = soften_edges(swap, opacity=0.88)

    swap_layer = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    swap_x = (canvas_w - swap.width) // 2
    swap_y = (canvas_h - swap.height) // 2
    swap_layer.paste(swap, (swap_x, swap_y), swap)

    # Soft gold glow behind swap mark.
    glow = swap.copy().filter(ImageFilter.GaussianBlur(radius=max(8, canvas_w // 120)))
    glow.putalpha(glow.split()[3].point(lambda p: int(p * 0.35)))
    glow_layer = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    glow_layer.paste(glow, (swap_x, swap_y - 4), glow)

    canvas = Image.alpha_composite(canvas, glow_layer)
    canvas = Image.alpha_composite(canvas, swap_layer)

    wx = (canvas_w - wordmark.width) // 2
    wy = (canvas_h - wordmark.height) // 2
    canvas.paste(wordmark, (wx, wy), wordmark)

    return canvas.convert("RGB")


def main() -> None:
    DESKTOP.mkdir(parents=True, exist_ok=True)
    outputs = [
        (DESKTOP / "passla-logo-onizleme.png", 1920, 1080),
        (DESKTOP / "passla-logo-onizleme-kare.png", 1200, 1200),
    ]
    for path, w, h in outputs:
        compose(w, h).save(path, "PNG", optimize=True)
        print(f"Saved: {path}")


if __name__ == "__main__":
    main()
