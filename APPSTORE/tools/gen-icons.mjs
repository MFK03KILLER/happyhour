// Regenerate the iOS app icons + splash screens for both apps.
//
// Usage (from repo root):
//   npm i sharp           # one-time, anywhere
//   node APPSTORE/tools/gen-icons.mjs
//
// Outputs (opaque PNGs, no alpha — Apple requirement):
//   customer-app/assets/{icon-only,splash,splash-dark}.png
//   merchant-app/assets/{icon-only,splash,splash-dark}.png
// Then on a Mac: `npx capacitor-assets generate --ios` expands them into the Xcode asset catalog.
//
// To change the brand mark, edit STAR (a 24x24 SVG path) and the gradient colors below.
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const STAR = 'M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z';
const root = (p) => fileURLToPath(new URL('../../' + p, import.meta.url));

const customerIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1F6F6F"/><stop offset="0.55" stop-color="#0E5C5C"/><stop offset="1" stop-color="#063838"/></linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.5"><stop offset="0" stop-color="#FF6B5B" stop-opacity="0.40"/><stop offset="1" stop-color="#FF6B5B" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <circle cx="512" cy="430" r="320" fill="url(#glow)"/>
  <g transform="translate(512 520) scale(27) translate(-12 -12)"><path d="${STAR}" fill="#FFFFFF"/></g>
</svg>`;
const customerSplash = (dark) => {
  const bg = dark
    ? '<rect width="2732" height="2732" fill="#063838"/>'
    : '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1F6F6F"/><stop offset="0.55" stop-color="#0E5C5C"/><stop offset="1" stop-color="#063838"/></linearGradient></defs><rect width="2732" height="2732" fill="url(#bg)"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">${bg}<g transform="translate(1366 1366) scale(38) translate(-12 -12)"><path d="${STAR}" fill="#FFFFFF"/></g></svg>`;
};
const merchantIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1E293B"/><stop offset="1" stop-color="#0F172A"/></linearGradient>
    <linearGradient id="star" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8A7B"/><stop offset="1" stop-color="#FF6B5B"/></linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <g stroke="#3A8A8A" stroke-width="26" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="250,336 250,250 336,250"/><polyline points="774,336 774,250 688,250"/>
    <polyline points="250,688 250,774 336,774"/><polyline points="774,688 774,774 688,774"/>
  </g>
  <g transform="translate(512 512) scale(24) translate(-12 -12)"><path d="${STAR}" fill="url(#star)"/></g>
</svg>`;
const merchantSplash = () => `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1E293B"/><stop offset="1" stop-color="#0F172A"/></linearGradient>
  <linearGradient id="star" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8A7B"/><stop offset="1" stop-color="#FF6B5B"/></linearGradient></defs>
  <rect width="2732" height="2732" fill="url(#bg)"/>
  <g transform="translate(1366 1366) scale(36) translate(-12 -12)"><path d="${STAR}" fill="url(#star)"/></g>
</svg>`;

const jobs = [
  { svg: customerIcon(),        out: root('customer-app/assets/icon-only.png'),   size: 1024, bg: '#0E5C5C' },
  { svg: customerSplash(false), out: root('customer-app/assets/splash.png'),      size: 2732, bg: '#0E5C5C' },
  { svg: customerSplash(true),  out: root('customer-app/assets/splash-dark.png'), size: 2732, bg: '#063838' },
  { svg: merchantIcon(),        out: root('merchant-app/assets/icon-only.png'),   size: 1024, bg: '#0F172A' },
  { svg: merchantSplash(),      out: root('merchant-app/assets/splash.png'),      size: 2732, bg: '#0F172A' },
  { svg: merchantSplash(),      out: root('merchant-app/assets/splash-dark.png'), size: 2732, bg: '#0F172A' },
];

for (const j of jobs) {
  await sharp(Buffer.from(j.svg)).resize(j.size, j.size).flatten({ background: j.bg }).png().toFile(j.out);
  console.log('wrote', j.out);
}
console.log('DONE');
