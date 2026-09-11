# -*- coding: utf-8 -*-
"""Yeni Passla SS işaret logosu — şeffaf PNG, beyaz + lacivert varyantlar."""
from __future__ import annotations

import os
from collections import deque

import numpy as np
from PIL import Image

SRC = (
    r"C:\Users\ERDEM\.cursor\projects\c-Users-ERDEM-Desktop-BEX-CURSOR\assets"
    r"\c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08"
    r"_images_WhatsApp_Image_2026-09-02_at_18.50.13-4582b432-dca7-4cea-91f8-c120bdf81829.jpg"
)
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "branding")
NAVY = np.array([5, 31, 69], dtype=np.float32)
BASE = 128  # mantıksal px


def remove_navy_bg(im: Image.Image) -> Image.Image:
    rgba = im.convert("RGBA")
    arr = np.array(rgba, dtype=np.float32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    dist = np.sqrt((r - NAVY[0]) ** 2 + (g - NAVY[1]) ** 2 + (b - NAVY[2]) ** 2)
    bg = dist < 42

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
    # Beyaz sprey alanları
    lum = (0.299 * r + 0.587 * g + 0.114 * b)
    paint = (~visited) & (lum > 80)
    alpha[paint] = np.clip(alpha[paint] + (lum[paint] - 80) * 1.8, 0, 255)
    arr[..., 3] = np.clip(alpha, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def trim_square(im: Image.Image, pad_ratio: float = 0.08) -> Image.Image:
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


def to_navy(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"), dtype=np.float32)
    a = arr[..., 3] / 255.0
    out = np.zeros_like(arr)
    for i in range(3):
        out[..., i] = NAVY[i]
    out[..., 3] = arr[..., 3]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


def export_set(im: Image.Image, name: str) -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for mult, suffix in ((1, ""), (2, "@2x"), (3, "@3x")):
        size = BASE * mult
        out = im.resize((size, size), Image.Resampling.LANCZOS)
        path = os.path.join(OUT_DIR, f"{name}{suffix}.png")
        out.save(path, "PNG", compress_level=1)
        print("saved", path, out.size)


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    transparent = trim_square(remove_navy_bg(im))
    navy = to_navy(transparent)

    transparent.save(os.path.join(OUT_DIR, "passla-logo-source.png"), "PNG", compress_level=1)
    export_set(transparent, "passla-mark-white")
    export_set(navy, "passla-mark-navy")
    export_set(transparent, "passla-icon-mark")
    export_set(transparent, "passla-logo")

    assets = os.path.join(os.path.dirname(OUT_DIR))
    mark_hi = transparent.resize((720, 720), Image.Resampling.LANCZOS)
    for name, bg, mark in (
        ("icon.png", (5, 31, 69, 255), mark_hi),
        ("favicon.png", (5, 31, 69, 255), mark_hi.resize((512, 512), Image.Resampling.LANCZOS)),
        ("splash-icon.png", (240, 238, 233, 255), navy.resize((520, 520), Image.Resampling.LANCZOS)),
    ):
        side = 1024 if name == "icon.png" else 512
        mark_size = mark.size[0]
        canvas = Image.new("RGBA", (side, side), bg)
        canvas.paste(mark, ((side - mark_size) // 2, (side - mark_size) // 2), mark)
        path = os.path.join(assets, name)
        canvas.save(path, "PNG", compress_level=1)
        print("saved", path, canvas.size)

    print("done")


if __name__ == "__main__":
    main()
