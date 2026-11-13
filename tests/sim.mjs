// Headless simulation: full runs at 60 Hz, no rendering.
// Usage: node tests/sim.mjs [seed] | node tests/sim.mjs 1,2,3 | node tests/sim.mjs --check
// FIX Batch 7: multi-seed runner, Banish + Breakthrough coverage, determinism check, post-cap check,
// and a non-zero exit code on NaN / crash / determinism failure.
import { World, TICK } from '../src/core/world.js';
import { botStep } from './bot.mjs';

export function play(seed, { verbose = false, save = null } = {}) {
  const w = new World(seed);
  if (save) w.reset(seed, save);
  const dt = TICK;
  const maxTicks = 1300 * 60;
  let peak = 0, nan = false, minHp = 100;
  const fights = [];
  let banished = 0, promoted = 0;
  w.bus.on('boss:death', () => fights.push(+w.t.toFixed(0)));
  w.bus.on('banish', () => { banished++; });
  w.bus.on('rank:breakthrough', () => { promoted++; });
  const marks = [];
  const t0 = performance.now();

  for (let i = 0; i < maxTicks; i++) {
    if (w.state === 'playing') {
      botStep(w, w.t);
      w.step(dt);
      peak = Math.max(peak, w.enemies.count);
      minHp = Math.min(minHp, w.player.hp);
    } else if (w.state === 'choice') {
      w.resumeFight();
    } else if (w.state === 'levelup') {
      const c = w.pendingChoices;
      if (!c || !c.length) break;
      // FIX Batch 7: exercise Banish (10% when charges remain) and Breakthrough (30% when offered).
      // Without this, sim never touches those paths and they rot.
      const bt = c.find((x) => x.kind === 'breakthrough');
      if (bt && w.rng.chance(0.3)) { w.chooseLevelUp(bt); continue; }
      if (w.player.banishCharges > 0 && w.rng.chance(0.10)) {
        const victim = c.find((x) => x.kind === 'ability' || x.kind === 'passive');
        if (victim) { w.banish(victim); continue; }
      }
      const pick = w.rng.chance(0.65)
        ? c.find((x) => x.kind === 'ability') || c[0]
        : c[Math.floor(w.rng.float() * c.length)];
      w.chooseLevelUp(pick);
    } else break;
    const p = w.player;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.hp)) { nan = true; break; }
    if (verbose && Math.abs(w.t % 60) < TICK) {
      marks.push({ t: Math.round(w.t), lv: p.level, kills: w.kills, hp: Math.round(p.hp), en: w.enemies.count });
    }
  }
  const ms = performance.now() - t0;
  return {
    seed, time: +w.t.toFixed(1), state: w.state,
    kills: w.kills, level: w.player.level, hp: +w.player.hp.toFixed(0), minHp: Math.round(minHp),
    peakEnemies: peak, boss: w.boss ? { hp: +w.boss.hp.toFixed(0), max: w.boss.maxHp, pct: +(w.boss.hp / w.boss.maxHp * 100).toFixed(0) } : null,
    damage: Math.round(w.damageDealt),
    damageTaken: Math.round(w.damageTaken || 0), healDone: Math.round(w.healDone || 0), hitsTaken: w.hitsTaken || 0,
    dps: w.t > 0 ? Math.round(w.damageDealt / w.t) : 0, dpsTaken: w.t > 0 ? Math.round((w.damageTaken || 0) / w.t) : 0,
    deathCause: w.deathCause || null, deathTime: + (w.deathTime || 0).toFixed(1), nan, ms: Math.round(ms), simSpeed: +(w.t / (ms / 1000)).toFixed(0),
    fights, banished, promoted, rank: w.player.rank,
    abilities: w.abilities.map((a) => `${a.id}:R${a.rank}`).join(','),
    passives: w.passives.map((a) => `${a.id}:R${a.rank}`).join(','),
    marks,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv[2] || '';
  const checkMode = arg === '--check';
  let seeds = [1, 2, 3, 4, 5];
  if (arg && !checkMode) seeds = arg.split(',').map((s) => parseInt(s, 10)).filter(Number.isFinite);
  let wins = 0, fail = false;
  for (const s of seeds) {
    const r = play(s, { verbose: seeds.length === 1 });
    if (r.state === 'won') wins++;
    if (r.nan) { console.error(`seed ${s}: NaN detected`); fail = true; }
    if (!Number.isFinite(r.kills) || !Number.isFinite(r.damage)) { console.error(`seed ${s}: non-finite stats`); fail = true; }
    const m = r.marks.map((x) => `${x.t}s:L${x.lv}/k${x.kills}/hp${x.hp}`).join(' ');
    console.log(JSON.stringify({ ...r, marks: undefined }), m ? '\n  ' + m : '');
    console.log(`  TELEMETRY seed ${s}: dps ${r.dps}/s | taken ${r.dpsTaken}/s | hits ${r.hitsTaken} | heal ${r.healDone} | death ${r.deathCause || '—'} @ ${r.deathTime}s | time ${r.time}s`);
  }
  // Determinism: same seed twice must give same kills / damage / level.
  const a = play(seeds[0]), b = play(seeds[0]);
  const same = a.kills === b.kills && a.damage === b.damage && a.level === b.level;
  console.log(`determinism: ${same ? 'PASS' : 'FAIL'} | wins ${wins}/${seeds.length}`);
  if (!same) fail = true;
  // Post-cap: direct World check (no rendering).
  try {
    const w = new World(999);
    w.player.level = 50; w.player.xp = 0; w.player.xpNeed = 100; w.player.hp = 50; w.player.maxHp = 200;
    w.state = 'playing'; w.addXP(100);
    const hasPost = w.pendingChoices && w.pendingChoices.some((c) => c.kind.startsWith('postcap'));
    console.log(`post-cap: ${hasPost ? 'PASS' : 'FAIL'}`);
    if (!hasPost) fail = true;
    w.chooseLevelUp(w.pendingChoices.find((c) => c.kind === 'postcap-heal'));
    const healed = w.player.hp === 100;
    console.log(`post-cap heal: ${healed ? 'PASS' : 'FAIL'} (hp ${w.player.hp})`);
    if (!healed) fail = true;
  } catch (e) { console.error('post-cap: FAIL', e.message); fail = true; }
  if (checkMode && fail) process.exit(1);
}
