# -*- coding: utf-8 -*-
"""3 onboarding slaytını Play Store uyumlu 9:16 ekran görüntüsü olarak dışa aktar."""
from __future__ import annotations

import os
from PIL import Image, ImageEnhance, ImageFilter, ImageStat

SOURCE = os.path.join(os.path.expanduser("~"), "Desktop", "Passla-Onboarding-Guzel.png")
OUT_W, OUT_H = 1080, 1920  # 9:16
DESKTOP = os.path.join(os.path.expanduser("~"), "Desktop")
NAMES = [
    "Passla-Onboarding-Slayt-1",
    "Passla-Onboarding-Slayt-2",
    "Passla-Onboarding-Slayt-3",
]


def sample_navy(panel: Image.Image) -> tuple[int, int, int]:
    px = panel.load()
    samples = [px[x, y] for x in (4, 8, 12) for y in (4, 8, 12)]
    r = sum(c[0] for c in samples) // len(samples)
    g = sum(c[1] for c in samples) // len(samples)
    b = sum(c[2] for c in samples) // len(samples)
    return (r, g, b)


def enhance(im: Image.Image) -> Image.Image:
    im = ImageEnhance.Contrast(im).enhance(1.05)
    im = ImageEnhance.Color(im).enhance(1.03)
    im = ImageEnhance.Sharpness(im).enhance(1.25)
    return im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=120, threshold=2))


def panel_to_screenshot(panel: Image.Image) -> Image.Image:
    bg = sample_navy(panel)
    canvas = Image.new("RGB", (OUT_W, OUT_H), bg)

    pw, ph = panel.size
    scale = min(OUT_W / pw, OUT_H / ph)
    nw, nh = int(pw * scale), int(ph * scale)
    resized = enhance(panel.resize((nw, nh), Image.Resampling.LANCZOS))

    x = (OUT_W - nw) // 2
    y = (OUT_H - nh) // 2
    canvas.paste(resized, (x, y))
    return canvas


def save_with_limit(im: Image.Image, path: str, fmt: str) -> None:
    if fmt == "PNG":
        im.save(path, "PNG", optimize=True)
        return

    for quality in (95, 90, 85, 80):
        im.save(path, "JPEG", quality=quality, optimize=True, progressive=True)
        if os.path.getsize(path) <= 8 * 1024 * 1024:
            return


def main() -> None:
    if not os.path.isfile(SOURCE):
        raise SystemExit(f"Kaynak yok: {SOURCE}")

    composite = Image.open(SOURCE).convert("RGB")
    w, h = composite.size
    panel_w = w // 3

    for i, name in enumerate(NAMES):
        x0 = i * panel_w
        x1 = x0 + panel_w if i < 2 else w
        panel = composite.crop((x0, 0, x1, h))
        shot = panel_to_screenshot(panel)

        png_path = os.path.join(DESKTOP, f"{name}.png")
        jpg_path = os.path.join(DESKTOP, f"{name}.jpg")
        save_with_limit(shot, png_path, "PNG")
        save_with_limit(shot, jpg_path, "JPEG")

        png_mb = os.path.getsize(png_path) / (1024 * 1024)
        jpg_mb = os.path.getsize(jpg_path) / (1024 * 1024)
        print(f"{name}: {shot.size} | PNG {png_mb:.2f} MB | JPEG {jpg_mb:.2f} MB")

    print("done ->", DESKTOP)


if __name__ == "__main__":
    main()
