// Save hardening: kill-app mid-save must load backup.
// Run: node tests/save.test.mjs
import { defaultSave, writeSave, loadSave } from '../src/core/meta.js';
const mem = new Map();
const storage = { getItem: (k)=> mem.has(k)? mem.get(k): null, setItem: (k,v)=> mem.set(k,v) };
// 1. Normal save loads
const s = defaultSave(); s.seals = 40; s.survivedMinutes = 8;
writeSave(storage, s);
let loaded = loadSave(storage);
console.log(loaded.seals===40 ? '  ok   normal save loads' : '  FAIL normal save');
// 2. Corrupt main, backup loads (simulates kill mid-write)
mem.set('shinobi.save.v1', '{corrupt');
loaded = loadSave(storage);
console.log(loaded.seals===40 ? '  ok   backup loads when main corrupt' : '  FAIL backup load');
// 3. Both corrupt -> fresh save, no crash
mem.set('shinobi.save.v1.bak', '{corrupt');
loaded = loadSave(storage);
console.log(loaded.seals===0 ? '  ok   fresh save when both corrupt' : '  FAIL fresh fallback');
console.log('save hardening: done');
