// Uniform spatial hash — collisions and crowd separation only (memo A6.3).
export class Grid {
  constructor(cell = 56) {
    this.cell = cell;
    this.map = new Map();
    this.used = [];
    this.stamp = 0;
  }
  clear() {
    for (let i = 0; i < this.used.length; i++) this.map.get(this.used[i]).length = 0;
    this.used.length = 0;
  }
  key(cx, cy) { return (cx + 4096) * 8192 + (cy + 4096); }
  build(list) {
    this.clear();
    const c = this.cell;
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (!o.alive) continue;
      const k = this.key(Math.floor(o.x / c), Math.floor(o.y / c));
      let b = this.map.get(k);
      if (!b) { b = []; this.map.set(k, b); }
      if (b.length === 0) this.used.push(k);
      b.push(o);
    }
  }
  queryCircle(x, y, r, out) {
    out.length = 0;
    const c = this.cell;
    const x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c);
    const y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const b = this.map.get(this.key(cx, cy));
        if (!b) continue;
        for (let i = 0; i < b.length; i++) out.push(b[i]);
      }
    }
    return out;
  }
  neighborsOf(o, out) {
    out.length = 0;
    const c = this.cell;
    const cx = Math.floor(o.x / c), cy = Math.floor(o.y / c);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const b = this.map.get(this.key(cx + i, cy + j));
        if (!b) continue;
        for (let k = 0; k < b.length; k++) out.push(b[k]);
      }
    }
    return out;
  }
}
