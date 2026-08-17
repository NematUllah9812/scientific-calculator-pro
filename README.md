# Scientific Calculator Pro

**[▶ Try the live demo](https://nematullah9812.github.io/scientific-calculator-pro/)** &nbsp;·&nbsp; [Download the APK](ScientificCalculatorPro.apk?raw=1)

A six-mode scientific calculator for Android. The interface is a React 19 app
built to a single self-contained `index.html`, which a native WebView shell
loads from its assets — one codebase, no runtime network dependency, and an
APK that stays under 200 KB.

---

## Modes

| Mode | What it does |
| --- | --- |
| **Simple** | Four-function keypad with circular keys, percent, sign toggle |
| **Scientific** | SHIFT function swap, DEG/RAD/GRAD, 6 memory banks, factorial, nCr/nPr, logs, powers, roots |
| **Programmer** | HEX/DEC/OCT/BIN readout, BigInt ALU, bitwise ops, shifts/rotates, interactive 64-bit bitboard, BYTE→QWORD word sizes, signed/unsigned |
| **Statistics** | 18 summary metrics, OLS linear regression with prediction, combinatorics, random generators, dataset presets |
| **Converter** | 12 categories (length, mass, temperature, area, volume, speed, time, data, pressure, energy, power, angle) |
| **Date & Time** | Date difference, add/subtract intervals, business days, age calculation, month calendar |

Shared across every mode: calculation history, memory banks, five themes,
configurable precision and notation, sound profiles, and haptics.

---

## Documentation

| Document | Contents |
| --- | --- |
| [`docs/MASTER_BLUEPRINT.md`](docs/MASTER_BLUEPRINT.md) | Original architectural specification — technology stack, file tree, Android build pipeline, math engines, theme tokens, cursor state machine |
| [`docs/IMPLEMENTATION_NOTES.md`](docs/IMPLEMENTATION_NOTES.md) | How the shipped app differs from that spec, the redesign rules, and how it was verified |
| [`docs/DEPLOY_GITHUB_PAGES.md`](docs/DEPLOY_GITHUB_PAGES.md) | How the live demo is published with GitHub Pages, and how to repeat it on another repo |
| `docs/design-*.jpg` | The six reference screenshots the current UI was built against |

The blueprint is the design as originally written; the implementation notes
record where the build necessarily diverged (Gradle version, signing, layout
scaling) and why. Read both before making structural changes.

## Architecture

```
calculator-app/          React 19 + Vite source
  src/utils/             Pure, UI-agnostic calculation engines
  src/components/        One component per mode, plus modals
AndroidStudioProject/    Gradle project — WebView host
  app/src/main/assets/index.html   the built web app
build-scientific-calculator-apk.sh Toolchain-only build path
```

`vite-plugin-singlefile` inlines all JS and CSS (Tailwind v4) into one HTML
file. `MainActivity.java` (`com.scientific.calculator.pro`) renders it in an
immersive fullscreen WebView and exposes an `AndroidBridge` JS interface for
vibration and native toasts. The web layer degrades gracefully in a plain
browser, where that bridge is simply absent.

The calculation engines under `src/utils` hold no UI state, so they can be
imported and tested on their own.

### Layout scaling

The UI targets a **412 × 929** design canvas. `src/utils/scale.js` derives a
`--u` CSS unit as `clamp(min(vw/412, vh/929), 0.62, 1.45)`, and every
dimension is expressed in that unit. The layout is therefore *fixed per
device* — it scales down to fit smaller screens (verified to 320 × 568)
instead of reflowing into a different arrangement.

Scrolling is hybrid: keypad modes are locked to the viewport, while
Statistics and Date/Time scroll only their content region with the header and
tab strip pinned.

Full rationale in [`docs/IMPLEMENTATION_NOTES.md`](docs/IMPLEMENTATION_NOTES.md).

---

## Build

### Web app

```bash
cd calculator-app
npm install
npm run dev      # dev server
npm run build    # -> dist/index.html (single file)
```

To ship a web change into the APK, copy the build into the Android assets:

```bash
cp calculator-app/dist/index.html \
   AndroidStudioProject/app/src/main/assets/index.html
```

### Android

Requires **JDK 21** and Android SDK with **compileSdk 34**. AGP 8.4.0 needs
Gradle **8.6** or newer — the wrapper is already pinned correctly.

```bash
cd AndroidStudioProject
echo "sdk.dir=/path/to/android-sdk" > local.properties
./gradlew assembleRelease
```

`minSdk 21` / `targetSdk 34`, version 3.0 (code 30).

---

## Signing

**No signing material is committed to this repository.** The release
`signingConfig` reads from `keystore.properties`, which is gitignored.

```bash
cd AndroidStudioProject
cp keystore.properties.example keystore.properties
keytool -genkeypair -v -keystore release.keystore -alias myalias \
        -keyalg RSA -keysize 2048 -validity 10950
# then fill in your values in keystore.properties
```

Without that file the release build is left unsigned; debug builds are
unaffected. Generate your own key — never reuse someone else's.

---

## Prebuilt APK

`ScientificCalculatorPro.apk` is checked in for convenience and reflects the
current source, including the redesigned interface.

Signed with v1 + v2 + v3 signature schemes using a development key, so
Android will warn about an unknown developer — enable "install from unknown
sources" to sideload it.
