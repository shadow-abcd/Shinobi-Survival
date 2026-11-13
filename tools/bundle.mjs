// Minimal ES-module bundler: no dependencies, resolves relative imports, concatenates in
// dependency order and strips import/export syntax. Produces a single-file playable build.
// FIX Batch 7 (hardened): fails loudly on missing files / missing placeholders / bare imports /
// `export *` (not supported), handles side-effect imports, and verifies no import/export lines survive.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] || '.');
const ENTRY = path.join(ROOT, 'src/app.js');
const seen = new Map();
const order = [];

function resolve(from, spec) {
  if (!spec.startsWith('.')) throw new Error('bare import not supported: ' + spec + ' (from ' + path.relative(ROOT, from) + ')');
  const p = path.resolve(path.dirname(from), spec);
  return p.endsWith('.js') ? p : p + '.js';
}

function visit(file) {
  if (seen.has(file)) return;
  if (!fs.existsSync(file)) throw new Error('missing module: ' + path.relative(ROOT, file));
  seen.set(file, true);
  let code = fs.readFileSync(file, 'utf8');
  if (/^\s*export\s+\*\s+from/m.test(code)) throw new Error('export * not supported in ' + path.relative(ROOT, file) + ' — list the exports explicitly');
  const deps = [];
  // side-effect imports: import './x.js';
  code = code.replace(/^\s*import\s+['"]([^'"]+)['"];?\s*$/gm, (m, spec) => { deps.push(resolve(file, spec)); return ''; });
  // normal imports: import { ... } from '...'; / import X from '...';
  const re = /^\s*import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?\s*$/gm;
  code = code.replace(re, (m, clause, spec) => { deps.push(resolve(file, spec)); return ''; });
  for (const d of deps) visit(d);
  order.push({ file, code });
}

if (!fs.existsSync(ENTRY)) throw new Error('missing entry: src/app.js');
if (!fs.existsSync(path.join(ROOT, 'style.css'))) throw new Error('missing style.css');
if (!fs.existsSync(path.join(ROOT, 'index.html'))) throw new Error('missing index.html');
visit(ENTRY);

const chunks = order.map(({ file, code }) => {
  let out = code
    .replace(/^\s*export\s+default\s+/gm, 'const __default__ = ')
    .replace(/^\s*export\s+(const|let|var|function|class|async)\s/gm, '$1 ')
    .replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, '');
  // re-export lines (export { x } from './y') are stripped above only when they are bare; if one survives, it is a bug.
  if (/^\s*export\s+\{[^}]*\}\s+from/m.test(out)) throw new Error('re-export not supported in ' + path.relative(ROOT, file));
  return `\n/* ---- ${path.relative(ROOT, file)} ---- */\n${out}`;
});

const js = chunks.join('\n');
if (/^\s*import\s/m.test(js)) throw new Error('bundle still contains an import line — check for a dynamic or multi-line import');
const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (!html.includes('<link rel="stylesheet"')) throw new Error('index.html is missing its stylesheet <link>');
if (!html.includes('<script type="module"')) throw new Error('index.html is missing its module <script>');
html = html.replace(/<link rel="stylesheet"[^>]*>/, `<style>\n${css}\n</style>`);
html = html.replace(/<script type="module" src="[^"]*"><\/script>/, `<script type="module">\n/* Shinobi Survival — bundled ${new Date().toISOString()} — ${order.length} modules */\n${js}\n</script>`);
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist/shinobi.html'), html);
console.log(`bundled ${order.length} modules → dist/shinobi.html (${(html.length / 1024).toFixed(0)} KB)`);
