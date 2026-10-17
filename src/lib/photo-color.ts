/**
 * GIRL MATH – FOTOĞRAFTAN RENK TAHMİNİ
 *
 * Kıyafet fotoğrafının baskın rengini bulur ve COLORS listesindeki en yakın renge eşler.
 * İnternet / yapay zekâ yok, her şey telefonda:
 * 1) Fotoğraf küçük bir kopyaya küçültülür (160 piksel genişlik) ve pikselleri okunur.
 * Önce DESEN kontrolü: desenli kumaşta yan yana pikseller arasında çok sert geçiş olur (çizgi
 *    kenarları, ekose köşeleri), düz kumaşta olmaz. Kıyafet piksellerinin yeterince çoğunda sert
 *    geçiş varsa "Desenli" denir. (Renk gruplarına bakarak bulunamıyordu: küçültünce çizgiler
 *    karışıp ara bir ton oluşuyor, çizgili bluz "gri" çıkıyordu.)
 * 2) Fotoğrafın ORTASINDAKİ pikseller (kıyafet genelde ortadadır) renk gruplarına ayrılır
 *    (k-means: benzer renkler aynı gruba toplanır, her grubun ortalama rengi bulunur). Böylece
 *    bir kazağın gölgeli ve aydınlık yerleri tek bir "lacivert grubu" sayılır.
 * 3) Kenarlarda çok görülen grup arka plandır (ürün fotoğraflarındaki beyaz/gri zemin), elenir.
 *    Birbirine çok yakın gruplar birleştirilir.
 * 4) En büyük grubun ortalama rengi listedeki en yakın renge eşlenir (insan gözüne yakın renk
 *    uzaklığıyla, Lab). Çok farklı iki büyük grup varsa "Desenli" (çizgili, kareli...).
 *    Kıyafet bulunamazsa null döner.
 *
 * Bu bir TAHMİN: ekranda "doğru mu?" diye sorulur, kullanıcı değiştirebilir.
 * Ekranda kullanımı:
 *   const color = await guessPhotoColor(photoUri(fileName));  // 'Yeşil' ya da null
 * (Ebrar ekledi, Onur'un haberi var – kural 2: yeni şey eklemek serbest)
 */

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { decode } from 'jpeg-js';

import { COLORS, type ColorName } from '@/lib/colors';

// Küçültülen fotoğrafın genişliği (piksel). Büyüdükçe yavaşlar, küçüldükçe ayrıntı kaybolur
// (küçükken çizgili bluzun çizgileri birbirine karışıp griye dönüyordu).
const SAMPLE_WIDTH = 160;
// Desen: iki piksel ötesiyle renk farkı bundan büyükse "sert geçiş" sayılır; kıyafet
// piksellerinin bu oranından fazlası sert geçişse desenli. (Denemede desenliler %13-70,
// düz renkliler %0-5 çıktı.)
const SHARP_STEP = 2;
const SHARP_DISTANCE = 25;
const PATTERN_SHARP_SHARE = 0.09;
// Kenarlardan bu oranda boşluk bırakılıp ortadaki kısma bakılır
const CENTER_MARGIN = 0.15;
// Kaç renk grubuna ayrılır ve gruplar kaç turda yerine oturur
const CLUSTER_COUNT = 5;
const CLUSTER_ROUNDS = 10;
// Kenar piksellerinin bu kadarı bir gruba bu uzaklıktan yakınsa o grup arka plandır
const BACKGROUND_EDGE_SHARE = 0.3;
const BACKGROUND_DISTANCE = 12;
// Renksiz (siyah/gri/beyaz) sayılma sınırı: canlılığı (Lab'de a-b uzaklığı) bundan azsa ve
// sıcak (sarımsı) değilse renk listesine bakılmaz, sadece açıklığına göre karar verilir.
// (Yoksa listede siyahla gri arasında renk olmadığı için koyu griler kot mavisine düşüyordu.)
const NEUTRAL_CHROMA = 5; // 8 olunca açık kot (7) ve pudra pembe (6) de gri/siyah sanılıyordu
const WARM_YELLOWNESS = 5; // Bundan sarımsı tonlar (krem, ekru) renksiz sayılmaz, bej olur
const BLACK_MAX_LIGHTNESS = 30;
const GRAY_MAX_LIGHTNESS = 80;
// Ortalama renkleri bu kadar yakın gruplar aynı renk sayılır (gölge/ışık)
const MERGE_DISTANCE = 20;
// İki grup da en az bu payı aldıysa ve renkleri bu kadar farklıysa "Desenli"
const PATTERN_MIN_SHARE = 0.25;
const PATTERN_COLOR_DISTANCE = 35;

type Lab = [number, number, number];

// sRGB (0-255) → Lab: insan gözünün renk farkını algılamasına yakın bir ölçek
function rgbToLab(r: number, g: number, b: number): Lab {
  const linear = (value: number) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [lr, lg, lb] = [linear(r), linear(g), linear(b)];
  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function distance(a: Lab, b: Lab): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function hexToLab(hex: string): Lab {
  const value = parseInt(hex.slice(1), 16);
  return rgbToLab((value >> 16) & 255, (value >> 8) & 255, value & 255);
}

// Fotoğrafta sık görülen ama listedeki "örnek" renge uzak tonlar: hangi renge sayılacakları.
// (Krem tişört beyaza, kot pantolon laciverte/siyaha çekiyordu.) Gerekirse buraya satır eklenir.
const EXTRA_SHADES: [ColorName, string][] = [
  ['Bej', '#EDE4D3'], // krem
  ['Bej', '#E6DCC8'], // ekru
  ['Pembe', '#F3D3DF'], // pudra pembe
  ['Pembe', '#EBC3D2'], // gül kurusu açığı
  ['Kot mavisi', '#2B3445'], // koyu yıkama kot
  ['Kot mavisi', '#465A75'], // orta yıkama kot
  ['Kot mavisi', '#5C7391'], // açık yıkama kot
];

// Eşlenecek renkler ("Desenli" tek bir renk olmadığı için listede yok)
const MAIN_COLORS = COLORS.filter((color) => color.name !== 'Desenli').map((color) => ({
  name: color.name as ColorName,
  lab: hexToLab(color.hex),
}));
const PALETTE = [
  ...MAIN_COLORS,
  ...EXTRA_SHADES.map(([name, hex]) => ({ name, lab: hexToLab(hex) })),
];

function nearestColor(lab: Lab): (typeof PALETTE)[number] {
  let best = PALETTE[0];
  let bestDistance = Infinity;
  for (const color of PALETTE) {
    const d = distance(lab, color.lab);
    if (d < bestDistance) {
      best = color;
      bestDistance = d;
    }
  }
  return best;
}

// Bir grubun ortalama rengini renk adına çevirir: renksizse açıklığına göre siyah/gri/beyaz,
// değilse listedeki en yakın renk
function colorName(lab: Lab): ColorName {
  const [lightness, a, b] = lab;
  if (Math.hypot(a, b) < NEUTRAL_CHROMA && b < WARM_YELLOWNESS) {
    if (lightness < BLACK_MAX_LIGHTNESS) return 'Siyah';
    if (lightness < GRAY_MAX_LIGHTNESS) return 'Gri';
    return 'Beyaz';
  }
  return nearestColor(lab).name;
}

// base64 yazıyı baytlara çevirir
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Noktaları k renk grubuna ayırır (k-means). Başlangıç: birbirinden en uzak noktalar
// (her seferinde aynı sonucu verir). Her grubun nokta sayısını ve ortalama rengini döner.
function clusterColors(points: Lab[], k: number): { count: number; center: Lab }[] {
  const centers: Lab[] = [points[0]];
  while (centers.length < k) {
    let farthest = points[0];
    let farthestDistance = -1;
    for (const point of points) {
      const nearest = Math.min(...centers.map((center) => distance(point, center)));
      if (nearest > farthestDistance) {
        farthest = point;
        farthestDistance = nearest;
      }
    }
    centers.push(farthest);
  }

  let counts: number[] = [];
  for (let round = 0; round < CLUSTER_ROUNDS; round++) {
    const sums = centers.map(() => [0, 0, 0]);
    counts = centers.map(() => 0);
    for (const point of points) {
      let best = 0;
      let bestDistance = Infinity;
      centers.forEach((center, index) => {
        const d = distance(point, center);
        if (d < bestDistance) {
          best = index;
          bestDistance = d;
        }
      });
      counts[best]++;
      sums[best][0] += point[0];
      sums[best][1] += point[1];
      sums[best][2] += point[2];
    }
    centers.forEach((_, index) => {
      if (counts[index] > 0) {
        centers[index] = [
          sums[index][0] / counts[index],
          sums[index][1] / counts[index],
          sums[index][2] / counts[index],
        ];
      }
    });
  }
  return centers
    .map((center, index) => ({ count: counts[index], center }))
    .filter((group) => group.count > 0);
}

// Fotoğrafın baskın rengini tahmin eder. Bulamazsa ya da bir hata olursa null döner
// (tahmin olmazsa kullanıcı rengi elle seçer, uygulama bozulmaz).
export async function guessPhotoColor(uri: string | null | undefined): Promise<ColorName | null> {
  if (!uri) {
    return null;
  }
  try {
    const rendered = await ImageManipulator.manipulate(uri)
      .resize({ width: SAMPLE_WIDTH })
      .renderAsync();
    const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 1, base64: true });
    if (!saved.base64) {
      return null;
    }
    const { width, height, data } = decode(base64ToBytes(saved.base64), {
      useTArray: true,
      formatAsRGBA: true,
    });
    const pixelLab = (x: number, y: number): Lab => {
      const i = (y * width + x) * 4;
      return rgbToLab(data[i], data[i + 1], data[i + 2]);
    };

    // Kenar pikselleri (arka planı tanımak için)
    const edge: Lab[] = [];
    for (let x = 0; x < width; x++) {
      edge.push(pixelLab(x, 0), pixelLab(x, height - 1));
    }
    for (let y = 1; y < height - 1; y++) {
      edge.push(pixelLab(0, y), pixelLab(width - 1, y));
    }

    // Ortadaki pikseller (kıyafet genelde ortadadır)
    const top = Math.floor(height * CENTER_MARGIN);
    const bottom = Math.floor(height * (1 - CENTER_MARGIN));
    const left = Math.floor(width * CENTER_MARGIN);
    const right = Math.floor(width * (1 - CENTER_MARGIN));
    const center: Lab[] = [];
    const grid: Lab[][] = [];
    for (let y = top; y < bottom; y++) {
      const row: Lab[] = [];
      for (let x = left; x < right; x++) {
        const lab = pixelLab(x, y);
        row.push(lab);
        center.push(lab);
      }
      grid.push(row);
    }
    if (center.length === 0) {
      return null;
    }

    // 1) Desen kontrolü: arka plan olmayan piksellerde sert geçiş oranı
    const edgeAverage: Lab = [0, 1, 2].map(
      (k) => edge.reduce((sum, lab) => sum + lab[k], 0) / edge.length,
    ) as Lab;
    let garmentPixels = 0;
    let sharpPixels = 0;
    for (let y = 0; y + SHARP_STEP < grid.length; y++) {
      for (let x = 0; x + SHARP_STEP < grid[y].length; x++) {
        const lab = grid[y][x];
        if (distance(lab, edgeAverage) < BACKGROUND_DISTANCE) {
          continue;
        }
        garmentPixels++;
        const jump = Math.max(
          distance(lab, grid[y][x + SHARP_STEP]),
          distance(lab, grid[y + SHARP_STEP][x]),
        );
        if (jump > SHARP_DISTANCE) {
          sharpPixels++;
        }
      }
    }
    if (garmentPixels > 0 && sharpPixels / garmentPixels > PATTERN_SHARP_SHARE) {
      return 'Desenli';
    }

    // 2) Ortadaki pikselleri renk gruplarına ayır, arka plan gruplarını ele: kenar piksellerinin çoğu bu renkteyse
    const groups = clusterColors(center, CLUSTER_COUNT).filter((group) => {
      const nearEdge = edge.filter((lab) => distance(lab, group.center) < BACKGROUND_DISTANCE);
      return nearEdge.length / edge.length < BACKGROUND_EDGE_SHARE;
    });

    // 3) Birbirine çok yakın grupları birleştir (büyükten küçüğe)
    groups.sort((a, b) => b.count - a.count);
    const merged: { count: number; center: Lab }[] = [];
    for (const group of groups) {
      const same = merged.find((other) => distance(other.center, group.center) < MERGE_DISTANCE);
      if (same) {
        const total = same.count + group.count;
        same.center = same.center.map(
          (value, k) => (value * same.count + group.center[k] * group.count) / total,
        ) as Lab;
        same.count = total;
      } else {
        merged.push({ ...group });
      }
    }
    if (merged.length === 0) {
      return null;
    }
    merged.sort((a, b) => b.count - a.count);
    const total = merged.reduce((sum, group) => sum + group.count, 0);

    // 4) Çok farklı iki büyük grup varsa desenli, yoksa en büyük grubun rengi
    const [first, second] = merged;
    if (
      second &&
      first.count / total >= PATTERN_MIN_SHARE &&
      second.count / total >= PATTERN_MIN_SHARE &&
      distance(first.center, second.center) > PATTERN_COLOR_DISTANCE
    ) {
      return 'Desenli';
    }
    return colorName(first.center);
  } catch (error) {
    console.warn('Fotoğraftan renk bulunamadı:', error);
    return null;
  }
}
