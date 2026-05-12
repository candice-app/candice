import { createRequire } from "module";
import { existsSync, mkdirSync, writeFileSync, createWriteStream, readFileSync } from "fs";
import path from "path";
import https from "https";
import http from "http";

const require = createRequire(import.meta.url);
const opentype = require("opentype.js");
const sharp = require("sharp");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "public", "icons");
const FONT_CACHE = path.join(ROOT, ".cache", "PlayfairDisplay-Italic.ttf");
const FONT_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/PlayfairDisplay-Italic%5Bwght%5D.ttf";

const TERRA = "#C47A4A";
const CREAM = "#FAF7F2";

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    mkdirSync(path.dirname(dest), { recursive: true });
    const file = createWriteStream(dest);

    function doGet(u) {
      const mod = u.startsWith("https") ? https : http;
      mod.get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          doGet(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${u}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      }).on("error", reject);
    }
    doGet(url);
  });
}

function extractGlyphPath(fontPath, char, x, y, fontSize) {
  const buf = readFileSync(fontPath);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const glyph = font.charToGlyph(char);
  const p = glyph.getPath(x, y, fontSize);
  const svgStr = p.toSVG(2);
  const match = svgStr.match(/d="([^"]+)"/);
  if (!match) throw new Error("No path data found in glyph SVG");
  return match[1];
}

// Build SVG at `size`×`size`. The glyph path is extracted at 100×100 base,
// so we use a transform to scale it up.
function buildSVG(size, glyphD) {
  const s = size / 100;
  const r = Math.round(size * 0.2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${TERRA}"/>
  <g transform="scale(${s})">
    <path d="${glyphD}" fill="${CREAM}"/>
    <circle cx="78" cy="68" r="9" fill="${CREAM}"/>
  </g>
</svg>`;
}

function buildIco(pngBufs, sizes) {
  const count = pngBufs.length;
  const headerSize = 6;
  const dirSize = count * 16;
  const totalHeader = headerSize + dirSize;

  let offset = totalHeader;
  const offsets = pngBufs.map((buf) => {
    const o = offset;
    offset += buf.length;
    return o;
  });

  const ico = Buffer.alloc(offset);
  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(count, 4);

  for (let i = 0; i < count; i++) {
    const base = headerSize + i * 16;
    const sz = sizes[i] >= 256 ? 0 : sizes[i];
    ico.writeUInt8(sz, base);
    ico.writeUInt8(sz, base + 1);
    ico.writeUInt8(0, base + 2);
    ico.writeUInt8(0, base + 3);
    ico.writeUInt16LE(1, base + 4);
    ico.writeUInt16LE(32, base + 6);
    ico.writeUInt32LE(pngBufs[i].length, base + 8);
    ico.writeUInt32LE(offsets[i], base + 12);
  }

  let pos = totalHeader;
  for (const buf of pngBufs) {
    buf.copy(ico, pos);
    pos += buf.length;
  }

  return ico;
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  if (!existsSync(FONT_CACHE)) {
    console.log("Downloading Playfair Display Italic…");
    await downloadFile(FONT_URL, FONT_CACHE);
    console.log("Font downloaded.");
  } else {
    console.log("Font cache found.");
  }

  console.log("Extracting glyph path for 'C'…");
  // Extract at 100×100 base: x=42, y=74, fontSize=80
  const glyphD = extractGlyphPath(FONT_CACHE, "C", 42, 74, 80);
  console.log(`Glyph path extracted (${glyphD.length} chars).`);

  const sizes = [16, 32, 48, 180, 192, 512];
  const pngMap = {};

  for (const size of sizes) {
    const svg = buildSVG(size, glyphD);
    const buf = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toBuffer();
    pngMap[size] = buf;
    console.log(`  ${size}×${size} PNG — ${buf.length} bytes`);
  }

  writeFileSync(path.join(OUT, "favicon-16x16.png"), pngMap[16]);
  writeFileSync(path.join(OUT, "favicon-32x32.png"), pngMap[32]);
  writeFileSync(path.join(OUT, "apple-touch-icon.png"), pngMap[180]);
  writeFileSync(path.join(OUT, "icon-192x192.png"), pngMap[192]);
  writeFileSync(path.join(OUT, "icon-512x512.png"), pngMap[512]);

  const ico = buildIco([pngMap[16], pngMap[32], pngMap[48]], [16, 32, 48]);
  writeFileSync(path.join(ROOT, "public", "favicon.ico"), ico);
  console.log("favicon.ico written.");

  const iconSvg = buildSVG(100, glyphD);
  writeFileSync(path.join(OUT, "icon.svg"), iconSvg);

  console.log("\nDone:");
  console.log("  public/favicon.ico");
  console.log("  public/icons/favicon-16x16.png");
  console.log("  public/icons/favicon-32x32.png");
  console.log("  public/icons/apple-touch-icon.png");
  console.log("  public/icons/icon-192x192.png");
  console.log("  public/icons/icon-512x512.png");
  console.log("  public/icons/icon.svg");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
