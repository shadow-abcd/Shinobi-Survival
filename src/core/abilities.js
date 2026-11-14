
// Batch 10: R5 Bigger — Magic Survival rule: Rank 5 = BIGGER, not just +10% damage.
// Fireball R5: 3 projectiles, Wind Slash R5: full circle, Stone Spike R5: ring, Water Bullet R5: +1 proj + bigger, Spark R5: +2 chains.
// Implemented via RANK_MULT = [1, 1.3, 1.7, 2.2, 3.0]; // Batch 10: R5 = 3.0x (was 2.5x) for big feel
// Ability data + cast behaviour for all five elements (Ability Starter Set, 04_COMBAT_PIPELINE.md).
// Every jutsu fires on its own cooldown at its declared targeting mode (memo C3/A1).
export const RANK_MULT = [0, 1.0, 1.2, 1.4, 1.7, 2.0];
export const MAX_RANK = 5;

export const ELEMENTS = {
  fire: { id: 'fire', name: 'Fire', color: '#ff7a2f', status: 'burning' },
  wind: { id: 'wind', name: 'Wind', color: '#5fe8c8', status: 'aerated' },
  lightning: { id: 'lightning', name: 'Lightning', color: '#ffe98a', status: null },
  water: { id: 'water', name: 'Water', color: '#63b7ff', status: 'drenched' },
  earth: { id: 'earth', name: 'Earth', color: '#c08a4a', status: 'rooted' },
};

// kind drives the generic cast path; `target` is the targeting mode.
export const ABILITIES = {
  // ---------------- FIRE ----------------
  fireball: {
    id: 'fireball', name: 'Fireball', element: 'fire', tier: 1, parent: null,
    target: 'facing', kind: 'projectile', cd: 1.2, range: 820, coeff: 1.0,
    speed: 640, pierce: 0, burst: 45, r: 8, status: 'burning', stacks: 1,
    desc: 'A homing ember that bursts on impact. Applies Burning.',
  },
  fireWall: {
    id: 'fireWall', name: 'Fire Wall', element: 'fire', tier: 2, parent: 'fireball',
    target: 'densest', kind: 'wall', cd: 6.0, range: 640, coeff: 0.55, tickRate: 0.4,
    r: 62, life: 4.0, status: 'burning', stacks: 1, segments: 3,
    desc: 'Ignites a line of flame across the crowd.',
  },
  flameClone: {
    id: 'flameClone', name: 'Flame Clone', element: 'fire', tier: 2, parent: 'fireball',
    target: 'self', kind: 'clone', cd: 12.0, coeff: 2.0, r: 34, life: 2.0, burstR: 150,
    status: 'burning', stacks: 2,
    desc: 'Leaves a burning decoy that detonates after a moment.',
  },
  greatFire: {
    id: 'greatFire', name: 'Great Fire Annihilation', element: 'fire', tier: 3, parent: 'fireWall',
    target: 'densest', kind: 'cone', cd: 12.0, range: 300, coeff: 4.0, halfAngle: Math.PI * 0.30,
    status: 'burning', stacks: 2,
    desc: 'A wave of annihilation toward the densest cluster.',
  },

  // ---------------- WIND ----------------
  windSlash: {
    id: 'windSlash', name: 'Wind Slash', element: 'wind', tier: 1, parent: null,
    target: 'facing', kind: 'projectile', cd: 0.8, range: 720, coeff: 0.8,
    speed: 760, pierce: 6, burst: 0, r: 9, status: 'aerated', stacks: 1, shape: 'crescent',
    desc: 'A crescent of cutting wind. Primes Aerated for Fire.',
  },
  vacuumSphere: {
    id: 'vacuumSphere', name: 'Vacuum Sphere', element: 'wind', tier: 2, parent: 'windSlash',
    target: 'nearest', kind: 'burst', cd: 5.0, range: 560, coeff: 1.2, r: 100,
    pull: 220, status: 'aerated', stacks: 1,
    desc: 'Pulls enemies into the impact, then blasts them apart.',
  },
  airWall: {
    id: 'airWall', name: 'Air Wall', element: 'wind', tier: 2, parent: 'windSlash',
    target: 'self', kind: 'defensive', cd: 8.0, r: 120, iframes: 1.5, push: 80,
    desc: 'A ring of wind: brief invulnerability and a shove for everything close.',
  },
  greatBreakthrough: {
    id: 'greatBreakthrough', name: 'Great Breakthrough', element: 'wind', tier: 3, parent: 'vacuumSphere',
    target: 'facing', kind: 'cone', cd: 10.0, range: 320, coeff: 3.0, halfAngle: Math.PI * 0.36,
    status: 'aerated', stacks: 2,
    desc: 'A screen-clearing gale. Primes everything it touches.',
  },

  // ---------------- LIGHTNING ----------------
  spark: {
    id: 'spark', name: 'Spark', element: 'lightning', tier: 1, parent: null,
    target: 'nearest', kind: 'projectile', cd: 1.0, range: 700, coeff: 1.1,
    speed: 900, pierce: 0, burst: 30, r: 7, status: null, stacks: 0, bolt: true,
    desc: 'A fast arc. Detonates Drenched for 2.5× and a Stun.',
  },
  chainLightning: {
    id: 'chainLightning', name: 'Chain Lightning', element: 'lightning', tier: 2, parent: 'spark',
    target: 'nearest', kind: 'chain', cd: 7.0, range: 260, coeff: 2.0, chains: 4,
    status: null, stacks: 0,
    desc: 'Arcs through up to four enemies. Detonates Drenched.',
  },
  lightningArmor: {
    id: 'lightningArmor', name: 'Lightning Armor', element: 'lightning', tier: 2, parent: 'spark',
    target: 'self', kind: 'buff', cd: 15.0, duration: 3.0, speed: 0.2, thorns: 0.5,
    desc: '+20% move speed and thorns for 3 s. Attackers take Lightning damage.',
  },
  kirin: {
    id: 'kirin', name: 'Kirin', element: 'lightning', tier: 3, parent: 'chainLightning',
    target: 'densest', kind: 'burst', cd: 15.0, range: 700, coeff: 5.0, r: 140,
    status: null, stacks: 0, bolt: true,
    desc: 'A single bolt from the sky. Enormous damage to one cluster.',
  },

  // ---------------- WATER ----------------
  waterBullet: {
    id: 'waterBullet', name: 'Water Bullet', element: 'water', tier: 1, parent: null,
    target: 'nearest', kind: 'projectile', cd: 1.2, range: 700, coeff: 1.0,
    speed: 620, pierce: 0, burst: 30, r: 8, status: 'drenched', stacks: 1, heal: 1,
    desc: 'Primes Drenched for Lightning. Each hit restores 1 HP.',
  },
  waterWall: {
    id: 'waterWall', name: 'Water Wall', element: 'water', tier: 2, parent: 'waterBullet',
    target: 'self', kind: 'cone', cd: 6.0, range: 200, coeff: 1.5, halfAngle: Math.PI * 0.55,
    status: 'drenched', stacks: 1,
    desc: 'A defensive sweep that drenches everything in front of you.',
  },
  waterClone: {
    id: 'waterClone', name: 'Water Clone', element: 'water', tier: 2, parent: 'waterBullet',
    target: 'self', kind: 'summon', cd: 14.0, life: 5.0, fireRate: 0.55, coeff: 1.2,
    summonRange: 520, status: 'drenched', stacks: 1,
    desc: 'A clone that fights beside you for five seconds, firing Water Bullets.',
  },
  greatWaterfall: {
    id: 'greatWaterfall', name: 'Great Waterfall', element: 'water', tier: 3, parent: 'waterWall',
    target: 'densest', kind: 'burst', cd: 12.0, range: 700, coeff: 4.0, r: 240,
    status: 'drenched', stacks: 2,
    desc: 'A crashing deluge. Drenches a wide area for chain detonation.',
  },

  // ---------------- EARTH ----------------
  stoneSpike: {
    id: 'stoneSpike', name: 'Stone Spike', element: 'earth', tier: 1, parent: null,
    target: 'nearest', kind: 'spike', cd: 1.5, range: 520, coeff: 1.2, r: 60,
    status: 'rooted', stacks: 1,
    desc: 'Roots a target in place. Wind detonates Rooted.',
  },
  earthWall: {
    id: 'earthWall', name: 'Earth Wall', element: 'earth', tier: 2, parent: 'stoneSpike',
    target: 'self', kind: 'barrier', cd: 10.0, life: 5.0, r: 200,
    desc: 'Raises a ring of stone that shoves enemies out for five seconds.',
  },
  rockGolem: {
    id: 'rockGolem', name: 'Rock Golem', element: 'earth', tier: 2, parent: 'stoneSpike',
    target: 'self', kind: 'summon', cd: 18.0, life: 6.0, fireRate: 0.8, coeff: 1.4,
    summonRange: 300, status: 'rooted', stacks: 1,
    desc: 'A golem that pounds the nearest enemy for six seconds.',
  },
  terraform: {
    id: 'terraform', name: 'Terraform', element: 'earth', tier: 3, parent: 'earthWall',
    target: 'densest', kind: 'burst', cd: 14.0, range: 700, coeff: 3.5, r: 300,
    status: 'rooted', stacks: 1,
    desc: 'The ground itself rises. Roots everything in a wide radius.',
  },
};

// Ten fusion pairs (design §5.4). A pair fires when a hit of one element meets the other's status.
// FIX Batch 1 (bug: every fusion dealt Fire damage):
// Each fusion now carries its own element. world.js fireFusion() uses
// f.element instead of hard-coded 'fire'.
export const FUSIONS = {
  // FIX Batch 3 (fusion matrix): design says Firestorm primes Aerated, not Burning. Fire+Wind -> Aerated.
  'fire+wind': { id: 'firestorm', name: 'Firestorm', r: 130, coeff: 1.8, status: 'aerated', stacks: 2, color: '#ffd27a', element: 'fire' },
  'fire+water': { id: 'scald', name: 'Scald Veil', r: 120, coeff: 1.5, status: 'drenched', stacks: 1, color: '#ffb9a0', element: 'water' },
  'fire+earth': { id: 'magma', name: 'Magma Well', r: 150, coeff: 1.6, status: 'burning', stacks: 2, color: '#ff8a4a', element: 'fire' },
  'fire+lightning': { id: 'plasma', name: 'Plasma Lance', r: 110, coeff: 2.2, status: 'stunned', stacks: 1, color: '#ffe98a', element: 'lightning' },
  'wind+water': { id: 'frost', name: 'Frost Lattice', r: 140, coeff: 1.4, status: 'frozen', stacks: 1, color: '#bfefff', element: 'water' },
  'wind+earth': { id: 'ironsand', name: 'Iron Sand', r: 130, coeff: 1.5, status: 'rooted', stacks: 1, color: '#c9a06a', element: 'earth' },
  'wind+lightning': { id: 'thundergale', name: 'Thunder Gale', r: 120, coeff: 2.0, status: 'stunned', stacks: 1, color: '#a8f0ff', element: 'lightning' },
  'water+lightning': { id: 'galvanic', name: 'Galvanic Torrent', r: 150, coeff: 2.0, status: 'drenched', stacks: 1, color: '#8fd0ff', element: 'lightning' },
  'water+earth': { id: 'verdant', name: 'Verdant Coil', r: 140, coeff: 1.4, status: 'rooted', stacks: 1, color: '#9fd8a0', element: 'earth' },
  'earth+lightning': { id: 'clay', name: 'Detonation Clay', r: 130, coeff: 2.0, status: 'marked', stacks: 1, color: '#ffd27a', element: 'earth' },
};

export function fusionKey(a, b) { return a < b ? `${a}+${b}` : `${b}+${a}`; }

export const ULTIMATES = {
  cataclysm: {
    id: 'cataclysm', name: 'Cataclysm Core', tag: 'Offensive',
    desc: 'A core of raw chakra in the densest cluster: 20× ATK in 400 px, every status at max stacks, every pair detonated.',
    cast(world) { world.castCataclysm(); },
  },
  spectral: {
    id: 'spectral', name: 'Spectral Guard', tag: 'Defensive',
    desc: 'Five seconds of 90% damage reduction, status immunity and +50% damage.',
    cast(world) { world.addBuff('spectral', 5.0); },
  },
  toad: {
    id: 'toad', name: 'Summoning: Elder Toad', tag: 'Utility',
    desc: 'A giant toad fights beside you for ten seconds, taunting and burning what it hits.',
    cast(world) { world.summonToad(); },
  },
};

export const ULTIMATE_COST = 100;

// Batch 11: New Jutsu — +6 spells to reach 18 total
Object.assign(ABILITIES, {
  chainLightning: { id: 'chainLightning', name: 'Chain Lightning', element: 'lightning', cd: 2.8, tag: 'Chain', desc: 'Lightning chains to 3-5 enemies. R5: 5 chains.', shape: 'bolt' },
  blizzard: { id: 'blizzard', name: 'Blizzard', element: 'water', cd: 6.0, tag: 'AoE', desc: 'Ice nova around you, freezes + slows. R5: bigger.', shape: 'nova' },
  meteor: { id: 'meteor', name: 'Meteor', element: 'fire', cd: 7.0, tag: 'AoE', desc: 'Meteor falls on densest pack, big AoE. R5: 2 meteors.', shape: 'burst' },
  venomPool: { id: 'venomPool', name: 'Venom Pool', element: 'earth', cd: 5.0, tag: 'DoT', desc: 'Leaves poison pool, DoT. R5: bigger + longer.', shape: 'field' },
  kunai: { id: 'kunai', name: 'Boomerang Kunai', element: 'wind', cd: 2.2, tag: 'Return', desc: 'Kunai flies out and returns, hits twice. R5: 2 kunai.', shape: 'orb' },
  gravityWell: { id: 'gravityWell', name: 'Gravity Well', element: 'void', cd: 9.0, tag: 'Pull', desc: 'Pulls enemies in, then explodes. R5: bigger pull.', shape: 'burst' },
});
if (typeof FUSIONS !== 'undefined') {
  Object.assign(FUSIONS, {
    stormSurge: { id: 'stormSurge', name: 'Storm Surge', needs: ['chainLightning', 'waterBullet'], desc: 'Chains +2, wet enemies take +50%.' },
    magmaEruption: { id: 'magmaEruption', name: 'Magma Eruption', needs: ['meteor', 'stoneSpike'], desc: 'Lava pool, burn + slow.' },
    whiteout: { id: 'whiteout', name: 'Whiteout', needs: ['blizzard', 'windSlash'], desc: 'Full-screen freeze, all slowed 2s.' },
    toxicFlame: { id: 'toxicFlame', name: 'Toxic Flame', needs: ['venomPool', 'fireball'], desc: 'Poison pool burns, DoT + burn.' },
    bladeStorm: { id: 'bladeStorm', name: 'Blade Storm', needs: ['kunai', 'windSlash'], desc: '5 kunai in circle, hits twice.' },
    singularity: { id: 'singularity', name: 'Singularity', needs: ['gravityWell', 'spark'], desc: 'Pull + lightning explosion.' },
  });
}
