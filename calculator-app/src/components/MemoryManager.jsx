import React, { useState } from 'react';
import { X, Trash2, CornerDownLeft, Plus, Minus, Save, Eraser } from 'lucide-react';
import { formatResult } from '../utils/mathEngine.js';
import { KEY_BASE } from '../utils/themeStyles.js';

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

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end anim-fade" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <button className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} aria-label="close" />
      <div className={`relative anim-sheet rounded-t-2xl border-t-2 ${theme.modalBorder} ${theme.modalBg} flex flex-col`} style={{ maxHeight: '86%' }}>
        <div className={`shrink-0 flex items-center justify-between px-3 py-2 border-b ${theme.panelBorder}`}>
          <div>
            <div className="text-[13px] font-extrabold">Memory Banks</div>
            <div className={`text-[9px] uppercase tracking-widest ${theme.mutedText}`}>{usedCount} of 6 in use</div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearAllBanks} className={`${KEY_BASE} ${theme.clearKey} h-7 px-2 text-[10px] flex-row gap-1`}>
              <Eraser size={12} /> All
            </button>
            <button onClick={onClose} className={`${KEY_BASE} ${theme.funcKey} h-7 w-7`}><X size={14} /></button>
          </div>
        </div>

        <div className="shrink-0 px-3 py-2">
          <span className={`text-[9px] font-bold uppercase tracking-wider ${theme.mutedText}`}>Operand for MS / M+ / M−</span>
          <input
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            inputMode="decimal"
            placeholder="Enter a number…"
            className={`w-full mt-0.5 rounded-lg border px-2 py-2 text-[15px] tabular-nums ${theme.inputBg} outline-none focus:ring-2 ${theme.accentRing}`}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scroll px-3 pb-3 space-y-1.5">
          {BANK_IDS.map((id) => {
            const active = Number(banks[id]) !== 0;
            return (
              <div key={id} className={`rounded-xl border ${active ? theme.accentRing + ' ' + theme.panelBorder : theme.panelBorder} ${theme.panelBg} p-2`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-extrabold ${active ? theme.badgeMem : `${theme.panelBorder} ${theme.mutedText}`}`}>
                      {id}
                    </span>
                    <span className={`text-[9px] uppercase tracking-widest ${theme.mutedText}`}>
                      {id === 'M' ? 'Primary' : `Bank ${id.slice(1)}`}
                    </span>
                  </div>
                  <span className={`text-[16px] tabular-nums font-bold ${active ? theme.accent : theme.mutedText}`}>{fmt(banks[id])}</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  <button onClick={() => store(id)} disabled={!valid} className={`${KEY_BASE} ${theme.funcKey} py-1.5 text-[9px] disabled:opacity-30 flex-row gap-0.5`}>
                    <Save size={11} />MS
                  </button>
                  <button onClick={() => plus(id)} disabled={!valid} className={`${KEY_BASE} ${theme.funcKey} py-1.5 text-[9px] disabled:opacity-30 flex-row gap-0.5`}>
                    <Plus size={11} />M+
                  </button>
                  <button onClick={() => minus(id)} disabled={!valid} className={`${KEY_BASE} ${theme.funcKey} py-1.5 text-[9px] disabled:opacity-30 flex-row gap-0.5`}>
                    <Minus size={11} />M−
                  </button>
                  <button onClick={() => { feedback('key'); onRecall(banks[id]); }} className={`${KEY_BASE} ${theme.equalKey} py-1.5 text-[9px] flex-row gap-0.5`}>
                    <CornerDownLeft size={11} />MR
                  </button>
                  <button onClick={() => clearOne(id)} className={`${KEY_BASE} ${theme.clearKey} py-1.5 text-[9px]`}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
