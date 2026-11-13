// Enemy archetypes + AI + spawner. Scaling is on run time, never on Rank (memo §2.6/2.7).
import { statusMoveMult, statusActive } from './statuses.js';
export const ENEMY_TYPES = {
  fodder: {
    id: 'fodder', r: 13, hpMult: 1.0, speed: 92, damage: 2.5, xp: 1,
    color: '#a8455f', edge: '#ff7f9b', name: 'Bandit',
  },
  brute: {
    id: 'brute', r: 21, hpMult: 3.4, speed: 68, damage: 8, xp: 4,
    color: '#6f2f4a', edge: '#ff9a7f', name: 'Brute',
  },
  teleporter: {
    id: 'teleporter', r: 15, hpMult: 5.0, speed: 74, damage: 12, xp: 8,
    color: '#4b3a7a', edge: '#b79bff', name: 'Shunshin', blinkCd: 3.2,
  },
  siphoner: {
    id: 'siphoner', r: 14, hpMult: 3.4, speed: 112, damage: 8, xp: 6,
    color: '#1f4a44', edge: '#5fe8c8', name: 'Siphoner', drain: 6,
  },
  archer: {
    id: 'archer', r: 12, hpMult: 1.7, speed: 78, damage: 6, xp: 3,
    color: '#3d5a7a', edge: '#7fc4ff', name: 'Archer', ranged: true,
    keepMin: 320, keepMax: 430, fireCd: 3.4, projSpeed: 265,
  },
};

export function enemyHP(minutes) { return 20 * Math.pow(1.078, minutes); }
// FIX Batch 3 (spawn formulas): design is SpawnRate = min(12, 1.5 + 0.9*min), MaxOnScreen = min(900, 120 + 40*min).
// Code was min(16, 2.0 + 1.05*min) / min(900, 130 + 45*min) — at 10 min: 12.5/s vs 10.5/s (+19%), at 20 min: 16/s cap vs 12/s cap (+33%).
export function spawnRate(minutes) { return Math.min(11, 1.5 + 0.9 * minutes); }
export function maxOnScreen(minutes) { return Math.min(750, 120 + 40 * minutes); }
export function podSize(minutes) { return 3 + Math.min(7, Math.floor(minutes / 4)); }

// SpawnRate(t) is enemies per second. Pairs and small pods add visual variety without
// multiplying the curve (a pod of 8 at 5/s would be 40 enemies a second).
export function spawnPod(world) {
  const min = world.minutes;
  const types = world.spawnTable(min);
  const ang = world.rng.angle();
  const dist = world.rng.range(600, 780);
  const cx = world.player.x + Math.cos(ang) * dist;
  const cy = world.player.y + Math.sin(ang) * dist;
  // FIX Batch 3: spawnPod spawns exactly 1 enemy per call, so SpawnRate(t) IS enemies/sec.
  // Old code spawned 1-2 (30% chance of 2), so the real rate was 1.15x the formula — the curve never matched the design.
  const n = 1;
  for (let i = 0; i < n; i++) {
    if (world.enemies.count >= world.maxOnScreen()) break;
    const t = world.rng.weighted(types);
    const e = world.spawnEnemy(t.id, cx + world.rng.range(-46, 46), cy + world.rng.range(-46, 46));
    if (e) world.bus.emit('enemy:spawned', e);
  }
}

export function updateEnemy(world, e, dt) {
  const p = world.player;
  const dx = p.x - e.x, dy = p.y - e.y;
  const dist = Math.hypot(dx, dy) || 1;
  const def = ENEMY_TYPES[e.type];

  if (e.stunT > 0) { e.stunT -= dt; return; }
  // FIX Batch 2 (Rooted / Stunned never stopped movement):
  // Stunned = fully stopped (no move, no blink, no fire). Rooted = no move / no blink, but an Archer can still shoot.
  if (statusActive(e, 'stunned')) return;
  const moveMult = statusMoveMult(e); // 0 when Rooted, 1 otherwise

  let mvx = dx / dist, mvy = dy / dist;
  let speed = e.speed * (e.slowT > 0 ? 0.5 : 1) * moveMult;

  if (def.ranged) {
    if (dist > def.keepMax) { /* approach */ }
    else if (dist < def.keepMin) { mvx = -mvx; mvy = -mvy; }
    else { const s = e.strafe || 1; mvx = -dy / dist * s; mvy = dx / dist * s; }
    e.fireT -= dt;
    if (e.fireT <= 0 && dist < 620) {
      e.fireT = def.fireCd;
      world.spawnEnemyProjectile({
        x: e.x, y: e.y, tx: p.x, ty: p.y,
        speed: def.projSpeed, damage: def.damage, color: '#7fc4ff',
      });
    }
  }

  // Soft separation so the crowd does not collapse into one pixel (grid, not O(n^2)).
  let sx = 0, sy = 0;
  const nb = world.grid.neighborsOf(e, world._nb);
  for (let i = 0; i < nb.length; i++) {
    const o = nb[i];
    if (o === e || !o.alive) continue;
    const ox = e.x - o.x, oy = e.y - o.y;
    const d2 = ox * ox + oy * oy;
    const rr = (e.r + o.r) * 0.9;
    if (d2 < rr * rr && d2 > 0.001) {
      const d = Math.sqrt(d2);
      sx += (ox / d) * (1 - d / rr);
      sy += (oy / d) * (1 - d / rr);
    }
  }
  mvx += sx * 1.4; mvy += sy * 1.4;
  const m = Math.hypot(mvx, mvy) || 1;
  e.vx = (mvx / m) * speed;
  e.vy = (mvy / m) * speed;
  e.x += e.vx * dt;
  e.y += e.vy * dt;

  // shunshin blink: closes distance in a jump — blocked while Rooted (moveMult 0)
  if (def.blinkCd && moveMult > 0) {
    e.blinkT = (e.blinkT === undefined ? def.blinkCd : e.blinkT) - dt;
    if (e.blinkT <= 0 && dist > 150 && dist < 640) {
      e.blinkT = def.blinkCd;
      const a = Math.atan2(dy, dx);
      e.x += Math.cos(a) * 170;
      e.y += Math.sin(a) * 170;
      world.bus.emit('blink', { x: e.x, y: e.y });
    }
  }

  // Stoneward: stone zone slows and marks for extra damage
  if (world.stonewardSlow && dist < 260) {
    e.stonewardMarked = true;
    speed *= 0.7 - Math.min(0.2, world.stonewardSlow);
  } else {
    e.stonewardMarked = false;
  }

  // contact damage
  e.touchT -= dt;
  const pr = p.r + e.r;

  if (e.touchT <= 0 && (p.x - e.x) ** 2 + (p.y - e.y) ** 2 < pr * pr) {
    e.touchT = 1.05;
    world.damagePlayer(def.damage, def.ranged ? 'ranged' : 'melee');
    if (def.drain) {
      world.player.chakra = Math.max(0, world.player.chakra - def.drain);
      world.bus.emit('drain', { x: p.x, y: p.y });
    }
    world.bus.emit('enemy:hitPlayer', e);
  }
}
