// Meta progression: Seals, the Academy, clans, Legacy, Ascension and the save file.
// Pure data + logic; the UI lives in src/ui/academy.js. Storage is injected (localStorage in the
// browser, a stub in Node) so the whole layer can be tested headless.

export const SAVE_KEY = 'shinobi.save.v1';

export const CLANS = {
  uchiha: {
    id: 'uchiha', name: 'Uchiha', unlockMinutes: 0,
    hp: 0.80, chakra: 1.05, speed: 1.10,
    trait: 'Keen Eye: 15% chance on hit to Stun (1 s). Fire jutsu gain +10% crit.',
    short: 'Glass cannon · fire · crit',
  },
  nara: {
    id: 'nara', name: 'Nara', unlockMinutes: 30,
    hp: 0.95, chakra: 1.15, speed: 0.90,
    trait: 'Shadow Stitch: enemies within 4 m are slowed 30% and take +10% damage.',
    short: 'Zoning · control · chakra',
  },
  hyuga: {
    id: 'hyuga', name: 'Hyuga', unlockMinutes: 90,
    hp: 1.15, chakra: 0.90, speed: 0.95,
    trait: 'Gentle Palm: your hits knock enemies back; Staggered enemies take +20% damage.',
    short: 'Frontliner · knockback · tank',
  },
  uzumaki: {
    id: 'uzumaki', name: 'Uzumaki', unlockMinutes: 180,
    hp: 1.10, chakra: 1.10, speed: 0.80,
    trait: 'Vitality: +1 Overcharge stack. Killing an enemy below 30% HP restores 2 HP.',
    short: 'Sustain · big pool · slow',
  },
};

// Global stat upgrades: cost escalates per rank.
export const GLOBAL_UPGRADES = {
  hp: { id: 'hp', name: 'Constitution', desc: '+12 max HP per rank', max: 8, base: 20, growth: 1.55 },
  dmg: { id: 'dmg', name: 'Chakra Flow', desc: '+6% jutsu damage per rank', max: 8, base: 24, growth: 1.55 },
  spd: { id: 'spd', name: 'Footwork', desc: '+3% move speed per rank', max: 6, base: 22, growth: 1.5 },
  mag: { id: 'mag', name: 'Attunement', desc: '+12% pickup radius per rank', max: 6, base: 18, growth: 1.45 },
  chk: { id: 'chk', name: 'Reserves', desc: '+10% Chakra gain per rank', max: 6, base: 22, growth: 1.5 },
};

export const CLAN_TREE = {
  ranks: 4,
  base: 45,
  growth: 1.6,
  // each rank gives the clan a small bonus in its own direction
  bonus: {
    uchiha: { crit: 0.03 },
    nara: { slow: 0.06 },
    hyuga: { hp: 0.05 },
    uzumaki: { regen: 0.25 },
  },
};

export const ARSENAL_COST = { 2: 50, 3: 150 };

export function defaultSave() {
  return {
    v: 1,
    seals: 0,
    lifetimeSeals: 0,
    survivedMinutes: 0,
    runs: 0,
    wins: 0,
    clan: 'uchiha',
    clans: { uchiha: true, nara: false, hyuga: false, uzumaki: false },
    global: { hp: 0, dmg: 0, spd: 0, mag: 0, chk: 0 },
    arsenal: {},
    clanTree: { uchiha: 0, nara: 0, hyuga: 0, uzumaki: 0 },
    legacy: { uchiha: false, nara: false, hyuga: false, uzumaki: false },
    ascension: 0,
    bestTime: 0,
  };
}

export function loadSave(storage) {
  try {
    const raw = storage && storage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    return { ...defaultSave(), ...parsed, global: { ...defaultSave().global, ...(parsed.global || {}) } };
  } catch (e) {
    return defaultSave();
  }
}

export function writeSave(storage, save) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch (e) { return false; }
}

export function costOf(def, rank) {
  return Math.round(def.base * Math.pow(def.growth, rank));
}

export function clanTreeCost(save, clan) {
  const r = save.clanTree[clan] || 0;
  return Math.round(CLAN_TREE.base * Math.pow(CLAN_TREE.growth, r) * (1 + save.ascension * 0.1));
}

export function arsenalUnlocked(save, id) { return !!save.arsenal[id]; }

export function clanUnlocked(save, id) {
  const c = CLANS[id];
  return !!save.clans[id] || save.survivedMinutes >= c.unlockMinutes;
}

export function perfectShinobi(save) {
  return Object.values(save.legacy).every(Boolean);
}

export function buyGlobal(save, id) {
  const def = GLOBAL_UPGRADES[id];
  const rank = save.global[id] || 0;
  if (rank >= def.max) return { ok: false, reason: 'maxed' };
  const cost = costOf(def, rank);
  if (save.seals < cost) return { ok: false, reason: 'seals', cost };
  save.seals -= cost;
  save.global[id] = rank + 1;
  return { ok: true, cost };
}

export function buyArsenal(save, abilityId, tier) {
  if (save.arsenal[abilityId]) return { ok: false, reason: 'owned' };
  const cost = ARSENAL_COST[tier];
  if (!cost) return { ok: false, reason: 'tier' };
  if (save.seals < cost) return { ok: false, reason: 'seals', cost };
  save.seals -= cost;
  save.arsenal[abilityId] = true;
  return { ok: true, cost };
}

export function buyClanTree(save, clan) {
  if (!clanUnlocked(save, clan)) return { ok: false, reason: 'locked' };
  const r = save.clanTree[clan] || 0;
  if (r >= CLAN_TREE.ranks) return { ok: false, reason: 'maxed' };
  const cost = clanTreeCost(save, clan);
  if (save.seals < cost) return { ok: false, reason: 'seals', cost };
  save.seals -= cost;
  save.clanTree[clan] = r + 1;
  // Completing a clan tree contributes its Legacy trait to every clan (memo C1/C2).
  if (save.clanTree[clan] >= CLAN_TREE.ranks) save.legacy[clan] = true;
  return { ok: true, cost };
}

export function selectClan(save, clan) {
  if (!clanUnlocked(save, clan)) return { ok: false, reason: 'locked' };
  save.clan = clan;
  return { ok: true };
}

// ---------- run modifiers ----------
export function metaModifiers(save) {
  const g = save.global;
  const clan = CLANS[save.clan] || CLANS.uchiha;
  const tree = save.clanTree[save.clan] || 0;
  const bonus = CLAN_TREE.bonus[save.clan] || {};
  return {
    clan: clan.id,
    // FIX Batch 2: base HP is 150 per design, not 170 (Uchiha was getting 136 instead of 120).
    maxHp: Math.round(150 * clan.hp) + (g.hp || 0) * 12 + (bonus.hp || 0) * 150,
    speedMult: clan.speed * (1 + (g.spd || 0) * 0.03),
    chakraMult: clan.chakra * (1 + (g.chk || 0) * 0.10),
    // FIX Batch 2 (Legacy only paid on Perfect Shinobi): each Legacy now gives +2.5% damage.
    // 4 Legacies = +10%, same as Perfect before, but 1-3 Legacies now do something.
    dmgMult: 1 + (g.dmg || 0) * 0.06 + Object.values(save.legacy).filter(Boolean).length * 0.025,
    magnetMult: 1 + (g.mag || 0) * 0.12,
    crit: 0.05 + (bonus.crit || 0) * tree,
    regen: (bonus.regen || 0) * tree,
    slow: (bonus.slow || 0) * tree,
    ascension: save.ascension,
    enemyHpMult: 1 + save.ascension * 0.10,
    enemyCountMult: 1 + Math.max(0, save.ascension - 1) * 0.10,
    noSafeZone: save.ascension >= 4,
    legacy: save.legacy[save.clan] ? true : false,
    legacyCount: Object.values(save.legacy).filter(Boolean).length,
  };
}

export function sealsForRun({ win, extracted, bosses, time, level }) {
  // FIX Batch 2: removed bosses*1 double-count (boss Seals were counted twice: once here, once in bossSeals below).
  let seals = Math.floor(time / 60) * 2 + Math.round(level * 0.6);
  // boss rewards per the design table, scaled by how far the run got
  const bossSeals = [20, 40, 60, 100];
  for (let i = 0; i < Math.min(bosses, 4); i++) seals += bossSeals[i];
  if (win) seals = Math.round(seals * 1.3);
  else if (extracted) seals = Math.round(seals * 1.0);
  else seals = Math.round(seals * 0.75);
  return Math.max(5, seals);
}

export function bankRun(save, result) {
  const earned = sealsForRun(result);
  save.seals += earned;
  save.lifetimeSeals += earned;
  save.runs += 1;
  save.survivedMinutes += result.time / 60;
  save.bestTime = Math.max(save.bestTime, result.time);
  if (result.win) {
    save.wins += 1;
    // FIX Batch 2: Ascension has no ceiling per design — removed the cap at 9.
    save.ascension = save.ascension + 1;
  }
  // clan unlocks at survive-time milestones (memo C6)
  for (const id in CLANS) {
    if (!save.clans[id] && save.survivedMinutes >= CLANS[id].unlockMinutes) save.clans[id] = true;
  }
  return earned;
}
