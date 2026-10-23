import React from 'react';

/**
 * AppLogo — the mark used in the header and on the launcher icon.
 *
 * A calculator reduced to five shapes: a display slot and a 2 × 2 grid of
 * rounded keys. Everything is drawn in `currentColor`, so the same SVG works
 * as a knockout inside an accent badge and as a standalone mark.
 */
export default function AppLogo({ size = 24, className = '', style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={style}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {/* display slot */}
      <rect x="4.3" y="1.75" width="15.4" height="2.9" rx="1.45" />
      {/* keys */}
      <rect x="4.3" y="6.85" width="6.6" height="6.6" rx="2.4" />
      <rect x="13.1" y="6.85" width="6.6" height="6.6" rx="2.4" />
      <rect x="4.3" y="15.65" width="6.6" height="6.6" rx="2.4" />
      <rect x="13.1" y="15.65" width="6.6" height="6.6" rx="2.4" />
    </svg>
  );
}
