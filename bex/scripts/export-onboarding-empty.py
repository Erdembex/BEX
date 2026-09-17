# -*- coding: utf-8 -*-
"""Onboarding gorsel slotlari — bos sablon, masaustu."""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(__file__))
FONT_BOLD = os.path.join(ROOT, "assets", "fonts", "Inter_700Bold.ttf")
FONT_MED = os.path.join(ROOT, "assets", "fonts", "Inter_500Medium.ttf")
FONT_REG = os.path.join(ROOT, "assets", "fonts", "Inter_400Regular.ttf")
MARK = os.path.join(ROOT, "assets", "branding", "passla-mark-white.png")
OUT = os.path.join(os.path.expanduser("~"), "Desktop", "Passla-Onboarding-Bos")

NAVY = (5, 31, 69)
NAVY_DEEP = (3, 18, 42)
GOLD = (196, 160, 84)
TEXT = (240, 238, 233)
MUTED = (150, 156, 168)

# Uygulamadaki art kutusu ~ ekran genisligi x 250pt; export 3x
ART_W, ART_H = 1170, 750

SLIDES = [
    ("slide-1-bos.png", "Slayt 1", "Yakındaki işletmeleri keşfet"),
    ("slide-2-bos.png", "Slayt 2", "Görevi sen yap, hizmeti onlar sunsun"),
    ("slide-3-bos.png", "Slayt 3", "QR ile git, hizmeti al"),
]


def fnt(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def dashed_rect(draw: ImageDraw.ImageDraw, box, color, dash=18, gap=10, width=3):
    x0, y0, x1, y1 = box
    # top/bottom
    x = x0
    while x < x1:
        draw.line([(x, y0), (min(x + dash, x1), y0)], fill=color, width=width)
        draw.line([(x, y1), (min(x + dash, x1), y1)], fill=color, width=width)
        x += dash + gap
    y = y0
    while y < y1:
        draw.line([(x0, y), (x0, min(y + dash, y1))], fill=color, width=width)
        draw.line([(x1, y), (x1, min(y + dash, y1))], fill=color, width=width)
        y += dash + gap


def make_slot(label: str, hint: str) -> Image.Image:
    im = Image.new("RGB", (ART_W, ART_H), NAVY)
    d = ImageDraw.Draw(im)
    pad = 36
    dashed_rect(d, (pad, pad, ART_W - pad, ART_H - pad), GOLD)
    d.text((ART_W // 2, ART_H // 2 - 28), label, font=fnt(FONT_BOLD, 42), fill=TEXT, anchor="mm")
    d.text((ART_W // 2, ART_H // 2 + 22), hint, font=fnt(FONT_REG, 22), fill=MUTED, anchor="mm")
    d.text(
        (ART_W // 2, ART_H - 70),
        f"{ART_W} × {ART_H} px  ·  görseli bu alana koy",
        font=fnt(FONT_MED, 18),
        fill=GOLD,
        anchor="mm",
    )
    return im


def make_phone_preview() -> Image.Image:
    pw, ph = 390, 844
    gap, pad = 36, 48
    w = pad * 2 + pw * 3 + gap * 2
    h = pad * 2 + ph + 70
    canvas = Image.new("RGB", (w, h), NAVY_DEEP)
    d = ImageDraw.Draw(canvas)
    d.text((pad, 18), "PASSLA — görsel slotları boş", font=fnt(FONT_BOLD, 20), fill=TEXT)
    d.text((pad, 44), "Her slayt PNG’sini aynı isimle değiştirip gönder", font=fnt(FONT_REG, 13), fill=MUTED)

    mark = None
    if os.path.exists(MARK):
        mark = Image.open(MARK).convert("RGBA").resize((32, 32), Image.Resampling.LANCZOS)

    titles = [s[2].replace(", ", ",\n") for s in SLIDES]
    for i, title in enumerate(titles):
        ox = pad + i * (pw + gap)
        oy = pad + 52
        d.rounded_rectangle((ox, oy, ox + pw, oy + ph), 40, fill=NAVY)
        if mark:
            canvas.paste(mark, (ox + 22, oy + 22), mark)
        d.text((ox + 62, oy + 24), "PASSLA", font=fnt(FONT_BOLD, 14), fill=TEXT)
        d.text((ox + 62, oy + 42), "GÖREV YAP  ·  HİZMET AL", font=fnt(FONT_MED, 8), fill=GOLD)

        ax0, ay0 = ox + 18, oy + 72
        ax1, ay1 = ox + pw - 18, oy + 318
        d.rounded_rectangle((ax0, ay0, ax1, ay1), 16, fill=(3, 18, 42))
        dashed_rect(d, (ax0 + 8, ay0 + 8, ax1 - 8, ay1 - 8), GOLD, dash=12, gap=8, width=2)
        d.text(((ax0 + ax1) // 2, (ay0 + ay1) // 2), f"Slayt {i + 1}", font=fnt(FONT_BOLD, 18), fill=TEXT, anchor="mm")

        d.multiline_text((ox + 22, oy + 340), title, font=fnt(FONT_BOLD, 18), fill=TEXT, spacing=3)

    big = canvas.resize((w * 2, h * 2), Image.Resampling.LANCZOS)
    return big


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for fname, label, hint in SLIDES:
        make_slot(label, hint).save(os.path.join(OUT, fname), "PNG")
        print("saved", fname)
    make_phone_preview().save(os.path.join(OUT, "00-duzen-bos.png"), "PNG")
    print("saved 00-duzen-bos.png")
    print(OUT)


if __name__ == "__main__":
    main()
