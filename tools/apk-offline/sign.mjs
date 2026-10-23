import { readFileSync, writeFileSync } from 'node:fs';
import { ApkSigner, SigningKey, convertToPEM } from 'apk_sign_ts';

const [,, inApk, outApk, keystore, password] = process.argv;

const ks = new Uint8Array(readFileSync(keystore));
const { privateKey, certificate } = await convertToPEM(ks, password, 'jks');

const signer = new ApkSigner({
  signingKey: SigningKey.fromPEM(privateKey, certificate),
  digestAlgorithm: 'SHA-256',
  jarKeyName: 'CALCULAT',
});

const apk = new Uint8Array(readFileSync(inApk));
const { signedApk, signatureSize } = await signer.sign(apk);
writeFileSync(outApk, signedApk);
console.log(`signed ${inApk} -> ${outApk} (${signedApk.length} bytes, signature block ${signatureSize})`);
