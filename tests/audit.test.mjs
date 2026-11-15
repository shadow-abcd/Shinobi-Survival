// Audit Fix tests
import { PLAYER_HP, ELITE_TIMER, CDR_CAP, CHAKRA_MAX, MAX_FRAME_TIME, SAVE_VERSION } from '../src/core/constants.js';
import { migrateSave } from '../src/core/meta.js';
let pass=0, fail=0;
function ok(n,c,extra=''){ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+' '+extra);} }
ok('PLAYER_HP 165', PLAYER_HP===165);
ok('ELITE_TIMER 180', ELITE_TIMER===180);
ok('CDR_CAP 0.7', CDR_CAP===0.7);
ok('CHAKRA_MAX 100', CHAKRA_MAX===100);
ok('MAX_FRAME_TIME 0.1', MAX_FRAME_TIME===0.1);
ok('SAVE_VERSION 2', SAVE_VERSION===2);
let old = { version: 1 };
let m = migrateSave(old);
ok('migrate adds academyLevel', m.academyLevel===1);
ok('migrate adds unlockedAchievements', Array.isArray(m.unlockedAchievements));
ok('migrate bumps to v2', m.version===2);
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
