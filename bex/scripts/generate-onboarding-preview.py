# -*- coding: utf-8 -*-
"""Onboarding 3 slayt — duzeltilmis ornek (masaüstü)."""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(__file__))
MARK = os.path.join(ROOT, "assets", "branding", "passla-mark-white@3x.png")
FONT_BOLD = os.path.join(ROOT, "assets", "fonts", "Inter_700Bold.ttf")
FONT_MED = os.path.join(ROOT, "assets", "fonts", "Inter_500Medium.ttf")
FONT_REG = os.path.join(ROOT, "assets", "fonts", "Inter_400Regular.ttf")
OUT = os.path.join(os.path.expanduser("~"), "Desktop", "Passla-Onboarding-Ornek.png")

NAVY = (5, 31, 69)
NAVY_DEEP = (3, 20, 48)
GOLD = (196, 160, 84)
GOLD_VIVID = (231, 198, 99)
TEXT = (240, 238, 233)
MUTED = (168, 172, 184)
WHITE = (255, 255, 255)

PW, PH = 390, 844
PAD = 48
GAP = 36
SCALE = 2


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def wrap(draw: ImageDraw.ImageDraw, text: str, fnt, max_w: int) -> str:
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=fnt) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return "\n".join(lines)


def draw_phone_shell(canvas: Image.Image, x: int, y: int) -> None:
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle((x, y, x + PW, y + PH), 42, fill=NAVY_DEEP)
    d.rounded_rectangle((x + 8, y + 8, x + PW - 8, y + PH - 8), 36, fill=NAVY)
    d.rounded_rectangle((x + PW // 2 - 48, y + 18, x + PW // 2 + 48, y + 32), 8, fill=(8, 12, 20))


def draw_header(draw: ImageDraw.ImageDraw, ox: int, oy: int, mark: Image.Image) -> None:
    mx, my = ox + 28, oy + 52
    canvas_mark = mark.resize((36, 36), Image.Resampling.LANCZOS)
    return canvas_mark, mx, my


def paste_header(img: Image.Image, ox: int, oy: int, mark: Image.Image) -> None:
    m = mark.resize((38, 38), Image.Resampling.LANCZOS)
    img.paste(m, (ox + 26, oy + 50), m)
    d = ImageDraw.Draw(img)
    d.text((ox + 72, oy + 56), "PASSLA", font=font(FONT_BOLD, 16), fill=TEXT)
    slogan = "GÖREV YAP  ·  HİZMET AL"
    d.text((ox + 72, oy + 76), slogan, font=font(FONT_MED, 9), fill=GOLD)


def draw_pill(draw, xy, text, fill, text_fill):
    f = font(FONT_MED, 11)
    x0, y0 = xy
    tw = draw.textlength(text, font=f)
    pad_x, pad_y = 10, 6
    draw.rounded_rectangle((x0, y0, x0 + tw + pad_x * 2, y0 + 22), 11, fill=fill)
    draw.text((x0 + pad_x, y0 + 4), text, font=f, fill=text_fill)


def draw_slide1(img: Image.Image, ox: int, oy: int) -> None:
    d = ImageDraw.Draw(img)
    cx, cy = ox + PW // 2, oy + 250

    # laptop
    d.rounded_rectangle((cx - 70, cy - 28, cx + 70, cy + 52), 8, fill=(18, 36, 62), outline=GOLD, width=2)
    d.rectangle((cx - 58, cy - 16, cx + 58, cy + 34), fill=(8, 18, 40))
    d.rounded_rectangle((cx - 86, cy + 52, cx + 86, cy + 64), 4, fill=(28, 46, 72))

    # floating service chips
    draw_pill(d, (ox + 42, oy + 168), "Tasarım", (255, 255, 255, 0), TEXT)
    d.rounded_rectangle((ox + 38, oy + 164, ox + 118, oy + 190), 12, fill=(20, 40, 68), outline=GOLD, width=1)
    d.text((ox + 50, oy + 170), "Tasarım", font=font(FONT_MED, 11), fill=TEXT)

    d.rounded_rectangle((ox + 248, oy + 178, ox + 338, oy + 204), 12, fill=(20, 40, 68), outline=GOLD, width=1)
    d.text((ox + 262, oy + 184), "İçerik", font=font(FONT_MED, 11), fill=TEXT)

    d.rounded_rectangle((ox + 48, oy + 318, ox + 138, oy + 344), 12, fill=(20, 40, 68), outline=GOLD, width=1)
    d.text((ox + 62, oy + 324), "Kahve", font=font(FONT_MED, 11), fill=GOLD_VIVID)

    d.rounded_rectangle((ox + 242, oy + 308, ox + 342, oy + 334), 12, fill=(20, 40, 68), outline=GOLD, width=1)
    d.text((ox + 256, oy + 314), "Tıraş", font=font(FONT_MED, 11), fill=GOLD_VIVID)

    title = "Yakındaki işletmeleri\nkeşfet"
    d.multiline_text((ox + 28, oy + 400), title, font=font(FONT_BOLD, 26), fill=TEXT, spacing=4)
    body = wrap(
        d,
        "Çevrendeki işletmelerin görevlerine bak. Tasarım, içerik veya sosyal medya karşılığında onların hizmetini al.",
        font(FONT_REG, 14),
        PW - 56,
    )
    d.multiline_text((ox + 28, oy + 490), body, font=font(FONT_REG, 14), fill=MUTED, spacing=5)


def draw_slide2(img: Image.Image, ox: int, oy: int) -> None:
    d = ImageDraw.Draw(img)
    cx = ox + PW // 2

    # phone
    d.rounded_rectangle((cx - 38, oy + 168, cx + 38, oy + 318), 14, fill=(18, 36, 62), outline=GOLD, width=2)
    d.rounded_rectangle((cx - 28, oy + 184, cx + 28, oy + 292), 6, fill=(8, 18, 40))
    d.ellipse((cx - 8, oy + 298, cx + 8, oy + 310), outline=GOLD, width=1)

    # check steps
    steps = [("1", "Başvur"), ("2", "Teslim et"), ("3", "Kupon düşer")]
    for i, (n, lab) in enumerate(steps):
        y = oy + 186 + i * 42
        x = ox + 268
        d.ellipse((x, y, x + 26, y + 26), fill=GOLD)
        d.text((x + 8, y + 4), n, font=font(FONT_BOLD, 12), fill=NAVY)
        d.text((x - 78, y + 5), lab, font=font(FONT_MED, 12), fill=TEXT)

    title = "Görevi sen yap,\nhizmeti onlar sunsun"
    d.multiline_text((ox + 28, oy + 380), title, font=font(FONT_BOLD, 24), fill=TEXT, spacing=4)
    body = wrap(
        d,
        "Beğendiğin göreve başvur, teslimini yükle. Onay sonrası dijital kupon cüzdanına düşer — nakit değil, işletmenin kendi hizmeti.",
        font(FONT_REG, 14),
        PW - 56,
    )
    d.multiline_text((ox + 28, oy + 470), body, font=font(FONT_REG, 14), fill=MUTED, spacing=5)


def draw_slide3(img: Image.Image, ox: int, oy: int) -> None:
    d = ImageDraw.Draw(img)
    cx = ox + PW // 2

    # coupon card
    d.rounded_rectangle((cx - 88, oy + 178, cx + 88, oy + 318), 16, fill=(18, 36, 62), outline=GOLD, width=2)
    d.text((cx - 52, oy + 196), "DİJİTAL KUPON", font=font(FONT_MED, 10), fill=GOLD)
    # QR-like grid
    qx, qy = cx - 28, oy + 218
    for r in range(5):
        for c in range(5):
            if (r + c) % 2 == 0 or (r, c) in {(0, 0), (0, 4), (4, 0)}:
                d.rectangle((qx + c * 11, qy + r * 11, qx + c * 11 + 8, qy + r * 11 + 8), fill=TEXT)
    d.text((cx - 70, oy + 284), "İşletmede göster", font=font(FONT_REG, 11), fill=MUTED)

    title = "QR ile git,\nhizmeti al"
    d.multiline_text((ox + 28, oy + 380), title, font=font(FONT_BOLD, 26), fill=TEXT, spacing=4)
    body = wrap(
        d,
        "İşletmeye git, QR kodu göster, hizmetini kullan. Para transferi yok — sadece beceri takası.",
        font(FONT_REG, 14),
        PW - 56,
    )
    d.multiline_text((ox + 28, oy + 470), body, font=font(FONT_REG, 14), fill=MUTED, spacing=5)


def draw_footer(img: Image.Image, ox: int, oy: int, index: int, last: bool) -> None:
    d = ImageDraw.Draw(img)
    # dots
    dots_y = oy + PH - 118
    start_x = ox + PW // 2 - 28
    for i in range(3):
        x = start_x + i * 22
        if i == index:
            d.rounded_rectangle((x, dots_y, x + 18, dots_y + 8), 4, fill=GOLD)
        else:
            d.ellipse((x + 5, dots_y + 1, x + 13, dots_y + 9), fill=(70, 82, 98))

    d.text((ox + 28, oy + PH - 78), "Atla", font=font(FONT_MED, 14), fill=MUTED)

    if last:
        bx0, by0 = ox + PW - 148, oy + PH - 92
        d.rounded_rectangle((bx0, by0, ox + PW - 28, by0 + 44), 22, fill=GOLD)
        tw = d.textlength("Başla", font=font(FONT_BOLD, 15))
        d.text((bx0 + (120 - tw) / 2, by0 + 12), "Başla", font=font(FONT_BOLD, 15), fill=NAVY)
    else:
        d.ellipse((ox + PW - 76, oy + PH - 92, ox + PW - 28, oy + PH - 44), fill=GOLD)
        d.polygon(
            [
                (ox + PW - 58, oy + PH - 78),
                (ox + PW - 58, oy + PH - 58),
                (ox + PW - 42, oy + PH - 68),
            ],
            fill=NAVY,
        )


def main() -> None:
    mark = Image.open(MARK).convert("RGBA")
    W = PAD * 2 + PW * 3 + GAP * 2
    H = PAD * 2 + PH + 70
    canvas = Image.new("RGB", (W, H), (12, 16, 24))
    d = ImageDraw.Draw(canvas)
    d.text((PAD, 18), "Passla onboarding — düzeltilmiş örnek", font=font(FONT_BOLD, 18), fill=TEXT)
    d.text(
        (PAD, 42),
        "Marka, metin, CTA ve hikâye düzeltmeleri · uygulamanın laciverti #051F45",
        font=font(FONT_REG, 12),
        fill=MUTED,
    )

    drawers = [draw_slide1, draw_slide2, draw_slide3]
    for i, drawer in enumerate(drawers):
        ox = PAD + i * (PW + GAP)
        oy = PAD + 56
        draw_phone_shell(canvas, ox, oy)
        paste_header(canvas, ox, oy, mark)
        drawer(canvas, ox, oy)
        draw_footer(canvas, ox, oy, i, last=(i == 2))

    big = canvas.resize((W * SCALE, H * SCALE), Image.Resampling.LANCZOS)
    big.save(OUT, "PNG")
    print("saved", OUT, big.size)


if __name__ == "__main__":
    main()
