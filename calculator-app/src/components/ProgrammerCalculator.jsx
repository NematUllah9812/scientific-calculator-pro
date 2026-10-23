import React, { useState, useMemo, useCallback } from 'react';
import { Copy, Check, Delete, ChevronUp, ChevronDown } from 'lucide-react';
import {
  WORD_SIZES, wrap, formatRadix, toBinaryString,
  parseRadix, isDigitAllowed, alu, bitNot, toggleBit, popCount, bitLength, toAscii,
} from '../utils/programmerEngine.js';
import { KEY_BASE } from '../utils/themeStyles.js';
import { ripple } from '../utils/ripple.js';
import { px, ico } from '../utils/scale.js';
import { useHardwareKeyboard } from '../utils/useKeyboard.js';

const HEX_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];
const RADICES = ['HEX', 'DEC', 'OCT', 'BIN'];

export default function ProgrammerCalculator({ theme, addHistory, feedback, scale, active = true }) {
  const [radix, setRadix] = useState('DEC');
  const [bits, setBits] = useState(64);
  const [signed, setSigned] = useState(false);
  const [entry, setEntry] = useState('0');
  const [acc, setAcc] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true);
  const [copied, setCopied] = useState('');
  const [showBoard, setShowBoard] = useState(true);
  const [error, setError] = useState('');

  const current = useMemo(() => parseRadix(entry, radix, bits), [entry, radix, bits]);

  const setFromBig = useCallback((v) => {
    const w = wrap(v, bits);
    setEntry(formatRadix(w, bits, radix, signed && radix === 'DEC'));
    setFresh(true);
    setError('');
  }, [bits, radix, signed]);

  const pressDigit = (d) => {
    feedback('key');
    if (!isDigitAllowed(d, radix)) return;
    const base = fresh || entry === '0' ? '' : entry;
    const next = base + d;
    if (next.replace(/[\s,-]/g, '').length > 70) return;
    const parsed = parseRadix(next, radix, bits);
    setEntry(formatRadix(parsed, bits, radix, signed && radix === 'DEC'));
    setFresh(false);
    setError('');
  };

  const applyOp = () => {
    if (acc === null || !op) return current;
    try { return alu(op, acc, current, bits); } catch { return null; }
  };

  const pressOp = (o) => {
    feedback('key');
    if (acc !== null && op && !fresh) {
      const r = applyOp();
      if (r === null) { setError('Error'); feedback('error'); return; }
      setAcc(r); setFromBig(r);
    } else {
      setAcc(current);
    }
    setOp(o); setFresh(true); setError('');
  };

  const equals = () => {
    feedback('equals');
    if (acc === null || !op) return;
    const r = applyOp();
    if (r === null) { feedback('error'); setError('Error'); return; }
    addHistory({
      expression: `${formatRadix(acc, bits, radix, signed)} ${op} ${formatRadix(current, bits, radix, signed)}`,
      result: formatRadix(r, bits, radix, signed),
      mode: `Prog ${radix}${bits}`,
    });
    setFromBig(r); setAcc(null); setOp(null);
  };

  const clearAll = () => {
    feedback('clear');
    setEntry('0'); setAcc(null); setOp(null); setFresh(true); setError('');
  };

  const backspace = () => {
    feedback('key');
    const raw = entry.replace(/[\s,]/g, '');
    const next = raw.length > 1 ? raw.slice(0, -1) : '0';
    setEntry(formatRadix(parseRadix(next, radix, bits), bits, radix, signed && radix === 'DEC'));
    setFresh(false);
  };

  const switchRadix = (r) => {
    feedback('toggle');
    setEntry(formatRadix(current, bits, r, signed && r === 'DEC'));
    setRadix(r); setFresh(true); setError('');
  };

  const switchBits = (b) => {
    feedback('toggle');
    const w = wrap(current, b);
    setBits(b); setEntry(formatRadix(w, b, radix, signed && radix === 'DEC')); setFresh(true);
  };

  const copyRow = async (r) => {
    feedback('toggle');
    try {
      await navigator.clipboard.writeText(formatRadix(current, bits, r, signed && r === 'DEC').replace(/[\s,]/g, ''));
      setCopied(r); setTimeout(() => setCopied(''), 1200);
    } catch { /* ignore */ }
  };

  useHardwareKeyboard(active, (e) => {
    const k = e.key;
    if (/^[0-9a-fA-F]$/.test(k)) pressDigit(k.toUpperCase());
    else if (k === '+') pressOp('+');
    else if (k === '-') pressOp('-');
    else if (k === '*') pressOp('*');
    else if (k === '/') pressOp('/');
    else if (k === '%') pressOp('MOD');
    else if (k === 'Enter' || k === '=') { e.preventDefault(); equals(); }
    else if (k === 'Backspace') backspace();
    else if (k === 'Escape') clearAll();
  });

  const bin = toBinaryString(current, bits);

  /* ---- keycap ---- */
  const K = ({ label, cls, onClick, fs = 14, disabled, style }) => (
    <button
      onClick={onClick}
      onPointerDown={ripple}
      disabled={disabled}
      className={`${KEY_BASE} ${cls} ${disabled ? 'opacity-25' : ''}`}
      style={{ borderRadius: px(13), fontSize: px(fs), ...style }}
    >
      {label}
    </button>
  );

  const logicCls = `${theme.funcKey} ${theme.accent}`;

  /* Bit rows: 16 bits per row, most-significant nibble first. */
  const bitRows = [];
  for (let r = 0; r * 16 < bits; r++) {
    const msb = bits - 1 - r * 16;
    bitRows.push(msb);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ paddingLeft: px(10), paddingRight: px(10), paddingBottom: px(10) }}>
      {/* ================= Word size + radix rows ================= */}
      <div className="shrink-0" style={{ marginTop: px(4) }}>
        <div className="flex items-center justify-between" style={{ gap: px(6) }}>
          <div className="flex" style={{ gap: px(4) }}>
            {WORD_SIZES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => switchBits(id)}
                className={bits === id ? theme.segActive : `${theme.chipBg} ${theme.chipText}`}
                style={{ borderRadius: px(8), padding: `${px(5)} ${px(8)}`, fontSize: px(10), fontWeight: 700 }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center shrink-0" style={{ gap: px(4) }}>
            <button
              onClick={() => { feedback('toggle'); setSigned((s) => !s); }}
              className={signed ? theme.segActive : `${theme.chipBg} ${theme.chipText}`}
              style={{ borderRadius: px(8), padding: `${px(5)} ${px(8)}`, fontSize: px(10), fontWeight: 700 }}
            >
              {signed ? 'SIGNED' : 'UNSIGNED'}
            </button>
            <button
              onClick={() => { feedback('toggle'); setShowBoard((b) => !b); }}
              aria-label="Toggle bitboard"
              className={`${theme.mutedText} flex items-center justify-center`}
              style={{ width: px(26), height: px(26) }}
            >
              {showBoard ? <ChevronUp size={ico(scale, 15)} /> : <ChevronDown size={ico(scale, 15)} />}
            </button>
          </div>
        </div>

        {/* ---------- 4-radix rows ---------- */}
        <div className={`${theme.panelBg} mt-2`} style={{ borderRadius: px(12), padding: px(5) }}>
          {RADICES.map((r, i) => {
            const active = radix === r;
            return (
              <button
                key={r}
                onClick={() => switchRadix(r)}
                className={`w-full flex items-center ${active ? theme.accentSoft : ''}`}
                style={{
                  gap: px(9),
                  borderRadius: px(8),
                  padding: `${px(4)} ${px(7)}`,
                  marginTop: i === 0 ? 0 : px(1),
                }}
              >
                <span
                  className={active ? theme.accent : theme.mutedText}
                  style={{ fontSize: px(10), fontWeight: 700, width: px(30), textAlign: 'left' }}
                >
                  {r}
                </span>
                <span
                  className={`flex-1 text-left truncate ${active ? theme.bodyText : theme.mutedText}`}
                  style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.01em', fontSize: px(13) }}
                >
                  {formatRadix(current, bits, r, signed && r === 'DEC')}
                </span>
                <span
                  onClick={(e) => { e.stopPropagation(); copyRow(r); }}
                  className={`${theme.mutedText} flex items-center justify-center`}
                  style={{ width: px(22), height: px(22) }}
                >
                  {copied === r ? <Check size={ico(scale, 13)} /> : <Copy size={ico(scale, 13)} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= Bitboard ================= */}
      {showBoard && (
        <div className={`${theme.panelBg} flex-1 min-h-0 mt-2 flex flex-col`} style={{ borderRadius: px(12), padding: px(7) }}>
          <div className="flex items-center justify-between shrink-0" style={{ marginBottom: px(5) }}>
            <span className={`${theme.mutedText} font-bold`} style={{ fontSize: px(8.5), letterSpacing: px(0.5) }}>
              BITBOARD
            </span>
            <span className={`${theme.mutedText}`} style={{ fontSize: px(8.5), fontFamily: 'ui-monospace,monospace' }}>
              POP {popCount(current, bits)} · LEN {bitLength(current, bits)} · ASCII {toAscii(current, bits) || '—'}
            </span>
          </div>

          <div className="flex-1 min-h-0 flex flex-col justify-start">
            {bitRows.map((msb) => (
              <div
                key={msb}
                className="grid grid-cols-4"
                style={{ gap: px(4), marginBottom: px(4) }}
              >
                {[0, 1, 2, 3].map((nib) => {
                  const top = msb - nib * 4;
                  return (
                    <div
                      key={nib}
                      className={`${theme.chipBg}`}
                      style={{ borderRadius: px(8), padding: `${px(4)} ${px(6)}` }}
                    >
                      <div
                        className={`${theme.mutedText} flex items-center justify-between`}
                        style={{ fontSize: px(6.5), letterSpacing: px(0.2), opacity: 0.7 }}
                      >
                        <span>{top - 3}</span>
                        <span>{top}</span>
                      </div>
                      <div className="flex items-center justify-between" style={{ marginTop: px(2) }}>
                        {[0, 1, 2, 3].map((k) => {
                          const idx = top - k;
                          const on = bin[bits - 1 - idx] === '1';
                          return (
                            <button
                              key={k}
                              onClick={() => { feedback('key'); setFromBig(toggleBit(current, idx, bits)); }}
                              aria-label={`Bit ${idx}`}
                              className={`${on ? theme.accent : theme.mutedText} active:scale-90`}
                              style={{
                                fontSize: px(12),
                                fontWeight: on ? 700 : 400,
                                lineHeight: 1,
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                opacity: on ? 1 : 0.5,
                              }}
                            >
                              {on ? '1' : '0'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className={`text-rose-500 shrink-0 text-center`} style={{ fontSize: px(11), marginTop: px(6) }}>
          {error}
        </div>
      )}

      {/* ================= Keypad ================= */}
      <div className="shrink-0 grid grid-cols-6" style={{ gap: px(6), marginTop: px(8), height: px(438) }}>
        {/* logic row */}
        <K label="AND" cls={logicCls} fs={11} onClick={() => pressOp('AND')} />
        <K label="OR" cls={logicCls} fs={11} onClick={() => pressOp('OR')} />
        <K label="XOR" cls={logicCls} fs={11} onClick={() => pressOp('XOR')} />
        <K label="NOT" cls={logicCls} fs={11} onClick={() => { feedback('key'); setFromBig(bitNot(current, bits)); }} />
        <K label="NAND" cls={logicCls} fs={10} onClick={() => pressOp('NAND')} />
        <K label="NOR" cls={logicCls} fs={11} onClick={() => pressOp('NOR')} />

        {/* shift row */}
        <K label="SHL" cls={logicCls} fs={10} onClick={() => pressOp('SHL')} />
        <K label="SHR" cls={logicCls} fs={10} onClick={() => pressOp('SHR')} />
        <K label="SAR" cls={logicCls} fs={10} onClick={() => pressOp('SAR')} />
        <K label="ROL" cls={logicCls} fs={11} onClick={() => pressOp('ROL')} />
        <K label="ROR" cls={logicCls} fs={11} onClick={() => pressOp('ROR')} />
        <K label="AC" cls={theme.clearKey} fs={12} onClick={clearAll} />

        {/* hex row */}
        {HEX_KEYS.map((h) => (
          <K key={h} label={h} cls={theme.funcKey} fs={14}
             disabled={!isDigitAllowed(h, radix)} onClick={() => pressDigit(h)} />
        ))}

        {/* 7 8 9 + − ⌫ */}
        <K label="7" cls={theme.numKey} fs={16} disabled={!isDigitAllowed('7', radix)} onClick={() => pressDigit('7')} />
        <K label="8" cls={theme.numKey} fs={16} disabled={!isDigitAllowed('8', radix)} onClick={() => pressDigit('8')} />
        <K label="9" cls={theme.numKey} fs={16} disabled={!isDigitAllowed('9', radix)} onClick={() => pressDigit('9')} />
        <K label="+" cls={theme.opKey} fs={16} onClick={() => pressOp('+')} />
        <K label="−" cls={theme.opKey} fs={16} onClick={() => pressOp('-')} />
        <K label={<Delete size={ico(scale, 15)} />} cls={theme.funcKey} onClick={backspace} />

        {/* 4 5 6 × ÷ MOD */}
        <K label="4" cls={theme.numKey} fs={16} disabled={!isDigitAllowed('4', radix)} onClick={() => pressDigit('4')} />
        <K label="5" cls={theme.numKey} fs={16} disabled={!isDigitAllowed('5', radix)} onClick={() => pressDigit('5')} />
        <K label="6" cls={theme.numKey} fs={16} disabled={!isDigitAllowed('6', radix)} onClick={() => pressDigit('6')} />
        <K label="×" cls={theme.opKey} fs={16} onClick={() => pressOp('*')} />
        <K label="÷" cls={theme.opKey} fs={16} onClick={() => pressOp('/')} />
        <K label="MOD" cls={theme.funcKey} fs={10} onClick={() => pressOp('MOD')} />

        {/* 1 2 3 0 = */}
        <K label="1" cls={theme.numKey} fs={16} disabled={!isDigitAllowed('1', radix)} onClick={() => pressDigit('1')} />
        <K label="2" cls={theme.numKey} fs={16} disabled={!isDigitAllowed('2', radix)} onClick={() => pressDigit('2')} />
        <K label="3" cls={theme.numKey} fs={16} disabled={!isDigitAllowed('3', radix)} onClick={() => pressDigit('3')} />
        <K label="0" cls={theme.numKey} fs={16} onClick={() => pressDigit('0')} />
        <K label="=" cls={theme.equalKey} fs={17} onClick={equals} style={{ gridColumn: 'span 2' }} />
      </div>
    </div>
  );
}
