// Batch 11 FIX — integration tests: each new jutsu has real kind/target and castJutsu fires.
// Run: node tests/batch11.test.mjs
import { World } from '../src/core/world.js';
import { ABILITIES } from '../src/core/abilities.js';
let pass=0, fail=0;
function ok(n,c,extra=''){ if(c){pass++;console.log(`  ok   ${n}`);} else {fail++;console.log(`  FAIL ${n} ${extra}`);} }
const ids = ['chainLightning','blizzard','meteor','venomPool','kunai','gravityWell'];
for (const id of ids){
  const def = ABILITIES[id];
  ok(`${id} exists`, !!def);
  ok(`${id} has kind`, !!def?.kind, `kind=${def?.kind}`);
  ok(`${id} has target`, !!def?.target, `target=${def?.target}`);
  ok(`${id} has cd`, typeof def?.cd === 'number' && def.cd>0, `cd=${def?.cd}`);
  ok(`${id} has coeff`, typeof def?.coeff === 'number' && def.coeff>0, `coeff=${def?.coeff}`);
  ok(`${id} has range or r`, !!(def?.range||def?.r), `range=${def?.range} r=${def?.r}`);
}
ok('chainLightning keeps kind chain', ABILITIES.chainLightning.kind==='chain');
ok('chainLightning cd is 2.8', ABILITIES.chainLightning.cd===2.8, `got ${ABILITIES.chainLightning.cd}`);
ok('chainLightning chains 4', ABILITIES.chainLightning.chains===4);
ok('blizzard kind burst + target self', ABILITIES.blizzard.kind==='burst' && ABILITIES.blizzard.target==='self');
ok('meteor kind burst + target densest', ABILITIES.meteor.kind==='burst' && ABILITIES.meteor.target==='densest');
ok('venomPool kind wall + status poisoned', ABILITIES.venomPool.kind==='wall' && ABILITIES.venomPool.status==='poisoned');
ok('kunai kind projectile + pierce 2', ABILITIES.kunai.kind==='projectile' && ABILITIES.kunai.pierce===2);
ok('gravityWell kind burst + pull', ABILITIES.gravityWell.kind==='burst' && ABILITIES.gravityWell.pull===300);
// castJutsu fires each
for (const id of ids){
  const w = new World(42); w.state='playing'; w.t=60; w.player.x=0; w.player.y=0; w.player.atk=10; w.player.dmgMult=1; w.player.crit=0;
  const e = w.spawnEnemy('fodder', 40, 0); e.hp=e.maxHp=1000;
  w.abilities=[{id, rank:1, cd:0, cdMax:1.2}];
  const okCast = w.castAbility(w.abilities[0]);
  ok(`castJutsu fires ${id}`, okCast===true);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
