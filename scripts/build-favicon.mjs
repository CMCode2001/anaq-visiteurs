/**
 * Genere `public/favicon-anaq-clair.png` a partir de `public/favicon_anaq.png`.
 *
 * Le favicon fourni est blanc sur fond transparent : parfait sur une barre
 * d onglets sombre, invisible sur une barre claire. On en compose donc une
 * variante sur le marine institutionnel, servie aux navigateurs en theme
 * clair via `media="(prefers-color-scheme: light)"`.
 *
 * Execute par `npm install` (script postinstall), donc aussi sur Vercel.
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const SOURCE = path.join(process.cwd(), "public", "favicon_anaq.png");
const TARGET = path.join(process.cwd(), "public", "favicon-anaq-clair.png");

/** Marine institutionnel ANAQ-Sup (#042244). */
const FOND = [4, 34, 68];

function lirePng(buf) {
  let pos = 8;
  const idat = [];
  let w = 0, h = 0, colorType = 0, bitDepth = 0;

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9];
    }
    if (type === "IDAT") idat.push(data);
    if (type === "IEND") break;
    pos += 12 + len;
  }

  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`format non gere : profondeur ${bitDepth}, type ${colorType} (attendu 8 / RGBA)`);
  }

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * 4;
  const px = Buffer.alloc(h * stride);
  let prev = Buffer.alloc(stride);

  for (let y = 0; y < h; y++) {
    const filtre = raw[y * (stride + 1)];
    const ligne = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const out = px.subarray(y * stride, (y + 1) * stride);

    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? out[i - 4] : 0;
      const b = prev[i];
      const c = i >= 4 ? prev[i - 4] : 0;
      let v = ligne[i];
      if (filtre === 1) v += a;
      else if (filtre === 2) v += b;
      else if (filtre === 3) v += (a + b) >> 1;
      else if (filtre === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[i] = v & 255;
    }
    prev = out;
  }

  return { w, h, px };
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const corps = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(corps) >>> 0);
  return Buffer.concat([len, corps, crc]);
}

function ecrirePngRgb(w, h, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // profondeur
  ihdr[9] = 2;  // RGB

  const stride = w * 3;
  const brut = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    brut[y * (stride + 1)] = 0; // filtre « aucun »
    rgb.copy(brut, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(brut, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

try {
  const { w, h, px } = lirePng(fs.readFileSync(SOURCE));
  const rgb = Buffer.alloc(w * h * 3);

  for (let i = 0, j = 0; i < px.length; i += 4, j += 3) {
    const alpha = px[i + 3] / 255;
    // Composition classique « source over » sur le fond marine.
    rgb[j] = Math.round(px[i] * alpha + FOND[0] * (1 - alpha));
    rgb[j + 1] = Math.round(px[i + 1] * alpha + FOND[1] * (1 - alpha));
    rgb[j + 2] = Math.round(px[i + 2] * alpha + FOND[2] * (1 - alpha));
  }

  fs.writeFileSync(TARGET, ecrirePngRgb(w, h, rgb));
  console.log(`[favicon] variante fond marine generee (${w}x${h})`);
} catch (error) {
  // Un echec ici ne doit pas casser l installation : le favicon transparent
  // reste servi, simplement peu visible sur les themes clairs.
  console.warn(
    "[favicon] generation impossible :",
    error instanceof Error ? error.message : error,
  );
}
