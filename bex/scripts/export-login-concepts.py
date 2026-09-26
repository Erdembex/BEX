"""Giriş ekranı için sade tasarım önerilerini PNG olarak masaüstüne çıkarır.

Onboarding ile aynı dil: lacivert #17264F, lavanta/krem pastel zemin, Inter,
yuvarlak (pill) buton. İllüstrasyon/karakter yok — sadece tipografi ve form.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONTS = ROOT / "assets" / "fonts"
SS_MARK = ROOT / "assets" / "branding" / "onboarding" / "ss-mark.png"
OUT_DIR = Path.home() / "Desktop" / "Passla-giris-tasarimlari"

W, H = 1080, 2160
NAVY = (23, 38, 79)
BODY = (30, 41, 59)
MUTED = (100, 112, 140)
LINE = (206, 210, 232)
WHITE = (255, 255, 255)

LAVENDER = ((233, 229, 253), (243, 241, 254), (238, 235, 252))
CREAM = ((254, 250, 239), (254, 249, 245), (255, 246, 234))
BLUE = ((221, 230, 253), (237, 239, 252), (238, 237, 253))


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


def gradient(colors: tuple, size: tuple[int, int]) -> Image.Image:
    top, mid, bottom = colors
    w, h = size
    img = Image.new("RGB", (1, h))
    px = img.load()
    for y in range(h):
        t = y / (h - 1)
        if t < 0.5:
            a, b, k = top, mid, t / 0.5
        else:
            a, b, k = mid, bottom, (t - 0.5) / 0.5
        px[0, y] = tuple(round(a[i] + (b[i] - a[i]) * k) for i in range(3))
    return img.resize((w, h))


def add_blobs(img: Image.Image, spots: list[tuple[int, int, int, tuple]]) -> None:
    """Onboarding zeminindeki gibi çok hafif renk lekeleri."""
    layer = Image.new("RGB", img.size)
    layer.paste(img)
    draw = ImageDraw.Draw(layer)
    for cx, cy, r, color in spots:
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color)
    blurred = layer.filter(ImageFilter.GaussianBlur(190))
    img.paste(Image.blend(img, blurred, 0.55))


def text(draw: ImageDraw.ImageDraw, xy, s, f, fill, spacing=12, anchor=None) -> None:
    draw.multiline_text(xy, s, font=f, fill=fill, spacing=spacing, anchor=anchor)


def mark(img: Image.Image, center_x: int, top: int, height: int) -> int:
    logo = Image.open(SS_MARK).convert("RGBA")
    w = round(logo.width * height / logo.height)
    logo = logo.resize((w, height), Image.Resampling.LANCZOS)
    img.paste(logo, (center_x - w // 2, top), logo)
    return top + height


def field(draw: ImageDraw.ImageDraw, x, y, w, h, label, f, *, filled=True, icon=None,
          trailing=None) -> int:
    draw.rounded_rectangle(
        (x, y, x + w, y + h),
        radius=h // 2,
        fill=WHITE if filled else None,
        outline=LINE,
        width=3,
    )
    tx = x + 46
    if icon:
        draw_icon(draw, icon, x + 44, y + h // 2)
        tx = x + 100
    draw.text((tx, y + h // 2), label, font=f, fill=MUTED, anchor="lm")
    if trailing:
        draw_icon(draw, trailing, x + w - 52, y + h // 2)
    return y + h


def draw_icon(draw: ImageDraw.ImageDraw, kind: str, cx: int, cy: int) -> None:
    c, wdt = MUTED, 3
    if kind == "mail":
        draw.rounded_rectangle((cx - 16, cy - 12, cx + 16, cy + 12), radius=5, outline=c, width=wdt)
        draw.line((cx - 16, cy - 9, cx, cy + 3), fill=c, width=wdt)
        draw.line((cx, cy + 3, cx + 16, cy - 9), fill=c, width=wdt)
    elif kind == "lock":
        draw.rounded_rectangle((cx - 14, cy - 3, cx + 14, cy + 15), radius=5, outline=c, width=wdt)
        draw.arc((cx - 9, cy - 17, cx + 9, cy + 3), 180, 360, fill=c, width=wdt)
    elif kind == "eye":
        draw.arc((cx - 17, cy - 13, cx + 17, cy + 13), 200, 340, fill=c, width=wdt)
        draw.arc((cx - 17, cy - 13, cx + 17, cy + 13), 20, 160, fill=c, width=wdt)
        draw.ellipse((cx - 5, cy - 5, cx + 5, cy + 5), outline=c, width=wdt)


def pill(draw: ImageDraw.ImageDraw, x, y, w, h, label, f, *, fill=NAVY, fg=WHITE) -> int:
    draw.rounded_rectangle((x, y, x + w, y + h), radius=h // 2, fill=fill)
    draw.text((x + w // 2, y + h // 2), label, font=f, fill=fg, anchor="mm")
    return y + h


def options_row(draw: ImageDraw.ImageDraw, x, y, w, f) -> None:
    draw.rounded_rectangle((x, y - 14, x + 28, y + 14), radius=8, outline=LINE, width=3)
    draw.line((x + 7, y + 1, x + 12, y + 7), fill=NAVY, width=4)
    draw.line((x + 12, y + 7, x + 22, y - 7), fill=NAVY, width=4)
    draw.text((x + 46, y), "Beni hatırla", font=f, fill=BODY, anchor="lm")
    draw.text((x + w, y), "Şifremi unuttum", font=f, fill=NAVY, anchor="rm")


def bottom_link(draw: ImageDraw.ImageDraw, cx, y, f_reg, f_bold) -> None:
    a, b = "Hesabın yok mu?  ", "Kayıt ol"
    total = draw.textlength(a, font=f_reg) + draw.textlength(b, font=f_bold)
    x = cx - total / 2
    draw.text((x, y), a, font=f_reg, fill=MUTED, anchor="lm")
    draw.text((x + draw.textlength(a, font=f_reg), y), b, font=f_bold, fill=NAVY, anchor="lm")


# --- Varyantlar ---------------------------------------------------------------

def concept_a() -> Image.Image:
    """Sade: ortalanmış marka, açık alanlar, tek lacivert buton."""
    img = gradient(LAVENDER, (W, H))
    add_blobs(img, [(-40, 200, 380, (226, 220, 252)), (W + 60, H - 420, 420, (223, 232, 252))])
    d = ImageDraw.Draw(img)

    y = mark(img, W // 2, 190, 108)
    d.text((W // 2, y + 46), "GÖREV YAP · HİZMET AL", font=font("Inter_600SemiBold.ttf", 25),
           fill=(59, 70, 104), anchor="mm")

    text(d, (100, 450), "Hesabına\ngiriş yap", font("Inter_700Bold.ttf", 92), NAVY, spacing=16)
    text(d, (100, 760), "İşlemlerine devam etmek için\nbilgilerini gir.",
         font("Inter_400Regular.ttf", 36), BODY, spacing=14)

    f_field = font("Inter_400Regular.ttf", 36)
    y = field(d, 100, 960, 880, 128, "E-posta adresin", f_field, icon="mail")
    y = field(d, 100, y + 40, 880, 128, "Şifren", f_field, icon="lock", trailing="eye")
    options_row(d, 100, y + 86, 880, font("Inter_500Medium.ttf", 32))
    y = pill(d, 100, y + 150, 880, 132, "Giriş yap  →", font("Inter_600SemiBold.ttf", 40))
    bottom_link(d, W // 2, y + 92, font("Inter_400Regular.ttf", 34), font("Inter_700Bold.ttf", 34))
    return img


def concept_b() -> Image.Image:
    """Kart: form beyaz yuvarlak kartta, zemin lavanta."""
    img = gradient(LAVENDER, (W, H))
    add_blobs(img, [(120, 300, 400, (224, 217, 252)), (W - 60, 1500, 460, (220, 230, 253))])
    d = ImageDraw.Draw(img)

    y = mark(img, W // 2, 210, 104)
    d.text((W // 2, y + 44), "GÖREV YAP · HİZMET AL", font=font("Inter_600SemiBold.ttf", 25),
           fill=(59, 70, 104), anchor="mm")

    card = (70, 520, W - 70, 1740)
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (card[0] + 8, card[1] + 22, card[2] + 8, card[3] + 22), radius=68, fill=(23, 38, 79, 34)
    )
    img.paste(Image.alpha_composite(img.convert("RGBA"), shadow.filter(ImageFilter.GaussianBlur(28))).convert("RGB"))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(card, radius=68, fill=WHITE)

    text(d, (140, 620), "Tekrar hoş geldin", font("Inter_700Bold.ttf", 66), NAVY)
    text(d, (140, 720), "Hesabına giriş yap ve görevleri\nkeşfetmeye devam et.",
         font("Inter_400Regular.ttf", 34), MUTED, spacing=12)

    f_field = font("Inter_400Regular.ttf", 36)
    y = field(d, 140, 900, 800, 124, "E-posta adresin", f_field, filled=False, icon="mail")
    y = field(d, 140, y + 36, 800, 124, "Şifren", f_field, filled=False, icon="lock", trailing="eye")
    options_row(d, 140, y + 80, 800, font("Inter_500Medium.ttf", 30))
    y = pill(d, 140, y + 140, 800, 128, "Giriş yap  →", font("Inter_600SemiBold.ttf", 40))
    bottom_link(d, W // 2, 1660, font("Inter_400Regular.ttf", 32), font("Inter_700Bold.ttf", 32))
    return img


def concept_c() -> Image.Image:
    """Krem: onboarding 2. adımın zemini, hizalama sola dayalı."""
    img = gradient(CREAM, (W, H))
    add_blobs(img, [(-20, 1750, 430, (252, 240, 216)), (W + 40, 260, 380, (245, 238, 255))])
    d = ImageDraw.Draw(img)

    mark(img, 148, 180, 96)
    d.text((100, 330), "GÖREV YAP · HİZMET AL", font=font("Inter_600SemiBold.ttf", 25),
           fill=(59, 70, 104))

    text(d, (100, 470), "Hoş geldin,\ngiriş yap", font("Inter_700Bold.ttf", 94), NAVY, spacing=16)
    d.line((100, 720, 240, 720), fill=NAVY, width=7)

    f_field = font("Inter_400Regular.ttf", 36)
    d.text((100, 830), "E-POSTA", font=font("Inter_600SemiBold.ttf", 26), fill=MUTED)
    y = field(d, 100, 880, 880, 126, "ornek@email.com", f_field)
    d.text((100, y + 70), "ŞİFRE", font=font("Inter_600SemiBold.ttf", 26), fill=MUTED)
    y = field(d, 100, y + 120, 880, 126, "••••••••", f_field, trailing="eye")

    d.text((980, y + 80), "Şifremi unuttum", font=font("Inter_500Medium.ttf", 32), fill=NAVY,
           anchor="rm")
    y = pill(d, 100, y + 150, 880, 132, "Giriş yap  →", font("Inter_600SemiBold.ttf", 40))
    bottom_link(d, W // 2, y + 96, font("Inter_400Regular.ttf", 34), font("Inter_700Bold.ttf", 34))
    return img


def concept_d() -> Image.Image:
    """Alt dok: üstte geniş başlık alanı, form ekranın altına yaslı."""
    img = gradient(BLUE, (W, H))
    add_blobs(img, [(160, 380, 420, (214, 226, 253)), (W - 40, 980, 380, (232, 226, 253))])
    d = ImageDraw.Draw(img)

    mark(img, W // 2, 200, 104)
    text(d, (W // 2, 430), "Hesabına giriş yap", font("Inter_700Bold.ttf", 78), NAVY, anchor="mm")
    text(d, (W // 2, 530), "Görev yap, hizmeti al.", font("Inter_400Regular.ttf", 36), BODY,
         anchor="mm")

    sheet_top = 700
    d.rounded_rectangle((0, sheet_top, W, H + 120), radius=90, fill=(250, 250, 255))
    d.line((W // 2 - 60, sheet_top + 44, W // 2 + 60, sheet_top + 44), fill=LINE, width=8)

    f_field = font("Inter_400Regular.ttf", 36)
    y = field(d, 100, sheet_top + 140, 880, 128, "E-posta adresin", f_field, filled=False,
              icon="mail")
    y = field(d, 100, y + 40, 880, 128, "Şifren", f_field, filled=False, icon="lock",
              trailing="eye")
    options_row(d, 100, y + 86, 880, font("Inter_500Medium.ttf", 32))
    y = pill(d, 100, y + 150, 880, 132, "Giriş yap  →", font("Inter_600SemiBold.ttf", 40))

    d.text((W // 2, y + 96), "veya", font=font("Inter_400Regular.ttf", 32), fill=MUTED, anchor="mm")
    y = pill(d, 100, y + 150, 880, 132, "Kayıt ol", font("Inter_600SemiBold.ttf", 40),
             fill=(255, 255, 255), fg=NAVY)
    d.rounded_rectangle((100, y - 132, 980, y), radius=66, outline=NAVY, width=4)
    return img


CONCEPTS = {
    "1-sade.png": concept_a,
    "2-kart.png": concept_b,
    "3-krem.png": concept_c,
    "4-alt-dok.png": concept_d,
}


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, build in CONCEPTS.items():
        path = OUT_DIR / name
        build().save(path, "PNG", optimize=True)
        print(f"{path}")


if __name__ == "__main__":
    main()
