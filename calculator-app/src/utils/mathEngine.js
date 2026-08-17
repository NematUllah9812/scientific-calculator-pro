/* =====================================================================
 * mathEngine.js — Lexer + Shunting-Yard RPN + PEMDAS evaluator
 * Zero dependencies. Pure functions.
 * ===================================================================== */

export const PI = Math.PI;
export const E = Math.E;
export const PHI = (1 + Math.sqrt(5)) / 2;

/* ---------------------------------------------------------------------
 * cleanFloat — strips IEEE-754 artifacts (0.1+0.2 -> 0.3)
 * ------------------------------------------------------------------- */
export function cleanFloat(n) {
  if (typeof n !== 'number' || !isFinite(n)) return n;
  if (Number.isInteger(n)) return n;
  const r = parseFloat(n.toPrecision(12));
  return Object.is(r, -0) ? 0 : r;
}

/* ---------------------------------------------------------------------
 * Angle conversion
 * ------------------------------------------------------------------- */
export function toRadians(v, mode) {
  if (mode === 'DEG') return (v * PI) / 180;
  if (mode === 'GRAD') return (v * PI) / 200;
  return v;
}
export function fromRadians(v, mode) {
  if (mode === 'DEG') return (v * 180) / PI;
  if (mode === 'GRAD') return (v * 200) / PI;
  return v;
}

/* ---------------------------------------------------------------------
 * Gamma / Factorial
 * ------------------------------------------------------------------- */
const LANCZOS = [
  676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012,
  9.9843695780195716e-6, 1.5056327351493116e-7,
];

export function gamma(z) {
  if (z < 0.5) return PI / (Math.sin(PI * z) * gamma(1 - z));
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < LANCZOS.length; i++) x += LANCZOS[i] / (z + i + 1);
  const t = z + LANCZOS.length - 0.5;
  return Math.sqrt(2 * PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

export function factorial(n) {
  if (n < 0 && Number.isInteger(n)) throw new Error('Factorial of negative integer');
  if (Number.isInteger(n)) {
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }
  return gamma(n + 1);
}

export function nCr(n, r) {
  if (r < 0 || n < 0 || r > n) throw new Error('Invalid nCr');
  if (Number.isInteger(n) && Number.isInteger(r)) {
    r = Math.min(r, n - r);
    let res = 1;
    for (let i = 0; i < r; i++) res = (res * (n - i)) / (i + 1);
    return Math.round(res);
  }
  return factorial(n) / (factorial(r) * factorial(n - r));
}

export function nPr(n, r) {
  if (r < 0 || n < 0 || r > n) throw new Error('Invalid nPr');
  if (Number.isInteger(n) && Number.isInteger(r)) {
    let res = 1;
    for (let i = 0; i < r; i++) res *= n - i;
    return res;
  }
  return factorial(n) / factorial(n - r);
}

export function nthRoot(x, y) {
  if (y === 0) throw new Error('Root index 0');
  if (x < 0) {
    if (Number.isInteger(y) && Math.abs(y % 2) === 1) return -Math.pow(-x, 1 / y);
    throw new Error('Even root of negative');
  }
  return Math.pow(x, 1 / y);
}

/* ---------------------------------------------------------------------
 * Token definitions
 * ------------------------------------------------------------------- */
const FUNCTIONS = {
  sin: (x, m) => Math.sin(toRadians(x, m)),
  cos: (x, m) => Math.cos(toRadians(x, m)),
  tan: (x, m) => {
    const r = toRadians(x, m);
    const c = Math.cos(r);
    if (Math.abs(c) < 1e-14) throw new Error('tan undefined');
    return Math.sin(r) / c;
  },
  asin: (x, m) => {
    if (x < -1 || x > 1) throw new Error('Domain error');
    return fromRadians(Math.asin(x), m);
  },
  acos: (x, m) => {
    if (x < -1 || x > 1) throw new Error('Domain error');
    return fromRadians(Math.acos(x), m);
  },
  atan: (x, m) => fromRadians(Math.atan(x), m),
  sinh: (x) => Math.sinh(x),
  cosh: (x) => Math.cosh(x),
  tanh: (x) => Math.tanh(x),
  asinh: (x) => Math.asinh(x),
  acosh: (x) => {
    if (x < 1) throw new Error('Domain error');
    return Math.acosh(x);
  },
  atanh: (x) => {
    if (x <= -1 || x >= 1) throw new Error('Domain error');
    return Math.atanh(x);
  },
  sqrt: (x) => {
    if (x < 0) throw new Error('sqrt of negative');
    return Math.sqrt(x);
  },
  cbrt: (x) => Math.cbrt(x),
  log: (x) => {
    if (x <= 0) throw new Error('log domain');
    return Math.log10(x);
  },
  log10: (x) => {
    if (x <= 0) throw new Error('log domain');
    return Math.log10(x);
  },
  log2: (x) => {
    if (x <= 0) throw new Error('log domain');
    return Math.log2(x);
  },
  ln: (x) => {
    if (x <= 0) throw new Error('ln domain');
    return Math.log(x);
  },
  exp: (x) => Math.exp(x),
  abs: (x) => Math.abs(x),
  floor: (x) => Math.floor(x),
  ceil: (x) => Math.ceil(x),
  round: (x) => Math.round(x),
  sign: (x) => Math.sign(x),
  inv: (x) => {
    if (x === 0) throw new Error('Division by zero');
    return 1 / x;
  },
  fact: (x) => factorial(x),
  rand: () => Math.random(),
};

const BINARY_FUNCTIONS = {
  nCr: (n, r) => nCr(n, r),
  nPr: (n, r) => nPr(n, r),
  mod: (a, b) => {
    if (b === 0) throw new Error('Modulo by zero');
    return a % b;
  },
  pow: (a, b) => Math.pow(a, b),
  root: (y, x) => nthRoot(x, y), // root(y, x) = y-th root of x
  gcd: (a, b) => {
    a = Math.abs(Math.trunc(a));
    b = Math.abs(Math.trunc(b));
    while (b) [a, b] = [b, a % b];
    return a;
  },
  lcm: (a, b) => {
    if (a === 0 || b === 0) return 0;
    const g = BINARY_FUNCTIONS.gcd(a, b);
    return Math.abs(Math.trunc(a) * Math.trunc(b)) / g;
  },
  atan2: (y, x, m) => fromRadians(Math.atan2(y, x), m),
};

const CONSTANTS = { π: PI, pi: PI, e: E, φ: PHI, phi: PHI };

const OPERATORS = {
  '+': { prec: 2, assoc: 'L', fn: (a, b) => a + b },
  '-': { prec: 2, assoc: 'L', fn: (a, b) => a - b },
  '*': { prec: 3, assoc: 'L', fn: (a, b) => a * b },
  '/': {
    prec: 3,
    assoc: 'L',
    fn: (a, b) => {
      if (b === 0) throw new Error('Division by zero');
      return a / b;
    },
  },
  '%': {
    prec: 3,
    assoc: 'L',
    fn: (a, b) => {
      if (b === 0) throw new Error('Modulo by zero');
      return a % b;
    },
  },
  '^': { prec: 5, assoc: 'R', fn: (a, b) => Math.pow(a, b) },
  'u-': { prec: 6, assoc: 'R', unary: true, fn: (a) => -a },
};

/* ---------------------------------------------------------------------
 * Normalizer — converts display glyphs into canonical ASCII tokens
 * ------------------------------------------------------------------- */
export function normalize(expr) {
  let s = String(expr);
  const map = [
    [/×/g, '*'],
    [/÷/g, '/'],
    [/−/g, '-'],
    [/–/g, '-'],
    [/∙|·/g, '*'],
    [/√\(/g, 'sqrt('],
    [/∛\(/g, 'cbrt('],
    [/π/g, 'PI_CONST'],
    [/φ/g, 'PHI_CONST'],
    [/\bE\b/g, 'E_CONST'],
    [/sin⁻¹/g, 'asin'],
    [/cos⁻¹/g, 'acos'],
    [/tan⁻¹/g, 'atan'],
    [/sinh⁻¹/g, 'asinh'],
    [/cosh⁻¹/g, 'acosh'],
    [/tanh⁻¹/g, 'atanh'],
    [/¹\/x/g, 'inv'],
    [/\|/g, 'ABS_BAR'],
  ];
  for (const [re, to] of map) s = s.replace(re, to);
  return s;
}

/* ---------------------------------------------------------------------
 * Tokenizer
 * ------------------------------------------------------------------- */
export function tokenize(input) {
  const s = normalize(input).replace(/\s+/g, '');
  const tokens = [];
  let i = 0;

  const isDigit = (c) => c >= '0' && c <= '9';
  const isAlpha = (c) => /[A-Za-z_]/.test(c);

  while (i < s.length) {
    const c = s[i];

    // Numbers (incl. decimals and exponent notation 1.2e-3)
    if (isDigit(c) || (c === '.' && isDigit(s[i + 1]))) {
      let j = i;
      let seenDot = false;
      while (j < s.length && (isDigit(s[j]) || (s[j] === '.' && !seenDot))) {
        if (s[j] === '.') seenDot = true;
        j++;
      }
      if (
        (s[j] === 'e' || s[j] === 'E') &&
        (isDigit(s[j + 1]) || ((s[j + 1] === '-' || s[j + 1] === '+') && isDigit(s[j + 2])))
      ) {
        j += 2;
        while (j < s.length && isDigit(s[j])) j++;
      }
      tokens.push({ type: 'num', value: parseFloat(s.slice(i, j)) });
      i = j;
      continue;
    }

    // Identifiers: functions & constants
    if (isAlpha(c)) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++;
      let name = s.slice(i, j);

      if (name === 'PI_CONST') tokens.push({ type: 'num', value: PI });
      else if (name === 'PHI_CONST') tokens.push({ type: 'num', value: PHI });
      else if (name === 'E_CONST') tokens.push({ type: 'num', value: E });
      else if (name === 'ABS_BAR') tokens.push({ type: 'func', value: 'abs' });
      else if (Object.prototype.hasOwnProperty.call(CONSTANTS, name))
        tokens.push({ type: 'num', value: CONSTANTS[name] });
      else if (Object.prototype.hasOwnProperty.call(FUNCTIONS, name))
        tokens.push({ type: 'func', value: name });
      else if (Object.prototype.hasOwnProperty.call(BINARY_FUNCTIONS, name))
        tokens.push({ type: 'func2', value: name });
      else if (name === 'Ans' || name === 'ans') tokens.push({ type: 'ans' });
      else throw new Error('Unknown token: ' + name);
      i = j;
      continue;
    }

    // Parentheses & comma
    if (c === '(') {
      tokens.push({ type: 'lparen' });
      i++;
      continue;
    }
    if (c === ')') {
      tokens.push({ type: 'rparen' });
      i++;
      continue;
    }
    if (c === ',' || c === ';') {
      tokens.push({ type: 'comma' });
      i++;
      continue;
    }

    // Postfix factorial
    if (c === '!') {
      tokens.push({ type: 'postfix', value: 'fact' });
      i++;
      continue;
    }

    // Operators
    if (Object.prototype.hasOwnProperty.call(OPERATORS, c)) {
      tokens.push({ type: 'op', value: c });
      i++;
      continue;
    }

    throw new Error('Invalid character: ' + c);
  }

  return tokens;
}

/* ---------------------------------------------------------------------
 * Implicit multiplication + unary minus resolution
 * ------------------------------------------------------------------- */
function preprocess(tokens) {
  const out = [];
  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    const prev = out.length ? out[out.length - 1] : null;

    // Unary minus / plus detection
    if (t.type === 'op' && (t.value === '-' || t.value === '+')) {
      const isUnary =
        !prev ||
        prev.type === 'op' ||
        prev.type === 'lparen' ||
        prev.type === 'comma' ||
        prev.type === 'func' ||
        prev.type === 'func2';
      if (isUnary) {
        if (t.value === '-') out.push({ type: 'op', value: 'u-' });
        continue;
      }
    }

    // Implicit multiplication: 5( , )( , 5sin, )5, 5π handled as num
    const needsMul =
      prev &&
      (prev.type === 'num' || prev.type === 'rparen' || prev.type === 'postfix' || prev.type === 'ans') &&
      (t.type === 'num' || t.type === 'lparen' || t.type === 'func' || t.type === 'func2' || t.type === 'ans');

    if (needsMul) out.push({ type: 'op', value: '*' });
    out.push(t);
  }
  return out;
}

/* ---------------------------------------------------------------------
 * Shunting-Yard → RPN
 * ------------------------------------------------------------------- */
export function toRPN(tokens) {
  const output = [];
  const stack = [];

  for (const t of tokens) {
    switch (t.type) {
      case 'num':
      case 'ans':
        output.push(t);
        break;
      case 'func':
      case 'func2':
        stack.push(t);
        break;
      case 'postfix':
        output.push(t);
        break;
      case 'comma':
        while (stack.length && stack[stack.length - 1].type !== 'lparen')
          output.push(stack.pop());
        if (!stack.length) throw new Error('Misplaced comma');
        break;
      case 'op': {
        const o1 = OPERATORS[t.value];
        while (stack.length) {
          const top = stack[stack.length - 1];
          if (top.type !== 'op') break;
          const o2 = OPERATORS[top.value];
          if (o2.prec > o1.prec || (o2.prec === o1.prec && o1.assoc === 'L')) {
            output.push(stack.pop());
          } else break;
        }
        stack.push(t);
        break;
      }
      case 'lparen':
        stack.push(t);
        break;
      case 'rparen': {
        let found = false;
        while (stack.length) {
          const top = stack.pop();
          if (top.type === 'lparen') {
            found = true;
            break;
          }
          output.push(top);
        }
        if (!found) throw new Error('Mismatched parentheses');
        if (stack.length && (stack[stack.length - 1].type === 'func' || stack[stack.length - 1].type === 'func2'))
          output.push(stack.pop());
        break;
      }
      default:
        throw new Error('Unexpected token');
    }
  }

  while (stack.length) {
    const top = stack.pop();
    if (top.type === 'lparen') throw new Error('Mismatched parentheses');
    output.push(top);
  }
  return output;
}

/* ---------------------------------------------------------------------
 * RPN Evaluator
 * ------------------------------------------------------------------- */
export function evalRPN(rpn, { angleMode = 'DEG', ans = 0 } = {}) {
  const st = [];
  for (const t of rpn) {
    if (t.type === 'num') st.push(t.value);
    else if (t.type === 'ans') st.push(ans);
    else if (t.type === 'op') {
      const o = OPERATORS[t.value];
      if (o.unary) {
        if (st.length < 1) throw new Error('Syntax error');
        st.push(o.fn(st.pop()));
      } else {
        if (st.length < 2) throw new Error('Syntax error');
        const b = st.pop();
        const a = st.pop();
        st.push(o.fn(a, b));
      }
    } else if (t.type === 'postfix') {
      if (st.length < 1) throw new Error('Syntax error');
      st.push(FUNCTIONS[t.value](st.pop(), angleMode));
    } else if (t.type === 'func') {
      if (st.length < 1) throw new Error('Syntax error');
      st.push(FUNCTIONS[t.value](st.pop(), angleMode));
    } else if (t.type === 'func2') {
      if (st.length < 2) throw new Error('Syntax error');
      const b = st.pop();
      const a = st.pop();
      st.push(BINARY_FUNCTIONS[t.value](a, b, angleMode));
    }
  }
  if (st.length !== 1) throw new Error('Syntax error');
  const r = st[0];
  if (typeof r !== 'number' || Number.isNaN(r)) throw new Error('Math error');
  if (!isFinite(r)) throw new Error('Infinity');
  return cleanFloat(r);
}

/* ---------------------------------------------------------------------
 * Public: evaluate()
 * ------------------------------------------------------------------- */
export function evaluate(expression, opts = {}) {
  if (!expression || !String(expression).trim()) return null;
  let expr = String(expression).trim();

  // auto-close unbalanced parentheses for live preview
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  if (open > close) expr += ')'.repeat(open - close);

  const tokens = preprocess(tokenize(expr));
  return evalRPN(toRPN(tokens), opts);
}

/** Never throws — returns null on any error. Used for live preview. */
export function safeEvaluate(expression, opts = {}) {
  try {
    return evaluate(expression, opts);
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------------
 * Result formatting
 * ------------------------------------------------------------------- */
export function formatResult(value, { notation = 'standard', precision = 10, thousands = true } = {}) {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'number') return String(value);
  if (Number.isNaN(value)) return 'Math Error';
  if (!isFinite(value)) return value > 0 ? '∞' : '-∞';

  const p = Math.max(0, Math.min(14, precision));

  if (notation === 'scientific') {
    return value.toExponential(Math.min(p, 13)).replace('e', 'e');
  }

  if (notation === 'engineering') {
    if (value === 0) return '0';
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const eng = Math.floor(exp / 3) * 3;
    const mant = value / Math.pow(10, eng);
    return `${cleanFloat(parseFloat(mant.toPrecision(Math.min(p, 12))))}e${eng >= 0 ? '+' : ''}${eng}`;
  }

  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e13 || abs < 1e-9)) {
    return value.toExponential(Math.min(p, 10));
  }

  let s = parseFloat(value.toPrecision(Math.max(1, p + 1))).toString();

  if (thousands && !s.includes('e')) {
    const neg = s.startsWith('-');
    if (neg) s = s.slice(1);
    const [ip, fp] = s.split('.');
    const grouped = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    s = (neg ? '-' : '') + grouped + (fp ? '.' + fp : '');
  }
  return s;
}

/* ---------------------------------------------------------------------
 * Bracket balance helper (for status bar "(2 missing)")
 * ------------------------------------------------------------------- */
export function bracketBalance(expr) {
  const open = (String(expr).match(/\(/g) || []).length;
  const close = (String(expr).match(/\)/g) || []).length;
  return Math.max(0, open - close);
}

/* ---------------------------------------------------------------------
 * Fraction conversion (S⇔D key)
 * ------------------------------------------------------------------- */
export function toFraction(value, maxDenom = 1000000) {
  if (!isFinite(value) || Number.isInteger(value)) return null;
  const neg = value < 0;
  let x = Math.abs(value);
  let h1 = 1,
    h2 = 0,
    k1 = 0,
    k2 = 1,
    b = x;
  do {
    const a = Math.floor(b);
    let aux = h1;
    h1 = a * h1 + h2;
    h2 = aux;
    aux = k1;
    k1 = a * k1 + k2;
    k2 = aux;
    b = 1 / (b - a);
  } while (Math.abs(x - h1 / k1) > x * 1e-12 && k1 < maxDenom);
  if (k1 > maxDenom || k1 === 0) return null;
  return { num: neg ? -h1 : h1, den: k1 };
}

export const MATH_FUNCTION_NAMES = Object.keys(FUNCTIONS);
export const MATH_BINARY_NAMES = Object.keys(BINARY_FUNCTIONS);
