// Achievements + Quests tests
import { ACHIEVEMENTS, DAILY_QUESTS, checkAchievements, checkDailyQuests } from '../src/core/achievements.js';
let pass=0, fail=0;
function ok(n,c,extra=''){ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+' '+extra);} }
ok('12 achievements', ACHIEVEMENTS.length===12, 'got '+ACHIEVEMENTS.length);
ok('4 daily quests', DAILY_QUESTS.length===4, 'got '+DAILY_QUESTS.length);
ok('all achievements have seals', ACHIEVEMENTS.every(a=>a.seals>0));
ok('all achievements have check', ACHIEVEMENTS.every(a=>typeof a.check==='function'));
// Check unlocks
let unlocked = new Set();
let newly = checkAchievements({kills:1000, time:1800, won:true, fusions:5, bossesKilled:3, flawlessBoss:true, level:50}, unlocked);
ok('massacre unlocks', unlocked.has('slayer_1000'));
ok('legend unlocks', unlocked.has('survive_30'));
ok('kage unlocks', unlocked.has('level_50'));
ok('no double unlock', checkAchievements({kills:1000, time:1800, won:true, fusions:5, bossesKilled:3, flawlessBoss:true, level:50}, unlocked).length===0);
let prog = {daily_kills:300, daily_time:900, daily_fusion:3, daily_boss:1};
let q = checkDailyQuests({}, prog);
ok('daily quests all complete', q.length===4, 'got '+q.length);
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
