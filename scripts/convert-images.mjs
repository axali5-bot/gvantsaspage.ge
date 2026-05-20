import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

const QUALITY = 82;
const DIRS = ['public', 'public/images'];
const EXTS = new Set(['.jpg', '.jpeg', '.png']);

async function convert(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (!EXTS.has(ext)) return;
  const outPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  try {
    const info = await sharp(filePath).webp({ quality: QUALITY }).toFile(outPath);
    const src = await stat(filePath);
    const saved = (((src.size - info.size) / src.size) * 100).toFixed(1);
    console.log(`✓  ${basename(filePath)} → ${basename(outPath)} (${saved}% smaller)`);
  } catch (e) {
    console.error(`✗  ${basename(filePath)}: ${e.message}`);
  }
}

for (const dir of DIRS) {
  let files;
  try { files = await readdir(dir); } catch { continue; }
  for (const f of files) {
    const full = join(dir, f);
    const s = await stat(full).catch(() => null);
    if (s?.isFile()) await convert(full);
  }
}
