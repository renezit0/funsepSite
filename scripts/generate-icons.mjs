import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const srcArg = process.argv[2];
const sourceSvg = srcArg
  ? path.resolve(process.cwd(), srcArg)
  : path.join(root, 'public', 'images', 'logo-funsep-completa.svg');

const electronDir = path.join(root, 'electron', 'icons');
const publicIconsDir = path.join(root, 'public', 'icons');

const ensureDir = async (dir) => fs.mkdir(dir, { recursive: true });

const renderPng = async (size) => {
  const target = path.join(root, '.tmp-icons', `icon-${size}.png`);
  await sharp(sourceSvg, { density: 700 })
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(target);
  return target;
};

const safeUnlink = async (p) => {
  try { await fs.unlink(p); } catch {}
};

const run = async () => {
  await fs.access(sourceSvg);
  await ensureDir(electronDir);
  await ensureDir(publicIconsDir);
  await ensureDir(path.join(root, '.tmp-icons'));

  const [p16, p24, p32, p48, p64, p128, p180, p192, p256, p512, p1024] = await Promise.all([
    renderPng(16),
    renderPng(24),
    renderPng(32),
    renderPng(48),
    renderPng(64),
    renderPng(128),
    renderPng(180),
    renderPng(192),
    renderPng(256),
    renderPng(512),
    renderPng(1024),
  ]);

  await Promise.all([
    fs.copyFile(p512, path.join(electronDir, 'icon.png')),
    fs.copyFile(p512, path.join(electronDir, 'icon-512.png')),
    fs.copyFile(p192, path.join(publicIconsDir, 'icon-192.png')),
    fs.copyFile(p512, path.join(publicIconsDir, 'icon-512.png')),
    fs.copyFile(p512, path.join(publicIconsDir, 'icon-512-maskable.png')),
    fs.copyFile(p180, path.join(publicIconsDir, 'apple-touch-icon.png')),
    fs.copyFile(p512, path.join(root, 'public', 'favicon.png')),
  ]);

  const icoBuffer = await pngToIco([p16, p24, p32, p48, p64, p128, p256]);
  await fs.writeFile(path.join(electronDir, 'icon.ico'), icoBuffer);
  await fs.writeFile(path.join(root, 'public', 'favicon.ico'), icoBuffer);

  // macOS icns (best effort)
  if (process.platform === 'darwin') {
    const iconsetDir = path.join(electronDir, 'icon.iconset');
    await fs.rm(iconsetDir, { recursive: true, force: true });
    await ensureDir(iconsetDir);

    const iconset = [
      ['icon_16x16.png', p16],
      ['icon_16x16@2x.png', p32],
      ['icon_32x32.png', p32],
      ['icon_32x32@2x.png', p64],
      ['icon_128x128.png', p128],
      ['icon_128x128@2x.png', p256],
      ['icon_256x256.png', p256],
      ['icon_256x256@2x.png', p512],
      ['icon_512x512.png', p512],
      ['icon_512x512@2x.png', p1024],
    ];

    await Promise.all(iconset.map(([name, src]) => fs.copyFile(src, path.join(iconsetDir, name))));

    try {
      await execFileAsync('iconutil', ['-c', 'icns', iconsetDir, '-o', path.join(electronDir, 'icon.icns')]);
    } catch {
      // ignore on environments without iconutil
    }
  }

  await Promise.all([p16, p24, p32, p48, p64, p128, p180, p192, p256, p512, p1024].map(safeUnlink));
  await fs.rm(path.join(root, '.tmp-icons'), { recursive: true, force: true });

  console.log('Icones gerados com sucesso');
};

run().catch((error) => {
  console.error('Falha ao gerar icones:', error.message || error);
  process.exit(1);
});
