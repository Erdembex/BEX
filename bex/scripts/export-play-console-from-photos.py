# -*- coding: utf-8 -*-
"""WhatsApp ekran görüntülerinden Play Console paketi üret."""
from __future__ import annotations

import os
from PIL import Image, ImageEnhance, ImageFilter

ROOT = os.path.join(
    os.path.expanduser("~"),
    ".cursor",
    "projects",
    "c-Users-ERDEM-Desktop-BEX-CURSOR",
    "assets",
)
HOME_SRC = os.path.join(
    ROOT,
    "c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08_images_WhatsApp_Image_2026-09-17_at_20.00.34__1_-f0dc8143-9729-4fec-8f61-a4a627ed82f2.jpg",
)
LOGIN_SRC = os.path.join(
    ROOT,
    "c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08_images_WhatsApp_Image_2026-09-17_at_20.00.34-bd5c3eb7-32a7-4a89-ba25-602957eb3e33.jpg",
)

DESKTOP = os.path.join(os.path.expanduser("~"), "Desktop", "Passla-Play-Console-Gorseller")
REPO = os.path.join(os.path.dirname(os.path.dirname(__file__)), "store-listing", "screenshots")

NAVY = (5, 31, 69)
CREAM = (245, 240, 232)


def sharpen(im: Image.Image) -> Image.Image:
    im = ImageEnhance.Sharpness(im).enhance(1.2)
    return im.filter(ImageFilter.UnsharpMask(radius=0.8, percent=110, threshold=3))


def fit_portrait(im: Image.Image, out_w: int, out_h: int, bg: tuple[int, int, int]) -> Image.Image:
    im = im.convert("RGB")
    im = sharpen(im)
    src_w, src_h = im.size
    scale = min(out_w / src_w, out_h / src_h)
    nw, nh = int(src_w * scale), int(src_h * scale)
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (out_w, out_h), bg)
    x = (out_w - nw) // 2
    y = (out_h - nh) // 2
    canvas.paste(resized, (x, y))
    return canvas


def fit_landscape_phone(im: Image.Image, out_w: int, out_h: int, bg: tuple[int, int, int]) -> Image.Image:
    """Chromebook / yatay tablet — telefon UI ortada."""
    im = im.convert("RGB")
    im = sharpen(im)
    target_h = int(out_h * 0.88)
    src_w, src_h = im.size
    scale = target_h / src_h
    nw, nh = int(src_w * scale), int(src_h * scale)
    if nw > int(out_w * 0.42):
        scale = (out_w * 0.42) / src_w
        nw, nh = int(src_w * scale), int(src_h * scale)
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (out_w, out_h), bg)
    x = (out_w - nw) // 2
    y = (out_h - nh) // 2
    canvas.paste(resized, (x, y))
    return canvas


def save_jpg_png(im: Image.Image, base_path: str) -> None:
    png = base_path + ".png"
    jpg = base_path + ".jpg"
    im.save(png, "PNG", optimize=True)
    im.save(jpg, "JPEG", quality=92, optimize=True, progressive=True)


def main() -> None:
    os.makedirs(DESKTOP, exist_ok=True)
    os.makedirs(REPO, exist_ok=True)

    home = Image.open(HOME_SRC)
    login = Image.open(LOGIN_SRC)

    specs = [
        ("telefon-01-ana-sayfa", home, 1080, 1920, CREAM),
        ("telefon-02-giris", login, 1080, 1920, NAVY),
        ("tablet-7-01-ana-sayfa", home, 1080, 1920, CREAM),
        ("tablet-7-02-giris", login, 1080, 1920, NAVY),
        ("tablet-10-01-ana-sayfa", home, 1200, 1920, CREAM),
        ("tablet-10-02-giris", login, 1200, 1920, NAVY),
    ]

    for name, src, w, h, bg in specs:
        out = fit_portrait(src, w, h, bg)
        save_jpg_png(out, os.path.join(DESKTOP, name))
        print("saved", name, out.size)

    chrome = [
        ("chromebook-01-ana-sayfa", home, CREAM),
        ("chromebook-02-giris", login, NAVY),
        ("android-xr-01-ana-sayfa", home, CREAM),
        ("android-xr-02-giris", login, NAVY),
    ]
    for name, src, bg in chrome:
        out = fit_landscape_phone(src, 1920, 1080, bg)
        save_jpg_png(out, os.path.join(DESKTOP, name))
        print("saved", name, out.size)

    # Repo kopyası (telefon + hub adı)
    hub = fit_portrait(home, 1080, 1920, CREAM)
    hub.save(os.path.join(REPO, "01_hub.png"), "PNG", optimize=True)
    fit_portrait(login, 1080, 1920, NAVY).save(
        os.path.join(REPO, "00_giris.png"), "PNG", optimize=True
    )

    guide = os.path.join(DESKTOP, "YUKLEME-KILAVUZU.txt")
    with open(guide, "w", encoding="utf-8") as f:
        f.write(
            """Passla — Play Console görsel yükleme

TELEFON (zorunlu, min 2)
  telefon-01-ana-sayfa.png
  telefon-02-giris.png

7\" TABLET
  tablet-7-01-ana-sayfa.png
  tablet-7-02-giris.png

10\" TABLET
  tablet-10-01-ana-sayfa.png
  tablet-10-02-giris.png

CHROMEBOOK (yatay)
  chromebook-01-ana-sayfa.png
  chromebook-02-giris.png

ANDROID XR (yatay)
  android-xr-01-ana-sayfa.png
  android-xr-02-giris.png

Hepsi 9:16 (telefon/tablet) veya 16:9 (Chromebook/XR), 8 MB altı.

Sonraki adımlar: Desktop\\Passla-Play-Console-Gorseller\\SONRAKI-ADIMLAR.md
"""
        )
    print("done ->", DESKTOP)


if __name__ == "__main__":
    main()
