// Status registry — the canonical data structure (memo C8 / A6). Every combat rule reads this.
// Values mirror 03_STATUS_REGISTRY.md.
export const STATUS = {
  aerated: {
    id: 'aerated', element: 'wind', name: 'Aerated', color: '#7ff0d4', duration: 4.0, maxStacks: 3,
    refresh: 'duration', detonatedBy: 'fire', detonateMult: 3.0, spread: 2, icd: 2.5,
    damageBonus: 0,
  },
  burning: {
    id: 'burning', element: 'fire', name: 'Burning', color: '#ff8b3d', duration: 3.0, maxStacks: 5,
    refresh: 'stack', detonatedBy: 'wind', detonateMult: 2.0, spread: 0, icd: 2.5,
    damageBonus: 0, dotPerStack: 2, dotInterval: 0.5,
  },
  drenched: {
    id: 'drenched', element: 'water', name: 'Drenched', color: '#63b7ff', duration: 5.0, maxStacks: 1,
    refresh: 'duration', detonatedBy: 'lightning', detonateMult: 2.5, spread: 3, icd: 2.5,
    damageBonus: 0,
  },
  frozen: {
    id: 'frozen', element: 'water', name: 'Frozen', color: '#bfefff', duration: 1.5, maxStacks: 1,
    refresh: 'none', detonatedBy: 'physical', detonateMult: 1.5, spread: 0, icd: 3.0,
    damageBonus: 0, onBreak: { slow: 0.5, duration: 2.0 },
  },
  rooted: {
    id: 'rooted', element: 'earth', name: 'Rooted', color: '#b98b57', duration: 2.5, maxStacks: 1,
    refresh: 'none', detonatedBy: 'wind', detonateMult: 2.0, spread: 0, icd: 2.5,
    damageBonus: 0, moveMult: 0,
  },
  marked: {
    id: 'marked', element: 'earth', name: 'Marked', color: '#ffd27a', duration: 3.0, maxStacks: 1,
    refresh: 'none', detonatedBy: null, detonateMult: 2.0, spread: 2, icd: 2.0,
    damageBonus: 0, onDeathChain: true,
  },
  stunned: {
    id: 'stunned', element: 'lightning', name: 'Stunned', color: '#ffe98a', duration: 1.0, maxStacks: 1,
    refresh: 'immune', detonatedBy: null, detonateMult: 1, spread: 0, icd: 2.0,
    damageBonus: 0, moveMult: 0,
  },
  staggered: {
    id: 'staggered', element: 'physical', name: 'Staggered', color: '#ff9c9c', duration: 2.0, maxStacks: 1,
    refresh: 'duration', detonatedBy: null, detonateMult: 1, spread: 0, icd: 0,
    damageBonus: 0.20,
  },
};

export function statusActive(e, id, now) {
  const s = e.statuses[id];
  return !!s && s.t > 0;
}

export function stacksOf(e, id) {
  const s = e.statuses[id];
  return s ? s.stacks : 0;
}

export function applyStatus(world, e, id, opts = {}) {
  const def = STATUS[id];
  if (!def) return false;
  const now = world.t;
  let s = e.statuses[id];
  if (s && s.t > 0) {
    if (def.refresh === 'immune') return false;      // D-rules: no re-apply during/after break window
    if (def.refresh === 'none') return false;
    if (def.refresh === 'stack') {
      s.stacks = Math.min(def.maxStacks, s.stacks + (opts.stacks || 1));
      s.t = def.duration;
    } else {
      s.t = def.duration;
      s.stacks = Math.min(def.maxStacks, Math.max(s.stacks, opts.stacks || 1));
    }
    return true;
  }
  s = e.statuses[id] || (e.statuses[id] = { stacks: 0, t: 0, icd: 0, tick: 0 });
  s.stacks = Math.min(def.maxStacks, opts.stacks || 1);
  s.t = def.duration;
  s.tick = def.dotInterval || 0;
  world.bus.emit('status:applied', { enemy: e, id, source: opts.source });
  return true;
}

export function clearStatus(e, id) {
  const s = e.statuses[id];
  if (s) { s.t = 0; s.stacks = 0; }
}

// FIX Batch 1 (bug: boss statuses never ticked / expired):
// tickStatuses now ticks BOTH enemies and bosses. Bosses use the same
// { statuses, pairIcd } shape as enemies, so one helper covers both.
// Frozen onBreak: when Frozen expires naturally, apply slow (slowT 2s).
function tickOne(world, e, dt) {
  if (!e.alive) return;
  if (!e.pairIcd) e.pairIcd = {};
  if (!e.statuses) e.statuses = {};
  // ICD bookkeeping lives on the status object; pair ICDs are keyed on the enemy.
  for (const k in e.pairIcd) {
    e.pairIcd[k] -= dt;
    if (e.pairIcd[k] <= 0) delete e.pairIcd[k];
  }
  for (const id in e.statuses) {
    const s = e.statuses[id];
    if (s.t <= 0) continue;
    const def = STATUS[id];
    if (!def) continue;
    s.t -= dt;
    if (def.dotPerStack && s.t > 0) {
      s.tick -= dt;
      if (s.tick <= 0) {
        s.tick += def.dotInterval;
        world.damageEnemy(e, def.dotPerStack * s.stacks, {
          element: 'fire', dot: true, silent: false, source: 'burning',
        });
        if (!e.alive) break;
      }
    }
    if (s.t <= 0) {
      s.t = 0; s.stacks = 0;
      // Frozen onBreak: expiring Frozen leaves the target slowed.
      if (id === 'frozen' && def.onBreak) e.slowT = def.onBreak.duration;
      world.bus.emit('status:expired', { enemy: e, id });
    }
  }
}

export function tickStatuses(world, dt) {
  const enemies = world.enemies.active || [];
  for (let i = enemies.length - 1; i >= 0; i--) tickOne(world, enemies[i], dt);
  // Bosses were missing here — that is why Aerated / Burning / Drenched
  // on a boss never expired and ICDs never cooled down.
  const bosses = world.bosses || [];
  for (let i = bosses.length - 1; i >= 0; i--) tickOne(world, bosses[i], dt);
  // Single-boss pointer (world.boss) is the same object as bosses[0],
  // so do NOT tick it again — that would double-tick.
}

export function statusMoveMult(e) {
  let m = 1;
  for (const id in e.statuses) {
    const s = e.statuses[id];
    if (s.t <= 0) continue;
    const def = STATUS[id];
    if (def.moveMult !== undefined) m = Math.min(m, def.moveMult);
  }
  return m;
}

export function statusDamageTakenMult(e) {
  let m = 1;
  for (const id in e.statuses) {
    const s = e.statuses[id];
    if (s.t <= 0) continue;
    const def = STATUS[id];
    if (def.damageBonus) m += def.damageBonus;
  }
  return m;
}
