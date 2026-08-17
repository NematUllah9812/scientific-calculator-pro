import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Delete } from 'lucide-react';
import { evaluate, formatResult, cleanFloat } from '../utils/mathEngine.js';
import { KEY_BASE } from '../utils/themeStyles.js';

export default function SimpleCalculator({ theme, settings, addHistory, feedback, recallValue, clearRecall }) {
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

  const applyPending = (next) => {
    const cur = parseFloat(display.replace(/,/g, ''));
    if (accumulator === null || pendingOp === null) return cur;
    try {
      const res = evaluate(`${accumulator}${pendingOp}${cur}`, { angleMode: settings.angleMode });
      return res;
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
        setDisplay('Error');
        setAccumulator(null);
        setPendingOp(null);
        return;
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
      setDisplay('Error');
      setAccumulator(null);
      setPendingOp(null);
      setExpression('');
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
    setDisplay('0');
    setAccumulator(null);
    setPendingOp(null);
    setWaitingOperand(false);
    setExpression('');
  };

  const clearEntry = () => {
    feedback('clear');
    setDisplay('0');
    setWaitingOperand(false);
  };

  const backspace = () => {
    feedback('key');
    if (waitingOperand || display === 'Error') return;
    const s = display.length > 1 ? display.slice(0, -1) : '0';
    setDisplay(s === '-' ? '0' : s);
  };

  const toggleSign = () => {
    feedback('key');
    if (display === '0' || display === 'Error') return;
    setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
  };

  const percent = () => {
    feedback('key');
    const cur = parseFloat(display.replace(/,/g, ''));
    if (Number.isNaN(cur)) return;
    // Contextual: 200 + 10% -> 10% of 200
    if (accumulator !== null && (pendingOp === '+' || pendingOp === '-')) {
      setDisplay(fmt(cleanFloat((accumulator * cur) / 100)));
    } else {
      setDisplay(fmt(cleanFloat(cur / 100)));
    }
  };

  const unary = (kind) => {
    feedback('key');
    const cur = parseFloat(display.replace(/,/g, ''));
    if (Number.isNaN(cur)) return;
    try {
      let r;
      if (kind === 'sqrt') r = evaluate(`sqrt(${cur})`);
      else if (kind === 'sq') r = cleanFloat(cur * cur);
      else if (kind === 'inv') r = evaluate(`inv(${cur})`);
      setDisplay(fmt(r));
      setWaitingOperand(true);
    } catch {
      feedback('error');
      setDisplay('Error');
    }
  };

  const copy = async () => {
    feedback('toggle');
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };

  // Physical keyboard support
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

  const Btn = ({ children, cls, onClick, span, big }) => (
    <button
      onClick={onClick}
      className={`${KEY_BASE} ${cls} ${span ? 'col-span-2' : ''} ${big ? 'text-2xl' : 'text-xl'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="h-full flex flex-col p-2 gap-2">
      {/* Display */}
      <div className={`shrink-0 relative rounded-xl border-2 ${theme.lcdBg} ${theme.lcdBorder} p-3 lcd-scanlines overflow-hidden`}>
        <div className={`absolute inset-0 ${theme.lcdGlow} pointer-events-none`} />
        <div className="relative flex items-start justify-between h-4">
          <span className={`text-[9px] font-bold tracking-widest ${theme.lcdHeader}`}>
            {pendingOp ? 'CALCULATING' : 'READY'}
          </span>
          <button onClick={copy} className={`${theme.lcdHeader} opacity-70 active:opacity-100`}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
        <div className={`relative h-4 text-right text-[11px] font-mono truncate ${theme.lcdPreview}`}>
          {expression || '\u00A0'}
        </div>
        <div
          className={`relative text-right font-mono font-bold tabular-nums truncate ${theme.lcdResult}`}
          style={{ fontSize: display.length > 12 ? '1.6rem' : display.length > 9 ? '2rem' : '2.6rem', lineHeight: 1.15 }}
        >
          {display}
        </div>
      </div>

      {/* Keypad */}
      <div className="flex-1 min-h-0 grid grid-cols-4 grid-rows-6 gap-1.5">
        <Btn cls={theme.funcKey} onClick={() => unary('sq')}>x²</Btn>
        <Btn cls={theme.funcKey} onClick={() => unary('sqrt')}>√x</Btn>
        <Btn cls={theme.funcKey} onClick={() => unary('inv')}>¹⁄ₓ</Btn>
        <Btn cls={theme.funcKey} onClick={percent}>%</Btn>

        <Btn cls={theme.clearKey} onClick={clearAll}>AC</Btn>
        <Btn cls={theme.ceKey} onClick={clearEntry}>CE</Btn>
        <Btn cls={theme.ceKey} onClick={backspace}><Delete size={20} /></Btn>
        <Btn cls={theme.opKey} onClick={() => handleOperator('÷')}>÷</Btn>

        <Btn cls={theme.numKey} big onClick={() => inputDigit('7')}>7</Btn>
        <Btn cls={theme.numKey} big onClick={() => inputDigit('8')}>8</Btn>
        <Btn cls={theme.numKey} big onClick={() => inputDigit('9')}>9</Btn>
        <Btn cls={theme.opKey} onClick={() => handleOperator('×')}>×</Btn>

        <Btn cls={theme.numKey} big onClick={() => inputDigit('4')}>4</Btn>
        <Btn cls={theme.numKey} big onClick={() => inputDigit('5')}>5</Btn>
        <Btn cls={theme.numKey} big onClick={() => inputDigit('6')}>6</Btn>
        <Btn cls={theme.opKey} onClick={() => handleOperator('−')}>−</Btn>

        <Btn cls={theme.numKey} big onClick={() => inputDigit('1')}>1</Btn>
        <Btn cls={theme.numKey} big onClick={() => inputDigit('2')}>2</Btn>
        <Btn cls={theme.numKey} big onClick={() => inputDigit('3')}>3</Btn>
        <Btn cls={theme.opKey} onClick={() => handleOperator('+')}>+</Btn>

        <Btn cls={theme.numKey} onClick={toggleSign}>±</Btn>
        <Btn cls={theme.numKey} big onClick={() => inputDigit('0')}>0</Btn>
        <Btn cls={theme.numKey} big onClick={() => inputDigit('.')}>.</Btn>
        <Btn cls={theme.equalKey} big onClick={handleEquals}>=</Btn>
      </div>
    </div>
  );
}
