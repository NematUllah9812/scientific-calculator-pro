import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Copy, Check, Delete, Percent, Divide, X, Minus, Plus, Equal,
  ChevronLeft, ChevronRight, Parentheses,
} from 'lucide-react';
import { evaluate, formatResult, previewValue } from '../utils/mathEngine.js';
import { px, ico } from '../utils/scale.js';
import { useHardwareKeyboard } from '../utils/useKeyboard.js';
import { ripple } from '../utils/ripple.js';

/* Display symbols are converted to engine symbols before evaluating. */
const toEngine = (s) => s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
const isOpChar = (c) => '+−×÷^'.includes(c);

/** Strip thousands separators so a recalled value can be evaluated again. */
const plain = (s) => String(s).replace(/,/g, '');

export default function SimpleCalculator({
  theme, settings, addHistory, history, feedback, recallValue, clearRecall, scale, active = true,
}) {
  /* Expression string + caret index === the whole input model. */
  const [expr, setExpr] = useState('');
  const [caret, setCaret] = useState(0);
  const [result, setResult] = useState('');
  const [settled, setSettled] = useState(false); // true right after "="
  const [settledExpr, setSettledExpr] = useState(''); // the expression "=" was applied to
  const [copied, setCopied] = useState(false);
  const charRefs = useRef([]);

  /* ---------- recall from history / memory ---------- */
  useEffect(() => {
    if (recallValue !== null && recallValue !== undefined) {
      const s = plain(String(recallValue));
      setExpr(s);
      setCaret(s.length);
      setSettled(false);
      setSettledExpr('');
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
    if (settled) return;
    if (!expr.trim()) { setResult(''); return; }
    const v = previewValue(toEngine(expr), { angleMode: settings.angleMode });
    setResult(v === null ? '' : fmt(v));
  }, [expr, fmt, settings.angleMode, settled]);

  /* ---------- editing primitives (all caret-aware) ---------- */
  const insert = (text) => {
    // Typing a digit straight after "=" starts a new calculation.
    const fresh = settled && /[0-9.]/.test(text[0]);
    const base = fresh ? '' : expr;
    const at = fresh ? 0 : caret;
    setExpr(base.slice(0, at) + text + base.slice(at));
    setCaret(at + text.length);
    if (settled) setSettledExpr('');
    setSettled(false);
  };

  const inputDigit = (d) => { feedback('key'); insert(d); };

  const handleOperator = (op) => {
    feedback('key');
    setSettled(false);
    setSettledExpr('');
    const at = caret;
    // Replace an operator that is already immediately left of the caret.
    if (at > 0 && isOpChar(expr[at - 1])) {
      setExpr(expr.slice(0, at - 1) + op + expr.slice(at));
      setCaret(at);
      return;
    }
    setExpr(expr.slice(0, at) + op + expr.slice(at));
    setCaret(at + op.length);
  };

  const parens = () => {
    feedback('key');
    const opened = (expr.match(/\(/g) || []).length;
    const closed = (expr.match(/\)/g) || []).length;
    const prevCh = expr[caret - 1];
    const wantClose = opened > closed && prevCh !== undefined && !isOpChar(prevCh) && prevCh !== '(';
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
    setSettledExpr('');
  };

  /* ± negates the number the caret sits in. */
  const negate = () => {
    feedback('key');
    const left = expr.slice(0, caret);
    const m = left.match(/(\d+\.?\d*)$/);
    if (!m) {
      // No number to the left of the caret — wrap the current selection.
      insert('-');
      return;
    }
    const start = caret - m[1].length;
    const num = parseFloat(m[1]);
    const rep = num < 0 ? String(Math.abs(num)) : '-' + m[1];
    setExpr(expr.slice(0, start) + rep + expr.slice(caret));
    setCaret(start + rep.length);
    setSettled(false);
    setSettledExpr('');
  };

  const backspace = () => {
    feedback('key');
    if (settled) { setExpr(''); setCaret(0); setResult(''); setSettled(false); setSettledExpr(''); return; }
    if (caret === 0) return;
    setExpr(expr.slice(0, caret - 1) + expr.slice(caret));
    setCaret(caret - 1);
    setSettled(false);
  };

  const clearAll = () => {
    feedback('clear');
    setExpr(''); setCaret(0); setResult(''); setSettled(false); setSettledExpr('');
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
      setSettledExpr(expr);
      setResult(out);
      setExpr(plain(out));
      setCaret(plain(out).length);
      setSettled(true);
    } catch {
      feedback('error');
      setResult('Error');
      setSettled(false);
      setSettledExpr('');
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
  useHardwareKeyboard(active, (e) => {
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
  });

  /* Round keycap — a full circle of frosted glass with a tap ripple. */
  const K = ({ children, cls, onClick, fs = 26, label, style }) => (
    <button
      onClick={onClick}
      onPointerDown={ripple}
      aria-label={label}
      className={`${cls} flex items-center justify-center font-medium select-none outline-none`}
      style={{ fontSize: px(fs), borderRadius: '50%', ...style }}
    >
      {children}
    </button>
  );

  /* Display type scales down as the number gets longer. */
  const shown = result;
  const outLen = String(shown || '0').length;
  const outSize = outLen > 20 ? 30 : outLen > 16 ? 36 : outLen > 13 ? 42 : outLen > 10 ? 50 : outLen > 7 ? 58 : 64;

  /* Paper tape: the last few simple calculations, newest first. */
  const tape = useMemo(
    () => (history || []).filter((h) => h.mode === 'Simple').slice(0, 6),
    [history]
  );

  const recall = (value) => {
    feedback('key');
    const s = plain(String(value));
    setExpr(s);
    setCaret(s.length);
    setSettled(false);
    setSettledExpr('');
  };

  const exprLen = (settled ? settledExpr : expr).length;
  const exprSize = exprLen > 26 ? 12 : exprLen > 18 ? 14 : 16;

  const chars = expr.split('');
  charRefs.current.length = chars.length;

  return (
    <div className="h-full flex flex-col" style={{ paddingLeft: px(14), paddingRight: px(14), paddingBottom: px(14) }}>
      {/* ================= Display ================= */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* subtle utility cluster */}
        <div className="shrink-0 flex items-center" style={{ gap: px(1), marginTop: px(4) }}>
          <button
            onClick={() => moveCaret(-1)}
            aria-label="Move cursor left"
            className={`${theme.mutedText} opacity-50 active:scale-90 flex items-center justify-center rounded`}
            style={{ width: px(24), height: px(22) }}
          >
            <ChevronLeft size={ico(scale, 15)} />
          </button>
          <button
            onClick={() => moveCaret(1)}
            aria-label="Move cursor right"
            className={`${theme.mutedText} opacity-50 active:scale-90 flex items-center justify-center rounded`}
            style={{ width: px(24), height: px(22) }}
          >
            <ChevronRight size={ico(scale, 15)} />
          </button>
          <button
            onClick={copy}
            aria-label="Copy result"
            className={`${theme.mutedText} opacity-50 active:scale-90 flex items-center justify-center rounded`}
            style={{ width: px(24), height: px(22), marginLeft: px(3) }}
          >
            {copied ? <Check size={ico(scale, 13)} /> : <Copy size={ico(scale, 13)} />}
          </button>
          <button
            onClick={parens}
            aria-label="Parentheses"
            className={`${theme.mutedText} opacity-50 active:scale-90 flex items-center justify-center rounded`}
            style={{ width: px(24), height: px(22) }}
          >
            <Parentheses size={ico(scale, 14)} />
          </button>
        </div>

        {/* paper tape — bottom aligned, grows upward */}
        <div
          className="flex-1 min-h-0 flex flex-col justify-end overflow-y-auto thin-scroll"
          style={{ paddingTop: px(10) }}
        >
          {tape.map((h) => (
            <button
              key={h.id}
              onClick={() => recall(h.result)}
              className={`${theme.mutedText} text-right truncate active:opacity-60`}
              style={{ fontSize: px(11.5), fontVariantNumeric: 'tabular-nums', padding: `${px(2)} 0` }}
            >
              <span className="opacity-70">{h.expression}</span>
              <span className="opacity-90"> = {h.result}</span>
            </button>
          ))}
        </div>

        {/* expression + result */}
        <div className="shrink-0">
          {/* editable expression — tap anywhere to place the caret */}
          <div
            onPointerDown={placeCaret}
            className="text-right cursor-text break-words"
            style={{ minHeight: px(exprSize * 1.5) }}
          >
            {settled ? (
              <div className={`${theme.mutedText} truncate`} style={{ fontSize: px(exprSize) }}>
                {settledExpr} =
              </div>
            ) : chars.length > 0 ? (
              <div
                className={`${theme.lcdFormula} inline-flex flex-wrap justify-end items-baseline`}
                style={{ fontSize: px(exprSize), fontVariantNumeric: 'tabular-nums' }}
              >
                {chars.map((ch, i) => (
                  <React.Fragment key={i}>
                    {caret === i && (
                      <span
                        className="lcd-cursor"
                        style={{ borderLeft: `${px(2)} solid currentColor`, height: px(exprSize * 0.95) }}
                      />
                    )}
                    <span
                      ref={(el) => { charRefs.current[i] = el; }}
                      style={{
                        whiteSpace: 'pre',
                        opacity: isOpChar(ch) ? 0.75 : 1,
                        padding: isOpChar(ch) ? `0 ${px(2)}` : 0,
                      }}
                    >
                      {ch}
                    </span>
                  </React.Fragment>
                ))}
                {caret === chars.length && (
                  <span
                    className="lcd-cursor"
                    style={{ borderLeft: `${px(2)} solid currentColor`, height: px(exprSize * 0.95) }}
                  />
                )}
              </div>
            ) : (
              <div style={{ height: px(exprSize * 1.5) }} />
            )}
          </div>

          {/* live / settled result */}
          <div
            className={`text-right font-semibold truncate ${theme.lcdResult}`}
            style={{
              fontSize: px(outSize),
              lineHeight: 1.05,
              marginTop: px(4),
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: px(-0.8),
            }}
          >
            {shown || '0'}
          </div>
        </div>
      </div>

      {/* ================= Keypad ================= */}
      {/* The grid cells are square so every key is a true circle. */}
      <div
        className="shrink-0 grid grid-cols-4"
        style={{
          gap: px(12),
          gridTemplateRows: 'repeat(5, 1fr)',
          height: px(488),
          marginTop: px(26),
        }}
      >
        <K cls={theme.clearKey} onClick={clearAll} fs={21} label="Clear">AC</K>
        <K cls={theme.funcKey} onClick={negate} fs={24} label="Negate">±</K>
        <K cls={theme.funcKey} onClick={percent} label="Percent"><Percent size={ico(scale, 21)} /></K>
        <K cls={theme.opKey} onClick={() => handleOperator('÷')} label="Divide"><Divide size={ico(scale, 22)} /></K>

        <K cls={theme.numKey} onClick={() => inputDigit('7')}>7</K>
        <K cls={theme.numKey} onClick={() => inputDigit('8')}>8</K>
        <K cls={theme.numKey} onClick={() => inputDigit('9')}>9</K>
        <K cls={theme.opKey} onClick={() => handleOperator('×')} label="Multiply"><X size={ico(scale, 21)} /></K>

        <K cls={theme.numKey} onClick={() => inputDigit('4')}>4</K>
        <K cls={theme.numKey} onClick={() => inputDigit('5')}>5</K>
        <K cls={theme.numKey} onClick={() => inputDigit('6')}>6</K>
        <K cls={theme.opKey} onClick={() => handleOperator('−')} label="Subtract"><Minus size={ico(scale, 21)} /></K>

        <K cls={theme.numKey} onClick={() => inputDigit('1')}>1</K>
        <K cls={theme.numKey} onClick={() => inputDigit('2')}>2</K>
        <K cls={theme.numKey} onClick={() => inputDigit('3')}>3</K>
        <K cls={theme.opKey} onClick={() => handleOperator('+')} label="Add"><Plus size={ico(scale, 21)} /></K>

        {/* Every key is a circle, so the zero is a circle too — the slot the
            wide key used to occupy is now the bracket key. */}
        <K cls={theme.numKey} onClick={() => inputDigit('0')}>0</K>
        <K cls={theme.numKey} onClick={() => inputDigit('.')} fs={30} label="Decimal point">.</K>
        <K cls={theme.funcKey} onClick={parens} label="Parentheses"><Parentheses size={ico(scale, 21)} /></K>
        <K cls={theme.equalKey} onClick={handleEquals} label="Equals"><Equal size={ico(scale, 23)} /></K>
      </div>
    </div>
  );
}
