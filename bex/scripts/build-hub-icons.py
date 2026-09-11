# -*- coding: utf-8 -*-
"""Hub graffiti ikonları — beyaz arka plan kaldır, 1x/2x/3x PNG."""
from __future__ import annotations

import os
from collections import deque

import numpy as np
from PIL import Image

ASSETS_CURSOR = (
    r"C:\Users\ERDEM\.cursor\projects\c-Users-ERDEM-Desktop-BEX-CURSOR\assets"
)
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "icons", "hub")
BASE = 64  # mantıksal px (ekranda ~32–36)

ICONS: dict[str, str] = {
    "tasks": (
        "c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08"
        "_images_image-2a7303bf-08b2-4f8b-bc53-af2c1a85267c.png"
    ),
    "trade": (
        "c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08"
        "_images_image-ee78c873-bc72-41e2-bf1d-1c11e253c566.png"
    ),
    "wallet": (
        "c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08"
        "_images_image-c25f2f9f-1ecf-486d-a3ef-43b099fa709c.png"
    ),
    "messages": (
        "c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08"
        "_images_image-4aa20a25-8844-4659-b65b-062fea8a30d0.png"
    ),
    "applications": (
        "c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08"
        "_images_image-ba032d78-9f42-4f76-8a20-77ec9a357a6b.png"
    ),
    "profile": (
        "c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08"
        "_images_image-f029999d-8222-4c17-add9-d59dd8b12c4b.png"
    ),
    "map": (
        "c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08"
        "_images_image-c878708f-bb5a-4e1d-ac8a-6da216530bdf.png"
    ),
    "settings": (
        "c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08"
        "_images_image-f2c03d75-92bc-4c53-a6ee-fd32f551248d.png"
    ),
}


def remove_white_bg(im: Image.Image) -> Image.Image:
    rgba = im.convert("RGBA")
    arr = np.array(rgba)
    h, w = arr.shape[:2]
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    white = (r > 235) & (g > 235) & (b > 235)

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
        if not white[y, x]:
            continue
        visited[y, x] = True
        q.extend([(y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)])

    alpha = arr[..., 3].copy()
    alpha[visited] = 0
    arr[..., 3] = alpha
    return Image.fromarray(arr, "RGBA")


def trim_square(im: Image.Image, pad_ratio: float = 0.06) -> Image.Image:
    arr = np.array(im)
    ys, xs = np.where(arr[..., 3] > 8)
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


def export_sizes(im: Image.Image, name: str) -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for mult, suffix in ((1, ""), (2, "@2x"), (3, "@3x")):
        size = BASE * mult
        out = im.resize((size, size), Image.Resampling.LANCZOS)
        path = os.path.join(OUT_DIR, f"hub-{name}{suffix}.png")
        out.save(path, "PNG", compress_level=1)
        print("saved", path, out.size)


def main() -> None:
    for name, fname in ICONS.items():
        src = os.path.join(ASSETS_CURSOR, fname)
        im = Image.open(src).convert("RGB")
        transparent = remove_white_bg(im)
        square = trim_square(transparent)
        export_sizes(square, name)


if __name__ == "__main__":
    main()
