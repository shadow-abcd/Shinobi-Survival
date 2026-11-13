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

// FIX Batch 7 (Academy costs to design §6): Pillar 1 is FLAT costs, not escalating growth.
// Design: HP +10 flat/node (max 10, 30 Seals each), Chakra +5%/node (max 10, 40 each), Move +2%/node (max 10, 40 each).
// dmg/mag are extras beyond the design's three — kept, but also flat for consistency.
export const GLOBAL_UPGRADES = {
  hp: { id: 'hp', name: 'Constitution', desc: '+10 max HP per rank', max: 10, flat: 30 },
  dmg: { id: 'dmg', name: 'Chakra Flow', desc: '+6% jutsu damage per rank', max: 8, flat: 30 },
  spd: { id: 'spd', name: 'Footwork', desc: '+2% move speed per rank', max: 10, flat: 40 },
  mag: { id: 'mag', name: 'Attunement', desc: '+12% pickup radius per rank', max: 6, flat: 25 },
  chk: { id: 'chk', name: 'Reserves', desc: '+5% Chakra gain per rank', max: 10, flat: 40 },
};

// FIX Batch 7: Clan tree is 5 nodes, 100 Seals each (design §6). Was 4 nodes at 45*1.6^rank + ascension scaling.
export const CLAN_TREE = {
  ranks: 5,
  base: 100,
  growth: 1,
  flat: 100,
  // each rank gives the clan a small bonus in its own direction
  bonus: {
    uchiha: { crit: 0.03 },
    nara: { slow: 0.06 },
    hyuga: { hp: 0.05 },
    uzumaki: { regen: 0.25 },
  },
};

export const ARSENAL_COST = { 2: 50, 3: 150, ult: 200 };
// Ultimates: Cataclysm is the free starter. Susanoo + Toad are 200 Seals each (design §6).
export const ULTIMATES = [
  { id: 'susanoo', name: 'Susanoo Ribs', desc: '90% reduction, status immunity, +50% damage for 5s.' },
  { id: 'toad', name: 'Summoning: Toad Sage', desc: 'A toad fights beside you.' },
];
export const ULTIMATE_COST = 200;

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
    // FIX Batch 6 (Banish purchases): +1 Banish charge per purchase, max 2 bought, 50 Seals each. In-run charges = 1 + this.
    banish: 0,
    // FIX Batch 7: Ultimates owned beyond the free Cataclysm.
    ultimates: { susanoo: false, toad: false },
  };
}

// FIX Batch 7 (crash-mid-write): load tries main save, then the backup written by writeSave(). If both fail, fresh save.
export function loadSave(storage) {
  const d = defaultSave();
  const tryParse = (raw) => {
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...d, ...parsed,
      global: { ...d.global, ...(parsed.global || {}) },
      ultimates: { ...d.ultimates, ...(parsed.ultimates || {}) },
      clanTree: { ...d.clanTree, ...(parsed.clanTree || {}) },
      clans: { ...d.clans, ...(parsed.clans || {}) },
      legacy: { ...d.legacy, ...(parsed.legacy || {}) },
      arsenal: { ...(parsed.arsenal || {}) },
    };
  };
  try {
    const main = storage && tryParse(storage.getItem(SAVE_KEY));
    if (main) return main;
    const bak = storage && tryParse(storage.getItem(SAVE_KEY + '.bak'));
    if (bak) return bak;
    return d;
  } catch (e) {
    try {
      const bak = storage && tryParse(storage.getItem(SAVE_KEY + '.bak'));
      if (bak) return bak;
    } catch (e2) { /* fall through */ }
    return d;
  }
}

// FIX Batch 7: write backup first, then main. A crash between the two leaves a valid backup for loadSave() to recover.
export function writeSave(storage, save) {
  try {
    const json = JSON.stringify(save);
    storage.setItem(SAVE_KEY + '.bak', json);
    storage.setItem(SAVE_KEY, json);
    return true;
  } catch (e) { return false; }
}

export function costOf(def, rank) {
  // FIX Batch 7: flat costs (design) return the flat price. Legacy base/growth defs still use the old formula.
  if (def.flat !== undefined) return def.flat;
  return Math.round(def.base * Math.pow(def.growth, rank));
}

export function clanTreeCost(save, clan) {
  // FIX Batch 7: 100 Seals flat per node, no ascension scaling (design §6).
  return CLAN_TREE.flat !== undefined ? CLAN_TREE.flat : Math.round(CLAN_TREE.base * Math.pow(CLAN_TREE.growth, save.clanTree[clan] || 0));
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

// FIX Batch 7: Ultimates cost 200 Seals each (design §6). Cataclysm is free and not in save.ultimates.
export function buyUltimate(save, id) {
  if (!ULTIMATES.some((u) => u.id === id)) return { ok: false, reason: 'tier' };
  if (save.ultimates && save.ultimates[id]) return { ok: false, reason: 'owned' };
  if (save.seals < ULTIMATE_COST) return { ok: false, reason: 'seals', cost: ULTIMATE_COST };
  save.seals -= ULTIMATE_COST;
  if (!save.ultimates) save.ultimates = {};
  save.ultimates[id] = true;
  return { ok: true, cost: ULTIMATE_COST };
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

// FIX Batch 6: Banish purchase — 50 Seals, max 2 bought (so max in-run charges = 1 free + 2 = 3).
export const BANISH_COST = 50;
export const BANISH_MAX_BOUGHT = 2;
export function buyBanish(save) {
  const bought = save.banish || 0;
  if (bought >= BANISH_MAX_BOUGHT) return { ok: false, reason: 'maxed' };
  if (save.seals < BANISH_COST) return { ok: false, reason: 'seals', cost: BANISH_COST };
  save.seals -= BANISH_COST;
  save.banish = bought + 1;
  return { ok: true, cost: BANISH_COST };
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
    // FIX Batch 7: Academy bonuses to design — HP +10/node, Speed +2%/node, Chakra +5%/node (was +12, +3%, +10%).
    maxHp: Math.round(150 * clan.hp) + (g.hp || 0) * 10 + (bonus.hp || 0) * 150,
    speedMult: clan.speed * (1 + (g.spd || 0) * 0.02),
    chakraMult: clan.chakra * (1 + (g.chk || 0) * 0.05),
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
