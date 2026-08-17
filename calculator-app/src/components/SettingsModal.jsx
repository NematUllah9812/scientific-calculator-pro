import React, { useState } from 'react';
import { X, Palette, Volume2, Vibrate, Hash, Info, RotateCcw } from 'lucide-react';
import { THEME_LIST, DEFAULT_THEME, KEY_BASE } from '../utils/themeStyles.js';
import { SOUND_LIST, playSound, vibrate, isAndroidShell } from '../utils/audioHaptics.js';
import { clearAll } from '../utils/safeStorage.js';

function Section({ theme, title, Icon, children }) {
  return (
    <div className={`rounded-xl border ${theme.panelBorder} ${theme.panelBg} p-2 space-y-1.5`}>
      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${theme.mutedText}`}>
        <Icon size={12} />{title}
      </div>
      {children}
    </div>
  );
}

function Toggle({ theme, label, sub, value, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-full flex items-center justify-between rounded-lg border ${theme.panelBorder} px-2 py-1.5 active:scale-[0.99] transition`}
    >
      <div className="text-left">
        <div className="text-[12px] font-semibold">{label}</div>
        {sub && <div className={`text-[9px] ${theme.mutedText}`}>{sub}</div>}
      </div>
      <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${value ? theme.accentBg : 'bg-slate-500/40'}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : ''}`} />
      </div>
    </button>
  );
}

export default function SettingsModal({ theme, settings, updateSettings, onClose, feedback }) {
  const [resetArmed, setResetArmed] = useState(false);

  const pick = (patch, variant = 'toggle') => { feedback(variant); updateSettings(patch); };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end anim-fade" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <button className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} aria-label="close" />
      <div className={`relative anim-sheet rounded-t-2xl border-t-2 ${theme.modalBorder} ${theme.modalBg} flex flex-col`} style={{ maxHeight: '90%' }}>
        <div className={`shrink-0 flex items-center justify-between px-3 py-2 border-b ${theme.panelBorder}`}>
          <div>
            <div className="text-[13px] font-extrabold">Settings</div>
            <div className={`text-[9px] uppercase tracking-widest ${theme.mutedText}`}>v3.0 · {isAndroidShell() ? 'Android Shell' : 'Web'}</div>
          </div>
          <button onClick={onClose} className={`${KEY_BASE} ${theme.funcKey} h-7 w-7`}><X size={14} /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scroll px-3 py-2 space-y-2">
          {/* Themes */}
          <Section theme={theme} title="Theme" Icon={Palette}>
            <div className="grid grid-cols-1 gap-1">
              {THEME_LIST.map((t) => (
                <button
                  key={t.id}
                  onClick={() => pick({ theme: t.id })}
                  className={`flex items-center justify-between rounded-lg border px-2 py-1.5 text-left
                    ${settings.theme === t.id ? theme.tabActive : `${theme.panelBorder} ${theme.bodyText}`}`}
                >
                  <span className="text-[12px] font-semibold">{t.name}</span>
                  <span className="flex gap-1">
                    <span className={`w-3.5 h-3.5 rounded ${t.accentBg}`} />
                    <span className={`w-3.5 h-3.5 rounded border ${t.lcdBorder} ${t.lcdBg}`} />
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Sound */}
          <Section theme={theme} title="Sound" Icon={Volume2}>
            <Toggle
              theme={theme}
              label="Key Sounds"
              sub="Synthesized tones on each press"
              value={settings.soundEnabled}
              onChange={() => pick({ soundEnabled: !settings.soundEnabled })}
            />
            <div className="grid grid-cols-3 gap-1">
              {SOUND_LIST.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { updateSettings({ soundProfile: s.id }); playSound(s.id, settings.soundVolume, 'key'); }}
                  className={`${KEY_BASE} py-1.5 text-[9px] ${settings.soundProfile === s.id ? theme.equalKey : theme.funcKey}`}
                >{s.name}</button>
              ))}
            </div>
            <label className="block">
              <span className={`text-[9px] font-bold uppercase tracking-wider ${theme.mutedText}`}>
                Volume · {Math.round(settings.soundVolume * 100)}%
              </span>
              <input
                type="range" min="0" max="1" step="0.05"
                value={settings.soundVolume}
                onChange={(e) => updateSettings({ soundVolume: Number(e.target.value) })}
                onMouseUp={() => playSound(settings.soundProfile, settings.soundVolume, 'key')}
                className="w-full accent-current"
              />
            </label>
          </Section>

          {/* Haptics */}
          <Section theme={theme} title="Haptics" Icon={Vibrate}>
            <Toggle
              theme={theme}
              label="Vibration Feedback"
              sub={isAndroidShell() ? 'Native Android vibrator' : 'Browser Vibration API'}
              value={settings.hapticsEnabled}
              onChange={() => { updateSettings({ hapticsEnabled: !settings.hapticsEnabled }); vibrate('key', true); }}
            />
          </Section>

          {/* Number format */}
          <Section theme={theme} title="Number Format" Icon={Hash}>
            <div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${theme.mutedText}`}>Notation</span>
              <div className="grid grid-cols-3 gap-1 mt-0.5">
                {['standard', 'scientific', 'engineering'].map((n) => (
                  <button key={n} onClick={() => pick({ notation: n })}
                    className={`${KEY_BASE} py-1.5 text-[9px] capitalize ${settings.notation === n ? theme.equalKey : theme.funcKey}`}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${theme.mutedText}`}>Angle Unit</span>
              <div className="grid grid-cols-3 gap-1 mt-0.5">
                {['DEG', 'RAD', 'GRAD'].map((a) => (
                  <button key={a} onClick={() => pick({ angleMode: a })}
                    className={`${KEY_BASE} py-1.5 text-[9px] ${settings.angleMode === a ? theme.equalKey : theme.funcKey}`}>{a}</button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className={`text-[9px] font-bold uppercase tracking-wider ${theme.mutedText}`}>
                Precision · {settings.precision} significant digits
              </span>
              <input
                type="range" min="2" max="14" step="1"
                value={settings.precision}
                onChange={(e) => updateSettings({ precision: Number(e.target.value) })}
                className="w-full accent-current"
              />
            </label>
            <Toggle
              theme={theme}
              label="Thousands Separators"
              sub="Group digits as 1,234,567"
              value={settings.thousands}
              onChange={() => pick({ thousands: !settings.thousands })}
            />
          </Section>

          {/* About */}
          <Section theme={theme} title="About" Icon={Info}>
            <div className={`text-[11px] leading-relaxed ${theme.mutedText}`}>
              <b className={theme.bodyText}>Scientific Calculator Pro</b> v3.0 — six calculation modes, a BigInt
              programmer ALU, 18-metric statistics engine, 12-category unit converter and a full date engine.
              Packaged as an offline Android WebView app.
            </div>
            <button
              onClick={() => {
                feedback('clear');
                if (resetArmed) { clearAll(); window.location.reload(); } else setResetArmed(true);
              }}
              className={`${KEY_BASE} ${resetArmed ? theme.clearKey : theme.funcKey} w-full py-2 text-[10px] flex-row gap-1`}
            >
              <RotateCcw size={12} />{resetArmed ? 'Tap again to erase all data' : 'Reset App Data'}
            </button>
            <button
              onClick={() => pick({ theme: DEFAULT_THEME, notation: 'standard', precision: 10, thousands: true, angleMode: 'DEG' })}
              className={`${KEY_BASE} ${theme.funcKey} w-full py-2 text-[10px]`}
            >Restore Default Preferences</button>
          </Section>
        </div>
      </div>
    </div>
  );
}
