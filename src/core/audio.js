// Audio — SFX for jutsu casts, element procs, boss attacks + music (not just mute)
// Web Audio API, no assets needed. Mute toggle M keeps working.
export class AudioSys {
  constructor(){ this.ctx=null; this.muted=false; }
  ensure(){ if(!this.ctx) { try{ this.ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(this.ctx && this.ctx.state==='suspended') this.ctx.resume(); }
  tone(freq, dur=0.1, type='sine', vol=0.2){ if(this.muted) return; this.ensure(); if(!this.ctx) return; const o=this.ctx.createOscillator(), g=this.ctx.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=vol; o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime+dur); }
  cast(element){ const m={fire:220, water:330, wind:440, earth:180, lightning:880}; this.tone(m[element]||440, 0.08, 'square', 0.12); }
  proc(element){ this.tone(660, 0.12, 'sawtooth', 0.18); }
  boss(){ this.tone(110, 0.4, 'sawtooth', 0.3); this.tone(165, 0.4, 'sawtooth', 0.3); }
  hit(){ this.tone(150, 0.05, 'square', 0.1); }
  levelup(){ this.tone(523, 0.1, 'sine', 0.2); setTimeout(()=>this.tone(784, 0.15, 'sine', 0.2), 100); }
  toggleMute(){ this.muted=!this.muted; return this.muted; }
}
export const audio = new AudioSys();
