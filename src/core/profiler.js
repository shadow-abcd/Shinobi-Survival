// Profiler — FPS + object pool usage in debug mode (F3 or ?debug=1)
// Catches regressions: if FPS drops below 30 or pool > 90%, you know a batch broke perf.
export class Profiler {
  constructor(){ this.frames=0; this.last=performance.now(); this.fps=60; this.poolUsed=0; this.poolMax=1000; this.enabled=false; }
  tick(poolUsed=0, poolMax=1000){
    this.frames++; const now=performance.now(); const dt=now-this.last;
    if(dt>=500){ this.fps=Math.round(this.frames*1000/dt); this.frames=0; this.last=now; }
    this.poolUsed=poolUsed; this.poolMax=poolMax;
  }
  draw(ctx){
    if(!this.enabled) return;
    ctx.fillStyle='#000a'; ctx.fillRect(4,4,220,52);
    ctx.fillStyle='#fff'; ctx.font='12px monospace';
    ctx.fillText(`FPS: ${this.fps}`, 8, 20);
    ctx.fillText(`Pool: ${this.poolUsed}/${this.poolMax} (${Math.round(this.poolUsed/this.poolMax*100)}%)`, 8, 36);
    ctx.fillText(`Enemies: ${this.poolUsed}`, 8, 52);
  }
}
export const profiler = new Profiler();
