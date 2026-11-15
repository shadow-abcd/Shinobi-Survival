// Skins + Trails — Cosmetics, not power. Unlock with Seals, not money.
// Skins change player color/outfit. Trails change dash/move particle color.
export const SKINS = [
  { id: 'default', name: 'Genin', desc: 'Default Shinobi', color: '#8affc1', seals: 0, clan: null },
  { id: 'ember_red', name: 'Ember Red', desc: 'Ember clan outfit', color: '#ff7a2f', seals: 50, clan: 'ember' },
  { id: 'stone_grey', name: 'Stone Grey', desc: 'Stoneward clan outfit', color: '#c08a4a', seals: 50, clan: 'stoneward' },
  { id: 'mist_blue', name: 'Mist Blue', desc: 'Mist clan outfit', color: '#63b7ff', seals: 50, clan: 'mist' },
  { id: 'gale_teal', name: 'Gale Teal', desc: 'Gale clan outfit', color: '#5fe8c8', seals: 50, clan: 'gale' },
  { id: 'kage_gold', name: 'Kage Gold', desc: 'Unlock by reaching Lv 50', color: '#ffd700', seals: 200, clan: null },
];
export const TRAILS = [
  { id: 'none', name: 'No Trail', desc: 'No trail', color: null, seals: 0 },
  { id: 'fire', name: 'Fire Trail', desc: 'Orange particles', color: '#ff7a2f', seals: 30 },
  { id: 'water', name: 'Water Trail', desc: 'Blue particles', color: '#63b7ff', seals: 30 },
  { id: 'lightning', name: 'Lightning Trail', desc: 'Yellow sparks', color: '#ffe98a', seals: 30 },
  { id: 'rainbow', name: 'Rainbow Trail', desc: 'Rainbow particles', color: '#ff00ff', seals: 100 },
  { id: 'gold', name: 'Gold Trail', desc: 'Gold particles', color: '#ffd700', seals: 100 },
];
export function canUnlock(item, seals, unlockedSet){
  if (unlockedSet.has(item.id)) return false;
  return seals >= item.seals;
}
export function unlock(item, state){
  // state: { seals, unlockedSkins:Set, unlockedTrails:Set }
  if (state.seals < item.seals) return false;
  state.seals -= item.seals;
  return true;
}
