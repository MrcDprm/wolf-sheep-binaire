"""
Uygulama ikonlarını ve açılış görselini üretir.

Çalıştırma: python scripts/make-icons.py
Gerekenler: pip install playwright (Windows'taki Edge tarayıcısı kullanılır)

Taş çizimleri src/components/pieces/Piece.tsx ile aynıdır.
"""
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parent.parent / "assets" / "images"

FELT = "#5E8C3A"
STITCH = "rgba(255,248,236,0.4)"

SHEEP = """
<g fill="#FFF8EC" stroke="#E2D3B8" stroke-width="3">
  <circle cx="50" cy="28" r="17"/><circle cx="74" cy="38" r="17"/><circle cx="78" cy="62" r="17"/>
  <circle cx="60" cy="79" r="17"/><circle cx="36" cy="79" r="17"/><circle cx="20" cy="60" r="17"/>
  <circle cx="25" cy="36" r="17"/>
</g>
<circle cx="50" cy="55" r="30" fill="#FFF8EC"/>
<path d="M12 50 Q20 41 32 49 Q22 58 12 50 Z" fill="#3B3530"/>
<path d="M88 50 Q80 41 68 49 Q78 58 88 50 Z" fill="#3B3530"/>
<ellipse cx="50" cy="58" rx="19" ry="22" fill="#3B3530"/>
<circle cx="43" cy="54" r="3.6" fill="#FFF8EC"/><circle cx="57" cy="54" r="3.6" fill="#FFF8EC"/>
<ellipse cx="50" cy="68" rx="5" ry="3" fill="#5A524A"/>
"""

WOLF = """
<path d="M14 10 L38 30 L62 30 L86 10 L84 52 L50 92 L16 52 Z" fill="#4F5866" stroke="#3A414C" stroke-width="3" stroke-linejoin="round"/>
<path d="M22 22 L33 31 L24 40 Z M78 22 L67 31 L76 40 Z" fill="#2F353F"/>
<path d="M33 58 L50 50 L67 58 L50 88 Z" fill="#D5D9E0"/>
<path d="M30 46 L42 44 L38 50 Z" fill="#E8B23A"/><path d="M70 46 L58 44 L62 50 Z" fill="#E8B23A"/>
<path d="M44 64 L56 64 L50 71 Z" fill="#2F353F"/>
"""

# Tek renkli (Android tema ikonu): sadece dış hatlar dolu, yüz detayları oyuk
SHEEP_MONO = """
<g fill="#fff"><circle cx="50" cy="28" r="18"/><circle cx="74" cy="38" r="18"/><circle cx="78" cy="62" r="18"/>
<circle cx="60" cy="79" r="18"/><circle cx="36" cy="79" r="18"/><circle cx="20" cy="60" r="18"/>
<circle cx="25" cy="36" r="18"/><circle cx="50" cy="55" r="30"/></g>
<ellipse cx="50" cy="58" rx="19" ry="22" fill="#000"/>
"""
WOLF_MONO = """
<path d="M14 10 L38 30 L62 30 L86 10 L84 52 L50 92 L16 52 Z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
<path d="M33 58 L50 50 L67 58 L50 88 Z" fill="#000"/>
"""


def pair(sheep: str, wolf: str, size: float, cx: float, cy: float, overlap: float) -> str:
    """Koyun solda, kurt sağda; ikisi biraz üst üste."""
    scale = size / 100
    left = cx - size + overlap / 2
    right = cx - overlap / 2
    top = cy - size / 2
    return (
        f'<g transform="translate({right} {top + size * 0.04}) scale({scale})">{wolf}</g>'
        f'<g transform="translate({left} {top}) scale({scale})">{sheep}</g>'
    )


def felt_square(size: int, inset: float, radius: float) -> str:
    stitch = size * 0.012
    return (
        f'<rect width="{size}" height="{size}" fill="{FELT}"/>'
        f'<rect x="{inset}" y="{inset}" width="{size - 2 * inset}" height="{size - 2 * inset}" '
        f'rx="{radius}" fill="none" stroke="{STITCH}" stroke-width="{stitch}" '
        f'stroke-dasharray="{stitch * 3} {stitch * 2.2}"/>'
    )


def svg(size: int, body: str, mono: bool = False) -> str:
    # Tek renkli ikonda oyuklar maskeyle açılır
    if mono:
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}">'
            f'<defs><mask id="m">{body}</mask></defs>'
            f'<rect width="{size}" height="{size}" fill="#fff" mask="url(#m)"/></svg>'
        )
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}">{body}</svg>'


ICONS = {
    # iOS ve genel ikon: keçe zemin, dikiş, iki taş
    "icon.png": (1024, svg(1024, felt_square(1024, 92, 190) + pair(SHEEP, WOLF, 440, 512, 520, 70))),
    # Android: arka plan app.json'da düz keçe rengi; ön plan güvenli alanda (ortadaki %66)
    "android-icon-foreground.png": (1024, svg(1024, pair(SHEEP, WOLF, 330, 512, 516, 52))),
    "android-icon-monochrome.png": (1024, svg(1024, pair(SHEEP_MONO, WOLF_MONO, 330, 512, 516, 52), mono=True)),
    # Açılış görseli: saydam, gökyüzü rengi app.json'dan gelir
    "splash-icon.png": (1024, svg(1024, pair(SHEEP, WOLF, 470, 512, 512, 70))),
    # Web sekmesi
    "favicon.png": (48, svg(48, f'<rect width="48" height="48" rx="10" fill="{FELT}"/>' + pair(SHEEP, WOLF, 25, 24, 24, 3))),
}


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge")
        for name, (size, markup) in ICONS.items():
            page = browser.new_page(viewport={"width": size, "height": size})
            page.set_content(f'<html><body style="margin:0;background:transparent">{markup}</body></html>')
            page.screenshot(path=str(OUT / name), omit_background=True)
            page.close()
            print(name)
        browser.close()


if __name__ == "__main__":
    main()
