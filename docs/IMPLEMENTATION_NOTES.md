# Implementation Notes

How the shipped app relates to [`MASTER_BLUEPRINT.md`](MASTER_BLUEPRINT.md), and the
decisions taken during construction. The blueprint is the original design
specification; this file records where reality diverged from it and why.

---

## 1. Deviations from the blueprint

### Gradle 8.6, not 8.4

The blueprint specifies Android Gradle Plugin 8.4.0 on Gradle 8.4. That
combination cannot run: AGP 8.4.0 requires **Gradle 8.6 or newer** and fails at
configuration time otherwise. The wrapper is pinned to `gradle-8.6-bin.zip`.

### JDK 21 required for signing

`apksigner` reading the PKCS12 keystore needs `HmacPBESHA256`, which is
unavailable on JDK 11 — signing fails with `NoSuchAlgorithmException`. JDK 21 is
required for the signing step, not merely recommended.

### `resources.arsc` must stay uncompressed

Android 11+ rejects an APK whose `resources.arsc` is deflated. Any tooling that
repackages the APK must preserve the per-entry compression method — a naive zip
rewrite re-compresses it and produces an APK that will not install.

### `aapt2 link` and the manifest

Raw `aapt2 link` rejects a manifest with no `package=` attribute, but AGP 8
rejects one that has it. The checked-in manifest omits `package=` (correct for
Gradle); the toolchain-only build script patches a temporary copy instead.

### Platform SDK download

`platform-34_rNN.zip` is not directly downloadable (HTTP 404). Use
`sdkmanager "platforms;android-34"`.

### Signature schemes

Gradle's release signing defaults to v1+v2. v3 is enabled explicitly in
`signingConfigs.release`; releases are signed v1+v2+v3.

### In-app APK download removed

The blueprint's UI included a modal offering the APK and Android Studio project
as downloads. This was dropped — an app does not need to ship a copy of itself,
and it cost a permanent slot in the header.

---

## 2. UI redesign (post-blueprint)

The interface was rebuilt against the six reference screenshots in this folder
(`design-*.jpg`), which supersede the blueprint's section 6 schematics.

### Fixed-layout scaling

The UI targets a **412 × 929** design canvas. `src/utils/scale.js` derives

```
u = clamp(min(vw / 412, vh / 929), 0.62, 1.45)
```

and every dimension is expressed in that unit via `px(n)` / `ico(scale, n)`.

The layout is therefore *fixed per device*: it scales down to fit a smaller
screen rather than reflowing into a different arrangement, so the app looks the
same on any phone. Verified down to 320 × 568.

### Hybrid scrolling

Keypad modes (Simple, Scientific, Programmer, Converter) are locked to the
viewport and never scroll. Statistics and Date/Time scroll only their content
region, with the header and tab strip pinned.

### One theming language

Every section reads the same theme tokens, so a given theme looks consistent
across all six modes. There is no section-specific palette. The dark/cyan
Programmer appearance in the reference screenshots is simply how the `casio`
theme renders, not a Programmer-only identity.

Components must route colour through tokens (`lcdInset`, `lcdInsetText`,
`inputBg`, `chipBg`, …). Hardcoded `rgba(0,0,0,…)` backgrounds or literal hex
text colours look fine on the four dark themes but become opaque grey slabs on
`light`.

### Numerals

LCD and result numerals use `font-variant-numeric: tabular-nums` with the sans
stack, **not** a monospace family. The mono fonts available in an Android
WebView render a slashed or dotted zero, which looks wrong on a calculator.

Monospace is retained deliberately in exactly two places, where it is
typography rather than numerals: the Programmer bitboard's `63 … 0` index ruler
and the Converter's unit-name labels.

### Defaults

Theme `dark` (Dark Obsidian) and mode `simple`, overriding the blueprint's
`casio` default.

---

## 3. Simple mode: caret editing

Simple mode originally used a single accumulator value and could only append
digits. It now implements the cursor lifecycle described in **blueprint section
8**, which had never been built for this mode:

- State is an expression string plus a caret index.
- Tap anywhere in the expression to place the caret; `‹ ›` buttons in the LCD
  header nudge it; arrow keys work on a hardware keyboard.
- Digits and operators insert **at the caret**, not only at the end. An
  operator typed directly over one already left of the caret replaces it.
- After `=`, a digit starts a fresh calculation while an operator chains onto
  the answer, per the blueprint's `isEvaluated` branch.
- A live `= result` preview evaluates as you type.

Two limits were removed in the process: a hard 15-digit input cap that silently
dropped keypresses, and a `truncate` on the display that clipped long values.
The expression now wraps and steps its font size down at 18 / 28 / 40
characters, so input is never hidden.

---

## 4. Verification

There is no Android emulator in the environment used to build this (no KVM), so
the UI is verified by driving the web build in headless Chromium at phone
viewports via Playwright:

- All six modes × five themes render with no console errors.
- No layout overflow at 412 × 929 or 320 × 568.
- Engine spot-checks: `7×8+9 = 65`; regression r² 0.999129237, slope
  2.01547619, predict x=9 → 18.3071429; nCr(10,3) 120, nPr(10,3) 720,
  10! = 3,628,800; age 31y 2m 2d / 11,386 days.
- Caret editing: building `12+34`, tapping between `1` and `2` and pressing `9`
  yields `192+34`.

**The APK has not been launched on physical Android hardware.** Signature
schemes and package structure are verified with `apksigner verify`; the UI
inside it is the same build exercised in Chromium.

---

## 5. Keystore

`release.keystore` is deliberately **not** in this repository, and neither is
`keystore.properties`. The APK checked in at the repo root is signed with a
development key; anyone rebuilding should generate their own (see the README).

Because the signing identity is stable across rebuilds, a new APK installs as
an upgrade over a previously sideloaded copy rather than requiring an uninstall.

---

## 6. UI overhaul (v3.1)

The interface was rebuilt from the ground up: the old skin read as a physical
Casio (raised LCD frame, scanlines, bevelled keycaps, rainbow accents) and the
layout had drifted into dead space and truncated values.

### Design system

- **Frameless display.** No bezel, no scanlines, no glow. The result sits on
  the page background, right-aligned, and steps its size down as the number
  grows.
- **One accent per theme.** Operators, the active tab and the live result all
  share a single accent colour. Five profiles: Midnight, Slate, Neon OLED,
  Terminal, Daylight.
- **Glass keycaps.** Keycaps are frosted panes rather than solid blocks: a
  translucent base colour, a top-lit gradient, a hairline edge, an inner
  highlight and a soft drop shadow. The tint is theme-driven through
  `--glass-*` custom properties (`src/index.css`), so one `.glass` class
  covers every profile.
- **Press feedback.** Every key scales to 94 %, dims its inner shadow and
  emits a ripple that spreads from the touch point (`src/utils/ripple.js`).
  Hardware haptics and the synthesised click remain in place.
- **iOS-style bottom sheets** for History, Memory and Settings, with a
  grabber, a blurred backdrop and a drag-free confirm step for destructive
  actions.

### Layout

Every mode now uses the same skeleton: a fixed-height keypad at the bottom, a
readout anchored above it, and a paper tape that fills the space in between
with the last results. Tapping a tape row recalls that value.

### Scientific mode

The display was enlarged (result up to 64 px, formula up to 18 px) and given
the same caret editing the Simple mode has: tap the formula to place the
caret, `‹` / `›` to walk it, `⌫` to delete before it, arrow keys on a
hardware keyboard. The live preview follows the caret, so an expression can be
corrected in the middle instead of being retyped.

### Bugs fixed along the way

- Notation ids disagreed between the engine and the UI (`sci` vs `scientific`),
  so switching to SCI/ENG silently produced standard output.
- The Programmer ALU ignored `SHL`/`SHR`/`SAR`/`MOD` (different op names) and
  mixed signed/unsigned division and modulo.
- `formatResult` was off by one significant digit; scientific notation printed
  `5.0000000000e+2`.
- The Scientific display kept showing the last result after `CE`.
- The converter's `00` key and its digit entry used a stale closure.
- The converter truncated long results.
- Recalling a formatted value from history inserted thousands separators into
  the expression (`1,234,000` → tokenizer error).
- Typing in the History search box leaked into the calculator.
- The Date calendar did not wrap from December to January.
- `color-scheme` was hard-coded to dark, so native inputs and scrollbars kept
  the dark palette in the Daylight theme.

## 7. Logo and scientific input fixes (v3.2)

### New logo

The generic clipboard icon in the header and the busy Casio drawing used as
the launcher icon are gone. The app now has its own mark: a calculator
reduced to **five shapes** — a display slot above a 2 × 2 grid of rounded
keys — drawn in `currentColor` so the same SVG works everywhere.

- `src/components/AppLogo.jsx` holds the mark (one `<svg>`, five `<rect>`s).
- The header shows it knocked out of the theme accent badge, so it recolours
  with the active theme.
- The Android launcher icons (`mipmap-*dpi/ic_launcher.png` and
  `ic_launcher_round.png`, 48 → 192 px) use the same mark in orange
  (`#FF9F0A`) on a near-black gradient badge (`#242426 → #101012 → #000`),
  squircle radius 22.5 %, circular for the round variant.
- `res/values/colors.xml` now uses a true black background (`#000000`) and
  the same orange accent, so the splash/status bars match the icon.

### Scientific mode: function keys

- **A function key now applies to the number in front of the caret.**
  Typing `144` and pressing `√x` produces `sqrt(144)` and the live preview
  shows `12`. Before, the function name was appended to the number
  (`144sqrt(`) and `=` reported *Error*.
- **Brackets are closed for the user.** `√x`, `log`, `ln`, `sin`, `mod`,
  `nCr`, `floor` … insert the matching `)` immediately and leave the caret
  inside the call, so the expression always reads as a complete function.
  The `)` key walks over a bracket that is already there instead of
  doubling it, and `=` closes anything the user left open.
- **Backspace removes a function and its bracket as one unit** — deleting
  `sqrt(` no longer leaves a stray `)` behind.
- The `(` / `)` keys, the caret arrows and the delete key now carry
  accessible names (`aria-label`), which the icon-only keys were missing.

### Verification

`shots/v17` (all six modes + the three sheets) and `shots/f6` (15 scripted
checks) pass with no console errors. The synced Android WebView asset was
re-checked from `file://`.

## 8. Installable APK and updated live demo (2026-10-23)

- Rebuilt `ScientificCalculatorPro.apk` as **3.1 / code 31**, minSdk 21,
  targetSdk 34. The APK includes the new launcher icons and the current
  357,107-byte single-file web UI.
- The SDK-free pipeline (`build-apk-offline.sh`) uses cached aapt2, API 34
  stubs, a Temurin runtime, a JS signer, and Android's `apksigner` verifier.
  It reuses the shipped native WebView DEX, with a same-length background
  colour patch and regenerated DEX checksums. It does **not** compile Java;
  a native-source hash guard stops resource-only builds after Java changes.
- Gradle metadata and the Java background colour now match the APK. The
  regular full-SDK script resolves the repository path correctly, uses the
  same version, and excludes private signing material from its source ZIP.
- Tool downloads and private signing files remain under gitignored
  `.apktools/`. The keystore must be backed up privately to sign future
  updates; it is not part of the APK, source commit, or public release.
- Android's `apksigner verify --verbose --print-certs` independently passes
  **v1, v2 and v3** signatures. Payload checks also pass: signed-entry
  digests, stored-resource alignment, DEX SHA-1/Adler-32, and the web bundle.
- The packaged HTML was extracted from the APK and loaded via `file://`.
  The new five-shape header logo renders; `78 × 9 + 6 = 708` works; no
  browser console errors. No physical Android installation was available
  for testing.
- Re-running the SDK-free pipeline with the same key reproduces the exact
  APK SHA-256 recorded in `ScientificCalculatorPro.apk.sha256`.
- GitHub Pages reports the updated demo deployment as built. Its deployed
  HTML matches the APK web asset. A local preview also binds to `0.0.0.0`.

**Upgrade caveat:** the previous private signing key was unavailable. This
sideload build therefore uses a new development key; Android may require
uninstalling the old app first, which removes its stored settings/history.

## 9. Simple backspace key (v3.1.1)

- Removed the Simple keypad's ± sign-toggle button. The first row is now
  **AC | % | ⌫ | ÷**, with backspace immediately left of division.
- The new backspace uses the same circular glass keycap, ripple and key
  feedback as the other function keys, with the accessible name `Backspace`.
- Both on-screen and keyboard Backspace delete one character before the
  current caret. After `=`, backspace edits the result one digit at a time
  rather than clearing everything. `AC` remains the full reset.
- Removed the unused Simple negation handler. Negative numbers can still be
  entered with minus; the Scientific ± key is unchanged.
- Added stable Simple formula/result/keypad test hooks. Twelve browser
  checks pass on both the preview and the HTML extracted from the APK:
  top-row order/adjacency and circular sizing, single-character/repeated
  deletion, caret-middle edits and preservation of the suffix, safe empty
  and caret-start handling, keyboard parity, deleting operators, editing
  settled/grouped results, percentages/decimals, division, negative numbers,
  and preserving the Scientific controls/mobile layout. No console errors.
- Rebuilt the Android asset and APK as **3.1.1 / versionCode 32**, with
  matching full-SDK build metadata and updated APK checksum. Android's
  `apksigner` verifies all v1/v2/v3 signatures. Device installation has not
  been tested in this environment.
- The earlier private signing key was not retained in this fresh build
  environment. This APK therefore uses a new development signing key:
  Android may require uninstalling the previous app first, which clears
  its saved settings and history. No signing material is committed.
- The local preview contains this change. The public GitHub Pages demo
  reflects its last deployment until this branch is merged and deployed.
