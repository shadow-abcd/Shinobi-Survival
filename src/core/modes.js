// Modes — Normal (30 min) + Endless + Boss Rush
// Normal: 30 min, 6 bosses, win at 1800s
// Endless: After 30 min, keep going, swarm never stops, score keeps climbing. HP scaling continues.
// Boss Rush: Ronin -> Twin -> Warden -> Sovereign back-to-back, no swarm, 5 min. For quick phone sessions.
export const MODES = {
  normal: { id: 'normal', name: 'Normal', desc: '30 min, 6 bosses, win at 30 min', timeLimit: 1800, spawn: true, bosses: [300,600,900,1200,1500,1800] },
  endless: { id: 'endless', name: 'Endless', desc: 'After 30 min, keep going. Swarm never stops.', timeLimit: Infinity, spawn: true, bosses: [300,600,900,1200,1500,1800,2100,2400,2700,3000] },
  bossRush: { id: 'bossRush', name: 'Boss Rush', desc: 'Ronin -> Twin -> Warden -> Sovereign, no swarm, 5 min', timeLimit: 300, spawn: false, bosses: [0,60,120,180] },
};
export function modeById(id){ return MODES[id] || MODES.normal; }
export function isEndless(mode){ return mode==='endless'; }
export function isBossRush(mode){ return mode==='bossRush'; }
