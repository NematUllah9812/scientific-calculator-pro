import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Copy, Check, ChevronLeft, ChevronRight, Delete } from 'lucide-react';
import { safeEvaluate, evaluate, formatResult, bracketBalance, toFraction } from '../utils/mathEngine.js';
import { KEY_BASE } from '../utils/themeStyles.js';

/* Each key: label / shifted label / token inserted / shifted token */
export default function ScientificCalculator({
  theme, settings, updateSettings, addHistory, memoryBanks, setMemoryBanks, feedback, recallValue, clearRecall,
}) {
  const [expr, setExpr] = useState('');
  const [cursor, setCursor] = useState(0);
  const [result, setResult] = useState(null);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [shift, setShift] = useState(false);
  const [hyp, setHyp] = useState(false);
  const [ans, setAns] = useState(0);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showFraction, setShowFraction] = useState(false);
  const formulaRef = useRef(null);

  const angleMode = settings.angleMode || 'DEG';

  useEffect(() => {
    if (recallValue !== null && recallValue !== undefined) {
      insert(String(recallValue));
      clearRecall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recallValue]);

  const fmt = useCallback(
    (v) => formatResult(v, { notation: settings.notation, precision: settings.precision, thousands: settings.thousands }),
    [settings.notation, settings.precision, settings.thousands]
  );

  /* ---------- Live preview ---------- */
  const preview = useMemo(() => {
    if (!expr.trim() || isEvaluated) return null;
    const v = safeEvaluate(expr, { angleMode, ans });
    return v === null ? null : fmt(v);
  }, [expr, angleMode, ans, isEvaluated, fmt]);

  const missing = bracketBalance(expr);

  /* ---------- Core insertion state machine ---------- */
  const insert = useCallback(
    (token, opts = {}) => {
      setError('');
      setShowFraction(false);
      let base = expr;
      let pos = cursor;

      if (isEvaluated) {
        const isOperator = /^[+\-×÷*/^%]$/.test(token) || token === 'mod(';
        if (isOperator) {
          base = fmt(result ?? 0).replace(/,/g, '');
          pos = base.length;
        } else {
          base = '';
          pos = 0;
        }
        setIsEvaluated(false);
      }

      const before = base.slice(0, pos);
      const after = base.slice(pos);
      const next = before + token + after;
      setExpr(next);
      setCursor(pos + token.length + (opts.cursorOffset || 0));
    },
    [expr, cursor, isEvaluated, result, fmt]
  );

  const press = (token, variant = 'key', opts) => {
    feedback(variant);
    insert(token, opts);
    if (opts?.consumeShift !== false && shift) setShift(false);
  };

  const backspace = () => {
    feedback('key');
    setError('');
    if (isEvaluated) {
      setIsEvaluated(false);
      setExpr('');
      setCursor(0);
      return;
    }
    if (cursor === 0) return;
    // delete whole function tokens like "sin(" at once
    const before = expr.slice(0, cursor);
    const m = before.match(/(asinh|acosh|atanh|sinh|cosh|tanh|asin|acos|atan|sqrt|cbrt|log2|log10|log|ln|exp|abs|floor|ceil|round|nCr|nPr|mod|root|inv|rand)\($/);
    const cut = m ? m[0].length : 1;
    setExpr(expr.slice(0, cursor - cut) + expr.slice(cursor));
    setCursor(cursor - cut);
  };

  const clearAll = () => {
    feedback('clear');
    setExpr('');
    setCursor(0);
    setResult(null);
    setIsEvaluated(false);
    setError('');
    setShowFraction(false);
  };

  const compute = () => {
    if (!expr.trim()) return;
    feedback('equals');
    try {
      const v = evaluate(expr, { angleMode, ans });
      setResult(v);
      setAns(v);
      setIsEvaluated(true);
      setError('');
      addHistory({ expression: expr, result: fmt(v), mode: 'Scientific' });
    } catch (e) {
      feedback('error');
      setError(e.message || 'Math Error');
      setResult(null);
    }
  };

  const moveCursor = (dir) => {
    feedback('toggle');
    if (isEvaluated) {
      const base = fmt(result ?? 0).replace(/,/g, '');
      setExpr(base);
      setCursor(base.length);
      setIsEvaluated(false);
      return;
    }
    setCursor((c) => Math.max(0, Math.min(expr.length, c + dir)));
  };

  const cycleAngle = () => {
    feedback('toggle');
    const order = ['DEG', 'RAD', 'GRAD'];
    updateSettings({ angleMode: order[(order.indexOf(angleMode) + 1) % 3] });
  };

  const copyResult = async () => {
    feedback('toggle');
    try {
      await navigator.clipboard.writeText(String(result !== null ? fmt(result) : expr));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* ignore */ }
  };

  /* ---------- Memory ---------- */
  const memAdd = (sign) => {
    feedback('toggle');
    const v = result !== null ? result : safeEvaluate(expr, { angleMode, ans });
    if (v === null) return;
    setMemoryBanks((b) => ({ ...b, M: (Number(b.M) || 0) + sign * v }));
  };
  const memRecall = () => {
    feedback('key');
    insert(String(memoryBanks.M ?? 0));
  };
  const memStore = () => {
    feedback('toggle');
    const v = result !== null ? result : safeEvaluate(expr, { angleMode, ans });
    if (v === null) return;
    setMemoryBanks((b) => ({ ...b, M: v }));
  };

  const fractionText = useMemo(() => {
    if (result === null) return null;
    const f = toFraction(result);
    return f ? `${f.num}/${f.den}` : null;
  }, [result]);

  /* ---------- Physical keyboard ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key;
      if (/^[0-9.]$/.test(k)) press(k);
      else if (['+', '-', '*', '/', '^', '(', ')', '!', '%'].includes(k)) press(k);
      else if (k === 'Enter' || k === '=') { e.preventDefault(); compute(); }
      else if (k === 'Backspace') { e.preventDefault(); backspace(); }
      else if (k === 'Escape') clearAll();
      else if (k === 'ArrowLeft') moveCursor(-1);
      else if (k === 'ArrowRight') moveCursor(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (formulaRef.current) formulaRef.current.scrollLeft = formulaRef.current.scrollWidth;
  }, [expr, cursor]);

  /* ---------- Key definitions (5 cols x 8 rows) ---------- */
  const trig = (base) => {
    const h = hyp ? base + 'h' : base;
    return shift ? `a${h}(` : `${h}(`;
  };
  const trigLabel = (base) => {
    const h = hyp ? base + 'h' : base;
    return shift ? `${h}⁻¹` : h;
  };
  const trigAlt = (base) => {
    const h = hyp ? base + 'h' : base;
    return shift ? h : `${h}⁻¹`;
  };

  const K = ({ label, alt, onClick, cls, size = 'text-[13px]', wide }) => (
    <button
      onClick={onClick}
      className={`${KEY_BASE} ${cls} ${wide ? 'col-span-2' : ''} px-0.5`}
    >
      {alt && (
        <span className={`absolute top-[2px] text-[7px] leading-none ${shift ? 'opacity-45' : ''} ${theme.funcAltLabel}`}>
          {alt}
        </span>
      )}
      <span className={`${size} ${alt ? 'mt-1.5' : ''}`}>{label}</span>
    </button>
  );

  return (
    <div className="h-full flex flex-col p-1.5 gap-1.5">
      {/* ================= LCD ================= */}
      <div
        className={`shrink-0 relative rounded-lg border-2 ${theme.lcdBg} ${theme.lcdBorder} px-2 py-1.5 overflow-hidden lcd-scanlines`}
        style={{ height: 118 }}
      >
        <div className={`absolute inset-0 ${theme.lcdGlow} pointer-events-none`} />

        {/* Status bar */}
        <div className="relative flex items-center gap-1 h-[15px] text-[8px] font-bold">
          <button onClick={cycleAngle} className={`px-1 rounded border ${theme.badge2nd} leading-none py-[1px]`}>
            {angleMode}
          </button>
          {shift && <span className={`px-1 rounded border ${theme.badge2nd} py-[1px]`}>SHIFT</span>}
          {hyp && <span className={`px-1 rounded border ${theme.badgeHyp} py-[1px]`}>HYP</span>}
          {Number(memoryBanks.M) !== 0 && (
            <span className={`px-1 rounded border ${theme.badgeMem} py-[1px]`}>M</span>
          )}
          {missing > 0 && (
            <span className={`${theme.lcdHeader} opacity-70`}>({missing} missing)</span>
          )}
          <span className="flex-1" />
          <button onClick={copyResult} className={`${theme.lcdHeader} opacity-70`}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
          </button>
        </div>

        {/* Formula line with animated cursor */}
        <div
          ref={formulaRef}
          className={`relative h-[30px] overflow-x-auto no-scrollbar flex items-center justify-end font-mono text-[15px] whitespace-nowrap ${theme.lcdFormula}`}
        >
          <span>
            {expr.slice(0, cursor)}
            <span className={`lcd-cursor border-l-2 ${theme.lcdFormula}`} style={{ borderColor: 'currentColor' }} />
            {expr.slice(cursor)}
            {!expr && <span className="opacity-40">0</span>}
          </span>
        </div>

        {/* Live preview */}
        <div className={`relative h-[16px] text-right font-mono text-[11px] truncate ${theme.lcdPreview}`}>
          {error ? <span className="text-rose-500 font-bold">{error}</span> : preview ? `= ${preview}` : '\u00A0'}
        </div>

        {/* Main result */}
        <div
          className={`relative text-right font-mono font-extrabold tabular-nums truncate ${theme.lcdResult}`}
          style={{ height: 34, fontSize: (() => { const s = result !== null ? fmt(result) : ''; return s.length > 16 ? '1.05rem' : s.length > 11 ? '1.4rem' : '1.9rem'; })(), lineHeight: '34px' }}
          onClick={() => { if (fractionText) { feedback('toggle'); setShowFraction((f) => !f); } }}
        >
          {result !== null ? (showFraction && fractionText ? fractionText : fmt(result)) : '\u00A0'}
        </div>
      </div>

      {/* ================= Keypad ================= */}
      <div className="flex-1 min-h-0 grid grid-cols-5 gap-1" style={{ gridTemplateRows: 'repeat(9, minmax(0, 1fr))' }}>
        {/* Row 1 */}
        <K label="SHIFT" cls={shift ? `${theme.equalKey} ring-2 ${theme.accentRing}` : theme.funcKey} size="text-[10px]"
           onClick={() => { feedback('toggle'); setShift((s) => !s); }} />
        <K label="hyp" cls={hyp ? `${theme.badgeHyp} border-b-2` : theme.funcKey} size="text-[11px]"
           onClick={() => { feedback('toggle'); setHyp((h) => !h); }} />
        <K label={trigLabel('sin')} alt={trigAlt('sin')} cls={theme.funcKey} size="text-[11px]" onClick={() => press(trig('sin'))} />
        <K label={trigLabel('cos')} alt={trigAlt('cos')} cls={theme.funcKey} size="text-[11px]" onClick={() => press(trig('cos'))} />
        <K label={trigLabel('tan')} alt={trigAlt('tan')} cls={theme.funcKey} size="text-[11px]" onClick={() => press(trig('tan'))} />

        {/* Row 2 */}
        <K label={shift ? '∛x' : '√x'} alt={shift ? '√x' : '∛x'} cls={theme.funcKey} onClick={() => press(shift ? 'cbrt(' : 'sqrt(')} />
        <K label={shift ? 'ʸ√x' : 'xʸ'} alt={shift ? 'xʸ' : 'ʸ√x'} cls={theme.funcKey} onClick={() => press(shift ? 'root(' : '^')} />
        <K label={shift ? 'x³' : 'x²'} alt={shift ? 'x²' : 'x³'} cls={theme.funcKey} onClick={() => press(shift ? '^3' : '^2')} />
        <K label={shift ? '10ˣ' : 'log'} alt={shift ? 'log' : '10ˣ'} cls={theme.funcKey} size="text-[11px]" onClick={() => press(shift ? '10^(' : 'log(')} />
        <K label={shift ? 'eˣ' : 'ln'} alt={shift ? 'ln' : 'eˣ'} cls={theme.funcKey} size="text-[11px]" onClick={() => press(shift ? 'exp(' : 'ln(')} />

        {/* Row 3 */}
        <K label={shift ? '|x|' : '¹⁄ₓ'} alt={shift ? '¹⁄ₓ' : '|x|'} cls={theme.funcKey} onClick={() => press(shift ? 'abs(' : 'inv(')} />
        <K label={shift ? 'mod' : 'x!'} alt={shift ? 'x!' : 'mod'} cls={theme.funcKey} size="text-[11px]" onClick={() => press(shift ? 'mod(' : '!')} />
        <K label={shift ? 'φ' : 'π'} alt={shift ? 'π' : 'φ'} cls={theme.funcKey} onClick={() => press(shift ? 'phi' : 'pi')} />
        <K label={shift ? 'RND' : 'e'} alt={shift ? 'e' : 'RND'} cls={theme.funcKey} size={shift ? 'text-[10px]' : 'text-[13px]'} onClick={() => press(shift ? 'rand()' : 'e')} />
        <K label={shift ? 'nPr' : 'nCr'} alt={shift ? 'nCr' : 'nPr'} cls={theme.funcKey} size="text-[11px]" onClick={() => press(shift ? 'nPr(' : 'nCr(')} />

        {/* Row 4 */}
        <K label="(" cls={theme.funcKey} onClick={() => press('(')} />
        <K label=")" cls={theme.funcKey} onClick={() => press(')')} />
        <K label="," cls={theme.funcKey} onClick={() => press(',')} />
        <K label={<ChevronLeft size={16} />} cls={theme.funcKey} onClick={() => moveCursor(-1)} />
        <K label={<ChevronRight size={16} />} cls={theme.funcKey} onClick={() => moveCursor(1)} />

        {/* Row 5 */}
        <K label="M+" cls={theme.funcKey} size="text-[11px]" onClick={() => memAdd(1)} />
        <K label="M−" cls={theme.funcKey} size="text-[11px]" onClick={() => memAdd(-1)} />
        <K label="MR" cls={theme.funcKey} size="text-[11px]" onClick={memRecall} />
        <K label="MS" cls={theme.funcKey} size="text-[11px]" onClick={memStore} />
        <K label="Ans" cls={theme.funcKey} size="text-[11px]" onClick={() => press('Ans')} />

        {/* Row 6 */}
        <K label="7" cls={theme.numKey} size="text-lg" onClick={() => press('7')} />
        <K label="8" cls={theme.numKey} size="text-lg" onClick={() => press('8')} />
        <K label="9" cls={theme.numKey} size="text-lg" onClick={() => press('9')} />
        <K label="AC" cls={theme.clearKey} size="text-[13px]" onClick={clearAll} />
        <K label={<Delete size={16} />} cls={theme.ceKey} onClick={backspace} />

        {/* Row 7 */}
        <K label="4" cls={theme.numKey} size="text-lg" onClick={() => press('4')} />
        <K label="5" cls={theme.numKey} size="text-lg" onClick={() => press('5')} />
        <K label="6" cls={theme.numKey} size="text-lg" onClick={() => press('6')} />
        <K label="×" cls={theme.opKey} size="text-lg" onClick={() => press('*')} />
        <K label="÷" cls={theme.opKey} size="text-lg" onClick={() => press('/')} />

        {/* Row 8 */}
        <K label="1" cls={theme.numKey} size="text-lg" onClick={() => press('1')} />
        <K label="2" cls={theme.numKey} size="text-lg" onClick={() => press('2')} />
        <K label="3" cls={theme.numKey} size="text-lg" onClick={() => press('3')} />
        <K label="+" cls={theme.opKey} size="text-lg" onClick={() => press('+')} />
        <K label="−" cls={theme.opKey} size="text-lg" onClick={() => press('-')} />

        {/* Row 9 (compact bottom) */}
        <K label="0" cls={theme.numKey} size="text-lg" onClick={() => press('0')} />
        <K label="." cls={theme.numKey} size="text-lg" onClick={() => press('.')} />
        <K label={shift ? 'ceil' : 'floor'} alt={shift ? 'floor' : 'ceil'} cls={theme.funcKey} size="text-[10px]"
           onClick={() => press(shift ? 'ceil(' : 'floor(')} />
        <K label="=" cls={theme.equalKey} size="text-xl" wide onClick={compute} />
      </div>
    </div>
  );
}
