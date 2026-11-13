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

// FIX Batch 5 (Breakthrough / Rank): design §8.1 — Genin 5/6 passives, Chunin 6/6, Jonin +1 dash charge, Kage Flow State.
// Rank is player progression, never reversed. Granted by Breakthrough, a level-up MENU OPTION that costs the pick.
export const RANKS = ['genin', 'chunin', 'jonin', 'kage'];
export const RANK_NAMES = { genin: 'Genin', chunin: 'Chunin', jonin: 'Jonin', kage: 'Kage' };
export const BREAKTHROUGH = {
  chunin: { rank: 'chunin', level: 5, name: 'Breakthrough: Chunin', desc: 'Promote to Chunin. +1 passive slot (6/6). No stat boost — Rank grants unlocks, not boosts.' },
  jonin: { rank: 'jonin', level: 15, name: 'Breakthrough: Jonin', desc: 'Promote to Jonin. +1 dash charge (2 total).' },
  kage: { rank: 'kage', level: 25, name: 'Breakthrough: Kage', desc: 'Promote to Kage. Unlocks Flow State: 5s of 70% CDR on Ultimate, once per run.' },
};
export function passiveSlotsForRank(rank) { return rank === 'genin' ? 5 : 6; }
export function nextBreakthrough(world) {
  const rank = world.player?.rank || 'genin';
  const idx = RANKS.indexOf(rank);
  if (idx < 0 || idx >= RANKS.length - 1) return null;
  const next = RANKS[idx + 1];
  const def = BREAKTHROUGH[next];
  if (!def) return null;
  if ((world.player?.level || 1) < def.level) return null;
  return { kind: 'breakthrough', id: 'breakthrough-' + next, rank: next, w: 1, name: def.name, element: 'rank', tag: 'Breakthrough', desc: def.desc };
}

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
  // FIX Batch 5: Genin can only hold 5 passives. Chunin+ can hold 6.
  const maxPassives = passiveSlotsForRank(world.player?.rank || 'genin');
  if (world.passives.length < maxPassives) {
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
    const bt0 = nextBreakthrough(world);
    const rec = { kind: 'recover', id: 'recover', w: 1, name: 'Second Wind', element: 'stat', tag: 'Recovery',
      desc: 'Restore 30% of your health.' };
    return bt0 ? [bt0, rec] : [rec];
  }
  const picked = [];
  const used = new Set();
  // FIX Batch 5: Breakthrough is a level-up MENU OPTION, not automatic. It appears as one of the 3 picks when eligible.
  // If the player skips it (picks another card), it stays available next level-up — Wait vs Promote is the choice.
  const bt = nextBreakthrough(world);
  if (bt) { picked.push(bt); used.add(bt.kind + bt.id); }
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
  if (choice.kind === 'breakthrough') {
    // Promotion itself lives in world.promote() so rank, slots, dash and Flow stay in one place.
    if (typeof world.promote === 'function') world.promote(choice.rank);
    else { world.player.rank = choice.rank; world.player.maxPassives = passiveSlotsForRank(choice.rank); }
    return;
  }
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
  // FIX Batch 5: never exceed the rank's passive cap (Genin 5, Chunin+ 6) even if applyChoice is called directly.
  if (!owned && world.passives.length >= passiveSlotsForRank(world.player?.rank || 'genin')) return;
  if (owned) owned.rank = Math.min(PASSIVES[choice.id].max, owned.rank + 1);
  else { owned = { id: choice.id, rank: 1 }; world.passives.push(owned); }
  PASSIVES[choice.id].apply(world.player);
  world.recalc();
}
