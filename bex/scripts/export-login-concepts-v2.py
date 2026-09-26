"""Giriş ekranı önerileri — 2. tur.

Onboarding dili (lavanta/krem pastel zemin, lacivert #17264F, Inter, pill buton)
korunur; eski giriş ekranındaki grafiti PASSLA yazısı marka öğesi olarak döner.
Karakter/illüstrasyon yok.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONTS = ROOT / "assets" / "fonts"
BRANDING = ROOT / "assets" / "branding"
WORDMARK_NAVY = BRANDING / "passla-wordmark-navy@3x.png"
WORDMARK_WHITE = BRANDING / "passla-wordmark-white@3x.png"
OUT_DIR = Path.home() / "Desktop" / "Passla-giris-tasarimlari"

W, H = 1080, 2160
NAVY = (23, 38, 79)
NAVY_SOFT = (36, 54, 102)
BODY = (30, 41, 59)
MUTED = (100, 112, 140)
LINE = (206, 210, 232)
WHITE = (255, 255, 255)
CREAM_INK = (255, 248, 238)
LILAC = (167, 139, 250)

LAVENDER = ((233, 229, 253), (243, 241, 254), (238, 235, 252))
CREAM = ((254, 250, 239), (254, 249, 245), (255, 246, 234))
BLUE = ((221, 230, 253), (237, 239, 252), (238, 237, 253))


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


def gradient(colors: tuple, size: tuple[int, int]) -> Image.Image:
    top, mid, bottom = colors
    w, h = size
    strip = Image.new("RGB", (1, h))
    px = strip.load()
    for y in range(h):
        t = y / (h - 1)
        a, b, k = (top, mid, t / 0.5) if t < 0.5 else (mid, bottom, (t - 0.5) / 0.5)
        px[0, y] = tuple(round(a[i] + (b[i] - a[i]) * k) for i in range(3))
    return strip.resize((w, h))


def add_blobs(img: Image.Image, spots) -> None:
    layer = img.copy()
    draw = ImageDraw.Draw(layer)
    for cx, cy, r, color in spots:
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color)
    img.paste(Image.blend(img, layer.filter(ImageFilter.GaussianBlur(190)), 0.6))


def wordmark(img: Image.Image, path: Path, cx: int, top: int, width: int) -> int:
    logo = Image.open(path).convert("RGBA")
    h = round(logo.height * width / logo.width)
    logo = logo.resize((width, h), Image.Resampling.LANCZOS)
    img.paste(logo, (cx - width // 2, top), logo)
    return top + h


def spaced_text(draw, xy, s, f, fill, tracking, anchor_center=False) -> None:
    widths = [draw.textlength(ch, font=f) for ch in s]
    total = sum(widths) + tracking * (len(s) - 1)
    x, y = xy
    if anchor_center:
        x -= total / 2
    for ch, cw in zip(s, widths):
        draw.text((x, y), ch, font=f, fill=fill, anchor="lm")
        x += cw + tracking


def sparkle(draw, cx, cy, r, color, width=5) -> None:
    draw.line((cx - r, cy, cx + r, cy), fill=color, width=width)
    draw.line((cx, cy - r, cx, cy + r), fill=color, width=width)
    d = int(r * 0.42)
    draw.line((cx - d, cy - d, cx + d, cy + d), fill=color, width=max(2, width - 2))
    draw.line((cx - d, cy + d, cx + d, cy - d), fill=color, width=max(2, width - 2))


def awning(draw, x, y, w, h, a=NAVY, b=WHITE, bars=8) -> None:
    """Onboarding dükkan tentelerindeki çizgili şerit."""
    bw = w / bars
    for i in range(bars):
        draw.rectangle((x + i * bw, y, x + (i + 1) * bw, y + h), fill=a if i % 2 == 0 else b)


def icon(draw, kind, cx, cy, c=MUTED, wd=3) -> None:
    if kind == "mail":
        draw.rounded_rectangle((cx - 16, cy - 12, cx + 16, cy + 12), radius=5, outline=c, width=wd)
        draw.line((cx - 16, cy - 9, cx, cy + 3), fill=c, width=wd)
        draw.line((cx, cy + 3, cx + 16, cy - 9), fill=c, width=wd)
    elif kind == "lock":
        draw.rounded_rectangle((cx - 14, cy - 3, cx + 14, cy + 15), radius=5, outline=c, width=wd)
        draw.arc((cx - 9, cy - 17, cx + 9, cy + 3), 180, 360, fill=c, width=wd)
    elif kind == "eye":
        draw.arc((cx - 17, cy - 13, cx + 17, cy + 13), 200, 340, fill=c, width=wd)
        draw.arc((cx - 17, cy - 13, cx + 17, cy + 13), 20, 160, fill=c, width=wd)
        draw.ellipse((cx - 5, cy - 5, cx + 5, cy + 5), outline=c, width=wd)


def field(draw, x, y, w, h, label, f, *, fill=None, ic=None, trailing=None) -> int:
    draw.rounded_rectangle((x, y, x + w, y + h), radius=h // 2, fill=fill, outline=LINE, width=3)
    tx = x + 46
    if ic:
        icon(draw, ic, x + 44, y + h // 2)
        tx = x + 100
    draw.text((tx, y + h // 2), label, font=f, fill=MUTED, anchor="lm")
    if trailing:
        icon(draw, trailing, x + w - 52, y + h // 2)
    return y + h


def pill(draw, x, y, w, h, label, f, *, fill=NAVY, fg=WHITE, outline=None) -> int:
    draw.rounded_rectangle((x, y, x + w, y + h), radius=h // 2, fill=fill,
                           outline=outline, width=4 if outline else 0)
    draw.text((x + w // 2, y + h // 2), label, font=f, fill=fg, anchor="mm")
    return y + h


def options_row(draw, x, y, w, f) -> None:
    draw.rounded_rectangle((x, y - 15, x + 30, y + 15), radius=9, outline=LINE, width=3)
    draw.line((x + 8, y + 1, x + 13, y + 8), fill=NAVY, width=4)
    draw.line((x + 13, y + 8, x + 23, y - 8), fill=NAVY, width=4)
    draw.text((x + 50, y), "Beni hatırla", font=f, fill=BODY, anchor="lm")
    draw.text((x + w, y), "Şifremi unuttum", font=f, fill=NAVY, anchor="rm")


def bottom_link(draw, cx, y, f_reg, f_bold, muted=MUTED, strong=NAVY) -> None:
    a, b = "Hesabın yok mu?  ", "Kayıt ol"
    wa = draw.textlength(a, font=f_reg)
    x = cx - (wa + draw.textlength(b, font=f_bold)) / 2
    draw.text((x, y), a, font=f_reg, fill=muted, anchor="lm")
    draw.text((x + wa, y), b, font=f_bold, fill=strong, anchor="lm")


def card_with_shadow(img: Image.Image, box, radius=72, fill=WHITE) -> ImageDraw.ImageDraw:
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (box[0] + 6, box[1] + 26, box[2] + 6, box[3] + 26), radius=radius, fill=(23, 38, 79, 40)
    )
    blended = Image.alpha_composite(img.convert("RGBA"), shadow.filter(ImageFilter.GaussianBlur(30)))
    img.paste(blended.convert("RGB"))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(box, radius=radius, fill=fill)
    return d


# --- Varyantlar ---------------------------------------------------------------

def concept_5_grafiti_kart() -> Image.Image:
    """PASSLA grafitisi üstte, form beyaz kartta."""
    img = gradient(LAVENDER, (W, H))
    add_blobs(img, [(-30, 240, 400, (224, 216, 253)), (W + 50, 1320, 440, (219, 229, 253))])

    bottom = wordmark(img, WORDMARK_NAVY, W // 2, 210, 640)
    d = ImageDraw.Draw(img)
    sparkle(d, 168, 250, 26, LILAC)
    sparkle(d, W - 150, 360, 20, LILAC, 4)
    spaced_text(d, (W // 2, bottom + 56), "GÖREV YAP · HİZMET AL",
                font("Inter_600SemiBold.ttf", 27), NAVY_SOFT, 6, anchor_center=True)

    d = card_with_shadow(img, (70, bottom + 150, W - 70, bottom + 1180))
    x, w = 140, 800
    top = bottom + 150
    d.text((x, top + 98), "Tekrar hoş geldin", font=font("Inter_700Bold.ttf", 64), fill=NAVY)
    d.multiline_text((x, top + 186), "Hesabına giriş yap ve\ngörevleri keşfetmeye devam et.",
                     font=font("Inter_400Regular.ttf", 34), fill=MUTED, spacing=12)

    f_field = font("Inter_400Regular.ttf", 36)
    y = field(d, x, top + 330, w, 126, "E-posta adresin", f_field, ic="mail")
    y = field(d, x, y + 38, w, 126, "Şifren", f_field, ic="lock", trailing="eye")
    options_row(d, x, y + 84, w, font("Inter_500Medium.ttf", 31))
    y = pill(d, x, y + 144, w, 130, "Giriş yap  →", font("Inter_600SemiBold.ttf", 40))
    bottom_link(d, W // 2, y + 96, font("Inter_400Regular.ttf", 33), font("Inter_700Bold.ttf", 33))
    return img


def concept_6_duvar() -> Image.Image:
    """Üstte lacivert panel + beyaz grafiti (eski duvarın sade yorumu)."""
    img = gradient(LAVENDER, (W, H))
    add_blobs(img, [(W - 40, 1500, 460, (222, 231, 253))])
    d = ImageDraw.Draw(img)

    d.rounded_rectangle((-60, -320, W + 60, 760), radius=120, fill=NAVY)
    bottom = wordmark(img, WORDMARK_WHITE, W // 2, 250, 640)
    d = ImageDraw.Draw(img)
    sparkle(d, 152, 300, 24, (120, 140, 200))
    sparkle(d, W - 142, 236, 18, (120, 140, 200), 4)
    spaced_text(d, (W // 2, bottom + 66), "GÖREV YAP · HİZMET AL",
                font("Inter_600SemiBold.ttf", 27), (196, 205, 232), 6, anchor_center=True)

    x, w = 100, 880
    d.text((x, 900), "Hesabına giriş yap", font=font("Inter_700Bold.ttf", 68), fill=NAVY)
    d.text((x, 990), "İşlemlerine devam etmek için bilgilerini gir.",
           font=font("Inter_400Regular.ttf", 33), fill=BODY)

    f_field = font("Inter_400Regular.ttf", 36)
    y = field(d, x, 1120, w, 128, "E-posta adresin", f_field, fill=WHITE, ic="mail")
    y = field(d, x, y + 40, w, 128, "Şifren", f_field, fill=WHITE, ic="lock", trailing="eye")
    options_row(d, x, y + 86, w, font("Inter_500Medium.ttf", 32))
    y = pill(d, x, y + 148, w, 132, "Giriş yap  →", font("Inter_600SemiBold.ttf", 40))
    bottom_link(d, W // 2, y + 98, font("Inter_400Regular.ttf", 34), font("Inter_700Bold.ttf", 34))
    return img


def concept_7_krem_tente() -> Image.Image:
    """Krem zemin, sola dayalı grafiti ve tente şeridi."""
    img = gradient(CREAM, (W, H))
    add_blobs(img, [(-20, 1820, 440, (252, 238, 210)), (W + 40, 300, 400, (240, 234, 255))])

    bottom = wordmark(img, WORDMARK_NAVY, 420, 220, 560)
    d = ImageDraw.Draw(img)
    sparkle(d, 820, 270, 22, (198, 166, 90))
    d.rounded_rectangle((100, bottom + 48, 244, bottom + 56), radius=4, fill=NAVY)
    spaced_text(d, (100, bottom + 130), "GÖREV YAP · HİZMET AL",
                font("Inter_600SemiBold.ttf", 27), NAVY_SOFT, 6)

    x, w = 100, 880
    d.multiline_text((x, bottom + 210), "Hoş geldin,\ngiriş yap",
                     font=font("Inter_700Bold.ttf", 86), fill=NAVY, spacing=14)

    f_field = font("Inter_400Regular.ttf", 36)
    f_label = font("Inter_600SemiBold.ttf", 26)
    y = bottom + 470
    d.text((x, y), "E-POSTA", font=f_label, fill=MUTED)
    y = field(d, x, y + 48, w, 126, "ornek@email.com", f_field, fill=WHITE)
    d.text((x, y + 66), "ŞİFRE", font=f_label, fill=MUTED)
    y = field(d, x, y + 114, w, 126, "••••••••", f_field, fill=WHITE, trailing="eye")
    options_row(d, x, y + 84, w, font("Inter_500Medium.ttf", 32))
    y = pill(d, x, y + 146, w, 132, "Giriş yap  →", font("Inter_600SemiBold.ttf", 40))
    bottom_link(d, W // 2, y + 98, font("Inter_400Regular.ttf", 34), font("Inter_700Bold.ttf", 34))
    return img


def concept_8_alt_sayfa() -> Image.Image:
    """Marka üstte geniş alanda, form alta yaslı beyaz sayfada."""
    img = gradient(BLUE, (W, H))
    add_blobs(img, [(180, 420, 430, (212, 225, 253)), (W - 30, 200, 360, (231, 224, 253))])

    bottom = wordmark(img, WORDMARK_NAVY, W // 2, 230, 600)
    d = ImageDraw.Draw(img)
    sparkle(d, 160, 300, 24, LILAC)
    sparkle(d, W - 155, 400, 18, LILAC, 4)
    spaced_text(d, (W // 2, bottom + 54), "GÖREV YAP · HİZMET AL",
                font("Inter_600SemiBold.ttf", 27), NAVY_SOFT, 6, anchor_center=True)

    sheet = bottom + 160
    d.rounded_rectangle((0, sheet, W, H + 140), radius=96, fill=(250, 250, 255))
    d.rounded_rectangle((W // 2 - 62, sheet + 44, W // 2 + 62, sheet + 52), radius=4, fill=LINE)

    x, w = 100, 880
    d.text((x, sheet + 110), "Hesabına giriş yap", font=font("Inter_700Bold.ttf", 62), fill=NAVY)

    f_field = font("Inter_400Regular.ttf", 36)
    y = field(d, x, sheet + 200, w, 128, "E-posta adresin", f_field, ic="mail")
    y = field(d, x, y + 38, w, 128, "Şifren", f_field, ic="lock", trailing="eye")
    options_row(d, x, y + 84, w, font("Inter_500Medium.ttf", 32))
    y = pill(d, x, y + 144, w, 132, "Giriş yap  →", font("Inter_600SemiBold.ttf", 40))
    d.text((W // 2, y + 92), "veya", font=font("Inter_400Regular.ttf", 32), fill=MUTED, anchor="mm")
    pill(d, x, y + 140, w, 132, "Kayıt ol", font("Inter_600SemiBold.ttf", 40),
         fill=(250, 250, 255), fg=NAVY, outline=NAVY)
    return img


CONCEPTS = {
    "5-grafiti-kart.png": concept_5_grafiti_kart,
    "6-duvar.png": concept_6_duvar,
    "7-krem-tente.png": concept_7_krem_tente,
    "8-alt-sayfa.png": concept_8_alt_sayfa,
}


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, build in CONCEPTS.items():
        path = OUT_DIR / name
        build().save(path, "PNG", optimize=True)
        print(path)


if __name__ == "__main__":
    main()
