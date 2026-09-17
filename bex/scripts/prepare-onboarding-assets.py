# -*- coding: utf-8 -*-
from __future__ import annotations

import os
from PIL import Image, ImageDraw

ASSETS = r"C:\Users\ERDEM\.cursor\projects\c-Users-ERDEM-Desktop-BEX-CURSOR\assets"
OUT_DIR = r"c:\Users\ERDEM\Desktop\BEX_CURSOR\bex\assets\branding\onboarding"
os.makedirs(OUT_DIR, exist_ok=True)

NAVY = (2, 27, 55)
SCREEN = (24, 28, 34)
PAPER = (245, 236, 214)
FRAME = (40, 32, 26)


def crop_scene(im: Image.Image) -> Image.Image:
    w, h = im.size
    return im.crop((0, 0, w, int(h * 0.62))).resize((1080, 720), Image.Resampling.LANCZOS)


def clean_slide1() -> Image.Image:
    raw = Image.open(os.path.join(ASSETS, "onboard-a1b.png")).convert("RGB")
    im = crop_scene(raw)
    d = ImageDraw.Draw(im)

    # poster — tam cerceve, yazisiz
    d.rectangle((88, 38, 278, 318), fill=PAPER)
    d.rectangle((88, 38, 278, 318), outline=FRAME, width=3)

    # makas
    d.ellipse((568, 255, 698, 438), fill=NAVY)
    # canta
    d.rounded_rectangle((688, 305, 890, 455), 12, fill=NAVY)

    # laptop ekrani — haritasiz koyu kapak
    d.rounded_rectangle((518, 498, 758, 628), 8, fill=SCREEN)

    return im


def main() -> None:
    clean_slide1().save(os.path.join(OUT_DIR, "slide-1.png"), "PNG")
    for i, name in ((2, "onboard-a2.png"), (3, "onboard-a3.png")):
        im = Image.open(os.path.join(ASSETS, name)).convert("RGB")
        crop_scene(im).save(os.path.join(OUT_DIR, f"slide-{i}.png"), "PNG")
    raw = os.path.join(OUT_DIR, "_slide1-raw.png")
    if os.path.exists(raw):
        os.remove(raw)
    print("saved", OUT_DIR)


if __name__ == "__main__":
    main()
