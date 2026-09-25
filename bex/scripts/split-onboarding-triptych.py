"""Yan yana 3 ekranlı referansı slide-1/2/3 PNG olarak böler (dikey kırpma yok)."""
from pathlib import Path

from PIL import Image

SRC = Path(__file__).resolve().parents[1] / "assets" / "branding" / "onboarding" / "reference-triptych.jpg"
OUT = Path(__file__).resolve().parents[1] / "assets" / "branding" / "onboarding"
TARGET_WIDTH = 1290


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"Kaynak yok: {SRC}\n3'lü referansı reference-triptych.jpg olarak koy.")

    img = Image.open(SRC).convert("RGB")
    w, h = img.size
    OUT.mkdir(parents=True, exist_ok=True)

    for i in range(3):
        left = round(i * w / 3)
        right = round((i + 1) * w / 3) if i < 2 else w
        panel = img.crop((left, 0, right, h))
        scale = TARGET_WIDTH / panel.width
        panel = panel.resize(
            (TARGET_WIDTH, int(panel.height * scale)),
            Image.Resampling.LANCZOS,
        )
        path = OUT / f"slide-{i + 1}.png"
        panel.save(path, "PNG", compress_level=0)
        print(f"{path} {panel.size[0]}x{panel.size[1]} bytes={path.stat().st_size}")


if __name__ == "__main__":
    main()
