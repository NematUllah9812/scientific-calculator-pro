import React, { useState, useMemo } from 'react';
import { X, Trash2, CornerDownLeft, Copy, Check, Search, Download } from 'lucide-react';
import { KEY_BASE } from '../utils/themeStyles.js';

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function HistoryTape({ theme, history, onClose, onClear, onRecall, feedback }) {
  const [q, setQ] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return history;
    return history.filter(
      (h) =>
        String(h.expression).toLowerCase().includes(needle) ||
        String(h.result).toLowerCase().includes(needle) ||
        String(h.mode || '').toLowerCase().includes(needle),
    );
  }, [history, q]);

  const copy = async (item) => {
    feedback('toggle');
    try {
      await navigator.clipboard.writeText(`${item.expression} = ${item.result}`);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch { /* noop */ }
  };

  const exportTxt = () => {
    feedback('toggle');
    const text = history
      .map((h) => `[${new Date(h.time).toLocaleString()}] (${h.mode}) ${h.expression} = ${h.result}`)
      .join('\n');
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'calculator-history.txt';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch { /* noop */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end anim-fade" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <button className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} aria-label="close" />
      <div className={`relative anim-sheet rounded-t-2xl border-t-2 ${theme.modalBorder} ${theme.modalBg} flex flex-col`} style={{ maxHeight: '86%' }}>
        <div className={`shrink-0 flex items-center justify-between px-3 py-2 border-b ${theme.panelBorder}`}>
          <div>
            <div className="text-[13px] font-extrabold">History Tape</div>
            <div className={`text-[9px] uppercase tracking-widest ${theme.mutedText}`}>{history.length} entries · max 200</div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={exportTxt} className={`${KEY_BASE} ${theme.funcKey} h-7 w-7`} title="Export"><Download size={13} /></button>
            <button
              onClick={() => {
                feedback(confirmClear ? 'clear' : 'toggle');
                if (confirmClear) { onClear(); setConfirmClear(false); } else setConfirmClear(true);
              }}
              className={`${KEY_BASE} ${confirmClear ? theme.clearKey : theme.funcKey} h-7 px-2 text-[10px] flex-row gap-1`}
            >
              <Trash2 size={13} />{confirmClear ? 'Sure?' : ''}
            </button>
            <button onClick={onClose} className={`${KEY_BASE} ${theme.funcKey} h-7 w-7`}><X size={14} /></button>
          </div>
        </div>

        <div className="shrink-0 px-3 py-2">
          <div className="relative">
            <Search size={13} className={`absolute left-2 top-1/2 -translate-y-1/2 ${theme.mutedText}`} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search expressions or results…"
              className={`w-full rounded-lg border pl-7 pr-2 py-1.5 text-[12px] ${theme.inputBg} outline-none focus:ring-2 ${theme.accentRing}`}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scroll px-3 pb-3 space-y-1">
          {filtered.length === 0 && (
            <div className={`text-center text-[11px] ${theme.mutedText} py-10`}>
              {history.length === 0 ? 'No calculations yet.' : 'No matches.'}
            </div>
          )}
          {filtered.map((h) => (
            <div key={h.id} className={`rounded-lg border ${theme.panelBorder} ${theme.panelBg} px-2 py-1.5`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-[8px] font-bold uppercase tracking-widest ${theme.accent}`}>{h.mode}</span>
                <span className={`text-[8px] ${theme.mutedText}`}>{timeAgo(h.time)}</span>
              </div>
              <div className={`text-[11px] tabular-nums break-all ${theme.mutedText}`}>{h.expression}</div>
              <div className="flex items-end justify-between gap-2">
                <div className="text-[15px] tabular-nums font-bold break-all">= {h.result}</div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => copy(h)} className={`${KEY_BASE} ${theme.funcKey} h-6 w-6`}>
                    {copiedId === h.id ? <Check size={11} /> : <Copy size={11} />}
                  </button>
                  <button onClick={() => { feedback('key'); onRecall(h.result); }} className={`${KEY_BASE} ${theme.equalKey} h-6 w-6`}>
                    <CornerDownLeft size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
