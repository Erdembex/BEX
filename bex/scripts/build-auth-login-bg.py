# -*- coding: utf-8 -*-
"""Auth login wall — duvar #051F45, keskin 1x/2x/3x PNG."""
from __future__ import annotations

import os
import numpy as np
from PIL import Image, ImageFilter

SRC = (
    r"C:\Users\ERDEM\.cursor\projects\c-Users-ERDEM-Desktop-BEX-CURSOR\assets"
    r"\c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08"
    r"_images_WhatsApp_Image_2026-09-02_at_17.55.18-1b9b97bb-d310-4f33-811c-822c00580c28.jpg"
)
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "branding")
NAVY = np.array([5, 31, 69], dtype=np.float32)
BASE = (540, 960)  # 9:16 mantıksal boyut


def recolor_wall(arr: np.ndarray) -> np.ndarray:
    h, w, _ = arr.shape
    r = arr[..., 0].astype(np.float32)
    g = arr[..., 1].astype(np.float32)
    b = arr[..., 2].astype(np.float32)
    lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
    ys = np.arange(h)[:, None]
    wall_band = (ys >= h * 0.14) & (ys <= h * 0.46)
    blue_dom = (b > r + 18) & (b > g + 8) & (b > 70) & (r < 130) & (g < 160)
    mask = wall_band & blue_dom
    out = arr.astype(np.float32)
    for i in range(3):
        textured = NAVY[i] * (0.55 + 0.45 * lum)
        out[..., i] = np.where(mask, textured, out[..., i])
    return np.clip(out, 0, 255).astype(np.uint8)


def sharpen_export(im: Image.Image, target: tuple[int, int]) -> Image.Image:
    w, h = im.size
    tw, th = target
    scale = max(tw / w, th / h)
    # Kaynak küçük — önce 3× büyüt, sonra hedefe indir (kenar koruma)
    mid_w = max(w, int(w * scale * 1.5))
    mid_h = max(h, int(h * scale * 1.5))
    mid = im.resize((mid_w, mid_h), Image.Resampling.LANCZOS)
    out = mid.resize(target, Image.Resampling.LANCZOS)
    out = out.filter(ImageFilter.UnsharpMask(radius=1.0, percent=130, threshold=2))
    return out


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    recolored = Image.fromarray(recolor_wall(np.array(im)), "RGB")

    os.makedirs(OUT_DIR, exist_ok=True)
    for mult, suffix in ((1, ""), (2, "@2x"), (3, "@3x")):
        target = (BASE[0] * mult, BASE[1] * mult)
        out = sharpen_export(recolored, target)
        path = os.path.join(OUT_DIR, f"auth-login-wall{suffix}.png")
        out.save(path, "PNG", compress_level=1)
        print("saved", path, out.size)


if __name__ == "__main__":
    main()
