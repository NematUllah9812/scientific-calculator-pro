// Extracts the bundled AL2023 shared libs (libnspr4, libnss3, …) into /tmp/al2023
// so the @sparticuz/chromium binary can launch outside Amazon Linux.
import sparticuz from '@sparticuz/chromium';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { inflate } = sparticuz;

const bin = join(dirname(fileURLToPath(import.meta.url)), '..', 'node_modules/@sparticuz/chromium/bin');
const out = await inflate(join(bin, 'al2023.tar.br'));
console.log('extracted libs to', out);
