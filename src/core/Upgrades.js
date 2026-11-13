// Level-up pool: 4 active / 6 passive slots (design §5.5). Fusion needs both parents at rank >= 3.
import { ABILITIES, MAX_RANK } from './abilities.js';

export const PASSIVES = {
  ember:   { id: 'ember',   name: 'Ember Focus',  max: 5, desc: '+10% jutsu damage.',            apply: (p) => { p.dmgMult += 0.10; } },
  focus:   { id: 'focus',   name: 'Inner Focus',  max: 5, desc: '+8% cooldown reduction (cap 70%).', apply: (p) => { p.cdr += 0.08; } },
  swift:   { id: 'swift',   name: 'Swiftness',    max: 5, desc: '+8% move speed.',               apply: (p) => { p.speedMult += 0.08; } },
  vitality:{ id: 'vitality',name: 'Vitality',     max: 5, desc: '+15 max HP, heals the same.',    apply: (p) => { p.maxHp += 15; p.hp = Math.min(p.maxHp, p.hp + 15); } },
  magnet:  { id: 'magnet',  name: 'Magnetism',    max: 5, desc: '+25% pickup radius.',            apply: (p) => { p.magnetMult += 0.25; } },
  precise: { id: 'precise', name: 'Precision',    max: 5, desc: '+6% critical chance.',           apply: (p) => { p.crit += 0.06; } },
};

export const PASSIVE_SLOTS = 6;
export const ACTIVE_SLOTS = 4;

export function abilityAvailable(world, id) {
  const def = ABILITIES[id];
  const owned = world.abilities.find((a) => a.id === id);
  if (owned) return owned.rank < MAX_RANK;
  if (world.abilities.length >= ACTIVE_SLOTS) return false;
  // Tier 2/3 are Academy unlocks (memo C5); without a save every tier is open.
  if (def.tier >= 2 && world.save && !world.save.arsenal[id]) return false;
  // Tier gating is on ability mastery only, never on player Rank (memo §2.4).
  if (def.tier === 1) return true;
  const parent = world.abilities.find((a) => a.id === def.parent);
  if (!parent) return false;
  return def.tier === 2 ? parent.rank >= 3 : parent.rank >= 5;
}

export function passiveCount(world) {
  return world.passives.length;
}

export function rollChoices(world, n = 3) {
  const pool = [];
  // FIX Batch 4 (clan weighting): design p19 — clan-signature elements get 2x weight in the level-up roll.
  // Uchiha=Fire, Nara=Earth, Hyuga=Wind, Uzumaki=Water. Lightning has no clan signature — available evenly.
  // Old code had no clan weighting at all, and a redundant * (owned ? 1 : 1) factor.
  const CLAN_SIGNATURE = { uchiha: 'fire', nara: 'earth', hyuga: 'wind', uzumaki: 'water' };
  const signature = CLAN_SIGNATURE[world.clan] || null;
  for (const id in ABILITIES) {
    const def = ABILITIES[id];
    if (abilityAvailable(world, id)) {
      const owned = world.abilities.find((a) => a.id === id);
      const tierW = def.tier === 1 ? 2.6 : def.tier === 2 ? 1.9 : 1.1;
      const clanW = signature && def.element === signature ? 2 : 1;
      pool.push({
        kind: 'ability', id, w: (owned ? 2.2 : tierW) * clanW,
        name: ABILITIES[id].name, element: ABILITIES[id].element,
        tag: owned ? `Rank ${owned.rank + 1}` : 'New jutsu',
        desc: ABILITIES[id].desc,
      });
    }
  }
  if (world.passives.length < PASSIVE_SLOTS) {
    for (const id in PASSIVES) {
      const owned = world.passives.find((p) => p.id === id);
      if (owned && owned.rank >= PASSIVES[id].max) continue;
      pool.push({
        kind: 'passive', id, w: owned ? 1.5 : 1.2,
        name: PASSIVES[id].name, element: 'stat',
        tag: owned ? `Rank ${owned.rank + 1}` : 'New',
        desc: PASSIVES[id].desc,
      });
    }
  }
  // Every pool can run dry (all abilities and passives maxed). The design's answer is a
  // heal/reroll card rather than an empty menu.
  if (pool.length === 0) {
    return [{ kind: 'recover', id: 'recover', w: 1, name: 'Second Wind', element: 'stat', tag: 'Recovery',
      desc: 'Restore 30% of your health.' }];
  }
  const picked = [];
  const used = new Set();
  // Early build: always offer at least one jutsu until the four slots are full, otherwise
  // the Prime/Detonate loop never starts and the run becomes passives-only.
  if (world.abilities.length < ACTIVE_SLOTS) {
    const abilities = pool.filter((c) => c.kind === 'ability');
    if (abilities.length) {
      const forced = world.rng.weighted(abilities);
      used.add(forced.kind + forced.id);
      picked.push(forced);
    }
  }
  let guard = 0;
  while (picked.length < n && pool.length > 0 && guard++ < 80) {
    const c = world.rng.weighted(pool);
    if (used.has(c.kind + c.id)) continue;
    used.add(c.kind + c.id);
    picked.push(c);
  }
  return picked;
}

export function applyChoice(world, choice) {
  if (choice.kind === 'recover') {
    const p = world.player;
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.3);
    return;
  }
  if (choice.kind === 'ability') {
    let owned = world.abilities.find((a) => a.id === choice.id);
    if (owned) owned.rank = Math.min(MAX_RANK, owned.rank + 1);
    else {
      owned = { id: choice.id, rank: 1, cd: 0 };
      world.abilities.push(owned);
      world.bus.emit('ability:gained', owned);
    }
    const def = ABILITIES[choice.id];
    owned.cd = Math.max(0.25, def.cd * (1 - Math.min(0.7, world.player.cdr)));
    owned.cdMax = owned.cd;
    return;
  }
  let owned = world.passives.find((p) => p.id === choice.id);
  if (owned) owned.rank = Math.min(PASSIVES[choice.id].max, owned.rank + 1);
  else { owned = { id: choice.id, rank: 1 }; world.passives.push(owned); }
  PASSIVES[choice.id].apply(world.player);
  world.recalc();
}
