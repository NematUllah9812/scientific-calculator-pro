import React, { useState, useMemo } from 'react';
import {
  CalendarDays, Clock, Cake, CalendarRange, ChevronRight, ChevronLeft, Plus, Minus,
} from 'lucide-react';
import {
  MONTH_NAMES, DAY_SHORT, DAY_MIN, toISO, fromISO, formatDate, dateDifference,
  businessDays, addToDate, dateFacts, calculateAge, buildCalendarGrid,
} from '../utils/dateEngine.js';
import { px, ico } from '../utils/scale.js';

const todayISO = () => toISO(new Date());
const plusISO = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return toISO(d); };

export default function DateCalculator({ theme, addHistory, feedback, scale }) {
  const [tab, setTab] = useState('diff');

  const [startD, setStartD] = useState(todayISO());
  const [endD, setEndD] = useState(plusISO(31));

  const [baseD, setBaseD] = useState(todayISO());
  const [years, setYears] = useState(0);
  const [months, setMonths] = useState(0);
  const [weeks, setWeeks] = useState(0);
  const [days, setDays] = useState(30);
  const [subtract, setSubtract] = useState(false);

  const [birthD, setBirthD] = useState('1995-06-15');

  const now = new Date();
  const [calY, setCalY] = useState(now.getFullYear());
  const [calM, setCalM] = useState(now.getMonth());

  const diff = useMemo(() => dateDifference(fromISO(startD), fromISO(endD)), [startD, endD]);
  const biz = useMemo(() => businessDays(fromISO(startD), fromISO(endD)), [startD, endD]);
  const added = useMemo(
    () => addToDate(fromISO(baseD), { years: +years, months: +months, weeks: +weeks, days: +days }, subtract),
    [baseD, years, months, weeks, days, subtract],
  );
  const addedFacts = useMemo(() => dateFacts(added), [added]);
  const age = useMemo(() => calculateAge(fromISO(birthD)), [birthD]);
  const grid = useMemo(() => buildCalendarGrid(calY, calM), [calY, calM]);

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

  const DateField = ({ label, value, onChange }) => (
    <div>
      <div className={theme.mutedText} style={{ fontSize: px(10), fontWeight: 700, letterSpacing: '0.06em' }}>
        {label}
      </div>
      <label
        className={`flex items-center cursor-pointer relative border ${theme.inputBg}`}
        style={{
          borderRadius: px(9),
          padding: `${px(10)} ${px(11)}`, gap: px(9), marginTop: px(5),
        }}
      >
        <CalendarDays size={ico(scale, 15)} className={theme.accent} />
        <span className="flex-1 font-semibold" style={{ fontSize: px(14), fontVariantNumeric: 'tabular-nums' }}>
          {formatDate(fromISO(value), 'medium')}
        </span>
        <ChevronRight size={ico(scale, 14)} className={theme.mutedText} />
        <input
          type="date"
          value={value}
          onChange={(e) => { feedback('key'); if (e.target.value) onChange(e.target.value); }}
          className="absolute opacity-0 w-0 h-0"
        />
      </label>
    </div>
  );

  const Banner = ({ label, value }) => (
    <div className={`${theme.accentSoft} border text-center`} style={{ borderRadius: px(11), padding: px(11) }}>
      <div className={theme.accent} style={{ fontSize: px(11), fontWeight: 700, letterSpacing: '0.08em', opacity: 0.85 }}>
        {label}
      </div>
      <div className={`${theme.accent} font-bold`} style={{ fontSize: px(20), marginTop: px(4), fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );

  const Card = ({ label, value, accent }) => (
    <div className={`${theme.panelBg} border ${theme.panelBorder}`} style={{ borderRadius: px(10), padding: px(10) }}>
      <div className={theme.mutedText} style={{ fontSize: px(10.5) }}>{label}</div>
      <div
        className={`font-bold truncate ${accent ? theme.accent : theme.bodyText}`}
        style={{ fontSize: px(16), marginTop: px(4), fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </div>
    </div>
  );

  const Stepper = ({ label, value, onChange }) => (
    <div className={`${theme.panelBg} border ${theme.panelBorder}`} style={{ borderRadius: px(10), padding: px(8) }}>
      <div className={theme.mutedText} style={{ fontSize: px(10), fontWeight: 700 }}>{label}</div>
      <div className="flex items-center" style={{ gap: px(6), marginTop: px(5) }}>
        <button
          onClick={() => { feedback('key'); onChange(Math.max(0, Number(value) - 1)); }}
          className={`${theme.chipBg} ${theme.chipText} flex items-center justify-center active:scale-90`}
          style={{ width: px(26), height: px(26), borderRadius: px(7) }}
        >
          <Minus size={ico(scale, 13)} />
        </button>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, '') || 0)}
          inputMode="numeric"
          className={`flex-1 min-w-0 text-center border outline-none ${theme.inputBg}`}
          style={{ borderRadius: px(7), padding: `${px(4)} 0`, fontSize: px(14), fontWeight: 700 }}
        />
        <button
          onClick={() => { feedback('key'); onChange(Number(value) + 1); }}
          className={`${theme.chipBg} ${theme.chipText} flex items-center justify-center active:scale-90`}
          style={{ width: px(26), height: px(26), borderRadius: px(7) }}
        >
          <Plus size={ico(scale, 13)} />
        </button>
      </div>
    </div>
  );

  const shiftMonth = (n) => {
    feedback('toggle');
    let m = calM + n, y = calY;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setCalM(m); setCalY(y);
  };

  const todayKey = toISO(new Date());

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ paddingLeft: px(8.4), paddingRight: px(8.4) }}>
      <div
        className={`shrink-0 flex ${theme.panelBg} border ${theme.panelBorder}`}
        style={{ gap: px(4), borderRadius: px(11), padding: px(4), marginTop: px(4) }}
      >
        <Seg id="diff" label="Difference" Icon={CalendarDays} />
        <Seg id="add" label="Add / Sub" Icon={Clock} />
        <Seg id="age" label="Age" Icon={Cake} />
        <Seg id="cal" label="Calendar" Icon={CalendarRange} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scroll" style={{ paddingTop: px(8), paddingBottom: px(12) }}>
        {tab === 'diff' && (
          <div style={{ display: 'grid', gap: px(8) }}>
            <div
              className={`${theme.panelBg} border ${theme.panelBorder}`}
              style={{ borderRadius: px(12), padding: px(11), display: 'grid', gap: px(9) }}
            >
              <DateField label="START DATE" value={startD} onChange={setStartD} />
              <DateField label="END DATE" value={endD} onChange={setEndD} />
            </div>

            <Banner
              label="TIME DIFFERENCE"
              value={`${diff.years ? `${diff.years}y ` : ''}${diff.months}m ${diff.days}d (${diff.totalDays} total days)`}
            />

            <div className="grid grid-cols-2" style={{ gap: px(7) }}>
              <Card label="Total Days" value={`${diff.totalDays} days`} />
              <Card label="Working / Business Days" value={`${biz.workingDays} days`} accent />
              <Card label="Weeks & Days" value={`${diff.totalWeeks} wks, ${diff.remainderDays} d`} />
              <Card label="Total Hours" value={`${diff.totalHours.toLocaleString()} hrs`} />
              <Card label="Total Minutes" value={diff.totalMinutes.toLocaleString()} />
              <Card label="Total Months" value={`${diff.totalMonths} mo`} />
            </div>

            <button
              onClick={() => {
                feedback('equals');
                addHistory({
                  expression: `${formatDate(fromISO(startD), 'medium')} → ${formatDate(fromISO(endD), 'medium')}`,
                  result: `${diff.totalDays} days`, mode: 'Date',
                });
              }}
              className={`${theme.accentBg} text-white active:scale-[0.98]`}
              style={{ borderRadius: px(10), padding: px(10), fontSize: px(13), fontWeight: 700 }}
            >
              Save to History
            </button>
          </div>
        )}

        {tab === 'add' && (
          <div style={{ display: 'grid', gap: px(8) }}>
            <div className={`${theme.panelBg} border ${theme.panelBorder}`} style={{ borderRadius: px(12), padding: px(11) }}>
              <DateField label="BASE DATE" value={baseD} onChange={setBaseD} />
            </div>

            <div className="flex" style={{ gap: px(6) }}>
              {[['Add', false], ['Subtract', true]].map(([lbl, val]) => (
                <button
                  key={lbl}
                  onClick={() => { feedback('toggle'); setSubtract(val); }}
                  className={`flex-1 ${subtract === val ? `${theme.accentBg} text-white` : `${theme.chipBg} ${theme.chipText}`}`}
                  style={{ borderRadius: px(9), padding: px(9), fontSize: px(13), fontWeight: 700 }}
                >
                  {lbl}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2" style={{ gap: px(7) }}>
              <Stepper label="YEARS" value={years} onChange={setYears} />
              <Stepper label="MONTHS" value={months} onChange={setMonths} />
              <Stepper label="WEEKS" value={weeks} onChange={setWeeks} />
              <Stepper label="DAYS" value={days} onChange={setDays} />
            </div>

            <Banner label="RESULT DATE" value={formatDate(added, 'medium')} />

            <div className="grid grid-cols-2" style={{ gap: px(7) }}>
              <Card label="Day of Week" value={addedFacts.dayName} accent />
              <Card label="Day of Year" value={`${addedFacts.dayOfYear} / ${addedFacts.daysInYear}`} />
              <Card label="ISO Week" value={`W${addedFacts.weekNumber}`} />
              <Card label="Quarter" value={`Q${addedFacts.quarter}`} />
            </div>
          </div>
        )}

        {tab === 'age' && (
          <div style={{ display: 'grid', gap: px(8) }}>
            <div className={`${theme.panelBg} border ${theme.panelBorder}`} style={{ borderRadius: px(12), padding: px(11) }}>
              <DateField label="DATE OF BIRTH" value={birthD} onChange={setBirthD} />
            </div>

            <Banner label="CURRENT AGE" value={`${age.years}y ${age.months}m ${age.days}d`} />

            <div className="grid grid-cols-2" style={{ gap: px(7) }}>
              <Card label="Total Days Lived" value={age.totalDays.toLocaleString()} />
              <Card label="Total Weeks" value={Math.floor(age.totalDays / 7).toLocaleString()} />
              <Card label="Next Birthday" value={formatDate(age.nextBirthday, 'medium')} />
              <Card label="Days to Birthday" value={`${age.daysToBirthday} days`} accent />
              <Card label="Total Hours" value={(age.totalDays * 24).toLocaleString()} />
              <Card label="Total Months" value={(age.years * 12 + age.months).toLocaleString()} />
            </div>
          </div>
        )}

        {tab === 'cal' && (
          <div className={`${theme.panelBg} border ${theme.panelBorder}`} style={{ borderRadius: px(12), padding: px(10) }}>
            <div className="flex items-center justify-between" style={{ marginBottom: px(9) }}>
              <button
                onClick={() => shiftMonth(-1)}
                className={`${theme.chipBg} ${theme.chipText} flex items-center justify-center active:scale-90`}
                style={{ width: px(30), height: px(30), borderRadius: px(8) }}
              >
                <ChevronLeft size={ico(scale, 15)} />
              </button>
              <span className={`font-bold ${theme.bodyText}`} style={{ fontSize: px(15) }}>
                {MONTH_NAMES[calM]} {calY}
              </span>
              <button
                onClick={() => shiftMonth(1)}
                className={`${theme.chipBg} ${theme.chipText} flex items-center justify-center active:scale-90`}
                style={{ width: px(30), height: px(30), borderRadius: px(8) }}
              >
                <ChevronRight size={ico(scale, 15)} />
              </button>
            </div>

            <div className="grid grid-cols-7" style={{ gap: px(3), marginBottom: px(4) }}>
              {DAY_SHORT.map((d, i) => (
                <div key={d} className={`text-center ${theme.mutedText}`} style={{ fontSize: px(10), fontWeight: 700 }}>
                  {DAY_MIN ? DAY_MIN[i] : d.slice(0, 1)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7" style={{ gap: px(3) }}>
              {grid.map((c, i) => {
                const iso = toISO(new Date(c.year, c.month, c.day));
                const isToday = c.current && iso === todayKey;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-center ${isToday ? `${theme.accentBg} text-white font-bold` : c.current ? theme.bodyText : theme.mutedText}`}
                    style={{
                      aspectRatio: '1', borderRadius: px(7), fontSize: px(12),
                      opacity: c.current ? 1 : 0.35,
                      background: isToday ? undefined : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    {c.day}
                  </div>
                );
              })}
            </div>

            <div className={`${theme.mutedText} text-center`} style={{ fontSize: px(10.5), marginTop: px(9) }}>
              Today · {formatDate(new Date(), 'long')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
