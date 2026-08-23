"""Export PASSLA graffiti letters as individual PNGs for spray-paint animation."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "branding" / "passla-wordmark-white.png"
OUT = ROOT / "assets" / "branding" / "passla-letters"


def detect_letters(img: Image.Image) -> list[tuple[int, int]]:
    data = np.array(img.convert("RGBA"))
    h, w = data.shape[:2]
    alpha = data[:, :, 3]
    band = alpha[h // 4 : h // 2, :]
    col = (band > 24).sum(axis=0).astype(float)
    sm = np.convolve(col, np.ones(9) / 9, mode="same")
    threshold = sm.max() * 0.09

    letters: list[tuple[int, int]] = []
    in_letter = False
    start = 0
    for i, v in enumerate(sm):
        if v > threshold and not in_letter:
            start = i
            in_letter = True
        elif v <= threshold and in_letter:
            letters.append((start, i))
            in_letter = False
    if in_letter:
        letters.append((start, len(sm)))

    if len(letters) < 6:
        # Tuned fallback for 816×220 wordmark.
        return [(0, 118), (118, 178), (178, 400), (400, 548), (548, 628), (628, w)]

    return letters[:6]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    img = Image.open(SRC).convert("RGBA")
    w, h = img.size
    letters = detect_letters(img)
    names = ["P", "A1", "S1", "S2", "L", "A2"]

    for name, (x0, x1) in zip(names, letters, strict=True):
        pad = 3
        crop = img.crop((max(0, x0 - pad), 0, min(w, x1 + pad), h))
        crop.save(OUT / f"{name}.png", "PNG", compress_level=1)
        print(f"{name}.png {crop.size}")

    print(f"Done -> {OUT}")


if __name__ == "__main__":
    main()
