"""Passla ana yuz gorseli — safir/lila/beyaz palet."""
from __future__ import annotations

import math
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
OUT = os.path.join(os.path.expanduser("~"), "Desktop", "passla-ana-yuz.png")
LOGO = os.path.join(os.path.expanduser("~"), "Desktop", "passla-logo.png")

SAPPHIRE = (5, 31, 69)
SLATE = (26, 51, 88)
LILAC = (242, 229, 255)
WHITE = (240, 238, 233)
MUTED = (142, 127, 168)


def lerp(a, b, t):
    return int(a + (b - a) * t)


def gradient_bg() -> Image.Image:
    arr = np.zeros((H, W, 3), dtype=np.uint8)
    for y in range(H):
        t = y / (H - 1)
        arr[y, :, 0] = lerp(SAPPHIRE[0], SLATE[0], t * 0.55)
        arr[y, :, 1] = lerp(SAPPHIRE[1], SLATE[1], t * 0.55)
        arr[y, :, 2] = lerp(SAPPHIRE[2], SLATE[2], t * 0.55)
    img = Image.fromarray(arr)
    draw = ImageDraw.Draw(img, "RGBA")
    # lilac glow orbs
    for cx, cy, r, alpha in [(820, 280, 220, 28), (180, 620, 180, 22), (900, 1200, 260, 18)]:
        for i in range(r, 0, -4):
            a = int(alpha * (1 - i / r))
            draw.ellipse((cx - i, cy - i, cx + i, cy + i), fill=(*LILAC, a))
    return img


def rounded_rect(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def main():
    img = gradient_bg()
    draw = ImageDraw.Draw(img)

    try:
        font_lg = ImageFont.truetype("arialbd.ttf", 52)
        font_md = ImageFont.truetype("arial.ttf", 34)
        font_sm = ImageFont.truetype("arial.ttf", 26)
        font_xs = ImageFont.truetype("arial.ttf", 22)
    except OSError:
        font_lg = font_md = font_sm = font_xs = ImageFont.load_default()

    # phone frame hint
    margin = 48
    rounded_rect(draw, (margin, margin, W - margin, H - margin), 48, fill=None, outline=(*MUTED, 120), width=2)

    # logo
    if os.path.exists(LOGO):
        logo = Image.open(LOGO).convert("RGBA")
        lw = 720
        lh = int(logo.height * (lw / logo.width))
        logo = logo.resize((lw, lh), Image.Resampling.LANCZOS)
        img.paste(logo, ((W - lw) // 2, 200), logo if logo.mode == "RGBA" else None)

    draw.text((W // 2, 430), "Görev yap · Kazan · Takas et", fill=WHITE, font=font_sm, anchor="mm")

    # mock home cards
    card_x1, card_x2 = 72, W // 2 + 16
    card_y = 520
    card_w, card_h = W // 2 - 88, 200

    for i, (title, sub, accent) in enumerate(
        [
            ("Keşfet", "Yakındaki görevler", LILAC),
            ("Takas", "Kupon pazarı", MUTED),
            ("Cüzdan", "Kuponların", WHITE),
            ("Profil", "Hesabın", LILAC),
        ]
    ):
        col = i % 2
        row = i // 2
        x = card_x1 if col == 0 else card_x2
        y = card_y + row * (card_h + 24)
        rounded_rect(draw, (x, y, x + card_w, y + card_h), 24, fill=SLATE, outline=(*MUTED, 80), width=1)
        draw.rounded_rectangle((x + 24, y + 24, x + 56, y + 56), radius=10, fill=accent)
        draw.text((x + 72, y + 28), title, fill=WHITE, font=font_md)
        draw.text((x + 24, y + 92), sub, fill=MUTED, font=font_xs)

    # featured task card
    fy = 980
    rounded_rect(draw, (72, fy, W - 72, fy + 280), 28, fill=(*SLATE, 255), outline=(*LILAC, 90), width=2)
    draw.text((108, fy + 36), "Öne çıkan görev", fill=LILAC, font=font_xs)
    draw.text((108, fy + 78), "Kafe içi fotoğraf çekimi", fill=WHITE, font=font_lg)
    draw.text((108, fy + 148), "Ödül: 2x kahve kuponu", fill=MUTED, font=font_sm)
    rounded_rect(draw, (108, fy + 200, 340, fy + 252), 16, fill=LILAC)
    draw.text((224, fy + 226), "Başvur", fill=SAPPHIRE, font=font_sm, anchor="mm")

    # bottom tab mock
    ty = H - 200
    rounded_rect(draw, (72, ty, W - 72, ty + 96), 24, fill=SLATE, outline=(*MUTED, 60), width=1)
    tabs = ["Ana", "Görev", "Mesaj", "Profil"]
    step = (W - 144) // len(tabs)
    for i, tab in enumerate(tabs):
        cx = 72 + step * i + step // 2
        color = LILAC if i == 0 else MUTED
        draw.ellipse((cx - 6, ty + 22, cx + 6, ty + 34), fill=color)
        draw.text((cx, ty + 58), tab, fill=color, font=font_xs, anchor="mm")

    # palette strip
    py = H - 340
    colors = [
        ("Safir", SAPPHIRE),
        ("Lila", LILAC),
        ("Beyaz", WHITE),
        ("Slate", SLATE),
        ("Muted", MUTED),
    ]
    sw = (W - 144) // len(colors)
    for i, (name, col) in enumerate(colors):
        x = 72 + i * sw
        rounded_rect(draw, (x, py, x + sw - 12, py + 56), 12, fill=col, outline=(*WHITE, 40), width=1)
        draw.text((x + (sw - 12) // 2, py + 72), name, fill=MUTED, font=font_xs, anchor="mm")

    img.convert("RGB").save(OUT, "PNG", optimize=True)
    print("Saved", OUT)


if __name__ == "__main__":
    main()
