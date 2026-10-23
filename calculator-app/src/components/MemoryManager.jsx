import React, { useState } from 'react';
import { X, Trash2, CornerDownLeft, Plus, Minus, Save, Eraser } from 'lucide-react';
import { formatResult } from '../utils/mathEngine.js';

const BANK_IDS = ['M', 'M1', 'M2', 'M3', 'M4', 'M5'];

export default function MemoryManager({ theme, banks, setBanks, onClose, onRecall, settings, feedback }) {
  const [entry, setEntry] = useState('');

  const val = Number(entry);
  const valid = entry.trim() !== '' && isFinite(val);

  const fmt = (v) =>
    formatResult(Number(v) || 0, {
      notation: settings.notation,
      precision: Math.min(settings.precision, 10),
      thousands: settings.thousands,
    });

  const setBank = (id, v) => setBanks((b) => ({ ...b, [id]: v }));

  const store = (id) => {
    if (!valid) return;
    feedback('equals');
    setBank(id, val);
  };
  const plus = (id) => { if (!valid) return; feedback('key'); setBanks((b) => ({ ...b, [id]: (Number(b[id]) || 0) + val })); };
  const minus = (id) => { if (!valid) return; feedback('key'); setBanks((b) => ({ ...b, [id]: (Number(b[id]) || 0) - val })); };
  const clearOne = (id) => { feedback('clear'); setBank(id, 0); };
  const clearAllBanks = () => { feedback('clear'); setBanks({ M: 0, M1: 0, M2: 0, M3: 0, M4: 0, M5: 0 }); };

  const usedCount = BANK_IDS.filter((id) => Number(banks[id]) !== 0).length;

  const MiniBtn = ({ children, onClick, disabled, tone }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1 active:scale-95 disabled:opacity-30 ${
        tone === 'danger' ? theme.clearKey : tone === 'accent' ? `${theme.accentBg} ${theme.accentText}` : `${theme.chipBg} ${theme.chipText}`
      }`}
      style={{ height: 28, borderRadius: 8, fontSize: 10, fontWeight: 700 }}
    >
      {children}
    </button>
  );

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end anim-fade" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <button className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} aria-label="close" />
      <div className={`relative anim-sheet ${theme.modalBg} flex flex-col`} style={{ maxHeight: '88%', borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
        <div className="flex justify-center shrink-0" style={{ paddingTop: 7 }}>
          <div className={`${theme.mutedText} opacity-40`} style={{ width: 36, height: 4, borderRadius: 4 }} />
        </div>

        <div className="shrink-0 flex items-center justify-between" style={{ padding: '10px 14px 8px' }}>
          <div className="min-w-0">
            <div className="font-semibold truncate" style={{ fontSize: 17 }}>Memory</div>
            <div className={`${theme.mutedText}`} style={{ fontSize: 11 }}>
              {usedCount} of {BANK_IDS.length} banks in use
            </div>
          </div>
          <div className="flex items-center shrink-0" style={{ gap: 4 }}>
            <button
              onClick={clearAllBanks}
              aria-label="Clear all banks"
              className={`${theme.chipBg} ${theme.chipText} flex items-center justify-center active:scale-90`}
              style={{ width: 32, height: 32, borderRadius: 10 }}
            >
              <Eraser size={15} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className={`${theme.chipBg} ${theme.mutedText} flex items-center justify-center active:scale-90`}
              style={{ width: 32, height: 32, borderRadius: 10 }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="shrink-0" style={{ padding: '0 14px 10px' }}>
          <span className={`${theme.mutedText} font-bold`} style={{ fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase' }}>
            Operand for MS / M+ / M−
          </span>
          <input
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            inputMode="decimal"
            placeholder="Enter a number…"
            className={`w-full border outline-none ${theme.inputBg}`}
            style={{ borderRadius: 10, padding: '10px 12px', fontSize: 15, fontVariantNumeric: 'tabular-nums', marginTop: 5 }}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scroll" style={{ padding: '0 14px 16px' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            {BANK_IDS.map((id) => {
              const active = Number(banks[id]) !== 0;
              return (
                <div key={id} className={`${theme.panelBg}`} style={{ borderRadius: 12, padding: 9 }}>
                  <div className="flex items-center justify-between" style={{ gap: 8 }}>
                    <div className="flex items-center min-w-0" style={{ gap: 7 }}>
                      <span
                        className={`${active ? theme.badgeMem : `${theme.chipBg} ${theme.mutedText}`} font-extrabold`}
                        style={{ fontSize: 10, padding: '3px 7px', borderRadius: 6 }}
                      >
                        {id}
                      </span>
                      <span className={`${theme.mutedText} truncate`} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {id === 'M' ? 'Primary' : `Bank ${id.slice(1)}`}
                      </span>
                    </div>
                    <span className={`font-semibold shrink-0 ${active ? theme.accent : theme.mutedText}`} style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(banks[id])}
                    </span>
                  </div>
                  <div className="grid grid-cols-5" style={{ gap: 4, marginTop: 8 }}>
                    <MiniBtn onClick={() => store(id)} disabled={!valid}><Save size={11} />MS</MiniBtn>
                    <MiniBtn onClick={() => plus(id)} disabled={!valid}><Plus size={11} />M+</MiniBtn>
                    <MiniBtn onClick={() => minus(id)} disabled={!valid}><Minus size={11} />M−</MiniBtn>
                    <MiniBtn onClick={() => { feedback('key'); onRecall(banks[id]); }}><CornerDownLeft size={11} />MR</MiniBtn>
                    <MiniBtn onClick={() => clearOne(id)} tone="danger"><Trash2 size={11} /></MiniBtn>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
