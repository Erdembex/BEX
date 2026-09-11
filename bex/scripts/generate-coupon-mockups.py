"""Passla cüzdan kupon kartı tasarım önerileri — masaüstüne PNG üretir."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path.home() / "Desktop" / "Passla_Kupon_Tasarim_Onerileri"
W, H = 780, 360

NAVY = (5, 31, 69)
GOLD = (212, 184, 106)
CREAM = (240, 238, 233)
WHITE = (255, 255, 255)
LIGHT_GOLD = (243, 235, 208)
BLUE_GRAY = (228, 235, 244)
MUTED = (122, 132, 144)
GREEN = (45, 107, 74)

SAMPLE = {
    "category": "KUAFÖR",
    "business": "Berber Ali",
    "reward": "1 Ücretsiz Saç Kesimi",
    "code": "PSL-8K2M",
    "status": "Aktif",
    "expiry": "12 gün kaldı",
    "uses": "2/3 hak",
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def rounded_rect(draw: ImageDraw.ImageDraw, xy, radius: int, fill, outline=None, width: int = 1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def ticket_notches(img: Image.Image, color):
    draw = ImageDraw.Draw(img)
    for y in range(80, H - 80, 28):
        draw.ellipse((-14, y - 14, 14, y + 14), fill=color)
        draw.ellipse((W - 14, y - 14, W + 14, y + 14), fill=color)


def draw_text_block(draw, x, y, lines, fnt, color, gap=8):
    cy = y
    for text, size, bold in lines:
        f = font(size, bold)
        draw.text((x, cy), text, fill=color, font=f)
        cy += size + gap


def option_a_classic_ticket() -> Image.Image:
    img = Image.new("RGB", (W, H), CREAM)
    draw = ImageDraw.Draw(img)
    rounded_rect(draw, (24, 24, W - 24, H - 24), 20, WHITE, NAVY, 2)
    ticket_notches(img, CREAM)
    draw = ImageDraw.Draw(img)
    draw.rectangle((24, 24, W - 24, 92), fill=NAVY)
    draw.text((48, 44), SAMPLE["category"], fill=GOLD, font=font(22, True))
    draw.text((48, 118), SAMPLE["reward"], fill=NAVY, font=font(34, True))
    draw.text((48, 168), SAMPLE["business"], fill=MUTED, font=font(24))
    draw.text((48, 248), SAMPLE["code"], fill=NAVY, font=font(28, True))
    draw.text((48, 296), f"{SAMPLE['expiry']} · {SAMPLE['uses']}", fill=MUTED, font=font(22))
    rounded_rect(draw, (W - 170, 118, W - 48, 168), 12, LIGHT_GOLD, GOLD, 2)
    draw.text((W - 152, 132), SAMPLE["status"], fill=NAVY, font=font(24, True))
    draw.text((W - 120, 220), "✂", fill=GOLD, font=font(52))
    return img


def option_b_navy_premium() -> Image.Image:
    img = Image.new("RGB", (W, H), CREAM)
    draw = ImageDraw.Draw(img)
    rounded_rect(draw, (24, 24, W - 24, H - 24), 24, NAVY, GOLD, 3)
    draw.line([(48, 110), (W - 48, 110)], fill=GOLD, width=2)
    draw.text((48, 48), "PASSLA", fill=GOLD, font=font(20, True))
    draw.text((W - 170, 44), SAMPLE["status"], fill=WHITE, font=font(22, True))
    draw.text((48, 132), SAMPLE["reward"], fill=WHITE, font=font(36, True))
    draw.text((48, 188), SAMPLE["business"], fill=(200, 210, 220), font=font(24))
    draw.text((48, 252), SAMPLE["code"], fill=GOLD, font=font(30, True))
    draw.text((48, 300), SAMPLE["expiry"], fill=(180, 195, 210), font=font(22))
    rounded_rect(draw, (W - 120, 230, W - 48, 310), 16, GOLD)
    draw.text((W - 98, 262), "QR", fill=NAVY, font=font(28, True))
    return img


def option_c_gold_stripe() -> Image.Image:
    img = Image.new("RGB", (W, H), CREAM)
    draw = ImageDraw.Draw(img)
    rounded_rect(draw, (24, 24, W - 24, H - 24), 18, WHITE, (221, 216, 207), 2)
    draw.rectangle((24, 24, 44, H - 24), fill=GOLD)
    draw.ellipse((34, H // 2 - 16, 66, H // 2 + 16), fill=LIGHT_GOLD, outline=GOLD, width=2)
    draw.text((52, H // 2 - 18), "✂", fill=NAVY, font=font(28))
    draw.text((88, 52), SAMPLE["category"], fill=GOLD, font=font(20, True))
    draw.text((88, 82), SAMPLE["business"], fill=MUTED, font=font(24))
    draw.text((88, 130), SAMPLE["reward"], fill=NAVY, font=font(34, True))
    draw.text((88, 220), SAMPLE["code"], fill=NAVY, font=font(28, True))
    draw.text((88, 268), f"{SAMPLE['expiry']}  ·  {SAMPLE['uses']}", fill=MUTED, font=font(22))
    rounded_rect(draw, (W - 150, 52, W - 48, 96), 10, BLUE_GRAY, NAVY, 1)
    draw.text((W - 132, 64), SAMPLE["status"], fill=NAVY, font=font(22, True))
    return img


def option_d_hero_band() -> Image.Image:
    img = Image.new("RGB", (W, H), CREAM)
    draw = ImageDraw.Draw(img)
    rounded_rect(draw, (24, 24, W - 24, H - 24), 22, WHITE, NAVY, 2)
    for i in range(W - 48):
        t = i / (W - 48)
        r = int(NAVY[0] * (1 - t) + GOLD[0] * t)
        g = int(NAVY[1] * (1 - t) + GOLD[1] * t)
        b = int(NAVY[2] * (1 - t) + GOLD[2] * t)
        draw.line([(24 + i, 24), (24 + i, 120)], fill=(r, g, b))
    draw.text((48, 48), "☕", fill=WHITE, font=font(44))
    draw.text((130, 48), SAMPLE["category"], fill=WHITE, font=font(22, True))
    draw.text((130, 78), SAMPLE["business"], fill=(235, 235, 235), font=font(24))
    draw.text((48, 148), SAMPLE["reward"], fill=NAVY, font=font(34, True))
    draw.text((48, 220), SAMPLE["code"], fill=NAVY, font=font(28, True))
    draw.text((48, 268), SAMPLE["expiry"], fill=MUTED, font=font(22))
    rounded_rect(draw, (W - 170, 148, W - 48, 198), 12, LIGHT_GOLD, GOLD, 2)
    draw.text((W - 145, 162), SAMPLE["status"], fill=NAVY, font=font(24, True))
    return img


def option_e_minimal_pass() -> Image.Image:
    img = Image.new("RGB", (W, H), CREAM)
    draw = ImageDraw.Draw(img)
    rounded_rect(draw, (24, 24, W - 24, H - 24), 28, WHITE, NAVY, 2)
    draw.ellipse((56, 56, 136, 136), fill=BLUE_GRAY, outline=NAVY, width=2)
    draw.text((78, 82), "P", fill=NAVY, font=font(40, True))
    draw.text((168, 58), SAMPLE["business"], fill=MUTED, font=font(24))
    draw.text((168, 92), SAMPLE["reward"], fill=NAVY, font=font(32, True))
    draw.text((168, 150), SAMPLE["code"], fill=GOLD, font=font(30, True))
    draw.text((168, 200), SAMPLE["expiry"], fill=MUTED, font=font(22))
    draw.text((168, 240), SAMPLE["uses"], fill=GREEN, font=font(22, True))
    draw.polygon([(W - 80, 56), (W - 48, 72), (W - 80, 88)], fill=GOLD)
    draw.text((W - 170, 280), "Detay →", fill=NAVY, font=font(22, True))
    rounded_rect(draw, (W - 150, 250, W - 48, 300), 14, NAVY)
    draw.text((W - 128, 264), SAMPLE["status"], fill=WHITE, font=font(24, True))
    return img


OPTIONS = [
    ("01_klasik_bilet", "Klasik Bilet", "Beyaz kart, lacivert başlık, yan delikli bilet hissi", option_a_classic_ticket),
    ("02_lacivert_premium", "Lacivert Premium", "Tam lacivert kart, altın çerçeve — marka odaklı", option_b_navy_premium),
    ("03_altin_serit", "Altın Serit", "Mevcut yapının geliştirilmiş hali, sol altın şerit", option_c_gold_stripe),
    ("04_hero_bant", "Hero Bant", "Üstte lacivert→altın gradient, kategori vurgulu", option_d_hero_band),
    ("05_minimal_pass", "Minimal Pass", "Sade beyaz kart, büyük işletme harfi, temiz tipografi", option_e_minimal_pass),
]


def build_html():
    items = "\n".join(
        f"""    <section>
      <img src="{slug}.png" alt="{title}" />
      <h2>{title}</h2>
      <p>{desc}</p>
      <p class="pick">Seçmek için: <strong>{slug}.png</strong> dosya adını yaz</p>
    </section>"""
        for slug, title, desc, _ in OPTIONS
    )
    return f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Passla Kupon Tasarım Önerileri</title>
  <style>
    body {{ font-family: Segoe UI, sans-serif; background:#F0EEE9; color:#051F45; margin:0; padding:32px; }}
    h1 {{ margin-bottom:8px; }}
    .sub {{ color:#5A6572; margin-bottom:32px; }}
    .grid {{ display:grid; gap:28px; max-width:860px; }}
    section {{ background:#fff; border:1px solid #DDD8CF; border-radius:16px; padding:20px; }}
    img {{ width:100%; border-radius:12px; border:1px solid #EBE6DE; }}
    h2 {{ margin:16px 0 8px; }}
    p {{ margin:0; line-height:1.5; color:#2A4568; }}
    .pick {{ margin-top:10px; color:#051F45; }}
  </style>
</head>
<body>
  <h1>Passla — Cüzdan Kupon Kartı Önerileri</h1>
  <p class="sub">Örnek: Berber Ali · 1 Ücretsiz Saç Kesimi · PSL-8K2M</p>
  <div class="grid">
{items}
  </div>
</body>
</html>
"""


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    readme_lines = [
        "# Passla — Cüzdan Kupon Tasarım Önerileri",
        "",
        "Bu klasörde 5 farklı kupon kartı mockup'ı var.",
        "Galeriyi açmak için: **ONIZLEME.html** dosyasına çift tıkla.",
        "",
        "## Seçenekler",
        "",
    ]
    for slug, title, desc, fn in OPTIONS:
        img = fn()
        path = OUT / f"{slug}.png"
        img.save(path, "PNG")
        readme_lines.append(f"- **{title}** (`{slug}.png`) — {desc}")
    readme_lines.extend(
        [
            "",
            "## Nasıl seçilir?",
            "Beğendiğin dosya adını veya numarayı bana yaz (ör. `02_lacivert_premium`).",
            "Seçtiğin tasarımı `CouponCard` bileşenine uygularım.",
            "",
        ]
    )
    (OUT / "ONIZLEME.html").write_text(build_html(), encoding="utf-8")
    (OUT / "README.md").write_text("\n".join(readme_lines), encoding="utf-8")
    print(f"Saved {len(OPTIONS)} mockups to {OUT}")


if __name__ == "__main__":
    main()
