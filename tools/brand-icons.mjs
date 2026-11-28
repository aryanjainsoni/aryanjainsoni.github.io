// Regenerates the Ascent brand mark + every icon from code: node tools/brand-icons.mjs (run from the repo root).
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
const INK = '#f3ece4', BG = '#0e0b0a';
const defs = (p) => `<linearGradient id="${p}g" gradientUnits="userSpaceOnUse" x1="22" y1="80" x2="70" y2="10"><stop offset="0" stop-color="#e23d6d"/><stop offset=".55" stop-color="#f0794c"/><stop offset="1" stop-color="#ffc46b"/></linearGradient>
<mask id="${p}m" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><path d="M22 76 L50 10 L78 76" fill="none" stroke="#000" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></mask>`;
const S = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
// the mark itself, in a 100x100 box. ink = ring + trail colour
export const mark = (p, ink) => `<circle cx="50" cy="56" r="34" ${S} stroke="${ink}" stroke-width="6" mask="url(#${p}m)"/>
<path d="M22 76 L50 10 L78 76" ${S} stroke="url(#${p}g)" stroke-width="9"/>
<path d="M32 62 L42 55 L50 59 L62 48" ${S} stroke="${ink}" stroke-width="4.5"/>
<circle cx="62" cy="48" r="4.5" fill="${ink}"/>`;
// tile icon: dark background + soft ember glow + mark scaled to `scale` of the tile
const tile = (scale, radius) => {
  const off = (100 - 100 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${defs('a')}<radialGradient id="glow" cx="50%" cy="42%" r="55%"><stop offset="0" stop-color="#e2552f" stop-opacity=".22"/><stop offset="1" stop-color="#e2552f" stop-opacity="0"/></radialGradient></defs>
<rect width="100" height="100" rx="${radius}" fill="${BG}"/><rect width="100" height="100" rx="${radius}" fill="url(#glow)"/>
<g transform="translate(${off} ${off - 2 * scale}) scale(${scale})">${mark('a', INK)}</g></svg>`;
};
const out = 'public';
const fav = tile(0.84, 22);
writeFileSync(`${out}/favicon.svg`, fav);
writeFileSync(`${out}/brand/ascent-mark.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${defs('a')}</defs>${mark('a', INK)}</svg>`);
writeFileSync(`${out}/brand/ascent-mark-ink.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${defs('a')}</defs>${mark('a', '#1c1512')}</svg>`);
const png = (svg, size, file) => sharp(Buffer.from(svg), { density: Math.ceil(72 * size / 100) * 2 }).resize(size, size).png({ compressionLevel: 9 }).toFile(file);
await png(fav, 32, `${out}/icons/favicon-32.png`);

await png(tile(0.66, 0), 180, `${out}/icons/apple-touch-icon.png`);
await png(tile(0.70, 22), 192, `${out}/icons/icon-192.png`);
await png(tile(0.70, 22), 512, `${out}/icons/icon-512.png`);
await png(tile(0.56, 0), 512, `${out}/icons/icon-maskable-512.png`);
// favicon.ico (PNG-in-ICO, 32px)
const p32 = await sharp(Buffer.from(fav), { density: 200 }).resize(32, 32).png().toBuffer();
const h = Buffer.alloc(22); h.writeUInt16LE(0, 0); h.writeUInt16LE(1, 2); h.writeUInt16LE(1, 4);
h.writeUInt8(32, 6); h.writeUInt8(32, 7); h.writeUInt16LE(1, 10); h.writeUInt16LE(32, 12); h.writeUInt32LE(p32.length, 14); h.writeUInt32LE(22, 18);
writeFileSync(`${out}/favicon.ico`, Buffer.concat([h, p32]));
// social share image 1200x630
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs>${defs('a')}<radialGradient id="glow" cx="30%" cy="45%" r="60%"><stop offset="0" stop-color="#e2552f" stop-opacity=".25"/><stop offset="1" stop-color="#e2552f" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="630" fill="${BG}"/><rect width="1200" height="630" fill="url(#glow)"/>
<g transform="translate(120 150) scale(3.3)">${mark('a', INK)}</g>
<text x="520" y="300" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="120" letter-spacing="-3" fill="${INK}">Ascent<tspan fill="#f0794c">.</tspan></text>
<text x="526" y="370" font-family="Inter, Helvetica, Arial, sans-serif" font-size="30" fill="#b9ada3">Aryan Jain · learning out loud, one step a day</text>
<path d="M526 420 L1080 420" stroke="#2a211d" stroke-width="2"/>
<text x="526" y="468" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" letter-spacing="5" fill="#f0794c">ARYANJAINSONI.GITHUB.IO</text></svg>`;
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(`${out}/brand/og.png`);
console.log('done');
