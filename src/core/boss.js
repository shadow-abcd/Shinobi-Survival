// Bosses — The Ronin (5:00), The Twin (10:00), The Warden (15:00), The Sovereign (20:00).
// Each is a small state machine: approach → telegraph → resolve → recover, with a punish window.

const T = {
  approach: 'approach', tele: 'telegraph', strike: 'strike', recover: 'recover',
  dash: 'dash', counter: 'counter', vulnerable: 'vulnerable', cast: 'cast', dead: 'dead',
};

export const BOSS_DEFS = {
  ronin: { id: 'ronin', name: 'The Ronin', r: 34, hp: 1700, atk: 13, speed: 62, touch: 9, seals: 20 },
  twinRanged: { id: 'twinRanged', name: 'The Twin · Bow', r: 26, hp: 900, atk: 11, speed: 88, touch: 6, seals: 20, pair: 'twinMelee' },
  twinMelee: { id: 'twinMelee', name: 'The Twin · Blade', r: 28, hp: 1100, atk: 12, speed: 104, touch: 8, seals: 20, pair: 'twinRanged' },
  warden: { id: 'warden', name: 'The Warden', r: 46, hp: 3200, atk: 16, speed: 34, touch: 12, seals: 60 },
  sovereign: { id: 'sovereign', name: 'The Sovereign', r: 52, hp: 4200, atk: 12, speed: 48, touch: 14, seals: 100 },
};

export function createBoss(world, id) {
  const def = BOSS_DEFS[id];
  const ang = world.rng.angle();
  const dist = id === 'sovereign' ? 560 : 470;
  const b = {
    id, name: def.name, isBoss: true, alive: true,
    x: world.player.x + Math.cos(ang) * dist,
    y: world.player.y + Math.sin(ang) * dist,
    vx: 0, vy: 0, r: def.r,
    hp: def.hp * world.bossHpMult, maxHp: def.hp * world.bossHpMult,
    atk: def.atk, speed: def.speed, touch: def.touch,
    state: T.approach, stateT: 0, next: {}, phase: 1,
    face: 0, flash: 0, statuses: {}, pairIcd: {}, dmgMult: 1,
    kit: def, seals: def.seals, hitAccum: 0, swapDone: false,
    addsT: 0, enraged: false, enrageAt: 130,
  };
  // per-boss timers
  if (id === 'ronin') { b.next = { slash: 2.4, dash: 6, counter: 10 }; }
  if (id === 'twinRanged') { b.next = { volley: 2.0, trap: 6 }; }
  if (id === 'twinMelee') { b.next = { combo: 1.6, charge: 5 }; }
  if (id === 'warden') { b.next = { bash: 3.5, slam: 6, throw: 10, spin: 15, charge: 6 }; }
  if (id === 'sovereign') { b.next = { barrage: 3, eruption: 8, combo: 5, frost: 12, kirin: 10, chain: 6, bomb: 0 }; }
  return b;
}

export function updateBoss(world, b, dt) {
  if (!b.alive) return;
  const p = world.player;
  const dx = p.x - b.x, dy = p.y - b.y;
  const dist = Math.hypot(dx, dy) || 1;
  b.face = Math.atan2(dy, dx);
  b.flash = Math.max(0, b.flash - dt * 4);
  b.stateT -= dt;
  b.hitAccum = Math.max(0, b.hitAccum - dt * 0.6);
  if (b.enrageAt !== undefined) b.enrageAt -= dt;

  for (const k in b.next) b.next[k] -= dt;

  // enrage windows per spec
  if (!b.enraged && b.enrageAt !== undefined && b.enrageAt <= 0) {
    b.enraged = true;
    b.dmgMult *= 1.4;
    world.bus.emit('boss:enrage', { x: b.x, y: b.y });
  }

  switch (b.id) {
    case 'ronin': updateRonin(world, b, dt, dist); break;
    case 'twinRanged': updateTwinRanged(world, b, dt, dist); break;
    case 'twinMelee': updateTwinMelee(world, b, dt, dist); break;
    case 'warden': updateWarden(world, b, dt, dist); break;
    case 'sovereign': updateSovereign(world, b, dt, dist); break;
  }

  // phase transitions by HP for Warden / Sovereign
  if (b.id === 'warden') {
    const pct = b.hp / b.maxHp;
    if (b.phase === 1 && pct <= 0.66) { b.phase = 2; world.bus.emit('boss:phase', { boss: b, phase: 2 }); }
    if (b.phase === 2 && pct <= 0.33) {
      b.phase = 3;
      world.bus.emit('boss:phase', { boss: b, phase: 3 });
      for (let i = 0; i < 2; i++) world.spawnEnemy('teleporter', b.x + world.rng.range(-90, 90), b.y + world.rng.range(-90, 90));
    }
  }
  if (b.id === 'sovereign') {
    const pct = b.hp / b.maxHp;
    const want = pct > 0.75 ? 1 : pct > 0.5 ? 2 : pct > 0.25 ? 3 : 4;
    if (want !== b.phase) {
      b.phase = want;
      w_phase(world, b);
    }
  }

  // contact damage
  const pr = b.r + p.r;
  if ((p.x - b.x) ** 2 + (p.y - b.y) ** 2 < pr * pr && b.state !== T.dash) {
    b.touchT = (b.touchT || 0) - dt;
    if (b.touchT <= 0) { b.touchT = 0.7; world.damagePlayer(b.touch * b.dmgMult, 'boss'); }
  }
}

function w_phase(world, b) {
  world.bus.emit('boss:phase', { boss: b, phase: b.phase });
  if (b.phase === 2) { b.next.combo = 2; b.next.frost = 6; b.next.kirin = 99; }
  if (b.phase === 3) { b.next.kirin = 4; b.next.chain = 3; b.next.combo = 99; b.next.frost = 99; b.next.barrage = 99; b.next.eruption = 99; }
  if (b.phase === 4) {
    // the finale: telegraphed bomb, then everything speeds up
    world.spawnZone({ x: b.x, y: b.y, r: 600, delay: 3.0, damage: b.atk * 10 * b.dmgMult, toPlayer: true, color: '#c9a8ff' });
    b.next.bomb = 99;
    for (let i = 0; i < 4; i++) world.spawnEnemy('teleporter', b.x + world.rng.range(-140, 140), b.y + world.rng.range(-140, 140));
    world.requestExtraction(b);
  }
}

function moveToward(b, p, speed, dt, keep = 0) {
  const dx = p.x - b.x, dy = p.y - b.y;
  const d = Math.hypot(dx, dy) || 1;
  const s = d > keep ? speed : -speed * 0.5;
  b.x += (dx / d) * s * dt;
  b.y += (dy / d) * s * dt;
}

// ---------------- The Ronin ----------------
function updateRonin(world, b, dt, dist) {
  const p = world.player;
  switch (b.state) {
    case T.approach: {
      const want = 150;
      const spd = dist > want ? b.speed : b.speed * 0.35;
      moveToward(b, p, spd, dt, 0);
      if (b.next.dash <= 0) beginTelegraph(world, b, 'dash', 1.2, { kind: 'dash', len: 400 });
      else if (b.next.counter <= 0) beginCounter(world, b);
      else if (b.next.slash <= 0 && dist < 230) beginTelegraph(world, b, 'slash', 0.6, { kind: 'slash' });
      break;
    }
    case T.tele:
      if (b.stateT <= 0) {
        if (b.pending === 'slash') doSlash(world, b);
        else if (b.pending === 'dash') doDash(world, b);
      }
      break;
    case T.strike:
      if (b.stateT <= 0) { b.state = T.recover; b.stateT = 1.0; }
      break;
    case T.dash: {
      const t = 0.26;
      const step = 400 / t * dt;
      b.x += b.dashDir.x * step;
      b.y += b.dashDir.y * step;
      if (!b.hasHit) {
        const pr = b.r + p.r + 12;
        if ((p.x - b.x) ** 2 + (p.y - b.y) ** 2 < pr * pr) {
          b.hasHit = true;
          world.damagePlayer(b.atk * 2 * b.dmgMult, 'boss');
        }
      }
      if (b.stateT <= 0) { b.state = T.recover; b.stateT = 1.5; b.next.dash = 8; }
      break;
    }
    case T.recover:
      if (b.stateT <= 0) b.state = T.approach;
      break;
    case T.counter:
      if (b.stateT <= 0) { b.state = T.vulnerable; b.stateT = 2.0; }
      break;
    case T.vulnerable:
      if (b.stateT <= 0) { b.state = T.approach; b.next.counter = 12; }
      break;
  }
}

function beginTelegraph(world, b, pending, time, extra) {
  b.state = T.tele; b.stateT = time; b.pending = pending;
  b.next[pending] = pending === 'slash' ? 4 : pending === 'dash' ? 99 : 8;
  if (pending === 'dash') {
    const p = world.player;
    b.dashDir = { x: p.x - b.x, y: p.y - b.y };
    const d = Math.hypot(b.dashDir.x, b.dashDir.y) || 1;
    b.dashDir.x /= d; b.dashDir.y /= d;
  }
  world.bus.emit('boss:telegraph', {
    kind: extra.kind, x: b.x, y: b.y, angle: b.face, t: time, len: extra.len || 400,
  });
}

function doSlash(world, b) {
  b.state = T.strike; b.stateT = 0.25;
  const p = world.player;
  const reach = 200;
  if (Math.hypot(p.x - b.x, p.y - b.y) < reach + p.r) {
    let a = Math.atan2(p.y - b.y, p.x - b.x) - b.face;
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    if (Math.abs(a) < Math.PI / 2) world.damagePlayer(b.atk * 1.5 * b.dmgMult, 'boss');
  }
  world.bus.emit('boss:slash', { x: b.x, y: b.y, angle: b.face, reach, life: 0.25 });
}

function doDash(world, b) {
  b.state = T.dash; b.stateT = 0.26; b.hasHit = false;
}

function beginCounter(world, b) {
  b.state = T.counter; b.stateT = 0.8;
  b.next.counter = 99;
  b.counterHit = false;
  world.bus.emit('boss:counter', { x: b.x, y: b.y });
}

// ---------------- The Twin ----------------
function updateTwinRanged(world, b, dt, dist) {
  const p = world.player;
  if (b.dead || !b.alive) return;
  // keep distance, teleport if cornered
  if (dist < 220 && b.state === T.approach) {
    b.x = p.x + (b.x - p.x) * 3;
    b.y = p.y + (b.y - p.y) * 3;
    world.bus.emit('boss:blink', { x: b.x, y: b.y });
  } else if (b.state === T.approach) {
    moveToward(b, p, b.speed, dt, 300);
  }
  if (b.state === T.tele) { if (b.stateT <= 0) fireVolley(world, b); return; }
  if (b.state === T.recover) { if (b.stateT <= 0) b.state = T.approach; return; }

  if (b.next.trap <= 0) {
    b.next.trap = 10;
    world.spawnZone({ x: p.x, y: p.y, r: 95, delay: 1.2, damage: b.atk * 1.2 * b.dmgMult, color: '#7c5cff' });
  }
  if (b.next.volley <= 0) {
    b.next.volley = 5;
    b.state = T.tele; b.stateT = 0.5;
    world.bus.emit('boss:telegraph', { kind: 'volley', x: b.x, y: b.y, angle: b.face, t: 0.5 });
  }
}

function fireVolley(world, b) {
  b.state = T.recover; b.stateT = 0.6;
  const p = world.player;
  const base = Math.atan2(p.y - b.y, p.x - b.x);
  for (let i = -2; i <= 2; i++) {
    const a = base + i * 0.16;
    world.spawnEnemyProjectile({
      x: b.x, y: b.y, tx: b.x + Math.cos(a) * 400, ty: b.y + Math.sin(a) * 400,
      speed: 300, damage: b.atk * 0.8 * b.dmgMult, color: '#ffb0b0',
    });
  }
  world.bus.emit('boss:volley', { x: b.x, y: b.y });
}

function updateTwinMelee(world, b, dt, dist) {
  const p = world.player;
  if (b.state === T.approach) {
    moveToward(b, p, b.speed, dt, 60);
    if (b.next.charge <= 0) {
      b.state = T.tele; b.stateT = 0.8; b.pending = 'charge';
      b.next.charge = 7;
      const d = { x: p.x - b.x, y: p.y - b.y };
      const l = Math.hypot(d.x, d.y) || 1;
      b.dashDir = { x: d.x / l, y: d.y / l };
      world.bus.emit('boss:telegraph', { kind: 'dash', x: b.x, y: b.y, angle: Math.atan2(b.dashDir.y, b.dashDir.x), t: 0.8, len: 300 });
    } else if (b.next.combo <= 0 && dist < 120) {
      b.state = T.strike; b.stateT = 0.3;
      b.next.combo = 3;
      world.damagePlayer(b.atk * 0.7 * 3 * b.dmgMult, 'boss');
      world.bus.emit('boss:slash', { x: b.x, y: b.y, angle: b.face, reach: 110, life: 0.22 });
    }
  } else if (b.state === T.tele) {
    if (b.stateT <= 0) { b.state = T.dash; b.stateT = 0.3; b.hasHit = false; }
  } else if (b.state === T.dash) {
    const step = 300 / 0.3 * dt;
    b.x += b.dashDir.x * step;
    b.y += b.dashDir.y * step;
    if (!b.hasHit) {
      const pr = b.r + p.r + 10;
      if ((p.x - b.x) ** 2 + (p.y - b.y) ** 2 < pr * pr) {
        b.hasHit = true;
        world.damagePlayer(b.atk * 2 * b.dmgMult, 'boss');
      }
    }
    if (b.stateT <= 0) { b.state = T.recover; b.stateT = 0.8; }
  } else if (b.state === T.recover) {
    if (b.stateT <= 0) b.state = T.approach;
  } else if (b.state === T.strike) {
    if (b.stateT <= 0) b.state = T.approach;
  }
}

// ---------------- The Warden ----------------
function updateWarden(world, b, dt, dist) {
  const p = world.player;
  if (b.state === T.approach) {
    moveToward(b, p, b.speed, dt, 90);
    if (b.next.slam <= 0) {
      b.state = T.tele; b.stateT = 1.5; b.pending = 'slam';
      b.next.slam = 8;
      world.spawnZone({ x: b.x, y: b.y, r: 300, delay: 1.5, damage: b.atk * 3 * b.dmgMult, color: '#ffa060' });
      world.bus.emit('boss:telegraph', { kind: 'slam', x: b.x, y: b.y, angle: 0, t: 1.5 });
    } else if (b.next.bash <= 0) {
      b.state = T.tele; b.stateT = 0.6; b.pending = 'bash';
      b.next.bash = 5;
      world.bus.emit('boss:telegraph', { kind: 'slash', x: b.x, y: b.y, angle: b.face, t: 0.6 });
    } else if (b.phase >= 2 && b.next.throw <= 0) {
      b.next.throw = 10;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        world.spawnZone({ x: p.x + Math.cos(a) * 90, y: p.y + Math.sin(a) * 90, r: 80, delay: 1.0, damage: b.atk * 1.5 * b.dmgMult, color: '#d0d0d0' });
      }
    } else if (b.phase >= 2 && b.next.spin <= 0) {
      b.next.spin = 15;
      b.state = T.tele; b.stateT = 2.0; b.pending = 'spin';
      world.spawnZone({ x: b.x, y: b.y, r: 260, delay: 2.0, damage: b.atk * 4 * b.dmgMult, color: '#ffd27a' });
    } else if (b.phase >= 3 && b.next.charge <= 0) {
      b.next.charge = 6;
      b.state = T.tele; b.stateT = 0.9; b.pending = 'charge';
      const d = { x: p.x - b.x, y: p.y - b.y };
      const l = Math.hypot(d.x, d.y) || 1;
      b.dashDir = { x: d.x / l, y: d.y / l };
      world.bus.emit('boss:telegraph', { kind: 'dash', x: b.x, y: b.y, angle: Math.atan2(b.dashDir.y, b.dashDir.x), t: 0.9, len: 400 });
    }
  } else if (b.state === T.tele) {
    if (b.stateT <= 0) {
      if (b.pending === 'bash') {
        // 180° front cone, knockback
        const p2 = world.player;
        let a = Math.atan2(p2.y - b.y, p2.x - b.x) - b.face;
        while (a > Math.PI) a -= Math.PI * 2;
        while (a < -Math.PI) a += Math.PI * 2;
        if (Math.abs(a) < Math.PI / 2 && dist < 220 + b.r) {
          world.damagePlayer(b.atk * 2 * b.dmgMult, 'boss');
          world.pushPlayer(b.x, b.y, 200);
        }
        b.state = T.recover; b.stateT = 1.0;
      } else if (b.pending === 'slam') {
        b.state = T.vulnerable; b.stateT = 1.5;    // stationary punish window
      } else if (b.pending === 'spin') {
        b.state = T.recover; b.stateT = 1.2;
      } else if (b.pending === 'charge') {
        b.state = T.dash; b.stateT = 0.35; b.hasHit = false;
      }
    }
  } else if (b.state === T.dash) {
    const step = 400 / 0.35 * dt;
    b.x += b.dashDir.x * step;
    b.y += b.dashDir.y * step;
    if (!b.hasHit) {
      const pr = b.r + p.r + 14;
      if ((p.x - b.x) ** 2 + (p.y - b.y) ** 2 < pr * pr) {
        b.hasHit = true;
        world.damagePlayer(b.atk * 5 * b.dmgMult, 'boss');
      }
    }
    if (b.stateT <= 0) { b.state = T.recover; b.stateT = 1.0; }
  } else if (b.state === T.vulnerable) {
    if (b.stateT <= 0) b.state = T.approach;
  } else if (b.state === T.recover) {
    if (b.stateT <= 0) b.state = T.approach;
  }
}

// ---------------- The Sovereign ----------------
function updateSovereign(world, b, dt, dist) {
  const p = world.player;
  if (b.state === T.approach) {
    moveToward(b, p, b.speed, dt, 260);
    if (b.phase === 1) {
      if (b.next.eruption <= 0) {
        b.next.eruption = 10;
        for (let i = 0; i < 4; i++) {
          world.spawnZone({
            x: p.x + world.rng.range(-160, 160), y: p.y + world.rng.range(-160, 160),
            r: 110, delay: 1.5, damage: b.atk * 3 * b.dmgMult, color: '#ff7a2f',
          });
        }
      }
      if (b.next.barrage <= 0) { b.next.barrage = 4; fireVolley3(world, b); }
    } else if (b.phase === 2) {
      if (b.next.frost <= 0) {
        b.next.frost = 12;
        world.spawnZone({ x: b.x, y: b.y, r: 420, delay: 2.0, damage: b.atk * 4 * b.dmgMult, color: '#bfefff' });
        world.bus.emit('boss:telegraph', { kind: 'frost', x: b.x, y: b.y, angle: 0, t: 2.0 });
      }
      if (b.next.combo <= 0) { b.next.combo = 5; fireVolley3(world, b); }
    } else if (b.phase === 3) {
      if (b.next.kirin <= 0) {
        b.next.kirin = 15;
        world.spawnZone({ x: p.x, y: p.y, r: 130, delay: 2.0, damage: b.atk * 8 * b.dmgMult, color: '#ffe98a' });
        world.bus.emit('boss:telegraph', { kind: 'kirin', x: p.x, y: p.y, angle: 0, t: 2.0, len: 130 });
      }
      if (b.next.chain <= 0) {
        b.next.chain = 8;
        world.bus.emit('chain', { x1: b.x, y1: b.y, x2: p.x, y2: p.y });
        world.damagePlayer(b.atk * 1.2 * b.dmgMult, 'boss');
      }
    }
  }
}

function fireVolley3(world, b) {
  const p = world.player;
  const base = Math.atan2(p.y - b.y, p.x - b.x);
  for (let i = -1; i <= 1; i++) {
    const a = base + i * 0.22;
    world.spawnEnemyProjectile({
      x: b.x, y: b.y, tx: b.x + Math.cos(a) * 400, ty: b.y + Math.sin(a) * 400,
      speed: 320, damage: b.atk * 1.5 * b.dmgMult, color: '#ff9a5a',
    });
  }
}
