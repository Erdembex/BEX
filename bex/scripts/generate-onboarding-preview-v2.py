# -*- coding: utf-8 -*-
"""Onboarding 3 slayt — illüstrasyon + doğru metin, masaüstü."""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(__file__))
MARK = os.path.join(ROOT, "assets", "branding", "passla-mark-white@3x.png")
FONT_BOLD = os.path.join(ROOT, "assets", "fonts", "Inter_700Bold.ttf")
FONT_MED = os.path.join(ROOT, "assets", "fonts", "Inter_500Medium.ttf")
FONT_REG = os.path.join(ROOT, "assets", "fonts", "Inter_400Regular.ttf")
OUT = os.path.join(os.path.expanduser("~"), "Desktop", "Passla-Onboarding-Yetiskin-v3.png")

ARTS = [
    r"C:\Users\ERDEM\.cursor\projects\c-Users-ERDEM-Desktop-BEX-CURSOR\assets\onboard-a1d.png",
    r"C:\Users\ERDEM\.cursor\projects\c-Users-ERDEM-Desktop-BEX-CURSOR\assets\onboard-a2.png",
    r"C:\Users\ERDEM\.cursor\projects\c-Users-ERDEM-Desktop-BEX-CURSOR\assets\onboard-a3.png",
]

NAVY = (5, 31, 69)
NAVY_DEEP = (2, 14, 36)
GOLD = (196, 160, 84)
GOLD_VIVID = (231, 198, 99)
TEXT = (240, 238, 233)
MUTED = (168, 174, 186)

PW, PH = 390, 844
PAD = 56
GAP = 40
SCALE = 2
INNER = 10
R = 44

SLIDES = [
    {
        "title": "Yakındaki işletmeleri\nkeşfet",
        "body": "Çevrendeki işletmelerin görevlerine bak. Tasarım, içerik veya sosyal medya karşılığında onların hizmetini al.",
    },
    {
        "title": "Görevi sen yap,\nhizmeti onlar sunsun",
        "body": "Beğendiğin göreve başvur, teslimini yükle. Onay sonrası dijital kupon cüzdanına düşer — nakit değil, işletmenin kendi hizmeti.",
    },
    {
        "title": "QR ile git,\nhizmeti al",
        "body": "İşletmeye git, QR kodu göster, hizmetini kullan. Para transferi yok — sadece beceri takası.",
    },
]


def fnt(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def wrap(draw: ImageDraw.ImageDraw, text: str, font, max_w: int) -> str:
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return "\n".join(lines)


def crop_art(path: str) -> Image.Image:
    im = Image.open(path).convert("RGB")
    w, h = im.size
    # keep upper 62% — illustration zone
    top = int(h * 0.02)
    bot = int(h * 0.68)
    im = im.crop((0, top, w, bot))
    im = ImageEnhance.Color(im).enhance(1.04)
    return im


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius, fill=255)
    return m


def draw_phone(canvas: Image.Image, ox: int, oy: int, art: Image.Image, slide: dict, index: int) -> None:
    d = ImageDraw.Draw(canvas)
    # outer bezel
    d.rounded_rectangle((ox, oy, ox + PW, oy + PH), R, fill=(8, 10, 16))
    inner = (ox + INNER, oy + INNER, ox + PW - INNER, oy + PH - INNER)
    iw, ih = PW - INNER * 2, PH - INNER * 2

    # navy fill
    screen = Image.new("RGB", (iw, ih), NAVY)
    # art fitted to top
    target_h = int(ih * 0.52)
    art_r = art.resize((iw, target_h), Image.Resampling.LANCZOS)
    # fade art into navy at bottom
    faded = art_r.convert("RGBA")
    fade = Image.new("L", (iw, target_h), 255)
    fd = ImageDraw.Draw(fade)
    for y in range(target_h - 90, target_h):
        a = int(255 * (1 - (y - (target_h - 90)) / 90))
        fd.line([(0, y), (iw, y)], fill=a)
    faded.putalpha(fade)
    screen_rgba = screen.convert("RGBA")
    screen_rgba.paste(faded, (0, 0), faded)
    screen = screen_rgba.convert("RGB")

    mask = rounded_mask((iw, ih), 34)
    canvas.paste(screen, (ox + INNER, oy + INNER), mask)

    # header
    mark = Image.open(MARK).convert("RGBA").resize((34, 34), Image.Resampling.LANCZOS)
    hx, hy = ox + INNER + 18, oy + INNER + 18
    canvas.paste(mark, (hx, hy + 2), mark)
    d = ImageDraw.Draw(canvas)
    d.text((hx + 42, hy + 4), "PASSLA", font=fnt(FONT_BOLD, 15), fill=TEXT)
    d.text((hx + 42, hy + 24), "GÖREV YAP  ·  HİZMET AL", font=fnt(FONT_MED, 8), fill=GOLD)

    # text block
    tx = ox + INNER + 22
    ty = oy + INNER + int(ih * 0.54)
    d.multiline_text((tx, ty), slide["title"], font=fnt(FONT_BOLD, 24), fill=TEXT, spacing=3)
    body = wrap(d, slide["body"], fnt(FONT_REG, 13), iw - 48)
    d.multiline_text((tx, ty + 78), body, font=fnt(FONT_REG, 13), fill=MUTED, spacing=4)

    # footer
    dots_y = oy + PH - 108
    start = ox + PW // 2 - 30
    for i in range(3):
        x = start + i * 22
        if i == index:
            d.rounded_rectangle((x, dots_y, x + 18, dots_y + 7), 4, fill=GOLD)
        else:
            d.ellipse((x + 5, dots_y, x + 13, dots_y + 8), fill=(72, 84, 100))

    d.text((ox + INNER + 22, oy + PH - 72), "Atla", font=fnt(FONT_MED, 14), fill=MUTED)

    last = index == 2
    if last:
        bx0, by0 = ox + PW - 150, oy + PH - 86
        d.rounded_rectangle((bx0, by0, ox + PW - INNER - 16, by0 + 42), 21, fill=GOLD_VIVID)
        tw = d.textlength("Başla", font=fnt(FONT_BOLD, 15))
        d.text((bx0 + (118 - tw) / 2, by0 + 11), "Başla", font=fnt(FONT_BOLD, 15), fill=NAVY)
    else:
        cx, cy = ox + PW - 58, oy + PH - 64
        d.ellipse((cx - 24, cy - 24, cx + 24, cy + 24), fill=GOLD_VIVID)
        d.polygon([(cx - 6, cy - 10), (cx - 6, cy + 10), (cx + 12, cy)], fill=NAVY)

    # notch
    d.rounded_rectangle((ox + PW // 2 - 46, oy + 16, ox + PW // 2 + 46, oy + 30), 8, fill=(6, 8, 12))


def main() -> None:
    W = PAD * 2 + PW * 3 + GAP * 2
    H = PAD * 2 + PH + 86
    canvas = Image.new("RGB", (W, H), NAVY_DEEP)
    # subtle vignette
    overlay = Image.new("RGB", (W, H), (10, 16, 28))
    canvas = Image.blend(canvas, overlay, 0.15)
    d = ImageDraw.Draw(canvas)
    d.text((PAD, 22), "PASSLA", font=fnt(FONT_BOLD, 20), fill=TEXT)
    d.text((PAD + 108, 28), "Tanıtım ekranı", font=fnt(FONT_MED, 14), fill=GOLD)

    arts = [crop_art(p) for p in ARTS]
    for i, (art, slide) in enumerate(zip(arts, SLIDES)):
        ox = PAD + i * (PW + GAP)
        oy = PAD + 52
        draw_phone(canvas, ox, oy, art, slide, i)

    big = canvas.resize((W * SCALE, H * SCALE), Image.Resampling.LANCZOS)
    big = big.filter(ImageFilter.UnsharpMask(radius=0.8, percent=80, threshold=2))
    big.save(OUT, "PNG")
    print("saved", OUT, big.size)


if __name__ == "__main__":
    main()
