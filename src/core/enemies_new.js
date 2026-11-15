// Enemies — +2 archetypes (Gaps Fix)
// Stinger: Ranged status-applier — shoots Drenched/Burning from range, forces you to move, not just kite.
// Summoner: Spawns 2 fodder every 8s, forces you to prioritize it, not just AoE the swarm.
export const NEW_ENEMIES = {
  stinger: { id: 'stinger', name: 'Stinger', hp: 30, speed: 110, damage: 3, xp: 2, range: 400, status: 'drenched', attackCd: 2.5, desc: 'Ranged, applies Drenched. Kill first or you get chain-detonated.' },
  summoner: { id: 'summoner', name: 'Summoner', hp: 60, speed: 80, damage: 2, xp: 5, summonCd: 8, summonCount: 2, desc: 'Spawns 2 fodder every 8s. Prioritize or swarm overwhelms.' },
};
