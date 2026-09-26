"""Giriş ekranı konsept görselleri için ortak form/tipografi yardımcıları."""
from pathlib import Path

from PIL import ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONTS = ROOT / "assets" / "fonts"
BRANDING = ROOT / "assets" / "branding"

NAVY = (23, 38, 79)
BODY = (30, 41, 59)
MUTED = (100, 112, 140)
LINE = (206, 210, 232)
WHITE = (255, 255, 255)


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


def spaced_text(draw, xy, s, f, fill, tracking, anchor_center=False) -> None:
    widths = [draw.textlength(ch, font=f) for ch in s]
    x, y = xy
    if anchor_center:
        x -= (sum(widths) + tracking * (len(s) - 1)) / 2
    for ch, cw in zip(s, widths):
        draw.text((x, y), ch, font=f, fill=fill, anchor="lm")
        x += cw + tracking


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


def field(draw, x, y, w, h, label, f, *, fill=None, outline=LINE, ic=None, trailing=None,
          label_color=MUTED) -> int:
    draw.rounded_rectangle((x, y, x + w, y + h), radius=h // 2, fill=fill, outline=outline, width=3)
    tx = x + 46
    if ic:
        icon(draw, ic, x + 44, y + h // 2, c=label_color)
        tx = x + 100
    draw.text((tx, y + h // 2), label, font=f, fill=label_color, anchor="lm")
    if trailing:
        icon(draw, trailing, x + w - 52, y + h // 2, c=label_color)
    return y + h


def pill(draw, x, y, w, h, label, f, *, fill=NAVY, fg=WHITE, outline=None) -> int:
    draw.rounded_rectangle((x, y, x + w, y + h), radius=h // 2, fill=fill,
                           outline=outline, width=4 if outline else 0)
    draw.text((x + w // 2, y + h // 2), label, font=f, fill=fg, anchor="mm")
    return y + h


def options_row(draw, x, y, w, f, *, text_color=BODY, link_color=NAVY, box=LINE, tick=NAVY) -> None:
    draw.rounded_rectangle((x, y - 15, x + 30, y + 15), radius=9, outline=box, width=3)
    draw.line((x + 8, y + 1, x + 13, y + 8), fill=tick, width=4)
    draw.line((x + 13, y + 8, x + 23, y - 8), fill=tick, width=4)
    draw.text((x + 50, y), "Beni hatırla", font=f, fill=text_color, anchor="lm")
    draw.text((x + w, y), "Şifremi unuttum", font=f, fill=link_color, anchor="rm")


def bottom_link(draw, cx, y, f_reg, f_bold, muted=MUTED, strong=NAVY) -> None:
    a, b = "Hesabın yok mu?  ", "Kayıt ol"
    wa = draw.textlength(a, font=f_reg)
    x = cx - (wa + draw.textlength(b, font=f_bold)) / 2
    draw.text((x, y), a, font=f_reg, fill=muted, anchor="lm")
    draw.text((x + wa, y), b, font=f_bold, fill=strong, anchor="lm")


def keyboard(draw, x, y, w, h, *, bg=(226, 228, 236), key=(252, 252, 254), ink=(96, 104, 126)):
    """Klavye açıkken formun kapanmadığını göstermek için basit taslak."""
    draw.rectangle((x, y, x + w, y + h), fill=bg)
    rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]
    pad, gap = 14, 10
    kh = (h - 150) / 4
    f = font("Inter_500Medium.ttf", 30)
    ky = y + 26
    for r, row in enumerate(rows):
        n = len(row)
        kw = (w - 2 * pad - gap * (n - 1)) / 10
        row_w = n * kw + gap * (n - 1)
        kx = x + (w - row_w) / 2
        for ch in row:
            draw.rounded_rectangle((kx, ky, kx + kw, ky + kh), radius=12, fill=key)
            draw.text((kx + kw / 2, ky + kh / 2), ch, font=f, fill=ink, anchor="mm")
            kx += kw + gap
        ky += kh + gap
    draw.rounded_rectangle((x + pad + 160, ky, x + w - pad - 160, ky + kh), radius=12, fill=key)
    draw.text((x + w / 2, ky + kh / 2), "boşluk", font=f, fill=ink, anchor="mm")
