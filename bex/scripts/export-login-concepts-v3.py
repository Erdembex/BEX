"""Giriş ekranı önerileri — 3. tur: tuğla duvar + duvar lambası + spreyle PASSLA.

Duvar prosedürel üretilir; PASSLA yazısı duvara boya gibi işlenir (harç
derzleri ve lamba ışığı yazının üstünden geçer, kenarlarda sprey saçılması
vardır). Form kısmı onboarding dilinde: Inter, pill alanlar, lacivert buton.
Klavye açıkken alanların kapanmadığı durum ayrı görselde gösterilir.
"""
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from _login_ui import (
    BODY,
    LINE,
    MUTED,
    NAVY,
    WHITE,
    bottom_link,
    field,
    font,
    keyboard,
    options_row,
    pill,
    spaced_text,
)

BRANDING = Path(__file__).resolve().parents[1] / "assets" / "branding"
# PASSLA yazısı, eski giriş duvarındaki grafitinin kendisinden çıkarılır.
GRAFFITI_SRC = BRANDING / "auth-login-wall@3x.png"
GRAFFITI_BOX = (350, 560, 1240, 900)
OUT_DIR = Path.home() / "Desktop" / "Passla-giris-tasarimlari"

W, H = 1080, 2160
# Onboarding / UI ile aynı lacivert (#17264F)
BRICK = np.array(NAVY, np.float32)
PAINT = np.array([248, 249, 252], np.float32)
LAMP_WARM = np.array([1.10, 0.94, 0.82], np.float32)


def brick_shade(w: int, h: int, rng) -> np.ndarray:
    bh, bw, mortar = 56, 172, 8
    ys = np.arange(h, dtype=np.int32)[:, None]
    xs = np.arange(w, dtype=np.int32)[None, :]
    row = ys // bh
    xoff = (xs + (row % 2) * (bw // 2))
    xin, yin = xoff % bw, ys % bh

    idx = (row * 977 + (xoff // bw) * 131) % 499
    shade = 0.93 + 0.14 * (np.sin(idx.astype(np.float32) * 1.7) * 0.5 + 0.5)
    shade = np.broadcast_to(shade, (h, w)).copy()

    shade[(xin < mortar) | (yin < mortar)] *= 0.62
    shade += np.where(yin == mortar, 0.10, 0.0)
    shade -= np.where(yin > bh - 5, 0.06, 0.0)
    shade += rng.normal(0, 0.035, (h, w)).astype(np.float32)
    shade = np.asarray(
        Image.fromarray((np.clip(shade, 0.25, 1.35) * 180).astype(np.uint8))
        .filter(ImageFilter.GaussianBlur(0.7)),
        np.float32,
    ) / 180.0
    return shade


def _blur_light_map(arr: np.ndarray) -> np.ndarray:
    return np.asarray(
        Image.fromarray((np.clip(arr, 0, 2.4) * 100).astype(np.uint8)).filter(ImageFilter.GaussianBlur(9)),
        np.float32,
    ) / 100.0


def lamp_maps(w: int, h: int, lx: float, ly: float) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.hypot(xs - lx, ys - ly)
    glow = np.exp(-((d / (w * 0.44)) ** 2))
    hotspot = np.exp(-((d / (w * 0.17)) ** 2))

    dy = ys - ly
    half = 70.0 + np.maximum(dy, 0) * 0.92
    t = np.clip(1.0 - np.abs(xs - lx) / half, 0.0, 1.0)
    falloff = np.clip(1.0 - dy / (h * 1.05), 0.0, 1.0)
    cone = np.where(dy > 0, t ** 1.7 * falloff, 0.0)

    # Tuğla yüzeyi ~#17264F; lamba konisi belirgin sıcak ışık
    light = 0.96 + 0.26 * glow + 0.62 * cone + 0.50 * hotspot
    return _blur_light_map(light), _blur_light_map(cone), _blur_light_map(hotspot)


def graffiti_mask() -> Image.Image:
    """Referans duvardaki beyaz PASSLA boyasını maskeye çevirir."""
    crop = np.asarray(Image.open(GRAFFITI_SRC).convert("L").crop(GRAFFITI_BOX), np.float32)
    m = np.clip((crop - 115.0) / 75.0, 0.0, 1.0)
    mask = Image.fromarray((m * 255).astype(np.uint8))
    bbox = mask.point(lambda v: 255 if v > 40 else 0).getbbox()
    return mask.crop(bbox) if bbox else mask


def spray_alpha(w: int, h: int, cx: int, cy: int, width: int, rng) -> np.ndarray:
    paint = graffiti_mask()
    hh = round(paint.height * width / paint.width)
    paint = paint.resize((width, hh), Image.Resampling.LANCZOS)

    mask = Image.new("L", (w, h), 0)
    mask.paste(paint, (cx - width // 2, cy - hh // 2))

    base = np.asarray(mask, np.float32) / 255.0
    # Harflerin kendisi dolu beyaz kalır; sprey etkisi yalnızca kenarlardaki
    # ince saçılmadan gelir (referans duvardaki gibi net okunur).
    near = np.asarray(mask.filter(ImageFilter.MaxFilter(7)), np.float32) / 255.0
    speck = (rng.random((h, w)) < (near - base) * 0.22).astype(np.float32) * 0.8
    return np.clip(base + speck, 0.0, 1.0)


def wall(w: int, h: int, *, lamp_y: int = 150, mark_y: int | None = None,
         mark_width: int = 720, seed: int = 7) -> Image.Image:
    rng = np.random.default_rng(seed)
    lx = w / 2
    mark_y = mark_y if mark_y is not None else int(h * 0.52)

    a = spray_alpha(w, h, int(lx), mark_y, mark_width, rng)
    alpha = a[..., None]
    rgb = BRICK[None, None, :] * (1 - alpha) + PAINT[None, None, :] * alpha

    # Boya derzleri hafifçe taşır ama beyazlığını korur.
    keep = 0.88 * a
    shade = brick_shade(w, h, rng)
    rgb *= (shade * (1 - keep) + keep)[..., None]

    light, cone, hotspot = lamp_maps(w, h, lx, lamp_y + 40)
    lit = light * (1 - keep) + np.maximum(light, 0.92) * keep
    # Sıcak ton yalnızca lamba konisinde; yan duvarlar #17264F kalır
    warm = np.clip(cone * 0.95 + hotspot * 0.62, 0, 1) * (1 - 0.75 * a)
    tint = 1.0 + (LAMP_WARM - 1.0) * warm[..., None]
    rgb *= lit[..., None] * tint

    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    vig = 1.0 - 0.18 * np.clip(((xs - w / 2) / (w * 0.78)) ** 2 + ((ys - h * 0.45) / (h * 1.0)) ** 2,
                               0, 1)
    rgb *= (vig * (1 - keep) + keep)[..., None]
    rgb += rng.normal(0, 3.2, (h, w, 3)).astype(np.float32)

    img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
    draw_lamp(img, lx, lamp_y)
    return img


def draw_lamp(img: Image.Image, cx: float, y: int) -> None:
    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle((cx - 16, y - 58, cx + 16, y - 16), fill=(18, 30, 62))
    d.polygon([(cx - 108, y + 12), (cx + 108, y + 12), (cx + 74, y - 18), (cx - 74, y - 18)],
              fill=(28, 44, 88))
    d.rounded_rectangle((cx - 104, y + 6, cx + 104, y + 20), radius=7, fill=(255, 238, 205))

    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((cx - 240, y - 100, cx + 240, y + 200), fill=(255, 228, 175, 150))
    img.paste(Image.alpha_composite(img.convert("RGBA"),
                                    glow.filter(ImageFilter.GaussianBlur(78))).convert("RGB"))


def form(d, x, w, y, *, compact=False, on_light=True):
    """Ortak giriş formu; compact=True klavye açık durumu için."""
    f_field = font("Inter_400Regular.ttf", 36)
    fill = WHITE if on_light else (255, 255, 255)
    y = field(d, x, y, w, 126, "E-posta adresin", f_field, fill=fill, ic="mail")
    y = field(d, x, y + 36, w, 126, "Şifren", f_field, fill=fill, ic="lock", trailing="eye")
    options_row(d, x, y + 80, w, font("Inter_500Medium.ttf", 31))
    y = pill(d, x, y + 138, w, 130, "Giriş yap  →", font("Inter_600SemiBold.ttf", 40))
    if not compact:
        bottom_link(d, W // 2, y + 92, font("Inter_400Regular.ttf", 33),
                    font("Inter_700Bold.ttf", 33))
    return y


def slogan(d, cx, y, fill=(196, 205, 232)):
    spaced_text(d, (cx, y), "GÖREV YAP · HİZMET AL", font("Inter_600SemiBold.ttf", 27), fill, 6,
                anchor_center=True)


# --- Varyantlar ---------------------------------------------------------------

def concept_9_duvar_sayfa() -> Image.Image:
    """Duvar üstte, form aşağıda açık renkli sayfada (klavye için en güvenlisi)."""
    img = Image.new("RGB", (W, H), (248, 248, 253))
    wall_h = 1180
    img.paste(wall(W, wall_h, lamp_y=150, mark_y=620, mark_width=760), (0, 0))

    d = ImageDraw.Draw(img)
    slogan(d, W // 2, 880)

    sheet = wall_h - 70
    d.rounded_rectangle((0, sheet, W, H + 140), radius=92, fill=(249, 249, 254))
    d.text((100, sheet + 118), "Hesabına giriş yap", font=font("Inter_700Bold.ttf", 64), fill=NAVY)
    d.text((100, sheet + 208), "İşlemlerine devam etmek için bilgilerini gir.",
           font=font("Inter_400Regular.ttf", 33), fill=BODY)
    form(d, 100, 880, sheet + 300)
    return img


def concept_10_duvar_cam() -> Image.Image:
    """Tam ekran duvar; form buzlu (frosted) açık kartta."""
    img = wall(W, H, lamp_y=190, mark_y=560, mark_width=800, seed=11)
    d = ImageDraw.Draw(img)
    slogan(d, W // 2, 820)

    box = (70, 950, W - 70, 1960)
    crop = img.crop(box).filter(ImageFilter.GaussianBlur(26))
    card = Image.new("RGBA", crop.size, (255, 255, 255, 214))
    frosted = Image.alpha_composite(crop.convert("RGBA"), card)

    mask = Image.new("L", crop.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, crop.size[0], crop.size[1]), radius=76, fill=255)
    img.paste(frosted.convert("RGB"), (box[0], box[1]), mask)

    d = ImageDraw.Draw(img)
    d.rounded_rectangle(box, radius=76, outline=(255, 255, 255, 120), width=3)
    d.text((W // 2, box[1] + 110), "Tekrar hoş geldin", font=font("Inter_700Bold.ttf", 62),
           fill=NAVY, anchor="mm")
    form(d, 140, 800, box[1] + 200)
    return img


def concept_11_duvar_krem() -> Image.Image:
    """Duvar + onboarding 2. adımın krem sayfası."""
    img = Image.new("RGB", (W, H), (255, 248, 238))
    wall_h = 1120
    img.paste(wall(W, wall_h, lamp_y=140, mark_y=600, mark_width=740, seed=5), (0, 0))

    d = ImageDraw.Draw(img)
    slogan(d, W // 2, 850)

    sheet = wall_h - 70
    d.rounded_rectangle((0, sheet, W, H + 140), radius=92, fill=(255, 249, 240))
    d.multiline_text((100, sheet + 110), "Hoş geldin,\ngiriş yap",
                     font=font("Inter_700Bold.ttf", 72), fill=NAVY, spacing=12)
    d.rounded_rectangle((100, sheet + 300, 244, sheet + 308), radius=4, fill=NAVY)
    form(d, 100, 880, sheet + 370)
    return img


def concept_12_klavye() -> Image.Image:
    """Klavye açıkken: duvar küçülür, alanlar ve buton görünür kalır."""
    img = Image.new("RGB", (W, H), (249, 249, 254))
    wall_h = 520
    img.paste(wall(W, wall_h, lamp_y=90, mark_y=330, mark_width=560), (0, 0))

    d = ImageDraw.Draw(img)
    sheet = wall_h - 60
    d.rounded_rectangle((0, sheet, W, H), radius=80, fill=(249, 249, 254))
    d.text((100, sheet + 96), "Hesabına giriş yap", font=font("Inter_700Bold.ttf", 56), fill=NAVY)
    form(d, 100, 880, sheet + 180, compact=True)

    kb_h = 820
    keyboard(d, 0, H - kb_h, W, kb_h)
    d.text((W // 2, H - kb_h - 44), "klavye açıkken form yukarı kayar",
           font=font("Inter_500Medium.ttf", 28), fill=MUTED, anchor="mm")
    return img


CONCEPTS = {
    "9-duvar-sayfa.png": concept_9_duvar_sayfa,
    "10-duvar-cam.png": concept_10_duvar_cam,
    "11-duvar-krem.png": concept_11_duvar_krem,
    "12-duvar-klavye.png": concept_12_klavye,
}


def save_with_retry(img: Image.Image, path: Path, attempts: int = 8) -> None:
    """Görsel görüntüleyicide açıkken dosya kilitlenebiliyor."""
    for i in range(attempts):
        try:
            img.save(path, "PNG", optimize=True)
            return
        except OSError:
            if i == attempts - 1:
                raise
            time.sleep(1.5)


def export_app_background() -> None:
    """Uygulamanın giriş ekranı arka planı (grafiti + lamba), WebP."""
    bg = wall(1290, 2796, lamp_y=300, mark_y=860, mark_width=1010, seed=7)
    path = BRANDING / "auth-wall-passla.webp"
    bg.save(path, "WEBP", quality=90, method=6)
    print(f"{path} {bg.size[0]}x{bg.size[1]} bytes={path.stat().st_size}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, build in CONCEPTS.items():
        path = OUT_DIR / name
        save_with_retry(build(), path)
        print(path)
    export_app_background()


if __name__ == "__main__":
    main()
