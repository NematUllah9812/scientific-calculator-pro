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
