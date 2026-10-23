#!/usr/bin/env python3
"""
Offline APK assembler (no Android SDK required).

  * patches the DEX string pool (same-length replacement only)
  * re-computes the DEX header SHA-1 signature and Adler-32 checksum
  * injects the DEX into the APK as a STORED, 4-byte aligned entry
"""
import hashlib
import struct
import sys
import zlib
import zipfile


def patch_dex(data: bytes, old: bytes, new: bytes) -> bytes:
    if len(old) != len(new):
        raise SystemExit('patch strings must have the same length')
    if data.count(old) != 1:
        raise SystemExit(f'expected exactly one occurrence of {old!r}, found {data.count(old)}')
    out = bytearray(data.replace(old, new))
    # DEX header: signature = SHA-1 over bytes [32:], checksum = Adler-32 over bytes [12:]
    out[12:32] = hashlib.sha1(bytes(out[32:])).digest()
    out[8:12] = struct.pack('<I', zlib.adler32(bytes(out[12:])) & 0xFFFFFFFF)
    return bytes(out)


def add_stored_aligned(apk_path: str, entry: str, blob: bytes):
    """Append a STORED entry whose data starts on a 4 byte boundary."""
    with zipfile.ZipFile(apk_path, 'r') as zf:
        infos = zf.infolist()
        data = {i.filename: zf.read(i.filename) for i in infos}

    # rebuild the archive, keeping the original entry order
    with zipfile.ZipFile(apk_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for info in infos:
            zi = zipfile.ZipInfo(info.filename, date_time=(1980, 1, 1, 0, 0, 0))
            zi.compress_type = info.compress_type
            zi.external_attr = info.external_attr
            zi.create_system = 0
            payload = data[info.filename]
            if info.compress_type == zipfile.ZIP_STORED:
                zi.file_size = len(payload)
            zf.writestr(zi, payload)

        zi = zipfile.ZipInfo(entry, date_time=(1980, 1, 1, 0, 0, 0))
        zi.compress_type = zipfile.ZIP_STORED
        zi.external_attr = 0
        zi.create_system = 0
        zi.file_size = len(blob)
        # pad the local header so the payload starts 4-byte aligned
        zf.start_dir = zf.fp.tell()
        zf.writestr(zi, blob)

    # fix the alignment of the stored entry (rewrite with padding in `extra`)
    align_zip(apk_path, entry)


def align_zip(apk_path: str, entry: str):
    """Rewrite the archive so the STORED `entry` payload is 4-byte aligned."""
    with zipfile.ZipFile(apk_path, 'r') as zf:
        infos = zf.infolist()
        payload = {i.filename: zf.read(i.filename) for i in infos}

    with zipfile.ZipFile(apk_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for info in infos:
            zi = zipfile.ZipInfo(info.filename, date_time=(1980, 1, 1, 0, 0, 0))
            zi.compress_type = info.compress_type
            zi.external_attr = info.external_attr
            zi.create_system = 0
            body = payload[info.filename]
            if info.compress_type == zipfile.ZIP_STORED:
                zi.file_size = len(body)
                # the local header is 30 bytes + name + extra; pad so the
                # payload itself starts on a 4 byte boundary
                name_len = len(zi.filename.encode('utf-8'))
                pos = zf.fp.tell()
                pad = (-(pos + 30 + name_len)) % 4
                if pad:
                    zi.extra = b'\x00' * pad
            zf.writestr(zi, body)


if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'patch-dex':
        src, dst, old, new = sys.argv[2], sys.argv[3], sys.argv[4].encode(), sys.argv[5].encode()
        blob = patch_dex(open(src, 'rb').read(), old, new)
        open(dst, 'wb').write(blob)
        print(f'patched {src} -> {dst} ({old.decode()} -> {new.decode()})')
    elif mode == 'add-dex':
        apk, entry, dex = sys.argv[2], sys.argv[3], sys.argv[4]
        add_stored_aligned(apk, entry, open(dex, 'rb').read())
        print(f'added {entry} to {apk}')
    else:
        raise SystemExit('usage: apktool.py patch-dex|add-dex ...')
