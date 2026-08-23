"""High-quality SS-only mark from horizontal PASSLA wordmark (no A/L bleed)."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
# Horizontal wordmark — SS is ~1.6x larger than icon.png crop (314×211 vs 208×133).
WORDMARK_SRC = Path.home() / "Desktop" / "passla-logo.png"
FALLBACK_SRC = ROOT / "assets" / "icon.png"
OUT_DIR = Path.home() / "Desktop" / "Passla-SS-Revizeler"

NAVY = (5, 31, 69)
GOLD = (231, 198, 99)       # #E7C663
GOLD_MID = (196, 160, 74)
BRONZE = (159, 118, 51)     # #9F7633


def detect_ss_box(img: Image.Image) -> tuple[int, int, int, int]:
    """Find only the two swap S letters — excludes A tail and L."""
    data = np.array(img.convert("RGBA"), dtype=np.float32)
    h = data.shape[0]
    bright = data[:, :, :3].mean(axis=2) > 90

    # Letter gaps visible in the upper half of the wordmark.
    band = bright[h // 4 : h // 2, :]
    col = band.sum(axis=0).astype(float)
    sm = np.convolve(col, np.ones(9) / 9, mode="same")
    threshold = sm.max() * 0.10

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

    if len(letters) < 4:
        # Fallback: icon.png manual box (no A tail).
        return (390, 465, 598, 598)

    # PASSLA → index 2 & 3 are the swap SS pair.
    x0 = letters[2][0]
    x1 = letters[3][1]
    sub = bright[:, x0:x1]
    ys, xs = np.where(sub)
    pad = 2
    left = x0 + int(xs.min())
    right = x0 + int(xs.max()) + 1
    top = int(ys.min())
    bottom = int(ys.max()) + 1

    # Drop A tail: first column where the S upper curve is present (not just A leg).
    y_mid = (top + bottom) // 2
    trim_left = left
    for x in range(left, right):
        upper = bright[top:y_mid, x].sum()
        lower = bright[y_mid:bottom, x].sum()
        total = upper + lower
        if total < 8:
            continue
        if upper >= 34 and upper / total >= 0.55:
            trim_left = x
            break

    return (
        max(0, trim_left - pad),
        max(0, top - pad),
        min(data.shape[1], right + pad),
        min(data.shape[0], bottom + pad),
    )


def extract_alpha_mask(crop: Image.Image) -> Image.Image:
    data = np.array(crop.convert("RGBA"), dtype=np.float32)
    lum = data[:, :, :3].mean(axis=2)
    alpha = np.clip((lum - 40) / (255 - 40) * 255, 0, 255).astype(np.uint8)
    bright = alpha > 24

    # Remove stray A-tail specks (small blobs on the left edge).
    from collections import deque

    h, w = bright.shape
    visited = np.zeros_like(bright, bool)
    keep = np.zeros_like(bright, bool)
    for sy in range(h):
        for sx in range(w):
            if not bright[sy, sx] or visited[sy, sx]:
                continue
            q = deque([(sy, sx)])
            pts: list[tuple[int, int]] = []
            while q:
                y, x = q.popleft()
                if y < 0 or x < 0 or y >= h or x >= w or visited[y, x] or not bright[y, x]:
                    continue
                visited[y, x] = True
                pts.append((x, y))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    q.append((y + dy, x + dx))
            xs = [p[0] for p in pts]
            ys = [p[1] for p in pts]
            area = len(pts)
            width = max(xs) - min(xs) + 1
            left_edge = min(xs) <= 4
            if left_edge and area < 500:
                continue
            if area < 40:
                continue
            for x, y in pts:
                keep[y, x] = True

    cleaned = np.where(keep, alpha, 0).astype(np.uint8)
    return Image.fromarray(cleaned, mode="L")


def colorize_mask(mask: Image.Image, color_fn) -> Image.Image:
    """Apply color while preserving spray-paint texture via alpha."""
    m = np.array(mask, dtype=np.float32) / 255.0
    h, w = m.shape
    rgb = np.zeros((h, w, 3), dtype=np.float32)
    for y in range(h):
        for x in range(w):
            rgb[y, x] = color_fn(x / max(w - 1, 1), y / max(h - 1, 1), m[y, x])
    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = (m * 255).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def white_color(_nx: float, _ny: float, a: float) -> np.ndarray:
    v = 255 * min(1.0, a * 1.05)
    return np.array([v, v, v], dtype=np.float32)


def gold_bronze_color(nx: float, _ny: float, a: float) -> np.ndarray:
    if nx < 0.5:
        base = np.array(GOLD, dtype=np.float32)
    else:
        base = np.array(BRONZE, dtype=np.float32)
    # Subtle vertical shading for depth.
    shade = 0.88 + 0.12 * (1 - abs(nx - 0.5) * 2)
    return base * shade * min(1.0, a * 1.08)


def render(
    mark: Image.Image,
    canvas: int,
    *,
    bg: tuple[int, int, int],
    fill: float = 0.82,
    pad: float = 0.08,
) -> Image.Image:
    usable = int(canvas * (1 - pad * 2))
    target = int(usable * fill)
    ratio = min(target / mark.width, target / mark.height)
    size = (max(1, int(mark.width * ratio)), max(1, int(mark.height * ratio)))
    scaled = mark.resize(size, Image.Resampling.LANCZOS)

    out = Image.new("RGBA", (canvas, canvas), bg + (255,))
    x = (canvas - scaled.width) // 2
    y = (canvas - scaled.height) // 2
    out.paste(scaled, (x, y), scaled)
    return out


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    src = WORDMARK_SRC if WORDMARK_SRC.exists() else FALLBACK_SRC
    img = Image.open(src)
    box = detect_ss_box(img)
    crop = img.crop(box)
    mask = extract_alpha_mask(crop)

    white_mark = colorize_mask(mask, white_color)
    gold_mark = colorize_mask(mask, gold_bronze_color)

    outputs = [
        ("01-beyaz-ss-kare-2048", white_mark, NAVY, 2048),
        ("02-beyaz-ss-app-icon-1024", white_mark, NAVY, 1024),
        ("03-beyaz-ss-buyuk-4096", white_mark, NAVY, 4096),
        ("04-altin-bronz-ss-kare-2048", gold_mark, NAVY, 2048),
        ("05-altin-bronz-ss-app-icon-1024", gold_mark, NAVY, 1024),
        ("06-altin-bronz-ss-buyuk-4096", gold_mark, NAVY, 4096),
    ]

    for name, mark, bg, size in outputs:
        out = render(mark, size, bg=bg)
        path = OUT_DIR / f"passla-{name}.png"
        out.save(path, "PNG", compress_level=1)
        print(f"Saved: {path} ({size}×{size}, crop {box})")

    (OUT_DIR / "OKU.txt").write_text(
        f"""Passla — yüksek kalite SS revizeleri
=====================================
Kaynak: {src.name} (SS crop: {box[2]-box[0]}×{box[3]-box[1]} px)

01-03 → Koyu mavi zemin + beyaz SS (takas okları korundu)
04-06 → Koyu mavi zemin + altın/bronz SS

A harfi kuyruğu ve L harfi kırpıldı; sadece SS kaldı.
""",
        encoding="utf-8",
    )
    print(f"Done -> {OUT_DIR}")


if __name__ == "__main__":
    main()
