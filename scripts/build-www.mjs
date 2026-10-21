// Prépare le dossier www/ embarqué dans l'application iOS (Capacitor)
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const OUT = 'www';
const FILES = ['index.html', 'app.js', 'photo.js', 'tailwind.css', 'icon.svg', 'fonts', 'vendor'];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const f of FILES) cpSync(f, `${OUT}/${f}`, { recursive: true });
cpSync('node_modules/@capacitor/core/dist/capacitor.js', `${OUT}/capacitor.js`);

// Dans l'application : pas de manifeste PWA, et le cœur Capacitor chargé avant le jeu
let html = readFileSync(`${OUT}/index.html`, 'utf8');
html = html
  .replace(/\s*<link rel="manifest"[^>]*>/, '')
  .replace('<script src="app.js"></script>', '<script src="capacitor.js"></script>\n  <script src="app.js"></script>');
writeFileSync(`${OUT}/index.html`, html);
console.log(`www/ prêt (${FILES.length + 1} éléments)`);
