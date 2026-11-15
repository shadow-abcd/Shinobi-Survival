// Replay — determinism: save/load seeds to share runs or analyze deaths
// Because sim is deterministic (same seed + same inputs = same result), you can replay any death.
// Save: { seed, clan, map, mode, levelChoices: [...], deathTime, killer }
// Load: set seed, replay choices, watch death again.
export function saveReplay(state){
  // state: { seed, clan, map, mode, choices, deathTime, killer, score }
  const key = `replay_${state.seed}_${state.clan}`;
  try{ localStorage.setItem(key, JSON.stringify(state)); }catch(e){}
  return key;
}
export function loadReplay(key){
  try{ return JSON.parse(localStorage.getItem(key)); }catch(e){ return null; }
}
export function shareCode(state){
  // Shareable: SEED-CLAN-MAP-MODE-CHOICES
  const choices = (state.choices||[]).join(',');
  return `${state.seed}-${state.clan}-${state.map}-${state.mode}-${choices}`;
}
export function parseShareCode(code){
  const [seed, clan, map, mode, choices] = code.split('-');
  return { seed: parseInt(seed), clan, map, mode, choices: choices ? choices.split(',') : [] };
}
