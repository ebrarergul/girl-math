# GIRL MATH UYGULAMA SİMGESİ (26 Kasım, Ebrar seçti: taslak 3)
# Krem zemin, New York italik pembe "g", kulağı kalple biter. Altında iPhone "Girl Math" yazar (app.json name).
# Çıktılar: icon.png (1024, iOS + genel), splash-icon.png (açılış, şeffaf), android ön/arka/mono, favicon.
# Sadece Mac'te çalışır (New York yazı tipi macOS'ta var). Çalıştırma (proje klasöründe):
#   python3 scripts/make-icon.py assets/images
# Yedek fikir (taslak 5, "pudra"): zemin pudra pembe geçiş + koyu gül "g" – beğenilmezse buraya eklenir.
import sys
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1]
CREAM = (245, 241, 235)
PINK = (214, 31, 105)
FONT = '/System/Library/Fonts/NewYorkItalic.ttf'
S = 4  # 4 kat büyük çizip küçültüyoruz (kenarlar pürüzsüz olsun)

def heart_points(cx, cy, w, steps=400):
    # Klasik kalp eğrisi (parametrik), genişliği w olacak şekilde ölçeklenir
    import math
    pts = []
    for i in range(steps):
        t = 2 * math.pi * i / steps
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((x, y))
    k = w / 32
    return [(cx + x * k, cy + y * k) for x, y in pts]

def draw_mark(size, bg, color, mark_scale=1.0):
    """size x size görsel; bg None ise şeffaf. mark_scale: işaretin boyutu (1 = simgedeki gibi)."""
    big = size * S
    img = Image.new('RGBA', (big, big), bg + (255,) if bg else (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, int(big * 0.80 * mark_scale))
    font.set_variation_by_axes([256, 640, 0])  # optik boyut, kalınlık ~yarı kalın, GRAD
    # "g" harfini görünür sınırlarına göre ortala (kalp sağ üstte)
    l, t, r, b = d.textbbox((0, 0), 'g', font=font)
    gw, gh = r - l, b - t
    cx, cy = big * 0.48, big * 0.54
    d.text((cx - gw / 2 - l, cy - gh / 2 - t), 'g', font=font, fill=color + (255,))
    # Kalp: harfin sağ üstünde (italik "g"nin kulağı gibi)
    hx = cx + gw * 0.42
    hy = cy - gh * 0.47
    d.polygon(heart_points(hx, hy, big * 0.165 * mark_scale), fill=color + (255,))
    return img.resize((size, size), Image.LANCZOS)

icon = draw_mark(1024, CREAM, PINK)
icon.convert('RGB').save(f'{OUT}/icon.png')  # iOS simgesinde şeffaflık olmamalı
draw_mark(1024, None, PINK, 0.95).save(f'{OUT}/splash-icon.png')
# Android uyarlanabilir simge: ön plan güvenli alanda (ortadaki ~%66), arka plan düz krem
draw_mark(512, None, PINK, 0.62).save(f'{OUT}/android-icon-foreground.png')
Image.new('RGBA', (512, 512), CREAM + (255,)).save(f'{OUT}/android-icon-background.png')
draw_mark(512, None, (255, 255, 255), 0.62).save(f'{OUT}/android-icon-monochrome.png')
draw_mark(48, CREAM, PINK).save(f'{OUT}/favicon.png')
print('ok')
