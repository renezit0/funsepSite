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
const defaultSources = [
  path.join(root, 'public', 'favicon.svg'),
  path.join(root, 'public', 'images', 'logo-funsep-completa.svg'),
];

const resolveSourceSvg = async () => {
  if (srcArg) {
    return path.resolve(process.cwd(), srcArg);
  }

  for (const candidate of defaultSources) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    `Nenhum SVG de icone encontrado. Verifique um destes caminhos: ${defaultSources.join(', ')}`
  );
};

const electronDir = path.join(root, 'electron', 'icons');
const publicIconsDir = path.join(root, 'public', 'icons');

const ensureDir = async (dir) => fs.mkdir(dir, { recursive: true });

const renderPng = async (sourceSvg, size) => {
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
  const sourceSvg = await resolveSourceSvg();
  await fs.access(sourceSvg);
  await ensureDir(electronDir);
  await ensureDir(publicIconsDir);
  await ensureDir(path.join(root, '.tmp-icons'));

  const [p16, p24, p32, p48, p64, p128, p180, p192, p256, p512, p1024] = await Promise.all([
    renderPng(sourceSvg, 16),
    renderPng(sourceSvg, 24),
    renderPng(sourceSvg, 32),
    renderPng(sourceSvg, 48),
    renderPng(sourceSvg, 64),
    renderPng(sourceSvg, 128),
    renderPng(sourceSvg, 180),
    renderPng(sourceSvg, 192),
    renderPng(sourceSvg, 256),
    renderPng(sourceSvg, 512),
    renderPng(sourceSvg, 1024),
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
