// Tiny WebAudio synth — no assets. Everything is generated.
export class Audio {
  constructor() { this.ctx = null; this.enabled = true; this.master = null; this.noise = null; }
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
    // shared noise buffer
    const len = this.ctx.sampleRate * 0.5;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    this.noise = buf;
  }
  toggle() {
    this.enabled = !this.enabled;
    if (this.master) this.master.gain.value = this.enabled ? 0.35 : 0;
    return this.enabled;
  }
  tone(freq, dur, type = 'sine', gain = 0.2, slide = 0) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  noiseHit(dur = 0.12, gain = 0.25, freq = 900, q = 1) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + dur);
  }
  cast(el) {
    switch (el) {
      case 'wind': this.noiseHit(0.12, 0.13, 2400, 2.4); break;
      case 'water': this.tone(420, 0.14, 'sine', 0.10, -180); this.noiseHit(0.08, 0.08, 900, 1.4); break;
      case 'lightning': this.noiseHit(0.07, 0.16, 3800, 3.0); this.tone(900, 0.06, 'square', 0.07, -300); break;
      case 'earth': this.tone(90, 0.18, 'sine', 0.16, 30); this.noiseHit(0.10, 0.14, 260, 0.8); break;
      default: this.tone(220, 0.12, 'sawtooth', 0.10, 120);
    }
  }
  telegraph(kind) {
    if (kind === 'dash') this.tone(180, 0.18, 'triangle', 0.09, 90);
    else this.tone(140, 0.22, 'sine', 0.10, 40);
  }
  fusion() {
    this.noiseHit(0.34, 0.34, 200, 0.7);
    this.tone(70, 0.32, 'sine', 0.26, -20);
  }
  bossPhase() {
    this.tone(110, 0.5, 'sawtooth', 0.14, 60);
    this.noiseHit(0.5, 0.18, 140, 0.6);
  }
  extract() {
    this.tone(300, 0.2, 'triangle', 0.14, 180);
    setTimeout(() => this.tone(450, 0.28, 'triangle', 0.12, 220), 140);
  }
  hit(big) {
    this.noiseHit(big ? 0.16 : 0.07, big ? 0.28 : 0.12, big ? 320 : 700, big ? 0.9 : 1.6);
  }
  detonate() {
    this.noiseHit(0.3, 0.32, 220, 0.7);
    this.tone(90, 0.28, 'sine', 0.22, -40);
  }
  hurt() { this.tone(140, 0.18, 'square', 0.16, -60); }
  level() { this.tone(520, 0.1, 'triangle', 0.16, 180); setTimeout(() => this.tone(720, 0.14, 'triangle', 0.14, 200), 90); }
  ultimate() { this.noiseHit(0.6, 0.35, 160, 0.6); this.tone(60, 0.6, 'sine', 0.28, -20); }
  boss() { this.tone(70, 0.9, 'sine', 0.3, 20); this.noiseHit(0.7, 0.25, 120, 0.5); }
  // FIX Batch 4 (Batch 2 events had VFX but no sound): Warden armor, Twin swap, enrage, Ronin counter.
  armor() { this.tone(1200, 0.08, 'square', 0.08, -400); this.noiseHit(0.06, 0.10, 2800, 2.0); }
  swap() { this.noiseHit(0.18, 0.16, 1800, 1.8); this.tone(600, 0.16, 'sine', 0.10, 300); }
  enrage() { this.tone(65, 0.6, 'sawtooth', 0.22, 40); this.noiseHit(0.5, 0.20, 130, 0.6); }
  counter() { this.tone(900, 0.10, 'square', 0.12, -500); this.noiseHit(0.10, 0.14, 2200, 1.6); }
}
