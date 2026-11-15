// Quick Wins tests
import { shareCode, parseShareCode } from '../src/core/replay.js';
let pass=0, fail=0;
function ok(n,c,extra=''){ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+' '+extra);} }
const state = { seed: 12345, clan: 'ember', map: 'forest', mode: 'normal', choices: ['fireball','windSlash'] };
const code = shareCode(state);
ok('share code format', code==='12345-ember-forest-normal-fireball,windSlash', 'got '+code);
const parsed = parseShareCode(code);
ok('parse seed', parsed.seed===12345);
ok('parse clan', parsed.clan==='ember');
ok('parse choices', parsed.choices.length===2 && parsed.choices[0]==='fireball');
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
