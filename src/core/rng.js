// Deterministic RNG. Same seed + same inputs = same run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class RNG {
  constructor(seed = 1337) {
    this.seed = seed >>> 0;
    this.next = mulberry32(this.seed);
  }
  float() { return this.next(); }
  range(a, b) { return a + this.next() * (b - a); }
  int(a, b) { return Math.floor(this.range(a, b + 1)); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  angle() { return this.next() * Math.PI * 2; }
  // weighted pick: [{w, ...}]
  weighted(list) {
    let total = 0;
    for (const it of list) total += it.w;
    let r = this.next() * total;
    for (const it of list) { r -= it.w; if (r <= 0) return it; }
    return list[list.length - 1];
  }
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
}
