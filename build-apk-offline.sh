#!/usr/bin/env bash
# SDK-free APK resource rebuild for Linux x86_64.
# Downloads a small toolchain on first use, then caches it in .apktools/.
# Reuses the existing native WebView DEX; Java changes require the full SDK
# pipeline (build-scientific-calculator-apk.sh or Android Studio).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$ROOT/calculator-app"
APP_DIR="$ROOT/AndroidStudioProject/app/src/main"
TOOLS="${APK_TOOLS:-$ROOT/.apktools}"
WORK="$TOOLS/work"
OUT="${APK_OUT:-$ROOT/ScientificCalculatorPro.apk}"
PREV_APK="${PREV_APK:-$TOOLS/previous.apk}"
# Default is for development/sideload builds only. Keep the private keystore
# backed up securely; future updates must use that same key.
KS_PASS="${KS_PASS:-calculator}"
KS_ALIAS="${KS_ALIAS:-calculator}"

step() { printf '\n==> %s\n' "$1"; }

if [ "$(uname -s)/$(uname -m)" != "Linux/x86_64" ]; then
  echo 'This SDK-free toolchain supports Linux x86_64 only.' >&2
  exit 1
fi

# Never silently ship an old native shell after the Java source changes.
cd "$ROOT"
sha256sum --check --status tools/apk-offline/host-source.sha256 || {
  echo 'Native Java changed. Rebuild with Android Studio or the full SDK script.' >&2
  exit 1
}

mkdir -p "$TOOLS" "$WORK"
cd "$TOOLS"
step 'Preparing aapt2, APK signer and signature verifier'
if [ ! -f node_modules/aaptjs3/bin/x64/linux/aapt2 ] || \
   [ ! -f node_modules/apk_sign_ts/dist/index.js ] || \
   [ ! -f node_modules/@postar/apktool-node/lib/apksigner.jar ]; then
  [ -f package.json ] || printf '{"name":"apktools","private":true,"type":"module"}\n' > package.json
  npm install --ignore-scripts --save-exact \
    aaptjs3@2.0.2 apk_sign_ts@1.0.1 @postar/apktool-node@0.3.4
fi
AAPT2="$TOOLS/node_modules/aaptjs3/bin/x64/linux/aapt2"
APKSIGNER="$TOOLS/node_modules/@postar/apktool-node/lib/apksigner.jar"
chmod +x "$AAPT2"

if [ ! -f "$TOOLS/android-34.jar" ]; then
  gh api -H 'Accept: application/vnd.github.raw' \
    repos/Sable/android-platforms/contents/android-34/android.jar \
    > "$TOOLS/android-34.jar"
fi
printf '%s  %s\n' \
  '6cea1df3efb77103ac3e2beb9bf4718964b0e0869ab16d39d29d5cbae1c147ad' \
  "$TOOLS/android-34.jar" | sha256sum --check --status

if [ ! -x "$TOOLS/jdk/jdk4py/java-runtime/bin/keytool" ]; then
  step 'Downloading the Temurin runtime (jdk4py 25.0.2.1)'
  curl --fail --silent --show-error --location --max-time 600 \
    'https://files.pythonhosted.org/packages/02/5a/b572f441714a420d65805cbf8806d9b78a8ab70060ed251310661c0b934c/jdk4py-25.0.2.1-py3-none-manylinux_2_17_x86_64.whl' \
    -o "$TOOLS/jdk4py.whl"
  printf '%s  %s\n' \
    '383d71d8639d072752d2eaafc84944e0d8de7f1c45d30c28f6dfef8a4a65543c' \
    "$TOOLS/jdk4py.whl" | sha256sum --check --status
  python3 - "$TOOLS/jdk4py.whl" "$TOOLS/jdk" <<'PY'
import sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as archive:
    archive.extractall(sys.argv[2])
PY
  chmod +x "$TOOLS"/jdk/jdk4py/java-runtime/bin/*
fi
JAVA="$TOOLS/jdk/jdk4py/java-runtime/bin/java"
KEYTOOL="$TOOLS/jdk/jdk4py/java-runtime/bin/keytool"
# Helpers must be beside the cached node_modules for JS dependency resolution.
cp "$ROOT/tools/apk-offline/"*.py "$ROOT/tools/apk-offline/"*.mjs "$WORK/"

step 'Building and syncing the single-file web app'
cd "$WEB_DIR"
[ -d node_modules ] || npm ci
npm run build
mkdir -p "$APP_DIR/assets"
python3 - "$WEB_DIR/dist/index.html" "$APP_DIR/assets/index.html" <<'PY'
import sys
from pathlib import Path
source = Path(sys.argv[1]).read_text(encoding='utf-8')
source = source.replace('<script type="module" crossorigin>', '<script>')
Path(sys.argv[2]).write_text(source, encoding='utf-8')
PY

step 'Compiling resources and linking the Android manifest'
cd "$WORK"
rm -f res.zip base.apk unsigned.apk
"$AAPT2" compile --dir "$APP_DIR/res" -o res.zip
python3 - "$APP_DIR/AndroidManifest.xml" <<'PY'
import sys
from pathlib import Path
source = Path(sys.argv[1]).read_text(encoding='utf-8')
if 'package=' not in source:
    source = source.replace(
        '<manifest xmlns:android="http://schemas.android.com/apk/res/android">',
        '<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n'
        '    package="com.scientific.calculator.pro">')
Path('AndroidManifest.xml').write_text(source, encoding='utf-8')
PY
# Keep version and SDK metadata in sync with Android Studio.
mapfile -t META < <(python3 - "$ROOT/AndroidStudioProject/app/build.gradle" <<'PY'
import re, sys
from pathlib import Path
source = Path(sys.argv[1]).read_text()
for pattern in (r'versionCode\s+(\d+)', r'versionName\s+"([^"]+)"',
                r'minSdk\s+(\d+)', r'targetSdk\s+(\d+)'):
    print(re.search(pattern, source).group(1))
PY
)
"$AAPT2" link -o base.apk -I "$TOOLS/android-34.jar" \
  --manifest AndroidManifest.xml -A "$APP_DIR/assets" \
  --version-code "${META[0]}" --version-name "${META[1]}" \
  --min-sdk-version "${META[2]}" --target-sdk-version "${META[3]}" res.zip

step 'Reusing the native WebView host'
if [ ! -f "$PREV_APK" ]; then
  PREV_APK="$ROOT/ScientificCalculatorPro.apk"
fi
unzip -o -j "$PREV_APK" classes.dex -d "$WORK"
python3 - "$WORK/classes.dex" "$WORK/classes.new.dex" <<'PY'
import sys
from pathlib import Path
from apktool import patch_dex
source, destination = map(Path, sys.argv[1:])
data = source.read_bytes()
if b'#090B10' in data:
    data = patch_dex(data, b'#090B10', b'#000000')
elif b'#000000' not in data:
    raise SystemExit('Unrecognized native shell: use the full SDK pipeline.')
destination.write_bytes(data)
PY
cp base.apk unsigned.apk
python3 "$WORK/apktool.py" add-dex unsigned.apk classes.dex classes.new.dex

step 'Signing with v1 + v2 + v3'
umask 077
if [ ! -f "$TOOLS/release.jks" ]; then
  "$KEYTOOL" -genkeypair -keystore "$TOOLS/release.jks" -alias "$KS_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$KS_PASS" -keypass "$KS_PASS" \
    -dname 'CN=Scientific Calculator Pro, OU=Mobile, O=Calculator, L=Internet City, ST=NA, C=US'
  echo "New development key: $TOOLS/release.jks — back it up privately."
fi
chmod 600 "$TOOLS/release.jks"
node "$WORK/sign.mjs" unsigned.apk "$WORK/candidate.apk" "$TOOLS/release.jks" "$KS_PASS"

step 'Checking payload integrity and cryptographically verifying signatures'
python3 "$WORK/verify-apk.py" "$WORK/candidate.apk"
"$JAVA" --enable-native-access=ALL-UNNAMED -jar "$APKSIGNER" \
  verify --verbose --print-certs "$WORK/candidate.apk"
"$AAPT2" dump badging "$WORK/candidate.apk"
# Do not replace the published APK until every check passes.
cp "$WORK/candidate.apk" "$OUT"
chmod 644 "$OUT"
cp "$OUT" "$TOOLS/previous.apk"
printf '\nAPK ready: %s (%s bytes)\n' "$OUT" "$(wc -c < "$OUT")"
sha256sum "$OUT"
