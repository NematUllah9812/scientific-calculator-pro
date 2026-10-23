import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeftRight, ChevronDown, Copy, Check, Delete } from 'lucide-react';
import {
  UNIT_CATEGORIES, convert, getUnitList, CATEGORY_LIST, DEFAULT_UNITS,
} from '../utils/unitConverterData.js';
import { formatResult } from '../utils/mathEngine.js';
import { KEY_BASE } from '../utils/themeStyles.js';
import { ripple } from '../utils/ripple.js';
import { px, ico } from '../utils/scale.js';

export default function UnitConverter({
  theme, settings, addHistory, history, feedback, recallValue, clearRecall, scale,
}) {
  const [catId, setCatId] = useState('length');
  const [from, setFrom] = useState(DEFAULT_UNITS.length?.[0] || 'm');
  const [to, setTo] = useState(DEFAULT_UNITS.length?.[1] || 'km');
  const [entry, setEntry] = useState('1');
  /* The opening "1" is a placeholder that shows a meaningful conversion.
     The first digit the user types replaces it instead of appending to it. */
  const [dirty, setDirty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [picker, setPicker] = useState(null); // 'from' | 'to' | null

  const units = useMemo(() => getUnitList(catId), [catId]);

  useEffect(() => {
    if (recallValue !== null && recallValue !== undefined) {
      setDirty(true);
      setEntry(String(recallValue).replace(/,/g, ''));
      clearRecall();
    }
  }, [recallValue, clearRecall]);

  const switchCat = (id) => {
    feedback('toggle');
    setCatId(id);
    const d = DEFAULT_UNITS[id];
    const list = getUnitList(id);
    setFrom(d?.[0] || list[0]?.key);
    setTo(d?.[1] || list[1]?.key || list[0]?.key);
    setPicker(null);
  };

  const value = parseFloat(entry.replace(/,/g, '')) || 0;
  const output = useMemo(() => {
    try {
      const v = convert(catId, from, to, value);
      return v === null || v === undefined || Number.isNaN(v)
        ? '—'
        : formatResult(v, { notation: settings.notation, precision: Math.min(settings.precision, 8), thousands: settings.thousands });
    } catch { return '—'; }
  }, [catId, from, to, value, settings]);

  const rateText = useMemo(() => {
    try {
      const one = convert(catId, from, to, 1);
      if (one === null || Number.isNaN(one)) return '';
      const fu = UNIT_CATEGORIES[catId]?.units?.[from];
      const tu = UNIT_CATEGORIES[catId]?.units?.[to];
      return `1 ${fu?.symbol || from} = ${formatResult(one, { notation: 'standard', precision: 6, thousands: true })} ${tu?.symbol || to}`;
    } catch { return ''; }
  }, [catId, from, to]);

  const unitLabel = (k) => {
    const u = UNIT_CATEGORIES[catId]?.units?.[k];
    return u ? `${u.name} (${u.symbol})` : k;
  };

  const digit = (d) => {
    feedback('key');
    setDirty(true);
    setEntry((e) => {
      if (!dirty && d !== '.') return d;      // replace the placeholder
      if (d === '.' && e.includes('.')) return e;
      if (e === '0' && d !== '.') return d;
      if (e.replace(/[-.]/g, '').length >= 14) return e;
      return e + d;
    });
  };

  const backspace = () => {
    feedback('key');
    setDirty(true);
    setEntry((e) => (e.length > 1 ? e.slice(0, -1) : '0'));
  };

  /* "00" appends two zeroes in one go (calling digit() twice used to
     lose one of them because both calls saw the same stale state). */
  const appendZeros = () => {
    feedback('key');
    setDirty(true);
    setEntry((e) => {
      if (e.replace(/[-.]/g, '').length >= 13) return e;
      return e === '0' ? '00' : e + '00';
    });
  };

  const toggleSign = () => {
    feedback('key');
    setDirty(true);
    setEntry((e) => {
      if (e.startsWith('-')) return e.slice(1);
      return e === '0' ? '0' : '-' + e;
    });
  };

  const swap = () => { feedback('toggle'); setFrom(to); setTo(from); };

  const copyOut = async () => {
    feedback('toggle');
    try {
      await navigator.clipboard.writeText(String(output));
      setCopied(true); setTimeout(() => setCopied(false), 1200);
    } catch { /* ignore */ }
  };

  const saveResult = () => {
    feedback('equals');
    const fu = UNIT_CATEGORIES[catId]?.units?.[from];
    const tu = UNIT_CATEGORIES[catId]?.units?.[to];
    addHistory({
      expression: `${entry} ${fu?.symbol || from} → ${tu?.symbol || to}`,
      result: String(output),
      mode: 'Convert',
    });
  };

  const K = ({ label, cls, onClick, fs = 19 }) => (
    <button
      onClick={onClick}
      onPointerDown={ripple}
      className={`${KEY_BASE} ${cls}`}
      style={{ borderRadius: px(16), fontSize: px(fs) }}
    >
      {label}
    </button>
  );

  const Selector = ({ side, unitKey }) => (
    <button
      onClick={() => { feedback('toggle'); setPicker(picker === side ? null : side); }}
      className={`flex items-center ${theme.chipBg} ${theme.chipText} max-w-full`}
      style={{
        borderRadius: px(10),
        padding: `${px(7)} ${px(9)} ${px(7)} ${px(11)}`,
        gap: px(6),
        minWidth: px(102),
      }}
    >
      <span className="truncate font-semibold" style={{ fontSize: px(12.5) }}>
        {unitLabel(unitKey)}
      </span>
      <ChevronDown size={ico(scale, 13)} className={theme.mutedText} />
    </button>
  );

  const outLen = String(output).length;
  const outSize = outLen > 18 ? 15 : outLen > 15 ? 17 : outLen > 12 ? 19 : outLen > 9 ? 22 : outLen > 7 ? 25 : 28;

  /* Paper tape: the last few conversions, newest first. */
  const tape = useMemo(
    () => (history || []).filter((h) => h.mode === 'Convert').slice(0, 6),
    [history]
  );

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ paddingLeft: px(12), paddingRight: px(12), paddingBottom: px(12) }}>
      {/* ---- category chips ---- */}
      <div className="shrink-0 flex overflow-x-auto no-scrollbar edge-fade" style={{ gap: px(6), marginTop: px(6) }}>
        {CATEGORY_LIST.map((c) => (
          <button
            key={c.id}
            onClick={() => switchCat(c.id)}
            className={`shrink-0 ${catId === c.id ? theme.segActive : `${theme.chipBg} ${theme.chipText}`}`}
            style={{ borderRadius: px(10), padding: `${px(6)} ${px(11)}`, fontSize: px(12), fontWeight: 650 }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* ---- display ---- */}
      <div className={`${theme.panelBg} shrink-0 relative mt-3`} style={{ borderRadius: px(16), padding: px(14) }}>
        <div className="flex items-center" style={{ gap: px(10) }}>
          {/* swap */}
          <button
            onClick={swap}
            aria-label="Swap units"
            className={`${theme.panelAlt} shrink-0 flex items-center justify-center active:scale-90`}
            style={{ width: px(32), height: px(32), borderRadius: px(16) }}
          >
            <ArrowLeftRight size={ico(scale, 15)} className={theme.accent} />
          </button>

          <div className="flex-1 min-w-0 flex flex-col" style={{ gap: px(18) }}>
            <div className="flex items-center justify-between" style={{ gap: px(8) }}>
              <Selector side="from" unitKey={from} />
              <div className="flex-1 min-w-0 text-right">
                <span
                  className={`font-semibold truncate inline-block max-w-full ${theme.lcdResult}`}
                  style={{ fontSize: px(26), fontVariantNumeric: 'tabular-nums', letterSpacing: px(-0.6) }}
                >
                  {entry}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between" style={{ gap: px(8) }}>
              <Selector side="to" unitKey={to} />
              <div className="flex-1 min-w-0 flex items-center justify-end" style={{ gap: px(6) }}>
                <span
                  className={`font-semibold truncate ${theme.lcdResult}`}
                  style={{ fontSize: px(outSize), fontVariantNumeric: 'tabular-nums', letterSpacing: px(-0.6) }}
                >
                  {output}
                </span>
                <button onClick={copyOut} aria-label="Copy result" className={`${theme.mutedText} active:scale-90 shrink-0`}>
                  {copied ? <Check size={ico(scale, 14)} /> : <Copy size={ico(scale, 14)} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {rateText && (
          <div className={`${theme.mutedText} text-center`} style={{ fontSize: px(10), marginTop: px(11) }}>
            {rateText}
          </div>
        )}
      </div>

      {/* ---- recent conversions (paper tape) ---- */}
      <div
        className="flex-1 min-h-0 flex flex-col justify-end overflow-y-auto thin-scroll"
        style={{ paddingTop: px(8) }}
      >
        {tape.map((h) => (
          <button
            key={h.id}
            onClick={() => { feedback('key'); setDirty(true); setEntry(String(h.result).replace(/,/g, '')); }}
            className={`${theme.mutedText} text-right truncate active:opacity-60`}
            style={{ fontSize: px(11.5), fontVariantNumeric: 'tabular-nums', padding: `${px(2)} 0` }}
          >
            <span className="opacity-70">{h.expression}</span>
            <span className="opacity-90"> = {h.result}</span>
          </button>
        ))}
      </div>

      {/* ---- keypad (always mounted; the picker floats above it) ---- */}
      <div className="shrink-0 grid grid-cols-4 relative" style={{ gap: px(8), marginTop: px(10), height: px(462) }}>
        <K label="7" cls={theme.numKey} onClick={() => digit('7')} />
        <K label="8" cls={theme.numKey} onClick={() => digit('8')} />
        <K label="9" cls={theme.numKey} onClick={() => digit('9')} />
        <K label={<Delete size={ico(scale, 17)} />} cls={theme.funcKey} onClick={backspace} />

        <K label="4" cls={theme.numKey} onClick={() => digit('4')} />
        <K label="5" cls={theme.numKey} onClick={() => digit('5')} />
        <K label="6" cls={theme.numKey} onClick={() => digit('6')} />
        <K label="C" cls={theme.clearKey} fs={17} onClick={() => { feedback('clear'); setDirty(true); setEntry('0'); }} />

        <K label="1" cls={theme.numKey} onClick={() => digit('1')} />
        <K label="2" cls={theme.numKey} onClick={() => digit('2')} />
        <K label="3" cls={theme.numKey} onClick={() => digit('3')} />
        <K label="±" cls={theme.funcKey} fs={17} onClick={toggleSign} />

        <K label="0" cls={theme.numKey} onClick={() => digit('0')} />
        <K label="00" cls={theme.numKey} fs={16} onClick={appendZeros} />
        <K label="." cls={theme.numKey} onClick={() => digit('.')} />
        <K label="OK" cls={theme.equalKey} fs={16} onClick={saveResult} />
      </div>

      {/* ---- unit picker sheet (floats above the keypad) ---- */}
      {picker && (
        <>
          <button
            className="absolute inset-0 z-10"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            aria-label="Close unit picker"
            onClick={() => setPicker(null)}
          />
          <div
            className={`${theme.panelBg} absolute z-20 overflow-y-auto thin-scroll`}
            style={{
              left: 0, right: 0, bottom: 0,
              maxHeight: '58%',
              borderRadius: px(14),
              padding: px(10),
              boxShadow: '0 -8px 30px rgba(0,0,0,0.35)',
            }}
          >
            <div className={`${theme.mutedText} font-bold`} style={{ fontSize: px(9.5), letterSpacing: px(0.6), marginBottom: px(7) }}>
              SELECT {picker === 'from' ? 'SOURCE' : 'TARGET'} UNIT
            </div>
            <div className="grid grid-cols-2" style={{ gap: px(6) }}>
              {units.map((u) => {
                const active = (picker === 'from' ? from : to) === u.key;
                return (
                  <button
                    key={u.key}
                    onClick={() => {
                      feedback('key');
                      if (picker === 'from') setFrom(u.key); else setTo(u.key);
                      setPicker(null);
                    }}
                    className={`text-left truncate ${active ? theme.segActive : `${theme.chipBg} ${theme.chipText}`}`}
                    style={{ borderRadius: px(10), padding: `${px(9)} ${px(10)}`, fontSize: px(12), fontWeight: 600 }}
                  >
                    {u.name} ({u.symbol})
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
