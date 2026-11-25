/**
 * SAYARAK YÜKSELEN RAKAM
 *
 * Büyük rakamlar (dolap değeri, Girl Math kazancı…) ekrana gelince 0'dan hedefe doğru "akar".
 * Hedef değişirse (ör. Giydim'den sonra) bulunduğu yerden yeni hedefe akar.
 *   const shown = useCountUp(stats.totalValue);   // ekranda shown.toLocaleString('tr-TR')
 * Süre ~0.9 sn, sona doğru yavaşlar (ease-out). Tam sayı döner.
 */

import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 900;

export function useCountUp(target: number, duration = DURATION_MS): number {
  const [value, setValue] = useState(0);
  const current = useRef(0); // Animasyonun o anki değeri (hedef değişince buradan devam eder)

  useEffect(() => {
    const from = current.current;
    if (from === target) {
      return;
    }
    const start = Date.now();
    let frame: number;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const next = Math.round(from + (target - from) * eased);
      current.current = next;
      setValue(next);
      if (t < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
