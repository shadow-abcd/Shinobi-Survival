// Daily Run + Leaderboard tests
import { dailySeed, dailyId, dailyScore, dailyMap, dailyClan, addToLeaderboard, rankOf } from '../src/core/daily.js';
let pass=0, fail=0;
function ok(n,c,extra=''){ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+' '+extra);} }
const d1 = new Date(2026,10,15); // Nov 15 2026
const d2 = new Date(2026,10,15);
ok('same day same seed', dailySeed(d1)===dailySeed(d2));
ok('different day different seed', dailySeed(d1)!==dailySeed(new Date(2026,10,16)));
ok('dailyId format', dailyId(d1)==='2026-11-15', 'got '+dailyId(d1));
ok('dailyMap is forest/desert/frost', ['forest','desert','frost'].includes(dailyMap(dailySeed(d1))));
ok('dailyClan is valid', ['ember','stoneward','gale','tide','mist','iron'].includes(dailyClan(dailySeed(d1))));
ok('score formula', dailyScore({time:600, kills:100, level:30, bossesKilled:2})===600+1000+1500+1000, 'got '+dailyScore({time:600, kills:100, level:30, bossesKilled:2}));
let board = [];
board = addToLeaderboard(board, {dailyId:'2026-11-15', score:5000, time:600, kills:100, level:30, bossesKilled:2, clan:'ember'});
board = addToLeaderboard(board, {dailyId:'2026-11-15', score:8000, time:900, kills:200, level:35, bossesKilled:3, clan:'gale'});
ok('leaderboard sorted desc', board[0].score===8000);
ok('rank 1 for top', rankOf(board, 9000)===1);
ok('rank 3 for low', rankOf(board, 1000)===3);
// Top 10 cap
let big = [];
for(let i=0;i<15;i++) big = addToLeaderboard(big, {dailyId:'2026-11-15', score:i*100, time:100, kills:10, level:10, bossesKilled:0, clan:'ember'});
ok('leaderboard capped at 10', big.length===10);
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
