import sharp from 'sharp';
import path  from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src  = path.resolve(__dirname, 'src/assets/Final_Taskivo_Logo.png');
const base = path.resolve(__dirname, 'android/app/src/main/res');

const sizes = [
  { folder: 'mipmap-mdpi',    size: 48  },
  { folder: 'mipmap-hdpi',    size: 72  },
  { folder: 'mipmap-xhdpi',   size: 96  },
  { folder: 'mipmap-xxhdpi',  size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

(async () => {
  for (const { folder, size } of sizes) {
    const dir = path.join(base, folder);
    for (const name of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
      await sharp(src)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .toFile(path.join(dir, name));
      console.log('wrote', folder + '/' + name, size + 'x' + size);
    }
  }
  console.log('Done!');
})().catch(e => { console.error(e); process.exit(1); });
