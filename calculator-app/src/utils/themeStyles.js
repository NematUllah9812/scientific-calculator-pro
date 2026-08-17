/* =====================================================================
 * themeStyles.js — 5 visual theme profiles. Default: casio
 *
 * v4 redesign: keys are FLAT (no bevel / no bottom border). Colours were
 * sampled directly from the reference screenshots, so the `casio` theme
 * reproduces them exactly. Every other theme re-skins the same tokens,
 * so all six tabs stay visually consistent within a theme.
 * ===================================================================== */

export const THEME_PROFILES = {
  /* ---------------------------------------------------------------
   * 1. Classic Casio FX  (sampled from reference screenshots)
   * ------------------------------------------------------------- */
  casio: {
    id: 'casio',
    name: 'Casio FX Classic',

    appBg: 'bg-[#2a3141]',
    headerBg: 'bg-[#1e2633]',
    frameBorder: 'border-[#161d27]',
    panelBg: 'bg-[#1c1d22]',
    panelBorder: 'border-[#333a49]',
    statusBarText: 'text-slate-300',
    mutedText: 'text-slate-400',
    bodyText: 'text-slate-100',

    /* LCD — pale sage green */
    lcdBg: 'bg-[#8fa38a]',
    lcdBorder: 'border-[#6b7d67]',
    lcdGlow: 'bg-[#a4b89f]/15',
    lcdHeader: 'text-[#26331f]',
    lcdFormula: 'text-[#16210f]',
    lcdPreview: 'text-[#2f4227]',
    lcdResult: 'text-[#0d1408]',
    lcdChip: 'bg-[#637160] text-[#e8f0e4] border-[#4d5a4b]',
    lcdInset: 'bg-[#3a4536]',
    lcdInsetText: 'text-[#9fe3b0]',

    badge2nd: 'bg-[#d97706] text-black border-[#b45309]',
    badgeHyp: 'bg-[#0384c6] text-white border-[#036aa0]',
    badgeMem: 'bg-[#7c3aed] text-white border-[#6d28d9]',

    /* Keys — flat */
    funcKey: 'bg-[#3b4658] active:bg-[#48546a] text-slate-100',
    funcAltLabel: 'text-[#f0a13a]',
    numKey: 'bg-[#465568] active:bg-[#526279] text-white',
    opKey: 'bg-[#0384c6] active:bg-[#0470a8] text-white',
    clearKey: 'bg-[#dc2625] active:bg-[#b91c1c] text-white',
    ceKey: 'bg-[#d87706] active:bg-[#b45309] text-white',
    equalKey: 'bg-[#ea580b] active:bg-[#c2410c] text-white',

    /* Chips / tabs */
    chipBg: 'bg-[#28292e]',
    chipText: 'text-slate-200',
    tabActive: 'bg-[#0384c6] text-white',
    tabInactive: 'text-slate-400',
    segActive: 'bg-[#0384c6] text-white',
    segInactive: 'bg-[#242b38] text-slate-400',

    accent: 'text-[#2dd4a7]',
    accentBg: 'bg-[#10b981]',
    accentRing: 'ring-[#0384c6]/50',
    accentSoft: 'bg-[#12312c] border-[#1f5145]',

    modalBg: 'bg-[#232b39]',
    modalBorder: 'border-[#3b4759]',
    inputBg: 'bg-[#151a23] border-[#3b4759] text-slate-100',
    lcdIsLight: true,
  },

  /* ---------------------------------------------------------------
   * 2. Dark Obsidian
   * ------------------------------------------------------------- */
  dark: {
    id: 'dark',
    name: 'Dark Obsidian',

    appBg: 'bg-[#0b0b0d]',
    headerBg: 'bg-[#000000]',
    frameBorder: 'border-[#232326]',
    panelBg: 'bg-[#161619]',
    panelBorder: 'border-[#2b2b30]',
    statusBarText: 'text-zinc-400',
    mutedText: 'text-zinc-500',
    bodyText: 'text-zinc-100',

    lcdBg: 'bg-[#050506]',
    lcdBorder: 'border-[#1f3a30]',
    lcdGlow: 'bg-emerald-500/5',
    lcdHeader: 'text-emerald-400/80',
    lcdFormula: 'text-zinc-300',
    lcdPreview: 'text-emerald-400/60',
    lcdResult: 'text-emerald-400',
    lcdChip: 'bg-[#14261f] text-emerald-300 border-[#1f3a30]',
    lcdInset: 'bg-[#101d17]',
    lcdInsetText: 'text-emerald-300',

    badge2nd: 'bg-amber-500 text-black border-amber-600',
    badgeHyp: 'bg-sky-600 text-white border-sky-700',
    badgeMem: 'bg-violet-600 text-white border-violet-700',

    funcKey: 'bg-[#1e1e22] active:bg-[#2a2a30] text-zinc-200',
    funcAltLabel: 'text-amber-400/90',
    numKey: 'bg-[#2a2a30] active:bg-[#35353d] text-white',
    opKey: 'bg-[#047857] active:bg-[#059669] text-white',
    clearKey: 'bg-[#7f1d1d] active:bg-[#991b1b] text-rose-100',
    ceKey: 'bg-[#78350f] active:bg-[#92400e] text-amber-100',
    equalKey: 'bg-[#059669] active:bg-[#047857] text-white',

    chipBg: 'bg-[#1a1a1e]',
    chipText: 'text-zinc-300',
    tabActive: 'bg-[#059669] text-white',
    tabInactive: 'text-zinc-500',
    segActive: 'bg-[#059669] text-white',
    segInactive: 'bg-[#161619] text-zinc-500',

    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-600',
    accentRing: 'ring-emerald-500/50',
    accentSoft: 'bg-[#0d2620] border-[#17453a]',

    modalBg: 'bg-[#161619]',
    modalBorder: 'border-[#2b2b30]',
    inputBg: 'bg-[#0b0b0d] border-[#2b2b30] text-zinc-100',
    lcdIsLight: false,
  },

  /* ---------------------------------------------------------------
   * 3. Cyber Neon OLED
   * ------------------------------------------------------------- */
  neon: {
    id: 'neon',
    name: 'Cyber Neon OLED',

    appBg: 'bg-[#000000]',
    headerBg: 'bg-[#000000]',
    frameBorder: 'border-[#0d2b33]',
    panelBg: 'bg-[#05080f]',
    panelBorder: 'border-[#0e3a44]',
    statusBarText: 'text-cyan-400',
    mutedText: 'text-cyan-700',
    bodyText: 'text-cyan-100',

    lcdBg: 'bg-[#00060a]',
    lcdBorder: 'border-[#0e7490]',
    lcdGlow: 'bg-cyan-500/10',
    lcdHeader: 'text-cyan-400',
    lcdFormula: 'text-cyan-200',
    lcdPreview: 'text-fuchsia-400/80',
    lcdResult: 'text-cyan-300',
    lcdChip: 'bg-[#062b33] text-cyan-300 border-[#0e7490]',
    lcdInset: 'bg-[#04212a]',
    lcdInsetText: 'text-cyan-300',

    badge2nd: 'bg-fuchsia-500 text-black border-fuchsia-400',
    badgeHyp: 'bg-cyan-500 text-black border-cyan-400',
    badgeMem: 'bg-violet-500 text-black border-violet-400',

    funcKey: 'bg-[#0a1420] active:bg-[#112034] text-cyan-300',
    funcAltLabel: 'text-fuchsia-400',
    numKey: 'bg-[#101c2e] active:bg-[#18293f] text-white',
    opKey: 'bg-[#0891b2] active:bg-[#06b6d4] text-black',
    clearKey: 'bg-[#9f1239] active:bg-[#be123c] text-white',
    ceKey: 'bg-[#a16207] active:bg-[#ca8a04] text-black',
    equalKey: 'bg-[#d946ef] active:bg-[#c026d3] text-black',

    chipBg: 'bg-[#08131c]',
    chipText: 'text-cyan-300',
    tabActive: 'bg-[#06b6d4] text-black',
    tabInactive: 'text-cyan-800',
    segActive: 'bg-[#06b6d4] text-black',
    segInactive: 'bg-[#05080f] text-cyan-800',

    accent: 'text-cyan-400',
    accentBg: 'bg-cyan-500',
    accentRing: 'ring-cyan-400/50',
    accentSoft: 'bg-[#04212b] border-[#0e7490]',

    modalBg: 'bg-[#05080f]',
    modalBorder: 'border-[#0e3a44]',
    inputBg: 'bg-black border-[#0e3a44] text-cyan-200',
    lcdIsLight: false,
  },

  /* ---------------------------------------------------------------
   * 4. Retro Matrix Green
   * ------------------------------------------------------------- */
  retro: {
    id: 'retro',
    name: 'Retro Matrix Green',

    appBg: 'bg-[#111a12]',
    headerBg: 'bg-[#0c130d]',
    frameBorder: 'border-[#1d2b20]',
    panelBg: 'bg-[#16211a]',
    panelBorder: 'border-[#27382a]',
    statusBarText: 'text-[#4ade80]',
    mutedText: 'text-[#4ade80]/60',
    bodyText: 'text-[#dcfce7]',

    lcdBg: 'bg-[#0b120c]',
    lcdBorder: 'border-[#22c55e]/40',
    lcdGlow: 'bg-[#22c55e]/10',
    lcdHeader: 'text-[#4ade80]',
    lcdFormula: 'text-[#86efac]',
    lcdPreview: 'text-[#22c55e]/70',
    lcdResult: 'text-[#4ade80]',
    lcdChip: 'bg-[#14301c] text-[#86efac] border-[#22c55e]/40',
    lcdInset: 'bg-[#12251a]',
    lcdInsetText: 'text-[#86efac]',

    badge2nd: 'bg-[#facc15] text-black border-[#eab308]',
    badgeHyp: 'bg-[#22c55e] text-black border-[#16a34a]',
    badgeMem: 'bg-[#a3e635] text-black border-[#84cc16]',

    funcKey: 'bg-[#1e2c21] active:bg-[#27382a] text-[#86efac]',
    funcAltLabel: 'text-[#facc15]',
    numKey: 'bg-[#27382a] active:bg-[#324635] text-[#eafff0]',
    opKey: 'bg-[#16a34a] active:bg-[#15803d] text-black',
    clearKey: 'bg-[#991b1b] active:bg-[#7f1d1d] text-[#fecaca]',
    ceKey: 'bg-[#854d0e] active:bg-[#713f12] text-[#fde047]',
    equalKey: 'bg-[#22c55e] active:bg-[#16a34a] text-black',

    chipBg: 'bg-[#16211a]',
    chipText: 'text-[#86efac]',
    tabActive: 'bg-[#22c55e] text-black',
    tabInactive: 'text-[#4ade80]/50',
    segActive: 'bg-[#22c55e] text-black',
    segInactive: 'bg-[#16211a] text-[#4ade80]/50',

    accent: 'text-[#4ade80]',
    accentBg: 'bg-[#22c55e]',
    accentRing: 'ring-[#22c55e]/50',
    accentSoft: 'bg-[#0f2415] border-[#22c55e]/40',

    modalBg: 'bg-[#16211a]',
    modalBorder: 'border-[#27382a]',
    inputBg: 'bg-[#0b120c] border-[#27382a] text-[#86efac]',
    lcdIsLight: false,
  },

  /* ---------------------------------------------------------------
   * 5. Titanium Light
   * ------------------------------------------------------------- */
  light: {
    id: 'light',
    name: 'Titanium Light',

    appBg: 'bg-[#e8ecf1]',
    headerBg: 'bg-[#ffffff]',
    frameBorder: 'border-[#cbd5e1]',
    panelBg: 'bg-[#ffffff]',
    panelBorder: 'border-[#d7dee7]',
    statusBarText: 'text-slate-600',
    mutedText: 'text-slate-500',
    bodyText: 'text-slate-900',

    lcdBg: 'bg-[#f8fafc]',
    lcdBorder: 'border-[#cbd5e1]',
    lcdGlow: 'bg-blue-500/5',
    lcdHeader: 'text-slate-500',
    lcdFormula: 'text-slate-700',
    lcdPreview: 'text-slate-400',
    lcdResult: 'text-slate-900',
    lcdChip: 'bg-[#e2e8f0] text-slate-700 border-[#cbd5e1]',
    lcdInset: 'bg-[#e2e8f0]',
    lcdInsetText: 'text-teal-700',

    badge2nd: 'bg-amber-500 text-white border-amber-600',
    badgeHyp: 'bg-blue-600 text-white border-blue-700',
    badgeMem: 'bg-violet-600 text-white border-violet-700',

    funcKey: 'bg-[#dde3ea] active:bg-[#cdd6e0] text-slate-800',
    funcAltLabel: 'text-amber-700',
    numKey: 'bg-[#ffffff] active:bg-[#eef2f7] text-slate-900',
    opKey: 'bg-[#2563eb] active:bg-[#1d4ed8] text-white',
    clearKey: 'bg-[#dc2626] active:bg-[#b91c1c] text-white',
    ceKey: 'bg-[#d97706] active:bg-[#b45309] text-white',
    equalKey: 'bg-[#ea580c] active:bg-[#c2410c] text-white',

    chipBg: 'bg-[#e2e8f0]',
    chipText: 'text-slate-700',
    tabActive: 'bg-[#2563eb] text-white',
    tabInactive: 'text-slate-500',
    segActive: 'bg-[#2563eb] text-white',
    segInactive: 'bg-[#e2e8f0] text-slate-500',

    accent: 'text-[#0f766e]',
    accentBg: 'bg-[#0d9488]',
    accentRing: 'ring-blue-500/50',
    accentSoft: 'bg-[#d7f2ee] border-[#99e0d6]',

    modalBg: 'bg-white',
    modalBorder: 'border-[#cbd5e1]',
    inputBg: 'bg-[#f1f5f9] border-[#cbd5e1] text-slate-900',
    lcdIsLight: true,
  },
};

export const THEME_LIST = Object.values(THEME_PROFILES);
export const DEFAULT_THEME = 'dark';

export function getTheme(id) {
  return THEME_PROFILES[id] || THEME_PROFILES[DEFAULT_THEME];
}

/** Flat keycap geometry (radius + press animation supplied per-component). */
export const KEY_BASE =
  'select-none flex flex-col items-center justify-center relative overflow-hidden ' +
  'transition-[transform,background-color] duration-75 active:scale-[0.97] font-medium leading-none';

export const TAB_BASE =
  'flex items-center justify-center gap-1 font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap';
