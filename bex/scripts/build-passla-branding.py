# -*- coding: utf-8 -*-
"""PASSLA wordmark + SS işaret — şeffaf PNG, SS hafif büyütülmüş."""
from __future__ import annotations

import os
from collections import deque

import numpy as np
from PIL import Image

WORDMARK_SRC = (
    r"C:\Users\ERDEM\.cursor\projects\c-Users-ERDEM-Desktop-BEX-CURSOR\assets"
    r"\c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08"
    r"_images_passla-ios-icon-07ce0253-d229-4fb0-ae9e-99e55583f648.png"
)
MARK_SRC = (
    r"C:\Users\ERDEM\.cursor\projects\c-Users-ERDEM-Desktop-BEX-CURSOR\assets"
    r"\c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08"
    r"_images_WhatsApp_Image_2026-09-02_at_18.50.13-4582b432-dca7-4cea-91f8-c120bdf81829.jpg"
)
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "branding")
NAVY = np.array([5, 31, 69], dtype=np.float32)
SS_BOOST = 1.16  # SS bölgesi hafif büyütme
MARK_PAD = 0.02  # işarette daha az boşluk → biraz daha büyük görünür


def remove_navy_bg(im: Image.Image, threshold: float = 42) -> Image.Image:
    rgba = im.convert("RGBA")
    arr = np.array(rgba, dtype=np.float32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    dist = np.sqrt((r - NAVY[0]) ** 2 + (g - NAVY[1]) ** 2 + (b - NAVY[2]) ** 2)
    bg = dist < threshold

    h, w = arr.shape[:2]
    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        q.append((0, x))
        q.append((h - 1, x))
    for y in range(h):
        q.append((y, 0))
        q.append((y, w - 1))

    while q:
        y, x = q.popleft()
        if y < 0 or y >= h or x < 0 or x >= w or visited[y, x]:
            continue
        if not bg[y, x]:
            continue
        visited[y, x] = True
        q.extend([(y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)])

    alpha = arr[..., 3].copy()
    alpha[visited] = 0
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    paint = (~visited) & (lum > 80)
    alpha[paint] = np.clip(alpha[paint] + (lum[paint] - 80) * 1.8, 0, 255)
    arr[..., 3] = np.clip(alpha, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def trim_content(im: Image.Image, pad_ratio: float = 0.06) -> Image.Image:
    arr = np.array(im)
    ys, xs = np.where(arr[..., 3] > 12)
    if len(xs) == 0:
        return im
    x0, x1 = xs.min(), xs.max()
    y0, y1 = ys.min(), ys.max()
    cropped = im.crop((x0, y0, x1 + 1, y1 + 1))
    cw, ch = cropped.size
    pad_x = int(cw * pad_ratio)
    pad_y = int(ch * pad_ratio)
    canvas = Image.new("RGBA", (cw + pad_x * 2, ch + pad_y * 2), (0, 0, 0, 0))
    canvas.paste(cropped, (pad_x, pad_y), cropped)
    return canvas


def trim_square(im: Image.Image, pad_ratio: float = MARK_PAD) -> Image.Image:
    arr = np.array(im)
    ys, xs = np.where(arr[..., 3] > 12)
    if len(xs) == 0:
        return im
    x0, x1 = xs.min(), xs.max()
    y0, y1 = ys.min(), ys.max()
    cropped = im.crop((x0, y0, x1 + 1, y1 + 1))
    cw, ch = cropped.size
    side = max(cw, ch)
    pad = int(side * pad_ratio)
    canvas = Image.new("RGBA", (side + pad * 2, side + pad * 2), (0, 0, 0, 0))
    ox = pad + (side - cw) // 2
    oy = pad + (side - ch) // 2
    canvas.paste(cropped, (ox, oy), cropped)
    return canvas


def boost_ss_region(im: Image.Image, scale: float = SS_BOOST) -> Image.Image:
    """Wordmark ortasındaki SS bölgesini hafif büyüt."""
    w, h = im.size
    x0 = int(w * 0.28)
    x1 = int(w * 0.72)
    y0 = int(h * 0.08)
    y1 = int(h * 0.92)
    region = im.crop((x0, y0, x1, y1))
    rw, rh = region.size
    bigger = region.resize((int(rw * scale), int(rh * scale)), Image.Resampling.LANCZOS)
    out = im.copy()
    bx = x0 + (rw - bigger.size[0]) // 2
    by = y0 + (rh - bigger.size[1]) // 2
    out.paste(bigger, (bx, by), bigger)
    return out


def to_navy(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"), dtype=np.float32)
    out = np.zeros_like(arr)
    for i in range(3):
        out[..., i] = NAVY[i]
    out[..., 3] = arr[..., 3]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


def export_wordmark_set(im: Image.Image, base_w: int, name: str) -> None:
    w, h = im.size
    ratio = h / w
    for mult, suffix in ((1, ""), (2, "@2x"), (3, "@3x")):
        tw = base_w * mult
        th = max(1, int(tw * ratio))
        out = im.resize((tw, th), Image.Resampling.LANCZOS)
        path = os.path.join(OUT_DIR, f"{name}{suffix}.png")
        out.save(path, "PNG", compress_level=1)
        print("saved", path, out.size)


def export_mark_set(im: Image.Image, base: int, name: str) -> None:
    for mult, suffix in ((1, ""), (2, "@2x"), (3, "@3x")):
        size = base * mult
        out = im.resize((size, size), Image.Resampling.LANCZOS)
        path = os.path.join(OUT_DIR, f"{name}{suffix}.png")
        out.save(path, "PNG", compress_level=1)
        print("saved", path, out.size)


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)

    # PASSLA wordmark (header)
    wm = remove_navy_bg(Image.open(WORDMARK_SRC).convert("RGB"))
    wm = trim_content(wm, pad_ratio=0.05)
    wm = boost_ss_region(wm)
    wm = trim_content(wm, pad_ratio=0.05)
    wm_navy = to_navy(wm)
    wm.save(os.path.join(OUT_DIR, "passla-wordmark-source.png"), "PNG", compress_level=1)
    export_wordmark_set(wm, 256, "passla-wordmark-white")
    export_wordmark_set(wm_navy, 256, "passla-wordmark-navy")

    # SS işaret (splash, ikon vb.)
    mark = trim_square(remove_navy_bg(Image.open(MARK_SRC).convert("RGB")))
    mark_navy = to_navy(mark)
    export_mark_set(mark, 128, "passla-mark-white")
    export_mark_set(mark_navy, 128, "passla-mark-navy")
    export_mark_set(mark, 128, "passla-icon-mark")
    export_mark_set(mark, 128, "passla-logo")

    mark_hi = mark.resize((760, 760), Image.Resampling.LANCZOS)
    assets = os.path.join(os.path.dirname(OUT_DIR))
    for name, bg, art in (
        ("icon.png", (5, 31, 69, 255), mark_hi),
        ("favicon.png", (5, 31, 69, 255), mark_hi.resize((540, 540), Image.Resampling.LANCZOS)),
        ("splash-icon.png", (5, 31, 69, 255), mark_hi),
    ):
        side = 1024 if name == "icon.png" else 512
        sz = art.size[0]
        canvas = Image.new("RGBA", (side, side), bg)
        canvas.paste(art, ((side - sz) // 2, (side - sz) // 2), art)
        canvas.save(os.path.join(assets, name), "PNG", compress_level=1)
        print("saved", os.path.join(assets, name))

    print("done")


if __name__ == "__main__":
    main()
