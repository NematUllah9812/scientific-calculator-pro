import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeftRight, ChevronRight, Copy, Check, Delete } from 'lucide-react';
import {
  UNIT_CATEGORIES, convert, getUnitList, CATEGORY_LIST, DEFAULT_UNITS,
} from '../utils/unitConverterData.js';
import { formatResult } from '../utils/mathEngine.js';
import { KEY_BASE } from '../utils/themeStyles.js';
import { px, ico } from '../utils/scale.js';

export default function UnitConverter({
  theme, settings, addHistory, feedback, recallValue, clearRecall, scale,
}) {
  const [catId, setCatId] = useState('length');
  const [from, setFrom] = useState(DEFAULT_UNITS.length?.[0] || 'm');
  const [to, setTo] = useState(DEFAULT_UNITS.length?.[1] || 'km');
  const [entry, setEntry] = useState('1');
  const [copied, setCopied] = useState(false);
  const [picker, setPicker] = useState(null); // 'from' | 'to' | null

  const units = useMemo(() => getUnitList(catId), [catId]);

  useEffect(() => {
    if (recallValue !== null && recallValue !== undefined) {
      setEntry(String(recallValue)); clearRecall();
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
    if (d === '.' && entry.includes('.')) return;
    if (entry === '0' && d !== '.') { setEntry(d); return; }
    if (entry.replace(/[-.]/g, '').length >= 14) return;
    setEntry(entry + d);
  };

  const backspace = () => {
    feedback('key');
    setEntry((e) => (e.length > 1 ? e.slice(0, -1) : '0'));
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
    <button onClick={onClick} className={`${KEY_BASE} ${cls}`} style={{ borderRadius: px(10), fontSize: px(fs) }}>
      {label}
    </button>
  );

  const Selector = ({ side, unitKey }) => (
    <button
      onClick={() => { feedback('toggle'); setPicker(picker === side ? null : side); }}
      className={`flex items-center justify-between ${theme.lcdInset}`}
      style={{
        borderRadius: px(9),
        padding: `${px(8)} ${px(11)}`, gap: px(8), minWidth: px(168), maxWidth: px(210),
      }}
    >
      <span className={`${theme.lcdInsetText} truncate font-semibold`} style={{ fontSize: px(13), fontFamily: 'ui-monospace,monospace' }}>
        {unitLabel(unitKey)}
      </span>
      <ChevronRight size={ico(scale, 13)} className={theme.lcdInsetText} style={{ opacity: 0.75 }} />
    </button>
  );

  const outLen = String(output).length;
  const outSize = outLen > 16 ? 15 : outLen > 13 ? 18 : outLen > 10 ? 21 : outLen > 7 ? 25 : 29;

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ paddingLeft: px(8.4), paddingRight: px(8.4), paddingBottom: px(8), gap: px(7) }}>
      {/* ---- category chips ---- */}
      <div className="shrink-0 flex overflow-x-auto no-scrollbar" style={{ gap: px(5), marginTop: px(4) }}>
        {CATEGORY_LIST.map((c) => (
          <button
            key={c.id}
            onClick={() => switchCat(c.id)}
            className={`shrink-0 ${catId === c.id ? theme.segActive : `${theme.chipBg} ${theme.chipText}`}`}
            style={{ borderRadius: px(8), padding: `${px(6)} ${px(11)}`, fontSize: px(12), fontWeight: 700 }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* ---- LCD ---- */}
      <div
        className={`shrink-0 relative ${theme.lcdBg} border-2 ${theme.lcdBorder} lcd-scanlines overflow-hidden`}
        style={{ borderRadius: px(14), padding: px(11) }}
      >
        <div className={`absolute inset-0 ${theme.lcdGlow} pointer-events-none`} />

        <div className="relative flex items-center justify-between" style={{ gap: px(8) }}>
          <Selector side="from" unitKey={from} />
          <span
            className={`font-bold truncate ${theme.lcdResult}`}
            style={{ fontSize: px(24), fontVariantNumeric: 'tabular-nums' }}
          >
            {entry}
          </span>
        </div>

        {/* swap FAB */}
        <div className="relative flex justify-center" style={{ height: px(4) }}>
          <button
            onClick={swap}
            className={`${theme.panelBg} flex items-center justify-center absolute active:scale-90`}
            style={{ width: px(30), height: px(30), borderRadius: px(15), top: px(-11), zIndex: 2 }}
          >
            <ArrowLeftRight size={ico(scale, 15)} className={theme.accent} />
          </button>
        </div>

        <div className="relative flex items-center justify-between" style={{ gap: px(8), marginTop: px(13) }}>
          <Selector side="to" unitKey={to} />
          <div className="flex items-center min-w-0" style={{ gap: px(7) }}>
            <span
              className={`font-bold truncate ${theme.lcdResult}`}
              style={{ fontSize: px(outSize), fontVariantNumeric: 'tabular-nums' }}
            >
              {output}
            </span>
            <button onClick={copyOut} className={theme.lcdHeader} style={{ opacity: 0.8 }}>
              {copied ? <Check size={ico(scale, 14)} /> : <Copy size={ico(scale, 14)} />}
            </button>
          </div>
        </div>

        {rateText && (
          <div className={`relative text-center ${theme.lcdPreview}`} style={{ fontSize: px(10), marginTop: px(7) }}>
            {rateText}
          </div>
        )}
      </div>

      {/* ---- unit picker (overlays the keypad area) ---- */}
      {picker ? (
        <div
          className={`flex-1 min-h-0 overflow-y-auto thin-scroll ${theme.panelBg} border ${theme.panelBorder}`}
          style={{ borderRadius: px(11), padding: px(7) }}
        >
          <div className={theme.mutedText} style={{ fontSize: px(10), fontWeight: 700, marginBottom: px(6) }}>
            SELECT {picker === 'from' ? 'SOURCE' : 'TARGET'} UNIT
          </div>
          <div className="grid grid-cols-2" style={{ gap: px(5) }}>
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
                  style={{ borderRadius: px(8), padding: `${px(8)} ${px(9)}`, fontSize: px(12), fontWeight: 600 }}
                >
                  {u.name} ({u.symbol})
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-4" style={{ gap: px(6) }}>
          <K label="7" cls={theme.numKey} onClick={() => digit('7')} />
          <K label="8" cls={theme.numKey} onClick={() => digit('8')} />
          <K label="9" cls={theme.numKey} onClick={() => digit('9')} />
          <K label={<Delete size={ico(scale, 18)} />} cls={theme.ceKey} onClick={backspace} />

          <K label="4" cls={theme.numKey} onClick={() => digit('4')} />
          <K label="5" cls={theme.numKey} onClick={() => digit('5')} />
          <K label="6" cls={theme.numKey} onClick={() => digit('6')} />
          <K label="C" cls={theme.clearKey} fs={17} onClick={() => { feedback('clear'); setEntry('0'); }} />

          <K label="1" cls={theme.numKey} onClick={() => digit('1')} />
          <K label="2" cls={theme.numKey} onClick={() => digit('2')} />
          <K label="3" cls={theme.numKey} onClick={() => digit('3')} />
          <K label="±" cls={theme.numKey} fs={17}
             onClick={() => { feedback('key'); setEntry((e) => (e.startsWith('-') ? e.slice(1) : '-' + e)); }} />

          <K label="0" cls={theme.numKey} onClick={() => digit('0')} />
          <K label="00" cls={theme.numKey} fs={17} onClick={() => { digit('0'); digit('0'); }} />
          <K label="." cls={theme.numKey} onClick={() => digit('.')} />
          <K label="OK" cls={theme.equalKey} fs={17} onClick={saveResult} />
        </div>
      )}
    </div>
  );
}
