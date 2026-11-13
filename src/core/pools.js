// Fixed-capacity object pool with a free list (memo A5). Zero allocation in the hot loop.
export class Pool {
  constructor(capacity, factory, reset) {
    this.capacity = capacity;
    this.factory = factory;
    this.reset = reset;
    this.items = new Array(capacity);
    this.active = [];
    this.free = new Array(capacity);
    for (let i = 0; i < capacity; i++) {
      const o = factory();
      o._idx = i;
      this.items[i] = o;
      this.free[i] = o;
    }
  }
  spawn() {
    if (this.free.length === 0) {
      // Hard cap: recycle the oldest active object rather than allocate.
      const oldest = this.active.shift();
      if (!oldest) return null;
      this.reset(oldest);
      this.active.push(oldest);
      return oldest;
    }
    const o = this.free.pop();
    this.reset(o);
    o.active = true;
    this.active.push(o);
    return o;
  }
  release(o) {
    if (!o.active) return;
    o.active = false;
    const i = this.active.indexOf(o);
    if (i >= 0) this.active.splice(i, 1);
    this.free.push(o);
  }
  releaseAt(i) {
    const o = this.active[i];
    o.active = false;
    const last = this.active.pop();
    if (last !== o) this.active[i] = last;
    this.free.push(o);
  }
  clear() {
    while (this.active.length) {
      const o = this.active.pop();
      o.active = false;
      this.free.push(o);
    }
  }
  get count() { return this.active.length; }
}
