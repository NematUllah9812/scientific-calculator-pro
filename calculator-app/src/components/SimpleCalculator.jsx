import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Delete, Percent, Divide, X, Minus, Plus, Equal, Sigma } from 'lucide-react';
import { evaluate, formatResult, cleanFloat } from '../utils/mathEngine.js';
import { px, ico } from '../utils/scale.js';

export default function SimpleCalculator({
  theme, settings, addHistory, feedback, recallValue, clearRecall, scale, updateSettings,
}) {
  const [display, setDisplay] = useState('0');
  const [accumulator, setAccumulator] = useState(null);
  const [pendingOp, setPendingOp] = useState(null);
  const [waitingOperand, setWaitingOperand] = useState(false);
  const [expression, setExpression] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (recallValue !== null && recallValue !== undefined) {
      setDisplay(String(recallValue));
      setWaitingOperand(true);
      clearRecall();
    }
  }, [recallValue, clearRecall]);

  const fmt = useCallback(
    (v) => formatResult(v, { notation: 'standard', precision: settings.precision, thousands: settings.thousands }),
    [settings.precision, settings.thousands]
  );

  const inputDigit = (d) => {
    feedback('key');
    if (waitingOperand || display === '0' || display === 'Error') {
      setDisplay(d === '.' ? '0.' : d);
      setWaitingOperand(false);
      return;
    }
    if (d === '.' && display.includes('.')) return;
    if (display.replace(/[-.]/g, '').length >= 15) return;
    setDisplay(display + d);
  };

  const applyPending = () => {
    const cur = parseFloat(display.replace(/,/g, ''));
    if (accumulator === null || pendingOp === null) return cur;
    try {
      return evaluate(`${accumulator}${pendingOp}${cur}`, { angleMode: settings.angleMode });
    } catch {
      return NaN;
    }
  };

  const handleOperator = (op) => {
    feedback('key');
    const cur = parseFloat(display.replace(/,/g, ''));
    if (Number.isNaN(cur)) return;

    if (accumulator !== null && pendingOp && !waitingOperand) {
      const res = applyPending();
      if (Number.isNaN(res)) {
        setDisplay('Error'); setAccumulator(null); setPendingOp(null); return;
      }
      setAccumulator(res);
      setDisplay(fmt(res));
      setExpression(`${fmt(res)} ${op}`);
    } else {
      setAccumulator(cur);
      setExpression(`${fmt(cur)} ${op}`);
    }
    setPendingOp(op === '×' ? '*' : op === '÷' ? '/' : op === '−' ? '-' : op);
    setWaitingOperand(true);
  };

  const handleEquals = () => {
    feedback('equals');
    if (accumulator === null || pendingOp === null) return;
    const cur = parseFloat(display.replace(/,/g, ''));
    const res = applyPending();
    if (Number.isNaN(res) || !isFinite(res)) {
      feedback('error');
      setDisplay('Error'); setAccumulator(null); setPendingOp(null); setExpression('');
      return;
    }
    const opSym = pendingOp === '*' ? '×' : pendingOp === '/' ? '÷' : pendingOp === '-' ? '−' : pendingOp;
    const expr = `${fmt(accumulator)} ${opSym} ${fmt(cur)}`;
    addHistory({ expression: expr, result: fmt(res), mode: 'Simple' });
    setExpression(`${expr} =`);
    setDisplay(fmt(res));
    setAccumulator(null);
    setPendingOp(null);
    setWaitingOperand(true);
  };

  const clearAll = () => {
    feedback('clear');
    setDisplay('0'); setAccumulator(null); setPendingOp(null);
    setWaitingOperand(false); setExpression('');
  };

  const backspace = () => {
    feedback('key');
    if (waitingOperand || display === 'Error') return;
    const s = display.length > 1 ? display.slice(0, -1) : '0';
    setDisplay(s === '-' ? '0' : s);
  };

  const percent = () => {
    feedback('key');
    const cur = parseFloat(display.replace(/,/g, ''));
    if (Number.isNaN(cur)) return;
    if (accumulator !== null && (pendingOp === '+' || pendingOp === '-')) {
      setDisplay(fmt(cleanFloat((accumulator * cur) / 100)));
    } else {
      setDisplay(fmt(cleanFloat(cur / 100)));
    }
  };

  const copy = async () => {
    feedback('toggle');
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key;
      if (k >= '0' && k <= '9') inputDigit(k);
      else if (k === '.') inputDigit('.');
      else if (['+', '-', '*', '/'].includes(k)) handleOperator(k);
      else if (k === 'Enter' || k === '=') { e.preventDefault(); handleEquals(); }
      else if (k === 'Backspace') backspace();
      else if (k === 'Escape') clearAll();
      else if (k === '%') percent();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* Round keys, sized to fill the available area evenly. */
  const Round = ({ children, cls, onClick, fs = 22 }) => (
    <button
      onClick={onClick}
      className={`${cls} flex items-center justify-center rounded-full aspect-square w-full
        transition-[transform,background-color] duration-75 active:scale-95 font-medium`}
      style={{ fontSize: px(fs) }}
    >
      {children}
    </button>
  );

  const resultSize = display.length > 14 ? 30 : display.length > 10 ? 38 : 46;

  return (
    <div className="h-full flex flex-col" style={{ padding: px(12), gap: px(10) }}>
      {/* ================= LCD ================= */}
      <div
        className={`shrink-0 relative ${theme.lcdBg} border-2 ${theme.lcdBorder} lcd-scanlines overflow-hidden flex flex-col`}
        style={{ borderRadius: px(14), padding: px(14), height: px(196) }}
      >
        <div className={`absolute inset-0 ${theme.lcdGlow} pointer-events-none`} />
        <div className="relative flex items-start justify-between">
          <span
            className={`font-bold uppercase ${theme.lcdHeader}`}
            style={{ fontSize: px(11), letterSpacing: px(0.8) }}
          >
            Simple Calculator
          </span>
          <button onClick={copy} className={`${theme.lcdHeader} opacity-80 active:scale-90`}>
            {copied ? <Check size={ico(scale, 15)} /> : <Copy size={ico(scale, 15)} />}
          </button>
        </div>

        <div className="relative flex-1 flex flex-col justify-end text-right">
          <div
            className={`truncate ${theme.lcdPreview}`}
            style={{ fontSize: px(13), marginBottom: px(6), fontVariantNumeric: 'tabular-nums' }}
          >
            {expression || (
              <span style={{ opacity: 0.55 }}>
                <span className={theme.lcdResult} style={{ opacity: 0.5 }}>▌</span> 0
              </span>
            )}
          </div>
          <div
            className={`font-bold truncate ${theme.lcdResult}`}
            style={{ fontSize: px(resultSize), lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}
          >
            {display}
          </div>
        </div>
      </div>

      {/* ================= Round keypad ================= */}
      <div
        className="flex-1 min-h-0 grid grid-cols-4 place-items-center"
        style={{ gap: px(10), paddingTop: px(6) }}
      >
        <Round cls={theme.clearKey} onClick={clearAll} fs={19}>AC</Round>
        <Round cls={theme.numKey} onClick={percent}><Percent size={ico(scale, 21)} /></Round>
        <Round cls={theme.numKey} onClick={backspace}><Delete size={ico(scale, 22)} /></Round>
        <Round cls={theme.opKey} onClick={() => handleOperator('÷')}><Divide size={ico(scale, 22)} /></Round>

        <Round cls={theme.numKey} onClick={() => inputDigit('7')}>7</Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('8')}>8</Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('9')}>9</Round>
        <Round cls={theme.opKey} onClick={() => handleOperator('×')}><X size={ico(scale, 21)} /></Round>

        <Round cls={theme.numKey} onClick={() => inputDigit('4')}>4</Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('5')}>5</Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('6')}>6</Round>
        <Round cls={theme.opKey} onClick={() => handleOperator('−')}><Minus size={ico(scale, 21)} /></Round>

        <Round cls={theme.numKey} onClick={() => inputDigit('1')}>1</Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('2')}>2</Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('3')}>3</Round>
        <Round cls={theme.opKey} onClick={() => handleOperator('+')}><Plus size={ico(scale, 21)} /></Round>

        {/* Bottom-left tile mirrors the reference: a small "scientific" hint badge */}
        <Round cls={theme.numKey} onClick={() => { feedback('toggle'); updateSettings?.({}); }} fs={13}>
          <span
            className={`flex items-center justify-center border rounded ${theme.panelBorder}`}
            style={{ width: px(26), height: px(26), fontSize: px(9), lineHeight: 1.05 }}
          >
            <span style={{ display: 'block' }}>√ π<br />e =</span>
          </span>
        </Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('0')}>0</Round>
        <Round cls={theme.numKey} onClick={() => inputDigit('.')}>.</Round>
        <Round cls={theme.equalKey} onClick={handleEquals}><Equal size={ico(scale, 23)} /></Round>
      </div>
    </div>
  );
}
