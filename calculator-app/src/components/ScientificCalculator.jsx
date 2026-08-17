import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Copy, Check, Delete, ChevronDown } from 'lucide-react';
import { safeEvaluate, evaluate, formatResult, bracketBalance, toFraction } from '../utils/mathEngine.js';
import { KEY_BASE } from '../utils/themeStyles.js';
import { px, ico } from '../utils/scale.js';

export default function ScientificCalculator({
  theme, settings, updateSettings, addHistory, memoryBanks, setMemoryBanks,
  feedback, recallValue, clearRecall, scale,
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

  const fmt = useCallback(
    (v) => formatResult(v, { notation: settings.notation, precision: settings.precision, thousands: settings.thousands }),
    [settings.notation, settings.precision, settings.thousands]
  );

  const insert = useCallback(
    (token, opts = {}) => {
      setError(''); setShowFraction(false);
      let base = expr, pos = cursor;
      if (isEvaluated) {
        const isOperator = /^[+\-×÷*/^%]$/.test(token) || token === 'mod(';
        if (isOperator) { base = fmt(result ?? 0).replace(/,/g, ''); pos = base.length; }
        else { base = ''; pos = 0; }
        setIsEvaluated(false);
      }
      const next = base.slice(0, pos) + token + base.slice(pos);
      setExpr(next);
      setCursor(pos + token.length + (opts.cursorOffset || 0));
    },
    [expr, cursor, isEvaluated, result, fmt]
  );

  useEffect(() => {
    if (recallValue !== null && recallValue !== undefined) { insert(String(recallValue)); clearRecall(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recallValue]);

  const preview = useMemo(() => {
    if (!expr.trim() || isEvaluated) return null;
    const v = safeEvaluate(expr, { angleMode, ans });
    return v === null ? null : fmt(v);
  }, [expr, angleMode, ans, isEvaluated, fmt]);

  const missing = bracketBalance(expr);

  const press = (token, variant = 'key', opts) => {
    feedback(variant);
    insert(token, opts);
    if (opts?.consumeShift !== false && shift) setShift(false);
  };

  const backspace = () => {
    feedback('key'); setError('');
    if (isEvaluated) { setIsEvaluated(false); setExpr(''); setCursor(0); return; }
    if (cursor === 0) return;
    const before = expr.slice(0, cursor);
    const m = before.match(/(asinh|acosh|atanh|sinh|cosh|tanh|asin|acos|atan|sqrt|cbrt|log2|log10|log|ln|exp|abs|floor|ceil|round|nCr|nPr|mod|root|inv|rand)\($/);
    const cut = m ? m[0].length : 1;
    setExpr(expr.slice(0, cursor - cut) + expr.slice(cursor));
    setCursor(cursor - cut);
  };

  const clearAll = () => {
    feedback('clear');
    setExpr(''); setCursor(0); setResult(null);
    setIsEvaluated(false); setError(''); setShowFraction(false);
  };

  const compute = () => {
    if (!expr.trim()) return;
    feedback('equals');
    try {
      const v = evaluate(expr, { angleMode, ans });
      setResult(v); setAns(v); setIsEvaluated(true); setError('');
      addHistory({ expression: expr, result: fmt(v), mode: 'Scientific' });
    } catch (e) {
      feedback('error'); setError(e.message || 'Math Error'); setResult(null);
    }
  };

  const cycleAngle = () => {
    feedback('toggle');
    const order = ['DEG', 'RAD', 'GRAD'];
    updateSettings({ angleMode: order[(order.indexOf(angleMode) + 1) % 3] });
  };

  const cycleNotation = () => {
    feedback('toggle');
    const order = ['standard', 'sci', 'eng'];
    const i = order.indexOf(settings.notation);
    updateSettings({ notation: order[(i + 1) % 3] });
  };

  const copyResult = async () => {
    feedback('toggle');
    try {
      await navigator.clipboard.writeText(String(result !== null ? fmt(result) : expr));
      setCopied(true); setTimeout(() => setCopied(false), 1200);
    } catch { /* ignore */ }
  };

  const memAdd = (sign) => {
    feedback('toggle');
    const v = result !== null ? result : safeEvaluate(expr, { angleMode, ans });
    if (v === null) return;
    setMemoryBanks((b) => ({ ...b, M: (Number(b.M) || 0) + sign * v }));
  };
  const memRecall = () => { feedback('key'); insert(String(memoryBanks.M ?? 0)); };
  const memStore = () => {
    feedback('toggle');
    const v = result !== null ? result : safeEvaluate(expr, { angleMode, ans });
    if (v === null) return;
    setMemoryBanks((b) => ({ ...b, M: v }));
  };
  const memClear = () => { feedback('clear'); setMemoryBanks((b) => ({ ...b, M: 0 })); };

  const fractionText = useMemo(() => {
    if (result === null) return null;
    const f = toFraction(result);
    return f ? `${f.num}/${f.den}` : null;
  }, [result]);

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key;
      if (/^[0-9.]$/.test(k)) press(k);
      else if (['+', '-', '*', '/', '^', '(', ')', '!', '%'].includes(k)) press(k);
      else if (k === 'Enter' || k === '=') { e.preventDefault(); compute(); }
      else if (k === 'Backspace') { e.preventDefault(); backspace(); }
      else if (k === 'Escape') clearAll();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (formulaRef.current) formulaRef.current.scrollLeft = formulaRef.current.scrollWidth;
  }, [expr, cursor]);

  const trig = (b) => { const h = hyp ? b + 'h' : b; return shift ? `a${h}(` : `${h}(`; };
  const trigLabel = (b) => { const h = hyp ? b + 'h' : b; return shift ? `${h}⁻¹` : h; };
  const trigAlt = (b) => { const h = hyp ? b + 'h' : b; return shift ? h : `${h}⁻¹`; };

  /* ---- Keycap ---- */
  const K = ({ label, alt, onClick, cls, fs = 15, accent }) => (
    <button
      onClick={onClick}
      className={`${KEY_BASE} ${cls}`}
      style={{ borderRadius: px(9) }}
    >
      {alt && (
        <span
          className={`absolute ${theme.funcAltLabel}`}
          style={{ top: px(3.5), right: px(5), fontSize: px(8.5), lineHeight: 1, opacity: shift ? 0.45 : 1 }}
        >
          {alt}
        </span>
      )}
      <span
        className={accent ? theme.accent : ''}
        style={{ fontSize: px(fs), marginTop: alt ? px(6) : 0, fontVariantNumeric: 'tabular-nums' }}
      >
        {label}
      </span>
    </button>
  );

  const MemBtn = ({ label, onClick, children }) => (
    <button
      onClick={onClick}
      className={`${theme.chipBg} ${theme.chipText} flex items-center justify-center gap-0.5 active:scale-95 transition-transform`}
      style={{ borderRadius: px(6), height: px(24), fontSize: px(11), fontWeight: 600 }}
    >
      {label}{children}
    </button>
  );

  const resultText = error ? 'Error' : result !== null ? (showFraction && fractionText ? fractionText : fmt(result)) : (preview ?? '0');
  const rLen = String(resultText).length;
  const rSize = rLen > 16 ? 22 : rLen > 12 ? 27 : rLen > 8 ? 32 : 36;
  const notationLabel = settings.notation === 'sci' ? 'SCI' : settings.notation === 'eng' ? 'ENG' : 'NORMAL';

  return (
    <div className="h-full flex flex-col" style={{ paddingLeft: px(8.4), paddingRight: px(8.4), paddingBottom: px(8) }}>
      {/* ================= LCD ================= */}
      <div
        className={`shrink-0 relative ${theme.lcdBg} border-2 ${theme.lcdBorder} lcd-scanlines overflow-hidden flex flex-col`}
        style={{ height: px(127), borderRadius: px(12), padding: px(10), marginTop: px(3) }}
      >
        <div className={`absolute inset-0 ${theme.lcdGlow} pointer-events-none`} />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center" style={{ gap: px(5) }}>
            <button
              onClick={cycleAngle}
              className={`${theme.lcdChip} border font-bold active:scale-95`}
              style={{ fontSize: px(10), padding: `${px(2.5)} ${px(7)}`, borderRadius: px(5) }}
            >
              {angleMode}
            </button>
            {shift && (
              <span className={`${theme.badge2nd} border font-bold`} style={{ fontSize: px(9), padding: `${px(2)} ${px(5)}`, borderRadius: px(4) }}>2nd</span>
            )}
            {hyp && (
              <span className={`${theme.badgeHyp} border font-bold`} style={{ fontSize: px(9), padding: `${px(2)} ${px(5)}`, borderRadius: px(4) }}>hyp</span>
            )}
            {Number(memoryBanks.M) !== 0 && (
              <span className={`${theme.badgeMem} border font-bold`} style={{ fontSize: px(9), padding: `${px(2)} ${px(5)}`, borderRadius: px(4) }}>M</span>
            )}
          </div>
          <div className="flex items-center" style={{ gap: px(7) }}>
            <button onClick={cycleNotation} className={`${theme.lcdHeader} font-semibold`} style={{ fontSize: px(10) }}>
              {notationLabel}
            </button>
            <button onClick={copyResult} className={`${theme.lcdHeader} opacity-80 active:scale-90`}>
              {copied ? <Check size={ico(scale, 14)} /> : <Copy size={ico(scale, 14)} />}
            </button>
          </div>
        </div>

        {/* formula */}
        <div
          ref={formulaRef}
          className={`relative no-scrollbar overflow-x-auto whitespace-nowrap text-right tabular-nums ${theme.lcdFormula}`}
          style={{ fontSize: px(14), marginTop: px(6) }}
        >
          {expr ? (
            <>
              {expr.slice(0, cursor)}
              <span className={`lcd-cursor ${theme.lcdResult}`}>▌</span>
              {expr.slice(cursor)}
            </>
          ) : (
            <span className={theme.lcdPreview}><span className="lcd-cursor">▌</span> 0</span>
          )}
        </div>

        {missing > 0 && (
          <div className={`relative text-right ${theme.lcdPreview}`} style={{ fontSize: px(9) }}>
            ({missing} missing)
          </div>
        )}

        {/* result */}
        <div className="relative flex-1 flex items-end justify-end">
          <button
            onClick={() => { if (fractionText) { feedback('toggle'); setShowFraction((s) => !s); } }}
            className={`font-bold tabular-nums truncate text-right ${error ? 'text-red-700' : theme.lcdResult}`}
            style={{ fontSize: px(rSize), lineHeight: 1.05, maxWidth: '100%', fontVariantNumeric: 'tabular-nums' }}
          >
            {resultText}
          </button>
        </div>
      </div>

      {/* ================= Memory row ================= */}
      <div className="shrink-0 grid grid-cols-6" style={{ gap: px(4.2), marginTop: px(9) }}>
        <MemBtn label="MC" onClick={memClear} />
        <MemBtn label="MR" onClick={memRecall} />
        <MemBtn label="M+" onClick={() => memAdd(1)} />
        <MemBtn label="M−" onClick={() => memAdd(-1)} />
        <MemBtn label="MS" onClick={memStore} />
        <MemBtn label="MEM" onClick={() => { feedback('toggle'); memRecall(); }}>
          <ChevronDown size={ico(scale, 11)} />
        </MemBtn>
      </div>

      {/* ================= Keypad 5 x 8 ================= */}
      <div
        className="flex-1 min-h-0 grid grid-cols-5"
        style={{
          gap: px(4.2),
          marginTop: px(9),
          gridTemplateRows: 'repeat(4, 1fr) repeat(4, 1.1fr)',
        }}
      >
        {/* Row 1 */}
        <K label="SHIFT" cls={shift ? theme.badge2nd : theme.funcKey} fs={12}
           onClick={() => { feedback('toggle'); setShift((s) => !s); }} />
        <K label="hyp" cls={hyp ? theme.badgeHyp : theme.funcKey} fs={13}
           onClick={() => { feedback('toggle'); setHyp((h) => !h); }} />
        <K label={trigLabel('sin')} alt={trigAlt('sin')} cls={theme.funcKey} onClick={() => press(trig('sin'))} />
        <K label={trigLabel('cos')} alt={trigAlt('cos')} cls={theme.funcKey} onClick={() => press(trig('cos'))} />
        <K label={trigLabel('tan')} alt={trigAlt('tan')} cls={theme.funcKey} onClick={() => press(trig('tan'))} />

        {/* Row 2 */}
        <K label="√x" alt="³√x" cls={theme.funcKey} onClick={() => press(shift ? 'cbrt(' : 'sqrt(')} />
        <K label="xʸ" alt="ʸ√x" cls={theme.funcKey} onClick={() => press(shift ? 'root(' : '^')} />
        <K label="x²" alt="x³" cls={theme.funcKey} onClick={() => press(shift ? '^3' : '^2')} />
        <K label="log" alt="10ˣ" cls={theme.funcKey} onClick={() => press(shift ? '10^' : 'log(')} />
        <K label="ln" alt="eˣ" cls={theme.funcKey} onClick={() => press(shift ? 'exp(' : 'ln(')} />

        {/* Row 3 */}
        <K label="1/x" alt="|x|" cls={theme.funcKey} onClick={() => press(shift ? 'abs(' : 'inv(')} />
        <K label="x!" alt="mod" cls={theme.funcKey} onClick={() => press(shift ? 'mod(' : '!')} />
        <K label="π" alt="φ" cls={theme.funcKey} fs={16} onClick={() => press(shift ? 'φ' : 'π')} />
        <K label="e" alt="RND" cls={theme.funcKey} fs={16} onClick={() => press(shift ? 'rand()' : 'e')} />
        <K label={shift ? 'nPr' : 'nCr'} alt={shift ? 'nCr' : 'nPr'} cls={theme.funcKey} accent
           onClick={() => press(shift ? 'nPr(' : 'nCr(')} />

        {/* Row 4 */}
        <K label="AC" cls={theme.clearKey} fs={14} onClick={clearAll} />
        <K label="CE" cls={theme.ceKey} fs={14} onClick={() => { feedback('clear'); setExpr(''); setCursor(0); setError(''); }} />
        <K label={<Delete size={ico(scale, 18)} />} cls={theme.funcKey} onClick={backspace} />
        <K label="(" cls={theme.funcKey} fs={17} onClick={() => press('(')} />
        <K label=")" cls={theme.funcKey} fs={17} onClick={() => press(')')} />

        {/* Row 5 */}
        <K label="7" cls={theme.numKey} fs={19} onClick={() => press('7')} />
        <K label="8" cls={theme.numKey} fs={19} onClick={() => press('8')} />
        <K label="9" cls={theme.numKey} fs={19} onClick={() => press('9')} />
        <K label="÷" cls={theme.opKey} fs={19} onClick={() => press('÷')} />
        <K label="%" cls={theme.funcKey} fs={16} onClick={() => press('%')} />

        {/* Row 6 */}
        <K label="4" cls={theme.numKey} fs={19} onClick={() => press('4')} />
        <K label="5" cls={theme.numKey} fs={19} onClick={() => press('5')} />
        <K label="6" cls={theme.numKey} fs={19} onClick={() => press('6')} />
        <K label="×" cls={theme.opKey} fs={19} onClick={() => press('×')} />
        <K label="ANS" cls={theme.funcKey} fs={12} onClick={() => press('ans')} />

        {/* Row 7 */}
        <K label="1" cls={theme.numKey} fs={19} onClick={() => press('1')} />
        <K label="2" cls={theme.numKey} fs={19} onClick={() => press('2')} />
        <K label="3" cls={theme.numKey} fs={19} onClick={() => press('3')} />
        <K label="−" cls={theme.opKey} fs={19} onClick={() => press('-')} />
        <K label="floor" alt="ceil" cls={theme.funcKey} fs={12} onClick={() => press(shift ? 'ceil(' : 'floor(')} />

        {/* Row 8 */}
        <K label="±" cls={theme.funcKey} fs={17} onClick={() => press('-')} />
        <K label="0" cls={theme.numKey} fs={19} onClick={() => press('0')} />
        <K label="." cls={theme.numKey} fs={19} onClick={() => press('.')} />
        <K label="+" cls={theme.opKey} fs={19} onClick={() => press('+')} />
        <K label="=" cls={theme.equalKey} fs={19} onClick={compute} />
      </div>
    </div>
  );
}
