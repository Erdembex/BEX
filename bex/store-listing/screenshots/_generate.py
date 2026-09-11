# -*- coding: utf-8 -*-
"""Passla store/sunum ekran görüntüleri — 1080x1920, uygulama paleti.

Canlı uygulamadan çekim yapılamadığında sunum ve mağaza için aynı
ekranların markaya uygun taslaklarını üretir. Gerçek cihaz çekimi
geldiğinde bu dosyaların üzerine yazılır; isimler sabit kalır.

Kullanim:
    python bex/store-listing/screenshots/_generate.py
"""
from __future__ import annotations

import os

from PIL import Image, ImageDraw, ImageFont
import qrcode

W, H = 1080, 1920
DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(DIR, "..", "..", ".."))
BRANDING = os.path.join(ROOT, "bex", "assets", "branding")
LOGO = os.path.join(BRANDING, "passla-wordmark-white.png")
ICON = os.path.join(BRANDING, "passla-icon-mark.png")

BG = (1, 8, 16)
SURFACE = (4, 14, 24)
CARD = (8, 24, 40)
CARD_ALT = (12, 32, 52)
GOLD = (212, 184, 106)
GOLD_D = (184, 154, 74)
CREAM = (243, 235, 208)
TEXT = (240, 238, 233)
MUTED = (143, 168, 196)
SECONDARY = (184, 201, 220)
GREEN = (107, 191, 138)
RED = (201, 90, 98)
NAVY = (5, 31, 69)
WHITE = (255, 255, 255)
BORDER = (212, 184, 106, 90)


def font(size, bold=False):
    candidates = [
        (r"C:\Windows\Fonts\segoeuib.ttf", r"C:\Windows\Fonts\segoeui.ttf"),
        (r"C:\Windows\Fonts\calibrib.ttf", r"C:\Windows\Fonts\calibri.ttf"),
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
         "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    for b, r in candidates:
        path = b if bold else r
        if os.path.isfile(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


F_XL = font(54, True)
F_L = font(40, True)
F_M = font(30, True)
F_BODY = font(26)
F_SM = font(22)
F_XS = font(18)
F_CAPTION = font(16)


def new_canvas():
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img, "RGBA")


def rounded(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def status_bar(draw):
    draw.rectangle((0, 0, W, 72), fill=BG)
    draw.text((48, 22), "09:41", font=F_SM, fill=TEXT)
    draw.text((W - 210, 22), "5G   87%", font=F_SM, fill=MUTED)


def header(img, draw, title=None, show_logo=True, back=False):
    status_bar(draw)
    y = 88
    if back:
        draw.text((40, y + 8), "←", font=F_L, fill=GOLD)
    if show_logo and os.path.isfile(LOGO):
        logo = Image.open(LOGO).convert("RGBA")
        logo.thumbnail((280, 64))
        img.paste(logo, (W // 2 - logo.width // 2, y), logo)
    elif title:
        tw = draw.textlength(title, font=F_M)
        draw.text(((W - tw) / 2, y + 10), title, font=F_M, fill=TEXT)
    if title and show_logo:
        draw.text((W - 48 - draw.textlength(title, font=F_SM), y + 18), title, font=F_SM, fill=MUTED)
    return 180


def save(img, name):
    path = os.path.join(DIR, name)
    img.save(path, "PNG", optimize=True)
    print(f"  {name}")
    return path


def hub():
    img, draw = new_canvas()
    y = header(img, draw, show_logo=True)

    draw.text((48, y), "Günaydın, Mert", font=F_XL, fill=TEXT)
    y += 90

    tiles = [
        ("Görevler", "Yeni fırsatları keşfet"),
        ("Kupon Takası", "Kupon takası yap"),
        ("Cüzdan", "Kuponlarını gör"),
        ("Sohbet", "İşletmelerle yazış"),
        ("Başvurularım", "Aktif süreçlerin"),
        ("Profil", "Hesap bilgilerin"),
        ("Harita", "İldeki işletmeler"),
        ("Ayarlar", "Dil, tema, hesap"),
    ]
    gap, tw, th = 24, 492, 210
    for i, (label, hint) in enumerate(tiles):
        col, row = i % 2, i // 2
        x = 48 + col * (tw + gap)
        ty = y + row * (th + gap)
        rounded(draw, (x, ty, x + tw, ty + th), 28, CARD, GOLD + (80,), 2)
        rounded(draw, (x + 28, ty + 28, x + 88, ty + 88), 16, (212, 184, 106, 40))
        draw.ellipse((x + 42, ty + 42, x + 74, ty + 74), outline=GOLD, width=3)
        draw.text((x + 28, ty + 108), label, font=F_M, fill=TEXT)
        draw.text((x + 28, ty + 154), hint, font=F_XS, fill=MUTED)
        if label == "Sohbet":
            rounded(draw, (x + tw - 70, ty + 24, x + tw - 24, ty + 70), 23, RED)
            draw.text((x + tw - 56, ty + 32), "1", font=F_SM, fill=WHITE)
    save(img, "01_hub.png")


def tasks():
    img, draw = new_canvas()
    y = header(img, draw, title="Görevler", show_logo=True, back=True)

    rounded(draw, (48, y, W - 48, y + 88), 22, CARD, GOLD + (70,), 2)
    draw.text((76, y + 28), "web", font=F_BODY, fill=TEXT)
    draw.text((W - 140, y + 30), "Ara", font=F_SM, fill=GOLD)
    y += 120

    cards = [
        ("Passla Demo Spor Salonu", "Spor salonumuz için modern web sitesi tasarla",
         "3 ay üyelik + smoothie", "Sultanbeyli · Web tasarım"),
        ("Passla Demo Kuaför", "Online randevu sayfası kur",
         "5 kez ücretsiz saç kesimi", "Sultanbeyli · Web tasarım"),
    ]
    for name, title, reward, meta in cards:
        rounded(draw, (48, y, W - 48, y + 280), 28, CARD, GOLD + (50,), 1)
        draw.text((76, y + 28), name, font=F_XS, fill=GOLD)
        draw.text((76, y + 72), title, font=F_M, fill=TEXT)
        rounded(draw, (76, y + 170, 520, y + 222), 16, (212, 184, 106, 36))
        draw.text((96, y + 182), reward, font=F_SM, fill=GOLD)
        draw.text((76, y + 234), meta, font=F_XS, fill=MUTED)
        y += 304
    save(img, "02_gorevler.png")


def task_detail():
    img, draw = new_canvas()
    y = header(img, draw, title="Görev detayı", show_logo=False, back=True)

    draw.text((48, y), "Passla Demo Spor Salonu", font=F_SM, fill=GOLD)
    y += 44
    draw.text((48, y), "Spor salonumuz için", font=F_L, fill=TEXT)
    y += 52
    draw.text((48, y), "modern web sitesi tasarla", font=F_L, fill=TEXT)
    y += 80

    rounded(draw, (48, y, W - 48, y + 200), 24, CARD)
    body = (
        "Salonumuz için mobil uyumlu, üyelik formu içeren tek sayfalık "
        "bir web sitesi istiyoruz. Ders programı, iletişim ve galeri olmalı."
    )
    draw.text((76, y + 32), body[:52], font=F_BODY, fill=SECONDARY)
    draw.text((76, y + 76), body[52:104], font=F_BODY, fill=SECONDARY)
    draw.text((76, y + 120), body[104:], font=F_BODY, fill=SECONDARY)
    y += 232

    rounded(draw, (48, y, W - 48, y + 220), 24, (45, 80, 40))
    draw.text((76, y + 28), "Ödül", font=F_SM, fill=GREEN)
    draw.text((76, y + 76), "3 aylık sınırsız salon üyeliği", font=F_M, fill=TEXT)
    draw.text((76, y + 128), "+ haftalık protein smoothie", font=F_BODY, fill=CREAM)
    draw.text((76, y + 172), "Geçerlilik 180 gün · QR ile tek kullanım", font=F_XS, fill=MUTED)
    y += 260

    rounded(draw, (48, y, W - 48, y + 108), 28, GOLD)
    tw = draw.textlength("Başvur", font=F_M)
    draw.text(((W - tw) / 2, y + 34), "Başvur", font=F_M, fill=NAVY)
    save(img, "03_gorev_detay.png")


def chat():
    img, draw = new_canvas()
    y = header(img, draw, title="Passla Demo Spor Salonu", show_logo=False, back=True)
    y += 20

    def bubble(text, mine, extra_h=0):
        nonlocal y
        lines = []
        words = text.split()
        row = ""
        for word in words:
            probe = f"{row} {word}".strip()
            if draw.textlength(probe, font=F_BODY) < 620:
                row = probe
            else:
                lines.append(row)
                row = word
        if row:
            lines.append(row)
        h = 48 + len(lines) * 40 + extra_h
        max_w = max(draw.textlength(line, font=F_BODY) for line in lines) + 56
        if mine:
            x1 = W - 48 - max_w
            fill = (36, 70, 48)
        else:
            x1 = 48
            fill = CARD
        rounded(draw, (x1, y, x1 + max_w, y + h), 24, fill)
        ty = y + 20
        for line in lines:
            draw.text((x1 + 28, ty), line, font=F_BODY, fill=TEXT)
            ty += 40
        y += h + 24

    bubble("Merhaba, web sitesi görevine başvurmak istiyorum.", mine=True)
    bubble("7 günde teslim edebilir misiniz? Ödül 3 aylık üyelik + smoothie.", mine=False)

    rounded(draw, (48, y, W - 48, y + 240), 28, (28, 42, 28), GOLD, 2)
    draw.text((76, y + 24), "Teklif", font=F_XS, fill=GOLD)
    draw.text((76, y + 64), "3 aylık üyelik + smoothie", font=F_M, fill=TEXT)
    draw.text((76, y + 116), "Teslim: 7 gün", font=F_SM, fill=SECONDARY)
    rounded(draw, (76, y + 164, 300, y + 216), 18, GREEN)
    draw.text((110, y + 176), "Kabul edildi", font=F_SM, fill=WHITE)
    y += 268

    bubble("Teklifi kabul ettik. Teslimi uygulamadan yükleyebilirsiniz.", mine=False)
    save(img, "04_sohbet.png")


def coupon_qr():
    img, draw = new_canvas()
    y = header(img, draw, title="Cüzdan", show_logo=True, back=True)

    draw.text((48, y), "Aktif kupon", font=F_SM, fill=MUTED)
    y += 48
    rounded(draw, (48, y, W - 48, y + 1180), 36, CARD, GOLD + (80,), 2)
    draw.text((80, y + 36), "Passla Demo Spor Salonu", font=F_SM, fill=GOLD)
    draw.text((80, y + 88), "3 aylık sınırsız", font=F_L, fill=TEXT)
    draw.text((80, y + 148), "salon üyeliği", font=F_L, fill=TEXT)
    draw.text((80, y + 220), "+ haftalık protein smoothie", font=F_BODY, fill=SECONDARY)

    qr = qrcode.QRCode(box_size=12, border=2, error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data("passla://coupon/demo-mert-gym-membership")
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#051F45", back_color="#F3EBD0").convert("RGB")
    qr_img = qr_img.resize((620, 620), Image.Resampling.NEAREST)
    qx = (W - 620) // 2
    qy = y + 300
    rounded(draw, (qx - 24, qy - 24, qx + 644, qy + 644), 28, CREAM)
    img.paste(qr_img, (qx, qy))

    draw.text((80, y + 1000), "İşletme QR kodu okutunca kupon kapanır.", font=F_SM, fill=MUTED)
    draw.text((80, y + 1048), "Tek kullanım · 180 gün geçerli", font=F_SM, fill=GOLD)
    save(img, "05_kupon_qr.png")


def trade():
    img, draw = new_canvas()
    y = header(img, draw, title="Takas", show_logo=True, back=True)

    draw.text((48, y), "Açık ilanlar", font=F_L, fill=TEXT)
    y += 72

    rounded(draw, (48, y, W - 48, y + 340), 28, CARD, GOLD + (70,), 2)
    draw.text((80, y + 32), "Ayşe Demir", font=F_SM, fill=GOLD)
    draw.text((80, y + 80), "Kahve kuponumu spor salonu", font=F_M, fill=TEXT)
    draw.text((80, y + 132), "üyeliğiyle değişmek istiyorum.", font=F_M, fill=TEXT)
    rounded(draw, (80, y + 200, 420, y + 252), 16, (212, 184, 106, 36))
    draw.text((100, y + 212), "Veriyor: 20 kahve hakkı", font=F_SM, fill=GOLD)
    rounded(draw, (80, y + 268, 520, y + 320), 16, (107, 191, 138, 40))
    draw.text((100, y + 280), "İstiyor: 1 ay salon üyeliği", font=F_SM, fill=GREEN)
    y += 372

    rounded(draw, (48, y, W - 48, y + 220), 28, CARD)
    draw.text((80, y + 32), "Nasıl çalışır", font=F_M, fill=TEXT)
    draw.text((80, y + 88), "Kullanmadığın kuponu başka bir ödülle", font=F_BODY, fill=SECONDARY)
    draw.text((80, y + 132), "değiştir. Teklif gelince kabul veya ret.", font=F_BODY, fill=SECONDARY)
    save(img, "06_takas.png")


def business_panel():
    img, draw = new_canvas()
    y = header(img, draw, title="İşletme", show_logo=True)

    draw.text((48, y), "Yeni görev", font=F_L, fill=TEXT)
    y += 70

    fields = [
        ("Başlık", "Spor salonumuz için modern web sitesi tasarla"),
        ("Ödül tipi", "Salon üyeliği"),
        ("Miktar / süre", "3 ay"),
        ("Aranan beceri", "Web tasarım · Grafik tasarım"),
    ]
    for label, value in fields:
        draw.text((56, y), label, font=F_XS, fill=MUTED)
        y += 36
        rounded(draw, (48, y, W - 48, y + 92), 20, CARD, GOLD + (50,), 1)
        draw.text((76, y + 28), value, font=F_BODY, fill=TEXT)
        y += 120

    rounded(draw, (48, y, W - 48, y + 160), 24, CARD)
    draw.text((76, y + 28), "Ödül açıklaması", font=F_XS, fill=MUTED)
    draw.text((76, y + 72), "3 aylık sınırsız salon üyeliği", font=F_BODY, fill=TEXT)
    draw.text((76, y + 112), "+ haftalık protein smoothie", font=F_BODY, fill=TEXT)
    y += 192

    rounded(draw, (48, y, W - 48, y + 108), 28, GOLD)
    tw = draw.textlength("Görevi yayınla", font=F_M)
    draw.text(((W - tw) / 2, y + 34), "Görevi yayınla", font=F_M, fill=NAVY)
    save(img, "07_isletme_panel.png")


def main():
    print("Ekran görüntüleri üretiliyor...")
    hub()
    tasks()
    task_detail()
    chat()
    coupon_qr()
    trade()
    business_panel()
    print(f"Kayıt: {DIR}")


if __name__ == "__main__":
    main()
