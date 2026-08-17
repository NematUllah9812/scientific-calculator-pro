/* =====================================================================
 * programmerEngine.js — BigInt ALU, radix conversion, bit ops
 * ===================================================================== */

export const WORD_SIZES = [
  { id: 8, label: 'BYTE', short: 'B' },
  { id: 16, label: 'WORD', short: 'W' },
  { id: 32, label: 'DWORD', short: 'D' },
  { id: 64, label: 'QWORD', short: 'Q' },
];

export const RADIX_INFO = {
  HEX: { base: 16, digits: '0123456789ABCDEF', label: 'HEX', prefix: '0x' },
  DEC: { base: 10, digits: '0123456789', label: 'DEC', prefix: '' },
  OCT: { base: 8, digits: '01234567', label: 'OCT', prefix: '0o' },
  BIN: { base: 2, digits: '01', label: 'BIN', prefix: '0b' },
};

export function mask(bits) {
  return (1n << BigInt(bits)) - 1n;
}

export function wrap(value, bits) {
  const m = mask(bits);
  let v = BigInt(value) & m;
  return v;
}

/** Interpret unsigned stored value as signed two's complement. */
export function toSigned(uvalue, bits) {
  const b = BigInt(bits);
  const u = wrap(uvalue, bits);
  if ((u & (1n << (b - 1n))) !== 0n) return u - (1n << b);
  return u;
}

/** Convert a possibly-negative BigInt into its unsigned storage form. */
export function toUnsigned(value, bits) {
  return wrap(value, bits);
}

export function formatRadix(uvalue, bits, radix, signed = false) {
  try {
    const u = wrap(uvalue, bits);
    if (radix === 'DEC') {
      const v = signed ? toSigned(u, bits) : u;
      return v.toString(10);
    }
    const base = RADIX_INFO[radix].base;
    return u.toString(base).toUpperCase();
  } catch {
    return '0';
  }
}

/** Group digits for display: HEX by 4, BIN by 4, OCT by 3, DEC by 3 */
export function groupDigits(str, radix) {
  if (!str) return '';
  const neg = str.startsWith('-');
  let s = neg ? str.slice(1) : str;
  const size = radix === 'BIN' ? 4 : radix === 'HEX' ? 4 : radix === 'OCT' ? 3 : 3;
  const sep = radix === 'DEC' ? ',' : ' ';
  const out = s.replace(new RegExp(`\\B(?=(.{${size}})+$)`, 'g'), sep);
  return (neg ? '-' : '') + out;
}

/** Zero-padded binary string of full word length. */
export function toBinaryString(uvalue, bits) {
  return wrap(uvalue, bits).toString(2).padStart(bits, '0');
}

export function parseRadix(text, radix, bits) {
  if (!text || text === '-') return 0n;
  const clean = String(text).replace(/[\s,]/g, '').toUpperCase();
  try {
    if (radix === 'DEC') {
      const neg = clean.startsWith('-');
      const digits = neg ? clean.slice(1) : clean;
      if (!/^\d*$/.test(digits)) return 0n;
      const v = BigInt(digits || '0');
      return wrap(neg ? -v : v, bits);
    }
    const base = RADIX_INFO[radix].base;
    const valid = RADIX_INFO[radix].digits;
    let acc = 0n;
    for (const ch of clean) {
      const d = valid.indexOf(ch);
      if (d < 0) return 0n;
      acc = acc * BigInt(base) + BigInt(d);
    }
    return wrap(acc, bits);
  } catch {
    return 0n;
  }
}

export function isDigitAllowed(ch, radix) {
  return RADIX_INFO[radix].digits.includes(String(ch).toUpperCase());
}

/* ---------------------- Bitwise operations ---------------------- */
export function bitAnd(a, b, bits) {
  return wrap(wrap(a, bits) & wrap(b, bits), bits);
}
export function bitOr(a, b, bits) {
  return wrap(wrap(a, bits) | wrap(b, bits), bits);
}
export function bitXor(a, b, bits) {
  return wrap(wrap(a, bits) ^ wrap(b, bits), bits);
}
export function bitNot(a, bits) {
  return wrap(~wrap(a, bits), bits);
}
export function bitNand(a, b, bits) {
  return wrap(~(wrap(a, bits) & wrap(b, bits)), bits);
}
export function bitNor(a, b, bits) {
  return wrap(~(wrap(a, bits) | wrap(b, bits)), bits);
}
export function bitXnor(a, b, bits) {
  return wrap(~(wrap(a, bits) ^ wrap(b, bits)), bits);
}

/* ---------------------- Shifts & rotates ---------------------- */
export function shl(v, k, bits) {
  const n = BigInt(k) % BigInt(bits + 1);
  return wrap(wrap(v, bits) << n, bits);
}

/** Logical (unsigned) right shift. */
export function shr(v, k, bits) {
  const n = BigInt(k);
  if (n >= BigInt(bits)) return 0n;
  return wrap(wrap(v, bits) >> n, bits);
}

/** Arithmetic (sign-propagating) right shift. */
export function sar(v, k, bits) {
  const s = toSigned(v, bits);
  const n = BigInt(k);
  return wrap(s >> n, bits);
}

export function rol(v, k, bits) {
  const b = BigInt(bits);
  const n = BigInt(k) % b;
  if (n === 0n) return wrap(v, bits);
  const x = wrap(v, bits);
  return wrap((x << n) | (x >> (b - n)), bits);
}

export function ror(v, k, bits) {
  const b = BigInt(bits);
  const n = BigInt(k) % b;
  if (n === 0n) return wrap(v, bits);
  const x = wrap(v, bits);
  return wrap((x >> n) | (x << (b - n)), bits);
}

/* ---------------------- Arithmetic ---------------------- */
export function alu(op, a, b, bits) {
  const A = wrap(a, bits);
  const B = wrap(b, bits);
  switch (op) {
    case '+':
      return wrap(A + B, bits);
    case '-':
      return wrap(A - B, bits);
    case '*':
      return wrap(A * B, bits);
    case '/':
      if (B === 0n) throw new Error('Division by zero');
      return wrap(toSigned(A, bits) / toSigned(B, bits), bits);
    case '%':
      if (B === 0n) throw new Error('Modulo by zero');
      return wrap(toSigned(A, bits) % toSigned(B, bits), bits);
    case 'AND':
      return bitAnd(A, B, bits);
    case 'OR':
      return bitOr(A, B, bits);
    case 'XOR':
      return bitXor(A, B, bits);
    case 'NAND':
      return bitNand(A, B, bits);
    case 'NOR':
      return bitNor(A, B, bits);
    case 'XNOR':
      return bitXnor(A, B, bits);
    case '<<':
      return shl(A, B, bits);
    case '>>':
      return sar(A, B, bits);
    case '>>>':
      return shr(A, B, bits);
    case 'ROL':
      return rol(A, B, bits);
    case 'ROR':
      return ror(A, B, bits);
    default:
      return B;
  }
}

/* ---------------------- Bit utilities ---------------------- */
export function toggleBit(v, index, bits) {
  return wrap(wrap(v, bits) ^ (1n << BigInt(index)), bits);
}
export function getBit(v, index, bits) {
  return (wrap(v, bits) >> BigInt(index)) & 1n ? 1 : 0;
}
export function popCount(v, bits) {
  let x = wrap(v, bits);
  let c = 0;
  while (x) {
    c += Number(x & 1n);
    x >>= 1n;
  }
  return c;
}
export function bitLength(v, bits) {
  const x = wrap(v, bits);
  return x === 0n ? 0 : x.toString(2).length;
}

/** ASCII/UTF-8 preview of the low bytes. */
export function toAscii(v, bits) {
  const x = wrap(v, bits);
  const bytes = [];
  let t = x;
  while (t > 0n && bytes.length < 8) {
    bytes.unshift(Number(t & 0xffn));
    t >>= 8n;
  }
  if (!bytes.length) return '';
  return bytes.map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '·')).join('');
}
