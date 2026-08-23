"""Prepare auth tea glass asset: trim and export PNG with alpha."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "branding" / "auth-tea-glass.jpg"
OUT = ROOT / "assets" / "branding" / "auth-tea-glass.png"


def main() -> None:
    img = Image.open(SRC).convert("RGBA")
    arr = np.array(img, dtype=np.float32)
    rgb = arr[:, :, :3]
    lum = rgb.mean(axis=2)
    chroma = rgb.std(axis=2)
    # Drop white JPEG backdrop and baked-in checkerboard tiles.
    bg = (lum > 198) & (chroma < 28)
    alpha = arr[:, :, 3].copy()
    alpha[bg] = 0
    arr[:, :, 3] = alpha

    ys, xs = np.where(alpha > 8)
    if len(xs):
        pad = 8
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
