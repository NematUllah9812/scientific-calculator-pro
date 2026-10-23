#!/usr/bin/env python3
"""Verify a signed APK: v1 JAR digests, alignment, dex integrity, payload."""
import base64
import hashlib
import struct
import sys
import zipfile
import zlib

apk_path = sys.argv[1]
ok = True


def check(label, condition, extra=''):
    global ok
    status = 'PASS' if condition else 'FAIL'
    if not condition:
        ok = False
    print(f'[{status}] {label}' + (f' — {extra}' if extra else ''))


zf = zipfile.ZipFile(apk_path)
names = zf.namelist()

# --- v1 (JAR) signature digests -------------------------------------------
mf = zf.read('META-INF/MANIFEST.MF').decode('utf-8', 'replace')
sections = mf.split('\r\n\r\n') if '\r\n\r\n' in mf else mf.split('\n\n')
digests = {}
for block in sections:
    lines = [l for l in block.splitlines() if l.strip()]
    if not lines or not lines[0].startswith('Name:'):
        continue
    name = lines[0].split(':', 1)[1].strip()
    for line in lines[1:]:
        if line.lower().startswith('sha-256-digest:'):
            digests[name] = line.split(':', 1)[1].strip()
check('v1 manifest has digests', len(digests) > 0, f'{len(digests)} entries')

bad = []
for name, expected in digests.items():
    if name not in names:
        bad.append(f'{name} (missing)')
        continue
    actual = base64.b64encode(hashlib.sha256(zf.read(name)).digest()).decode()
    if actual != expected:
        bad.append(f'{name} (digest mismatch)')
check('v1 entry digests match the payload', not bad, ', '.join(bad[:4]))

# every non-signature entry must be listed in the manifest
listed = {n for n in digests}
missing = [n for n in names if not n.startswith('META-INF/') and n not in listed]
check('every payload entry is signed', not missing, ', '.join(missing[:4]))

# --- alignment of STORED entries ------------------------------------------
raw = open(apk_path, 'rb').read()
misaligned = []
for info in zf.infolist():
    if info.compress_type != zipfile.ZIP_STORED:
        continue
    if info.filename.startswith('META-INF/'):
        continue  # signature metadata, never mmap'd by the platform
    off = info.header_offset
    name_len, extra_len = struct.unpack('<HH', raw[off + 26:off + 30])
    data_off = off + 30 + name_len + extra_len
    if data_off % 4 != 0:
        misaligned.append(f'{info.filename}@{data_off}')
check('stored resources are 4-byte aligned', not misaligned, ', '.join(misaligned[:4]))
arsc_off = None
for info in zf.infolist():
    if info.filename == 'resources.arsc':
        off = info.header_offset
        nlen, elen = struct.unpack('<HH', raw[off + 26:off + 30])
        arsc_off = off + 30 + nlen + elen
check('resources.arsc is 4-byte aligned', arsc_off is not None and arsc_off % 4 == 0, f'offset {arsc_off}')

# --- dex integrity ---------------------------------------------------------
dex = zf.read('classes.dex')
check('dex magic', dex[:4] == b'dex\n', dex[:8].decode('latin1'))
sig_ok = dex[12:32] == hashlib.sha1(dex[32:]).digest()
cks_ok = struct.unpack('<I', dex[8:12])[0] == (zlib.adler32(dex[12:]) & 0xFFFFFFFF)
check('dex SHA-1 signature', sig_ok)
check('dex Adler-32 checksum', cks_ok)

# --- payload ---------------------------------------------------------------
asset = zf.read('assets/index.html')
check('web asset present', len(asset) > 100_000, f'{len(asset)} bytes')
check('web asset is a plain script (no ES modules)',
      b'<script type="module"' not in asset and b'<script>' in asset)
logo_markers = [m for m in (b'1.75', b'4.3', b'1.45', b'6.85', b'15.65') if m in asset]
check('web asset carries the new logo geometry', len(logo_markers) == 5, str(logo_markers))
check('web asset loads the calculator bundle', b'root' in asset)

# --- signing block ---------------------------------------------------------
check('APK Signature Scheme v2/v3 block', b'APK Sig Block 42' in raw)
check('v1 signature files', 'META-INF/CALCULAT.RSA' in names and 'META-INF/CALFULAT.SF' not in names)

print('\nRESULT:', 'ALL CHECKS PASSED' if ok else 'PROBLEMS FOUND')
sys.exit(0 if ok else 1)
