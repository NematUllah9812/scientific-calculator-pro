/* =====================================================================
 * useKeyboard.js — Hardware-keyboard support for the calculators.
 *
 * Two problems this solves:
 *  1. Typing inside a text field (History search, memory entry, stats
 *     dataset, date fields…) used to leak into the calculator keypad.
 *  2. Every mode is mounted at once, so a global listener would feed
 *     the same keystroke into all six calculators.
 * ===================================================================== */

import { useEffect, useRef } from 'react';

/** True when the event target is a text-entry surface. */
export function isEditableTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable === true
  );
}

/**
 * Attach a window-level keydown handler while `active` is true.
 * The handler receives the raw KeyboardEvent.
 */
export function useHardwareKeyboard(active, handler) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (isEditableTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      ref.current(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}
