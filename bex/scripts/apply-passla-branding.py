"""Generate Passla branding: graffiti-textured SS icon + wordmark PNGs."""
from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
BRANDING = ASSETS / "branding"

WORDMARK_SRC = Path.home() / "Desktop" / "passla-logo.png"
FALLBACK_WORDMARK = ROOT / "assets" / "icon.png"

NAVY = (5, 31, 69)
CREAM = (240, 238, 233)


def load_wordmark_src() -> Path:
    if WORDMARK_SRC.exists():
        return WORDMARK_SRC
    return FALLBACK_WORDMARK


def detect_ss_box(img: Image.Image) -> tuple[int, int, int, int]:
    data = np.array(img.convert("RGBA"), dtype=np.float32)
    h = data.shape[0]
    bright = data[:, :, :3].mean(axis=2) > 90

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
        return (390, 465, 598, 598)

    x0, x1 = letters[2][0], letters[3][1]
    sub = bright[:, x0:x1]
    ys, xs = np.where(sub)
    pad = 2
    left = x0 + int(xs.min())
    right = x0 + int(xs.max()) + 1
    top = int(ys.min())
    bottom = int(ys.max()) + 1

    y_mid = (top + bottom) // 2
    trim_left = left
    for x in range(left, right):
        upper = bright[top:y_mid, x].sum()
        lower = bright[y_mid:bottom, x].sum()
        total = upper + lower
        if total >= 8 and upper >= 34 and upper / total >= 0.55:
            trim_left = x
            break

    return (
        max(0, trim_left - pad),
        max(0, top - pad),
        min(data.shape[1], right + pad),
        min(data.shape[0], bottom + pad),
    )


def extract_graffiti_alpha(img: Image.Image, *, lum_threshold: float = 88) -> np.ndarray:
    data = np.array(img.convert("RGBA"), dtype=np.float32)
    lum = data[:, :, :3].mean(axis=2)
    alpha = np.zeros(lum.shape, dtype=np.uint8)
    visible = lum > lum_threshold
    alpha[visible] = np.clip((lum[visible] - lum_threshold) * 3.2 + 80, 0, 255).astype(np.uint8)
    return alpha


def clean_ss_mask(alpha: np.ndarray) -> np.ndarray:
    bright = alpha > 24
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
            area = len(pts)
            if min(xs) <= 4 and area < 500:
                continue
            if area < 40:
                continue
            for x, y in pts:
                keep[y, x] = True

    return np.where(keep, alpha, 0).astype(np.uint8)


def extract_ss_graffiti(crop: Image.Image) -> Image.Image:
    data = np.array(crop.convert("RGBA"), dtype=np.float32)
    alpha = clean_ss_mask(extract_graffiti_alpha(crop))

    out = np.zeros((*alpha.shape, 4), dtype=np.uint8)
    visible = alpha > 0
    for ch in range(3):
        out[:, :, ch] = np.where(
            visible, np.clip(data[:, :, ch], 175, 255), 0
        ).astype(np.uint8)
    out[:, :, 3] = alpha
    return Image.fromarray(out, "RGBA")


def extract_full_wordmark(src: Path) -> tuple[Image.Image, Image.Image]:
    img = Image.open(src).convert("RGBA")
    data = np.array(img, dtype=np.float32)
    alpha = extract_graffiti_alpha(img)
    alpha_img = Image.fromarray(alpha, mode="L")
    bbox = alpha_img.getbbox()
    if bbox:
        alpha_img = alpha_img.crop(bbox)
        data = data[bbox[1] : bbox[3], bbox[0] : bbox[2]]

    alpha_arr = np.array(alpha_img, dtype=np.uint8)
    visible = alpha_arr > 0

    white = np.zeros((*alpha_arr.shape, 4), dtype=np.uint8)
    for ch in range(3):
        white[:, :, ch] = np.where(visible, np.clip(data[:, :, ch], 175, 255), 0).astype(np.uint8)
    white[:, :, 3] = alpha_arr

    navy = np.zeros_like(white)
    navy[:, :, 0] = NAVY[0]
    navy[:, :, 1] = NAVY[1]
    navy[:, :, 2] = NAVY[2]
    navy[:, :, 3] = alpha_arr

    return Image.fromarray(white, "RGBA"), Image.fromarray(navy, "RGBA")


def render_ss_icon(ss: Image.Image, *, fill: float = 0.80) -> Image.Image:
    work = 2048
    target = int(work * fill)
    ratio = min(target / ss.width, target / ss.height)
    size = (max(1, int(ss.width * ratio)), max(1, int(ss.height * ratio)))
    scaled = ss.resize(size, Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (work, work), NAVY + (255,))
    x = (work - scaled.width) // 2
    y = (work - scaled.height) // 2
    canvas.paste(scaled, (x, y), scaled)

    return canvas.resize((1024, 1024), Image.Resampling.LANCZOS)


def main() -> None:
    BRANDING.mkdir(parents=True, exist_ok=True)
    src = load_wordmark_src()
    img = Image.open(src)

    box = detect_ss_box(img)
    ss_graffiti = extract_ss_graffiti(img.crop(box))
    icon = render_ss_icon(ss_graffiti)

    icon_path = ASSETS / "icon.png"
    icon.convert("RGB").save(icon_path, "PNG", compress_level=1)
    icon.save(ASSETS / "android-icon-foreground.png", "PNG", compress_level=1)

    favicon = icon.resize((192, 192), Image.Resampling.LANCZOS)
    favicon.convert("RGB").save(ASSETS / "favicon.png", "PNG", compress_level=1)

    white_wm, navy_wm = extract_full_wordmark(src)
    white_wm.save(BRANDING / "passla-wordmark-white.png", "PNG", compress_level=1)
    navy_wm.save(BRANDING / "passla-wordmark-navy.png", "PNG", compress_level=1)

    splash_w = 900
    splash_h = max(1, int(splash_w * navy_wm.height / navy_wm.width))
    splash_wm = navy_wm.resize((splash_w, splash_h), Image.Resampling.LANCZOS)
    splash = Image.new("RGBA", (1024, 1024), CREAM + (255,))
    sx = (1024 - splash_w) // 2
    sy = (1024 - splash_h) // 2
    splash.paste(splash_wm, (sx, sy), splash_wm)
    splash.convert("RGB").save(ASSETS / "splash-icon.png", "PNG", compress_level=1)

    if src == WORDMARK_SRC:
        Image.open(src).save(BRANDING / "passla-wordmark-source.png", "PNG", compress_level=1)

    print(f"Source: {src}")
    print(f"SS crop: {box}")
    print(f"Saved: {icon_path}")


if __name__ == "__main__":
    main()
