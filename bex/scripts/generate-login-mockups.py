# -*- coding: utf-8 -*-
"""Passla login ekrani — 5 masaustu mockup varyanti."""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(__file__))
BG_PATH = os.path.join(ROOT, "assets", "branding", "auth-login-wall.png")
FONT_BOLD = os.path.join(ROOT, "assets", "fonts", "Inter_700Bold.ttf")
FONT_MED = os.path.join(ROOT, "assets", "fonts", "Inter_500Medium.ttf")
FONT_REG = os.path.join(ROOT, "assets", "fonts", "Inter_400Regular.ttf")
OUT_DIR = os.path.join(os.path.expanduser("~"), "Desktop", "Passla-Login-Mockups")

W, H = 390, 844
SCALE = 2

NAVY = (5, 31, 69)
GOLD = (231, 198, 99)
TEXT = (240, 238, 233)
MUTED = (180, 178, 173)
INPUT_BG = (255, 255, 255, 28)
INPUT_BORDER = (255, 255, 255, 70)


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def rounded_rect(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    radius: int,
    fill=None,
    outline=None,
    width: int = 1,
) -> None:
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def paste_bg() -> Image.Image:
    bg = Image.open(BG_PATH).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    return bg


def gradient_bottom(base: Image.Image, strength: float = 0.75) -> Image.Image:
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for y in range(H // 3, H):
        t = (y - H // 3) / (H - H // 3)
        a = int(255 * strength * (t**1.4))
        draw.line([(0, y), (W, y)], fill=(5, 31, 69, a))
    return Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")


def draw_field(
    canvas: Image.Image,
    draw: ImageDraw.ImageDraw,
    y: int,
    label: str,
    value: str = "",
    icon: str = "@",
) -> int:
    h = 52
    x0, x1 = 28, W - 28
    rounded_rect(draw, (x0, y, x1, y + h), 14, fill=(255, 255, 255, 18), outline=(255, 255, 255, 55), width=1)
    f = load_font(FONT_REG, 14)
    draw.text((x0 + 14, y + 16), value or label, font=f, fill=MUTED if not value else TEXT)
    draw.text((x1 - 28, y + 16), icon, font=f, fill=MUTED)
    return y + h + 12


def draw_button(draw: ImageDraw.ImageDraw, y: int, text: str = "Giriş Yap") -> None:
    x0, x1 = 28, W - 28
    rounded_rect(draw, (x0, y, x1, y + 52), 16, fill=GOLD)
    fb = load_font(FONT_BOLD, 16)
    tw = draw.textlength(text, font=fb)
    draw.text(((W - tw) / 2, y + 16), text, font=fb, fill=NAVY)


def draw_header(draw: ImageDraw.ImageDraw, y: int, title: str, subtitle: str) -> int:
    ft = load_font(FONT_BOLD, 24)
    fs = load_font(FONT_REG, 14)
    draw.text((28, y), title, font=ft, fill=TEXT)
    draw.multiline_text((28, y + 34), subtitle, font=fs, fill=MUTED, spacing=4)
    return y + 88


def draw_options(draw: ImageDraw.ImageDraw, y: int) -> int:
    f = load_font(FONT_REG, 13)
    rounded_rect(draw, (28, y, 48, y + 20), 4, outline=(255, 255, 255, 90), width=1)
    rounded_rect(draw, (30, y + 2, 46, y + 18), 3, fill=GOLD)
    draw.text((34, y + 2), "✓", font=f, fill=NAVY)
    draw.text((56, y + 1), "Beni hatırla", font=f, fill=TEXT)
    fp = load_font(FONT_MED, 13)
    draw.text((W - 28 - draw.textlength("Şifremi unuttum", font=fp), y + 1), "Şifremi unuttum", font=fp, fill=GOLD)
    return y + 34


def draw_footer(draw: ImageDraw.ImageDraw, y: int) -> None:
    f = load_font(FONT_REG, 14)
    fb = load_font(FONT_BOLD, 14)
    t1 = "Hesabın yok mu? "
    t2 = "Kayıt Ol"
    w1 = draw.textlength(t1, font=f)
    total = w1 + draw.textlength(t2, font=fb)
    x = (W - total) / 2
    draw.text((x, y), t1, font=f, fill=MUTED)
    draw.text((x + w1, y), t2, font=fb, fill=GOLD)


def add_variant_label(img: Image.Image, label: str, desc: str) -> Image.Image:
    pad = 56
    out = Image.new("RGB", (img.width, img.height + pad), (18, 18, 22))
    out.paste(img, (0, pad))
    d = ImageDraw.Draw(out)
    d.text((12, 10), label, font=load_font(FONT_BOLD, 18), fill=(255, 255, 255))
    d.text((12, 32), desc, font=load_font(FONT_REG, 13), fill=(160, 160, 168))
    return out


def variant1_glass_refined() -> Image.Image:
    base = gradient_bottom(paste_bg(), 0.55)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    card_y, card_h = 430, 390
    rounded_rect(d, (16, card_y, W - 16, card_y + card_h), 28, fill=(5, 31, 69, 200), outline=(255, 255, 255, 90), width=1)
    d.rectangle((16, card_y, W - 16, card_y + 3), fill=GOLD)
    comp = Image.alpha_composite(base.convert("RGBA"), layer)
    draw = ImageDraw.Draw(comp)
    y = draw_header(draw, card_y + 24, "Tekrar Hoş Geldin", "Hesabına giriş yap ve\ngörevleri keşfetmeye devam et.")
    y = draw_field(comp, draw, y, "ornek@email.com", "ercan@gmail.com")
    y = draw_field(comp, draw, y, "Şifre", icon="◉")
    y = draw_options(draw, y)
    draw_button(draw, y)
    draw_footer(draw, card_y + card_h - 36)
    return comp.convert("RGB")


def variant2_bottom_sheet() -> Image.Image:
    base = paste_bg()
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    sheet_y = 360
    rounded_rect(d, (0, sheet_y, W, H), 32, fill=(5, 31, 69, 235), outline=(255, 255, 255, 60), width=1)
    # handle
    d.rounded_rectangle((W // 2 - 28, sheet_y + 10, W // 2 + 28, sheet_y + 16), radius=3, fill=(255, 255, 255, 80))
    comp = Image.alpha_composite(base.convert("RGBA"), layer)
    draw = ImageDraw.Draw(comp)
    y = draw_header(draw, sheet_y + 36, "Tekrar Hoş Geldin", "Görevleri keşfet, becerinle hizmet al.")
    y = draw_field(comp, draw, y, "E-posta", "ercan@gmail.com")
    y = draw_field(comp, draw, y, "Şifre", icon="◉")
    y = draw_options(draw, y)
    draw_button(draw, y)
    draw_footer(draw, H - 48)
    return comp.convert("RGB")


def variant3_minimal_float() -> Image.Image:
    base = gradient_bottom(paste_bg(), 0.35)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    card_y, card_h = 480, 320
    cx0, cx1 = 24, W - 24
    rounded_rect(d, (cx0, card_y, cx1, card_y + card_h), 24, fill=(5, 31, 69, 175), outline=(255, 255, 255, 75), width=1)
    comp = Image.alpha_composite(base.convert("RGBA"), layer)
    draw = ImageDraw.Draw(comp)
    ft = load_font(FONT_BOLD, 20)
    draw.text((cx0 + 4, card_y + 20), "Giriş yap", font=ft, fill=TEXT)
    y = card_y + 58
    y = draw_field(comp, draw, y, "E-posta", "ercan@gmail.com")
    y = draw_field(comp, draw, y, "Şifre", icon="◉")
    y = draw_options(draw, y)
    draw_button(draw, y)
    draw_footer(draw, card_y + card_h - 32)
    return comp.convert("RGB")


def variant4_brand_hero() -> Image.Image:
    base = gradient_bottom(paste_bg(), 0.5)
    comp = base.convert("RGBA")
    draw = ImageDraw.Draw(comp)
    # hero wordmark zone
    fw = load_font(FONT_BOLD, 36)
    draw.text((W // 2 - draw.textlength("PASSLA", font=fw) / 2, 520), "PASSLA", font=fw, fill=TEXT)
    fs = load_font(FONT_REG, 13)
    sub = "Beceri takası — nakit yok"
    draw.text((W // 2 - draw.textlength(sub, font=fs) / 2, 564), sub, font=fs, fill=GOLD)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    card_y = 610
    rounded_rect(d, (20, card_y, W - 20, H - 24), 22, fill=(5, 31, 69, 220), outline=(255, 255, 255, 65), width=1)
    comp = Image.alpha_composite(comp, layer)
    draw = ImageDraw.Draw(comp)
    y = card_y + 20
    y = draw_field(comp, draw, y, "E-posta", "ercan@gmail.com")
    y = draw_field(comp, draw, y, "Şifre", icon="◉")
    y = draw_options(draw, y)
    draw_button(draw, y)
    draw_footer(draw, H - 52)
    return comp.convert("RGB")


def variant5_premium_solid() -> Image.Image:
    base = paste_bg()
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    card_y = 400
    rounded_rect(d, (0, card_y, W, H), 0, fill=(5, 31, 69, 248))
    d.rectangle((0, card_y, W, card_y + 2), fill=GOLD)
    comp = Image.alpha_composite(base.convert("RGBA"), layer)
    draw = ImageDraw.Draw(comp)
    y = draw_header(draw, card_y + 28, "Hoş geldin", "Hesabına giriş yap.")
    y = draw_field(comp, draw, y, "E-posta adresi", "ercan@gmail.com")
    y = draw_field(comp, draw, y, "Şifre", icon="◉")
    y = draw_options(draw, y)
    draw_button(draw, y + 4)
    draw_footer(draw, H - 44)
    return comp.convert("RGB")


VARIANTS = [
    ("01-glass-refined.png", "Varyant 1 — Cam Kart (İyileştirilmiş)", "Altın çizgi + daha net cam; mevcut stilin profesyonel hali", variant1_glass_refined),
    ("02-bottom-sheet.png", "Varyant 2 — Alt Sayfa", "iOS tarzı bottom sheet; graffiti üstte daha görünür", variant2_bottom_sheet),
    ("03-minimal-float.png", "Varyant 3 — Minimal Yüzen Kart", "Küçük kart, arka plan ön planda; sade form", variant3_minimal_float),
    ("04-brand-hero.png", "Varyant 4 — Marka Hero", "PASSLA üstte; form ayrı katmanda; marka vurgusu güçlü", variant4_brand_hero),
    ("05-premium-solid.png", "Varyant 5 — Premium Solid", "Opak lacivert panel; cam yok; en temiz/kurumsal görünüm", variant5_premium_solid),
]


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    thumbs = []
    for fname, label, desc, fn in VARIANTS:
        img = fn()
        labeled = add_variant_label(img, label, desc)
        big = labeled.resize((labeled.width * SCALE, labeled.height * SCALE), Image.Resampling.LANCZOS)
        path = os.path.join(OUT_DIR, fname)
        big.save(path, "PNG", optimize=False)
        thumbs.append(big)
        print("saved", path)

    # overview grid
    tw, th = thumbs[0].width, thumbs[0].height
    cols, rows = 3, 2
    grid = Image.new("RGB", (tw * cols + 40, th * rows + 40), (18, 18, 22))
    for i, t in enumerate(thumbs):
        c, r = i % cols, i // cols
        grid.paste(t, (20 + c * tw, 20 + r * th))
    overview = os.path.join(OUT_DIR, "00-hepsini-gor.png")
    grid.save(overview, "PNG")
    print("saved", overview)


if __name__ == "__main__":
    main()
