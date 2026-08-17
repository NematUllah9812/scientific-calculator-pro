import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Copy, Check, Delete, Percent, Divide, X, Minus, Plus, Equal,
  ChevronLeft, ChevronRight, Parentheses,
} from 'lucide-react';
import { evaluate, formatResult } from '../utils/mathEngine.js';
import { px, ico } from '../utils/scale.js';

/* Display symbols are converted to engine symbols before evaluating. */
const toEngine = (s) => s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
const isOpChar = (c) => '+−×÷^'.includes(c);

export default function SimpleCalculator({
  theme, settings, addHistory, feedback, recallValue, clearRecall, scale,
}) {
  /* Expression string + caret index === the whole input model. */
  const [expr, setExpr] = useState('');
  const [caret, setCaret] = useState(0);
  const [result, setResult] = useState('');
  const [settled, setSettled] = useState(false); // true right after "="
  const [copied, setCopied] = useState(false);
  const charRefs = useRef([]);

  /* ---------- recall from history / memory ---------- */
  useEffect(() => {
    if (recallValue !== null && recallValue !== undefined) {
      const s = String(recallValue);
      setExpr(s);
      setCaret(s.length);
      setSettled(false);
      clearRecall();
    }
  }, [recallValue, clearRecall]);

  const fmt = useCallback(
    (v) => formatResult(v, {
      notation: settings.notation,
      precision: settings.precision,
      thousands: settings.thousands,
    }),
    [settings.notation, settings.precision, settings.thousands]
  );

  /* ---------- live preview ---------- */
  useEffect(() => {
    if (!expr.trim()) { setResult(''); return; }
    try {
      const v = evaluate(toEngine(expr), { angleMode: settings.angleMode });
      setResult(Number.isFinite(v) ? fmt(v) : '');
    } catch {
      setResult('');
    }
  }, [expr, fmt, settings.angleMode]);

  /* ---------- editing primitives (all caret-aware) ---------- */
  const insert = (text) => {
    setExpr((prev) => {
      // Typing a digit straight after "=" starts a new calculation.
      const base = settled && /[0-9.]/.test(text[0]) ? '' : prev;
      const at = settled && /[0-9.]/.test(text[0]) ? 0 : caret;
      const next = base.slice(0, at) + text + base.slice(at);
      setCaret(at + text.length);
      return next;
    });
    setSettled(false);
  };

  const inputDigit = (d) => { feedback('key'); insert(d); };

  const handleOperator = (op) => {
    feedback('key');
    setSettled(false);
    setExpr((prev) => {
      const at = caret;
      // Replace an operator that is already immediately left of the caret.
      if (at > 0 && isOpChar(prev[at - 1])) {
        setCaret(at);
        return prev.slice(0, at - 1) + op + prev.slice(at);
      }
      setCaret(at + op.length);
      return prev.slice(0, at) + op + prev.slice(at);
    });
  };

  const parens = () => {
    feedback('key');
    const opened = (expr.match(/\(/g) || []).length;
    const closed = (expr.match(/\)/g) || []).length;
    const prevCh = expr[caret - 1];
    const wantClose = opened > closed && (prevCh === undefined ? false : !isOpChar(prevCh) && prevCh !== '(');
    insert(wantClose ? ')' : '(');
  };

  /* % converts the number token left of the caret into its decimal form. */
  const percent = () => {
    feedback('key');
    const left = expr.slice(0, caret);
    const m = left.match(/(\d+\.?\d*)$/);
    if (!m) return;
    const num = parseFloat(m[1]);
    if (Number.isNaN(num)) return;
    const rep = String(num / 100);
    const start = caret - m[1].length;
    setExpr(expr.slice(0, start) + rep + expr.slice(caret));
    setCaret(start + rep.length);
    setSettled(false);
  };

  const backspace = () => {
    feedback('key');
    if (caret === 0) return;
    setExpr(expr.slice(0, caret - 1) + expr.slice(caret));
    setCaret(caret - 1);
    setSettled(false);
  };

  const clearAll = () => {
    feedback('clear');
    setExpr(''); setCaret(0); setResult(''); setSettled(false);
  };

  const moveCaret = (delta) => {
    feedback('toggle');
    setCaret((c) => Math.max(0, Math.min(expr.length, c + delta)));
  };

  const handleEquals = () => {
    if (!expr.trim()) return;
    feedback('equals');
    try {
      const v = evaluate(toEngine(expr), { angleMode: settings.angleMode });
      if (!Number.isFinite(v)) throw new Error('bad');
      const out = fmt(v);
      addHistory({ expression: expr, result: out, mode: 'Simple' });
      setResult(out);
      setExpr(out.replace(/,/g, ''));
      setCaret(out.replace(/,/g, '').length);
      setSettled(true);
    } catch {
      feedback('error');
      setResult('Error');
      setSettled(false);
    }
  };

  const copy = async () => {
    feedback('toggle');
    try {
      await navigator.clipboard.writeText(result || expr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* ignore */ }
  };

  /* ---------- caret placement by tapping the expression ---------- */
  const placeCaret = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    let best = expr.length;
    let bestDist = Infinity;
    charRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Penalise glyphs on other visual lines so wrapped text behaves.
      const vGap = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
      [[r.left, i], [r.right, i + 1]].forEach(([edge, idx]) => {
        const d = Math.abs(x - edge) + vGap * 4;
        if (d < bestDist) { bestDist = d; best = idx; }
      });
    });
    setCaret(best);
    feedback('toggle');
  };

  /* ---------- hardware keyboard ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key;
      if (k >= '0' && k <= '9') inputDigit(k);
      else if (k === '.') inputDigit('.');
      else if (k === '+') handleOperator('+');
      else if (k === '-') handleOperator('−');
      else if (k === '*') handleOperator('×');
      else if (k === '/') handleOperator('÷');
      else if (k === '(' || k === ')') insert(k);
      else if (k === 'Enter' || k === '=') { e.preventDefault(); handleEquals(); }
      else if (k === 'Backspace') backspace();
      else if (k === 'Escape') clearAll();
      else if (k === '%') percent();
      else if (k === 'ArrowLeft') moveCaret(-1);
      else if (k === 'ArrowRight') moveCaret(1);
      else if (k === 'Home') setCaret(0);
      else if (k === 'End') setCaret(expr.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* Circular key — fills its cell so gaps stay tight and even. */
  const Round = ({ children, cls, onClick, fs = 23, label }) => (
    <button
      onClick={onClick}
      aria-label={label}
      className={`${cls} flex items-center justify-center rounded-full aspect-square w-full
        transition-[transform,background-color] duration-75 active:scale-95 font-medium`}
      style={{ fontSize: px(fs) }}
    >
      {children}
    </button>
  );

  /* Expression shrinks as it grows, then wraps — nothing is ever hidden. */
  const exprSize = expr.length > 40 ? 20 : expr.length > 28 ? 25 : expr.length > 18 ? 31 : 38;
  const resSize = result.length > 18 ? 19 : result.length > 12 ? 24 : 29;

  const chars = expr.split('');
  charRefs.current.length = chars.length;

  return (
    <div className="h-full flex flex-col" style={{ padding: px(12), gap: px(10) }}>
      {/* ================= LCD ================= */}
      <div
        className={`flex-1 min-h-0 relative ${theme.lcdBg} border-2 ${theme.lcdBorder} lcd-scanlines overflow-hidden flex flex-col`}
        style={{ borderRadius: px(14), padding: px(14) }}
      >
        <div className={`absolute inset-0 ${theme.lcdGlow} pointer-events-none`} />

        {/* header: title, caret nudge buttons, copy */}
        <div className="relative flex items-center justify-between shrink-0" style={{ gap: px(8) }}>
          <span
            className={`font-bold uppercase ${theme.lcdHeader}`}
            style={{ fontSize: px(11), letterSpacing: px(0.8) }}
          >
            Simple Calculator
          </span>
          <div className="flex items-center" style={{ gap: px(4) }}>
            <button
              onClick={() => moveCaret(-1)}
              aria-label="Move cursor left"
              className={`${theme.lcdHeader} opacity-80 active:scale-90 flex items-center justify-center rounded`}
              style={{ width: px(24), height: px(22) }}
            >
              <ChevronLeft size={ico(scale, 17)} />
            </button>
            <button
              onClick={() => moveCaret(1)}
              aria-label="Move cursor right"
              className={`${theme.lcdHeader} opacity-80 active:scale-90 flex items-center justify-center rounded`}
              style={{ width: px(24), height: px(22) }}
            >
              <ChevronRight size={ico(scale, 17)} />
            </button>
            <button onClick={copy} aria-label="Copy" className={`${theme.lcdHeader} opacity-80 active:scale-90`} style={{ marginLeft: px(2) }}>
              {copied ? <Check size={ico(scale, 15)} /> : <Copy size={ico(scale, 15)} />}
            </button>
          </div>
        </div>

        {/* editable expression — tap anywhere to place the caret */}
        <div
          onPointerDown={placeCaret}
          className="relative flex-1 min-h-0 overflow-y-auto thin-scroll flex flex-col justify-end cursor-text"
          style={{ marginTop: px(8) }}
        >
          <div
            className={`flex flex-wrap items-end justify-end ${theme.lcdResult} font-bold`}
            style={{
              fontSize: px(exprSize),
              lineHeight: 1.24,
              fontVariantNumeric: 'tabular-nums',
              minHeight: px(exprSize * 1.3),
            }}
          >
            {chars.length === 0 && (
              <span style={{ opacity: 0.45 }}>
                <span className="lcd-cursor" style={{ borderLeft: `${px(2)} solid currentColor`, height: px(exprSize) }} />
                0
              </span>
            )}
            {chars.map((ch, i) => (
              <React.Fragment key={i}>
                {caret === i && (
                  <span
                    className="lcd-cursor"
                    style={{ borderLeft: `${px(2)} solid currentColor`, height: px(exprSize) }}
                  />
                )}
                <span
                  ref={(el) => { charRefs.current[i] = el; }}
                  style={{
                    whiteSpace: 'pre',
                    color: isOpChar(ch) || ch === '(' || ch === ')' ? undefined : undefined,
                    opacity: isOpChar(ch) ? 0.92 : 1,
                    padding: isOpChar(ch) ? `0 ${px(3)}` : 0,
                  }}
                >
                  {ch}
                </span>
              </React.Fragment>
            ))}
            {caret === chars.length && chars.length > 0 && (
              <span
                className="lcd-cursor"
                style={{ borderLeft: `${px(2)} solid currentColor`, height: px(exprSize) }}
              />
            )}
          </div>

          {/* live / settled result */}
          <div
            className={`text-right shrink-0 ${settled ? theme.lcdResult : theme.lcdPreview}`}
            style={{
              fontSize: px(settled ? resSize : Math.min(resSize, 22)),
              marginTop: px(8),
              fontVariantNumeric: 'tabular-nums',
              fontWeight: settled ? 700 : 500,
              opacity: result ? 1 : 0,
              minHeight: px(24),
            }}
          >
            {result ? (settled ? result : `= ${result}`) : '\u00A0'}
          </div>
        </div>
      </div>

      {/* ================= Round keypad ================= */}
      <div
        className="shrink-0 grid grid-cols-4 place-items-center"
        style={{ gap: px(7) }}
      >
        <Round cls={theme.clearKey} onClick={clearAll} fs={20} label="Clear">AC</Round>
        <Round cls={theme.numKey} onClick={parens} label="Parentheses"><Parentheses size={ico(scale, 21)} /></Round>
        <Round cls={theme.numKey} onClick={percent} label="Percent"><Percent size={ico(scale, 20)} /></Round>
        <Round cls={theme.opKey} onClick={() => handleOperator('÷')} label="Divide"><Divide size={ico(scale, 21)} /></Round>

        <Round cls={theme.numKey} onClick={() => inputDigit('7')}>7</Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('8')}>8</Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('9')}>9</Round>
        <Round cls={theme.opKey} onClick={() => handleOperator('×')} label="Multiply"><X size={ico(scale, 20)} /></Round>

        <Round cls={theme.numKey} onClick={() => inputDigit('4')}>4</Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('5')}>5</Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('6')}>6</Round>
        <Round cls={theme.opKey} onClick={() => handleOperator('−')} label="Subtract"><Minus size={ico(scale, 20)} /></Round>

        <Round cls={theme.numKey} onClick={() => inputDigit('1')}>1</Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('2')}>2</Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('3')}>3</Round>
        <Round cls={theme.opKey} onClick={() => handleOperator('+')} label="Add"><Plus size={ico(scale, 20)} /></Round>

        <Round cls={theme.numKey} onClick={backspace} label="Backspace"><Delete size={ico(scale, 21)} /></Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('0')}>0</Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('.')}>.</Round>
        <Round cls={theme.equalKey} onClick={handleEquals} label="Equals"><Equal size={ico(scale, 22)} /></Round>
      </div>
    </div>
  );
}
