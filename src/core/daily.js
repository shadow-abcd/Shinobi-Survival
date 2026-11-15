// Daily Run + Leaderboard — Daily seed, same for everyone
// Seed = YYYY-MM-DD. Same map, same bosses, same RNG for everyone that day.
// Score = time (s) + kills*10 + level*50 + bossesKilled*500
export function dailySeed(date = new Date()){
  const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
  const s = `${y}-${m}-${d}`;
  let h = 2166136261;
  for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}
export function dailyId(date = new Date()){
  const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
export function dailyScore(stats){
  // stats: { time, kills, level, bossesKilled }
  return Math.floor((stats.time||0) + (stats.kills||0)*10 + (stats.level||0)*50 + (stats.bossesKilled||0)*500);
}
export function dailyMap(seed){
  const maps = ['forest','desert','frost'];
  return maps[seed % 3];
}
export function dailyClan(seed){
  const clans = ['ember','stoneward','gale','tide','mist','iron'];
  return clans[seed % 6];
}
// Leaderboard: local, top 10, stored in meta
export function addToLeaderboard(board, entry){
  // entry: { dailyId, score, time, kills, level, bossesKilled, clan, date }
  board.push(entry);
  board.sort((a,b)=> b.score - a.score);
  return board.slice(0, 10);
}
export function rankOf(board, score){
  for (let i=0;i<board.length;i++) if (board[i].score <= score) return i+1;
  return board.length+1;
}
