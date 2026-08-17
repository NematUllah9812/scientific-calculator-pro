/* =====================================================================
 * statisticsEngine.js — 1-Var summary statistics + OLS linear regression
 * ===================================================================== */
import { cleanFloat, factorial, nCr, nPr } from './mathEngine.js';

export function parseDataset(input) {
  if (Array.isArray(input)) {
    return input.map(Number).filter((n) => isFinite(n));
  }
  return String(input)
    .split(/[\s,;\n\t]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(Number)
    .filter((n) => isFinite(n));
}

export function median(sorted) {
  const n = sorted.length;
  if (!n) return NaN;
  const mid = Math.floor(n / 2);
  return n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Quartile using the "exclusive median" (Moore) method. */
export function quartiles(values) {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  if (!n) return { q1: NaN, q2: NaN, q3: NaN };
  const mid = Math.floor(n / 2);
  const lower = s.slice(0, mid);
  const upper = n % 2 ? s.slice(mid + 1) : s.slice(mid);
  return { q1: median(lower), q2: median(s), q3: median(upper) };
}

export function modes(values) {
  const freq = new Map();
  for (const v of values) freq.set(v, (freq.get(v) || 0) + 1);
  let max = 0;
  for (const c of freq.values()) if (c > max) max = c;
  if (max <= 1) return { modes: [], count: max };
  const out = [];
  for (const [v, c] of freq.entries()) if (c === max) out.push(v);
  return { modes: out.sort((a, b) => a - b), count: max };
}

export function summaryStats(data) {
  const values = parseDataset(data);
  const n = values.length;
  if (n === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const sumSq = values.reduce((a, b) => a + b * b, 0);
  const mean = sum / n;

  let ss = 0;
  for (const v of values) ss += (v - mean) * (v - mean);

  const varP = ss / n;
  const varS = n > 1 ? ss / (n - 1) : NaN;
  const sdP = Math.sqrt(varP);
  const sdS = n > 1 ? Math.sqrt(varS) : NaN;

  const { q1, q2, q3 } = quartiles(values);
  const iqr = q3 - q1;
  const m = modes(values);

  // Higher moments
  let m3 = 0,
    m4 = 0;
  for (const v of values) {
    const d = v - mean;
    m3 += d * d * d;
    m4 += d * d * d * d;
  }
  m3 /= n;
  m4 /= n;
  const skew = sdP > 0 ? m3 / Math.pow(sdP, 3) : NaN;
  const kurt = sdP > 0 ? m4 / Math.pow(sdP, 4) - 3 : NaN;

  const allPositive = values.every((v) => v > 0);
  const geoMean = allPositive ? Math.exp(values.reduce((a, b) => a + Math.log(b), 0) / n) : NaN;
  const harmMean = values.every((v) => v !== 0) ? n / values.reduce((a, b) => a + 1 / b, 0) : NaN;
  const rms = Math.sqrt(sumSq / n);

  return {
    n,
    sum: cleanFloat(sum),
    sumSq: cleanFloat(sumSq),
    mean: cleanFloat(mean),
    min: sorted[0],
    max: sorted[n - 1],
    range: cleanFloat(sorted[n - 1] - sorted[0]),
    median: cleanFloat(q2),
    q1: cleanFloat(q1),
    q3: cleanFloat(q3),
    iqr: cleanFloat(iqr),
    sdSample: cleanFloat(sdS),
    sdPop: cleanFloat(sdP),
    varSample: cleanFloat(varS),
    varPop: cleanFloat(varP),
    stdError: n > 1 ? cleanFloat(sdS / Math.sqrt(n)) : NaN,
    modes: m.modes,
    modeCount: m.count,
    skewness: cleanFloat(skew),
    kurtosis: cleanFloat(kurt),
    geoMean: cleanFloat(geoMean),
    harmMean: cleanFloat(harmMean),
    rms: cleanFloat(rms),
    sorted,
  };
}

/** Ordinary Least Squares y = mx + b */
export function linearRegression(xsIn, ysIn) {
  const xs = parseDataset(xsIn);
  const ys = parseDataset(ysIn);
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;

  const X = xs.slice(0, n);
  const Y = ys.slice(0, n);

  const sx = X.reduce((a, b) => a + b, 0);
  const sy = Y.reduce((a, b) => a + b, 0);
  const sxx = X.reduce((a, b) => a + b * b, 0);
  const syy = Y.reduce((a, b) => a + b * b, 0);
  let sxy = 0;
  for (let i = 0; i < n; i++) sxy += X[i] * Y[i];

  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;

  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;

  const rDenom = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  const r = rDenom === 0 ? NaN : (n * sxy - sx * sy) / rDenom;

  // Residual standard error
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const pred = slope * X[i] + intercept;
    sse += (Y[i] - pred) * (Y[i] - pred);
  }
  const se = n > 2 ? Math.sqrt(sse / (n - 2)) : NaN;

  return {
    n,
    slope: cleanFloat(slope),
    intercept: cleanFloat(intercept),
    r: cleanFloat(r),
    r2: cleanFloat(r * r),
    sumX: cleanFloat(sx),
    sumY: cleanFloat(sy),
    sumXY: cleanFloat(sxy),
    sumX2: cleanFloat(sxx),
    sumY2: cleanFloat(syy),
    meanX: cleanFloat(sx / n),
    meanY: cleanFloat(sy / n),
    sse: cleanFloat(sse),
    stdErr: cleanFloat(se),
    predict: (x) => cleanFloat(slope * x + intercept),
    equation: `y = ${cleanFloat(slope)}x ${intercept >= 0 ? '+' : '−'} ${Math.abs(cleanFloat(intercept))}`,
  };
}

/* ------------------- Combinatorics & random ------------------- */
export const combinatorics = {
  nCr: (n, r) => nCr(n, r),
  nPr: (n, r) => nPr(n, r),
  factorial: (n) => factorial(n),
};

export const randomGen = {
  float: () => Math.random(),
  int: (min, max) => {
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  },
  coin: () => (Math.random() < 0.5 ? 'HEADS' : 'TAILS'),
  dice: (sides = 6) => Math.floor(Math.random() * sides) + 1,
};

export const DATASET_PRESETS = [
  { name: 'Test Scores', data: [88, 92, 79, 93, 85, 90, 74, 96, 81, 87] },
  { name: 'Fibonacci', data: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55] },
  { name: 'Primes', data: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29] },
  { name: 'Temperatures °C', data: [21.5, 23.1, 19.8, 25.4, 22.2, 20.9, 24.6] },
  { name: 'Dice Rolls', data: [3, 6, 1, 4, 4, 2, 5, 6, 3, 2, 4, 1] },
];

export const REGRESSION_PRESET = {
  x: [1, 2, 3, 4, 5, 6, 7, 8],
  y: [2.1, 4.3, 6.2, 8.1, 10.4, 12.2, 14.5, 16.1],
};
