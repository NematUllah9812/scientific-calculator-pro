import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calculator, FlaskConical, Binary, BarChart3, Ruler, CalendarDays,
  Settings as SettingsIcon, History, Save, Package,
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
import ApkDownloadModal from './components/ApkDownloadModal.jsx';

import { getTheme, DEFAULT_THEME, TAB_BASE } from './utils/themeStyles.js';
import { load, save, STORAGE_KEYS } from './utils/safeStorage.js';
import { feedback, unlockAudio } from './utils/audioHaptics.js';

const MODES = [
  { id: 'simple', label: 'Simple', Icon: Calculator },
  { id: 'scientific', label: 'Science', Icon: FlaskConical },
  { id: 'programmer', label: 'Prog', Icon: Binary },
  { id: 'statistics', label: 'Stats', Icon: BarChart3 },
  { id: 'converter', label: 'Convert', Icon: Ruler },
  { id: 'date', label: 'Date', Icon: CalendarDays },
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
  const [mode, setMode] = useState(() => load(STORAGE_KEYS.lastMode, 'scientific'));
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
  const [showApk, setShowApk] = useState(false);
  const [recallValue, setRecallValue] = useState(null);

  const theme = useMemo(() => getTheme(settings.theme), [settings.theme]);

  useEffect(() => save(STORAGE_KEYS.settings, settings), [settings]);
  useEffect(() => save(STORAGE_KEYS.history, history.slice(0, 200)), [history]);
  useEffect(() => save(STORAGE_KEYS.memory, memoryBanks), [memoryBanks]);
  useEffect(() => save(STORAGE_KEYS.lastMode, mode), [mode]);

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
  };

  const renderMode = () => {
    switch (mode) {
      case 'simple':
        return <SimpleCalculator {...shared} />;
      case 'scientific':
        return <ScientificCalculator {...shared} />;
      case 'programmer':
        return <ProgrammerCalculator {...shared} />;
      case 'statistics':
        return <StatisticsCalculator {...shared} />;
      case 'converter':
        return <UnitConverter {...shared} />;
      case 'date':
        return <DateCalculator {...shared} />;
      default:
        return <ScientificCalculator {...shared} />;
    }
  };

  return (
    <div className={`h-full w-full flex flex-col ${theme.appBg} ${theme.bodyText} overflow-hidden`}>
      {/* ---------- Top bar ---------- */}
      <header
        className={`shrink-0 ${theme.headerBg} border-b ${theme.frameBorder} safe-top`}
      >
        <div className="flex items-center justify-between px-2.5 h-11">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className={`w-6 h-6 rounded-md ${theme.accentBg} flex items-center justify-center shrink-0`}>
              <Calculator size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold tracking-tight leading-none truncate">
                Scientific Calculator Pro
              </div>
              <div className={`text-[8px] ${theme.mutedText} leading-none mt-0.5 uppercase tracking-widest`}>
                {MODES.find((m) => m.id === mode)?.label} Mode
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <IconBtn theme={theme} onClick={() => { fb('toggle'); setShowMemory(true); }} active={memoryActive} title="Memory">
              <Save size={15} />
            </IconBtn>
            <IconBtn theme={theme} onClick={() => { fb('toggle'); setShowHistory(true); }} badge={history.length} title="History">
              <History size={15} />
            </IconBtn>
            <IconBtn theme={theme} onClick={() => { fb('toggle'); setShowApk(true); }} title="Get APK">
              <Package size={15} />
            </IconBtn>
            <IconBtn theme={theme} onClick={() => { fb('toggle'); setShowSettings(true); }} title="Settings">
              <SettingsIcon size={15} />
            </IconBtn>
          </div>
        </div>
      </header>

      {/* ---------- Active mode ---------- */}
      <main className="flex-1 min-h-0 overflow-hidden">{renderMode()}</main>

      {/* ---------- Bottom tab bar ---------- */}
      <nav className={`shrink-0 ${theme.headerBg} border-t ${theme.frameBorder} safe-bottom`}>
        <div className="grid grid-cols-6 gap-0.5 px-1 py-1">
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => handleTab(id)}
              className={`${TAB_BASE} ${mode === id ? theme.tabActive : theme.tabInactive}`}
            >
              <Icon size={15} strokeWidth={mode === id ? 2.6 : 2} />
              <span className="text-[8px]">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ---------- Modals ---------- */}
      {showHistory && (
        <HistoryTape
          theme={theme}
          history={history}
          onClose={() => setShowHistory(false)}
          onClear={() => setHistory([])}
          onRecall={(v) => { setRecallValue(String(v)); setShowHistory(false); }}
          feedback={fb}
        />
      )}
      {showMemory && (
        <MemoryManager
          theme={theme}
          banks={memoryBanks}
          setBanks={setMemoryBanks}
          onClose={() => setShowMemory(false)}
          onRecall={(v) => { setRecallValue(String(v)); setShowMemory(false); }}
          settings={settings}
          feedback={fb}
        />
      )}
      {showSettings && (
        <SettingsModal
          theme={theme}
          settings={settings}
          updateSettings={updateSettings}
          onClose={() => setShowSettings(false)}
          feedback={fb}
        />
      )}
      {showApk && <ApkDownloadModal theme={theme} onClose={() => setShowApk(false)} />}
    </div>
  );
}

function IconBtn({ theme, children, onClick, badge, active, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`relative w-8 h-8 rounded-lg flex items-center justify-center border transition-all active:scale-90
        ${active ? `${theme.accentBg} text-white border-transparent` : `${theme.panelBg} ${theme.panelBorder} ${theme.statusBarText}`}`}
    >
      {children}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}
