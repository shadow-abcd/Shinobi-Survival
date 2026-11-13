// World: the fixed-tick simulation. Pure logic — no DOM, no rendering (so tests can run it headless).
import { RNG } from './rng.js';
import { Bus } from './bus.js';
import { Pool } from './pools.js';
import { Grid } from './grid.js';
import { ABILITIES, RANK_MULT, FUSIONS, fusionKey, ULTIMATE_COST, ELEMENTS } from './abilities.js';
import { STATUS, applyStatus, tickStatuses, statusDamageTakenMult, stacksOf } from './statuses.js';
import { ENEMY_TYPES, enemyHP, spawnRate, maxOnScreen, spawnPod, updateEnemy } from './enemies.js';
import { createBoss, updateBoss, BOSS_DEFS } from './boss.js';
import { rollChoices, applyChoice, PASSIVES, banishChoice } from './upgrades.js';
import { metaModifiers } from './meta.js';

export const TICK = 1 / 60;
export const RUN_LENGTH = 1200;        // 20 minutes: four bosses, three world phases
const BOSS_TIMES = [300, 600, 900, 1200];

export class World {
  constructor(seed = 1337) {
    this.rng = new RNG(seed);
    this.bus = new Bus();
    this.grid = new Grid(56);
    this.viewW = 1280; this.viewH = 720;
    this.reset(seed);
  }

  reset(seed, save) {
    this.save = save || this.save || null;
    this.rng = new RNG(seed);
    // FIX Batch 1: do NOT clear bus here. App / renderer / audio listeners
    // are bound once and must survive reset(). Bus.clear() is now a no-op.
    this.t = 0;
    this.frame = 0;
    this.state = 'playing';
    this.kills = 0;
    this.damageDealt = 0;
    this.dpsBuf = new Array(12).fill(0);
    this.dpsIdx = 0;
    this.dpsAcc = 0;
    this.dpsMark = 0;
    this.spawnAcc = 0;
    this.pendingLevels = 0;
    this.pendingChoices = null;
    this.bossSpawned = false;
    this.boss = null;
    this.bosses = [];
    this.stageIndex = 0;
    this.bossActive = false;
    this.safeT = 0;
    this.phase = 1;
    this.bossHpMult = 1;
    this.choiceBoss = null;
    this.extracted = false;
    this.bossKilledAt = 0;
    this._bossAwarded = false;
    this.shake = 0;
    this.hitstop = 0;
    this.slowmo = 0;
    this.lastBossHp = 0;

    this.player = {
      x: 0, y: 0, vx: 0, vy: 0, r: 13,
      hp: 150, maxHp: 150, speedMult: 1, dmgMult: 1, cdr: 0, crit: 0.05, magnetMult: 1,
      atk: 10, facing: { x: 1, y: 0 },
      // FIX Batch 4 (XP curve): design is XP to level N = 15 * 1.12^(N-1). Was 18 * 1.13^(N-1) — ~2x too slow at level 40.
      level: 1, xp: 0, xpNeed: 15, chakra: 0, overcharge: false,
      // FIX Batch 5 (Rank): Genin 5 passives / 1 dash, Chunin 6 passives, Jonin 2 dashes, Kage Flow State.
      rank: 'genin', maxPassives: 5, dashMax: 1, dashCharges: 1, flowUnlocked: false, flowUsed: false, flowT: 0,
      // FIX Batch 6 (Banish): 1 free per run + Academy purchases (save.banish 0-2), max 3. Set in reset() from save.
      banishCharges: 1,
      dashCd: 0, dashT: 0, iframe: 0, dashDir: { x: 1, y: 0 },
      hitFlash: 0, invulnFlash: 0, moving: false, kills: 0, regenT: 0,
    };
    const m = this.save ? metaModifiers(this.save) : {
      clan: null, maxHp: 150, speedMult: 1, chakraMult: 1, dmgMult: 1, magnetMult: 1,
      crit: 0.05, ascension: 0, enemyHpMult: 1, enemyCountMult: 1, noSafeZone: false,
      regen: 0, slow: 0, legacy: false,
    };
    this.meta = m;
    // FIX Batch 6: Banish pool starts empty each run. Charges = 1 free + Academy-bought (save.banish), capped at 3.
    this.banished = new Set();
    this.player.banishCharges = Math.min(3, 1 + (this.save?.banish || 0));
    const p0 = this.player;
    p0.maxHp = m.maxHp; p0.hp = m.maxHp;
    p0.speedMult = m.speedMult; p0.dmgMult = m.dmgMult; p0.magnetMult = m.magnetMult; p0.crit = m.crit;
    this.chakraMult = m.chakraMult;
    this.ascension = m.ascension;
    this.enemyHpMult = m.enemyHpMult;
    this.enemyCountMult = m.enemyCountMult;
    this.noSafeZone = m.noSafeZone;
    this.clan = m.clan;
    this.clanRegen = m.regen || 0;
    this.stonewardSlow = m.slow || 0;
    this.abilities = [{ id: 'fireball', rank: 1, cd: 0, cdMax: ABILITIES.fireball.cd }];
    this.passives = [];
    this.ultimate = this.ultimate || 'cataclysm';
    this.buffs = { spectral: 0, lightningArmor: 0 };
    this._thornsCd = 0;
    this.input = { x: 0, y: 0, dash: false, ult: false };

    // pools (memo A5.1 budgets, scaled to what Phase 1 actually needs)
    this.enemies = new Pool(1500, () => ({
      x: 0, y: 0, vx: 0, vy: 0, r: 12, hp: 1, maxHp: 1, speed: 90, type: 'fodder',
      alive: false, active: false, statuses: {}, pairIcd: {}, touchT: 0, fireT: 0,
      slowT: 0, stunT: 0, xp: 1, flash: 0, spawnT: 0, strafe: 1, maxHpBase: 1,
    }), (o) => {
      o.statuses = {}; o.pairIcd = {}; o.touchT = 0; o.fireT = 0; o.slowT = 0;
      o.stunT = 0; o.flash = 0; o.spawnT = 1; o.strafe = 1; o.alive = true;
    });
    this.projectiles = new Pool(400, () => ({
      x: 0, y: 0, vx: 0, vy: 0, r: 6, life: 1, damage: 0, element: 'fire',
      status: null, statusStacks: 1, pierce: 0, burst: 0, target: null, speed: 0,
      hit: new Set(), color: '#fff', shape: 'orb', active: false, spin: 0, heal: 0, bolt: false,
    }), (o) => { o.hit = new Set(); o.target = null; o.pierce = 0; o.burst = 0; o.life = 2; });
    this.eproj = new Pool(300, () => ({
      x: 0, y: 0, vx: 0, vy: 0, r: 6, life: 4, damage: 8, color: '#7fc4ff', active: false,
    }), (o) => { o.life = 4; });
    this.fields = new Pool(200, () => ({
      x: 0, y: 0, r: 40, life: 1, tickRate: 0.5, tickT: 0, damage: 0, element: 'fire',
      status: null, statusStacks: 1, color: '#ff7a2f', kind: 'wall', explode: null, active: false,
    }), (o) => { o.explode = null; o.tickT = 0; });
    this.cones = new Pool(60, () => ({
      x: 0, y: 0, angle: 0, range: 300, halfAngle: 1, life: 0.3, total: 0.3,
      damage: 0, element: 'fire', status: null, statusStacks: 1, color: '#f83', hit: false, active: false,
    }), (o) => { o.hit = false; });
    this.bursts = new Pool(80, () => ({
      x: 0, y: 0, r: 100, life: 0.4, total: 0.4, damage: 0, element: 'fire',
      status: null, statusStacks: 1, color: '#fff', hit: false, active: false, ultimate: false,
    }), (o) => { o.hit = false; o.ultimate = false; });
    this.summons = new Pool(40, () => ({
      x: 0, y: 0, r: 14, life: 4, total: 4, fireT: 0, fireRate: 0.6, damage: 10,
      element: 'water', status: null, stacks: 1, range: 420, kind: 'clone', active: false,
      target: null, angle: 0, taunt: false,
    }), (o) => { o.fireT = 0; o.target = null; });
    this.zones = new Pool(60, () => ({
      x: 0, y: 0, r: 120, delay: 1.2, t: 0, damage: 0, toPlayer: true,
      color: '#ff6b6b', kind: 'circle', active: false, fired: false,
    }), (o) => { o.t = 0; o.fired = false; });
    this.barriers = new Pool(20, () => ({
      x: 0, y: 0, r: 200, life: 5, total: 5, active: false,
    }), (o) => {});
    this.gems = new Pool(600, () => ({
      x: 0, y: 0, vx: 0, vy: 0, value: 1, r: 5, t: 0, active: false, purple: false,
    }), (o) => { o.t = 0; o.vy = 0; });
    this.tex = new Map();

    this._scratch = [];
    this._sB = [];
    this._sC = [];
    this._nb = [];
  }

  // ---------- helpers ----------
  get minutes() { return this.t / 60; }
  viewDiag() { return Math.hypot(this.viewW, this.viewH); }

  maxOnScreen() { return Math.round(maxOnScreen(this.minutes) * (this.enemyCountMult || 1)); }

  spawnTable(min) {
    const t = [];
    t.push({ id: 'fodder', w: 10 });
    if (min > 2.2) t.push({ id: 'brute', w: 1.6 + min * 0.10 });
    if (min > 3.2) t.push({ id: 'archer', w: 2.2 });
    // FIX Batch 1 (bug: elites never spawned in normal spawner):
    // Shunshin + Siphoner appear from minute 9, rare but present.
    if (min > 9) t.push({ id: 'teleporter', w: 0.9 });
    if (min > 9) t.push({ id: 'siphoner', w: 0.9 });
    return t;
  }

  calcDamage(coeff, rank) {
    const sus = this.buffs && this.buffs.spectral > 0 ? 1.5 : 1;
    return coeff * RANK_MULT[rank] * this.player.atk * this.player.dmgMult * (this._empowerDmg || 1) * sus;
  }

  recalc() {
    const p = this.player;
    p.cdr = Math.min(0.7, p.cdr);
    // FIX Batch 5 (Flow State): while Flow is active, effective CDR is 70% regardless of base CDR.
    const effCdr = p.flowT > 0 ? 0.7 : p.cdr;
    for (const ab of this.abilities) {
      const base = ABILITIES[ab.id].cd;
      ab.cdMax = Math.max(0.2, base * (1 - effCdr));
    }
  }

  // FIX Batch 5 (Breakthrough): promotion is sequential, never reversed, no stat boost.
  promote(rank) {
    const order = ['genin', 'chunin', 'jonin', 'kage'];
    const cur = order.indexOf(this.player.rank || 'genin');
    const next = order.indexOf(rank);
    if (next !== cur + 1) return false;
    this.player.rank = rank;
    if (rank === 'chunin') this.player.maxPassives = 6;
    if (rank === 'jonin') { this.player.dashMax = 2; this.player.dashCharges = 2; this.player.dashCd = 0; }
    if (rank === 'kage') this.player.flowUnlocked = true;
    this.bus.emit('rank:breakthrough', { rank });
    this.recalc();
    return true;
  }

  // ---------- spawning ----------
  spawnEnemy(typeId, x, y) {
    const def = ENEMY_TYPES[typeId];
    const e = this.enemies.spawn();
    if (!e) return null;
    const hp = enemyHP(this.minutes) * def.hpMult * (this.enemyHpMult || 1);
    e.type = typeId;
    e.x = x; e.y = y;
    e.vx = 0; e.vy = 0;
    e.r = def.r;
    e.hp = hp; e.maxHp = hp;
    e.speed = def.speed * this.rng.range(0.9, 1.12);
    e.touchT = this.rng.range(0.2, 0.6);
    e.fireT = def.fireCd ? this.rng.range(0.5, def.fireCd) : 0;
    e.xp = def.xp;
    e.strafe = this.rng.chance(0.5) ? 1 : -1;
    e.alive = true;
    e.spawnT = 0.25;
    return e;
  }

  spawnProjectile(o) {
    const p = this.projectiles.spawn();
    if (!p) return false;
    const dx = o.target.x - o.x, dy = o.target.y - o.y;
    const d = Math.hypot(dx, dy) || 1;
    p.x = o.x; p.y = o.y;
    p.speed = o.speed;
    p.vx = (dx / d) * o.speed; p.vy = (dy / d) * o.speed;
    p.r = o.r;
    p.life = o.life;
    p.damage = o.damage;
    p.element = o.element;
    p.status = o.status;
    p.statusStacks = (o.statusStacks || 1) + (this._empowerStacks || 0);
    p.pierce = o.pierce;
    p.burst = (o.burst || 0) * (this._empowerRadius || 1);
    p.target = o.target;
    p.color = o.color;
    p.shape = o.shape || 'orb';
    p.heal = o.heal || 0;
    p.bolt = !!o.bolt;
    p.spin = 0;
    return true;
  }

  spawnEnemyProjectile(o) {
    const p = this.eproj.spawn();
    if (!p) return;
    const dx = o.tx - o.x, dy = o.ty - o.y;
    const d = Math.hypot(dx, dy) || 1;
    p.x = o.x; p.y = o.y;
    p.vx = (dx / d) * o.speed; p.vy = (dy / d) * o.speed;
    p.damage = o.damage;
    p.color = o.color;
    p.life = 4;
  }

  spawnField(o) {
    const f = this.fields.spawn();
    if (!f) return;
    f.x = o.x; f.y = o.y; f.r = (o.r || 40) * (this._empowerRadius || 1);
    f.life = o.life; f.tickRate = o.tickRate || 0.5; f.tickT = 0;
    f.damage = o.damage; f.element = o.element; f.status = o.status;
    f.statusStacks = (o.statusStacks || 1) + (this._empowerStacks || 0);
    f.color = o.color; f.kind = o.kind || 'wall';
    f.explode = o.explode ? { ...o.explode, r: o.explode.r * (this._empowerRadius || 1),
      damage: o.explode.damage * (this._empowerDmg || 1) } : null;
  }

  spawnCone(o) {
    const c = this.cones.spawn();
    if (!c) return;
    c.x = o.x; c.y = o.y; c.angle = o.angle;
    c.range = o.range * (this._empowerRadius || 1);
    c.halfAngle = o.halfAngle; c.life = o.life; c.total = o.life;
    c.damage = o.damage; c.element = o.element; c.status = o.status;
    c.statusStacks = (o.statusStacks || 1) + (this._empowerStacks || 0);
    c.color = o.color; c.hit = false;
  }

  spawnZone(o) {
    const z = this.zones.spawn();
    if (!z) return null;
    z.x = o.x; z.y = o.y; z.r = o.r; z.delay = o.delay; z.t = o.delay;
    z.damage = o.damage || 0; z.toPlayer = o.toPlayer !== false;
    z.color = o.color || '#ff6b6b'; z.kind = o.kind || 'circle';
    this.bus.emit('zone', { x: o.x, y: o.y, r: o.r, delay: o.delay, color: z.color });
    return z;
  }

  spawnBurst(o) {
    const b = this.bursts.spawn();
    if (!b) return;
    b.x = o.x; b.y = o.y; b.r = o.r * (this._empowerRadius || 1);
    b.life = o.life; b.total = o.life;
    b.damage = o.damage; b.element = o.element; b.status = o.status;
    b.statusStacks = (o.statusStacks || 1) + (this._empowerStacks || 0);
    b.color = o.color; b.hit = false;
    b.ultimate = !!o.ultimate;
  }

  spawnGem(x, y, value, purple = false) {
    const g = this.gems.spawn();
    if (!g) return;
    g.x = x; g.y = y; g.vx = this.rng.range(-40, 40); g.vy = this.rng.range(-40, 40);
    g.value = value; g.t = 0; g.purple = purple;
  }

  // ---------- targets ----------
  targetNearest(x, y, range) {
    let best = null, bd = range * range;
    // The boss is the objective: jutsu prefer it whenever it is in range.
    for (let i = 0; i < this.bosses.length; i++) {
      const b = this.bosses[i];
      if (!b.alive) continue;
      const d = (b.x - x) ** 2 + (b.y - y) ** 2;
      if (d < range * range) return b;
    }
    const list = this.enemies.active;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (!e.alive) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bd) { bd = d; best = e; }
    }
    if (this.boss && this.boss.alive) {
      const d = (this.boss.x - x) ** 2 + (this.boss.y - y) ** 2;
      if (d < bd * 1.15) best = this.boss;
    }
    return best;
  }

  targetDensest(x, y, range, clusterR) {
    const list = this.enemies.active;
    let best = null, bestScore = -1;
    const step = 3;
    for (let i = 0; i < list.length; i += step) {
      const e = list[i];
      if (!e.alive) continue;
      if ((e.x - x) ** 2 + (e.y - y) ** 2 > range * range) continue;
      this.grid.queryCircle(e.x, e.y, clusterR, this._sC);
      const score = this._sC.length;
      if (score > bestScore) { bestScore = score; best = e; }
    }
    return best;
  }

  // ---------- damage pipeline ----------
  damageEnemy(e, amount, opts = {}) {
    if (!e || !e.alive) return 0;
    const p = this.player;

    // step 5 — status application
    if (opts.status && !opts.dot) applyStatus(this, e, opts.status, { stacks: opts.statusStacks || 1, source: opts.source });

    // step 6 — prime / detonate
    let dmg = amount;
    let det = null;
    if (!opts.dot) {
      for (const id in e.statuses) {
        const s = e.statuses[id];
        if (s.t <= 0) continue;
        const def = STATUS[id];
        if (!def.detonatedBy || def.detonatedBy !== opts.element) continue;
        const icdKey = def.detonatedBy + '>' + id;
        if (e.pairIcd[icdKey] > 0) continue;
        e.pairIcd[icdKey] = def.icd;
        det = { id, def };
        break;
      }
    }

    let crit = false;
    if (opts.crit !== undefined) crit = opts.crit;
    else if (!opts.dot) {
      const fireBonus = this.clan === 'ember' && opts.element === 'fire' ? 0.10 : 0;
      if (this.rng.chance(p.crit + fireBonus)) crit = true;
    }

    // clan traits (memo §3 — mechanical, never raw percentage stats)
    if (!opts.dot) {
      if (this.clan === 'ember' && this.rng.chance(0.15)) applyStatus(this, e, 'stunned', { stacks: 1, source: 'clan' });
      if (this.clan === 'gale') {
        const dx = e.x - p.x, dy = e.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        e.x += (dx / d) * 26; e.y += (dy / d) * 26;
        applyStatus(this, e, 'staggered', { stacks: 1, source: 'clan' });
      }
    }
    // FIX Batch 3 (Burn DoT is FLAT): Stoneward + Staggered multipliers do NOT apply to DoT. Design: Burn stacks add FLAT after multipliers.
    if (!opts.dot && this.stonewardSlow && e.stonewardMarked) dmg *= 1.10;

    // step 7 — damage calculation
    if (!opts.dot) dmg *= statusDamageTakenMult(e);
    if (crit) dmg *= 1.5;
    if (det) dmg *= det.def.detonateMult;
    // FIX Batch 2 (Warden front armor): 60% blocked from the front, full from behind, none when vulnerable.
    // Front = within 90 deg of the Warden's facing. Facing locks during telegraph (boss.js), so circling behind is the counterplay.
    // DoT is not directional — Warden front armor does not block Burning ticks.
    if (!opts.dot && e.isBoss && e.id === 'warden' && e.state !== 'vulnerable' && e.state !== 'dead') {
      const angToPlayer = Math.atan2(p.y - e.y, p.x - e.x);
      let diff = angToPlayer - (e.face || 0);
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) < Math.PI / 2) {
        const before = dmg;
        dmg *= 0.4;
        if (before > 0) this.bus.emit('boss:armor', { x: e.x, y: e.y, blocked: before - dmg });
      }
    }

    // FIX Batch 1 (bug: Ronin counter was flat 9 damage):
    // Counter reflects 50% of the damage that would have been dealt.
    if (e.isBoss && e.state === 'counter') {
      this.damagePlayer(dmg * 0.5, 'counter');
      e.flash = 1;
      this.bus.emit('counter:reflect', { x: e.x, y: e.y });
      return 0;
    }

    const hpBefore = e.hp;
    e.hp -= dmg;
    e.flash = 1;
    this.damageDealt += dmg;
    this.bus.emit('damage', { x: e.x, y: e.y - e.r, amount: dmg, crit, detonate: !!det, dot: !!opts.dot, element: opts.element });

    if (det) {
      this.detonate(e, det, dmg, opts);
    } else if (!opts.dot && opts.element) {
      // No prime/detonate pair: a status already on the target may still form a fusion with this element.
      for (const sid in e.statuses) {
        if (e.statuses[sid].t <= 0) continue;
        const key = fusionKey(opts.element, STATUS[sid].element);
        if (FUSIONS[key]) { this.fireFusion(e, key); break; }
      }
    }

    if (e.hp <= 0) this.killEnemy(e, { ...opts, hpBefore });
    return dmg;
  }

  detonate(e, det, dmg, opts) {
    const def = det.def;
    // D1: the trigger status is removed, and cannot be re-applied by this detonation.
    const s = e.statuses[det.id];
    s.t = 0; s.stacks = 0;
    // FIX Batch 1 (bug: Frozen onBreak never applied):
    // Shattering Frozen leaves the target slowed for 2s.
    if (det.id === 'frozen' && def.onBreak) e.slowT = def.onBreak.duration;
    this.bus.emit('detonate', {
      x: e.x, y: e.y, status: det.id, element: opts.element, r: def.spread ? 130 : 110,
    });
    this.shake = Math.min(9, this.shake + 2.2);
    this.hitstop = Math.max(this.hitstop, 0.045);
    // Fire + Wind is the fusion pair: the detonation itself is Firestorm (memo C9).
    const key = fusionKey(opts.element, def.element);
    if (FUSIONS[key]) this.fireFusion(e, key);
    if (!def.spread) return;
    // D3/D4: spread the primed status to a capped number of neighbours, one hop, no cascade.
    this.grid.queryCircle(e.x, e.y, 150, this._sB);
    let n = 0;
    for (let i = 0; i < this._sB.length && n < def.spread; i++) {
      const o = this._sB[i];
      if (o === e || !o.alive) continue;
      if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 > 150 * 150) continue;
      applyStatus(this, o, det.id, { stacks: 1, source: 'spread' });
      n++;
    }
  }

  fireFusion(e, key) {
    const icd = 'fusion:' + key;
    if (e.pairIcd[icd] > 0) return;
    e.pairIcd[icd] = 2.5;
    const f = FUSIONS[key];
    // FIX Batch 3 (fusion scaling): fusion damage now scales with the parents' ranks.
    // Old code was calcDamage(coeff, 1) * 0.6 — always Rank 1, always 40% nerfed — so a R5+R5 build fused for the same damage as R1+R1.
    // Now: average rank of the highest owned ability of each element in the pair. Fallback 3 = min rank to unlock fusion per design,
    // so Cataclysm / status-only triggers (no owned abilities) still fuse at a sane value and the combat test still passes.
    const [elA, elB] = key.split('+');
    const rankFor = (el) => {
      let best = 0;
      for (const a of this.abilities) {
        const def = ABILITIES[a.id];
        if (def && def.element === el) best = Math.max(best, a.rank);
      }
      return best;
    };
    const rA = rankFor(elA), rB = rankFor(elB);
    const fusionRank = (rA > 0 && rB > 0) ? Math.max(1, Math.round((rA + rB) / 2)) : 3;
    this.spawnBurst({
      x: e.x, y: e.y, r: f.r, life: 0.45,
      damage: this.calcDamage(f.coeff, fusionRank),
      element: f.element || 'fire', status: f.status, statusStacks: f.stacks, color: f.color,
    });
    this.shake = Math.min(10, this.shake + 2.5);
    this.hitstop = Math.max(this.hitstop, 0.06);
    this.bus.emit('fusion', { x: e.x, y: e.y, id: f.id, name: f.name });
  }

  killEnemy(e, opts = {}) {
    if (!e.alive) return;
    e.alive = false;
    if (e.isBoss) {
      this.addChakra(50);
      this.bus.emit('boss:death', { x: e.x, y: e.y, id: e.id, name: e.name });
      this.onBossKilled(e);
      return;
    }
    const def = ENEMY_TYPES[e.type] || { xp: 1 };
    const isElite = e.type === 'brute' || e.type === 'teleporter' || e.type === 'siphoner';
    this.spawnGem(e.x, e.y, e.xp, isElite);
    this.player.kills++;
    this.kills++;
    this.addChakra(isElite ? 10 : 1);
    // FIX Batch 1 (bug: Tide heal always true):
    // Old code checked e.hp < 30% AFTER death (e.hp <= 0, always true).
    // Now check hp BEFORE the killing blow, passed in as opts.hpBefore.
    const hpBeforeKill = opts.hpBefore !== undefined ? opts.hpBefore : e.hp;
    if (this.clan === 'tide' && hpBeforeKill < e.maxHp * 0.3) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
    }
    // FIX Batch 1 (bug: Marked onDeathChain never fired):
    // A Marked enemy that dies chains to up to 2 neighbours.
    if (e.statuses && e.statuses.marked && e.statuses.marked.t > 0 && !opts.noChain) {
      e.statuses.marked.t = 0; e.statuses.marked.stacks = 0;
      this.grid.queryCircle(e.x, e.y, 150, this._sB);
      let chained = 0;
      for (let i = 0; i < this._sB.length && chained < 2; i++) {
        const o = this._sB[i];
        if (o === e || !o.alive) continue;
        if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 > 150 * 150) continue;
        this.bus.emit('chain', { x1: e.x, y1: e.y, x2: o.x, y2: o.y });
        this.damageEnemy(o, e.maxHp * 0.2, { element: 'earth', noChain: true, source: 'marked-chain' });
        chained++;
      }
    }
    this.bus.emit('kill', { x: e.x, y: e.y, type: e.type, r: e.r, color: def.color });
  }

  recentDPS() {
    let sum = 0;
    for (let i = 0; i < this.dpsBuf.length; i++) sum += this.dpsBuf[i];
    return sum / this.dpsBuf.length;
  }

  spawnBossStage(i) {
    const ids = [['ronin'], ['twinRanged', 'twinMelee'], ['warden'], ['sovereign']][i] || [];
    this.bosses = ids.map((id) => createBoss(this, id));
    // Boss health tracks the build the player actually has: a fixed HP pool is either a
    // speed bump for a maxed build or a wall for a weak one. Target ~30 s of the current DPS.
    // Boss health scales with the build the player actually has, measured on the previous
    // fights (single-target DPS, not the AoE-inflated global figure), so each duel runs ~30 s.
    const dps = this.lastBossDps || 110;
    for (const b of this.bosses) {
      const want = Math.min(b.maxHp * 8, Math.max(b.maxHp, dps * 28));
      b.hp = b.maxHp = Math.round(want);
      b.spawnAt = this.t;
      b.hpAtSpawn = b.hp;
    }
    this.boss = this.bosses[0];
    for (const b of this.bosses) this.bus.emit('boss:spawn', b);
    this.bus.emit('boss:wave', { stage: i });
    this.bus.emit('stage:boss', { stage: i, bosses: this.bosses });
  }

  onBossKilled(b) {
    if (b.awarded) return;
    b.awarded = true;
    b.alive = false;
    const dur = Math.max(1, this.t - (b.spawnAt || this.t));
    const dps = (b.hpAtSpawn || b.maxHp) / dur;
    this.lastBossDps = this.lastBossDps ? this.lastBossDps * 0.5 + dps * 0.5 : dps;
    const alive = this.bosses.filter((x) => x.alive);
    if (alive.length > 0) {
      // The Twin: the survivor absorbs the other's power (spec, phase 2).
      for (const other of alive) {
        other.hp = other.maxHp;
        other.dmgMult *= 1.3;
        other.speed *= 1.2;
        other.phase = 2;
        other.state = 'approach';
      }
      this.bus.emit('boss:absorb', {});
      return;
    }
    this.bossActive = false;
    this.stageIndex++;
    this.safeT = this.noSafeZone ? 0 : 12;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.4);
    this.phase = Math.min(3, this.stageIndex + 1);
    this.bus.emit('stage:clear', { stage: this.stageIndex, phase: this.phase });
    if (this.stageIndex >= 4) {
      this.state = 'won';
      this.bus.emit('run:end', { win: true });
    }
  }

  // The Sovereign's 25% choice: keep fighting or extract.
  requestExtraction(boss) {
    if (this.state !== 'playing') return;
    this.choiceBoss = boss;
    this.state = 'choice';
    this.bus.emit('choice', { kind: 'extract' });
  }

  resumeFight() {
    if (this.state !== 'choice') return;
    this.choiceBoss = null;
    this.state = 'playing';
  }

  extract() {
    this.extracted = true;
    this.choiceBoss = null;
    this.state = 'won';
    this.bus.emit('run:end', { win: true, extracted: true });
  }

  pushPlayer(fromX, fromY, force) {
    const p = this.player;
    const dx = p.x - fromX, dy = p.y - fromY;
    const d = Math.hypot(dx, dy) || 1;
    p.x += (dx / d) * force;
    p.y += (dy / d) * force;
  }

  addChakra(n) {
    const p = this.player;
    p.chakra = Math.min(100, p.chakra + n * (this.chakraMult || 1));
    if (p.chakra >= 100) {
      if (!p.overcharge) this.bus.emit('chakra:full', {});
      p.overcharge = true;
    }
  }

  damagePlayer(amount, source = 'melee') {
    const p = this.player;
    if (this.state !== 'playing') return;
    if (p.iframe > 0) return;
    if (this.buffs.spectral > 0) amount *= 0.1;
    if (this.buffs.lightningArmor > 0 && this._thornsCd <= 0) {
      this._thornsCd = 0.4;
      const list = this.enemies.active;
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if (!e.alive) continue;
        if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < 130 * 130) {
          this.damageEnemy(e, this.calcDamage(0.5, 1), { element: 'lightning', crit: false });
        }
      }
      this.bus.emit('thorns', { x: p.x, y: p.y });
    }
    p.hp -= amount;
    p.iframe = 0.45;              // brief mercy window after any hit, so a crowd cannot shred in one tick
    p.hitFlash = 1;
    this.shake = Math.min(12, this.shake + 3.5);
    this.lastHitSource = source;
    this.bus.emit('player:hurt', { amount, source });
    if (p.hp <= 0) {
      p.hp = 0;
      this.state = 'dead';
      this.bus.emit('run:end', { win: false, source });
    }
  }

  // ---------- abilities ----------
  castAbility(ab) {
    const p = this.player;
    const armed = p.overcharge;
    this._empowerDmg = armed ? 1.5 : 1;
    this._empowerRadius = armed ? 1.3 : 1;
    this._empowerStacks = armed ? (this.clan === 'tide' ? 2 : 1) : 0;
    if (armed) p.overcharge = false;
    let ok = false;
    try { ok = this.castJutsu(ab); } catch (err) { ok = false; }
    this._empowerDmg = 1; this._empowerRadius = 1; this._empowerStacks = 0;
    if (ok) {
      ab.cd = ab.cdMax;
      this.bus.emit('cast', { id: ab.id, empowered: armed, element: ABILITIES[ab.id].element });
      if (armed) this.shake = Math.min(8, this.shake + 1.6);
    }
    ab.cd = Math.max(0, ab.cd);
    return ok;
  }

  // targeting modes (design §5.2)
  acquireTarget(def) {
    const p = this.player;
    const range = def.range || 600;
    switch (def.target) {
      case 'self': return p;
      case 'nearest': return this.targetNearest(p.x, p.y, range);
      case 'densest': return this.targetDensest(p.x, p.y, range, 160);
      case 'facing': return this.targetFacing(p.x, p.y, range, p.facing) || this.targetNearest(p.x, p.y, range);
      case 'fixed': return this.targetNearest(p.x, p.y, range);
      default: return this.targetNearest(p.x, p.y, range);
    }
  }

  targetFacing(x, y, range, dir) {
    let best = null, bestScore = -Infinity;
    const list = this.enemies.active;
    const dl = Math.hypot(dir.x, dir.y) || 1;
    const fx = dir.x / dl, fy = dir.y / dl;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (!e.alive) continue;
      const dx = e.x - x, dy = e.y - y;
      const d = Math.hypot(dx, dy);
      if (d > range || d < 1) continue;
      const align = (dx / d) * fx + (dy / d) * fy;
      if (align < 0.25) continue;
      const score = align * 2 - d / range;
      if (score > bestScore) { bestScore = score; best = e; }
    }
    if (!best && this.boss && this.boss.alive) best = this.boss;
    return best;
  }

  castJutsu(ab) {
    const def = ABILITIES[ab.id];
    const p = this.player;
    const dmg = this.calcDamage(def.coeff, ab.rank);
    const target = this.acquireTarget(def);

    if (def.kind === 'projectile') {
      if (!target) return false;
      return this.spawnProjectile({
        x: p.x, y: p.y, target, speed: def.speed, r: def.r, life: 2.4,
        pierce: def.pierce || 0, burst: def.burst || 0, damage: dmg,
        element: def.element, status: def.status, statusStacks: def.stacks || 0,
        color: ELEMENTS[def.element].color, shape: def.shape, heal: def.heal || 0, bolt: !!def.bolt,
      });
    }

    if (def.kind === 'burst' || def.kind === 'spike') {
      const at = target || { x: p.x, y: p.y };
      if (def.pull) this.pullEnemies(at.x, at.y, def.r * 2.2, def.pull);
      this.spawnBurst({
        x: at.x, y: at.y, r: def.r, life: def.kind === 'spike' ? 0.3 : 0.4,
        damage: dmg, element: def.element, status: def.status, statusStacks: def.stacks || 0,
        color: ELEMENTS[def.element].color, bolt: !!def.bolt,
      });
      return true;
    }

    if (def.kind === 'cone') {
      let ang;
      if (def.target === 'self') ang = Math.atan2(p.facing.y, p.facing.x);
      else if (target) ang = Math.atan2(target.y - p.y, target.x - p.x);
      else ang = Math.atan2(p.facing.y, p.facing.x);
      this.spawnCone({
        x: p.x, y: p.y, angle: ang, range: def.range, halfAngle: def.halfAngle,
        life: 0.32, damage: dmg, element: def.element,
        status: def.status, statusStacks: def.stacks || 0, color: ELEMENTS[def.element].color,
      });
      return true;
    }

    if (def.kind === 'wall') {
      const at = target || p;
      const dx = at.x - p.x, dy = at.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      for (let i = -1; i <= 1; i++) {
        this.spawnField({
          x: at.x + nx * i * 90, y: at.y + ny * i * 90, r: def.r, life: def.life,
          tickRate: def.tickRate, damage: dmg, element: def.element,
          status: def.status, statusStacks: def.stacks || 0,
          color: ELEMENTS[def.element].color, kind: 'wall',
        });
      }
      return true;
    }

    if (def.kind === 'clone') {
      this.spawnField({
        x: p.x, y: p.y, r: def.r, life: def.life, tickRate: 9, damage: 0,
        element: def.element, color: ELEMENTS[def.element].color, kind: 'clone',
        explode: {
          r: def.burstR, damage: dmg, element: def.element,
          status: def.status, statusStacks: def.stacks || 0,
        },
      });
      return true;
    }

    if (def.kind === 'summon') {
      this.spawnSummon({
        kind: ab.id, x: p.x, y: p.y, life: def.life, fireRate: def.fireRate,
        damage: this.calcDamage(def.coeff, ab.rank), element: def.element,
        status: def.status, stacks: def.stacks || 0, range: def.summonRange,
        color: ELEMENTS[def.element].color,
      });
      return true;
    }

    if (def.kind === 'buff') {
      this.addBuff('lightningArmor', def.duration);
      return true;
    }

    if (def.kind === 'defensive') {
      p.iframe = Math.max(p.iframe, def.iframes);
      this.pushEnemies(p.x, p.y, def.r, def.push);
      this.spawnBurst({
        x: p.x, y: p.y, r: def.r, life: 0.35, damage: 0,
        element: def.element, status: null, statusStacks: 0,
        color: ELEMENTS[def.element].color,
      });
      return true;
    }

    if (def.kind === 'barrier') {
      const b = this.barriers.spawn();
      if (!b) return false;
      b.x = p.x; b.y = p.y; b.r = def.r; b.life = def.life; b.total = def.life;
      this.bus.emit('barrier', { x: p.x, y: p.y, r: def.r });
      return true;
    }

    if (def.kind === 'chain') {
      return this.castChain(def, dmg);
    }
    return false;
  }

  castChain(def, dmg) {
    const p = this.player;
    let from = { x: p.x, y: p.y };
    const hitSet = new Set();
    let hits = 0;
    for (let i = 0; i < def.chains; i++) {
      let best = null, bd = (def.range * (i ? 1 : 2.2)) ** 2;
      const list = this.enemies.active;
      for (let k = 0; k < list.length; k++) {
        const e = list[k];
        if (!e.alive || hitSet.has(e)) continue;
        const d = (e.x - from.x) ** 2 + (e.y - from.y) ** 2;
        if (d < bd) { bd = d; best = e; }
      }
      if (!best) { for (const bo of this.bosses) if (bo.alive && !hitSet.has(bo)) { best = bo; break; } }
      if (!best) break;
      hitSet.add(best);
      this.bus.emit('chain', { x1: from.x, y1: from.y, x2: best.x, y2: best.y });
      this.damageEnemy(best, dmg, { element: def.element, status: def.status, statusStacks: def.stacks || 0, source: 'chain' });
      from = { x: best.x, y: best.y };
      hits++;
    }
    return hits > 0;
  }

  pullEnemies(x, y, radius, force) {
    const list = this.enemies.active;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (!e.alive) continue;
      const dx = x - e.x, dy = y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > radius) continue;
      const k = force * (1 - d / radius);
      e.x += (dx / d) * k * 0.35;
      e.y += (dy / d) * k * 0.35;
    }
  }

  pushEnemies(x, y, radius, force) {
    const list = this.enemies.active;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (!e.alive) continue;
      const dx = e.x - x, dy = e.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > radius) continue;
      e.x += (dx / d) * force;
      e.y += (dy / d) * force;
    }
  }

  spawnSummon(o) {
    const s = this.summons.spawn();
    if (!s) return null;
    s.kind = o.kind; s.x = o.x; s.y = o.y;
    s.life = o.life; s.total = o.life;
    s.fireRate = o.fireRate; s.fireT = 0.2;
    s.damage = o.damage; s.element = o.element;
    s.status = o.status; s.stacks = o.stacks;
    s.range = o.range; s.color = o.color;
    s.target = null; s.r = o.r || 16; s.taunt = !!o.taunt; s.angle = 0;
    this.bus.emit('summon', { x: o.x, y: o.y, kind: o.kind });
    return s;
  }

  summonToad() {
    const p = this.player;
    this.spawnSummon({
      kind: 'toad', x: p.x + 60, y: p.y + 40, life: 10, fireRate: 0.5,
      damage: this.calcDamage(2.0, 1), element: 'fire', status: 'burning', stacks: 2,
      range: 420, color: '#8fd8a0', r: 30, taunt: true,
    });
  }

  addBuff(name, duration) {
    this.buffs[name] = Math.max(this.buffs[name] || 0, duration);
    this.bus.emit('buff', { name, duration });
  }

  castUltimate() {
    const p = this.player;
    if (p.chakra < ULTIMATE_COST || this.state !== 'playing') return false;
    p.chakra = 0;
    p.overcharge = false;
    const id = this.ultimate || 'cataclysm';
    // FIX Batch 5 (Flow State): Kage only, once per run, 5s of 70% CDR on Ultimate.
    if (p.flowUnlocked && !p.flowUsed) {
      p.flowUsed = true; p.flowT = 5.0;
      this.bus.emit('flow:start', { t: 5.0 });
      this.recalc();
    }
    if (id === 'spectral') this.addBuff('spectral', 5.0);
    else if (id === 'toad') this.summonToad();
    else this.castCataclysm();
    this.shake = Math.min(16, this.shake + 9);
    this.hitstop = Math.max(this.hitstop, 0.08);
    this.bus.emit('ultimate', { x: p.x, y: p.y, id });
    return true;
  }

  castCataclysm() {
    const p = this.player;
    const at = this.targetDensest(p.x, p.y, 620, 200) || { x: p.x, y: p.y };
    const r = 400;
    this.grid.queryCircle(at.x, at.y, r, this._sC);
    const list = this._sC.slice();
    for (const bo of this.bosses) if (bo.alive) list.push(bo);
    for (const e of list) {
      if (!e.alive) continue;
      if ((e.x - at.x) ** 2 + (e.y - at.y) ** 2 > (r + e.r) ** 2) continue;
      // FIX Batch 3 (Cataclysm): design is "ALL statuses at max stacks, every pair detonated".
      // Old code applied only 4 of 8 statuses, at a flat 3 stacks (Burning max is 5, Drenched/Rooted max is 1) and only 3 hits.
      // Now: every status in the registry at its own maxStacks, then 5 hits that detonate every detonatable status:
      // Fire -> Aerated, Wind -> Burning, Lightning -> Drenched, Physical -> Frozen (shatter), Wind -> Rooted (second Wind, after Burning is consumed).
      for (const id of Object.keys(STATUS)) {
        applyStatus(this, e, id, { stacks: STATUS[id].maxStacks, source: 'cataclysm' });
      }
      const each = this.calcDamage(20, 1) / 5; // total still 20x ATK, split across the 5 detonating hits
      this.damageEnemy(e, each, { element: 'fire', crit: false });
      this.damageEnemy(e, each, { element: 'wind', crit: false });
      this.damageEnemy(e, each, { element: 'lightning', crit: false });
      this.damageEnemy(e, each, { element: 'physical', crit: false });
      this.damageEnemy(e, each, { element: 'wind', crit: false });
    }
    this.spawnBurst({ x: at.x, y: at.y, r, life: 0.8, damage: 0, element: 'fire', status: null, statusStacks: 0, color: '#ffd27a', ultimate: true });
  }

  // ---------- level up ----------
  addXP(v) {
    const p = this.player;
    p.xp += v;
    let leveled = false;
    while (p.xp >= p.xpNeed && p.level < 50) {
      p.xp -= p.xpNeed;
      p.level++;
      p.maxHp += 2;                                     // a shinobi grows into the run
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.08 + 2);
      p.xpNeed = Math.round(15 * Math.pow(1.12, p.level - 1));
      this.pendingLevels++;
      leveled = true;
    }
    // FIX Batch 6 (Post-cap): at level 50, XP still fills. Each full bar triggers a post-cap menu (heal / reroll / +1 banish),
    // not a normal level-up. rollChoices() returns post-cap choices when level >= 50.
    let postCap = false;
    if (p.level >= 50 && p.xp >= p.xpNeed) {
      p.xp -= p.xpNeed;
      postCap = true;
    }
    if (p.level >= 50) p.xp = Math.min(p.xp, p.xpNeed);
    if ((leveled || postCap) && this.state === 'playing') {
      if (postCap) this.pendingLevels++;
      this.state = 'levelup';
      this.pendingChoices = rollChoices(this, 3);
      this.bus.emit('levelup', { level: p.level, choices: this.pendingChoices });
    }
  }

  chooseLevelUp(choice) {
    applyChoice(this, choice);
    this.pendingLevels--;
    this.recalc();
    if (this.pendingLevels > 0) {
      this.pendingChoices = rollChoices(this, 3);
      this.bus.emit('levelup', { level: this.player.level, choices: this.pendingChoices });
    } else {
      this.pendingChoices = null;
      this.state = 'playing';
      this.bus.emit('levelup:done', {});
    }
  }

  // FIX Batch 6 (Banish): remove one offered card from the pool for the rest of the run. Costs a Banish charge, NOT the pick.
  // After banishing, the menu re-rolls to 3 fresh choices (the banished id is filtered out by rollChoices).
  banish(choice) {
    if (!banishChoice(this, choice)) return false;
    this.pendingChoices = rollChoices(this, 3);
    this.bus.emit('levelup', { level: this.player.level, choices: this.pendingChoices });
    return true;
  }

  // ---------- one logic tick ----------
  step(dt) {
    if (this.state !== 'playing') return;
    this.t += dt;
    this.frame++;
    const p = this.player;

    // player movement
    const inp = this.input;
    let ix = inp.x, iy = inp.y;
    const m = Math.hypot(ix, iy);
    if (m > 1) { ix /= m; iy /= m; }
    p.moving = m > 0.12;
    if (p.moving) { p.facing.x = ix; p.facing.y = iy; }
    const speed = 250 * p.speedMult;
    p.vx = ix * speed; p.vy = iy * speed;
    if (p.dashT > 0) {
      p.dashT -= dt;
      p.iframe = Math.max(p.iframe, 0.06);
      p.x += p.dashDir.x * 900 * dt;
      p.y += p.dashDir.y * 900 * dt;
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    // FIX Batch 1 (bug: dash sticky / auto-dash every 1.8s):
    // Consume the press. One press = one dash, even if the key / button
    // stays held. app.js sets input.dash=true on keydown / button tap.
    // FIX Batch 5 (dash charges): Genin 1 charge, Jonin 2. One charge per 1.8s recharge.
    // dashCd is now "time until next charge". When charges > 0, dashCd is 0 so the bot's dashCd<=0 check still means "can dash".
    if (inp.dash) {
      inp.dash = false;
      if (p.dashCharges > 0) {
        p.dashCharges--;
        if (p.dashCharges < p.dashMax) p.dashCd = 1.8;
        p.dashT = 0.16;
        p.iframe = 0.30;
        p.dashDir = p.moving ? { x: ix, y: iy } : { ...p.facing };
        this.bus.emit('dash', { x: p.x, y: p.y });
      }
    }
    if (inp.ult) { inp.ult = false; this.castUltimate(); }
    // Out-of-combat recovery: 4 s clean, then a slow trickle. Rewards clean kiting.
    p.regenT = p.hitFlash > 0 ? 0 : p.regenT + dt;
    if (p.regenT > 4 && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + 1.1 * dt);
    // FIX Batch 2 (Tide regen was dead): clanRegen was computed in meta.js but never used.
    // Tide clan tree regen (0.25 / rank, up to 1.0 HP/s) now actually heals, always.
    if (this.clanRegen > 0 && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + this.clanRegen * dt);
    // Dash recharge + Flow timer. Flow expiry calls recalc so CDR drops back to base.
    if (p.dashCharges < p.dashMax) {
      p.dashCd = Math.max(0, p.dashCd - dt);
      if (p.dashCd <= 0) { p.dashCharges++; if (p.dashCharges < p.dashMax) p.dashCd = 1.8; else p.dashCd = 0; }
    } else p.dashCd = 0;
    if (p.flowT > 0) { p.flowT = Math.max(0, p.flowT - dt); if (p.flowT === 0) { this.bus.emit('flow:end', {}); this.recalc(); } }
    p.iframe = Math.max(0, p.iframe - dt);
    p.hitFlash = Math.max(0, p.hitFlash - dt * 3);
    this.shake = Math.max(0, this.shake - dt * 22);

    // abilities on their own cooldowns (memo A1.1)
    for (let i = 0; i < this.abilities.length; i++) {
      const ab = this.abilities[i];
      ab.cd -= dt;
      if (ab.cd <= 0) this.castAbility(ab);
    }

    // rolling DPS sample
    this.dpsAcc += dt;
    if (this.dpsAcc >= 1) {
      this.dpsAcc -= 1;
      this.dpsBuf[this.dpsIdx] = Math.max(0, this.damageDealt - this.dpsMark);
      this.dpsMark = this.damageDealt;
      this.dpsIdx = (this.dpsIdx + 1) % this.dpsBuf.length;
    }

    // telegraphed zones
    for (let i = this.zones.active.length - 1; i >= 0; i--) {
      const z = this.zones.active[i];
      z.t -= dt;
      if (z.t <= 0) {
        if (!z.fired) {
          z.fired = true;
          if (z.toPlayer) {
            const d = Math.hypot(this.player.x - z.x, this.player.y - z.y);
            if (d < z.r + this.player.r) this.damagePlayer(z.damage, 'boss');
          }
          this.spawnBurst({
            x: z.x, y: z.y, r: z.r, life: 0.4, damage: 0,
            element: 'fire', status: null, statusStacks: 0, color: z.color,
          });
          this.shake = Math.min(14, this.shake + 4);
        }
        this.zones.releaseAt(i);
      }
    }

    // buffs
    for (const k in this.buffs) this.buffs[k] = Math.max(0, this.buffs[k] - dt);
    this._thornsCd = Math.max(0, this._thornsCd - dt);

    // summons (clones, golems, toad)
    for (let i = this.summons.active.length - 1; i >= 0; i--) {
      const su = this.summons.active[i];
      su.life -= dt;
      if (su.life <= 0) { this.summons.releaseAt(i); continue; }
      if (su.taunt) {
        // nothing to do mechanically yet: the toad is a damage platform, taunt is a Phase 3 hook
      }
      let tgt = null, bd = su.range * su.range;
      const list = this.enemies.active;
      for (let k = 0; k < list.length; k++) {
        const e = list[k];
        if (!e.alive) continue;
        const d = (e.x - su.x) ** 2 + (e.y - su.y) ** 2;
        if (d < bd) { bd = d; tgt = e; }
      }
      if (!tgt) { for (const bo of this.bosses) if (bo.alive) { tgt = bo; break; } }
      if (tgt) {
        su.target = tgt;
        su.angle = Math.atan2(tgt.y - su.y, tgt.x - su.x);
        su.fireT -= dt;
        if (su.fireT <= 0) {
          su.fireT = su.fireRate;
          this.spawnProjectile({
            x: su.x, y: su.y, target: tgt, speed: 620, r: 6, life: 1.4,
            pierce: 0, burst: 0, damage: su.damage, element: su.element,
            status: su.status, statusStacks: su.stacks, color: su.color || '#9fd8ff',
          });
        }
      }
      // drift toward the player when idle
      const dx = this.player.x - su.x, dy = this.player.y - su.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 180) { su.x += (dx / d) * 90 * dt; su.y += (dy / d) * 90 * dt; }
    }

    // earth barriers shove anything inside back out
    for (let i = this.barriers.active.length - 1; i >= 0; i--) {
      const b = this.barriers.active[i];
      b.life -= dt;
      if (b.life <= 0) { this.barriers.releaseAt(i); continue; }
      const list = this.enemies.active;
      for (let k = 0; k < list.length; k++) {
        const e = list[k];
        if (!e.alive) continue;
        const dx = e.x - b.x, dy = e.y - b.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < b.r) {
          const push = (b.r - d) * 0.35 + 1;
          e.x += (dx / d) * push;
          e.y += (dy / d) * push;
        }
      }
    }

    // spawner
    const rate = (this.safeT > 0 || this.bossActive) ? 0 : spawnRate(this.minutes);
    this.spawnAcc += rate * dt;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      if (this.enemies.count < this.maxOnScreen()) spawnPod(this);
    }

    // boss
    if (!this.bossActive && this.stageIndex < BOSS_TIMES.length && this.t >= BOSS_TIMES[this.stageIndex]) {
      this.bossActive = true;
      this.bossSpawned = true;
      this.safeT = 0;
      this.clearField();
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.25);
      this.spawnBossStage(this.stageIndex);
    }
    for (let i = this.bosses.length - 1; i >= 0; i--) {
      const b = this.bosses[i];
      if (!b.alive) { this.bosses.splice(i, 1); continue; }
      updateBoss(this, b, dt);
    }
    this.boss = this.bosses[0] || null;
    if (this.safeT > 0) this.safeT -= dt;

    // enemies
    this.grid.build(this.enemies.active);
    const list = this.enemies.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      if (!e.alive) { this.enemies.releaseAt(i); continue; }
      e.flash = Math.max(0, e.flash - dt * 4);
      e.spawnT = Math.max(0, e.spawnT - dt);
      if (e.slowT > 0) e.slowT -= dt;
      updateEnemy(this, e, dt);
      // culling: too far from the player means gone (keeps the pool honest)
      const dx = e.x - p.x, dy = e.y - p.y;
      if (dx * dx + dy * dy > 1700 * 1700) this.enemies.releaseAt(i);
    }
    this.grid.build(this.enemies.active);

    // player projectiles
    for (let i = this.projectiles.active.length - 1; i >= 0; i--) {
      const pr = this.projectiles.active[i];
      pr.life -= dt;
      pr.spin += dt * 12;
      if (pr.target && pr.target.alive) {
        const dx = pr.target.x - pr.x, dy = pr.target.y - pr.y;
        const d = Math.hypot(dx, dy) || 1;
        const want = { x: (dx / d) * pr.speed, y: (dy / d) * pr.speed };
        pr.vx += (want.x - pr.vx) * Math.min(1, dt * 6);
        pr.vy += (want.y - pr.vy) * Math.min(1, dt * 6);
      }
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      let dead = pr.life <= 0;
      if (!dead) {
        this.grid.queryCircle(pr.x, pr.y, pr.r + 26, this._scratch);
        for (let j = 0; j < this._scratch.length; j++) {
          const e = this._scratch[j];
          if (!e.alive || pr.hit.has(e)) continue;
          const rr = pr.r + e.r;
          if ((e.x - pr.x) ** 2 + (e.y - pr.y) ** 2 > rr * rr) continue;
          pr.hit.add(e);
          this.damageEnemy(e, pr.damage, {
            element: pr.element, status: pr.status, statusStacks: pr.statusStacks, source: 'proj',
          });
          if (pr.heal && this.player.hp < this.player.maxHp) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + pr.heal);
          }
          if (pr.burst > 0) this.burstAt(pr.x, pr.y, pr.burst, pr.damage * 0.6, pr.element, pr.status, pr.statusStacks);
          if (pr.pierce-- <= 0) { dead = true; break; }
        }
        for (let bi = 0; bi < this.bosses.length; bi++) {
          const bo = this.bosses[bi];
          if (!bo.alive || pr.hit.has(bo)) continue;
          const rr = pr.r + bo.r;
          if ((bo.x - pr.x) ** 2 + (bo.y - pr.y) ** 2 >= rr * rr) continue;
          pr.hit.add(bo);
          this.damageEnemy(bo, pr.damage, { element: pr.element, status: pr.status, statusStacks: pr.statusStacks });
          if (pr.burst > 0) this.burstAt(pr.x, pr.y, pr.burst, pr.damage * 0.6, pr.element, pr.status, pr.statusStacks);
          if (pr.pierce-- <= 0) dead = true;
        }
      }
      if (dead) this.projectiles.releaseAt(i);
    }

    // fields
    for (let i = this.fields.active.length - 1; i >= 0; i--) {
      const f = this.fields.active[i];
      f.life -= dt;
      if (f.explode) {
        if (f.life <= 0) {
          this.burstAt(f.x, f.y, f.explode.r, f.explode.damage, f.explode.element, f.explode.status, f.explode.statusStacks);
          this.fields.releaseAt(i);
          continue;
        }
      } else {
        f.tickT -= dt;
        if (f.tickT <= 0) {
          f.tickT += f.tickRate;
          this.grid.queryCircle(f.x, f.y, f.r, this._scratch);
          const hits = this._scratch;
          for (let j = 0; j < hits.length; j++) {
            const e = hits[j];
            if (!e.alive) continue;
            const rr = f.r + e.r * 0.5;
            if ((e.x - f.x) ** 2 + (e.y - f.y) ** 2 > rr * rr) continue;
            this.damageEnemy(e, f.damage, { element: f.element, status: f.status, statusStacks: f.statusStacks, source: 'field' });
          }
        }
        if (f.life <= 0) { this.fields.releaseAt(i); continue; }
      }
    }

    // cones (instant on spawn, linger as a visual)
    for (let i = this.cones.active.length - 1; i >= 0; i--) {
      const c = this.cones.active[i];
      if (!c.hit) {
        c.hit = true;
        this.grid.queryCircle(c.x, c.y, c.range, this._scratch);
        const hits = this._scratch;
        for (let j = 0; j < hits.length; j++) {
          const e = hits[j];
          if (!e.alive) continue;
          const d = Math.hypot(e.x - c.x, e.y - c.y);
          if (d > c.range + e.r) continue;
          let a = Math.atan2(e.y - c.y, e.x - c.x) - c.angle;
          while (a > Math.PI) a -= Math.PI * 2;
          while (a < -Math.PI) a += Math.PI * 2;
          if (Math.abs(a) > c.halfAngle) continue;
          this.damageEnemy(e, c.damage, { element: c.element, status: c.status, statusStacks: c.statusStacks });
        }
        for (let bi = 0; bi < this.bosses.length; bi++) {
          const bo = this.bosses[bi];
          if (!bo.alive) continue;
          const d = Math.hypot(bo.x - c.x, bo.y - c.y);
          if (d > c.range + bo.r) continue;
          let a = Math.atan2(bo.y - c.y, bo.x - c.x) - c.angle;
          while (a > Math.PI) a -= Math.PI * 2;
          while (a < -Math.PI) a += Math.PI * 2;
          if (Math.abs(a) < c.halfAngle) this.damageEnemy(bo, c.damage, { element: c.element, status: c.status, statusStacks: c.statusStacks });
        }
        this.shake = Math.min(10, this.shake + 2.0);
      }
      c.life -= dt;
      if (c.life <= 0) this.cones.releaseAt(i);
    }

    // bursts
    for (let i = this.bursts.active.length - 1; i >= 0; i--) {
      const b = this.bursts.active[i];
      if (!b.hit) {
        b.hit = true;
        this.grid.queryCircle(b.x, b.y, b.r, this._scratch);
        const hits = this._scratch;
        for (let j = 0; j < hits.length; j++) {
          const e = hits[j];
          if (!e.alive) continue;
          const rr = b.r + e.r;
          if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 > rr * rr) continue;
          this.damageEnemy(e, b.damage, { element: b.element, status: b.status, statusStacks: b.statusStacks });
        }
        for (let bi = 0; bi < this.bosses.length; bi++) {
          const bo = this.bosses[bi];
          if (!bo.alive) continue;
          const rr = b.r + bo.r;
          if ((bo.x - b.x) ** 2 + (bo.y - b.y) ** 2 < rr * rr) {
            this.damageEnemy(bo, b.damage, { element: b.element, status: b.status, statusStacks: b.statusStacks });
          }
        }
        if (b.ultimate) this.shake = Math.min(18, this.shake + 8);
      }
      b.life -= dt;
      if (b.life <= 0) this.bursts.releaseAt(i);
    }

    // enemy projectiles
    for (let i = this.eproj.active.length - 1; i >= 0; i--) {
      const pr = this.eproj.active[i];
      pr.life -= dt;
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      const rr = pr.r + p.r;
      if ((p.x - pr.x) ** 2 + (p.y - pr.y) ** 2 < rr * rr) {
        this.damagePlayer(pr.damage, 'ranged');
        this.eproj.releaseAt(i);
        continue;
      }
      if (pr.life <= 0) this.eproj.releaseAt(i);
    }

    // statuses
    tickStatuses(this, dt);

    // gems
    const magnet = 130 * p.magnetMult;
    for (let i = this.gems.active.length - 1; i >= 0; i--) {
      const g = this.gems.active[i];
      g.t += dt;
      const dx = p.x - g.x, dy = p.y - g.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < magnet * magnet) {
        const d = Math.sqrt(d2) || 1;
        const pull = 320 + (1 - d / magnet) * 500;
        g.x += (dx / d) * pull * dt;
        g.y += (dy / d) * pull * dt;
      }
      if (d2 < (p.r + 8) ** 2) {
        this.addXP(g.value);
        this.bus.emit('gem', { x: g.x, y: g.y });
        this.gems.releaseAt(i);
        continue;
      }
      if (g.t > 90) this.gems.releaseAt(i);
    }

  }

  clearField() {
    const list = this.enemies.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      e.alive = false;
      this.enemies.releaseAt(i);
    }
    this.eproj.clear();
    this.bus.emit('field:clear', {});
  }

  burstAt(x, y, r, damage, element, status, stacks) {
    this.spawnBurst({
      x, y, r, life: 0.35, damage, element, status: status || null,
      statusStacks: stacks || 1, color: '#ffd27a',
    });
  }
}

// RONIN_DAMAGE removed in Batch 1 — counter now reflects 50% of incoming damage.
