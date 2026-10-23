import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Copy, Check, Delete, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { safeEvaluate, evaluate, formatResult, bracketBalance, toFraction, previewValue } from '../utils/mathEngine.js';
import { KEY_BASE } from '../utils/themeStyles.js';
import { px, ico } from '../utils/scale.js';
import { useHardwareKeyboard } from '../utils/useKeyboard.js';
import { ripple } from '../utils/ripple.js';

const NOTATIONS = ['standard', 'scientific', 'engineering'];
const NOTATION_LABEL = { standard: 'NORMAL', scientific: 'SCI', engineering: 'ENG' };
const ANGLES = ['DEG', 'RAD', 'GRAD'];

const plain = (s) => String(s).replace(/,/g, '');
const isOpChar = (c) => '+-×÷*/^%()'.includes(c);

export default function ScientificCalculator({
  theme, settings, updateSettings, addHistory, memoryBanks, setMemoryBanks,
  feedback, recallValue, clearRecall, scale, active = true,
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
  const charRefs = useRef([]);

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
        const continues =
          /^[+\-×÷*/^%]$/.test(token) ||
          ['mod(', 'root(', 'nCr(', 'nPr(', 'atan2('].includes(token);
        if (continues) { base = plain(fmt(result ?? 0)); pos = base.length; }
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
    if (recallValue !== null && recallValue !== undefined) {
      insert(plain(String(recallValue)));
      clearRecall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recallValue]);

  const preview = useMemo(() => {
    if (!expr.trim() || isEvaluated) return null;
    const v = previewValue(expr, { angleMode, ans });
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

  /* CE clears the number you are currently typing, not the whole sum. */
  const clearEntry = () => {
    feedback('clear'); setError('');
    if (isEvaluated) { setIsEvaluated(false); setExpr(''); setCursor(0); return; }
    const before = expr.slice(0, cursor);
    const m = before.match(/(\d+\.?\d*)$/);
    if (!m) { setExpr(''); setCursor(0); return; }
    const start = cursor - m[0].length;
    setExpr(expr.slice(0, start) + expr.slice(cursor));
    setCursor(start);
  };

  /* ± negates the number the caret sits in. */
  const negate = () => {
    feedback('key'); setError('');
    const before = expr.slice(0, cursor);
    const m = before.match(/(\d+\.?\d*)$/);
    if (!m) { press('-'); return; }
    const start = cursor - m[0].length;
    const num = parseFloat(m[0]);
    const rep = num < 0 ? String(Math.abs(num)) : '-' + m[0];
    setExpr(expr.slice(0, start) + rep + expr.slice(cursor));
    setCursor(start + rep.length);
  };

  const clearAll = () => {
    feedback('clear');
    setExpr(''); setCursor(0); setResult(null);
    setIsEvaluated(false); setError(''); setShowFraction(false);
  };

  /* ---------- caret editing: go back and change what you typed ---------- */
  const moveCaret = (delta) => {
    feedback('key');
    setIsEvaluated(false);
    setError('');
    setCursor((c) => Math.max(0, Math.min(expr.length, c + delta)));
  };

  const placeCaret = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    let best = expr.length;
    let bestDist = Infinity;
    charRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vGap = y < r.top ? r.top - y : y > r.bottom ? r.bottom - y : 0;
      [[r.left, i], [r.right, i + 1]].forEach(([edge, idx]) => {
        const d = Math.abs(x - edge) + vGap * 4;
        if (d < bestDist) { bestDist = d; best = idx; }
      });
    });
    setIsEvaluated(false);
    setCursor(best);
    feedback('toggle');
  };

  const compute = () => {
    if (!expr.trim()) return;
    feedback('equals');
    try {
      const v = evaluate(expr, { angleMode, ans });
      setResult(v); setAns(v); setIsEvaluated(true); setError('');
      setCursor(expr.length);
      addHistory({ expression: expr, result: fmt(v), mode: 'Scientific' });
    } catch (e) {
      feedback('error'); setError(e.message || 'Math Error'); setResult(null);
    }
  };

  const cycleAngle = () => {
    feedback('toggle');
    updateSettings({ angleMode: ANGLES[(ANGLES.indexOf(angleMode) + 1) % ANGLES.length] });
  };

  const cycleNotation = () => {
    feedback('toggle');
    const i = NOTATIONS.indexOf(settings.notation);
    updateSettings({ notation: NOTATIONS[(i + 1) % NOTATIONS.length] });
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
  const memRecall = () => { feedback('key'); insert(plain(String(memoryBanks.M ?? 0))); };
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

  useHardwareKeyboard(active, (e) => {
    const k = e.key;
    if (/^[0-9.]$/.test(k)) press(k);
    else if (['+', '-', '*', '/', '^', '(', ')', '!', '%'].includes(k)) press(k);
    else if (k === 'Enter' || k === '=') { e.preventDefault(); compute(); }
    else if (k === 'Backspace') { e.preventDefault(); backspace(); }
    else if (k === 'Escape') clearAll();
    else if (k === 'ArrowLeft') { e.preventDefault(); moveCaret(-1); }
    else if (k === 'ArrowRight') { e.preventDefault(); moveCaret(1); }
    else if (k === 'Home') { e.preventDefault(); setCursor(0); }
    else if (k === 'End') { e.preventDefault(); setCursor(expr.length); }
  });

  const trig = (b) => { const h = hyp ? b + 'h' : b; return shift ? `a${h}(` : `${h}(`; };
  const trigLabel = (b) => { const h = hyp ? b + 'h' : b; return shift ? `${h}⁻¹` : h; };
  const trigAlt = (b) => { const h = hyp ? b + 'h' : b; return shift ? h : `${h}⁻¹`; };

  /* ---- Keycap: frosted glass pane, tap ripple, press feedback ---- */
  const K = ({ label, alt, onClick, cls, fs = 15, accent }) => (
    <button
      onClick={onClick}
      onPointerDown={ripple}
      className={`${KEY_BASE} ${cls}`}
      style={{ borderRadius: px(15) }}
    >
      {alt && (
        <span
          className={`absolute ${theme.funcAltLabel}`}
          style={{ top: px(4), right: px(5), fontSize: px(8.5), lineHeight: 1, opacity: shift ? 0.4 : 0.85 }}
        >
          {alt}
        </span>
      )}
      <span
        className={accent ? theme.accent : ''}
        style={{ fontSize: px(fs), marginTop: alt ? px(7) : 0, fontVariantNumeric: 'tabular-nums' }}
      >
        {label}
      </span>
    </button>
  );

  const MemBtn = ({ label, onClick, children }) => (
    <button
      onClick={onClick}
      onPointerDown={ripple}
      className={`${theme.chipBg} ${theme.chipText} flex items-center justify-center gap-0.5
        active:scale-95 transition-transform`}
      style={{ borderRadius: px(9), height: px(26), fontSize: px(11), fontWeight: 600 }}
    >
      {label}{children}
    </button>
  );

  /* While the expression is being edited the live preview is shown — a
     stale value from the last "=" must never linger on screen. */
  const resultText = error
    ? 'Error'
    : isEvaluated && result !== null
      ? (showFraction && fractionText ? fractionText : fmt(result))
      : (preview ?? '0');
  const rLen = String(resultText).length;
  const rSize = rLen > 20 ? 30 : rLen > 16 ? 36 : rLen > 13 ? 43 : rLen > 10 ? 50 : rLen > 7 ? 58 : 64;
  const notationLabel = NOTATION_LABEL[settings.notation] || 'NORMAL';

  const exprLen = expr.length;
  const exprSize = exprLen > 30 ? 13 : exprLen > 20 ? 15 : 18;
  const chars = expr.split('');
  charRefs.current.length = chars.length;

  return (
    <div className="h-full flex flex-col" style={{ paddingLeft: px(10), paddingRight: px(10), paddingBottom: px(10) }}>
      {/* ================= Display ================= */}
      <div className="flex-1 min-h-0 flex flex-col" style={{ paddingTop: px(4) }}>
        {/* status row */}
        <div className="shrink-0 flex items-center justify-between" style={{ gap: px(6) }}>
          <div className="flex items-center flex-wrap" style={{ gap: px(5) }}>
            <button
              onClick={cycleAngle}
              className={`${theme.lcdChip} border font-bold active:scale-95`}
              style={{ fontSize: px(10), padding: `${px(3)} ${px(8)}`, borderRadius: px(7) }}
            >
              {angleMode}
            </button>
            {shift && (
              <span className={`${theme.badge2nd} border font-bold`} style={{ fontSize: px(9), padding: `${px(3)} ${px(6)}`, borderRadius: px(5) }}>2nd</span>
            )}
            {hyp && (
              <span className={`${theme.badgeHyp} border font-bold`} style={{ fontSize: px(9), padding: `${px(3)} ${px(6)}`, borderRadius: px(5) }}>hyp</span>
            )}
            {Number(memoryBanks.M) !== 0 && (
              <span className={`${theme.badgeMem} border font-bold`} style={{ fontSize: px(9), padding: `${px(3)} ${px(6)}`, borderRadius: px(5) }}>M</span>
            )}
          </div>
          <div className="flex items-center shrink-0" style={{ gap: px(10) }}>
            <button onClick={cycleNotation} className={`${theme.mutedText} font-semibold`} style={{ fontSize: px(10), letterSpacing: px(0.4) }}>
              {notationLabel}
            </button>
            <button onClick={copyResult} aria-label="Copy result" className={`${theme.mutedText} active:scale-90`}>
              {copied ? <Check size={ico(scale, 14)} /> : <Copy size={ico(scale, 14)} />}
            </button>
          </div>
        </div>

        {/* formula + result, anchored to the bottom of the display area */}
        <div className="flex-1 min-h-0 flex flex-col justify-end">
          {/* caret controls + editable formula */}
          <div className="flex items-start" style={{ gap: px(6) }}>
            <div className="shrink-0 flex items-center" style={{ gap: px(1), marginTop: px(2) }}>
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
            </div>

            <div
              onPointerDown={placeCaret}
              className="flex-1 min-w-0 text-right cursor-text break-words"
              style={{ minHeight: px(exprSize * 1.4) }}
            >
              {chars.length > 0 ? (
                <div
                  className={`${theme.lcdFormula} inline-flex flex-wrap justify-end items-baseline`}
                  style={{ fontSize: px(exprSize), fontVariantNumeric: 'tabular-nums' }}
                >
                  {chars.map((ch, i) => (
                    <React.Fragment key={i}>
                      {cursor === i && (
                        <span
                          className="lcd-cursor"
                          style={{ borderLeft: `${px(2)} solid currentColor`, height: px(exprSize * 0.95) }}
                        />
                      )}
                      <span
                        ref={(el) => { charRefs.current[i] = el; }}
                        style={{
                          whiteSpace: 'pre',
                          opacity: isOpChar(ch) ? 0.72 : 1,
                          padding: isOpChar(ch) ? `0 ${px(2)}` : 0,
                        }}
                      >
                        {ch}
                      </span>
                    </React.Fragment>
                  ))}
                  {cursor === chars.length && (
                    <span
                      className="lcd-cursor"
                      style={{ borderLeft: `${px(2)} solid currentColor`, height: px(exprSize * 0.95) }}
                    />
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {missing > 0 && (
            <div className={`text-right ${theme.mutedText}`} style={{ fontSize: px(9) }}>
              ({missing} missing)
            </div>
          )}

          {/* result */}
          <div className="flex items-end justify-end" style={{ marginTop: px(2) }}>
            <button
              onClick={() => { if (fractionText) { feedback('toggle'); setShowFraction((s) => !s); } }}
              className={`font-semibold tabular-nums truncate text-right ${error ? 'text-rose-500' : theme.lcdResult}`}
              style={{ fontSize: px(rSize), lineHeight: 1.05, maxWidth: '100%', letterSpacing: px(-0.8) }}
            >
              {resultText}
            </button>
          </div>
        </div>
      </div>

      {/* ================= Memory row ================= */}
      <div className="shrink-0 grid grid-cols-6" style={{ gap: px(5), marginTop: px(8) }}>
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
        className="shrink-0 grid grid-cols-5"
        style={{
          gap: px(7),
          marginTop: px(8),
          height: px(566),
          gridTemplateRows: 'repeat(4, 1fr) repeat(4, 1.12fr)',
        }}
      >
        {/* Row 1 */}
        <K label="SHIFT" cls={shift ? theme.badge2nd : theme.funcKey} fs={11}
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
        <K label="CE" cls={theme.ceKey} fs={14} onClick={clearEntry} />
        <K label={<Delete size={ico(scale, 18)} />} cls={theme.funcKey} onClick={backspace} />
        <K label="(" cls={theme.funcKey} fs={17} onClick={() => press('(')} />
        <K label=")" cls={theme.funcKey} fs={17} onClick={() => press(')')} />

        {/* Row 5 */}
        <K label="7" cls={theme.numKey} fs={20} onClick={() => press('7')} />
        <K label="8" cls={theme.numKey} fs={20} onClick={() => press('8')} />
        <K label="9" cls={theme.numKey} fs={20} onClick={() => press('9')} />
        <K label="÷" cls={theme.opKey} fs={20} onClick={() => press('÷')} />
        <K label="%" cls={theme.funcKey} fs={16} onClick={() => press('%')} />

        {/* Row 6 */}
        <K label="4" cls={theme.numKey} fs={20} onClick={() => press('4')} />
        <K label="5" cls={theme.numKey} fs={20} onClick={() => press('5')} />
        <K label="6" cls={theme.numKey} fs={20} onClick={() => press('6')} />
        <K label="×" cls={theme.opKey} fs={20} onClick={() => press('×')} />
        <K label="ANS" cls={theme.funcKey} fs={11} onClick={() => press('ans')} />

        {/* Row 7 */}
        <K label="1" cls={theme.numKey} fs={20} onClick={() => press('1')} />
        <K label="2" cls={theme.numKey} fs={20} onClick={() => press('2')} />
        <K label="3" cls={theme.numKey} fs={20} onClick={() => press('3')} />
        <K label="−" cls={theme.opKey} fs={20} onClick={() => press('-')} />
        <K label="floor" alt="ceil" cls={theme.funcKey} fs={11} onClick={() => press(shift ? 'ceil(' : 'floor(')} />

        {/* Row 8 */}
        <K label="±" cls={theme.funcKey} fs={18} onClick={negate} />
        <K label="0" cls={theme.numKey} fs={20} onClick={() => press('0')} />
        <K label="." cls={theme.numKey} fs={20} onClick={() => press('.')} />
        <K label="+" cls={theme.opKey} fs={20} onClick={() => press('+')} />
        <K label="=" cls={theme.equalKey} fs={20} onClick={compute} />
      </div>
    </div>
  );
}
