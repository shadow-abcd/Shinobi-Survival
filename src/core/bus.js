// Minimal event bus (memo A4): systems emit and subscribe, they do not read each other.
export class Bus {
  constructor() { this.map = new Map(); this.quiet = false; }
  on(type, fn) {
    let a = this.map.get(type);
    if (!a) { a = []; this.map.set(type, a); }
    a.push(fn);
    return () => this.off(type, fn);
  }
  off(type, fn) {
    const a = this.map.get(type);
    if (!a) return;
    const i = a.indexOf(fn);
    if (i >= 0) a.splice(i, 1);
  }
  emit(type, payload) {
    if (this.quiet) return;
    const a = this.map.get(type);
    if (!a) return;
    for (let i = 0; i < a.length; i++) a[i](payload);
  }
}
