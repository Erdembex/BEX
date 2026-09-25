"""Onboarding referansından (design/onboarding-reference.jpg) illüstrasyon ve SS logosu çıkarır.

İllüstrasyonlar, varsa Real-ESRGAN ile 4x büyütülmüş design/onboarding-reference-x4.png
dosyasından kesilir:
  realesrgan-ncnn-vulkan -i design/onboarding-reference.jpg -o design/onboarding-reference-x4.png
                         -n realesrgan-x4plus-anime -s 4
"""
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "design" / "onboarding-reference.jpg"
SRC_X4 = ROOT / "design" / "onboarding-reference-x4.png"
OUT = ROOT / "assets" / "branding" / "onboarding"

# (left, top, right, bottom) — referans 1024x682 piksel koordinatları
ILLUSTRATIONS = {
    "illustration-1.webp": (14, 258, 336, 482),
    "illustration-2.webp": (352, 262, 673, 476),
    "illustration-3.webp": (690, 252, 1013, 500),
}
WEBP_QUALITY = 92
LOGO_BOX = (141, 38, 211, 85)
LOGO_NAVY = (23, 38, 79)

ILLUSTRATION_WIDTH = 1290
FEATHER_Y = 0.14
FEATHER_X = 0.07
LOGO_SCALE = 12


def upscale_sharp(img: Image.Image, target_w: int) -> Image.Image:
    current = img
    while current.width * 2 <= target_w:
        current = current.resize((current.width * 2, current.height * 2), Image.Resampling.LANCZOS)
        current = current.filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2))
    scale = target_w / current.width
    current = current.resize((target_w, round(current.height * scale)), Image.Resampling.LANCZOS)
    return current.filter(ImageFilter.UnsharpMask(radius=2.2, percent=80, threshold=2))


def feather_mask(w: int, h: int) -> Image.Image:
    fx = max(1, int(w * FEATHER_X))
    fy = max(1, int(h * FEATHER_Y))
    def smooth(t: float) -> float:
        t = max(0.0, min(1.0, t))
        return t * t * (3 - 2 * t)

    col = [smooth(min(x / fx, (w - 1 - x) / fx)) for x in range(w)]
    row = [smooth(min(y / fy, (h - 1 - y) / fy)) for y in range(h)]
    mask = Image.new("L", (w, h))
    mask.putdata([int(255 * r * c) for r in row for c in col])
    return mask


def export_illustrations(img: Image.Image) -> None:
    x4 = Image.open(SRC_X4).convert("RGB") if SRC_X4.is_file() else None
    for name, box in ILLUSTRATIONS.items():
        if x4 is not None:
            art = x4.crop(tuple(v * 4 for v in box))
            art = art.resize(
                (ILLUSTRATION_WIDTH, round(art.height * ILLUSTRATION_WIDTH / art.width)),
                Image.Resampling.LANCZOS,
            )
        else:
            art = upscale_sharp(img.crop(box), ILLUSTRATION_WIDTH)
        art = art.convert("RGBA")
        art.putalpha(feather_mask(*art.size))
        path = OUT / name
        art.save(path, "WEBP", quality=WEBP_QUALITY, alpha_quality=100, method=6)
        print(f"{path.name} {art.size[0]}x{art.size[1]}")


def export_logo(img: Image.Image) -> None:
    gray = img.crop(LOGO_BOX).convert("L")
    ink, bg = gray.getextrema()
    darkness = gray.point(lambda v: int(255 * max(0.0, min(1.0, (bg - v) / max(1, bg - ink)))))
    big = darkness.resize(
        (darkness.width * LOGO_SCALE, darkness.height * LOGO_SCALE),
        Image.Resampling.BICUBIC,
    ).filter(ImageFilter.GaussianBlur(LOGO_SCALE * 0.45))
    # Keskin kenar: yumuşak maskeyi dar bir geçiş bandıyla eşikle.
    alpha = big.point(lambda v: int(255 * max(0.0, min(1.0, (v - 100) / 40))))
    bbox = alpha.getbbox()
    if bbox:
        pad = LOGO_SCALE * 2
        alpha = alpha.crop(
            (
                max(0, bbox[0] - pad),
                max(0, bbox[1] - pad),
                min(alpha.width, bbox[2] + pad),
                min(alpha.height, bbox[3] + pad),
            )
        )
    logo = Image.new("RGBA", alpha.size, LOGO_NAVY + (0,))
    logo.putalpha(alpha)
    path = OUT / "ss-mark.png"
    logo.save(path, "PNG", optimize=True)
    print(f"{path.name} {logo.size[0]}x{logo.size[1]}")


def main() -> None:
    img = Image.open(SRC).convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)
    export_illustrations(img)
    export_logo(img)


if __name__ == "__main__":
    main()
