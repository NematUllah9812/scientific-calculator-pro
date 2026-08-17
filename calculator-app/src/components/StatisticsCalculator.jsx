import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Shuffle, Dices, Coins, Sigma, TrendingUp, Table2 } from 'lucide-react';
import {
  summaryStats, linearRegression, combinatorics, randomGen, DATASET_PRESETS, REGRESSION_PRESET,
} from '../utils/statisticsEngine.js';
import { formatResult } from '../utils/mathEngine.js';
import { KEY_BASE } from '../utils/themeStyles.js';

function Field({ theme, label, value, onChange, placeholder, mono }) {
  return (
    <label className="block">
      <span className={`text-[9px] font-bold uppercase tracking-wider ${theme.mutedText}`}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="decimal"
        className={`w-full mt-0.5 rounded-lg border px-2 py-1.5 text-[12px] ${mono ? 'font-mono' : ''} ${theme.inputBg} outline-none focus:ring-2 ${theme.accentRing}`}
      />
    </label>
  );
}

function Stat({ theme, label, value, wide, accent }) {
  return (
    <div className={`rounded-lg border ${theme.panelBorder} ${theme.panelBg} px-1.5 py-1 ${wide ? 'col-span-2' : ''}`}>
      <div className={`text-[8px] font-bold uppercase tracking-wider ${theme.mutedText} truncate`}>{label}</div>
      <div className={`text-[12px] font-mono font-bold truncate ${accent ? theme.accent : ''}`}>{value}</div>
    </div>
  );
}

export default function StatisticsCalculator({ theme, settings, addHistory, feedback }) {
  const [tab, setTab] = useState('data');
  const [raw, setRaw] = useState('88, 92, 79, 93, 85, 90, 74, 96, 81, 87');
  const [xRaw, setXRaw] = useState(REGRESSION_PRESET.x.join(', '));
  const [yRaw, setYRaw] = useState(REGRESSION_PRESET.y.join(', '));
  const [predictX, setPredictX] = useState('9');
  const [nVal, setNVal] = useState('10');
  const [rVal, setRVal] = useState('3');
  const [randMin, setRandMin] = useState('1');
  const [randMax, setRandMax] = useState('100');
  const [randOut, setRandOut] = useState('—');

  const stats = useMemo(() => summaryStats(raw), [raw]);
  const reg = useMemo(() => linearRegression(xRaw, yRaw), [xRaw, yRaw]);

  const f = (v) =>
    v === null || v === undefined || Number.isNaN(v)
      ? '—'
      : formatResult(v, { notation: settings.notation, precision: Math.min(settings.precision, 8), thousands: settings.thousands });

  const combo = useMemo(() => {
    const n = Number(nVal);
    const r = Number(rVal);
    const out = {};
    try { out.nCr = combinatorics.nCr(n, r); } catch { out.nCr = NaN; }
    try { out.nPr = combinatorics.nPr(n, r); } catch { out.nPr = NaN; }
    try { out.fact = combinatorics.factorial(n); } catch { out.fact = NaN; }
    return out;
  }, [nVal, rVal]);

  const TabBtn = ({ id, label, Icon }) => (
    <button
      onClick={() => { feedback('toggle'); setTab(id); }}
      className={`flex items-center justify-center gap-1 rounded-md border py-1.5 text-[9px] font-bold uppercase tracking-wide
        ${tab === id ? theme.tabActive : `${theme.panelBg} ${theme.panelBorder} ${theme.mutedText}`}`}
    >
      <Icon size={11} />
      {label}
    </button>
  );

  return (
    <div className="h-full flex flex-col p-1.5 gap-1.5 overflow-hidden">
      <div className="shrink-0 grid grid-cols-4 gap-1">
        <TabBtn id="data" label="Data" Icon={Table2} />
        <TabBtn id="stats" label="Stats" Icon={Sigma} />
        <TabBtn id="reg" label="Reg" Icon={TrendingUp} />
        <TabBtn id="prob" label="Prob" Icon={Dices} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scroll pr-0.5 space-y-2">
        {/* ================= DATA ================= */}
        {tab === 'data' && (
          <>
            <div className={`rounded-lg border ${theme.panelBorder} ${theme.panelBg} p-2 space-y-1.5`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.mutedText}`}>Dataset</span>
                <span className={`text-[10px] font-mono ${theme.accent}`}>n = {stats?.n ?? 0}</span>
              </div>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={4}
                placeholder="Enter numbers separated by commas, spaces or newlines"
                className={`w-full rounded-lg border px-2 py-1.5 text-[12px] font-mono resize-none thin-scroll ${theme.inputBg} outline-none focus:ring-2 ${theme.accentRing}`}
              />
              <div className="flex gap-1">
                <button
                  onClick={() => { feedback('clear'); setRaw(''); }}
                  className={`${KEY_BASE} ${theme.clearKey} flex-1 py-1.5 text-[10px] flex-row gap-1`}
                >
                  <Trash2 size={12} /> Clear
                </button>
                <button
                  onClick={() => { feedback('key'); setRaw((r) => (r.trim() ? r + ', ' : '') + randomGen.int(1, 100)); }}
                  className={`${KEY_BASE} ${theme.funcKey} flex-1 py-1.5 text-[10px] flex-row gap-1`}
                >
                  <Plus size={12} /> Random
                </button>
              </div>
            </div>

            <div className={`rounded-lg border ${theme.panelBorder} ${theme.panelBg} p-2`}>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.mutedText} mb-1`}>Presets</div>
              <div className="grid grid-cols-2 gap-1">
                {DATASET_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => { feedback('key'); setRaw(p.data.join(', ')); }}
                    className={`${KEY_BASE} ${theme.funcKey} py-1.5 text-[9px]`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {stats && (
              <div className="grid grid-cols-3 gap-1">
                <Stat theme={theme} label="Mean x̄" value={f(stats.mean)} accent />
                <Stat theme={theme} label="Median" value={f(stats.median)} />
                <Stat theme={theme} label="σ (pop)" value={f(stats.sdPop)} />
              </div>
            )}
          </>
        )}

        {/* ================= STATS ================= */}
        {tab === 'stats' && (
          stats ? (
            <>
              <div className="grid grid-cols-3 gap-1">
                <Stat theme={theme} label="n" value={stats.n} />
                <Stat theme={theme} label="Σx" value={f(stats.sum)} />
                <Stat theme={theme} label="Σx²" value={f(stats.sumSq)} />
                <Stat theme={theme} label="Mean x̄" value={f(stats.mean)} accent />
                <Stat theme={theme} label="Median x̃" value={f(stats.median)} accent />
                <Stat theme={theme} label="Range" value={f(stats.range)} />
                <Stat theme={theme} label="s (samp)" value={f(stats.sdSample)} />
                <Stat theme={theme} label="σ (pop)" value={f(stats.sdPop)} />
                <Stat theme={theme} label="SE" value={f(stats.stdError)} />
                <Stat theme={theme} label="s² var" value={f(stats.varSample)} />
                <Stat theme={theme} label="σ² var" value={f(stats.varPop)} />
                <Stat theme={theme} label="RMS" value={f(stats.rms)} />
                <Stat theme={theme} label="Min" value={f(stats.min)} />
                <Stat theme={theme} label="Q1" value={f(stats.q1)} />
                <Stat theme={theme} label="Q3" value={f(stats.q3)} />
                <Stat theme={theme} label="Max" value={f(stats.max)} />
                <Stat theme={theme} label="IQR" value={f(stats.iqr)} />
                <Stat theme={theme} label="Skew" value={f(stats.skewness)} />
                <Stat theme={theme} label="Kurtosis" value={f(stats.kurtosis)} />
                <Stat theme={theme} label="Geo Mean" value={f(stats.geoMean)} />
                <Stat theme={theme} label="Harm Mean" value={f(stats.harmMean)} />
              </div>
              <Stat
                theme={theme}
                wide
                label={`Mode${stats.modes.length > 1 ? 's' : ''} (×${stats.modeCount})`}
                value={stats.modes.length ? stats.modes.join(', ') : 'No mode'}
              />
              <button
                onClick={() => {
                  feedback('equals');
                  addHistory({ expression: `1-Var Stats (n=${stats.n})`, result: `x̄=${f(stats.mean)}, σ=${f(stats.sdPop)}`, mode: 'Statistics' });
                }}
                className={`${KEY_BASE} ${theme.equalKey} w-full py-2 text-[11px]`}
              >
                Save to History
              </button>
            </>
          ) : (
            <div className={`text-center text-[11px] ${theme.mutedText} py-8`}>Enter data in the Data tab</div>
          )
        )}

        {/* ================= REGRESSION ================= */}
        {tab === 'reg' && (
          <>
            <div className={`rounded-lg border ${theme.panelBorder} ${theme.panelBg} p-2 space-y-1.5`}>
              <Field theme={theme} label="X values" value={xRaw} onChange={setXRaw} mono />
              <Field theme={theme} label="Y values" value={yRaw} onChange={setYRaw} mono />
              <button
                onClick={() => { feedback('key'); setXRaw(REGRESSION_PRESET.x.join(', ')); setYRaw(REGRESSION_PRESET.y.join(', ')); }}
                className={`${KEY_BASE} ${theme.funcKey} w-full py-1.5 text-[10px] flex-row gap-1`}
              >
                <Shuffle size={12} /> Load Sample Pairs
              </button>
            </div>

            {reg ? (
              <>
                <div className={`rounded-lg border-2 ${theme.lcdBorder} ${theme.lcdBg} p-2 text-center`}>
                  <div className={`text-[8px] font-bold uppercase tracking-widest ${theme.lcdHeader}`}>Best Fit Line</div>
                  <div className={`text-[15px] font-mono font-bold ${theme.lcdResult}`}>
                    y = {f(reg.slope)}x {reg.intercept >= 0 ? '+' : '−'} {f(Math.abs(reg.intercept))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <Stat theme={theme} label="n pairs" value={reg.n} />
                  <Stat theme={theme} label="Slope m" value={f(reg.slope)} accent />
                  <Stat theme={theme} label="Intercept b" value={f(reg.intercept)} accent />
                  <Stat theme={theme} label="r" value={f(reg.r)} />
                  <Stat theme={theme} label="R²" value={f(reg.r2)} accent />
                  <Stat theme={theme} label="Std Err" value={f(reg.stdErr)} />
                  <Stat theme={theme} label="Σx" value={f(reg.sumX)} />
                  <Stat theme={theme} label="Σy" value={f(reg.sumY)} />
                  <Stat theme={theme} label="Σxy" value={f(reg.sumXY)} />
                  <Stat theme={theme} label="Σx²" value={f(reg.sumX2)} />
                  <Stat theme={theme} label="Σy²" value={f(reg.sumY2)} />
                  <Stat theme={theme} label="SSE" value={f(reg.sse)} />
                </div>
                <div className={`rounded-lg border ${theme.panelBorder} ${theme.panelBg} p-2 flex items-end gap-2`}>
                  <div className="flex-1">
                    <Field theme={theme} label="Predict at x =" value={predictX} onChange={setPredictX} mono />
                  </div>
                  <div className="flex-1 text-right">
                    <div className={`text-[8px] font-bold uppercase ${theme.mutedText}`}>ŷ</div>
                    <div className={`text-[16px] font-mono font-bold ${theme.accent}`}>
                      {isFinite(Number(predictX)) ? f(reg.predict(Number(predictX))) : '—'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className={`text-center text-[11px] ${theme.mutedText} py-8`}>Need at least 2 matching X/Y pairs</div>
            )}
          </>
        )}

        {/* ================= PROBABILITY ================= */}
        {tab === 'prob' && (
          <>
            <div className={`rounded-lg border ${theme.panelBorder} ${theme.panelBg} p-2 space-y-1.5`}>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.mutedText}`}>Combinatorics</div>
              <div className="grid grid-cols-2 gap-1.5">
                <Field theme={theme} label="n" value={nVal} onChange={setNVal} mono />
                <Field theme={theme} label="r" value={rVal} onChange={setRVal} mono />
              </div>
              <div className="grid grid-cols-3 gap-1">
                <Stat theme={theme} label="nCr" value={f(combo.nCr)} accent />
                <Stat theme={theme} label="nPr" value={f(combo.nPr)} accent />
                <Stat theme={theme} label="n!" value={f(combo.fact)} />
              </div>
            </div>

            <div className={`rounded-lg border ${theme.panelBorder} ${theme.panelBg} p-2 space-y-1.5`}>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.mutedText}`}>Random Generators</div>
              <div className={`rounded-lg border-2 ${theme.lcdBorder} ${theme.lcdBg} py-2 text-center`}>
                <div className={`text-[20px] font-mono font-bold ${theme.lcdResult}`}>{randOut}</div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Field theme={theme} label="Min" value={randMin} onChange={setRandMin} mono />
                <Field theme={theme} label="Max" value={randMax} onChange={setRandMax} mono />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button onClick={() => { feedback('key'); setRandOut(String(randomGen.float().toFixed(8))); }}
                  className={`${KEY_BASE} ${theme.funcKey} py-2 text-[10px]`}>Random Float</button>
                <button onClick={() => { feedback('key'); setRandOut(String(randomGen.int(Number(randMin) || 0, Number(randMax) || 100))); }}
                  className={`${KEY_BASE} ${theme.funcKey} py-2 text-[10px]`}>Random Int</button>
                <button onClick={() => { feedback('key'); setRandOut(randomGen.coin()); }}
                  className={`${KEY_BASE} ${theme.funcKey} py-2 text-[10px] flex-row gap-1`}><Coins size={12} /> Coin Toss</button>
                <button onClick={() => { feedback('key'); setRandOut('⚀⚁⚂⚃⚄⚅'[randomGen.dice(6) - 1] + ' ' + randomGen.dice(6)); }}
                  className={`${KEY_BASE} ${theme.funcKey} py-2 text-[10px] flex-row gap-1`}><Dices size={12} /> Roll D6</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
