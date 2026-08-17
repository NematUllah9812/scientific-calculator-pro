import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Hash, FlaskConical, Binary, BarChart3, Scale, CalendarDays,
  Settings as SettingsIcon, History, Database, Calculator,
} from 'lucide-react';

import SimpleCalculator from './components/SimpleCalculator.jsx';
import ScientificCalculator from './components/ScientificCalculator.jsx';
import ProgrammerCalculator from './components/ProgrammerCalculator.jsx';
import StatisticsCalculator from './components/StatisticsCalculator.jsx';
import UnitConverter from './components/UnitConverter.jsx';
import DateCalculator from './components/DateCalculator.jsx';
import HistoryTape from './components/HistoryTape.jsx';
import MemoryManager from './components/MemoryManager.jsx';
import SettingsModal from './components/SettingsModal.jsx';

import { getTheme, DEFAULT_THEME } from './utils/themeStyles.js';
import { load, save, STORAGE_KEYS } from './utils/safeStorage.js';
import { feedback, unlockAudio } from './utils/audioHaptics.js';
import { useScale, px, ico, DESIGN_W, DESIGN_H } from './utils/scale.js';

const MODES = [
  { id: 'simple', label: 'Simple', Icon: Hash },
  { id: 'scientific', label: 'Scientific', Icon: FlaskConical },
  { id: 'programmer', label: 'Programmer', Icon: Binary },
  { id: 'statistics', label: 'Statistics', Icon: BarChart3 },
  { id: 'converter', label: 'Converter', Icon: Scale },
  { id: 'date', label: 'Date/Time', Icon: CalendarDays },
];

const DEFAULT_SETTINGS = {
  theme: DEFAULT_THEME,
  soundEnabled: true,
  soundProfile: 'beep',
  soundVolume: 0.5,
  hapticsEnabled: true,
  precision: 10,
  notation: 'standard',
  thousands: true,
  angleMode: 'DEG',
};

export default function App() {
  const scale = useScale();

  const [mode, setMode] = useState(() => load(STORAGE_KEYS.lastMode, 'simple'));
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...load(STORAGE_KEYS.settings, {}),
  }));
  const [history, setHistory] = useState(() => load(STORAGE_KEYS.history, []));
  const [memoryBanks, setMemoryBanks] = useState(() =>
    load(STORAGE_KEYS.memory, { M: 0, M1: 0, M2: 0, M3: 0, M4: 0, M5: 0 })
  );

  const [showHistory, setShowHistory] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [recallValue, setRecallValue] = useState(null);

  const tabStripRef = useRef(null);
  const tabRefs = useRef({});
  const [tabScroll, setTabScroll] = useState({ frac: 0, ratio: 1 });

  const theme = useMemo(() => getTheme(settings.theme), [settings.theme]);

  useEffect(() => save(STORAGE_KEYS.settings, settings), [settings]);
  useEffect(() => save(STORAGE_KEYS.history, history.slice(0, 200)), [history]);
  useEffect(() => save(STORAGE_KEYS.memory, memoryBanks), [memoryBanks]);
  useEffect(() => save(STORAGE_KEYS.lastMode, mode), [mode]);

  /* Keep the active tab visible in the scrolling strip. */
  useEffect(() => {
    const el = tabRefs.current[mode];
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [mode]);

  /* Track horizontal scroll of the tab strip to drive the progress bar. */
  useEffect(() => {
    const strip = tabStripRef.current;
    if (!strip) return;
    const update = () => {
      const max = strip.scrollWidth - strip.clientWidth;
      setTabScroll({
        frac: max > 0 ? strip.scrollLeft / max : 0,
        ratio: strip.scrollWidth > 0 ? strip.clientWidth / strip.scrollWidth : 1,
      });
    };
    update();
    strip.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(strip);
    return () => { strip.removeEventListener('scroll', update); ro.disconnect(); };
  }, []);

  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('mousedown', unlock);
    };
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('mousedown', unlock);
    return () => {
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('mousedown', unlock);
    };
  }, []);

  const addHistory = useCallback((entry) => {
    setHistory((h) => [{ ...entry, id: Date.now() + Math.random(), time: Date.now() }, ...h].slice(0, 200));
  }, []);

  const updateSettings = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const fb = useCallback((variant = 'key') => feedback(settings, variant), [settings]);

  const handleTab = (id) => {
    fb('toggle');
    setMode(id);
  };

  const memoryActive = Object.values(memoryBanks).some((v) => Number(v) !== 0);

  const shared = {
    theme,
    settings,
    updateSettings,
    addHistory,
    history,
    memoryBanks,
    setMemoryBanks,
    feedback: fb,
    recallValue,
    clearRecall: () => setRecallValue(null),
    scale,
  };

  const renderMode = () => {
    switch (mode) {
      case 'simple': return <SimpleCalculator {...shared} />;
      case 'scientific': return <ScientificCalculator {...shared} />;
      case 'programmer': return <ProgrammerCalculator {...shared} />;
      case 'statistics': return <StatisticsCalculator {...shared} />;
      case 'converter': return <UnitConverter {...shared} />;
      case 'date': return <DateCalculator {...shared} />;
      default: return <ScientificCalculator {...shared} />;
    }
  };

  return (
    <div className={`w-full h-full flex justify-center ${theme.appBg}`}>
      {/* Fixed-aspect app canvas: 412 x 929 design units scaled by --u */}
      <div
        className={`relative flex flex-col overflow-hidden ${theme.appBg} ${theme.bodyText}`}
        style={{ width: px(DESIGN_W), height: '100%', maxHeight: px(DESIGN_H) }}
      >
        {/* ================= Header ================= */}
        <header className={`shrink-0 ${theme.headerBg}`} style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
          <div
            className="flex items-center justify-between"
            style={{ height: px(52), paddingLeft: px(12), paddingRight: px(12) }}
          >
            <div className="flex items-center min-w-0" style={{ gap: px(9) }}>
              <div
                className={`${theme.accentBg} flex items-center justify-center shrink-0`}
                style={{ width: px(30), height: px(30), borderRadius: px(9) }}
              >
                <Calculator size={ico(scale, 17)} className="text-white" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 leading-none">
                <div
                  className="font-extrabold tracking-tight truncate"
                  style={{ fontSize: px(13.5), letterSpacing: px(0.2) }}
                >
                  SCIENTIFIC PRO
                </div>
                <div
                  className={`${theme.accent} font-bold uppercase truncate`}
                  style={{ fontSize: px(8.5), marginTop: px(2.5), letterSpacing: px(0.6) }}
                >
                  {theme.name}
                </div>
              </div>
            </div>

            <div className="flex items-center shrink-0" style={{ gap: px(14) }}>
              <IconBtn
                theme={theme} scale={scale} title="History"
                onClick={() => { fb('toggle'); setShowHistory(true); }}
                dot={history.length > 0}
              >
                <History size={ico(scale, 19)} />
              </IconBtn>
              <IconBtn
                theme={theme} scale={scale} title="Memory"
                onClick={() => { fb('toggle'); setShowMemory(true); }}
                dot={memoryActive}
              >
                <Database size={ico(scale, 19)} />
              </IconBtn>
              <IconBtn
                theme={theme} scale={scale} title="Settings"
                onClick={() => { fb('toggle'); setShowSettings(true); }}
              >
                <SettingsIcon size={ico(scale, 19)} />
              </IconBtn>
            </div>
          </div>

          {/* ================= Mode tabs ================= */}
          <div
            ref={tabStripRef}
            className="flex overflow-x-auto no-scrollbar"
            style={{ gap: px(6), paddingLeft: px(8), paddingRight: px(8), paddingBottom: px(7) }}
          >
            {MODES.map(({ id, label, Icon }) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  ref={(el) => { tabRefs.current[id] = el; }}
                  onClick={() => handleTab(id)}
                  className={`shrink-0 flex items-center ${active ? theme.tabActive : theme.tabInactive}`}
                  style={{
                    gap: px(6),
                    height: px(34),
                    paddingLeft: px(13),
                    paddingRight: px(13),
                    borderRadius: px(10),
                    fontSize: px(13),
                    fontWeight: active ? 700 : 600,
                  }}
                >
                  <Icon size={ico(scale, 14)} strokeWidth={active ? 2.6 : 2} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Scroll-position indicator for the tab strip */}
          <div
            className="relative overflow-hidden"
            style={{ height: px(1.5), marginLeft: px(90), marginRight: px(90), opacity: 0.75 }}
          >
            <div className="absolute inset-0 bg-white/8" style={{ borderRadius: px(2) }} />
            <div
              className={`absolute top-0 bottom-0 ${theme.accentBg}`}
              style={{
                width: `${Math.max(14, tabScroll.ratio * 100)}%`,
                left: `${tabScroll.frac * (100 - Math.max(14, tabScroll.ratio * 100))}%`,
                borderRadius: px(2),
                transition: 'left 90ms linear',
              }}
            />
          </div>
        </header>

        {/* ================= Active mode ================= */}
        <main className="flex-1 min-h-0 overflow-hidden">{renderMode()}</main>

        {/* ================= Modals ================= */}
        {showHistory && (
          <HistoryTape
            theme={theme} scale={scale} history={history}
            onClose={() => setShowHistory(false)}
            onClear={() => setHistory([])}
            onRecall={(v) => { setRecallValue(String(v)); setShowHistory(false); }}
            feedback={fb}
          />
        )}
        {showMemory && (
          <MemoryManager
            theme={theme} scale={scale} banks={memoryBanks} setBanks={setMemoryBanks}
            onClose={() => setShowMemory(false)}
            onRecall={(v) => { setRecallValue(String(v)); setShowMemory(false); }}
            settings={settings} feedback={fb}
          />
        )}
        {showSettings && (
          <SettingsModal
            theme={theme} scale={scale} settings={settings}
            updateSettings={updateSettings}
            onClose={() => setShowSettings(false)}
            feedback={fb}
          />
        )}
      </div>
    </div>
  );
}

function IconBtn({ theme, scale, children, onClick, dot, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`relative flex items-center justify-center ${theme.statusBarText} active:scale-90 transition-transform`}
      style={{ width: px(24), height: px(24) }}
    >
      {children}
      {dot && (
        <span
          className={`absolute ${theme.accentBg}`}
          style={{ top: px(-1), right: px(-1), width: px(7), height: px(7), borderRadius: px(7) }}
        />
      )}
    </button>
  );
}
