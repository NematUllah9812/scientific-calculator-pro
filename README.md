# Scientific Calculator Pro

**[▶ Try the live demo](https://nematullah9812.github.io/scientific-calculator-pro/)** &nbsp;·&nbsp; [Download APK v3.1.1](ScientificCalculatorPro.apk?raw=true)

A six-mode scientific calculator for Android. The interface is a React 19 app
built to a single self-contained `index.html`, which a native WebView shell
loads from its assets — one codebase, no runtime network dependency, and an
APK that stays under 200 KB.

---

## Modes

| Mode | What it does |
| --- | --- |
| **Simple** | Four-function keypad, editable expression with a movable caret, percent, single-character backspace, paper tape of recent results |
| **Scientific** | SHIFT function swap, DEG/RAD/GRAD, 6 memory banks, factorial, nCr/nPr, logs, powers, roots |
| **Programmer** | HEX/DEC/OCT/BIN readout, BigInt ALU, bitwise ops, shifts/rotates, interactive 64-bit bitboard, BYTE→QWORD word sizes, signed/unsigned |
| **Statistics** | 18 summary metrics, OLS linear regression with prediction, combinatorics, random generators, dataset presets |
| **Converter** | 12 categories (length, mass, temperature, area, volume, speed, time, data, pressure, energy, power, angle) |
| **Date & Time** | Date difference, add/subtract intervals, business days, age calculation, month calendar |

Shared across every mode: calculation history, memory banks, five themes
(Midnight, Slate, Neon OLED, Terminal, Daylight), configurable precision and
notation, sound profiles, and haptics.

The interface follows a flat, minimal iOS-inspired system: no device frames,
no bevels, no scanlines — one accent colour per theme, hairline-free cards,
rounded keycaps and a right-aligned readout that scales with the number.

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

The APK build scripts build the web app, normalize its inline script for
`file://` loading, and sync it into the Android assets automatically.

### Android

Requires **JDK 21** and Android SDK with **compileSdk 34**. AGP 8.4.0 needs
Gradle **8.6** or newer — the wrapper is already pinned correctly.

```bash
cd AndroidStudioProject
echo "sdk.dir=/path/to/android-sdk" > local.properties
./gradlew assembleRelease
```

`minSdk 21` / `targetSdk 34`, version **3.1.1** (code **32**).

### SDK-free APK rebuild (Linux x86_64)

For web UI and launcher-resource changes, a full Android SDK is not needed:

```bash
./build-apk-offline.sh
```

Requires Node/npm, Python 3, curl, unzip, `sha256sum`, and an authenticated
`gh` CLI. The first run downloads and caches aapt2, Android API 34 stubs,
a Java runtime and signing tools under the gitignored `.apktools/` directory.
It rebuilds the web bundle and Android resources, reuses the prebuilt native
WebView shell, aligns the APK, and signs it with v1 + v2 + v3. Both payload
integrity and cryptographic signatures are checked before replacing the APK.

**This route does not compile Java.** A source-hash guard rejects native-shell
changes; use Android Studio or `build-scientific-calculator-apk.sh` for those.

The first run creates `.apktools/release.jks` if needed; subsequent runs reuse
it. The default password is for development builds only. Set `KS_PASS` before
the first run for a private password, and **back up the keystore securely** —
losing it means future APKs cannot update an existing installation. Never
commit it or upload it to a public release.

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

[Download v3.1.1](ScientificCalculatorPro.apk?raw=true)
(**181,610 bytes**, Android 5.0/API 21 minimum, with an up-to-date Android
System WebView). The checked-in APK includes the redesigned UI, the new
launcher logo, scientific-input fixes and the Simple backspace key.

- Verified with Android's `apksigner`: **v1, v2 and v3 signatures pass**.
- SHA-256: `b5af10660d8528e0f3727ac8bfee63d36f08edc4308b23f6b10f8a9744daa623`
- The packaged `assets/index.html` was extracted and browser-tested from
  `file://`, including a calculation; no console errors. A physical Android
  device installation has not been tested here.

Open the APK on your phone and allow installation from that browser/file
manager when prompted. **This build uses a new development signing key.**
If an older build is installed, Android may require uninstalling it first;
that removes its saved settings and history.

[Live browser demo](https://nematullah9812.github.io/scientific-calculator-pro/)
— reflects the latest published deployment, not unmerged branch changes.
Use `npm run dev` in `calculator-app/` to preview the current source.
