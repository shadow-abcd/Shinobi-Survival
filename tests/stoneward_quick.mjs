// Quick Stoneward runs: fixed build Fireball / Water Bullet / Wind Slash / Stone Spike.
// Sim runs until 2 minutes (w.t >= 120 sec) or until game ends.
import { World, TICK } from '../src/core/world.js';
import { defaultSave } from '../src/core/meta.js';
import { botStep } from './bot.mjs';
import fs from 'fs';

const BUILD = ['fireball', 'waterBullet', 'windSlash', 'stoneSpike'];

function play(seed) {
  const save = defaultSave();
  save.clan = 'stoneward';
  save.clans.stoneward = true;
  save.clanTree.stoneward = 0;
  save.legacy.stoneward = true;
  save.ascension = 0;
  save.banish = 0;

  const w = new World(seed);
  w.reset(seed, save);
  w.abilities = BUILD.map(id => ({ id, rank: 1, cd: 0, cdMax: 1 }));
  w.input.x = 0; w.input.y = 0; w.input.dash = false; w.input.ult = false;

  const bossDeaths = [];
  const bossNames = [];
  w.bus.on('boss:death', (b) => { bossDeaths.push(+w.t.toFixed(0)); bossNames.push(b && b.name ? b.name : (w.boss ? w.boss.name : '?')); });

  let minHp = 100, peak = 0;
  for (let i = 0; i < 1000; i++) { // safety
    if (w.state === 'playing') {
      botStep(w, w.t);
      w.step(TICK);
      minHp = Math.min(minHp, w.player.hp);
      peak = Math.max(peak, w.enemies.count);
    } else if (w.state === 'choice') { w.resumeFight(); }
    else if (w.state === 'levelup') {
      const c = w.pendingChoices;
      if (!c || !c.length) break;
      const inBuild = c.filter(x => x.kind === 'ability' && BUILD.includes(x.id));
      const passive = c.find(x => x.kind === 'passive');
      const pick = inBuild.length ? inBuild[inBuild.length - 1] : (passive || c[0]);
      w.chooseLevelUp(pick);
    } else break;
    if (!Number.isFinite(w.player.hp) || !Number.isFinite(w.player.x)) break;
  }

  const bossesKilled = w.bosses.filter(b => b.dead).map(b => b.name);
  const won = w.state === 'won';
  const t = +w.t.toFixed(1);
  const mm = Math.floor(t / 60), ss = Math.floor(t % 60).toString().padStart(2, '0');
  return {
    seed, outcome: won ? 'WON' : 'died', time: `${mm}:${ss}`, t,
    level: w.player.level, kills: w.kills, minHp: Math.round(minHp), peakEnemies: peak,
    bossesKilled: bossesKilled.length, bossNames,
    deathCause: w.deathCause, deathTime: w.deathTime,
    abilities: w.abilities.map(a => `${a.id}:R${a.rank}`).join(' '),
    ult: w.ultimate,
  };
}

const file = '/root/stoneward_quick.jsonl';
fs.writeFileSync(file, '');
for (let s = 0; s < 4; s++) {
  const r = play(401 + s * 7);
  fs.appendFileSync(file, JSON.stringify(r) + '\n');
  console.error('done seed', r.seed, r.time, 'Lv' + r.level, r.bossesKilled + '/4', r.deathCause || '—');
}
