"""Generate 3 Passla splash screen mockups on Desktop for review."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT = Path.home() / "Desktop" / "passla-splash-ornekleri"
W, H = 1080, 2340

NAVY = (5, 31, 69)
NAVY_LIGHT = (12, 48, 92)
GOLD = (212, 184, 106)
GOLD_DIM = (160, 138, 78)
CREAM = (240, 238, 233)


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def vertical_gradient(size: tuple[int, int], top: tuple, bottom: tuple) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size)
    px = img.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(lerp(top[0], bottom[0], t))
        g = int(lerp(top[1], bottom[1], t))
        b = int(lerp(top[2], bottom[2], t))
        for x in range(w):
            px[x, y] = (r, g, b)
    return img


def radial_glow(size: tuple[int, int], center: tuple[int, int], radius: int, color: tuple, alpha: int) -> Image.Image:
    w, h = size
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = center
    for r in range(radius, 0, -2):
        a = int(alpha * (r / radius) ** 2)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*color, a))
    return layer


def load_logo(max_side: int = 280) -> Image.Image:
    path = ASSETS / "splash-icon.png"
    if not path.exists():
        path = ASSETS / "icon.png"
    logo = Image.open(path).convert("RGBA")
    logo.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    return logo


def try_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    if bold:
        candidates.extend(
            [
                "C:/Windows/Fonts/segoeuib.ttf",
                "C:/Windows/Fonts/arialbd.ttf",
            ]
        )
    else:
        candidates.extend(
            [
                "C:/Windows/Fonts/segoeui.ttf",
                "C:/Windows/Fonts/arial.ttf",
            ]
        )
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def paste_center(base: Image.Image, overlay: Image.Image, y_offset: int = 0) -> None:
    bw, bh = base.size
    ow, oh = overlay.size
    x = (bw - ow) // 2
    y = (bh - oh) // 2 + y_offset
    if base.mode != "RGBA":
        base_rgba = base.convert("RGBA")
        base_rgba.paste(overlay, (x, y), overlay)
        base.paste(base_rgba.convert("RGB"))
    else:
        base.paste(overlay, (x, y), overlay)


def draw_text_center(
    draw: ImageDraw.ImageDraw,
    text: str,
    y: int,
    font: ImageFont.ImageFont,
    fill: tuple,
    width: int,
) -> None:
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (width - tw) // 2
    draw.text((x, y), text, font=font, fill=fill)


def mockup_1_minimal_glow() -> Image.Image:
    """Soft radial gold glow, logo, wordmark + tagline."""
    base = vertical_gradient((W, H), (8, 38, 78), NAVY)
    base = base.convert("RGBA")
    glow = radial_glow((W, H), (W // 2, H // 2 - 80), 520, GOLD, 55)
    base = Image.alpha_composite(base, glow)
    ring = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    cx, cy = W // 2, H // 2 - 100
    rd.ellipse([cx - 200, cy - 200, cx + 200, cy + 200], outline=(*GOLD, 90), width=2)
    base = Image.alpha_composite(base, ring)

    logo = load_logo(240)
    paste_center(base, logo, y_offset=-120)

    rgb = base.convert("RGB")
    draw = ImageDraw.Draw(rgb)
    title = try_font(72, bold=True)
    sub = try_font(32)
    draw_text_center(draw, "Passla", H // 2 + 140, title, CREAM, W)
    draw_text_center(draw, "Görev yap · Ödül kazan", H // 2 + 230, sub, (*GOLD_DIM,), W)

    # subtle bottom fade line
    draw.line([(W // 2 - 120, H - 180), (W // 2 + 120, H - 180)], fill=GOLD, width=2)
    return rgb


def mockup_2_spotlight() -> Image.Image:
    """Darker edges, center spotlight, larger logo — app-store feel."""
    base = Image.new("RGB", (W, H), NAVY)
    spot = radial_glow((W, H), (W // 2, H // 2 - 60), 700, NAVY_LIGHT, 180)
    base_rgba = base.convert("RGBA")
    base_rgba = Image.alpha_composite(base_rgba, spot)
    vignette = radial_glow((W, H), (W // 2, H // 2), 900, (0, 0, 0), 120)
    # invert vignette: dark at edges
    w, h = W, H
    vig = Image.new("L", (w, h), 0)
    vig_draw = ImageDraw.Draw(vig)
    cx, cy = w // 2, h // 2
    for r in range(min(w, h) // 2, 0, -4):
        a = int(255 * (1 - (r / (min(w, h) // 2)) ** 0.7) * 0.35)
        vig_draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=a)
    dark = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dark.putalpha(vig)
    comp = Image.alpha_composite(base_rgba, dark)

    logo = load_logo(320)
    paste_center(comp, logo, y_offset=-40)

    rgb = comp.convert("RGB")
    draw = ImageDraw.Draw(rgb)
    small = try_font(28)
    draw_text_center(draw, "PASSLA", H - 220, try_font(36, bold=True), CREAM, W)
    draw_text_center(draw, "Yükleniyor…", H - 160, small, (180, 175, 168), W)
    return rgb


def mockup_3_geometric_accent() -> Image.Image:
    """Flat navy + gold arc / diagonal accent — modern, not screenshot-like."""
    base = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(base)

    # bottom gold wedge
    draw.polygon([(0, H), (W, H), (W, int(H * 0.72)), (0, int(H * 0.78))], fill=(7, 42, 88))
    draw.arc([W // 2 - 400, H - 520, W // 2 + 400, H + 80], start=200, end=340, fill=GOLD, width=4)

    # top subtle dots grid
    for i in range(12):
        for j in range(4):
            x = 80 + i * 85
            y = 120 + j * 70
            draw.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(30, 60, 100))

    accent = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ad = ImageDraw.Draw(accent)
    ad.line([(0, int(H * 0.35)), (W, int(H * 0.28))], fill=(*GOLD, 40), width=3)
    base = Image.alpha_composite(base.convert("RGBA"), accent).convert("RGB")

    logo = load_logo(260)
    paste_center(base, logo, y_offset=-200)

    draw = ImageDraw.Draw(base)
    draw_text_center(draw, "Passla", H // 2 + 100, try_font(68, bold=True), CREAM, W)
    tag = "İşletmelerden görev al, tamamla, kazan"
    draw_text_center(draw, tag, H // 2 + 190, try_font(26), (190, 185, 175), W)

    # pill badge
    pill_w, pill_h = 280, 52
    px = (W - pill_w) // 2
    py = H - 200
    draw.rounded_rectangle([px, py, px + pill_w, py + pill_h], radius=26, outline=GOLD, width=2)
    draw_text_center(draw, "passla.com.tr", py + 10, try_font(24), GOLD, W)

    return base


def add_label_strip(img: Image.Image, label: str) -> Image.Image:
    """Add small title bar for desktop comparison."""
    strip_h = 56
    out = Image.new("RGB", (img.width, img.height + strip_h), (40, 40, 45))
    out.paste(img, (0, strip_h))
    d = ImageDraw.Draw(out)
    d.text((24, 14), label, font=try_font(28, bold=True), fill=(255, 255, 255))
    return out


def export_production_splash() -> Path:
    """Spotlight splash (örnek 2) — uygulama assets."""
    path = ROOT / "assets" / "splash.png"
    img = mockup_2_spotlight()
    img.save(path, "PNG", optimize=True)
    return path


def main() -> None:
    prod = export_production_splash()
    print(prod)

    OUT.mkdir(parents=True, exist_ok=True)
    variants = [
        ("01-minimal-glow", "Örnek 1 — Minimal glow + slogan", mockup_1_minimal_glow),
        ("02-spotlight", "Örnek 2 — Spotlight (büyük logo)", mockup_2_spotlight),
        ("03-geometric", "Örnek 3 — Geometrik alt altın", mockup_3_geometric_accent),
    ]
    for slug, title, fn in variants:
        img = fn()
        labeled = add_label_strip(img, title)
        path = OUT / f"passla-splash-{slug}.png"
        labeled.save(path, "PNG", optimize=True)
        print(path)

    # combined sheet
    gap = 24
    sheet_w = W + gap
    sheet_h = (H + 56) * 3 + gap * 2
    sheet = Image.new("RGB", (sheet_w, sheet_h), (30, 30, 35))
    y = 0
    for slug, title, fn in variants:
        labeled = add_label_strip(fn(), title)
        sheet.paste(labeled, (0, y))
        y += labeled.height + gap
    combined = OUT / "passla-splash-HEPSI-yan-yana-dikey.png"
    sheet.save(combined, "PNG", optimize=True)
    print(combined)


if __name__ == "__main__":
    main()
