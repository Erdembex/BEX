# -*- coding: utf-8 -*-
"""Yüksek çözünürlüklü onboarding slayt görselleri — masaüstü kaynak."""
from __future__ import annotations

import os
from PIL import Image, ImageEnhance, ImageFilter

SOURCE = os.path.join(os.path.expanduser("~"), "Desktop", "Passla-Onboarding-Guzel.png")
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "branding", "onboarding")
TARGET_W, TARGET_H = 2100, 1500  # ~3x telefon kart alanı


def sharpen(im: Image.Image) -> Image.Image:
    im = ImageEnhance.Contrast(im).enhance(1.06)
    im = ImageEnhance.Color(im).enhance(1.04)
    im = ImageEnhance.Sharpness(im).enhance(1.35)
    return im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=130, threshold=2))


def extract_slide(composite: Image.Image, index: int) -> Image.Image:
    w, h = composite.size
    panel_w = w // 3
    x0 = index * panel_w
    x1 = x0 + panel_w
    panel = composite.crop((x0, 0, x1, h))

    # İllüstrasyon kartı: üst marka bandının altı, metin bloğunun üstü
    top = int(h * 0.11)
    bottom = int(h * 0.54)
    art = panel.crop((0, top, panel_w, bottom))

    art = art.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS)
    return sharpen(art)


def main() -> None:
    if not os.path.isfile(SOURCE):
        raise SystemExit(f"Kaynak bulunamadı: {SOURCE}")

    os.makedirs(OUT_DIR, exist_ok=True)
    composite = Image.open(SOURCE).convert("RGB")

    for i in range(3):
        slide = extract_slide(composite, i)
        out = os.path.join(OUT_DIR, f"slide-{i + 1}.png")
        slide.save(out, "PNG", optimize=True)
        print(f"saved {out} {slide.size}")

    print("done")


if __name__ == "__main__":
    main()
