// Balance tests — curves stay in target
import { BALANCE, RECOMMENDED } from '../src/core/balance.js';
let pass=0, fail=0;
function ok(n,c,extra=''){ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+' '+extra);} }
ok('enemyHp at 0 min = 20', Math.abs(BALANCE.enemyHp(0)-20)<0.01);
ok('enemyHp at 20 min < 1.085 curve', BALANCE.enemyHp(20) < 20*Math.pow(1.085,20), '1.078 should be softer than 1.085');
ok('spawnRate capped at 11', BALANCE.spawnRate(20)===11 && BALANCE.spawnRate(30)===11);
ok('spawnRate at 0 min = 1.2', Math.abs(BALANCE.spawnRate(0)-1.2)<0.01);
ok('maxOnScreen capped 750', BALANCE.maxOnScreen(30)===750);
ok('overcharge dmg 1.5', BALANCE.overcharge.dmg===1.5);
ok('overcharge radius 1.3', BALANCE.overcharge.radius===1.3);
ok('overcharge has cooldown', BALANCE.overcharge.cooldown===8);
ok('overcharge needs 50 chakra', BALANCE.overcharge.minChakra===50);
ok('recommended 4 slots', Object.values(RECOMMENDED).every(v=>v.length===4));
ok('recommended ember starts fireball', RECOMMENDED.ember[0]==='fireball');
ok('recommended stoneward starts stoneSpike', RECOMMENDED.stoneward[0]==='stoneSpike');
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
