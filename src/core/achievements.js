// Achievements + Quests — 12 Achievements + 4 Daily Quests (Academy 2.0 grind reason)
// Rewards: Seals + clan/skin unlocks. No pay-to-win.
export const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'First Blood', desc: 'Kill 1 enemy', check: (s)=> s.kills>=1, seals: 5 },
  { id: 'slayer_100', name: 'Slayer', desc: 'Kill 100 enemies in one run', check: (s)=> s.kills>=100, seals: 10 },
  { id: 'slayer_1000', name: 'Massacre', desc: 'Kill 1000 enemies in one run', check: (s)=> s.kills>=1000, seals: 25 },
  { id: 'survive_10', name: 'Survivor', desc: 'Survive 10 min', check: (s)=> s.time>=600, seals: 10 },
  { id: 'survive_20', name: 'Veteran', desc: 'Survive 20 min', check: (s)=> s.time>=1200, seals: 20 },
  { id: 'survive_30', name: 'Legend', desc: 'Survive 30 min — win a run', check: (s)=> s.time>=1800 && s.won, seals: 50 },
  { id: 'fusion_5', name: 'Fusion Master', desc: 'Trigger 5 Fusions in one run', check: (s)=> s.fusions>=5, seals: 20 },
  { id: 'boss_ronin', name: 'Ronin Slayer', desc: 'Kill Ronin (Boss 1)', check: (s)=> s.bossesKilled>=1, seals: 10 },
  { id: 'boss_warden', name: 'Warden Slayer', desc: 'Kill Warden (Boss 3)', check: (s)=> s.bossesKilled>=3, seals: 20 },
  { id: 'no_damage_boss', name: 'Flawless', desc: 'Kill a boss without taking damage', check: (s)=> s.flawlessBoss, seals: 30 },
  { id: 'level_30', name: 'Chunin', desc: 'Reach Lv 30 in one run', check: (s)=> s.level>=30, seals: 15 },
  { id: 'level_50', name: 'Kage', desc: 'Reach Lv 50 (max) in one run', check: (s)=> s.level>=50, seals: 40 },
];

export const DAILY_QUESTS = [
  { id: 'daily_kills', name: 'Daily: 300 Kills', desc: 'Kill 300 enemies today', target: 300, seals: 15 },
  { id: 'daily_time', name: 'Daily: 15 Min', desc: 'Survive 15 min today', target: 900, seals: 15 },
  { id: 'daily_fusion', name: 'Daily: 3 Fusions', desc: 'Trigger 3 Fusions today', target: 3, seals: 15 },
  { id: 'daily_boss', name: 'Daily: 1 Boss', desc: 'Kill 1 Boss today', target: 1, seals: 20 },
];

export function checkAchievements(stats, unlockedSet) {
  const newly = [];
  for (const a of ACHIEVEMENTS) {
    if (!unlockedSet.has(a.id) && a.check(stats)) {
      unlockedSet.add(a.id); newly.push(a);
    }
  }
  return newly;
}
export function checkDailyQuests(stats, progress) {
  // progress: { daily_kills: n, daily_time: s, daily_fusion: n, daily_boss: n }
  const newly = [];
  for (const q of DAILY_QUESTS) {
    const key = q.id;
    const cur = progress[key] || 0;
    const target = q.target;
    const done = progress[key + '_done'];
    if (!done && cur >= target) { progress[key + '_done'] = true; newly.push(q); }
  }
  return newly;
}
