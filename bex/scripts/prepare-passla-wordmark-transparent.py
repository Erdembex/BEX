"""Strip parchment/paper backdrop from Istanbul-style PASSLA wordmark."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "branding" / "passla-wordmark-istanbul.png"
OUT = ROOT / "assets" / "branding" / "passla-wordmark-istanbul-letters.png"


def dilate(mask: np.ndarray, radius: int = 5) -> np.ndarray:
    out = mask.copy()
    h, w = mask.shape
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            if dx * dx + dy * dy > radius * radius:
                continue
            y0 = max(0, dy)
            y1 = h + min(0, dy)
            x0 = max(0, dx)
            x1 = w + min(0, dx)
            sy0 = max(0, -dy)
            sx0 = max(0, -dx)
            out[y0:y1, x0:x1] |= mask[sy0 : sy0 + (y1 - y0), sx0 : sx0 + (x1 - x0)]
    return out


def main() -> None:
    img = Image.open(SRC).convert("RGBA")
    arr = np.array(img, dtype=np.float32)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

    lum = (r + g + b) / 3.0
    navy = (lum < 98) & (b >= r * 0.68) & (b >= g * 0.74)
    keep = dilate(navy, radius=6)
    out_a = np.where(keep, np.maximum(a, 255), 0)

    core_ys = np.where(navy)
    if len(core_ys[0]):
        trim_y = int(core_ys[0].max()) + 10
        below = np.arange(arr.shape[0])[:, None] > trim_y
        out_a = np.where(below & (lum > 130), 0, out_a)

    arr[:, :, 3] = out_a
    ys, xs = np.where(out_a > 8)
    if len(xs):
        pad = 4
        left = max(0, int(xs.min()) - pad)
        right = min(arr.shape[1], int(xs.max()) + 1 + pad)
        top = max(0, int(ys.min()) - pad)
        bottom = min(arr.shape[0], int(ys.max()) + 1 + pad)
        arr = arr[top:bottom, left:right]

    out = Image.fromarray(arr.astype(np.uint8), "RGBA")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, "PNG", optimize=True)
    print("Saved", OUT, out.size)


if __name__ == "__main__":
    main()
