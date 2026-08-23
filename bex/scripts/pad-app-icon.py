"""Scale app icon / splash assets inward so PASSLA wordmark does not clip at edges."""
from __future__ import annotations

import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
# Fraction of canvas used by artwork (lower = more padding)
SCALE = 0.78


def pad_icon(path: str, bg: tuple[int, int, int] | None = None) -> None:
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    target = int(min(w, h) * SCALE)
    ratio = min(target / w, target / h)
    nw, nh = max(1, int(w * ratio)), max(1, int(h * ratio))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (w, h), bg + (255,) if bg else (0, 0, 0, 0))
    canvas.paste(resized, ((w - nw) // 2, (h - nh) // 2), resized)
    canvas.save(path, "PNG", optimize=True)
    print(f"Padded {path} ({SCALE * 100:.0f}% scale)")


def main() -> None:
    pad_icon(os.path.join(ASSETS, "icon.png"), bg=(5, 31, 69))
    pad_icon(os.path.join(ASSETS, "splash-icon.png"), bg=(240, 238, 233))
    pad_icon(os.path.join(ASSETS, "favicon.png"), bg=(5, 31, 69))
    print("Done.")


if __name__ == "__main__":
    main()
