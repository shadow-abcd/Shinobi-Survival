// Balance — Canonical curves (Batch 8 + Batch 9 + Review Fix)
// DO NOT tune to 5/5 wins. Target: sim 3/5 wins, human 40% after Batch 9.
export const BALANCE = {
  playerHp: 165,
  enemyHp: (min) => 20 * Math.pow(1.078, min), // Batch 8: was 1.085, now 1.078 — 1.085 was brutal at 20 min
  spawnRate: (min) => Math.min(11, 1.2 + 0.75 * min), // Batch 9: cap 11, not 12/sec
  maxOnScreen: (min) => Math.min(750, 100 + 32 * min),
  touchCooldown: 1.05,
  chakraPerKill: 1, chakraPerElite: 10, chakraPerBoss: 50, ultimateCost: 100,
  overcharge: { dmg: 1.5, radius: 1.3, cooldown: 8, minChakra: 50 }, // Review: cap Overcharge — 8s cd, needs 50 Chakra
  bossTimes: [300, 600, 900, 1200, 1500, 1800], // 5,10,15,20,25,30 min — keep, add 0.5s grace after boss
};
export const RECOMMENDED = {
  ember: ['fireball','windSlash','waterBullet','stoneSpike'],
  stoneward: ['stoneSpike','waterBullet','windSlash','spark'],
  gale: ['windSlash','waterBullet','fireball','spark'],
  tide: ['waterBullet','windSlash','fireball','stoneSpike'],
  mist: ['waterBullet','spark','windSlash','fireball'],
  iron: ['stoneSpike','spark','fireball','waterBullet'],
};
