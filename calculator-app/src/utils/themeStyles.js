/* =====================================================================
 * themeStyles.js — Minimal, iOS-inspired theme profiles.
 *
 * The app used to be skinned like a physical Casio: a raised LCD frame
 * with scanlines, beveled keycaps and rainbow accents. Every token below
 * now describes a FLAT surface so the UI can read as one clean system:
 *
 *   appBg        page background
 *   panelBg      card / inset surface
 *   panelAlt     secondary surface (chips, function keys)
 *   numKey       digit keys
 *   funcKey      function keys (AC, %, ±, …)
 *   opKey        operator keys
 *   equalKey     the "=" key
 *   accent       one accent colour used for operators, active state and
 *                the live result — mirroring the iOS calculator.
 *
 * `lcd*` names are kept for backwards compatibility with older call
 * sites but now describe a frameless display.
 * ===================================================================== */

export const THEME_PROFILES = {
  /* ---------------------------------------------------------------
   * 1. Midnight — iOS dark. Pure black page, orange operators.
   * ------------------------------------------------------------- */
  dark: {
    id: 'dark',
    name: 'Midnight',

    appBg: 'bg-[#000000] glass-dark accent-amber',
    headerBg: 'bg-[#000000]',
    panelBg: 'bg-[#1c1c1e]',
    panelAlt: 'bg-[#2c2c2e]',
    panelBorder: 'border-[#3a3a3c]',
    bodyText: 'text-[#ffffff]',
    mutedText: 'text-[#8e8e93]',
    statusBarText: 'text-[#8e8e93]',

    /* Frameless display */
    lcdBg: 'bg-transparent',
    lcdBorder: 'border-transparent',
    lcdGlow: 'bg-transparent',
    lcdHeader: 'text-[#8e8e93]',
    lcdFormula: 'text-[#c7c7cc]',
    lcdPreview: 'text-[#8e8e93]',
    lcdResult: 'text-[#ff9f0a]',
    lcdChip: 'bg-[#2c2c2e] text-[#ffffff] border-[#3a3a3c]',
    lcdInset: 'bg-[#2c2c2e]',
    lcdInsetText: 'text-[#ffffff]',

    badge2nd: 'bg-[#ff9f0a] text-black border-[#ff9f0a]',
    badgeHyp: 'bg-[#5e5ce6] text-white border-[#5e5ce6]',
    badgeMem: 'bg-[#ff375f] text-white border-[#ff375f]',

    /* Keys */
    funcKey: 'bg-white/[0.10] text-[#ffffff] glass',
    sciKey: 'bg-white/[0.15] text-[#ffffff] glass glass-sci',
    funcAltLabel: 'text-[#ff9f0a]',
    numKey: 'bg-white/[0.05] text-[#ffffff] glass',
    opKey: 'bg-[#ff9f0a] text-black glass glass-accent',
    clearKey: 'bg-white/[0.13] text-[#ff9f0a] glass',
    ceKey: 'bg-white/[0.13] text-[#ffffff] glass',
    equalKey: 'bg-[#ff9f0a] text-black glass glass-accent',

    /* Chips / tabs / segments */
    chipBg: 'bg-[#2c2c2e]',
    chipText: 'text-[#ffffff]',
    tabActive: 'bg-[#ff9f0a] text-black',
    tabInactive: 'text-[#8e8e93]',
    segActive: 'bg-[#ff9f0a] text-black',
    segInactive: 'bg-[#2c2c2e] text-[#8e8e93]',

    accent: 'text-[#ff9f0a]',
    accentBg: 'bg-[#ff9f0a]',
    accentText: 'text-black',
    accentRing: 'ring-[#ff9f0a]/40',
    accentSoft: 'bg-[#ff9f0a]/10 border-[#ff9f0a]/25',
    accentBorder: 'border-[#ff9f0a]/30',

    modalBg: 'bg-[#1c1c1e]',
    modalBorder: 'border-[#3a3a3c]',
    inputBg: 'bg-[#2c2c2e] border-[#3a3a3c] text-[#ffffff]',
    lcdIsLight: false,
  },

  /* ---------------------------------------------------------------
   * 2. Slate — cool graphite with an iOS-blue accent.
   * ------------------------------------------------------------- */
  casio: {
    id: 'casio',
    name: 'Slate',

    appBg: 'bg-[#0f1219] glass-dark accent-blue',
    headerBg: 'bg-[#0f1219]',
    panelBg: 'bg-[#181d27]',
    panelAlt: 'bg-[#232a37]',
    panelBorder: 'border-[#2d3646]',
    bodyText: 'text-[#f3f6fb]',
    mutedText: 'text-[#8d97a8]',
    statusBarText: 'text-[#8d97a8]',

    lcdBg: 'bg-transparent',
    lcdBorder: 'border-transparent',
    lcdGlow: 'bg-transparent',
    lcdHeader: 'text-[#8d97a8]',
    lcdFormula: 'text-[#c2cbd9]',
    lcdPreview: 'text-[#8d97a8]',
    lcdResult: 'text-[#0a84ff]',
    lcdChip: 'bg-[#232a37] text-[#f3f6fb] border-[#2d3646]',
    lcdInset: 'bg-[#232a37]',
    lcdInsetText: 'text-[#f3f6fb]',

    badge2nd: 'bg-[#0a84ff] text-white border-[#0a84ff]',
    badgeHyp: 'bg-[#5e5ce6] text-white border-[#5e5ce6]',
    badgeMem: 'bg-[#ff375f] text-white border-[#ff375f]',

    funcKey: 'bg-white/[0.09] text-[#f3f6fb] glass',
    sciKey: 'bg-white/[0.14] text-[#f3f6fb] glass glass-sci',
    funcAltLabel: 'text-[#0a84ff]',
    numKey: 'bg-white/[0.05] text-[#f3f6fb] glass',
    opKey: 'bg-[#0a84ff] text-white glass glass-accent',
    clearKey: 'bg-white/[0.12] text-[#0a84ff] glass',
    ceKey: 'bg-white/[0.12] text-[#f3f6fb] glass',
    equalKey: 'bg-[#0a84ff] text-white glass glass-accent',

    chipBg: 'bg-[#232a37]',
    chipText: 'text-[#f3f6fb]',
    tabActive: 'bg-[#0a84ff] text-white',
    tabInactive: 'text-[#8d97a8]',
    segActive: 'bg-[#0a84ff] text-white',
    segInactive: 'bg-[#232a37] text-[#8d97a8]',

    accent: 'text-[#0a84ff]',
    accentBg: 'bg-[#0a84ff]',
    accentText: 'text-white',
    accentRing: 'ring-[#0a84ff]/40',
    accentSoft: 'bg-[#0a84ff]/10 border-[#0a84ff]/25',
    accentBorder: 'border-[#0a84ff]/30',

    modalBg: 'bg-[#181d27]',
    modalBorder: 'border-[#2d3646]',
    inputBg: 'bg-[#232a37] border-[#2d3646] text-[#f3f6fb]',
    lcdIsLight: false,
  },

  /* ---------------------------------------------------------------
   * 3. Neon — OLED black with an electric cyan accent.
   * ------------------------------------------------------------- */
  neon: {
    id: 'neon',
    name: 'Neon OLED',

    appBg: 'bg-[#04060c] glass-dark accent-cyan',
    headerBg: 'bg-[#04060c]',
    panelBg: 'bg-[#0a0f1c]',
    panelAlt: 'bg-[#141c30]',
    panelBorder: 'border-[#1e2942]',
    bodyText: 'text-[#e2ecff]',
    mutedText: 'text-[#6b7c9c]',
    statusBarText: 'text-[#6b7c9c]',

    lcdBg: 'bg-transparent',
    lcdBorder: 'border-transparent',
    lcdGlow: 'bg-transparent',
    lcdHeader: 'text-[#6b7c9c]',
    lcdFormula: 'text-[#b8c8e4]',
    lcdPreview: 'text-[#6b7c9c]',
    lcdResult: 'text-[#22d3ee]',
    lcdChip: 'bg-[#141c30] text-[#e2ecff] border-[#1e2942]',
    lcdInset: 'bg-[#141c30]',
    lcdInsetText: 'text-[#e2ecff]',

    badge2nd: 'bg-[#22d3ee] text-black border-[#22d3ee]',
    badgeHyp: 'bg-[#a855f7] text-white border-[#a855f7]',
    badgeMem: 'bg-[#f43f5e] text-white border-[#f43f5e]',

    funcKey: 'bg-white/[0.09] text-[#e2ecff] glass',
    sciKey: 'bg-white/[0.14] text-[#e2ecff] glass glass-sci',
    funcAltLabel: 'text-[#22d3ee]',
    numKey: 'bg-white/[0.05] text-[#e2ecff] glass',
    opKey: 'bg-[#22d3ee] text-black glass glass-accent',
    clearKey: 'bg-white/[0.12] text-[#22d3ee] glass',
    ceKey: 'bg-white/[0.12] text-[#e2ecff] glass',
    equalKey: 'bg-[#22d3ee] text-black glass glass-accent',

    chipBg: 'bg-[#141c30]',
    chipText: 'text-[#e2ecff]',
    tabActive: 'bg-[#22d3ee] text-black',
    tabInactive: 'text-[#6b7c9c]',
    segActive: 'bg-[#22d3ee] text-black',
    segInactive: 'bg-[#141c30] text-[#6b7c9c]',

    accent: 'text-[#22d3ee]',
    accentBg: 'bg-[#22d3ee]',
    accentText: 'text-black',
    accentRing: 'ring-[#22d3ee]/40',
    accentSoft: 'bg-[#22d3ee]/10 border-[#22d3ee]/25',
    accentBorder: 'border-[#22d3ee]/30',

    modalBg: 'bg-[#0a0f1c]',
    modalBorder: 'border-[#1e2942]',
    inputBg: 'bg-[#141c30] border-[#1e2942] text-[#e2ecff]',
    lcdIsLight: false,
  },

  /* ---------------------------------------------------------------
   * 4. Terminal — deep green, monospace-friendly.
   * ------------------------------------------------------------- */
  retro: {
    id: 'retro',
    name: 'Terminal',

    appBg: 'bg-[#030b06] glass-dark accent-green',
    headerBg: 'bg-[#030b06]',
    panelBg: 'bg-[#07150c]',
    panelAlt: 'bg-[#0d2213]',
    panelBorder: 'border-[#14361f]',
    bodyText: 'text-[#d7ffe4]',
    mutedText: 'text-[#5f8f72]',
    statusBarText: 'text-[#5f8f72]',

    lcdBg: 'bg-transparent',
    lcdBorder: 'border-transparent',
    lcdGlow: 'bg-transparent',
    lcdHeader: 'text-[#5f8f72]',
    lcdFormula: 'text-[#9de7b4]',
    lcdPreview: 'text-[#5f8f72]',
    lcdResult: 'text-[#4ade80]',
    lcdChip: 'bg-[#0d2213] text-[#9de7b4] border-[#14361f]',
    lcdInset: 'bg-[#0d2213]',
    lcdInsetText: 'text-[#d7ffe4]',

    badge2nd: 'bg-[#facc15] text-black border-[#facc15]',
    badgeHyp: 'bg-[#22c55e] text-black border-[#22c55e]',
    badgeMem: 'bg-[#a3e635] text-black border-[#a3e635]',

    funcKey: 'bg-white/[0.08] text-[#d7ffe4] glass',
    sciKey: 'bg-white/[0.13] text-[#d7ffe4] glass glass-sci',
    funcAltLabel: 'text-[#facc15]',
    numKey: 'bg-white/[0.04] text-[#d7ffe4] glass',
    opKey: 'bg-[#4ade80] text-black glass glass-accent',
    clearKey: 'bg-white/[0.11] text-[#4ade80] glass',
    ceKey: 'bg-white/[0.11] text-[#d7ffe4] glass',
    equalKey: 'bg-[#4ade80] text-black glass glass-accent',

    chipBg: 'bg-[#0d2213]',
    chipText: 'text-[#d7ffe4]',
    tabActive: 'bg-[#4ade80] text-black',
    tabInactive: 'text-[#5f8f72]',
    segActive: 'bg-[#4ade80] text-black',
    segInactive: 'bg-[#0d2213] text-[#5f8f72]',

    accent: 'text-[#4ade80]',
    accentBg: 'bg-[#4ade80]',
    accentText: 'text-black',
    accentRing: 'ring-[#4ade80]/40',
    accentSoft: 'bg-[#4ade80]/10 border-[#4ade80]/25',
    accentBorder: 'border-[#4ade80]/30',

    modalBg: 'bg-[#07150c]',
    modalBorder: 'border-[#14361f]',
    inputBg: 'bg-[#0d2213] border-[#14361f] text-[#d7ffe4]',
    lcdIsLight: false,
  },

  /* ---------------------------------------------------------------
   * 5. Daylight — iOS light.
   * ------------------------------------------------------------- */
  light: {
    id: 'light',
    name: 'Daylight',

    appBg: 'bg-[#f2f2f7] glass-light accent-tangerine',
    headerBg: 'bg-[#f2f2f7]',
    panelBg: 'bg-[#ffffff]',
    panelAlt: 'bg-[#e7e7ec]',
    panelBorder: 'border-[#dcdce3]',
    bodyText: 'text-[#000000]',
    mutedText: 'text-[#8a8a8e]',
    statusBarText: 'text-[#8a8a8e]',

    lcdBg: 'bg-transparent',
    lcdBorder: 'border-transparent',
    lcdGlow: 'bg-transparent',
    lcdHeader: 'text-[#8a8a8e]',
    lcdFormula: 'text-[#3a3a3c]',
    lcdPreview: 'text-[#8a8a8e]',
    lcdResult: 'text-[#ff9500]',
    lcdChip: 'bg-[#e7e7ec] text-[#1c1c1e] border-[#dcdce3]',
    lcdInset: 'bg-[#e7e7ec]',
    lcdInsetText: 'text-[#1c1c1e]',

    badge2nd: 'bg-[#ff9500] text-white border-[#ff9500]',
    badgeHyp: 'bg-[#5856d6] text-white border-[#5856d6]',
    badgeMem: 'bg-[#ff2d55] text-white border-[#ff2d55]',

    funcKey: 'bg-black/[0.06] text-[#000000] glass',
    sciKey: 'bg-white/[0.75] text-[#000000] glass glass-sci',
    funcAltLabel: 'text-[#ff9500]',
    numKey: 'bg-white/[0.82] text-[#000000] glass',
    opKey: 'bg-[#ff9500] text-white glass glass-accent',
    clearKey: 'bg-black/[0.09] text-[#ff9500] glass',
    ceKey: 'bg-black/[0.09] text-[#000000] glass',
    equalKey: 'bg-[#ff9500] text-white glass glass-accent',

    chipBg: 'bg-[#e7e7ec]',
    chipText: 'text-[#1c1c1e]',
    tabActive: 'bg-[#ff9500] text-white',
    tabInactive: 'text-[#8a8a8e]',
    segActive: 'bg-[#ff9500] text-white',
    segInactive: 'bg-[#e7e7ec] text-[#8a8a8e]',

    accent: 'text-[#ff9500]',
    accentBg: 'bg-[#ff9500]',
    accentText: 'text-white',
    accentRing: 'ring-[#ff9500]/40',
    accentSoft: 'bg-[#ff9500]/10 border-[#ff9500]/25',
    accentBorder: 'border-[#ff9500]/30',

    modalBg: 'bg-[#ffffff]',
    modalBorder: 'border-[#dcdce3]',
    inputBg: 'bg-[#f2f2f7] border-[#dcdce3] text-[#000000]',
    lcdIsLight: true,
  },
};

export const THEME_LIST = Object.values(THEME_PROFILES);
export const DEFAULT_THEME = 'dark';

export function getTheme(id) {
  return THEME_PROFILES[id] || THEME_PROFILES[DEFAULT_THEME];
}

/** Flat keycap geometry — no bevel, no bottom border. */
export const KEY_BASE =
  'select-none flex flex-col items-center justify-center relative overflow-hidden ' +
  'transition-[transform,background-color,opacity,filter,box-shadow] duration-100 ' +
  'font-medium leading-none outline-none focus-visible:ring-2';

export const TAB_BASE =
  'flex items-center justify-center gap-1 font-semibold transition-all duration-150 ' +
  'active:scale-95 whitespace-nowrap';
