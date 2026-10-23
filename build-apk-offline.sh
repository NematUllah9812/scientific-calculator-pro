#!/usr/bin/env bash
# =============================================================================
#  Scientific Calculator Pro — offline APK build (no Android SDK required)
#
#  The regular pipeline (build-scientific-calculator-apk.sh) needs a full
#  Android SDK. This script assembles the very same APK from sources that can
#  be fetched without the SDK:
#
#    aapt2        npm package `aaptjs3` (prebuilt linux binary)
#    android.jar  GitHub API (Sable/android-platforms, API 34)
#    keytool      PyPI package `jdk4py` (Temurin JRE, ships keytool)
#    signer       npm package `apk_sign_ts` (v1 + v2 + v3, pure JS)
#
#  The DEX is reused from the previously shipped APK and patched in place
#  (same-length string swap + header checksum fix-up), so no dexer is needed.
#
#  Usage:  ./build-apk-offline.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$ROOT/calculator-app"
APP_DIR="$ROOT/AndroidStudioProject/app/src/main"
TOOLS="${APK_TOOLS:-$ROOT/.apktools}"
WORK="$TOOLS/work"
OUT="$ROOT/ScientificCalculatorPro.apk"
PREV_APK="${PREV_APK:-$TOOLS/previous.apk}"

KS_PASS="${KS_PASS:-calculator}"
KS_ALIAS="${KS_ALIAS:-calculator}"

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }

mkdir -p "$TOOLS" "$WORK"
cd "$TOOLS"

# ---------------------------------------------------------------- toolchain --
step "Fetching the offline toolchain (aapt2, signer, JDK, android.jar)"
if [ ! -d node_modules/aaptjs3 ]; then
  [ -f package.json ] || printf '{ "name": "apktools", "private": true, "type": "module" }\n' > package.json
  npm install aaptjs3 apk_sign_ts >/dev/null
fi
AAPT2="$TOOLS/node_modules/aaptjs3/bin/x64/linux/aapt2"
chmod +x "$AAPT2"

if [ ! -f "$TOOLS/android-34.jar" ]; then
  echo "  downloading android.jar (API 34) ..."
  curl -sL --max-time 600 \
    -H "Accept: application/vnd.github.raw" \
    -H "Authorization: token ${GITHUB_TOKEN:-$(gh auth token 2>/dev/null || echo)}" \
    "https://api.github.com/repos/Sable/android-platforms/contents/android-34/android.jar" \
    -o "$TOOLS/android-34.jar"
fi

if [ ! -x "$TOOLS/jdk/jdk4py/java-runtime/bin/keytool" ]; then
  echo "  downloading the Temurin runtime (jdk4py) ..."
  URL=$(curl -s --max-time 60 https://pypi.org/pypi/jdk4py/json | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(next(f['url'] for f in d['urls'] if 'manylinux_2_17_x86_64' in f['filename']))")
  curl -sL --max-time 900 "$URL" -o "$TOOLS/jdk4py.whl"
  mkdir -p "$TOOLS/jdk"
  python3 -c "import zipfile;zipfile.ZipFile('$TOOLS/jdk4py.whl').extractall('$TOOLS/jdk')"
  chmod +x "$TOOLS"/jdk/jdk4py/java-runtime/bin/*
fi
KEYTOOL="$TOOLS/jdk/jdk4py/java-runtime/bin/keytool"

# the helpers live in the repository; copy them next to the toolchain so that
# node resolves `apk_sign_ts` from $TOOLS/node_modules
cp "$ROOT/tools/apk-offline/"*.py "$ROOT/tools/apk-offline/"*.mjs "$WORK/"

# ------------------------------------------------------------------ web app --
step "Building the single-file web bundle (vite + singlefile)"
cd "$WEB_DIR"
[ -d node_modules ] || npm install >/dev/null
npx vite build >/dev/null
cp dist/index.html "$APP_DIR/assets/index.html"
python3 - "$APP_DIR/assets/index.html" <<'PY'
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
s = s.replace('<script type="module" crossorigin>', '<script>')
open(p, 'w', encoding='utf-8').write(s)
PY
echo "  assets/index.html  $(wc -c < "$APP_DIR/assets/index.html") bytes"

# ---------------------------------------------------------------- resources --
step "Compiling resources and linking the manifest (aapt2)"
cd "$WORK"
rm -f res.zip base.apk unsigned.apk
"$AAPT2" compile --dir "$APP_DIR/res" -o res.zip

python3 - "$APP_DIR/AndroidManifest.xml" <<'PY'
import sys
s = open(sys.argv[1], encoding='utf-8').read()
if 'package=' not in s.split('\n')[1]:
    s = s.replace('<manifest xmlns:android="http://schemas.android.com/apk/res/android">',
                  '<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n'
                  '    package="com.scientific.calculator.pro">')
open('AndroidManifest.xml', 'w', encoding='utf-8').write(s)
PY

"$AAPT2" link -o base.apk \
  -I "$TOOLS/android-34.jar" \
  --manifest AndroidManifest.xml \
  -A "$APP_DIR/assets" \
  --min-sdk-version 21 --target-sdk-version 34 \
  --version-code 31 --version-name 3.1 \
  res.zip

# --------------------------------------------------------------------- dex ---
step "Reusing and patching the DEX (no dexer available offline)"
# the DEX of the previously shipped APK is the source of truth; the very
# same class file is reused so the Activity never has to be recompiled
if [ ! -f "$PREV_APK" ] && [ -f "$ROOT/ScientificCalculatorPro.apk" ]; then
  PREV_APK="$ROOT/ScientificCalculatorPro.apk"
fi
echo "  extracting classes.dex from $PREV_APK"
unzip -o -j "$PREV_APK" classes.dex -d "$WORK" >/dev/null
python3 - "$WORK/classes.dex" "$WORK/classes.new.dex" <<'PY'
import hashlib, struct, sys, zlib
src, dst = sys.argv[1], sys.argv[2]
data = bytearray(open(src, 'rb').read())
old, new = b'#090B10', b'#000000'          # the WebView background colour
if old in data:
    data = bytearray(bytes(data).replace(old, new))
    data[12:32] = hashlib.sha1(bytes(data[32:])).digest()
    data[8:12] = struct.pack('<I', zlib.adler32(bytes(data[12:])) & 0xFFFFFFFF)
    open(dst, 'wb').write(bytes(data))
    print('  patched the WebView background colour')
else:
    open(dst, 'wb').write(bytes(data))
PY

cp base.apk unsigned.apk
python3 "$WORK/apktool.py" add-dex unsigned.apk classes.dex classes.new.dex

# ------------------------------------------------------------------- sign ---
step "Signing the APK (v1 + v2 + v3)"
if [ ! -f "$TOOLS/release.jks" ]; then
  "$KEYTOOL" -genkeypair -keystore "$TOOLS/release.jks" -alias "$KS_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$KS_PASS" -keypass "$KS_PASS" \
    -dname "CN=Scientific Calculator Pro, OU=Mobile, O=Calculator, L=Internet City, ST=NA, C=US" >/dev/null 2>&1
  echo "  created $TOOLS/release.jks (alias $KS_ALIAS, password $KS_PASS)"
fi
node "$WORK/sign.mjs" unsigned.apk "$OUT" "$TOOLS/release.jks" "$KS_PASS"

# ----------------------------------------------------------------- verify ---
step "Verifying the APK"
python3 "$WORK/verify-apk.py" "$OUT"
cp "$OUT" "$TOOLS/previous.apk"
printf '\n\033[1;32mAPK ready: %s (%s bytes)\033[0m\n' "$OUT" "$(wc -c < "$OUT")"
