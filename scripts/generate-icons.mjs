// Generates PWA icons, maskable icons, apple-touch-icon, badge and iOS splash screens from SVG.
// Run: npm run icons
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const BRAND = "#8B2CF5";
const CORAL = "#D946EF";
const BG = "#07050B";
const INK = "#F7F2FF";

// Cherrymate mark — white cherries inside soft radar rings, on an electric-violet gradient
const mark = (s = 1) => `
  <g transform="translate(256 256) scale(${s}) translate(-256 -256)" fill="none">
    <circle cx="256" cy="268" r="200" stroke="#fff" stroke-opacity=".16" stroke-width="10"/>
    <circle cx="256" cy="268" r="140" stroke="#fff" stroke-opacity=".26" stroke-width="10"/>
    <path d="M206 300 C 220 220, 250 170, 300 130" stroke="#fff" stroke-width="20" stroke-linecap="round"/>
    <path d="M318 300 C 312 230, 305 180, 300 130" stroke="#fff" stroke-width="20" stroke-linecap="round"/>
    <path d="M300 130 C 330 100, 380 100, 400 120 C 370 150, 330 155, 300 130 Z" fill="#fff"/>
    <circle cx="196" cy="334" r="62" fill="#fff"/>
    <circle cx="326" cy="334" r="62" fill="#fff"/>
    <circle cx="176" cy="314" r="13" fill="${BRAND}" opacity=".45"/>
    <circle cx="306" cy="314" r="13" fill="${BRAND}" opacity=".45"/>
  </g>`;

const defs = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="${BRAND}"/><stop offset="1" stop-color="${CORAL}"/></linearGradient></defs>`;

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}
  <rect width="512" height="512" rx="112" fill="url(#g)"/>${mark(0.95)}</svg>`;
// Maskable: full-bleed, mark inside the 80% safe zone
const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}
  <rect width="512" height="512" fill="url(#g)"/>${mark(0.72)}</svg>`;
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}
  <rect width="512" height="512" fill="url(#g)"/>${mark(0.85)}</svg>`;
const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g fill="#000">
  <circle cx="196" cy="334" r="70"/><circle cx="326" cy="334" r="70"/>
  <path d="M206 300 C 220 220, 250 170, 300 130 M318 300 C 312 230, 305 180, 300 130" stroke="#000" stroke-width="26" fill="none" stroke-linecap="round"/>
  <path d="M300 130 C 330 100, 380 100, 400 120 C 370 150, 330 155, 300 130 Z"/></g></svg>`;

mkdirSync("public/icons", { recursive: true });
mkdirSync("public/splash", { recursive: true });

const out = (svg, size, file) => sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);

await Promise.all([
  out(iconSvg, 192, "public/icons/icon-192.png"),
  out(iconSvg, 512, "public/icons/icon-512.png"),
  out(maskSvg, 192, "public/icons/maskable-192.png"),
  out(maskSvg, 512, "public/icons/maskable-512.png"),
  out(appleSvg, 180, "public/icons/apple-touch-icon.png"),
  out(badgeSvg, 72, "public/icons/badge-72.png"),
  out(iconSvg, 48, "public/favicon.png"),
]);
await sharp(Buffer.from(iconSvg)).resize(32, 32).toFile("public/favicon.ico").catch(() => {});

// Keep in sync with lib/pwa.ts
const SPLASH = [
  [430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3], [375, 812, 3], [414, 896, 3],
  [414, 896, 2], [375, 667, 2], [1024, 1366, 2], [834, 1194, 2], [820, 1180, 2],
];
for (const [w, h, r] of SPLASH) {
  const W = w * r, H = h * r, s = Math.round(Math.min(W, H) * 0.28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="100%" height="100%" fill="${BG}"/>
    <svg x="${(W - s) / 2}" y="${(H - s) / 2 - s * 0.2}" width="${s}" height="${s}" viewBox="0 0 512 512">${defs}
      <rect width="512" height="512" rx="112" fill="url(#g)"/>${mark(0.95)}</svg>
    <text x="50%" y="${(H + s) / 2 + s * 0.12}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
      font-weight="700" font-size="${Math.round(s * 0.22)}" fill="${INK}">Cherrymate</text>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`public/splash/apple-splash-${W}x${H}.png`);
}
console.log("✓ icons + splash screens generated");
