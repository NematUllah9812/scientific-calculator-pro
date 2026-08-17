import React, { useState, useMemo, useRef } from 'react';
import {
  Plus, Trash2, BarChart3, TrendingUp, Shuffle, Copy, Check, Dices, Coins,
} from 'lucide-react';
import {
  summaryStats, linearRegression, combinatorics, randomGen, DATASET_PRESETS, REGRESSION_PRESET,
} from '../utils/statisticsEngine.js';
import { formatResult } from '../utils/mathEngine.js';
import { px, ico } from '../utils/scale.js';

export default function StatisticsCalculator({ theme, settings, addHistory, feedback, scale }) {
  const [tab, setTab] = useState('one');
  const [values, setValues] = useState([12, 15, 18, 22, 22, 25, 29, 31, 35, 40]);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState('');

  const [xRaw, setXRaw] = useState(REGRESSION_PRESET.x.join(', '));
  const [yRaw, setYRaw] = useState(REGRESSION_PRESET.y.join(', '));
  const [predictX, setPredictX] = useState('9');

  const [nVal, setNVal] = useState('10');
  const [rVal, setRVal] = useState('3');
  const [randMin, setRandMin] = useState('1');
  const [randMax, setRandMax] = useState('100');
  const [randOut, setRandOut] = useState('—');

  const inputRef = useRef(null);

  const stats = useMemo(() => summaryStats(values.join(',')), [values]);
  const reg = useMemo(() => linearRegression(xRaw, yRaw), [xRaw, yRaw]);

  const f = (v) =>
    v === null || v === undefined || Number.isNaN(v)
      ? '—'
      : formatResult(v, {
          notation: settings.notation,
          precision: Math.min(settings.precision, 8),
          thousands: settings.thousands,
        });

  const addDraft = () => {
    const parts = String(draft).split(/[\s,;]+/).map(Number).filter((n) => !Number.isNaN(n));
    const clean = String(draft).trim() ? parts : [];
    if (!clean.length) { feedback('error'); return; }
    feedback('key');
    setValues((v) => [...v, ...clean]);
    setDraft('');
    inputRef.current?.focus();
  };

  const removeAt = (i) => { feedback('key'); setValues((v) => v.filter((_, k) => k !== i)); };
  const clearAll = () => { feedback('clear'); setValues([]); };
  const loadPreset = (p) => { feedback('toggle'); setValues(p.data.slice()); };

  const copyVal = async (label, v) => {
    feedback('toggle');
    try {
      await navigator.clipboard.writeText(String(v));
      setCopied(label);
      setTimeout(() => setCopied(''), 1100);
    } catch { /* ignore */ }
  };

  const combo = useMemo(() => {
    const n = Number(nVal), r = Number(rVal);
    const out = {};
    try { out.nCr = combinatorics.nCr(n, r); } catch { out.nCr = NaN; }
    try { out.nPr = combinatorics.nPr(n, r); } catch { out.nPr = NaN; }
    try { out.fact = combinatorics.factorial(n); } catch { out.fact = NaN; }
    return out;
  }, [nVal, rVal]);

  const Seg = ({ id, label, Icon }) => (
    <button
      onClick={() => { feedback('toggle'); setTab(id); }}
      className={`flex-1 flex items-center justify-center ${tab === id ? `${theme.accentBg} text-white` : `${theme.chipBg} ${theme.mutedText}`}`}
      style={{ gap: px(5), borderRadius: px(9), height: px(34), fontSize: px(12), fontWeight: 700 }}
    >
      <Icon size={ico(scale, 13)} />
      {label}
    </button>
  );

  const Card = ({ label, value, accent }) => (
    <div
      className={`${theme.panelBg} border ${accent ? theme.accentSoft : theme.panelBorder}`}
      style={{ borderRadius: px(10), padding: px(9) }}
    >
      <div className="flex items-start justify-between">
        <span className={`${theme.mutedText} truncate`} style={{ fontSize: px(10) }}>{label}</span>
        <button onClick={() => copyVal(label, value)} className={theme.mutedText}>
          {copied === label ? <Check size={ico(scale, 12)} /> : <Copy size={ico(scale, 12)} />}
        </button>
      </div>
      <div
        className={`font-bold truncate ${accent ? theme.accent : theme.bodyText}`}
        style={{ fontSize: px(15), marginTop: px(5), fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </div>
    </div>
  );

  const Field = ({ label, value, onChange, placeholder }) => (
    <label className="block">
      <span className={theme.mutedText} style={{ fontSize: px(9.5), fontWeight: 700 }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border outline-none ${theme.inputBg}`}
        style={{ borderRadius: px(8), padding: `${px(7)} ${px(9)}`, fontSize: px(12), marginTop: px(3) }}
      />
    </label>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ paddingLeft: px(8.4), paddingRight: px(8.4) }}>
      <div
        className={`shrink-0 flex ${theme.panelBg} border ${theme.panelBorder}`}
        style={{ gap: px(4), borderRadius: px(11), padding: px(4), marginTop: px(4) }}
      >
        <Seg id="one" label="1-Var Stats" Icon={BarChart3} />
        <Seg id="reg" label="Regression" Icon={TrendingUp} />
        <Seg id="prob" label="Probability" Icon={Shuffle} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scroll" style={{ paddingTop: px(8), paddingBottom: px(12) }}>
        {tab === 'one' && (
          <>
            <div
              className={`${theme.panelBg} border ${theme.panelBorder}`}
              style={{ borderRadius: px(11), padding: px(9), marginBottom: px(8) }}
            >
              <div className="flex" style={{ gap: px(7) }}>
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addDraft(); }}
                  placeholder="Numbers: 15, 24, 30..."
                  inputMode="decimal"
                  className={`flex-1 min-w-0 border outline-none ${theme.inputBg}`}
                  style={{ borderRadius: px(9), padding: `${px(8)} ${px(11)}`, fontSize: px(13) }}
                />
                <button
                  onClick={addDraft}
                  className={`${theme.accentBg} text-white flex items-center shrink-0 active:scale-95`}
                  style={{ gap: px(4), borderRadius: px(9), padding: `0 ${px(13)}`, fontSize: px(13), fontWeight: 700 }}
                >
                  <Plus size={ico(scale, 14)} /> Add
                </button>
              </div>

              <div className="flex items-center justify-between" style={{ marginTop: px(8) }}>
                <div className="flex items-center min-w-0" style={{ gap: px(6) }}>
                  <span className={theme.mutedText} style={{ fontSize: px(11) }}>Presets:</span>
                  {DATASET_PRESETS.slice(0, 2).map((p) => (
                    <button
                      key={p.name}
                      onClick={() => loadPreset(p)}
                      className={`${theme.chipBg} ${theme.chipText} shrink-0`}
                      style={{ borderRadius: px(6), padding: `${px(3)} ${px(8)}`, fontSize: px(11), fontWeight: 600 }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={clearAll}
                  className="flex items-center shrink-0 text-rose-400"
                  style={{ gap: px(4), fontSize: px(11), fontWeight: 600 }}
                >
                  <Trash2 size={ico(scale, 12)} /> Clear ({values.length})
                </button>
              </div>

              {values.length > 0 && (
                <div className="flex flex-wrap" style={{ gap: px(5), marginTop: px(8) }}>
                  {values.map((v, i) => (
                    <button
                      key={`${v}-${i}`}
                      onClick={() => removeAt(i)}
                      className={`${theme.chipBg} ${theme.chipText} flex items-center`}
                      style={{ gap: px(5), borderRadius: px(7), padding: `${px(4)} ${px(8)}`, fontSize: px(12), fontWeight: 600 }}
                    >
                      {v}<span className={theme.mutedText} style={{ fontSize: px(11) }}>×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {stats ? (
              <div className="grid grid-cols-2" style={{ gap: px(7) }}>
                <Card label="Count (n)" value={f(stats.n)} />
                <Card label="Sum (Σx)" value={f(stats.sum)} />
                <Card label="Mean (x̄)" value={f(stats.mean)} accent />
                <Card label="Sum Sq (Σx²)" value={f(stats.sumSq)} />
                <Card label="Median (x̃)" value={f(stats.median)} />
                <Card label="Sample s" value={f(stats.sdSample)} accent />
                <Card label="Pop σ" value={f(stats.sdPop)} />
                <Card label="Sample s²" value={f(stats.varSample)} />
                <Card label="Pop σ²" value={f(stats.varPop)} />
                <Card label="Std Error (SE)" value={f(stats.stdError)} />
                <Card label="Min" value={f(stats.min)} />
                <Card label="Max" value={f(stats.max)} />
                <Card label="Range" value={f(stats.range)} />
                <Card label="Q1 (25%)" value={f(stats.q1)} />
                <Card label="Q3 (75%)" value={f(stats.q3)} />
                <Card label="IQR" value={f(stats.iqr)} />
                <Card label="Mode(s)" value={stats.modes && stats.modes.length ? stats.modes.join(', ') : '—'} />
                <Card label="Geo Mean" value={f(stats.geoMean)} />
                <Card label="Harm Mean" value={f(stats.harmMean)} />
                <Card label="RMS" value={f(stats.rms)} />
                <Card label="Skewness" value={f(stats.skewness)} />
                <Card label="Kurtosis" value={f(stats.kurtosis)} />
              </div>
            ) : (
              <div className={`${theme.mutedText} text-center`} style={{ fontSize: px(12), padding: px(20) }}>
                Add values to see statistics.
              </div>
            )}
          </>
        )}

        {tab === 'reg' && (
          <div style={{ display: 'grid', gap: px(8) }}>
            <div
              className={`${theme.panelBg} border ${theme.panelBorder}`}
              style={{ borderRadius: px(11), padding: px(9), display: 'grid', gap: px(7) }}
            >
              <Field label="X VALUES" value={xRaw} onChange={setXRaw} placeholder="1, 2, 3..." />
              <Field label="Y VALUES" value={yRaw} onChange={setYRaw} placeholder="2, 4, 6..." />
            </div>

            {reg ? (
              <>
                <div className={`${theme.accentSoft} border`} style={{ borderRadius: px(11), padding: px(11) }}>
                  <div className={theme.mutedText} style={{ fontSize: px(10), fontWeight: 700 }}>REGRESSION LINE</div>
                  <div
                    className={`${theme.accent} font-bold`}
                    style={{ fontSize: px(17), marginTop: px(4), fontVariantNumeric: 'tabular-nums' }}
                  >
                    ŷ = {f(reg.slope)}x {reg.intercept >= 0 ? '+' : '−'} {f(Math.abs(reg.intercept))}
                  </div>
                </div>

                <div className="grid grid-cols-2" style={{ gap: px(7) }}>
                  <Card label="Slope (m)" value={f(reg.slope)} accent />
                  <Card label="Intercept (b)" value={f(reg.intercept)} />
                  <Card label="Correlation r" value={f(reg.r)} accent />
                  <Card label="R²" value={f(reg.r2)} />
                  <Card label="Std Error" value={f(reg.stdErr)} />
                  <Card label="Count (n)" value={f(reg.n)} />
                  <Card label="Σxy" value={f(reg.sumXY)} />
                  <Card label="SSE" value={f(reg.sse)} />
                </div>

                <div className={`${theme.panelBg} border ${theme.panelBorder}`} style={{ borderRadius: px(11), padding: px(9) }}>
                  <Field label="PREDICT FOR X" value={predictX} onChange={setPredictX} placeholder="9" />
                  <div
                    className={`${theme.accent} font-bold`}
                    style={{ fontSize: px(16), marginTop: px(7), fontVariantNumeric: 'tabular-nums' }}
                  >
                    ŷ = {f(reg.predict(Number(predictX)))}
                  </div>
                </div>
              </>
            ) : (
              <div className={`${theme.mutedText} text-center`} style={{ fontSize: px(12), padding: px(20) }}>
                Enter matching X and Y lists.
              </div>
            )}
          </div>
        )}

        {tab === 'prob' && (
          <div style={{ display: 'grid', gap: px(8) }}>
            <div className={`${theme.panelBg} border ${theme.panelBorder}`} style={{ borderRadius: px(11), padding: px(9) }}>
              <div className={theme.mutedText} style={{ fontSize: px(10), fontWeight: 700, marginBottom: px(7) }}>
                COMBINATORICS
              </div>
              <div className="grid grid-cols-2" style={{ gap: px(7) }}>
                <Field label="n" value={nVal} onChange={setNVal} placeholder="10" />
                <Field label="r" value={rVal} onChange={setRVal} placeholder="3" />
              </div>
              <div className="grid grid-cols-3" style={{ gap: px(7), marginTop: px(8) }}>
                <Card label="nCr" value={f(combo.nCr)} accent />
                <Card label="nPr" value={f(combo.nPr)} accent />
                <Card label="n!" value={f(combo.fact)} />
              </div>
            </div>

            <div className={`${theme.panelBg} border ${theme.panelBorder}`} style={{ borderRadius: px(11), padding: px(9) }}>
              <div className={theme.mutedText} style={{ fontSize: px(10), fontWeight: 700, marginBottom: px(7) }}>
                RANDOM GENERATORS
              </div>
              <div className="grid grid-cols-2" style={{ gap: px(7) }}>
                <Field label="MIN" value={randMin} onChange={setRandMin} placeholder="1" />
                <Field label="MAX" value={randMax} onChange={setRandMax} placeholder="100" />
              </div>
              <div className="grid grid-cols-4" style={{ gap: px(6), marginTop: px(8) }}>
                <RandBtn theme={theme} scale={scale} Icon={Shuffle} label="Int"
                  onClick={() => { feedback('key'); setRandOut(String(randomGen.int(Number(randMin), Number(randMax)))); }} />
                <RandBtn theme={theme} scale={scale} Icon={Shuffle} label="Float"
                  onClick={() => { feedback('key'); setRandOut(f(randomGen.float())); }} />
                <RandBtn theme={theme} scale={scale} Icon={Coins} label="Coin"
                  onClick={() => { feedback('key'); setRandOut(randomGen.coin()); }} />
                <RandBtn theme={theme} scale={scale} Icon={Dices} label="Dice"
                  onClick={() => { feedback('key'); setRandOut(String(randomGen.dice())); }} />
              </div>
              <div className={`${theme.accentSoft} border text-center`} style={{ borderRadius: px(9), padding: px(10), marginTop: px(8) }}>
                <span className={`${theme.accent} font-bold`} style={{ fontSize: px(20), fontVariantNumeric: 'tabular-nums' }}>
                  {randOut}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RandBtn({ theme, scale, Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${theme.chipBg} ${theme.chipText} flex flex-col items-center justify-center active:scale-95`}
      style={{ gap: px(3), borderRadius: px(8), padding: `${px(8)} 0`, fontSize: px(11), fontWeight: 600 }}
    >
      <Icon size={ico(scale, 14)} />
      {label}
    </button>
  );
}
