// Skins + Trails tests
import { SKINS, TRAILS, canUnlock, unlock } from '../src/core/skins.js';
let pass=0, fail=0;
function ok(n,c,extra=''){ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+' '+extra);} }
ok('6 skins', SKINS.length===6, 'got '+SKINS.length);
ok('6 trails', TRAILS.length===6, 'got '+TRAILS.length);
ok('default skin free', SKINS[0].seals===0);
ok('kage gold 200 seals', SKINS.find(s=>s.id==='kage_gold').seals===200);
ok('rainbow trail 100 seals', TRAILS.find(t=>t.id==='rainbow').seals===100);
let state = { seals: 50, unlockedSkins: new Set(), unlockedTrails: new Set() };
ok('can unlock ember_red with 50 seals', canUnlock(SKINS[1], 50, new Set()));
ok('cannot unlock kage_gold with 50 seals', !canUnlock(SKINS[5], 50, new Set()));
ok('unlock deducts seals', unlock(SKINS[1], state)===true && state.seals===0);
ok('cannot unlock without seals', unlock(SKINS[5], state)===false);
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
