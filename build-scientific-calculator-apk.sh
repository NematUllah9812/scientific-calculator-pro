#!/usr/bin/env bash
# =============================================================================
#  Scientific Calculator Pro — master build script
#  Builds the React/Vite single-file bundle, packages it into a native Android
#  WebView shell, then aligns and signs a distributable APK.
#
#  Pipeline: vite build -> script normalization -> asset sync -> aapt2 compile
#            -> aapt2 link -> javac -> d8 -> zip dex -> zipalign -> keytool
#            -> apksigner sign -> apksigner verify -> Studio project ZIP
#
#  Requires: Node 18+, JDK 17+, Android SDK build-tools 34 + platform 34
# =============================================================================
set -euo pipefail

# ----------------------------- configuration --------------------------------
ROOT="${ROOT:-/home/user}"
WEB_DIR="$ROOT/calculator-app"
STUDIO_DIR="$ROOT/AndroidStudioProject"
APP_DIR="$STUDIO_DIR/app/src/main"
WORK="$ROOT/.apkbuild"

JAVA_HOME="${JAVA_HOME:-/opt/tools/jdk-21.0.5+11}"
ANDROID_HOME="${ANDROID_HOME:-/opt/tools/android-sdk}"
BT="$ANDROID_HOME/build-tools/34.0.0"
ANDROID_JAR="$ANDROID_HOME/platforms/android-34/android.jar"
export JAVA_HOME ANDROID_HOME
export PATH="$JAVA_HOME/bin:$BT:$PATH"

APK_OUT="$ROOT/ScientificCalculatorPro.apk"
ZIP_OUT="$ROOT/ScientificCalculatorPro_AndroidStudio.zip"
KEYSTORE="$STUDIO_DIR/release.keystore"
KS_PASS="calculator"
KS_ALIAS="calculator"

step() { printf '\n\033[1;36m==> [%s/14] %s\033[0m\n' "$1" "$2"; }

# --------------------------- 1. frontend build ------------------------------
step 1 "Compiling React frontend (vite build + singlefile)"
cd "$WEB_DIR"
npm run build

# ------------------- 2. universal script normalization ----------------------
step 2 "Normalizing <script type=\"module\"> for file:// loading"
python3 - "$WEB_DIR/dist/index.html" <<'PY'
import re, sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
s = s.replace('<script type="module" crossorigin>', '<script>')
s = re.sub(r'<script\s+type="module"\s*>', '<script>', s)
s = re.sub(r'<script\s+type="module"\s+crossorigin\s*>', '<script>', s)
s = s.replace(' crossorigin>', '>')
open(p, 'w', encoding='utf-8').write(s)
print('   normalized ->', p, len(s), 'bytes')
PY

# ------------------------- 3. asset synchronization -------------------------
step 3 "Syncing bundle into Android assets"
mkdir -p "$APP_DIR/assets"
cp "$WEB_DIR/dist/index.html" "$APP_DIR/assets/index.html"
ls -la "$APP_DIR/assets/index.html"

# ------------------------- 4. aapt2 resource compile ------------------------
step 4 "AAPT2 compiling resources"
rm -rf "$WORK"
mkdir -p "$WORK/compiled" "$WORK/gen" "$WORK/classes"
"$BT/aapt2" compile --dir "$APP_DIR/res" -o "$WORK/compiled_res.zip"

# AGP 8 declares the application id via `namespace` in build.gradle, so the
# checked-in manifest has no package= attribute. Raw aapt2 still requires one,
# so synthesize a manifest copy that carries it.
python3 - "$APP_DIR/AndroidManifest.xml" "$WORK/AndroidManifest.xml" <<'PY'
import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
if 'package=' not in s:
    s = s.replace(
        '<manifest xmlns:android="http://schemas.android.com/apk/res/android">',
        '<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n'
        '    package="com.scientific.calculator.pro">')
open(dst, 'w', encoding='utf-8').write(s)
print('   synthesized manifest ->', dst)
PY

# -------------------------- 5. aapt2 resource link --------------------------
step 5 "AAPT2 linking resources -> unaligned.apk"
"$BT/aapt2" link \
  -o "$WORK/unaligned.apk" \
  -I "$ANDROID_JAR" \
  --manifest "$WORK/AndroidManifest.xml" \
  -A "$APP_DIR/assets" \
  --java "$WORK/gen" \
  --min-sdk-version 21 \
  --target-sdk-version 34 \
  --version-code 30 \
  --version-name "3.0" \
  --auto-add-overlay \
  "$WORK/compiled_res.zip"

# ---------------------------- 6. java compilation ---------------------------
step 6 "Compiling Java sources (--release 8)"
find "$APP_DIR/java" "$WORK/gen" -name '*.java' > "$WORK/sources.txt"
"$JAVA_HOME/bin/javac" \
  --release 8 \
  -Xlint:-options \
  -classpath "$ANDROID_JAR" \
  -d "$WORK/classes" \
  @"$WORK/sources.txt"

# ------------------------------- 7. d8 dexing -------------------------------
step 7 "D8 dexing .class -> classes.dex"
CLASSES=$(find "$WORK/classes" -name '*.class')
"$BT/d8" --release --min-api 21 --lib "$ANDROID_JAR" --output "$WORK" $CLASSES

# ---------------------------- 8. dex packaging ------------------------------
step 8 "Packaging classes.dex into the APK"
( cd "$WORK" && zip -q -u unaligned.apk classes.dex )

# ------------------------------- 9. zipalign --------------------------------
step 9 "Zipalign (4-byte boundaries)"
"$BT/zipalign" -f -p 4 "$WORK/unaligned.apk" "$WORK/aligned.apk"

# --------------------------- 10. keystore creation --------------------------
step 10 "Ensuring release keystore exists"
if [ ! -f "$KEYSTORE" ]; then
  "$JAVA_HOME/bin/keytool" -genkeypair \
    -keystore "$KEYSTORE" \
    -alias "$KS_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10950 \
    -storepass "$KS_PASS" -keypass "$KS_PASS" \
    -dname "CN=Scientific Calculator Pro, OU=Mobile, O=Calculator Pro, L=Abbottabad, ST=KP, C=PK"
  echo "   created $KEYSTORE"
else
  echo "   reusing $KEYSTORE"
fi

# ---------------------------- 11. apksigner sign ----------------------------
step 11 "Signing APK (v1 + v2 + v3)"
"$BT/apksigner" sign \
  --ks "$KEYSTORE" \
  --ks-pass "pass:$KS_PASS" \
  --key-pass "pass:$KS_PASS" \
  --ks-key-alias "$KS_ALIAS" \
  --v1-signing-enabled true \
  --v2-signing-enabled true \
  --v3-signing-enabled true \
  --out "$APK_OUT" \
  "$WORK/aligned.apk"

# --------------------------- 12. signature verify ---------------------------
step 12 "Verifying signatures"
"$BT/apksigner" verify --verbose --print-certs "$APK_OUT" | head -20

# ------------------------ 13. Android Studio ZIP ----------------------------
step 13 "Archiving Android Studio project"
rm -f "$ZIP_OUT"
cd "$ROOT"
zip -qr "$ZIP_OUT" AndroidStudioProject \
  -x '*/build/*' '*/.gradle/*' '*.iml' '*/local.properties'
zip -qr "$ZIP_OUT" calculator-app \
  -x 'calculator-app/node_modules/*' 'calculator-app/dist/*' 'calculator-app/.vite/*'
zip -q "$ZIP_OUT" README.md build-scientific-calculator-apk.sh 2>/dev/null || true
zip -qj "$ZIP_OUT" uploads/MASTER_BLUEPRINT.md 2>/dev/null || true

# --------------- 14. Publish artifacts next to the served bundle -------------
# `vite preview` serves calculator-app/dist, and the in-app download modal links
# to ./ScientificCalculatorPro.apk and ./ScientificCalculatorPro_AndroidStudio.zip
step 14 "Publishing artifacts into the served web root"
cp -f "$APK_OUT" "$ZIP_OUT" "$ROOT/calculator-app/dist/"
ls -lh "$ROOT/calculator-app/dist/" | sed 's/^/   /'

printf '\n\033[1;32m✔ BUILD COMPLETE\033[0m\n'
ls -lh "$APK_OUT" "$ZIP_OUT"
