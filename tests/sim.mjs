// Headless simulation: a full 5-minute run at 60 Hz, no rendering.
// Usage: node tests/sim.mjs [seed]
import { World, TICK } from '../src/core/world.js';
import { botStep } from './bot.mjs';

export function play(seed, { verbose = false } = {}) {
  const w = new World(seed);
  const dt = TICK;
  const maxTicks = 1300 * 60;
  let peak = 0, nan = false, minHp = 100;
  const fights = [];
  w.bus.on('boss:death', () => fights.push(+w.t.toFixed(0)));
  const marks = [];
  const t0 = performance.now();

  for (let i = 0; i < maxTicks; i++) {
    if (w.state === 'playing') {
      botStep(w, w.t);
      w.step(dt);
      peak = Math.max(peak, w.enemies.count);
      minHp = Math.min(minHp, w.player.hp);
    } else if (w.state === 'choice') {
      w.resumeFight();          // the bot always finishes the fight
    } else if (w.state === 'levelup') {
      const c = w.pendingChoices;
      if (!c || !c.length) break;
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
    damage: Math.round(w.damageDealt), nan, ms: Math.round(ms), simSpeed: +(w.t / (ms / 1000)).toFixed(0),
    fights,
    abilities: w.abilities.map((a) => `${a.id}:R${a.rank}`).join(','),
    passives: w.passives.map((a) => `${a.id}:R${a.rank}`).join(','),
    marks,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const seeds = process.argv[2] ? [parseInt(process.argv[2], 10)] : [1, 2, 3, 4, 5];
  let wins = 0;
  for (const s of seeds) {
    const r = play(s, { verbose: seeds.length === 1 });
    if (r.state === 'won') wins++;
    const m = r.marks.map((x) => `${x.t}s:L${x.lv}/k${x.kills}/hp${x.hp}`).join(' ');
    console.log(JSON.stringify({ ...r, marks: undefined }), m ? '\n  ' + m : '');
  }
  if (seeds.length > 1) {
    const a = play(seeds[0]), b = play(seeds[0]);
    const same = a.kills === b.kills && a.damage === b.damage && a.level === b.level;
    console.log(`determinism: ${same ? 'PASS' : 'FAIL'} | wins ${wins}/${seeds.length}`);
  }
}
