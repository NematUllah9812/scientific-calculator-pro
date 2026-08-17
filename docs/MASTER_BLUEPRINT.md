# 📐 Master Architectural Blueprint & System Construction Specification
## Scientific Calculator Pro for Android & Web

> **Document Version**: 3.0  
> **Target Audience**: Software Engineers, System Architects, and AI Agents recreating or maintaining this system.  
> **Scope**: Complete end-to-end technical, mathematical, UI/UX design, and Android build specifications.

---

## Table of Contents
1. [Executive Summary & Product Requirements](#1-executive-summary--product-requirements)
2. [Complete Technology Stack & Dependency Manifest](#2-complete-technology-stack--dependency-manifest)
3. [Master File Tree & Directory Hierarchy](#3-master-file-tree--directory-hierarchy)
4. [Android Native Host Architecture & Build Pipeline](#4-android-native-host-architecture--build-pipeline)
5. [Computational Math & Logic Engines (Algorithms & Formulas)](#5-computational-math--logic-engines)
6. [UI/UX Design Specification & Screen Schematics](#6-uiux-design-specification--screen-schematics)
7. [Theme Engine & Color Tokens Specification](#7-theme-engine--color-tokens-specification)
8. [Interactive Cursor & State Machine Lifecycle](#8-interactive-cursor--state-machine-lifecycle)
9. [Step-by-Step AI Agent Reconstruction Recipe](#9-step-by-step-ai-agent-reconstruction-recipe)

---

## 1. Executive Summary & Product Requirements

### 1.1 Product Identity
**Scientific Calculator Pro** is a high-precision, multi-tier computational system engineered to run identically as:
1. **A Standalone Native Android Application** (Compiled, aligned, and signed `.apk` targeting Android API 21 to 34, running in hardware-accelerated immersive fullscreen).
2. **A Complete Android Studio Gradle Project** (Fully editable, ready-to-build Gradle 8.4 project package).
3. **A Zero-Dependency Responsive Web Application / PWA** (Running standalone in modern browsers).

### 1.2 The Six Core Modes
1. 🔢 **Simple Mode**: Standard 4-function arithmetic (`+`, `−`, `×`, `÷`, `%`, `±`, `=`) with large, spacious buttons and automatic answer chaining.
2. 🔬 **Scientific Mode**: Full Casio/TI-grade scientific calculator with dual `SHIFT` function swap, Trigonometric (standard, inverse, hyperbolic), Powers, Roots ($^y\sqrt{x}$), Logarithms ($\log_{10}, \ln, \log_2, \log_n$), Inverses, Factorials ($x!$), Modulo, Angle modes (`DEG`, `RAD`, `GRAD`), Constants ($\pi, e, \phi$), and 6 Memory Banks ($M, M_1 \dots M_5$).
3. 💻 **Programmer Mode**: Real-time simultaneous 4-radix HUD (HEX, DEC, OCT, BIN), Two's complement signed/unsigned switch, Word size selector (8-bit Byte, 16-bit Word, 32-bit DWord, 64-bit QWord), Bitwise logic (`AND`, `OR`, `XOR`, `NOT`, `NAND`, `NOR`, `XNOR`), Bit shifts (`<<`, `>>`, `>>>`, `ROL`, `ROR`), and an **interactive 64-bit clickable binary bitboard**.
4. 📊 **Statistics & Probability Mode**: Dataset table editor with presets, 18 one-variable statistical metrics ($n, \sum x, \sum x^2, \bar{x}, s, \sigma, s^2, \sigma^2, \tilde{x}, Q_1, Q_3, IQR, \text{Modes}$), Bivariate Ordinary Least Squares Linear Regression ($y = mx + b, r, R^2$), Combinatorics ($nCr, nPr, n!$), and Random generators (Float, Int, Coin toss, D6 dice roll).
5. 📐 **Unit Converter Mode**: 12 categories (*Length, Mass, Temperature, Area, Volume, Speed, Time, Data Storage, Pressure, Energy, Power, Angle*) with custom modern bottom-sheet unit selectors and numeric keypad.
6. 📅 **Date & Time Mode**: Date difference calculator with working/business days filter, date duration arithmetic, and custom modern modal calendar pickers.

---

## 2. Complete Technology Stack & Dependency Manifest

### 2.1 Web & Frontend Stack
* **Framework**: React 19 (`react`, `react-dom`)
* **Build Tool**: Vite 8 (`vite`, `@vitejs/plugin-react`)
* **CSS Framework**: Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`)
* **Icons**: Lucide React (`lucide-react`)
* **Packaging Plugin**: `vite-plugin-singlefile` (Inlines all CSS, JS, and HTML into a single self-contained offline bundle)
* **Audio Engine**: Web Audio API Oscillator & Gain Envelope Synthesizer (Zero external audio assets)

### 2.2 Frontend `package.json`
```json
{
  "name": "calculator-app",
  "version": "2.6.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "lucide-react": "^0.475.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^4.0.0",
    "vite": "^8.2.0",
    "vite-plugin-singlefile": "^2.1.0"
  }
}
```

### 2.3 Android Build Toolchain
* **Java Development Kit**: OpenJDK 21
* **Android SDK Target**: Platform 34 (Android 14)
* **Build Tools Version**: 34.0.0
* **Core Build Tools**: `aapt2` (Resource packaging), `javac` (Java bytecode compiler), `d8` (DEX compiler), `zipalign` (4-byte alignment), `apksigner` (v1, v2, v3 cryptographic signing schemes), `keytool` (Keystore generation).

---

## 3. Master File Tree & Directory Hierarchy

```
/home/user/
├── ScientificCalculatorPro.apk          # Final signed, installable Android APK
├── ScientificCalculatorPro_AndroidStudio.zip # Complete Gradle Android Studio project archive
├── build-scientific-calculator-apk.sh   # Master automated APK & ZIP build script
├── README.md                            # End-user documentation and manual
├── MASTER_BLUEPRINT.md                  # This master architectural document
│
├── AndroidStudioProject/                # Standard Android Studio Gradle Project Structure
│   ├── settings.gradle                  # Root Gradle settings (includes ':app')
│   ├── build.gradle                     # Top-level Gradle configuration (AGP 8.4.0)
│   ├── gradle.properties                # JVM memory and AndroidX properties
│   ├── gradle/wrapper/
│   │   └── gradle-wrapper.properties    # Gradle 8.4 distribution declaration
│   └── app/
│       ├── build.gradle                 # Application build config (minSdk 21, compileSdk 34)
│       ├── proguard-rules.pro           # ProGuard rules (preserves @JavascriptInterface)
│       └── src/main/
│           ├── AndroidManifest.xml      # Fullscreen immersive theme, permissions
│           ├── java/com/scientific/calculator/pro/
│           │   └── MainActivity.java    # Fullscreen WebView & AndroidBridge
│           ├── res/
│           │   ├── values/              # strings.xml, colors.xml, styles.xml
│           │   └── mipmap-*/            # Custom launcher icons (mdpi to xxxhdpi)
│           └── assets/
│               └── index.html           # Inlined production calculator bundle
│
└── calculator-app/                      # Source React / Tailwind Application
    ├── index.html                       # Base HTML entry with viewport-fit & loader
    ├── vite.config.js                   # Vite singlefile & target ES2020 configuration
    └── src/
        ├── main.jsx                     # Safe DOMContentLoaded React root mounter
        ├── App.jsx                      # Shell, mode tab router, active theme provider
        ├── index.css                    # Tailwind imports & LCD animation rules
        │
        ├── components/
        │   ├── SimpleCalculator.jsx     # 🔢 Standard 4-function basic calculator
        │   ├── ScientificCalculator.jsx # 🔬 Scientific calculator with SHIFT & cursor
        │   ├── ProgrammerCalculator.jsx # 💻 4-radix & 64-bit interactive bitboard
        │   ├── StatisticsCalculator.jsx # 📊 Dataset table, summary stats, regression
        │   ├── UnitConverter.jsx        # 📐 12-category unit conversion tool
        │   ├── DateCalculator.jsx       # 📅 Date diff, business days & date arithmetic
        │   ├── CustomDatePickerModal.jsx# 📅 Modern calendar picker dialog
        │   ├── CustomUnitSelectorModal.jsx # 📐 Modern bottom-sheet unit picker
        │   ├── HistoryTape.jsx          # 📜 Calculation history log & export modal
        │   ├── MemoryManager.jsx        # 💾 6 memory bank registers modal
        │   ├── SettingsModal.jsx        # ⚙️ Themes, sound, haptics & precision modal
        │   └── ApkDownloadModal.jsx     # 📦 In-app APK & Studio source download hub
        │
        └── utils/
            ├── mathEngine.js            # Lexer, Shunting-yard RPN, PEMDAS, cleanFloat
            ├── programmerEngine.js      # BigInt ALU, radix conversions, bit shifts
            ├── statisticsEngine.js      # 1-Var summary stats, linear regression
            ├── unitConverterData.js     # 12-category unit conversion coefficients
            ├── dateEngine.js            # Date differences, business days, duration math
            ├── audioHaptics.js          # Web Audio oscillator synthesizer & vibration
            ├── safeStorage.js           # Exception-safe localStorage wrapper
            └── themeStyles.js           # 5 distinct visual theme token definitions
```

---

## 4. Android Native Host Architecture & Build Pipeline

### 4.1 Native `MainActivity.java` Implementation
`MainActivity.java` serves as the native runtime shell. It configures hardware acceleration, initializes WebView security flags, enables JavaScript/DOM storage, binds native Android vibration hardware to JavaScript, and enforces **immersive fullscreen mode**:

```java
package com.scientific.calculator.pro;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Vibrator;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

public class MainActivity extends Activity {
    private WebView webView;
    private Vibrator vibrator;

    public static class CustomWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return false;
        }
    }

    public static class WebAppInterface {
        private Context mContext;
        private Vibrator mVibrator;

        public WebAppInterface(Context c, Vibrator v) {
            mContext = c;
            mVibrator = v;
        }

        @JavascriptInterface
        public void vibrate(int ms) {
            try {
                if (mVibrator != null && mVibrator.hasVibrator()) {
                    mVibrator.vibrate(ms);
                }
            } catch (Exception e) {}
        }

        @JavascriptInterface
        public void showToast(String toast) {
            Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);

        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);

        FrameLayout rootLayout = new FrameLayout(this);
        rootLayout.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        rootLayout.setBackgroundColor(Color.parseColor("#090B10"));

        webView = new WebView(this);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        webView.setBackgroundColor(Color.parseColor("#090B10"));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);

        webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
        webView.setWebViewClient(new CustomWebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Bind JavaScript Interface
        webView.addJavascriptInterface(new WebAppInterface(this, vibrator), "AndroidBridge");

        webView.loadUrl("file:///android_asset/index.html");

        rootLayout.addView(webView);
        setContentView(rootLayout);

        hideSystemUI();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    private void hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            View decorView = getWindow().getDecorView();
            decorView.setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
```

### 4.2 Automated Compilation Pipeline (`build-scientific-calculator-apk.sh`)
The automated build pipeline executes the following 13 steps:
1. **Frontend Compilation**: Runs `npx vite build` using `vite-plugin-singlefile`.
2. **Universal Script Normalization**: Replaces `<script type="module">` with classic `<script>` tags, preventing CORS errors when loaded over `file:///android_asset/`.
3. **Asset Synchronization**: Copies `dist/index.html` to both `android-project/assets/` and `AndroidStudioProject/app/src/main/assets/`.
4. **AAPT2 Resource Compilation**: Compiles `res/` into `compiled_res.zip`.
5. **AAPT2 Resource Linking**: Links `compiled_res.zip` against `platforms/android-34/android.jar`, producing `unaligned.apk` and generating `R.java`.
6. **Java Compilation**: Compiles `MainActivity.java` and `R.java` to Java 8 bytecode using `javac --release 8`.
7. **D8 Dexing**: Converts compiled `.class` files into optimized `classes.dex`.
8. **DEX Packaging**: Adds `classes.dex` into `unaligned.apk` using `zip`.
9. **Zipalign**: Aligns the APK on 4-byte boundaries producing `aligned.apk`.
10. **Keytool Keystore Generation**: Generates 2048-bit RSA release keystore (`release.keystore`) if not already present.
11. **Apksigner Signing**: Cryptographically signs the APK with v1, v2, and v3 signature schemes.
12. **APK Verification**: Validates the APK signature with `apksigner verify --verbose`.
13. **Android Studio ZIP Packaging**: Archives `AndroidStudioProject/` into `ScientificCalculatorPro_AndroidStudio.zip`.

---

## 5. Computational Math & Logic Engines

### 5.1 Math Engine Architecture (`mathEngine.js`)

```
Expression String (e.g. "5sin(30) + 4! - 2^3")
       │
       ▼
[ Tokenizer / Lexer ] ──► Injects implicit '*' (5*sin(30)), separates constants, operators
       │
       ▼
[ Infix-to-RPN Parser ] ──► Dijkstra's Shunting-Yard Algorithm (PEMDAS Precedence)
       │
       ▼
[ Stack Evaluator ]    ──► Evaluates RPN Stack, dispatches trig, roots, factorials
       │
       ▼
[ cleanFloat() ]       ──► Strips IEEE-754 precision artifacts (0.1 + 0.2 -> 0.3)
       │
       ▼
[ formatResult() ]     ──► Applies Standard, Scientific (1.23e+5), or Engineering notation
```

#### Mathematical Functions Reference
* **Trigonometric Functions**: Respect active `angleMode` (`DEG`, `RAD`, `GRAD`).
  $$\text{rad} = \begin{cases} \frac{\theta \cdot \pi}{180} & \text{if DEG} \\ \frac{\theta \cdot \pi}{200} & \text{if GRAD} \\ \theta & \text{if RAD} \end{cases}$$
* **Factorial ($x!$)**: Exact recursive integer factorial for $n \in \mathbb{N}_0$; Lanczos Gamma approximation $\Gamma(z+1)$ for non-integers:
  $$\Gamma(z+1) \approx \sqrt{2\pi} \left(z + g + \frac{1}{2}\right)^{z + \frac{1}{2}} e^{-\left(z + g + \frac{1}{2}\right)} \left[c_0 + \sum_{i=1}^n \frac{c_i}{z + i}\right]$$
* **Combinations ($nCr$) & Permutations ($nPr$)**:
  $$nCr = \frac{n!}{r!(n-r)!}, \quad nPr = \frac{n!}{(n-r)!}$$
* **Nth Root ($^y\sqrt{x}$)**:
  $$^y\sqrt{x} = \begin{cases} x^{1/y} & \text{if } x \ge 0 \\ -(-x)^{1/y} & \text{if } x < 0 \text{ and } y \text{ is odd} \end{cases}$$

---

### 5.2 Programmer Engine Architecture (`programmerEngine.js`)
* **Word Sizing**: Bounded BigInt masking:
  $$\text{Mask}(B) = (1n \ll \text{BigInt}(B)) - 1n \quad (B \in \{8, 16, 32, 64\})$$
* **Two's Complement Conversion**:
  $$\text{toSigned}(u, B) = \begin{cases} u - (1n \ll B) & \text{if } (u \ \& \ (1n \ll (B-1))) \neq 0 \\ u & \text{otherwise} \end{cases}$$
* **Circular Bit Rotations**:
  $$\text{ROL}(v, k, B) = ((v \ll (k \bmod B)) \mid (v \gg (B - (k \bmod B)))) \ \& \ \text{Mask}(B)$$
  $$\text{ROR}(v, k, B) = ((v \gg (k \bmod B)) \mid (v \ll (B - (k \bmod B)))) \ \& \ \text{Mask}(B)$$

---

### 5.3 Statistics Engine Architecture (`statisticsEngine.js`)
* **1-Variable Formulas**:
  $$\bar{x} = \frac{\sum x}{n}, \quad s = \sqrt{\frac{\sum (x - \bar{x})^2}{n-1}}, \quad \sigma = \sqrt{\frac{\sum (x - \bar{x})^2}{n}}, \quad SE = \frac{s}{\sqrt{n}}$$
  $$\text{GeoMean} = \exp\left(\frac{\sum \ln x}{n}\right), \quad \text{HarmonicMean} = \frac{n}{\sum \frac{1}{x}}$$
* **Bivariate Linear Regression**:
  $$\text{Slope } m = \frac{n\sum xy - \sum x \sum y}{n\sum x^2 - (\sum x)^2}, \quad \text{Intercept } b = \frac{\sum y - m\sum x}{n}$$
  $$\text{Correlation } r = \frac{n\sum xy - \sum x \sum y}{\sqrt{[n\sum x^2 - (\sum x)^2][n\sum y^2 - (\sum y)^2]}}$$

---

## 6. UI/UX Design Specification & Screen Schematics

### 6.1 Fixed-Dimension LCD Display Screen Architecture
To eliminate layout shifts when typing long formulas:
```
┌─────────────────────────────────────────────────────────────┐
│ [DEG] [SHIFT] [HYP] [M▾]              (2 missing)  [📋 Copy]│ <- Status Bar (h: 20px)
├─────────────────────────────────────────────────────────────┤
│                    sin(30) + sqrt(16) * 5^2|                │ <- Formula Line (h: 26px, overflow-x: auto)
├─────────────────────────────────────────────────────────────┤
│                                              = 100.5        │ <- Live Preview (h: 18px)
│                                                 100.5       │ <- Main LCD Result (h: 30px)
└─────────────────────────────────────────────────────────────┘
Total Fixed Height: 130px (shrink-0, overflow: hidden)
```

### 6.2 Keypad Bevels & Physical Depression Animation
Keycaps feature simulated 3D physical elevation:
* **Resting State**: `border-b-2 shadow-sm rounded-xl`
* **Active Tap State**: `active:scale-95 active:translate-y-0.5 transition-all duration-75`

### 6.3 Smart `SHIFT` Key State Swapping Matrix

| Button Position | Inactive Main Label | Inactive Top Corner Badge | Active `SHIFT` Main Label | Active `SHIFT` Top Badge |
|---|---|---|---|---|
| Col 1, Row 1 | `SHIFT` (Neutral) | — | **`SHIFT` (Active Gold Glow)** | — |
| Col 3, Row 1 | `sin` | `sin⁻¹` (Gold) | **`sin⁻¹`** | `sin` (Dimmed) |
| Col 4, Row 1 | `cos` | `cos⁻¹` (Gold) | **`cos⁻¹`** | `cos` (Dimmed) |
| Col 5, Row 1 | `tan` | `tan⁻¹` (Gold) | **`tan⁻¹`** | `tan` (Dimmed) |
| Col 1, Row 2 | `√x` | `∛x` (Gold) | **`∛x`** | `√x` (Dimmed) |
| Col 2, Row 2 | `xʸ` | `ʸ√x` (Gold) | **`ʸ√x`** | `xʸ` (Dimmed) |
| Col 3, Row 2 | `x²` | `x³` (Gold) | **`x³`** | `x²` (Dimmed) |
| Col 4, Row 2 | `log` | `10ˣ` (Gold) | **`10ˣ`** | `log` (Dimmed) |
| Col 5, Row 2 | `ln` | `eˣ` (Gold) | **`eˣ`** | `ln` (Dimmed) |
| Col 1, Row 3 | `1/x` | `\|x\|` (Gold) | **`\|x\|`** | `1/x` (Dimmed) |
| Col 2, Row 3 | `x!` | `mod` (Gold) | **`mod`** | `x!` (Dimmed) |
| Col 3, Row 3 | `π` | `φ` (Gold) | **`φ`** | `π` (Dimmed) |
| Col 4, Row 3 | `e` | `RND` (Gold) | **`RND`** | `e` (Dimmed) |
| Col 5, Row 3 | `nCr` | `nPr` (Gold) | **`nPr`** | `nCr` (Dimmed) |
| Col 5, Row 7 | `floor` | `ceil` (Gold) | **`ceil`** | `floor` (Dimmed) |

---

## 7. Theme Engine & Color Tokens Specification

The application features 5 themes defined in `themeStyles.js`. The default theme is **`casio`** (Classic Casio FX Titanium):

```javascript
export const THEME_PROFILES = {
  // 1. Classic Casio FX Titanium (Default on fresh install)
  casio: {
    id: 'casio',
    name: 'Casio FX Classic',
    appBg: 'bg-[#2b3342]',
    frameBorder: 'border-[#1e2533]',
    headerBg: 'bg-[#1f2633]',
    statusBarText: 'text-slate-300',
    lcdBg: 'bg-[#8ea38a]',
    lcdBorder: 'border-[#5f735c]',
    lcdGlow: 'bg-[#9fb59b]/20',
    lcdHeader: 'text-[#1d2b1c]',
    lcdFormula: 'text-[#162115]',
    lcdPreview: 'text-[#2e422c]',
    lcdResult: 'text-[#0f170e]',
    badge2nd: 'bg-[#d97706] text-black border-[#b45309]',
    badgeHyp: 'bg-[#0284c7] text-white border-[#0369a1]',
    badgeMem: 'bg-[#7c3aed] text-white border-[#6d28d9]',
    funcKey: 'bg-[#3b4759] hover:bg-[#48566b] text-slate-100 border-[#2b3543] border-b-[#1c232c]',
    funcAltLabel: 'text-[#f59e0b] font-bold',
    numKey: 'bg-[#475569] hover:bg-[#52637a] text-white border-[#333f4e] border-b-[#242c37]',
    opKey: 'bg-[#0284c7] hover:bg-[#0369a1] text-white border-[#0369a1] border-b-[#0c4a6e]',
    clearKey: 'bg-[#dc2626] hover:bg-[#b91c1c] text-white border-[#b91c1c] border-b-[#7f1d1d]',
    ceKey: 'bg-[#d97706] hover:bg-[#b45309] text-white border-[#b45309] border-b-[#78350f]',
    equalKey: 'bg-[#ea580c] hover:bg-[#c2410c] text-white border-[#f97316]/60 shadow-orange-950/60',
    tabActive: 'bg-[#0284c7] text-white shadow-sky-950/60 border-sky-400/40',
    tabInactive: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
  },

  // 2. Dark Obsidian
  dark: {
    id: 'dark',
    name: 'Dark Obsidian',
    appBg: 'bg-zinc-950',
    frameBorder: 'border-zinc-800',
    headerBg: 'bg-black/90',
    statusBarText: 'text-zinc-400',
    lcdBg: 'bg-black/95',
    lcdBorder: 'border-emerald-950/70',
    lcdGlow: 'bg-emerald-500/5',
    lcdHeader: 'text-emerald-400/80',
    lcdFormula: 'text-zinc-300',
    lcdPreview: 'text-emerald-400/60',
    lcdResult: 'text-emerald-400',
    funcKey: 'bg-zinc-800/90 text-zinc-200 border-zinc-700/60 border-b-zinc-900',
    funcAltLabel: 'text-amber-400/90',
    numKey: 'bg-slate-900/90 text-white border-slate-700/70 border-b-slate-950',
    opKey: 'bg-amber-500/10 text-amber-400 border-amber-500/40 border-b-amber-700/50',
    clearKey: 'bg-rose-950/80 text-rose-300 border-rose-800/70 border-b-rose-950',
    ceKey: 'bg-zinc-800/90 text-amber-400 border-zinc-700/60 border-b-zinc-900',
    equalKey: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/50',
    tabActive: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/40',
    tabInactive: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60',
  },

  // 3. Cyber Neon OLED
  neon: {
    id: 'neon',
    name: 'Cyber Neon OLED',
    appBg: 'bg-[#000000]',
    frameBorder: 'border-cyan-900',
    headerBg: 'bg-[#000000]',
    statusBarText: 'text-cyan-400',
    lcdBg: 'bg-[#000000]',
    lcdBorder: 'border-cyan-500/60',
    lcdGlow: 'bg-cyan-500/10',
    lcdHeader: 'text-cyan-400',
    lcdFormula: 'text-cyan-200',
    lcdPreview: 'text-fuchsia-400/80',
    lcdResult: 'text-cyan-300',
    funcKey: 'bg-[#090d1a] text-cyan-300 border-cyan-900/80 border-b-cyan-950',
    funcAltLabel: 'text-fuchsia-400 font-bold',
    numKey: 'bg-[#0a0f1d] text-white border-blue-900/60 border-b-blue-950',
    opKey: 'bg-fuchsia-950/40 text-fuchsia-300 border-fuchsia-800/60',
    clearKey: 'bg-rose-950/60 text-rose-300 border-rose-800/70',
    ceKey: 'bg-amber-950/60 text-amber-300 border-amber-800/70',
    equalKey: 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-black font-extrabold',
    tabActive: 'bg-cyan-500 text-black font-extrabold border-cyan-300',
    tabInactive: 'text-zinc-500 hover:text-cyan-300',
  },

  // 4. Retro Matrix Green
  retro: {
    id: 'retro',
    name: 'Retro Matrix Green',
    appBg: 'bg-[#1b261d]',
    frameBorder: 'border-[#111a12]',
    headerBg: 'bg-[#141d16]',
    statusBarText: 'text-[#4ade80]',
    lcdBg: 'bg-[#0f1710]',
    lcdBorder: 'border-[#22c55e]/40',
    lcdGlow: 'bg-[#22c55e]/10',
    lcdHeader: 'text-[#4ade80]',
    lcdFormula: 'text-[#86efac]',
    lcdPreview: 'text-[#22c55e]/70',
    lcdResult: 'text-[#4ade80]',
    funcKey: 'bg-[#27382a] text-[#86efac] border-[#1d2b20] border-b-[#111a13]',
    funcAltLabel: 'text-[#facc15]',
    numKey: 'bg-[#2f4233] text-white border-[#243327] border-b-[#162118]',
    opKey: 'bg-[#166534]/50 text-[#86efac] border-[#22c55e]/40',
    clearKey: 'bg-[#991b1b]/60 text-[#fca5a5] border-[#ef4444]/40',
    ceKey: 'bg-[#854d0e]/60 text-[#fde047] border-[#eab308]/40',
    equalKey: 'bg-[#22c55e] text-black font-extrabold border-[#86efac]',
    tabActive: 'bg-[#22c55e] text-black font-extrabold border-[#86efac]',
    tabInactive: 'text-[#86efac]/60 hover:text-[#86efac]',
  },

  // 5. Titanium Light
  light: {
    id: 'light',
    name: 'Titanium Light',
    appBg: 'bg-[#f1f5f9]',
    frameBorder: 'border-slate-300',
    headerBg: 'bg-[#e2e8f0]',
    statusBarText: 'text-slate-600',
    lcdBg: 'bg-[#f8fafc]',
    lcdBorder: 'border-slate-300 shadow-inner',
    lcdGlow: 'bg-blue-500/5',
    lcdHeader: 'text-slate-500',
    lcdFormula: 'text-slate-700',
    lcdPreview: 'text-slate-400',
    lcdResult: 'text-slate-900 font-extrabold',
    funcKey: 'bg-[#e2e8f0] text-slate-800 border-slate-300 border-b-slate-400',
    funcAltLabel: 'text-amber-700 font-bold',
    numKey: 'bg-white text-slate-900 font-bold border-slate-300 border-b-slate-400',
    opKey: 'bg-[#dbeafe] text-blue-800 font-bold border-blue-200 border-b-blue-300',
    clearKey: 'bg-[#fee2e2] text-red-700 font-bold border-red-200 border-b-red-300',
    ceKey: 'bg-[#fef3c7] text-amber-800 font-bold border-amber-200 border-b-amber-300',
    equalKey: 'bg-[#2563eb] text-white font-extrabold border-blue-400',
    tabActive: 'bg-[#2563eb] text-white font-bold border-blue-400',
    tabInactive: 'text-slate-600 hover:text-slate-900 hover:bg-slate-200',
  }
};
```

---

## 8. Interactive Cursor & State Machine Lifecycle

```
                           [ USER INPUT EVENT ]
                                    │
                  Is State `isEvaluated == true`?
                       ├─── YES ───► Is Token an Operator (+, -, *, /)?
                       │                 ├── YES ──► Set Expression = `Ans + Operator`
                       │                 └── NO  ──► Clear Expression, Set Expression = `Token`
                       └─── NO  ───► Keep Current Expression
                                    │
                 Insert Token at Cursor Position `cursorPos`
                 New Expression = `beforeCursor + Token + afterCursor`
                 New Cursor Position = `cursorPos + Token.length`
                                    │
                        Is Token a Shifted Function?
                       ├── YES ──► Auto-Deactivate SHIFT (`isShift = false`)
                       └── NO  ──► Retain Current SHIFT State
                                    │
                    Live Preview Evaluation (mathEngine)
                    Updates formula line with animated cursor:
                    [ beforeCursor ] [ | (Cursor Bar) ] [ afterCursor ]
```

---

## 9. Step-by-Step AI Agent Reconstruction Recipe

If you or another AI agent need to reconstruct this application from scratch, execute these **9 sequential steps**:

1. **Initialize Workspace**: Create `calculator-app/` with React 19, Tailwind CSS v4, Vite 8, and `vite-plugin-singlefile`.
2. **Build Utilities**:
   - `mathEngine.js`: Implement `ExpressionEvaluator` (Lexer + Shunting-Yard RPN + PEMDAS + `cleanFloat` + `MemoryManager`).
   - `programmerEngine.js`: Implement BigInt 64-bit ALU (`AND`, `OR`, `XOR`, `NOT`, `<<`, `>>`, `>>>`, `ROL`, `ROR`).
   - `statisticsEngine.js`: Implement 1-Var summary statistics & bivariate linear regression.
   - `unitConverterData.js`: Populate 12 category factor tables.
   - `dateEngine.js`: Implement date difference with business day counter.
   - `audioHaptics.js`: Implement Web Audio API sound synthesis and vibration dispatchers.
   - `safeStorage.js`: Implement in-memory fallback for `localStorage`.
   - `themeStyles.js`: Define the 5 `THEME_PROFILES` with `casio` as default.
3. **Build Core Calculators**:
   - `SimpleCalculator.jsx`: 4-function layout with automatic answer chaining.
   - `ScientificCalculator.jsx`: 5×8 keypad with interactive cursor and `SHIFT` secondary subscript swapping.
   - `ProgrammerCalculator.jsx`: 4-radix live HUD + interactive 64-bit bitboard.
   - `StatisticsCalculator.jsx`: Dataset table, 18-metric grid, linear regression, combinatorics.
4. **Build Extensions & Modals**:
   - `UnitConverter.jsx` & `CustomUnitSelectorModal.jsx`: Custom bottom-sheet unit picker.
   - `DateCalculator.jsx` & `CustomDatePickerModal.jsx`: Custom calendar dialog.
   - `HistoryTape.jsx`: History tape with CSV/TXT export.
   - `MemoryManager.jsx`: 6 memory bank registers.
   - `SettingsModal.jsx`: Theme switcher, sound selector, precision slider.
   - `ApkDownloadModal.jsx`: Dual-tab download hub for APK and Android Studio Project ZIP.
5. **Assemble App Shell (`App.jsx`)**:
   - Mode tab switcher with 6 tabs: *Simple*, *Scientific*, *Programmer*, *Statistics*, *Converter*, *Date/Time*.
   - Ensure default theme is `casio`.
   - Zero mock status bar headers.
6. **Mount Safe Lifecycle (`main.jsx`)**:
   - Wrap `ReactDOM.createRoot` in `DOMContentLoaded` check to guarantee DOM availability.
7. **Construct Android Native Shell (`AndroidStudioProject/`)**:
   - Create `MainActivity.java` with hardware WebView, `AndroidBridge`, and `SYSTEM_UI_FLAG_IMMERSIVE_STICKY`.
   - Create `AndroidManifest.xml` with `Theme.NoTitleBar.Fullscreen`.
   - Create standard `build.gradle` and `settings.gradle` configs.
8. **Automate Build Script (`build-scientific-calculator-apk.sh`)**:
   - Build frontend singlefile $\to$ Strip `type="module"` $\to$ AAPT2 $\to$ Javac $\to$ D8 $\to$ Zipalign $\to$ Apksigner $\to$ ZIP packaging.
9. **Verify System**:
   - Run verification test suite covering arithmetic, trig, roots, combinatorics ($nCr, nPr$), linear regression, unit conversions, and date calculations.
