// Test bot: open-lane kiting with gem sweeping. A rough stand-in for a competent player.
export function botStep(w, time) {
  const p = w.player;
  const N = 16;
  const list = w.enemies.active;
  let bestA = 0, bestScore = -Infinity;

  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2;
    const dx = Math.cos(a), dy = Math.sin(a);
    const px = p.x + dx * 110, py = p.y + dy * 110;
    let threat = 0;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (!e.alive) continue;
      const ex = e.x - px, ey = e.y - py;
      const d2 = ex * ex + ey * ey;
      if (d2 < 200 * 200) threat += 1 - d2 / (200 * 200);
    }
    // reward moving toward loose gems
    let gemPull = 0;
    const gems = w.gems.active;
    for (let i = 0; i < gems.length; i++) {
      const g = gems[i];
      const gx = g.x - p.x, gy = g.y - p.y;
      const d = Math.hypot(gx, gy) || 1;
      if (d < 340) gemPull += ((gx / d) * dx + (gy / d) * dy) * (1 - d / 340);
    }
    let score = -threat * 2.2 + gemPull * 1.1;
    // step out of telegraphed circles before they land
    for (let zi = 0; zi < w.zones.active.length; zi++) {
      const z = w.zones.active[zi];
      if (z.t > 0.75) continue;
      const zx = px - z.x, zy = py - z.y;
      const zd = Math.hypot(zx, zy);
      if (zd < z.r) score -= (1 - zd / z.r) * 5;
    }
    if (w.boss && w.boss.alive) {
      const bx = w.boss.x - p.x, by = w.boss.y - p.y;
      const d = Math.hypot(bx, by) || 1;
      // hold a mid range from the boss, not melee, not running away
      const want = d > 300 ? 1 : d < 180 ? -1 : 0;
      score += ((bx / d) * dx + (by / d) * dy) * want * 1.4;
    }
    if (w.boss && w.boss.alive) {
      const b = w.boss;
      const bx = p.x - b.x, by = p.y - b.y, bd = Math.hypot(bx, by) || 1;
      if (b.state === 'telegraph' || b.state === 'dash') {
        // sidestep: prefer directions perpendicular to the incoming line
        const px2 = -by / bd, py2 = bx / bd;
        score += Math.abs((px2 * dx + py2 * dy)) * 2.2 - ((bx / bd) * dx + (by / bd) * dy) * 3.0;
      }
    }
    if (score > bestScore) { bestScore = score; bestA = a; }
  }

  w.input.x = Math.cos(bestA);
  w.input.y = Math.sin(bestA);

  let close = 0;
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (e.alive && (e.x - p.x) ** 2 + (e.y - p.y) ** 2 < 80 * 80) close++;
  }
  let bossThreat = false;
  if (w.boss && w.boss.alive) {
    const b = w.boss;
    const bd = Math.hypot(b.x - p.x, b.y - p.y);
    if ((b.state === 'telegraph' || b.state === 'dash') && bd < 320) bossThreat = true;
  }
  w.input.dash = (close > 4 || bossThreat) && p.dashCd <= 0;
  w.input.ult = p.chakra >= 100;
}
