# -*- coding: utf-8 -*-
"""Passla login — v2 mockup: duvar mavisi ile ayni ton."""
from __future__ import annotations

import os
from collections import Counter

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(__file__))
BG_PATH = os.path.join(ROOT, "assets", "branding", "auth-login-wall.png")
FONT_BOLD = os.path.join(ROOT, "assets", "fonts", "Inter_700Bold.ttf")
FONT_MED = os.path.join(ROOT, "assets", "fonts", "Inter_500Medium.ttf")
FONT_REG = os.path.join(ROOT, "assets", "fonts", "Inter_400Regular.ttf")
OUT_DIR = os.path.join(os.path.expanduser("~"), "Desktop", "Passla-Login-Mockups")

W, H = 390, 844
SCALE = 2
GOLD = (231, 198, 99)
TEXT = (252, 251, 248)
MUTED = (210, 208, 204)


def sample_wall_blue() -> tuple[int, int, int]:
    """PASSLA graffiti duvarinin baskin mavi tonu."""
    im = np.array(Image.open(BG_PATH).convert("RGB"))
    h, w = im.shape[:2]
    region = im[int(h * 0.30) : int(h * 0.54), int(w * 0.12) : int(w * 0.88)]
    r, g, b = region[..., 0], region[..., 1], region[..., 2]
    mask = (b > r + 8) & (b > g) & (b > 95) & (r < 130) & (g < 145)
    pixels = region[mask]
    if len(pixels) < 50:
        return (78, 98, 118)
    q = (pixels // 4) * 4
    top = Counter(tuple(p) for p in q).most_common(1)[0][0]
    return int(top[0]), int(top[1]), int(top[2])


WALL = sample_wall_blue()
WALL_DARK = tuple(max(0, c - 18) for c in WALL)
WALL_DEEP = tuple(max(0, c - 32) for c in WALL)
print("wall blue", WALL, f"#{WALL[0]:02x}{WALL[1]:02x}{WALL[2]:02x}")


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def rounded_rect(draw, xy, radius, **kw):
    draw.rounded_rectangle(xy, radius=radius, **kw)


def paste_bg() -> Image.Image:
    return Image.open(BG_PATH).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)


def wall_gradient(base: Image.Image, start_y: int, alpha_top: int = 0, alpha_bottom: int = 235) -> Image.Image:
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for y in range(start_y, H):
        t = (y - start_y) / max(H - start_y, 1)
        a = int(alpha_top + (alpha_bottom - alpha_top) * (t**1.15))
        draw.line([(0, y), (W, y)], fill=(*WALL, a))
    return Image.alpha_composite(base.convert("RGBA"), overlay)


def draw_field(canvas, draw, y, value="", placeholder="E-posta", icon="@"):
    x0, x1 = 26, W - 26
    h = 50
    rounded_rect(draw, (x0, y, x1, y + h), 13, fill=(255, 255, 255, 22), outline=(255, 255, 255, 48), width=1)
    f = load_font(FONT_REG, 14)
    draw.text((x0 + 14, y + 15), value or placeholder, font=f, fill=TEXT if value else MUTED)
    draw.text((x1 - 26, y + 15), icon, font=f, fill=MUTED)
    return y + h + 11


def draw_button(draw, y, label="Giriş Yap"):
    x0, x1 = 26, W - 26
    rounded_rect(draw, (x0, y, x1, y + 50), 14, fill=GOLD)
    fb = load_font(FONT_BOLD, 16)
    tw = draw.textlength(label, font=fb)
    draw.text(((W - tw) / 2, y + 15), label, font=fb, fill=WALL_DEEP)


def draw_options(draw, y):
    f = load_font(FONT_REG, 12)
    rounded_rect(draw, (26, y, 46, y + 20), 4, outline=(255, 255, 255, 70), width=1)
    rounded_rect(draw, (28, y + 2, 44, y + 18), 3, fill=GOLD)
    draw.text((32, y + 2), "✓", font=f, fill=WALL_DEEP)
    draw.text((54, y + 2), "Beni hatırla", font=f, fill=TEXT)
    fp = load_font(FONT_MED, 12)
    txt = "Şifremi unuttum"
    draw.text((W - 26 - draw.textlength(txt, font=fp), y + 2), txt, font=fp, fill=GOLD)
    return y + 32


def draw_footer(draw, y):
    f, fb = load_font(FONT_REG, 13), load_font(FONT_BOLD, 13)
    t1, t2 = "Hesabın yok mu? ", "Kayıt Ol"
    w = draw.textlength(t1, font=f) + draw.textlength(t2, font=fb)
    x = (W - w) / 2
    draw.text((x, y), t1, font=f, fill=MUTED)
    draw.text((x + draw.textlength(t1, font=f), y), t2, font=fb, fill=GOLD)


def draw_header(draw, y, title, subtitle=None):
    draw.text((26, y), title, font=load_font(FONT_BOLD, 23), fill=TEXT)
    if subtitle:
        draw.multiline_text((26, y + 32), subtitle, font=load_font(FONT_REG, 13), fill=MUTED, spacing=3)
        return y + 78
    return y + 40


def add_label(img, label, desc):
    pad = 56
    out = Image.new("RGB", (img.width, img.height + pad), (22, 24, 28))
    out.paste(img, (0, pad))
    d = ImageDraw.Draw(out)
    d.text((12, 10), label, font=load_font(FONT_BOLD, 17), fill=(255, 255, 255))
    d.text((12, 32), desc, font=load_font(FONT_REG, 12), fill=(150, 152, 160))
    hex_c = f"#{WALL[0]:02x}{WALL[1]:02x}{WALL[2]:02x}"
    d.text((12, 48), f"Duvar tonu: {hex_c}", font=load_font(FONT_REG, 11), fill=(120, 180, 220))
    return out


def form_block(comp, draw, start_y):
    y = draw_field(comp, draw, start_y, "ercan@gmail.com", "E-posta")
    y = draw_field(comp, draw, y, "", "Şifre", "◉")
    y = draw_options(draw, y)
    draw_button(draw, y + 2)
    return y


# --- 5 yeni varyant ---

def v06_seamless_fade():
    """Duvar rengiyle yumusak alt gecis — panel siniri yok."""
    comp = wall_gradient(paste_bg(), int(H * 0.42), 0, 252)
    draw = ImageDraw.Draw(comp)
    y = draw_header(draw, int(H * 0.58), "Tekrar Hoş Geldin", "Görevi sen yap,\nhizmeti işletme sunsun.")
    form_block(comp, draw, y)
    draw_footer(draw, H - 42)
    return comp.convert("RGB")


def v07_wall_sheet():
    """Alt sayfa — tam duvar mavisi, ustte ince altin cizgi."""
    base = paste_bg()
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    sy = 370
    rounded_rect(d, (0, sy, W, H), 30, fill=(*WALL, 245), outline=(255, 255, 255, 45), width=1)
    d.rectangle((0, sy, W, sy + 2), fill=GOLD)
    d.rounded_rectangle((W // 2 - 24, sy + 10, W // 2 + 24, sy + 15), radius=3, fill=(255, 255, 255, 60))
    comp = Image.alpha_composite(base.convert("RGBA"), layer)
    draw = ImageDraw.Draw(comp)
    y = draw_header(draw, sy + 34, "Hoş geldin", "Hesabına giriş yap.")
    form_block(comp, draw, y)
    draw_footer(draw, H - 46)
    return comp.convert("RGB")


def v08_floating_wall_card():
    """Orta-kucuk kart — duvar tonu dolgu, ince altin kenar."""
    base = wall_gradient(paste_bg(), int(H * 0.55), 0, 120)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cy, ch = 455, 330
    rounded_rect(d, (20, cy, W - 20, cy + ch), 26, fill=(*WALL, 230), outline=(*GOLD, 180), width=2)
    comp = Image.alpha_composite(base.convert("RGBA"), layer)
    draw = ImageDraw.Draw(comp)
    y = draw_header(draw, cy + 22, "Giriş yap")
    form_block(comp, draw, y)
    draw_footer(draw, cy + ch - 30)
    return comp.convert("RGB")


def v09_split_hero():
    """Graffiti ustte kalir; alt yari duvar mavisi solid blok."""
    base = paste_bg()
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    split = 398
    d.rectangle((0, split, W, H), fill=(*WALL, 250))
    d.line([(0, split), (W, split)], fill=GOLD, width=2)
    comp = Image.alpha_composite(base.convert("RGBA"), layer)
    draw = ImageDraw.Draw(comp)
    y = draw_header(draw, split + 22, "Passla'ya gir", "Beceri takası — nakit yok.")
    form_block(comp, draw, y)
    draw_footer(draw, H - 40)
    return comp.convert("RGB")


def v10_soft_glass_wall():
    """Hafif cam efekti ama dolgu rengi duvar mavisi (lacivert degil)."""
    base = paste_bg()
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cy = 415
    rounded_rect(d, (14, cy, W - 14, H - 18), 28, fill=(*WALL, 195), outline=(255, 255, 255, 55), width=1)
    # ic parlaklik
    rounded_rect(d, (14, cy, W - 14, cy + 40), 28, fill=(255, 255, 255, 12))
    comp = Image.alpha_composite(base.convert("RGBA"), layer)
    draw = ImageDraw.Draw(comp)
    y = draw_header(draw, cy + 24, "Tekrar Hoş Geldin", "Hesabına giriş yap.")
    form_block(comp, draw, y)
    draw_footer(draw, H - 36)
    return comp.convert("RGB")


VARIANTS = [
    ("06-seamless-fade.png", "Varyant 6 — Kesintisiz Duvar Geçişi", "Panel yok; alttan duvar mavisi fade — en doğal ton", v06_seamless_fade),
    ("07-wall-sheet.png", "Varyant 7 — Duvar Mavi Alt Sayfa", "Bottom sheet tam duvar tonu + altın çizgi", v07_wall_sheet),
    ("08-floating-wall-card.png", "Varyant 8 — Duvar Tonu Yüzen Kart", "Altın kenarlı kompakt kart", v08_floating_wall_card),
    ("09-split-hero.png", "Varyant 9 — Yarım Duvar Blok", "Graffiti üstte; alt blok duvar mavisi", v09_split_hero),
    ("10-soft-glass-wall.png", "Varyant 10 — Yumuşak Cam (Duvar Tonu)", "Hafif cam; dolgu rengi duvar ile aynı", v10_soft_glass_wall),
]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    saved = []
    for fname, label, desc, fn in VARIANTS:
        img = add_label(fn(), label, desc)
        big = img.resize((img.width * SCALE, img.height * SCALE), Image.Resampling.LANCZOS)
        path = os.path.join(OUT_DIR, fname)
        big.save(path, "PNG")
        saved.append(big)
        print("saved", path)

    tw, th = saved[0].width, saved[0].height
    grid = Image.new("RGB", (tw * 3 + 40, th * 2 + 40), (22, 24, 28))
    for i, t in enumerate(saved):
        c, r = i % 3, i // 3
        grid.paste(t, (20 + c * tw, 20 + r * th))
    overview = os.path.join(OUT_DIR, "00-v2-hepsini-gor.png")
    grid.save(overview, "PNG")
    print("saved", overview)


if __name__ == "__main__":
    main()
