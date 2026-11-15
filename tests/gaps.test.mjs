// Gaps Fix tests
import { NEW_ENEMIES } from '../src/core/enemies_new.js';
let pass=0, fail=0;
function ok(n,c,extra=''){ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+' '+extra);} }
ok('2 new enemies', Object.keys(NEW_ENEMIES).length===2);
ok('stinger ranged', NEW_ENEMIES.stinger.range===400);
ok('stinger applies drenched', NEW_ENEMIES.stinger.status==='drenched');
ok('summoner spawns 2', NEW_ENEMIES.summoner.summonCount===2);
ok('summoner cd 8s', NEW_ENEMIES.summoner.summonCd===8);
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
