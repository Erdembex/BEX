"""PASSLA graffiti logo — 10 iOS icon variants from brand palette."""
from __future__ import annotations

import os
from typing import Callable

import numpy as np
from PIL import Image, ImageDraw

SIZE = 1024
OUT_DIR = os.path.join(os.path.expanduser("~"), "Desktop", "Passla-Logo-10-Varyant")
LOGO_SRC = os.path.join(os.path.expanduser("~"), "Desktop", "passla-logo.png")

# Brand palette
SAPPHIRE = (5, 31, 69)       # #051F45
AMBER = (195, 150, 56)       # #C39638
DEEP_TEAL = (0, 115, 134)    # #007386
VIVID_GOLD = (231, 198, 99)  # #E7C663
BRONZE = (159, 118, 51)      # #9F7633
SOFT_CREAM = (255, 248, 225) # #FFF8E1
WARM_GOLD = (209, 166, 81)   # #D1A651
BRIGHT_CYAN = (1, 148, 162)  # #0194A2
ROYAL_BLUE = (42, 85, 158)   # #2A559E
DARK_INDIGO = (10, 26, 47)   # #0A1A2F
MIDNIGHT = (18, 27, 42)      # #121B2A
OFF_WHITE = (241, 245, 249)  # #F1F5F9


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def lerp_rgb(c1: tuple[int, int, int], c2: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return (
        int(lerp(c1[0], c2[0], t)),
        int(lerp(c1[1], c2[1], t)),
        int(lerp(c1[2], c2[2], t)),
    )


def make_linear_gradient(
    size: int, c_top: tuple[int, int, int], c_bottom: tuple[int, int, int]
) -> np.ndarray:
    grad = np.zeros((size, size, 3), dtype=np.float32)
    for y in range(size):
        t = y / (size - 1)
        c = lerp_rgb(c_top, c_bottom, t)
        grad[y, :] = c
    return grad


def make_radial_gradient(
    size: int, center: tuple[int, int, int], edge: tuple[int, int, int]
) -> np.ndarray:
    grad = np.zeros((size, size, 3), dtype=np.float32)
    cx, cy = size // 2, size // 2
    max_r = (size * 0.72)
    for y in range(size):
        for x in range(size):
            r = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            t = min(r / max_r, 1.0)
            grad[y, x] = lerp_rgb(center, edge, t)
    return grad


def make_diagonal_gradient(
    size: int, c1: tuple[int, int, int], c2: tuple[int, int, int], c3: tuple[int, int, int]
) -> np.ndarray:
    grad = np.zeros((size, size, 3), dtype=np.float32)
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            if t < 0.5:
                grad[y, x] = lerp_rgb(c1, c2, t * 2)
            else:
                grad[y, x] = lerp_rgb(c2, c3, (t - 0.5) * 2)
    return grad


def load_spray_mask(logo_path: str) -> tuple[np.ndarray, tuple[int, int]]:
    logo = Image.open(logo_path).convert("RGB")
    arr = np.array(logo, dtype=np.float32)
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    spray = np.clip(lum / 255.0, 0, 1)
    return spray, logo.size


def composite_icon(
    bg: np.ndarray,
    spray: np.ndarray,
    logo_size: tuple[int, int],
    fg: tuple[int, int, int],
    fg_secondary: tuple[int, int, int] | None = None,
    accent_glow: tuple[int, int, int] | None = None,
) -> Image.Image:
    canvas = bg.copy()
    lw, lh = logo_size
    target_w = int(SIZE * 0.84)
    target_h = int(lh * (target_w / lw))
    if target_h > int(SIZE * 0.52):
        target_h = int(SIZE * 0.52)
        target_w = int(lw * (target_h / lh))

    spray_img = Image.fromarray((spray * 255).astype(np.uint8), mode="L")
    spray_scaled = np.array(
        spray_img.resize((target_w, target_h), Image.Resampling.LANCZOS), dtype=np.float32
    ) / 255.0

    x0 = (SIZE - target_w) // 2
    y0 = (SIZE - target_h) // 2 + int(SIZE * 0.02)

    patch = canvas[y0 : y0 + target_h, x0 : x0 + target_w]
    mid = target_w // 2

    for yy in range(target_h):
        for xx in range(target_w):
            s = spray_scaled[yy, xx]
            if s < 0.04:
                continue
            bg_px = patch[yy, xx]
            if fg_secondary and xx >= mid - 8:
                base = np.array(fg_secondary, dtype=np.float32)
            else:
                base = np.array(fg, dtype=np.float32)
            if accent_glow and 0.15 < s < 0.85:
                glow = np.array(accent_glow, dtype=np.float32)
                base = base * 0.82 + glow * 0.18
            out = base * s + bg_px * (1.0 - s)
            patch[yy, xx] = np.clip(out, 0, 255)

    canvas[y0 : y0 + target_h, x0 : x0 + target_w] = patch
    return Image.fromarray(canvas.astype(np.uint8))


def add_subtle_vignette(img: Image.Image, strength: float = 0.12) -> Image.Image:
    arr = np.array(img.convert("RGB"), dtype=np.float32)
    size = arr.shape[0]
    cx = cy = size // 2
    max_r = size * 0.75
    for y in range(size):
        for x in range(size):
            r = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            t = min(r / max_r, 1.0) * strength
            arr[y, x] *= 1.0 - t
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


VARIANTS: list[tuple[str, Callable[[], Image.Image]]] = []


def build_variants(spray, logo_size):
    specs = [
        (
            "01-safir-beyaz",
            lambda: composite_icon(
                make_radial_gradient(SIZE, SAPPHIRE, DARK_INDIGO),
                spray,
                logo_size,
                OFF_WHITE,
            ),
        ),
        (
            "02-safir-vivid-gold",
            lambda: composite_icon(
                make_linear_gradient(SIZE, SAPPHIRE, DARK_INDIGO),
                spray,
                logo_size,
                VIVID_GOLD,
                WARM_GOLD,
            ),
        ),
        (
            "03-teal-safir-cream",
            lambda: composite_icon(
                make_diagonal_gradient(SIZE, DEEP_TEAL, SAPPHIRE, DARK_INDIGO),
                spray,
                logo_size,
                SOFT_CREAM,
            ),
        ),
        (
            "04-royal-cyan-beyaz",
            lambda: composite_icon(
                make_linear_gradient(SIZE, ROYAL_BLUE, SAPPHIRE),
                spray,
                logo_size,
                OFF_WHITE,
                accent_glow=BRIGHT_CYAN,
            ),
        ),
        (
            "05-midnight-altin",
            lambda: composite_icon(
                make_radial_gradient(SIZE, MIDNIGHT, SAPPHIRE),
                spray,
                logo_size,
                VIVID_GOLD,
                AMBER,
            ),
        ),
        (
            "06-indigo-soft-cream",
            lambda: composite_icon(
                make_linear_gradient(SIZE, DARK_INDIGO, SAPPHIRE),
                spray,
                logo_size,
                SOFT_CREAM,
            ),
        ),
        (
            "07-teal-cyan-gold",
            lambda: composite_icon(
                make_diagonal_gradient(SIZE, DEEP_TEAL, BRIGHT_CYAN, SAPPHIRE),
                spray,
                logo_size,
                WARM_GOLD,
                VIVID_GOLD,
            ),
        ),
        (
            "08-bronze-amber",
            lambda: composite_icon(
                make_radial_gradient(SIZE, SAPPHIRE, MIDNIGHT),
                spray,
                logo_size,
                AMBER,
                BRONZE,
            ),
        ),
        (
            "09-royal-teal-beyaz",
            lambda: composite_icon(
                make_diagonal_gradient(SIZE, ROYAL_BLUE, DEEP_TEAL, SAPPHIRE),
                spray,
                logo_size,
                OFF_WHITE,
                accent_glow=VIVID_GOLD,
            ),
        ),
        (
            "10-kristal-harman",
            lambda: composite_icon(
                make_diagonal_gradient(SIZE, SAPPHIRE, ROYAL_BLUE, DEEP_TEAL),
                spray,
                logo_size,
                OFF_WHITE,
                VIVID_GOLD,
                accent_glow=BRIGHT_CYAN,
            ),
        ),
    ]
    return specs


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    spray, logo_size = load_spray_mask(LOGO_SRC)
    specs = build_variants(spray, logo_size)

    for name, builder in specs:
        img = add_subtle_vignette(builder())
        path = os.path.join(OUT_DIR, f"passla-icon-{name}.png")
        img.save(path, "PNG", optimize=True)
        print("Saved", path)

    readme = """Passla — 10 iOS app icon varyanti
==================================

Ayni PASSLA graffiti yazisi (SS oklari korundu).
Safir #051F45, teal, altin ve krem paleti harmanlandi.

01-safir-beyaz        → Klasik safir + beyaz
02-safir-vivid-gold   → Safir zemin + canli altin yazi
03-teal-safir-cream   → Teal-safir gecis + krem
04-royal-cyan-beyaz   → Royal mavi + cyan parilti
05-midnight-altin     → Gece mavisi + altin
06-indigo-soft-cream  → Indigo-safir + soft cream
07-teal-cyan-gold     → Teal-cyan + sicak altin
08-bronze-amber       → Safir + amber/bronze yazi
09-royal-teal-beyaz   → Royal-teal + beyaz + altin dokunuş
10-kristal-harman     → Tum mavi-teal tonlari + beyaz/altin

1024x1024 — iOS/Android app icon boyutu.
"""
    with open(os.path.join(OUT_DIR, "OKU.txt"), "w", encoding="utf-8") as f:
        f.write(readme)
    print("Done ->", OUT_DIR)


if __name__ == "__main__":
    main()
