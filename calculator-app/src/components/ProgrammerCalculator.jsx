import React, { useState, useMemo, useCallback } from 'react';
import { Copy, Check, Delete } from 'lucide-react';
import {
  WORD_SIZES, RADIX_INFO, wrap, toSigned, formatRadix, groupDigits, toBinaryString,
  parseRadix, isDigitAllowed, alu, bitNot, toggleBit, popCount, bitLength, toAscii,
} from '../utils/programmerEngine.js';
import { KEY_BASE } from '../utils/themeStyles.js';

const HEX_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function ProgrammerCalculator({ theme, addHistory, feedback }) {
  const [radix, setRadix] = useState('DEC');
  const [bits, setBits] = useState(32);
  const [signed, setSigned] = useState(true);
  const [value, setValue] = useState(0n);
  const [entry, setEntry] = useState('0');
  const [acc, setAcc] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState('keys');

  const current = useMemo(() => parseRadix(entry, radix, bits), [entry, radix, bits]);

  const setFromBig = useCallback(
    (v) => {
      const w = wrap(v, bits);
      setValue(w);
      setEntry(formatRadix(w, bits, radix, signed && radix === 'DEC'));
      setFresh(true);
    },
    [bits, radix, signed]
  );

  const pressDigit = (d) => {
    feedback('key');
    if (!isDigitAllowed(d, radix)) return;
    const base = fresh || entry === '0' ? '' : entry;
    const next = base + d;
    const parsed = parseRadix(next, radix, bits);
    // Prevent overflow beyond word size
    if (next.replace(/[\s,-]/g, '').length > 70) return;
    setEntry(formatRadix(parsed, bits, radix, signed && radix === 'DEC'));
    setValue(parsed);
    setFresh(false);
  };

  const applyOp = () => {
    if (acc === null || !op) return current;
    try {
      return alu(op, acc, current, bits);
    } catch {
      return null;
    }
  };

  const pressOp = (o) => {
    feedback('key');
    if (acc !== null && op && !fresh) {
      const r = applyOp();
      if (r === null) return;
      setAcc(r);
      setFromBig(r);
    } else {
      setAcc(current);
    }
    setOp(o);
    setFresh(true);
  };

  const equals = () => {
    feedback('equals');
    if (acc === null || !op) return;
    const r = applyOp();
    if (r === null) {
      feedback('error');
      return;
    }
    addHistory({
      expression: `${formatRadix(acc, bits, radix, signed)} ${op} ${formatRadix(current, bits, radix, signed)}`,
      result: formatRadix(r, bits, radix, signed),
      mode: `Prog ${radix}${bits}`,
    });
    setFromBig(r);
    setAcc(null);
    setOp(null);
  };

  const clearAll = () => {
    feedback('clear');
    setValue(0n);
    setEntry('0');
    setAcc(null);
    setOp(null);
    setFresh(true);
  };

  const backspace = () => {
    feedback('key');
    const raw = entry.replace(/[\s,]/g, '');
    const next = raw.length > 1 ? raw.slice(0, -1) : '0';
    const p = parseRadix(next, radix, bits);
    setEntry(formatRadix(p, bits, radix, signed && radix === 'DEC'));
    setValue(p);
    setFresh(false);
  };

  const unaryNot = () => {
    feedback('key');
    setFromBig(bitNot(current, bits));
  };

  const negate = () => {
    feedback('key');
    setFromBig(wrap(-toSigned(current, bits), bits));
  };

  const switchRadix = (r) => {
    feedback('toggle');
    setRadix(r);
    setEntry(formatRadix(current, bits, r, signed && r === 'DEC'));
    setFresh(true);
  };

  const switchBits = (b) => {
    feedback('toggle');
    setBits(b);
    const w = wrap(current, b);
    setValue(w);
    setEntry(formatRadix(w, b, radix, signed && radix === 'DEC'));
    setFresh(true);
  };

  const flipBit = (i) => {
    feedback('key');
    setFromBig(toggleBit(current, i, bits));
  };

  const copy = async () => {
    feedback('toggle');
    try {
      await navigator.clipboard.writeText(entry.replace(/[\s,]/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* ignore */ }
  };

  const bin = toBinaryString(current, bits);
  const rows = [];
  for (let i = 0; i < bits; i += 16) rows.push(bin.slice(i, i + 16));

  const K = ({ label, cls, onClick, size = 'text-[13px]', disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${KEY_BASE} ${cls} ${size} ${disabled ? 'opacity-30' : ''}`}
    >
      {label}
    </button>
  );

  return (
    <div className="h-full flex flex-col p-1.5 gap-1.5 overflow-hidden">
      {/* ---------- 4-radix HUD ---------- */}
      <div className={`shrink-0 rounded-lg border-2 ${theme.lcdBg} ${theme.lcdBorder} p-1.5 relative overflow-hidden`}>
        <div className={`absolute inset-0 ${theme.lcdGlow} pointer-events-none`} />
        <div className="relative flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <span className={`text-[8px] font-bold ${theme.lcdHeader}`}>{bits}-BIT</span>
            <button
              onClick={() => { feedback('toggle'); setSigned((s) => !s); }}
              className={`text-[8px] font-bold px-1 rounded border ${theme.badge2nd}`}
            >
              {signed ? 'SIGNED' : 'UNSIGNED'}
            </button>
            {op && <span className={`text-[8px] font-bold ${theme.lcdHeader}`}>{op}</span>}
          </div>
          <button onClick={copy} className={theme.lcdHeader}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
          </button>
        </div>

        {['HEX', 'DEC', 'OCT', 'BIN'].map((r) => {
          const active = r === radix;
          const text = groupDigits(formatRadix(current, bits, r, signed && r === 'DEC'), r);
          return (
            <button
              key={r}
              onClick={() => switchRadix(r)}
              className={`relative w-full flex items-baseline gap-1.5 px-1 py-[1px] rounded ${active ? 'bg-black/10' : ''}`}
            >
              <span className={`text-[8px] font-bold w-6 text-left ${active ? theme.lcdResult : theme.lcdHeader} opacity-90`}>
                {r}
              </span>
              <span className={`flex-1 text-right font-mono truncate ${active ? `${theme.lcdResult} font-bold text-[15px]` : `${theme.lcdFormula} text-[11px]`}`}>
                {RADIX_INFO[r].prefix}
                {text}
              </span>
            </button>
          );
        })}

        <div className={`relative flex justify-between px-1 pt-0.5 text-[8px] font-mono ${theme.lcdPreview}`}>
          <span>POP {popCount(current, bits)}</span>
          <span>LEN {bitLength(current, bits)}</span>
          <span className="truncate max-w-[90px]">ASCII {toAscii(current, bits) || '—'}</span>
        </div>
      </div>

      {/* ---------- Word size selector ---------- */}
      <div className="shrink-0 grid grid-cols-4 gap-1">
        {WORD_SIZES.map((w) => (
          <button
            key={w.id}
            onClick={() => switchBits(w.id)}
            className={`rounded-md border py-1 text-[9px] font-bold transition-all active:scale-95
              ${bits === w.id ? theme.tabActive : `${theme.panelBg} ${theme.panelBorder} ${theme.mutedText}`}`}
          >
            {w.label}
            <div className="text-[7px] opacity-70">{w.id}</div>
          </button>
        ))}
      </div>

      {/* ---------- Tab switch ---------- */}
      <div className="shrink-0 grid grid-cols-2 gap-1">
        {['keys', 'bits'].map((t) => (
          <button
            key={t}
            onClick={() => { feedback('toggle'); setTab(t); }}
            className={`rounded-md border py-1 text-[9px] font-bold uppercase tracking-wider
              ${tab === t ? theme.tabActive : `${theme.panelBg} ${theme.panelBorder} ${theme.mutedText}`}`}
          >
            {t === 'keys' ? 'Keypad' : 'Bit Board'}
          </button>
        ))}
      </div>

      {/* ---------- Body ---------- */}
      <div className="flex-1 min-h-0 overflow-y-auto thin-scroll">
        {tab === 'bits' ? (
          <div className={`rounded-lg border ${theme.panelBorder} ${theme.panelBg} p-2 space-y-2`}>
            {rows.map((row, ri) => {
              const highBit = bits - 1 - ri * 16;
              return (
                <div key={ri}>
                  <div className={`flex justify-between text-[7px] font-mono mb-0.5 ${theme.mutedText}`}>
                    <span>bit {highBit}</span>
                    <span>bit {highBit - 15}</span>
                  </div>
                  <div className="grid grid-cols-16 gap-[2px]" style={{ gridTemplateColumns: 'repeat(16, minmax(0,1fr))' }}>
                    {row.split('').map((b, ci) => {
                      const idx = highBit - ci;
                      const on = b === '1';
                      return (
                        <button
                          key={ci}
                          onClick={() => flipBit(idx)}
                          className={`aspect-square rounded-[3px] text-[9px] font-bold font-mono border transition-all active:scale-90
                            ${on ? `${theme.accentBg} text-white border-transparent` : `${theme.inputBg} opacity-60`}
                            ${(ci + 1) % 4 === 0 && ci !== 15 ? 'mr-[3px]' : ''}`}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className={`text-[8px] ${theme.mutedText} text-center pt-1`}>
              Tap any bit to toggle it
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Bitwise row */}
            <div className="grid grid-cols-4 gap-1" style={{ height: 34 }}>
              {['AND', 'OR', 'XOR', 'NOT'].map((o) => (
                <K key={o} label={o} size="text-[10px]" cls={theme.funcKey}
                   onClick={() => (o === 'NOT' ? unaryNot() : pressOp(o))} />
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1" style={{ height: 34 }}>
              {['NAND', 'NOR', 'XNOR', '%'].map((o) => (
                <K key={o} label={o} size="text-[9px]" cls={theme.funcKey} onClick={() => pressOp(o)} />
              ))}
            </div>
            <div className="grid grid-cols-5 gap-1" style={{ height: 34 }}>
              {['<<', '>>', '>>>', 'ROL', 'ROR'].map((o) => (
                <K key={o} label={o} size="text-[9px]" cls={theme.funcKey} onClick={() => pressOp(o)} />
              ))}
            </div>

            {/* Hex letters */}
            <div className="grid grid-cols-6 gap-1" style={{ height: 34 }}>
              {HEX_KEYS.map((h) => (
                <K key={h} label={h} cls={theme.funcKey} disabled={radix !== 'HEX'} onClick={() => pressDigit(h)} />
              ))}
            </div>

            {/* Main keypad */}
            <div className="grid grid-cols-4 gap-1" style={{ gridAutoRows: 40 }}>
              <K label="7" cls={theme.numKey} size="text-base" disabled={!isDigitAllowed('7', radix)} onClick={() => pressDigit('7')} />
              <K label="8" cls={theme.numKey} size="text-base" disabled={!isDigitAllowed('8', radix)} onClick={() => pressDigit('8')} />
              <K label="9" cls={theme.numKey} size="text-base" disabled={!isDigitAllowed('9', radix)} onClick={() => pressDigit('9')} />
              <K label="÷" cls={theme.opKey} size="text-base" onClick={() => pressOp('/')} />

              <K label="4" cls={theme.numKey} size="text-base" disabled={!isDigitAllowed('4', radix)} onClick={() => pressDigit('4')} />
              <K label="5" cls={theme.numKey} size="text-base" disabled={!isDigitAllowed('5', radix)} onClick={() => pressDigit('5')} />
              <K label="6" cls={theme.numKey} size="text-base" disabled={!isDigitAllowed('6', radix)} onClick={() => pressDigit('6')} />
              <K label="×" cls={theme.opKey} size="text-base" onClick={() => pressOp('*')} />

              <K label="1" cls={theme.numKey} size="text-base" onClick={() => pressDigit('1')} />
              <K label="2" cls={theme.numKey} size="text-base" disabled={!isDigitAllowed('2', radix)} onClick={() => pressDigit('2')} />
              <K label="3" cls={theme.numKey} size="text-base" disabled={!isDigitAllowed('3', radix)} onClick={() => pressDigit('3')} />
              <K label="−" cls={theme.opKey} size="text-base" onClick={() => pressOp('-')} />

              <K label="0" cls={theme.numKey} size="text-base" onClick={() => pressDigit('0')} />
              <K label="±" cls={theme.numKey} size="text-base" onClick={negate} />
              <K label={<Delete size={16} />} cls={theme.ceKey} onClick={backspace} />
              <K label="+" cls={theme.opKey} size="text-base" onClick={() => pressOp('+')} />

              <K label="AC" cls={theme.clearKey} onClick={clearAll} />
              <div className="col-span-3">
                <button onClick={equals} className={`${KEY_BASE} ${theme.equalKey} w-full h-full text-lg`}>=</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
