const ANCHORS = ["BTC", "ETH", "USDT"];
const ROTATION_SIZE = 17; // 3 anclas + 17 = 20

/** Semilla estable por DÍA (UTC): misma toda la jornada, distinta al día siguiente. */
function daySeed(d: Date = new Date()): number {
  // YYYYMMDD en UTC -> número. Estable durante el día, cambia a medianoche UTC.
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return y * 10000 + m * 100 + day; // ej. 20260725
}

/** PRNG determinístico (mulberry32): misma semilla -> misma secuencia. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shuffle determinístico (Fisher-Yates con PRNG sembrado). No muta el input. */
function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Devuelve los 20 símbolos del día: anclas + 17 rotativos determinísticos.
 * @param universe los 120 símbolos elegibles (de symbolMeta), en MAYÚSCULAS.
 * @param date opcional (para tests); por defecto hoy (UTC).
 */
export function getDailyRotation(universe: string[], date: Date = new Date()): string[] {
  const upper = universe.map((s) => s.trim().toUpperCase()).filter(Boolean);

  // el pool rotativo excluye las anclas (no queremos duplicarlas)
  const pool = upper.filter((s) => !ANCHORS.includes(s));

  const rng = mulberry32(daySeed(date));
  const rotated = seededShuffle(pool, rng).slice(0, ROTATION_SIZE);

  // anclas primero (orden estable), luego los rotativos del día
  return [...ANCHORS, ...rotated];
}

// Export para un posible indicador honesto en UI ("refreshes daily")
export const DAILY_ROTATION_ANCHORS = ANCHORS;
export const DAILY_ROTATION_SIZE = ANCHORS.length + ROTATION_SIZE; // 20
