import React, { useState } from 'react';
import { X, Palette, Volume2, Vibrate, Hash, Info, RotateCcw } from 'lucide-react';
import { THEME_LIST, DEFAULT_THEME } from '../utils/themeStyles.js';
import { SOUND_LIST, playSound, vibrate, isAndroidShell } from '../utils/audioHaptics.js';
import { clearAll } from '../utils/safeStorage.js';

function Group({ theme, title, Icon, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        className={`${theme.mutedText} flex items-center font-bold`}
        style={{ fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase', gap: 5, marginBottom: 6, paddingLeft: 2 }}
      >
        <Icon size={12} />
        {title}
      </div>
      <div className={`${theme.panelBg}`} style={{ borderRadius: 14, padding: 10 }}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ theme, label, sub, value, onChange }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={value}
      className="w-full flex items-center justify-between text-left active:scale-[0.99] transition-transform"
    >
      <div className="min-w-0" style={{ paddingRight: 12 }}>
        <div className="font-semibold truncate" style={{ fontSize: 13.5 }}>{label}</div>
        {sub && <div className={`${theme.mutedText} truncate`} style={{ fontSize: 10.5, marginTop: 1 }}>{sub}</div>}
      </div>
      <div
        className={`shrink-0 transition-colors ${value ? theme.accentBg : theme.chipBg}`}
        style={{ width: 44, height: 26, borderRadius: 13, padding: 2 }}
      >
        <div
          className="bg-white"
          style={{
            width: 22, height: 22, borderRadius: 11,
            transform: value ? 'translateX(18px)' : 'translateX(0)',
            transition: 'transform 160ms cubic-bezier(0.22,1,0.36,1)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          }}
        />
      </div>
    </button>
  );
}

export default function SettingsModal({ theme, settings, updateSettings, onClose, feedback }) {
  const [resetArmed, setResetArmed] = useState(false);

  const pick = (patch, variant = 'toggle') => { feedback(variant); updateSettings(patch); };

  const Seg = ({ items, value, onPick, size = 11 }) => (
    <div className="flex" style={{ gap: 4 }}>
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onPick(it.id)}
          className={`flex-1 ${value === it.id ? `${theme.accentBg} ${theme.accentText}` : `${theme.chipBg} ${theme.chipText}`} transition-transform active:scale-95`}
          style={{ height: 32, borderRadius: 9, fontSize: size, fontWeight: 700, textTransform: it.label === it.id ? undefined : 'capitalize' }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );

  const NOTATIONS = [
    { id: 'standard', label: 'Standard' },
    { id: 'scientific', label: 'Sci' },
    { id: 'engineering', label: 'Eng' },
  ];
  const ANGLES = [
    { id: 'DEG', label: 'DEG' },
    { id: 'RAD', label: 'RAD' },
    { id: 'GRAD', label: 'GRAD' },
  ];

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end anim-fade" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <button className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} aria-label="close" />
      <div className={`relative anim-sheet ${theme.modalBg} flex flex-col`} style={{ maxHeight: '90%', borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
        <div className="flex justify-center shrink-0" style={{ paddingTop: 7 }}>
          <div className={`${theme.mutedText} opacity-40`} style={{ width: 36, height: 4, borderRadius: 4 }} />
        </div>

        <div className="shrink-0 flex items-center justify-between" style={{ padding: '10px 14px 6px' }}>
          <div className="min-w-0">
            <div className="font-semibold truncate" style={{ fontSize: 17 }}>Settings</div>
            <div className={`${theme.mutedText}`} style={{ fontSize: 11 }}>
              {isAndroidShell() ? 'Android shell' : 'Web'} · v3.0
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={`${theme.chipBg} ${theme.mutedText} flex items-center justify-center active:scale-90`}
            style={{ width: 32, height: 32, borderRadius: 10 }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scroll" style={{ padding: '6px 14px 18px' }}>
          {/* Themes */}
          <Group theme={theme} title="Theme" Icon={Palette}>
            <div style={{ display: 'grid', gap: 5 }}>
              {THEME_LIST.map((t) => (
                <button
                  key={t.id}
                  onClick={() => pick({ theme: t.id })}
                  className={`flex items-center justify-between transition-transform active:scale-[0.99] ${
                    settings.theme === t.id ? theme.accentSoft : ''
                  }`}
                  style={{ borderRadius: 10, padding: '9px 10px' }}
                >
                  <span className={`font-semibold truncate ${settings.theme === t.id ? theme.accent : theme.bodyText}`} style={{ fontSize: 13 }}>
                    {t.name}
                  </span>
                  <span className="flex shrink-0" style={{ gap: 5 }}>
                    <span className={`${t.appBg} border ${t.panelBorder}`} style={{ width: 16, height: 16, borderRadius: 5 }} />
                    <span className={`${t.numKey} border ${t.panelBorder}`} style={{ width: 16, height: 16, borderRadius: 5 }} />
                    <span className={`${t.accentBg}`} style={{ width: 16, height: 16, borderRadius: 5 }} />
                  </span>
                </button>
              ))}
            </div>
          </Group>

          {/* Sound */}
          <Group theme={theme} title="Sound" Icon={Volume2}>
            <Toggle
              theme={theme}
              label="Key sounds"
              sub="Synthesized tone on every press"
              value={settings.soundEnabled}
              onChange={() => pick({ soundEnabled: !settings.soundEnabled })}
            />
            <div style={{ height: 8 }} />
            <Seg
              items={SOUND_LIST.map((s) => ({ id: s.id, label: s.name }))}
              value={settings.soundProfile}
              size={9.5}
              onPick={(id) => { updateSettings({ soundProfile: id }); playSound(id, settings.soundVolume, 'key'); }}
            />
            <div style={{ height: 12 }} />
            <label className="block">
              <span className={`${theme.mutedText} font-bold`} style={{ fontSize: 9.5, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Volume · {Math.round(settings.soundVolume * 100)}%
              </span>
              <input
                type="range" min="0" max="1" step="0.05"
                value={settings.soundVolume}
                onChange={(e) => updateSettings({ soundVolume: Number(e.target.value) })}
                onMouseUp={() => playSound(settings.soundProfile, settings.soundVolume, 'key')}
                className={`w-full ${theme.accent}`}
                style={{ marginTop: 8, color: 'currentColor' }}
              />
            </label>
          </Group>

          {/* Haptics */}
          <Group theme={theme} title="Haptics" Icon={Vibrate}>
            <Toggle
              theme={theme}
              label="Vibration feedback"
              sub={isAndroidShell() ? 'Native Android vibrator' : 'Browser Vibration API'}
              value={settings.hapticsEnabled}
              onChange={() => { updateSettings({ hapticsEnabled: !settings.hapticsEnabled }); vibrate('key', true); }}
            />
          </Group>

          {/* Number format */}
          <Group theme={theme} title="Number format" Icon={Hash}>
            <div className={`${theme.mutedText} font-bold`} style={{ fontSize: 9.5, letterSpacing: 0.5, textTransform: 'uppercase' }}>Notation</div>
            <div style={{ marginTop: 6 }}>
              <Seg items={NOTATIONS} value={settings.notation} onPick={(id) => pick({ notation: id })} />
            </div>
            <div style={{ height: 12 }} />
            <div className={`${theme.mutedText} font-bold`} style={{ fontSize: 9.5, letterSpacing: 0.5, textTransform: 'uppercase' }}>Angle unit</div>
            <div style={{ marginTop: 6 }}>
              <Seg items={ANGLES} value={settings.angleMode} onPick={(id) => pick({ angleMode: id })} />
            </div>
            <div style={{ height: 12 }} />
            <label className="block">
              <span className={`${theme.mutedText} font-bold`} style={{ fontSize: 9.5, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Precision · {settings.precision} significant digits
              </span>
              <input
                type="range" min="2" max="14" step="1"
                value={settings.precision}
                onChange={(e) => updateSettings({ precision: Number(e.target.value) })}
                className={`w-full ${theme.accent}`}
                style={{ marginTop: 8, color: 'currentColor' }}
              />
            </label>
            <div style={{ height: 10 }} />
            <Toggle
              theme={theme}
              label="Thousands separators"
              sub="Group digits as 1,234,567"
              value={settings.thousands}
              onChange={() => pick({ thousands: !settings.thousands })}
            />
          </Group>

          {/* About */}
          <Group theme={theme} title="About" Icon={Info}>
            <div className={`${theme.mutedText}`} style={{ fontSize: 11.5, lineHeight: 1.55 }}>
              <b className={theme.bodyText}>Scientific Calculator Pro</b> v3.0 — six calculation modes, a BigInt
              programmer ALU, an 18-metric statistics engine, a 12-category unit converter and a full date engine.
              Packaged as an offline Android WebView app.
            </div>
            <div style={{ height: 10 }} />
            <button
              onClick={() => {
                feedback('clear');
                if (resetArmed) { clearAll(); window.location.reload(); } else setResetArmed(true);
              }}
              className={`w-full ${resetArmed ? theme.clearKey : `${theme.chipBg} ${theme.chipText}`} transition-transform active:scale-[0.99]`}
              style={{ height: 34, borderRadius: 10, fontSize: 11, fontWeight: 700 }}
            >
              <RotateCcw size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 5 }} />
              {resetArmed ? 'Tap again to erase all data' : 'Reset app data'}
            </button>
            <div style={{ height: 6 }} />
            <button
              onClick={() => pick({ theme: DEFAULT_THEME, notation: 'standard', precision: 10, thousands: true, angleMode: 'DEG' })}
              className={`w-full ${theme.chipBg} ${theme.chipText} transition-transform active:scale-[0.99]`}
              style={{ height: 34, borderRadius: 10, fontSize: 11, fontWeight: 700 }}
            >
              Restore default preferences
            </button>
          </Group>
        </div>
      </div>
    </div>
  );
}
