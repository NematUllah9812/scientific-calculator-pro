import React, { useState, useMemo, useCallback } from 'react';
import { Copy, Check, Delete, ChevronUp, ChevronDown } from 'lucide-react';
import {
  WORD_SIZES, wrap, toSigned, formatRadix, toBinaryString,
  parseRadix, isDigitAllowed, alu, bitNot, toggleBit, popCount, bitLength, toAscii,
} from '../utils/programmerEngine.js';
import { KEY_BASE } from '../utils/themeStyles.js';
import { px, ico } from '../utils/scale.js';

const HEX_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];
const RADICES = ['HEX', 'DEC', 'OCT', 'BIN'];

export default function ProgrammerCalculator({ theme, addHistory, feedback, scale }) {
  const [radix, setRadix] = useState('DEC');
  const [bits, setBits] = useState(64);
  const [signed, setSigned] = useState(false);
  const [entry, setEntry] = useState('0');
  const [acc, setAcc] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true);
  const [copied, setCopied] = useState('');
  const [showBoard, setShowBoard] = useState(true);

  const current = useMemo(() => parseRadix(entry, radix, bits), [entry, radix, bits]);

  const setFromBig = useCallback((v) => {
    const w = wrap(v, bits);
    setEntry(formatRadix(w, bits, radix, signed && radix === 'DEC'));
    setFresh(true);
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
  };

  const applyOp = () => {
    if (acc === null || !op) return current;
    try { return alu(op, acc, current, bits); } catch { return null; }
  };

  const pressOp = (o) => {
    feedback('key');
    if (acc !== null && op && !fresh) {
      const r = applyOp();
      if (r === null) return;
      setAcc(r); setFromBig(r);
    } else {
      setAcc(current);
    }
    setOp(o); setFresh(true);
  };

  const equals = () => {
    feedback('equals');
    if (acc === null || !op) return;
    const r = applyOp();
    if (r === null) { feedback('error'); return; }
    addHistory({
      expression: `${formatRadix(acc, bits, radix, signed)} ${op} ${formatRadix(current, bits, radix, signed)}`,
      result: formatRadix(r, bits, radix, signed),
      mode: `Prog ${radix}${bits}`,
    });
    setFromBig(r); setAcc(null); setOp(null);
  };

  const clearAll = () => { feedback('clear'); setEntry('0'); setAcc(null); setOp(null); setFresh(true); };

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
    setRadix(r); setFresh(true);
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

  const bin = toBinaryString(current, bits);
  const boardRows = [];
  for (let i = 0; i < bits; i += 16) boardRows.push(i);

  /* ---- keycap ---- */
  const K = ({ label, cls, onClick, fs = 14, disabled, style }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${KEY_BASE} ${cls} ${disabled ? 'opacity-25' : ''}`}
      style={{ borderRadius: px(9), fontSize: px(fs), ...style }}
    >
      {label}
    </button>
  );

  const logicCls = `${theme.chipBg} ${theme.accent}`;

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ paddingLeft: px(8.4), paddingRight: px(8.4), paddingBottom: px(8), gap: px(7) }}>
      {/* ================= Word-size chips ================= */}
      <div className={`shrink-0 ${theme.panelBg} border ${theme.panelBorder}`} style={{ borderRadius: px(11), padding: px(7), marginTop: px(3) }}>
        <div className="flex items-center justify-between" style={{ gap: px(5) }}>
          <div className="flex" style={{ gap: px(5) }}>
            {WORD_SIZES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => switchBits(id)}
                className={bits === id ? theme.segActive : `${theme.chipBg} ${theme.chipText}`}
                style={{ borderRadius: px(6), padding: `${px(4)} ${px(8)}`, fontSize: px(10.5), fontWeight: 700 }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center" style={{ gap: px(4) }}>
            <button
              onClick={() => { feedback('toggle'); setSigned((s) => !s); }}
              className={signed ? theme.segActive : `${theme.chipBg} ${theme.chipText}`}
              style={{ borderRadius: px(6), padding: `${px(4)} ${px(8)}`, fontSize: px(10.5), fontWeight: 700 }}
            >
              {signed ? 'SIGNED' : 'UNSIGNED'}
            </button>
            <button onClick={() => { feedback('toggle'); setShowBoard((b) => !b); }} className={theme.mutedText}>
              {showBoard ? <ChevronUp size={ico(scale, 15)} /> : <ChevronDown size={ico(scale, 15)} />}
            </button>
          </div>
        </div>

        {/* ---------- 4-radix rows ---------- */}
        <div style={{ marginTop: px(6) }}>
          {RADICES.map((r) => {
            const active = radix === r;
            return (
              <button
                key={r}
                onClick={() => switchRadix(r)}
                className={`w-full flex items-center ${active ? `${theme.accentSoft} border` : 'border border-transparent'}`}
                style={{ gap: px(9), borderRadius: px(8), padding: `${px(5)} ${px(7)}`, marginBottom: px(2) }}
              >
                <span
                  className={active ? theme.accent : theme.mutedText}
                  style={{ fontSize: px(11), fontWeight: 700, width: px(30), textAlign: 'left' }}
                >
                  {r}
                </span>
                <span
                  className={`flex-1 text-left truncate ${theme.bodyText}`}
                  style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em', fontSize: px(13) }}
                >
                  {formatRadix(current, bits, r, signed && r === 'DEC')}
                </span>
                <span onClick={(e) => { e.stopPropagation(); copyRow(r); }} className={theme.mutedText}>
                  {copied === r ? <Check size={ico(scale, 13)} /> : <Copy size={ico(scale, 13)} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= Bitboard ================= */}
      {showBoard && (
        <div className={`shrink-0 ${theme.panelBg} border ${theme.panelBorder}`} style={{ borderRadius: px(11), padding: px(7) }}>
          <div className="flex items-center justify-between" style={{ marginBottom: px(5) }}>
            <span className={theme.mutedText} style={{ fontSize: px(8.5), fontWeight: 700, letterSpacing: px(0.4) }}>
              BITBOARD (CLICK BITS TO TOGGLE)
            </span>
            <span className={theme.mutedText} style={{ fontSize: px(8.5), fontFamily: 'ui-monospace,monospace' }}>
              {bits - 1} ... 0
            </span>
          </div>

          {boardRows.map((start) => (
            <div key={start} className="grid grid-cols-4" style={{ gap: px(4), marginBottom: px(4) }}>
              {[0, 1, 2, 3].map((nib) => {
                const hi = bits - 1 - start - nib * 4;
                return (
                  <div
                    key={nib}
                    className={`${theme.chipBg} flex flex-col items-center`}
                    style={{ borderRadius: px(6), padding: `${px(3)} 0` }}
                  >
                    <span className={theme.mutedText} style={{ fontSize: px(7.5), lineHeight: 1.2 }}>{hi}</span>
                    <div className="flex" style={{ gap: px(3) }}>
                      {[0, 1, 2, 3].map((k) => {
                        const idx = hi - k;
                        const on = bin[bits - 1 - idx] === '1';
                        return (
                          <button
                            key={k}
                            onClick={() => { feedback('key'); setFromBig(toggleBit(current, idx, bits)); }}
                            className={on ? theme.accent : theme.mutedText}
                            style={{ fontSize: px(10), fontVariantNumeric: 'tabular-nums', fontWeight: on ? 700 : 400, width: px(9) }}
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

          <div className="flex justify-between" style={{ marginTop: px(4) }}>
            <span className={theme.mutedText} style={{ fontSize: px(8.5) }}>POP {popCount(current, bits)}</span>
            <span className={theme.mutedText} style={{ fontSize: px(8.5) }}>LEN {bitLength(current, bits)}</span>
            <span className={`${theme.mutedText} truncate`} style={{ fontSize: px(8.5), maxWidth: '45%' }}>
              ASCII {toAscii(current, bits) || '—'}
            </span>
          </div>
        </div>
      )}

      {/* ================= Keypad ================= */}
      <div className="flex-1 min-h-0 grid grid-cols-6" style={{ gap: px(4.5) }}>
        {/* logic row */}
        <K label="AND" cls={logicCls} fs={12} onClick={() => pressOp('AND')} />
        <K label="OR" cls={logicCls} fs={12} onClick={() => pressOp('OR')} />
        <K label="XOR" cls={logicCls} fs={12} onClick={() => pressOp('XOR')} />
        <K label="NOT" cls={logicCls} fs={12} onClick={() => { feedback('key'); setFromBig(bitNot(current, bits)); }} />
        <K label="NAND" cls={logicCls} fs={11} onClick={() => pressOp('NAND')} />
        <K label="NOR" cls={logicCls} fs={12} onClick={() => pressOp('NOR')} />

        {/* shift row */}
        <K label="<<" cls={logicCls} fs={13} onClick={() => pressOp('SHL')} />
        <K label=">>" cls={logicCls} fs={13} onClick={() => pressOp('SHR')} />
        <K label=">>>" cls={logicCls} fs={13} onClick={() => pressOp('SAR')} />
        <K label="ROL" cls={logicCls} fs={12} onClick={() => pressOp('ROL')} />
        <K label="ROR" cls={logicCls} fs={12} onClick={() => pressOp('ROR')} />
        <K label="AC" cls={theme.clearKey} fs={13} onClick={clearAll} />

        {/* hex row */}
        {HEX_KEYS.map((h) => (
          <K key={h} label={h} cls={theme.funcKey} fs={15}
             disabled={!isDigitAllowed(h, radix)} onClick={() => pressDigit(h)} />
        ))}

        {/* 7 8 9 + − ⌫ */}
        <K label="7" cls={theme.numKey} fs={17} disabled={!isDigitAllowed('7', radix)} onClick={() => pressDigit('7')} />
        <K label="8" cls={theme.numKey} fs={17} disabled={!isDigitAllowed('8', radix)} onClick={() => pressDigit('8')} />
        <K label="9" cls={theme.numKey} fs={17} disabled={!isDigitAllowed('9', radix)} onClick={() => pressDigit('9')} />
        <K label="+" cls={theme.ceKey} fs={17} onClick={() => pressOp('+')} />
        <K label="−" cls={theme.ceKey} fs={17} onClick={() => pressOp('-')} />
        <K label={<Delete size={ico(scale, 16)} />} cls={theme.funcKey} onClick={backspace} />

        {/* 4 5 6 × ÷ MOD */}
        <K label="4" cls={theme.numKey} fs={17} disabled={!isDigitAllowed('4', radix)} onClick={() => pressDigit('4')} />
        <K label="5" cls={theme.numKey} fs={17} disabled={!isDigitAllowed('5', radix)} onClick={() => pressDigit('5')} />
        <K label="6" cls={theme.numKey} fs={17} disabled={!isDigitAllowed('6', radix)} onClick={() => pressDigit('6')} />
        <K label="×" cls={theme.ceKey} fs={17} onClick={() => pressOp('*')} />
        <K label="÷" cls={theme.ceKey} fs={17} onClick={() => pressOp('/')} />
        <K label="MOD" cls={theme.funcKey} fs={11} onClick={() => pressOp('MOD')} />

        {/* 1 2 3 0 = */}
        <K label="1" cls={theme.numKey} fs={17} disabled={!isDigitAllowed('1', radix)} onClick={() => pressDigit('1')} />
        <K label="2" cls={theme.numKey} fs={17} disabled={!isDigitAllowed('2', radix)} onClick={() => pressDigit('2')} />
        <K label="3" cls={theme.numKey} fs={17} disabled={!isDigitAllowed('3', radix)} onClick={() => pressDigit('3')} />
        <K label="0" cls={theme.numKey} fs={17} onClick={() => pressDigit('0')} />
        <K label="=" cls={theme.opKey} fs={18} onClick={equals} style={{ gridColumn: 'span 2' }} />
      </div>
    </div>
  );
}
