// Minimal ES-module bundler: no dependencies, resolves relative imports, concatenates in
// dependency order and strips import/export syntax. Produces a single-file playable build.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] || '.');
const ENTRY = path.join(ROOT, 'src/app.js');
const seen = new Map();
const order = [];

function resolve(from, spec) {
  if (!spec.startsWith('.')) throw new Error('bare import not supported: ' + spec);
  const p = path.resolve(path.dirname(from), spec);
  return p.endsWith('.js') ? p : p + '.js';
}

function visit(file) {
  if (seen.has(file)) return;
  seen.set(file, true);
  let code = fs.readFileSync(file, 'utf8');
  const re = /^\s*import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?\s*$/gm;
  const deps = [];
  code = code.replace(re, (m, clause, spec) => { deps.push(resolve(file, spec)); return ''; });
  for (const d of deps) visit(d);
  order.push({ file, code });
}

visit(ENTRY);

const chunks = order.map(({ file, code }) => {
  let out = code
    .replace(/^\s*export\s+default\s+/gm, 'const __default__ = ')
    .replace(/^\s*export\s+(const|let|var|function|class|async)\s/gm, '$1 ')
    .replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, '');
  return `\n/* ---- ${path.relative(ROOT, file)} ---- */\n${out}`;
});

const js = chunks.join('\n');
const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet"[^>]*>/, `<style>\n${css}\n</style>`);
html = html.replace(/<script type="module" src="[^"]*"><\/script>/, `<script type="module">\n${js}\n</script>`);
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist/shinobi.html'), html);
console.log(`bundled ${order.length} modules → dist/shinobi.html (${(html.length / 1024).toFixed(0)} KB)`);
