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

/** Older builds stored short notation ids ('sci' / 'eng') that the
 *  formatter does not understand — migrate them on load. */
function migrateSettings(raw) {
  const s = { ...DEFAULT_SETTINGS, ...(raw || {}) };
  if (s.notation === 'sci') s.notation = 'scientific';
  else if (s.notation === 'eng') s.notation = 'engineering';
  if (!['standard', 'scientific', 'engineering'].includes(s.notation)) s.notation = 'standard';
  if (!['DEG', 'RAD', 'GRAD'].includes(s.angleMode)) s.angleMode = 'DEG';
  if (!Number.isFinite(Number(s.precision))) s.precision = DEFAULT_SETTINGS.precision;
  s.precision = Math.max(2, Math.min(14, Number(s.precision)));
  return s;
}

export default function App() {
  const scale = useScale();

  const [mode, setMode] = useState(() => load(STORAGE_KEYS.lastMode, 'simple'));
  const [settings, setSettings] = useState(() => migrateSettings(load(STORAGE_KEYS.settings, {})));
  const [history, setHistory] = useState(() => load(STORAGE_KEYS.history, []));
  const [memoryBanks, setMemoryBanks] = useState(() =>
    load(STORAGE_KEYS.memory, { M: 0, M1: 0, M2: 0, M3: 0, M4: 0, M5: 0 })
  );

  const [showHistory, setShowHistory] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [recallValue, setRecallValue] = useState(null);

  const tabRefs = useRef({});

  const theme = useMemo(() => getTheme(settings.theme), [settings.theme]);

  useEffect(() => save(STORAGE_KEYS.settings, settings), [settings]);
  useEffect(() => save(STORAGE_KEYS.history, history.slice(0, 200)), [history]);
  useEffect(() => save(STORAGE_KEYS.memory, memoryBanks), [memoryBanks]);
  useEffect(() => save(STORAGE_KEYS.lastMode, mode), [mode]);

  /* Native form controls and scrollbars must follow the theme. */
  useEffect(() => {
    document.documentElement.style.colorScheme = theme.lcdIsLight ? 'light' : 'dark';
  }, [theme.lcdIsLight]);

  /* Keep the active tab visible in the scrolling strip. */
  useEffect(() => {
    const el = tabRefs.current[mode];
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [mode]);

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
    if (id === mode) return;
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

  const renderMode = (id) => {
    switch (id) {
      case 'simple': return <SimpleCalculator {...shared} active={mode === id} />;
      case 'scientific': return <ScientificCalculator {...shared} active={mode === id} />;
      case 'programmer': return <ProgrammerCalculator {...shared} active={mode === id} />;
      case 'statistics': return <StatisticsCalculator {...shared} active={mode === id} />;
      case 'converter': return <UnitConverter {...shared} active={mode === id} />;
      case 'date': return <DateCalculator {...shared} active={mode === id} />;
      default: return null;
    }
  };

  return (
    <div className={`w-full h-full flex items-center justify-center ${theme.appBg}`}>
      {/* Fixed-aspect app canvas: 412 x 929 design units scaled by --u */}
      <div
        className={`relative flex flex-col overflow-hidden ${theme.appBg} ${theme.bodyText}`}
        style={{
          width: px(DESIGN_W),
          height: px(DESIGN_H),
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        {/* ================= Header ================= */}
        <header className={`shrink-0 ${theme.headerBg}`}>
          <div
            className="flex items-center justify-between"
            style={{ height: px(46), paddingLeft: px(16), paddingRight: px(12) }}
          >
            <div className="flex items-center min-w-0" style={{ gap: px(9) }}>
              <div
                className={`${theme.accentBg} flex items-center justify-center shrink-0`}
                style={{ width: px(26), height: px(26), borderRadius: px(8) }}
              >
                <Calculator size={ico(scale, 15)} className={theme.accentText} strokeWidth={2.4} />
              </div>
              <div
                className="font-semibold truncate"
                style={{ fontSize: px(15), letterSpacing: px(-0.1) }}
              >
                Calculator
              </div>
            </div>

            <div className="flex items-center shrink-0" style={{ gap: px(2) }}>
              <IconBtn
                theme={theme} scale={scale} title="History"
                onClick={() => { fb('toggle'); setShowHistory(true); }}
                dot={history.length > 0}
              >
                <History size={ico(scale, 18)} />
              </IconBtn>
              <IconBtn
                theme={theme} scale={scale} title="Memory"
                onClick={() => { fb('toggle'); setShowMemory(true); }}
                dot={memoryActive}
              >
                <Database size={ico(scale, 18)} />
              </IconBtn>
              <IconBtn
                theme={theme} scale={scale} title="Settings"
                onClick={() => { fb('toggle'); setShowSettings(true); }}
              >
                <SettingsIcon size={ico(scale, 18)} />
              </IconBtn>
            </div>
          </div>

          {/* ================= Mode strip ================= */}
          <div
            className="flex overflow-x-auto no-scrollbar edge-fade"
            style={{ gap: px(5), paddingLeft: px(14), paddingRight: px(14), paddingBottom: px(10) }}
          >
            {MODES.map(({ id, label, Icon }) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  ref={(el) => { tabRefs.current[id] = el; }}
                  onClick={() => handleTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`shrink-0 flex items-center ${active ? theme.tabActive : theme.tabInactive}`}
                  style={{
                    gap: px(5),
                    height: px(32),
                    paddingLeft: px(11),
                    paddingRight: px(11),
                    borderRadius: px(16),
                    fontSize: px(12.5),
                    fontWeight: active ? 650 : 550,
                    transition: 'background-color 140ms ease, color 140ms ease, transform 100ms ease',
                  }}
                >
                  <Icon size={ico(scale, 13)} strokeWidth={active ? 2.5 : 2} />
                  {label}
                </button>
              );
            })}
          </div>
        </header>

        {/* ================= Active mode =================
            Every mode stays mounted (hidden with display:none) so that
            switching tabs never throws away what you were typing. */}
        <main className="flex-1 min-h-0 overflow-hidden">
          {MODES.map(({ id }) => (
            <div key={id} className="h-full" style={{ display: mode === id ? 'block' : 'none' }}>
              {renderMode(id)}
            </div>
          ))}
        </main>

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
      aria-label={title}
      className={`relative flex items-center justify-center ${theme.statusBarText} rounded-full
        transition-transform active:scale-90`}
      style={{ width: px(32), height: px(32) }}
    >
      {children}
      {dot && (
        <span
          className={`absolute ${theme.accentBg}`}
          style={{ top: px(5), right: px(5), width: px(6), height: px(6), borderRadius: px(6) }}
        />
      )}
    </button>
  );
}
