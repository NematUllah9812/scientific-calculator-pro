import React, { useState, useMemo } from 'react';
import { X, Trash2, CornerDownLeft, Copy, Check, Search, Download } from 'lucide-react';

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
    <div className="absolute inset-0 z-50 flex flex-col justify-end anim-fade" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <button className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} aria-label="close" />
      <div className={`relative anim-sheet ${theme.modalBg} flex flex-col`} style={{ maxHeight: '88%', borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
        {/* grabber */}
        <div className="flex justify-center shrink-0" style={{ paddingTop: 7 }}>
          <div className={`${theme.mutedText} opacity-40`} style={{ width: 36, height: 4, borderRadius: 4 }} />
        </div>

        <div className="shrink-0 flex items-center justify-between" style={{ padding: '10px 14px 8px' }}>
          <div className="min-w-0">
            <div className="font-semibold truncate" style={{ fontSize: 17 }}>History</div>
            <div className={`${theme.mutedText}`} style={{ fontSize: 11 }}>
              {history.length} {history.length === 1 ? 'entry' : 'entries'} · max 200
            </div>
          </div>
          <div className="flex items-center shrink-0" style={{ gap: 4 }}>
            <button
              onClick={exportTxt}
              aria-label="Export history"
              className={`${theme.chipBg} ${theme.chipText} flex items-center justify-center active:scale-90`}
              style={{ width: 32, height: 32, borderRadius: 10 }}
            >
              <Download size={15} />
            </button>
            <button
              onClick={() => {
                feedback(confirmClear ? 'clear' : 'toggle');
                if (confirmClear) { onClear(); setConfirmClear(false); } else setConfirmClear(true);
              }}
              className={`${confirmClear ? theme.clearKey : `${theme.chipBg} ${theme.chipText}`} flex items-center justify-center active:scale-90`}
              style={{ width: 32, height: 32, borderRadius: 10 }}
              title="Clear history"
            >
              <Trash2 size={15} className={confirmClear ? '' : 'text-rose-400'} />
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
          <div className="relative">
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.mutedText}`} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search expressions or results…"
              className={`w-full border outline-none ${theme.inputBg}`}
              style={{ borderRadius: 10, padding: '9px 10px 9px 32px', fontSize: 13 }}
            />
          </div>
          {confirmClear && (
            <div className={`${theme.mutedText} text-center`} style={{ fontSize: 11, marginTop: 6 }}>
              Tap the bin again to erase everything
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scroll" style={{ padding: '0 14px 16px' }}>
          {filtered.length === 0 && (
            <div className={`${theme.mutedText} text-center`} style={{ fontSize: 12, padding: '28px 0' }}>
              {history.length === 0 ? 'No calculations yet.' : 'No matches.'}
            </div>
          )}
          <div style={{ display: 'grid', gap: 6 }}>
            {filtered.map((h) => (
              <div key={h.id} className={`${theme.panelBg}`} style={{ borderRadius: 12, padding: '8px 10px' }}>
                <div className="flex items-center justify-between" style={{ gap: 8 }}>
                  <span className={`${theme.accent} font-bold truncate`} style={{ fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' }}>{h.mode}</span>
                  <span className={`${theme.mutedText} shrink-0`} style={{ fontSize: 10 }}>{timeAgo(h.time)}</span>
                </div>
                <div className={`${theme.mutedText} break-all`} style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                  {h.expression}
                </div>
                <div className="flex items-end justify-between" style={{ gap: 8 }}>
                  <div className="font-semibold break-all" style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>
                    = {h.result}
                  </div>
                  <div className="flex shrink-0" style={{ gap: 4 }}>
                    <button
                      onClick={() => copy(h)}
                      aria-label="Copy entry"
                      className={`${theme.chipBg} ${theme.mutedText} flex items-center justify-center active:scale-90`}
                      style={{ width: 26, height: 26, borderRadius: 8 }}
                    >
                      {copiedId === h.id ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                    <button
                      onClick={() => { feedback('key'); onRecall(h.result); }}
                      aria-label="Use this result"
                      className={`${theme.accentBg} ${theme.accentText} flex items-center justify-center active:scale-90`}
                      style={{ width: 26, height: 26, borderRadius: 8 }}
                    >
                      <CornerDownLeft size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
