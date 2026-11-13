// Combat assertions: the nine-step pipeline, Prime/Detonate, ICDs and loop guards.
// Run: node tests/combat.test.mjs
import { World } from '../src/core/world.js';
import { STATUS, applyStatus, stacksOf } from '../src/core/statuses.js';

let pass = 0, fail = 0;
function ok(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
}

function fresh() {
  const w = new World(42);
  w.state = 'playing';
  w.t = 60;
  w.player.x = 0; w.player.y = 0;
  w.player.atk = 10; w.player.dmgMult = 1; w.player.crit = 0;
  return w;
}

console.log('status application');
{
  const w = fresh();
  const e = w.spawnEnemy('fodder', 40, 0);
  applyStatus(w, e, 'aerated');
  ok('aerated applied with 1 stack', stacksOf(e, 'aerated') === 1);
  applyStatus(w, e, 'aerated');
  applyStatus(w, e, 'aerated');
  ok('repeat application refreshes but adds no stack (registry)', stacksOf(e, 'aerated') === 1, `got ${stacksOf(e, 'aerated')}`);
  applyStatus(w, e, 'aerated', { stacks: 3 });
  ok('empowered application can reach max 3 stacks', stacksOf(e, 'aerated') === 3, `got ${stacksOf(e, 'aerated')}`);
  ok('duration refreshes to 4s', Math.abs(e.statuses.aerated.t - 4) < 0.01);
}

console.log('prime + detonate');
{
  const w = fresh();
  const e = w.spawnEnemy('fodder', 40, 0);
  e.hp = e.maxHp = 1000;
  applyStatus(w, e, 'aerated', { stacks: 1 });
  const before = e.hp;
  w.damageEnemy(e, 10, { element: 'fire', status: 'burning', statusStacks: 1, crit: false });
  const dealt = before - e.hp;
  ok('fire on Aerated deals ~3x', dealt > 25 && dealt < 40, `dealt ${dealt.toFixed(1)}`);
  ok('Aerated consumed by the detonation', stacksOf(e, 'aerated') === 0);
  ok('Burning applied afterwards', stacksOf(e, 'burning') >= 1);
}

console.log('ICD (D2): the same pair cannot detonate twice inside 2.5 s');
{
  const w = fresh();
  const e = w.spawnEnemy('fodder', 40, 0);
  e.hp = e.maxHp = 5000;
  applyStatus(w, e, 'aerated', { stacks: 1 });
  w.damageEnemy(e, 10, { element: 'fire', status: 'burning', crit: false });
  applyStatus(w, e, 'aerated', { stacks: 1 });
  const before = e.hp;
  w.damageEnemy(e, 10, { element: 'fire', status: 'burning', crit: false });
  const second = before - e.hp;
  ok('second hit is not a detonation', second < 20, `dealt ${second.toFixed(1)}`);
}

console.log('spread (D3/D4): a detonation primes at most two neighbours, one hop');
{
  const w = fresh();
  const target = w.spawnEnemy('fodder', 0, 0);
  target.hp = 9999; target.maxHp = 9999;
  applyStatus(w, target, 'aerated');
  const n1 = w.spawnEnemy('fodder', 30, 0);
  const n2 = w.spawnEnemy('fodder', -30, 0);
  const n3 = w.spawnEnemy('fodder', 0, 30);
  const n4 = w.spawnEnemy('fodder', 0, -30);
  w.grid.build(w.enemies.active);
  w.damageEnemy(target, 10, { element: 'fire', crit: false });
  const spread = [n1, n2, n3, n4].filter((e) => stacksOf(e, 'aerated') > 0).length;
  ok('exactly 2 neighbours primed', spread === 2, `got ${spread}`);
  ok('neighbours are not damaged by the spread', [n1, n2, n3, n4].every((e) => e.hp === e.maxHp));
}

console.log('fusion: Fire + Wind on the same target fires Firestorm');
{
  const w = fresh();
  const e = w.spawnEnemy('fodder', 20, 0);
  e.hp = 9999; e.maxHp = 9999;
  applyStatus(w, e, 'burning');
  let fused = 0;
  w.bus.on('fusion', () => fused++);
  w.damageEnemy(e, 10, { element: 'wind', crit: false });
  ok('wind detonating Burning fires Firestorm', fused === 1, `got ${fused}`);
  const e2 = w.spawnEnemy('fodder', 20, 0);
  e2.hp = 9999; e2.maxHp = 9999;
  applyStatus(w, e2, 'aerated');
  fused = 0;
  w.damageEnemy(e2, 10, { element: 'fire', crit: false });
  ok('fire detonating Aerated fires Firestorm', fused === 1, `got ${fused}`);
}

console.log('damage formula');
{
  const w = fresh();
  const e = w.spawnEnemy('fodder', 20, 0);
  e.hp = 9999; e.maxHp = 9999;
  w.damageEnemy(e, 20, { element: 'fire', crit: true });
  ok('crit multiplies by 1.5', Math.abs((9999 - e.hp) - 30) < 0.001, `dealt ${(9999 - e.hp).toFixed(2)}`);
  const s = w.spawnEnemy('fodder', 25, 0);
  s.hp = 9999; s.maxHp = 9999;
  applyStatus(w, s, 'staggered');
  w.damageEnemy(s, 10, { element: 'fire', crit: false });
  ok('Staggered adds +20% damage taken', Math.abs((9999 - s.hp) - 12) < 0.001, `dealt ${(9999 - s.hp).toFixed(2)}`);
}

console.log('overcharge: the empowered cast is +50% damage and one extra stack');
{
  const w = fresh();
  w.abilities = [{ id: 'fireball', rank: 1, cd: 0, cdMax: 1.2 }];
  w.player.chakra = 100; w.player.overcharge = true;
  const e = w.spawnEnemy('fodder', 200, 0);
  e.hp = 9999; e.maxHp = 9999;
  w.castAbility(w.abilities[0]);
  ok('overcharge is consumed by the cast', w.player.overcharge === false);
  ok('projectile spawned', w.projectiles.count === 1);
  const pr = w.projectiles.active[0];
  ok('projectile damage is 1.5x', Math.abs(pr.damage - 15) < 0.01, `got ${pr.damage}`);
  ok('projectile carries an extra status stack', pr.statusStacks === 2, `got ${pr.statusStacks}`);
}

console.log('chakra');
{
  const w = fresh();
  w.player.chakra = 0;
  w.addChakra(100);
  ok('caps at 100 and arms overcharge', w.player.chakra === 100 && w.player.overcharge);
  ok('ultimate is castable at 100', w.castUltimate() === true);
  ok('ultimate empties the meter', w.player.chakra === 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
