import React, { useState, useMemo, useEffect } from 'react';
import {
  Ruler, Weight, Thermometer, Square, Box, Gauge, Clock, HardDrive,
  Wind, Zap, Activity, Compass, ArrowUpDown, Copy, Check, Delete,
} from 'lucide-react';
import {
  UNIT_CATEGORIES, CATEGORY_LIST, DEFAULT_UNITS, convert, getUnitList,
} from '../utils/unitConverterData.js';
import { formatResult } from '../utils/mathEngine.js';
import { KEY_BASE } from '../utils/themeStyles.js';

const ICONS = { Ruler, Weight, Thermometer, Square, Box, Gauge, Clock, HardDrive, Wind, Zap, Activity, Compass };

function Select({ theme, units, feedback, label, value, onChange }) {
  return (
    <div className="flex-1 min-w-0">
      <div className={`text-[8px] font-bold uppercase tracking-wider ${theme.mutedText} mb-0.5`}>{label}</div>
      <select
        value={value}
        onChange={(e) => { feedback('key'); onChange(e.target.value); }}
        className={`w-full rounded-lg border px-1.5 py-1.5 text-[11px] font-semibold ${theme.inputBg} outline-none focus:ring-2 ${theme.accentRing}`}
      >
        {units.map((u) => (
          <option key={u.key} value={u.key}>{u.name} ({u.symbol})</option>
        ))}
      </select>
    </div>
  );
}

export default function UnitConverter({ theme, settings, addHistory, feedback, recallValue, clearRecall }) {
  const [catId, setCatId] = useState('length');
  const [from, setFrom] = useState(DEFAULT_UNITS.length[0]);
  const [to, setTo] = useState(DEFAULT_UNITS.length[1]);
  const [input, setInput] = useState('1');
  const [copied, setCopied] = useState(false);

  const cat = UNIT_CATEGORIES[catId];
  const units = useMemo(() => getUnitList(catId), [catId]);

  useEffect(() => {
    if (recallValue !== null && recallValue !== undefined) {
      setInput(String(recallValue));
      clearRecall();
    }
  }, [recallValue, clearRecall]);

  const selectCategory = (id) => {
    feedback('toggle');
    setCatId(id);
    const [a, b] = DEFAULT_UNITS[id] || Object.keys(UNIT_CATEGORIES[id].units);
    setFrom(a);
    setTo(b);
  };

  const numeric = parseFloat(input);
  const result = isFinite(numeric) ? convert(catId, from, to, numeric) : NaN;
  const resultText = isFinite(result)
    ? formatResult(result, { notation: settings.notation, precision: Math.min(settings.precision, 10), thousands: settings.thousands })
    : '—';

  const fromU = cat.units[from] || {};
  const toU = cat.units[to] || {};

  const rateText = useMemo(() => {
    const one = convert(catId, from, to, 1);
    if (!isFinite(one)) return '';
    return `1 ${fromU.symbol || from} = ${formatResult(one, { precision: 8, thousands: true })} ${toU.symbol || to}`;
  }, [catId, from, to, fromU.symbol, toU.symbol]);

  const swap = () => {
    feedback('toggle');
    setFrom(to);
    setTo(from);
    if (isFinite(result)) setInput(String(result));
  };

  const push = (ch) => {
    feedback('key');
    setInput((prev) => {
      if (ch === '.') return prev.includes('.') ? prev : (prev || '0') + '.';
      if (prev === '0' && ch !== '.') return ch;
      return (prev + ch).slice(0, 16);
    });
  };

  const copy = async () => {
    feedback('toggle');
    try { await navigator.clipboard.writeText(String(resultText)); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch { /* noop */ }
  };

  const save = () => {
    if (!isFinite(result)) return;
    feedback('equals');
    addHistory({
      expression: `${input} ${fromU.symbol || from} → ${toU.symbol || to}`,
      result: `${resultText} ${toU.symbol || to}`,
      mode: `Convert · ${cat.name}`,
    });
  };

  return (
    <div className="h-full flex flex-col p-1.5 gap-1.5 overflow-hidden">
      {/* Category strip */}
      <div className="shrink-0 flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
        {CATEGORY_LIST.map((c) => {
          const Icon = ICONS[c.icon] || Ruler;
          const active = c.id === catId;
          return (
            <button
              key={c.id}
              onClick={() => selectCategory(c.id)}
              className={`shrink-0 flex flex-col items-center gap-0.5 rounded-lg border px-2 py-1
                ${active ? theme.tabActive : `${theme.panelBg} ${theme.panelBorder} ${theme.mutedText}`}`}
            >
              <Icon size={13} />
              <span className="text-[8px] font-bold uppercase tracking-wide">{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* LCD */}
      <div className={`shrink-0 rounded-xl border-2 ${theme.lcdBorder} ${theme.lcdBg} ${theme.lcdGlow} p-2 lcd-scanlines`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[8px] font-bold uppercase tracking-widest ${theme.lcdHeader}`}>{cat.name}</span>
          <button onClick={copy} className={`${theme.lcdHeader} opacity-70 active:scale-90`}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
        <div className="text-right">
          <div className={`text-[13px] font-mono ${theme.lcdFormula} truncate`}>
            {input || '0'} <span className="opacity-70">{fromU.symbol || from}</span>
          </div>
          <div className={`text-[26px] leading-tight font-mono font-bold ${theme.lcdResult} truncate`}>
            {resultText}
          </div>
          <div className={`text-[10px] font-mono ${theme.lcdPreview} truncate`}>{toU.name} · {rateText}</div>
        </div>
      </div>

      {/* Unit pickers */}
      <div className={`shrink-0 rounded-xl border ${theme.panelBorder} ${theme.panelBg} p-2 flex items-end gap-1.5`}>
        <Select theme={theme} units={units} feedback={feedback} label="From" value={from} onChange={setFrom} />
        <button onClick={swap} className={`${KEY_BASE} ${theme.opKey} h-[30px] w-9 shrink-0`}>
          <ArrowUpDown size={14} />
        </button>
        <Select theme={theme} units={units} feedback={feedback} label="To" value={to} onChange={setTo} />
      </div>

      {/* Keypad */}
      <div className="flex-1 min-h-0 grid grid-cols-4 gap-1.5" style={{ gridTemplateRows: 'repeat(4, minmax(0, 1fr))' }}>
        {['7', '8', '9'].map((d) => <button key={d} onClick={() => push(d)} className={`${KEY_BASE} ${theme.numKey} text-lg`}>{d}</button>)}
        <button onClick={() => { feedback('clear'); setInput(''); }} className={`${KEY_BASE} ${theme.clearKey} text-sm`}>AC</button>

        {['4', '5', '6'].map((d) => <button key={d} onClick={() => push(d)} className={`${KEY_BASE} ${theme.numKey} text-lg`}>{d}</button>)}
        <button onClick={() => { feedback('key'); setInput((p) => p.slice(0, -1)); }} className={`${KEY_BASE} ${theme.ceKey}`}><Delete size={16} /></button>

        {['1', '2', '3'].map((d) => <button key={d} onClick={() => push(d)} className={`${KEY_BASE} ${theme.numKey} text-lg`}>{d}</button>)}
        <button
          onClick={() => { feedback('key'); setInput((p) => (p.startsWith('-') ? p.slice(1) : '-' + p)); }}
          className={`${KEY_BASE} ${theme.funcKey} text-sm`}
        >±</button>

        <button onClick={() => push('0')} className={`${KEY_BASE} ${theme.numKey} text-lg`}>0</button>
        <button onClick={() => push('.')} className={`${KEY_BASE} ${theme.numKey} text-lg`}>.</button>
        <button onClick={save} className={`${KEY_BASE} ${theme.equalKey} col-span-2 text-sm`}>Save Result</button>
      </div>
    </div>
  );
}
