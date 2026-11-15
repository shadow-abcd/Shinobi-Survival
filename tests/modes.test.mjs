// Endless + Boss Rush tests
import { MODES, modeById } from '../src/core/modes.js';
let pass=0, fail=0;
function ok(n,c,extra=''){ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+' '+extra);} }
ok('3 modes', Object.keys(MODES).length===3);
ok('normal 30 min', MODES.normal.timeLimit===1800);
ok('normal 6 bosses', MODES.normal.bosses.length===6);
ok('endless infinite', MODES.endless.timeLimit===Infinity);
ok('endless 10 bosses', MODES.endless.bosses.length===10);
ok('bossRush 5 min', MODES.bossRush.timeLimit===300);
ok('bossRush no spawn', MODES.bossRush.spawn===false);
ok('bossRush 4 bosses', MODES.bossRush.bosses.length===4);
ok('modeById fallback', modeById('unknown').id==='normal');
ok('modeById endless', modeById('endless').id==='endless');
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
