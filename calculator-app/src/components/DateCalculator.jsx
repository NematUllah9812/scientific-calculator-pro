import React, { useState, useMemo } from 'react';
import {
  CalendarDays, CalendarRange, Cake, ChevronLeft, ChevronRight, Plus, Minus,
} from 'lucide-react';
import {
  toISO, fromISO, formatDate, dateDifference, businessDays, addToDate,
  dateFacts, calculateAge, buildCalendarGrid, MONTH_NAMES, DAY_MIN, atMidnight,
} from '../utils/dateEngine.js';
import { KEY_BASE } from '../utils/themeStyles.js';

function Row({ theme, label, value, accent }) {
  return (
    <div className={`flex items-center justify-between rounded-lg border ${theme.panelBorder} ${theme.panelBg} px-2 py-1`}>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.mutedText}`}>{label}</span>
      <span className={`text-[12px] font-mono font-bold ${accent ? theme.accent : ''}`}>{value}</span>
    </div>
  );
}

function DateField({ theme, label, value, onChange }) {
  return (
    <label className="block flex-1 min-w-0">
      <span className={`text-[9px] font-bold uppercase tracking-wider ${theme.mutedText}`}>{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full mt-0.5 rounded-lg border px-2 py-1.5 text-[12px] font-mono ${theme.inputBg} outline-none focus:ring-2 ${theme.accentRing}`}
      />
    </label>
  );
}

function NumField({ theme, label, value, onChange }) {
  return (
    <label className="block">
      <span className={`text-[9px] font-bold uppercase tracking-wider ${theme.mutedText}`}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full mt-0.5 rounded-lg border px-2 py-1.5 text-[12px] font-mono ${theme.inputBg} outline-none focus:ring-2 ${theme.accentRing}`}
      />
    </label>
  );
}

export default function DateCalculator({ theme, addHistory, feedback }) {
  const today = useMemo(() => atMidnight(new Date()), []);
  const [tab, setTab] = useState('diff');

  const [start, setStart] = useState(toISO(today));
  const [end, setEnd] = useState(toISO(addToDate(today, { days: 30 })));
  const [includeEnd, setIncludeEnd] = useState(false);

  const [base, setBase] = useState(toISO(today));
  const [addY, setAddY] = useState('0');
  const [addM, setAddM] = useState('0');
  const [addW, setAddW] = useState('0');
  const [addD, setAddD] = useState('7');
  const [subtract, setSubtract] = useState(false);

  const [birth, setBirth] = useState('2000-01-01');

  const [calY, setCalY] = useState(today.getFullYear());
  const [calM, setCalM] = useState(today.getMonth());

  const sD = fromISO(start) || today;
  const eD = fromISO(end) || today;
  const diff = useMemo(() => dateDifference(sD, eD, { includeEndDay: includeEnd }), [start, end, includeEnd]);
  const biz = useMemo(() => businessDays(sD, eD), [start, end]);
  const added = useMemo(
    () => addToDate(fromISO(base) || today, { years: +addY || 0, months: +addM || 0, weeks: +addW || 0, days: +addD || 0 }, subtract),
    [base, addY, addM, addW, addD, subtract],
  );
  const age = useMemo(() => calculateAge(fromISO(birth) || today, today), [birth, today]);
  const facts = useMemo(() => dateFacts(added), [added]);
  const grid = useMemo(() => buildCalendarGrid(calY, calM), [calY, calM]);
  const todayISO = toISO(today);

  const TabBtn = ({ id, label, Icon }) => (
    <button
      onClick={() => { feedback('toggle'); setTab(id); }}
      className={`flex items-center justify-center gap-1 rounded-md border py-1.5 text-[9px] font-bold uppercase tracking-wide
        ${tab === id ? theme.tabActive : `${theme.panelBg} ${theme.panelBorder} ${theme.mutedText}`}`}
    >
      <Icon size={11} />{label}
    </button>
  );

  const shiftMonth = (delta) => {
    feedback('key');
    let m = calM + delta;
    let y = calY;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCalM(m); setCalY(y);
  };

  return (
    <div className="h-full flex flex-col p-1.5 gap-1.5 overflow-hidden">
      <div className="shrink-0 grid grid-cols-4 gap-1">
        <TabBtn id="diff" label="Diff" Icon={CalendarRange} />
        <TabBtn id="add" label="Add" Icon={Plus} />
        <TabBtn id="age" label="Age" Icon={Cake} />
        <TabBtn id="cal" label="Cal" Icon={CalendarDays} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scroll pr-0.5 space-y-1.5">
        {/* ================= DIFFERENCE ================= */}
        {tab === 'diff' && (
          <>
            <div className={`rounded-lg border ${theme.panelBorder} ${theme.panelBg} p-2 space-y-1.5`}>
              <div className="flex gap-1.5">
                <DateField theme={theme} label="From" value={start} onChange={setStart} />
                <DateField theme={theme} label="To" value={end} onChange={setEnd} />
              </div>
              <div className="flex gap-1">
                <button onClick={() => { feedback('key'); setStart(todayISO); }} className={`${KEY_BASE} ${theme.funcKey} flex-1 py-1.5 text-[9px]`}>From = Today</button>
                <button onClick={() => { feedback('key'); setEnd(todayISO); }} className={`${KEY_BASE} ${theme.funcKey} flex-1 py-1.5 text-[9px]`}>To = Today</button>
                <button
                  onClick={() => { feedback('toggle'); setIncludeEnd((v) => !v); }}
                  className={`${KEY_BASE} ${includeEnd ? theme.equalKey : theme.funcKey} flex-1 py-1.5 text-[9px]`}
                >Incl. End</button>
              </div>
            </div>

            <div className={`rounded-xl border-2 ${theme.lcdBorder} ${theme.lcdBg} ${theme.lcdGlow} p-2 text-center lcd-scanlines`}>
              <div className={`text-[8px] font-bold uppercase tracking-widest ${theme.lcdHeader}`}>Duration</div>
              <div className={`text-[22px] font-mono font-bold leading-tight ${theme.lcdResult}`}>
                {diff.years}y {diff.months}m {diff.days}d
              </div>
              <div className={`text-[11px] font-mono ${theme.lcdPreview}`}>{diff.totalDays.toLocaleString()} total days</div>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <Row theme={theme} label="Weeks" value={`${diff.totalWeeks} + ${diff.remainderDays}d`} />
              <Row theme={theme} label="Months" value={diff.totalMonths} />
              <Row theme={theme} label="Hours" value={diff.totalHours.toLocaleString()} />
              <Row theme={theme} label="Minutes" value={diff.totalMinutes.toLocaleString()} />
              <Row theme={theme} label="Seconds" value={diff.totalSeconds.toLocaleString()} />
              <Row theme={theme} label="Direction" value={diff.reversed ? 'Reversed' : 'Forward'} />
              <Row theme={theme} label="Working" value={biz.workingDays} accent />
              <Row theme={theme} label="Weekend" value={biz.weekendDays} />
            </div>

            <button
              onClick={() => {
                feedback('equals');
                addHistory({ expression: `${formatDate(sD, 'short')} → ${formatDate(eD, 'short')}`, result: `${diff.totalDays} days`, mode: 'Date' });
              }}
              className={`${KEY_BASE} ${theme.equalKey} w-full py-2 text-[11px]`}
            >Save to History</button>
          </>
        )}

        {/* ================= ADD / SUBTRACT ================= */}
        {tab === 'add' && (
          <>
            <div className={`rounded-lg border ${theme.panelBorder} ${theme.panelBg} p-2 space-y-1.5`}>
              <DateField theme={theme} label="Base date" value={base} onChange={setBase} />
              <div className="grid grid-cols-4 gap-1.5">
                <NumField theme={theme} label="Years" value={addY} onChange={setAddY} />
                <NumField theme={theme} label="Months" value={addM} onChange={setAddM} />
                <NumField theme={theme} label="Weeks" value={addW} onChange={setAddW} />
                <NumField theme={theme} label="Days" value={addD} onChange={setAddD} />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => { feedback('toggle'); setSubtract(false); }}
                  className={`${KEY_BASE} ${!subtract ? theme.equalKey : theme.funcKey} py-1.5 text-[10px] flex-row gap-1`}
                ><Plus size={12} /> Add</button>
                <button
                  onClick={() => { feedback('toggle'); setSubtract(true); }}
                  className={`${KEY_BASE} ${subtract ? theme.equalKey : theme.funcKey} py-1.5 text-[10px] flex-row gap-1`}
                ><Minus size={12} /> Subtract</button>
              </div>
            </div>

            <div className={`rounded-xl border-2 ${theme.lcdBorder} ${theme.lcdBg} ${theme.lcdGlow} p-2 text-center lcd-scanlines`}>
              <div className={`text-[8px] font-bold uppercase tracking-widest ${theme.lcdHeader}`}>Resulting Date</div>
              <div className={`text-[18px] font-mono font-bold leading-tight ${theme.lcdResult}`}>{formatDate(added, 'short')}</div>
              <div className={`text-[11px] font-mono ${theme.lcdPreview}`}>{formatDate(added, 'long')}</div>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <Row theme={theme} label="ISO" value={toISO(added)} accent />
              <Row theme={theme} label="Weekday" value={facts.dayName} />
              <Row theme={theme} label="Day of Yr" value={`${facts.dayOfYear}/${facts.daysInYear}`} />
              <Row theme={theme} label="Week #" value={facts.weekNumber} />
              <Row theme={theme} label="Quarter" value={`Q${facts.quarter}`} />
              <Row theme={theme} label="Leap Year" value={facts.isLeap ? 'Yes' : 'No'} />
              <Row theme={theme} label="Unix" value={facts.unix} />
              <Row theme={theme} label="From Today" value={`${Math.round((added - today) / 86400000)}d`} />
            </div>

            <button
              onClick={() => {
                feedback('equals');
                addHistory({ expression: `${formatDate(fromISO(base) || today, 'short')} ${subtract ? '−' : '+'} ${addY}y ${addM}m ${addW}w ${addD}d`, result: toISO(added), mode: 'Date' });
              }}
              className={`${KEY_BASE} ${theme.equalKey} w-full py-2 text-[11px]`}
            >Save to History</button>
          </>
        )}

        {/* ================= AGE ================= */}
        {tab === 'age' && (
          <>
            <div className={`rounded-lg border ${theme.panelBorder} ${theme.panelBg} p-2`}>
              <DateField theme={theme} label="Date of birth" value={birth} onChange={setBirth} />
            </div>

            <div className={`rounded-xl border-2 ${theme.lcdBorder} ${theme.lcdBg} ${theme.lcdGlow} p-2 text-center lcd-scanlines`}>
              <div className={`text-[8px] font-bold uppercase tracking-widest ${theme.lcdHeader}`}>Exact Age</div>
              <div className={`text-[24px] font-mono font-bold leading-tight ${theme.lcdResult}`}>
                {age.years}<span className="text-[13px]">y</span> {age.months}<span className="text-[13px]">m</span> {age.days}<span className="text-[13px]">d</span>
              </div>
              <div className={`text-[11px] font-mono ${theme.lcdPreview}`}>{age.totalDays.toLocaleString()} days alive</div>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <Row theme={theme} label="Total Months" value={age.years * 12 + age.months} />
              <Row theme={theme} label="Total Weeks" value={Math.floor(age.totalDays / 7).toLocaleString()} />
              <Row theme={theme} label="Total Hours" value={(age.totalDays * 24).toLocaleString()} />
              <Row theme={theme} label="Heartbeats≈" value={(age.totalDays * 100800).toLocaleString()} />
              <Row theme={theme} label="Next B-day" value={formatDate(age.nextBirthday, 'short')} accent />
              <Row theme={theme} label="Days Left" value={age.daysToBirthday} accent />
            </div>

            <button
              onClick={() => { feedback('equals'); addHistory({ expression: `Age of ${birth}`, result: `${age.years}y ${age.months}m ${age.days}d`, mode: 'Date' }); }}
              className={`${KEY_BASE} ${theme.equalKey} w-full py-2 text-[11px]`}
            >Save to History</button>
          </>
        )}

        {/* ================= CALENDAR ================= */}
        {tab === 'cal' && (
          <>
            <div className={`rounded-lg border ${theme.panelBorder} ${theme.panelBg} p-2`}>
              <div className="flex items-center justify-between mb-1.5">
                <button onClick={() => shiftMonth(-1)} className={`${KEY_BASE} ${theme.funcKey} h-7 w-7`}><ChevronLeft size={14} /></button>
                <div className="text-center">
                  <div className={`text-[13px] font-bold ${theme.bodyText}`}>{MONTH_NAMES[calM]} {calY}</div>
                  <button
                    onClick={() => { feedback('key'); setCalY(today.getFullYear()); setCalM(today.getMonth()); }}
                    className={`text-[9px] font-bold uppercase ${theme.accent}`}
                  >Jump to Today</button>
                </div>
                <button onClick={() => shiftMonth(1)} className={`${KEY_BASE} ${theme.funcKey} h-7 w-7`}><ChevronRight size={14} /></button>
              </div>

              <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                {DAY_MIN.map((d, i) => (
                  <div key={i} className={`text-center text-[9px] font-bold ${i === 0 || i === 6 ? theme.accent : theme.mutedText}`}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {grid.map((c, i) => {
                  const iso = toISO(new Date(c.year, c.month, c.day));
                  const isToday = c.current && iso === todayISO;
                  return (
                    <button
                      key={i}
                      onClick={() => { feedback('key'); if (c.current) setEnd(iso); }}
                      className={`aspect-square rounded-md text-[11px] font-mono flex items-center justify-center border
                        ${isToday ? `${theme.accentBg} text-white font-bold border-transparent` : c.current ? `${theme.panelBorder} ${theme.bodyText}` : `border-transparent ${theme.mutedText} opacity-40`}`}
                    >{c.day}</button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <Row theme={theme} label="Today" value={formatDate(today, 'short')} accent />
              <Row theme={theme} label="Weekday" value={dateFacts(today).dayName} />
              <Row theme={theme} label="Week #" value={dateFacts(today).weekNumber} />
              <Row theme={theme} label="Day of Yr" value={dateFacts(today).dayOfYear} />
              <Row theme={theme} label="Quarter" value={`Q${dateFacts(today).quarter}`} />
              <Row theme={theme} label="Unix" value={dateFacts(today).unix} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
