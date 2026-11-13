// Renderer: reads world state, never writes it. Particles and popups live here.
import { buildSprites, hexA } from './sprites.js';
import { STATUS } from '../core/statuses.js';
import { ENEMY_TYPES } from '../core/enemies.js';

const MAX_PARTICLES = 700;

export class Renderer {
  constructor(canvas, world) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.world = world;
    this.sprites = buildSprites();
    this.cam = { x: 0, y: 0 };
    this.scale = 1;
    this.particles = [];
    this.numbers = [];
    this.rings = [];
    this.telegraphs = [];
    this.slashes = [];
    this.auras = [];
    this.beams = [];
    this.hurtFlash = 0;
    this.bossBarFlash = 0;
    this.bg = this.makePattern();
    this.props = this.makeProps();
    this.fireflies = this.makeFireflies();
    this.resize();
    this.bind();
  }

  makePattern() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#0b0913';
    g.fillRect(0, 0, 256, 256);
    // faint grid
    g.strokeStyle = 'rgba(120,140,190,0.055)';
    g.lineWidth = 1;
    for (let i = 0; i <= 256; i += 64) {
      g.beginPath(); g.moveTo(i + 0.5, 0); g.lineTo(i + 0.5, 256); g.stroke();
      g.beginPath(); g.moveTo(0, i + 0.5); g.lineTo(256, i + 0.5); g.stroke();
    }
    // grit
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * 256, y = Math.random() * 256;
      g.fillStyle = `rgba(${120 + Math.random() * 60},${110 + Math.random() * 50},${160 + Math.random() * 60},${0.02 + Math.random() * 0.04})`;
      g.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    return this.ctx.createPattern(c, 'repeat');
  }

  makeProps() {
    const out = [];
    let seed = 20261112;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 520; i++) {
      const x = (rnd() - 0.5) * 5200;
      const y = (rnd() - 0.5) * 5200;
      const r = rnd();
      out.push({
        x, y,
        kind: r < 0.40 ? 'grass' : r < 0.70 ? 'rock' : r < 0.92 ? 'bush' : 'tree',
        s: 0.6 + rnd() * 1.1,
        a: rnd() * Math.PI * 2,
        tone: rnd(),
      });
    }
    return out;
  }

  makeFireflies() {
    const out = [];
    let seed = 77123;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 70; i++) {
      out.push({ x: (rnd() - 0.5) * 2400, y: (rnd() - 0.5) * 2400, p: rnd() * 10, sp: 0.4 + rnd() * 0.7 });
    }
    return out;
  }

  drawGround(dt) {
    const ctx = this.ctx, cam = this.cam;
    const halfW = this.world.viewW * 0.5 + 120, halfH = this.world.viewH * 0.5 + 120;
    ctx.save();
    // props
    for (let i = 0; i < this.props.length; i++) {
      const p = this.props[i];
      if (Math.abs(p.x - cam.x) > halfW || Math.abs(p.y - cam.y) > halfH) continue;
      const s = p.s;
      if (p.kind === 'grass') {
        ctx.strokeStyle = `rgba(70,110,90,${0.16 + p.tone * 0.14})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let k = -1; k <= 1; k++) {
          ctx.moveTo(p.x + k * 4 * s, p.y + 6 * s);
          ctx.quadraticCurveTo(p.x + k * 7 * s, p.y - 2 * s, p.x + k * 9 * s + Math.sin(p.a) * 4, p.y - 12 * s);
        }
        ctx.stroke();
      } else if (p.kind === 'rock') {
        ctx.fillStyle = 'rgba(28,30,44,0.95)';
        ctx.beginPath(); ctx.ellipse(p.x, p.y, 11 * s, 8 * s, p.a, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(90,105,140,0.16)';
        ctx.beginPath(); ctx.ellipse(p.x - 2 * s, p.y - 2.5 * s, 7 * s, 4.5 * s, p.a, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'tree') {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(p.x + 8 * s, p.y + 12 * s, 34 * s, 13 * s, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(34,24,18,0.95)';
        ctx.beginPath(); ctx.moveTo(p.x - 4 * s, p.y + 2 * s); ctx.lineTo(p.x + 4 * s, p.y + 2 * s);
        ctx.lineTo(p.x + 6 * s, p.y + 22 * s); ctx.lineTo(p.x - 6 * s, p.y + 22 * s); ctx.closePath(); ctx.fill();
        // layered canopy lobes
        const lobes = [[0, -14, 30], [-16, -4, 20], [16, -6, 19], [-6, -26, 18]];
        for (let li = 0; li < lobes.length; li++) {
          const [lx, ly, lr] = lobes[li];
          const cg = ctx.createRadialGradient(
            p.x + lx * s - 6 * s, p.y + ly * s - 8 * s, 2,
            p.x + lx * s, p.y + ly * s, lr * s);
          cg.addColorStop(0, 'rgba(38,68,54,0.98)');
          cg.addColorStop(0.75, 'rgba(17,34,28,0.98)');
          cg.addColorStop(1, 'rgba(9,18,16,0.98)');
          ctx.fillStyle = cg;
          ctx.beginPath(); ctx.arc(p.x + lx * s, p.y + ly * s, lr * s, 0, Math.PI * 2); ctx.fill();
        }
        ctx.strokeStyle = 'rgba(120,190,150,0.10)';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(p.x, p.y - 14 * s, 26 * s, Math.PI * 1.15, Math.PI * 1.75); ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(24,38,34,0.9)';
        for (let k = 0; k < 3; k++) {
          const a = p.a + k * 2.1;
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(a) * 7 * s, p.y + Math.sin(a) * 7 * s, 7 * s, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(90,150,120,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // fireflies
    const t = this.world.t;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.fireflies.length; i++) {
      const f = this.fireflies[i];
      const x = f.x + Math.sin(t * f.sp * 0.6 + f.p) * 40;
      const y = f.y + Math.cos(t * f.sp * 0.5 + f.p * 1.7) * 40;
      if (Math.abs(x - cam.x) > halfW || Math.abs(y - cam.y) > halfH) continue;
      const a = 0.25 + Math.abs(Math.sin(t * 0.9 + f.p)) * 0.55;
      ctx.globalAlpha = a * 0.55;
      ctx.drawImage(this.sprites.glowGold, x - 9, y - 9, 18, 18);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    // player lantern light
    const p = this.world.player;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.085;
    const g = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 190);
    g.addColorStop(0, 'rgba(255,220,180,0.55)');
    g.addColorStop(1, 'rgba(255,180,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y, 190, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
    // view: keep roughly a 1280x720 play area on desktop, zoom out a little on tall screens
    this.scale = Math.max(0.72, Math.min(1.55, Math.min(w / 940 , h / 560)));
    this.world.viewW = w / this.scale;
    this.world.viewH = h / this.scale;
  }

  bind() {
    const b = this.world.bus;
    b.on('damage', (e) => {
      const col = e.detonate ? '#ffd27a' : e.element === 'wind' ? '#8ff0dc' : e.element === 'fire' ? '#ffb073' : '#ffffff';
      this.popup(e.x, e.y, Math.round(e.amount), col, e.crit || e.detonate);
      for (let i = 0; i < (e.crit ? 6 : 2); i++) this.spark(e.x, e.y, col, 1);
    });
    b.on('kill', (e) => {
      for (let i = 0; i < 5; i++) this.spark(e.x, e.y, e.type === 'brute' ? '#ff9a7f' : '#ff7f9b', 1.4);
    });
    b.on('detonate', (e) => {
      this.ring(e.x, e.y, 12, e.r || 120, 0.35, e.element === 'fire' ? '#ffb073' : '#8ff0dc', 3);
      for (let i = 0; i < 14; i++) this.spark(e.x, e.y, '#ffd27a', 3.2);
    });
    b.on('fusion', (e) => {
      this.ring(e.x, e.y, 20, 150, 0.5, '#ffd27a', 4);
      for (let i = 0; i < 18; i++) this.spark(e.x, e.y, '#ffe6b0', 4);
    });
    b.on('cast', (e) => {
      const p = this.world.player;
      this.ring(p.x, p.y, 8, 26, 0.22, e.empowered ? '#c9a8ff' : '#9fb7d8', 2);
    });
    b.on('dash', (e) => {
      for (let i = 0; i < 10; i++) this.spark(e.x, e.y, '#9fdcff', 2.2);
    });
    b.on('player:hurt', () => { this.hurtFlash = 1; });
    b.on('gem', (e) => { this.ring(e.x, e.y, 2, 16, 0.2, '#8fe8ff', 1.5); });
    b.on('boss:telegraph', (e) => this.telegraphs.push({ ...e, life: e.t, total: e.t }));
    b.on('boss:slash', (e) => this.slashes.push({ ...e, life: 0.28, total: 0.28 }));
    b.on('boss:counter', (e) => this.auras.push({ x: e.x, y: e.y, life: 2.8, total: 2.8 }));
    b.on('boss:spawn', () => { this.ring(this.world.player.x, this.world.player.y, 40, 480, 0.9, '#ff6b6b', 5); });
    b.on('field:clear', () => { this.ring(this.world.player.x, this.world.player.y, 60, 520, 0.7, '#ffe6b0', 4); });
    b.on('ultimate', (e) => {
      this.ring(e.x, e.y, 20, 430, 0.6, '#ff9a3c', 8);
      for (let i = 0; i < 40; i++) this.spark(e.x, e.y, '#ffd27a', 6);
    });
    b.on('chain', (e) => this.beams.push({ ...e, life: 0.22, total: 0.22 }));
    b.on('blink', (e) => this.ring(e.x, e.y, 4, 40, 0.3, '#b79bff', 2));
    b.on('drain', (e) => this.ring(e.x, e.y, 10, 50, 0.3, '#5fe8c8', 2));
    b.on('boss:enrage', (e) => this.ring(e.x, e.y, 20, 180, 0.6, '#ff5f5f', 4));
    b.on('thorns', (e) => this.ring(e.x, e.y, 20, 120, 0.25, '#ffe98a', 2));
    b.on('barrier', (e) => this.ring(e.x, e.y, e.r * 0.6, e.r, 0.5, '#c08a4a', 3));
    b.on('summon', (e) => this.ring(e.x, e.y, 10, 60, 0.4, e.kind === 'toad' ? '#8fd8a0' : '#9fd8ff', 2));
    b.on('fusion', (e) => this.ring(e.x, e.y, 20, 150, 0.5, '#ffd27a', 4));
    b.on('buff', () => {});
    b.on('status:applied', (e) => {
      const def = STATUS[e.id];
      if (!def) return;
      this.ring(e.enemy.x, e.enemy.y, 4, e.enemy.r + 10, 0.25, def.color, 2);
    });
  }

  // ---------- vfx helpers ----------
  spark(x, y, color, speed = 1) {
    if (this.particles.length > MAX_PARTICLES) this.particles.shift();
    const a = Math.random() * Math.PI * 2;
    const s = (40 + Math.random() * 190) * speed;
    this.particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 0.25 + Math.random() * 0.35, max: 0.6, color, size: 1 + Math.random() * 2.4,
    });
  }
  popup(x, y, text, color, big) {
    if (this.numbers.length > 90) this.numbers.shift();
    this.numbers.push({ x, y, text, color, big, life: big ? 0.95 : 0.7, max: big ? 0.95 : 0.7, vy: -46 });
  }
  ring(x, y, r0, r1, life, color, width = 2) {
    if (this.rings.length > 120) this.rings.shift();
    this.rings.push({ x, y, r0, r1, life, max: life, color, width });
  }

  // ---------- frame ----------
  draw(dt) {
    const w = this.world, p = w.player, ctx = this.ctx;
    const shake = w.shake;
    const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;

    // camera follow (and lead slightly in the direction of travel)
    const tx = p.x + p.vx * 0.12, ty = p.y + p.vy * 0.12;
    const lerp = 1 - Math.pow(0.001, dt);
    this.cam.x += (tx - this.cam.x) * lerp;
    this.cam.y += (ty - this.cam.y) * lerp;

    // background
    ctx.fillStyle = '#07060d';
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.translate((-this.cam.x * 0.55) % 256, (-this.cam.y * 0.55) % 256);
    ctx.fillStyle = this.bg;
    ctx.fillRect(-256, -256, this.w + 512, this.h + 512);
    ctx.restore();

    ctx.save();
    ctx.translate(this.w / 2 + sx, this.h / 2 + sy);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.cam.x, -this.cam.y);

    this.drawGround(dt);
    this.drawZones();
    this.drawBarriers();
    this.drawFields(dt);
    this.drawGems();
    this.drawEnemies();
    this.drawSummons();
    this.drawBoss();
    this.drawPlayer();
    this.drawProjectiles();
    this.drawEffects(dt);

    ctx.restore();

    // world phase tint: forest → village → wasteland
    const tint = ['rgba(60,140,90,0.05)', 'rgba(190,110,50,0.07)', 'rgba(140,70,190,0.09)'][this.world.phase - 1] || null;
    if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, 0, this.w, this.h); }

    // safe zone: brief calm between stages
    if (this.world.safeT > 0) {
      const p = this.world.player;
      ctx.save();
      ctx.translate(this.w / 2, this.h / 2);
      ctx.scale(this.scale, this.scale);
      ctx.translate(-this.cam.x, -this.cam.y);
      ctx.globalAlpha = 0.25 + Math.sin(this.world.t * 3) * 0.08;
      ctx.strokeStyle = '#8fe0b0';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.x, p.y, 300, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // vignette + hurt flash
    const g = ctx.createRadialGradient(this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.32,
      this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
    if (this.hurtFlash > 0) {
      ctx.fillStyle = `rgba(220,40,60,${this.hurtFlash * 0.20})`;
      ctx.fillRect(0, 0, this.w, this.h);
      this.hurtFlash = Math.max(0, this.hurtFlash - dt * 3.2);
    }
    // low-health pulse
    if (this.world.player.hp / this.world.player.maxHp < 0.3 && this.world.state === 'playing') {
      const t = performance.now() / 1000;
      ctx.fillStyle = `rgba(200,20,40,${0.05 + Math.sin(t * 4) * 0.035})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }

  drawFields(dt) {
    const ctx = this.ctx;
    const S = this.sprites;
    for (const f of this.world.fields.active) {
      const k = Math.max(0, f.life / 4);
      if (f.kind === 'clone') {
        ctx.globalAlpha = 0.9;
        ctx.drawImage(S.player, f.x - 27, f.y - 27, 54, 54);
        ctx.globalAlpha = 0.5 + Math.sin(f.life * 22) * 0.25;
        ctx.fillStyle = '#ff7a2f';
        ctx.beginPath(); ctx.arc(f.x, f.y, 26, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        continue;
      }
      const pulse = 0.75 + Math.sin(performance.now() / 90 + f.x) * 0.12;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.30 * Math.min(1, k * 1.6) * pulse;
      ctx.drawImage(S.glowFire, f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      // flame tongues
      ctx.strokeStyle = 'rgba(255,140,60,0.55)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + f.life * 2;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * (0.55 + i * 0.18), a, a + 1.1);
        ctx.stroke();
      }
    }
  }

  drawZones() {
    const ctx = this.ctx;
    for (const z of this.world.zones.active) {
      const k = 1 - z.t / z.delay;              // 0 → 1 as the strike lands
      ctx.save();
      ctx.globalAlpha = 0.07 + k * 0.12;
      ctx.fillStyle = z.color;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.7 + k * 0.3;
      ctx.strokeStyle = z.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke();
      // the closing inner ring is the countdown: it meets the edge when the strike lands
      ctx.globalAlpha = 0.28 + k * 0.4;
      ctx.beginPath(); ctx.arc(z.x, z.y, Math.max(2, z.r * (1 - k)), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.5 + k * 0.4;
      const t = z.r * 0.12;
      ctx.beginPath();
      ctx.moveTo(z.x - t, z.y); ctx.lineTo(z.x + t, z.y);
      ctx.moveTo(z.x, z.y - t); ctx.lineTo(z.x, z.y + t);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawBarriers() {
    const ctx = this.ctx;
    for (const b of this.world.barriers.active) {
      const k = Math.min(1, b.life / 0.6);
      ctx.save();
      ctx.globalAlpha = 0.5 * k;
      ctx.strokeStyle = '#c08a4a';
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.16 * k;
      ctx.fillStyle = '#c08a4a';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // rocks around the ring
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        ctx.fillStyle = '#5b4632';
        ctx.beginPath();
        ctx.ellipse(b.x + Math.cos(a) * b.r, b.y + Math.sin(a) * b.r, 9, 7, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawSummons() {
    const ctx = this.ctx, S = this.sprites;
    for (const su of this.world.summons.active) {
      const size = su.kind === 'toad' ? 96 : su.kind === 'rockGolem' ? 64 : 52;
      let img = S.player;
      if (su.kind === 'toad') img = S.toad;
      else if (su.kind === 'rockGolem') img = S.golem;
      else if (su.kind === 'waterClone') img = S.waterClone;
      ctx.save();
      ctx.translate(su.x, su.y);
      if (su.kind !== 'toad') ctx.rotate(su.angle + Math.PI / 2);
      ctx.globalAlpha = su.life < 1 ? 0.45 + Math.sin(su.life * 18) * 0.3 : 1;
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  drawGems() {
    const ctx = this.ctx, S = this.sprites;
    for (const g of this.world.gems.active) {
      const bob = Math.sin(g.t * 5 + g.x * 0.05) * 2.4;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(S.gem, g.x - 8, g.y - 8 + bob, 16, 16);
    }
    ctx.globalAlpha = 1;
  }

  drawEnemies() {
    const ctx = this.ctx, S = this.sprites, w = this.world;
    const list = w.enemies.active;
    const halfW = w.viewW * 0.5 + 90, halfH = w.viewH * 0.5 + 90;
    const cam = this.cam;

    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (!e.alive) continue;
      if (Math.abs(e.x - cam.x) > halfW || Math.abs(e.y - cam.y) > halfH) continue;
      const sp = S[e.type] || S.fodder;
      const size = (e.r + 10) * 2;
      const scale = e.spawnT > 0 ? 0.6 + (1 - e.spawnT / 0.25) * 0.4 : 1;
      const bob = Math.sin(w.t * 6 + e.x * 0.03) * 1.5;

      // status glows behind
      const aer = e.statuses.aerated, burn = e.statuses.burning;
      if (aer && aer.t > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.42;
        ctx.drawImage(S.glowWind, e.x - 34, e.y - 34, 68, 68);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      if (burn && burn.t > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.30 + Math.min(0.3, burn.stacks * 0.06);
        ctx.drawImage(S.glowFire, e.x - 30, e.y - 34, 60, 60);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }

      ctx.save();
      ctx.translate(e.x, e.y + bob);
      ctx.scale(scale, scale);
      ctx.drawImage(sp, -size / 2, -size / 2, size, size);
      if (e.flash > 0.02) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = e.flash * 0.55;
        ctx.drawImage(sp, -size / 2, -size / 2, size, size);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      // status pips: the prime/detonate loop has to be readable at a glance
      let pip = 0;
      for (const sid in e.statuses) {
        const st = e.statuses[sid];
        if (st.t <= 0) continue;
        const def = STATUS[sid];
        if (!def || pip >= 4) continue;
        const px = e.x - e.r + pip * 5.5;
        const py = e.y + e.r + 7;
        ctx.fillStyle = def.color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(px, py, 1.9, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        pip++;
      }

      // HP pip for damaged tough enemies
      if (e.hp < e.maxHp && e.type !== 'fodder') {
        const bw = e.r * 1.9;
        const pct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(e.x - bw / 2, e.y - e.r - 9, bw, 3.5);
        ctx.fillStyle = pct > 0.5 ? '#7fe0a0' : pct > 0.25 ? '#ffd27a' : '#ff6b6b';
        ctx.fillRect(e.x - bw / 2, e.y - e.r - 9, bw * pct, 3.5);
      }
    }
  }

  drawPlayer() {
    const ctx = this.ctx, S = this.sprites, p = this.world.player;
    const size = 58;
    // dash trail
    if (p.dashT > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.22;
      for (let i = 1; i <= 2; i++) {
        ctx.drawImage(S.glowWind, p.x - 26 - p.dashDir.x * i * 18, p.y - 26 - p.dashDir.y * i * 18, 52, 52);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    // ground ring anchors the player above a dense crowd
    ctx.strokeStyle = 'rgba(150,235,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 11, 17, 7, 0, 0, Math.PI * 2); ctx.stroke();
    // buff auras
    if (this.world.buffs.susanoo > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35 + Math.sin(this.world.t * 6) * 0.12;
      ctx.strokeStyle = '#c9a8ff';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(p.x, p.y, 34, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, 44, 0, Math.PI * 2); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    if (this.world.buffs.lightningArmor > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#ffe98a';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const a = this.world.t * 9 + i * 1.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 26, a, a + 0.6);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    // chakra aura when the ultimate is ready
    if (p.chakra >= 100) {
      const t = performance.now() / 1000;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35 + Math.sin(t * 5) * 0.15;
      ctx.drawImage(S.glowGold, p.x - 46, p.y - 46, 92, 92);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    const wobble = p.moving ? Math.sin(this.world.t * 14) * 0.05 : 0;
    ctx.rotate(Math.atan2(p.facing.y, p.facing.x) + Math.PI / 2 + wobble);
    if (p.iframe > 0) ctx.globalAlpha = 0.55 + Math.sin(this.world.t * 40) * 0.25;
    ctx.drawImage(S.player, -size / 2, -size / 2, size, size);
    ctx.restore();
    ctx.globalAlpha = 1;

    if (p.hitFlash > 0.02) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = p.hitFlash * 0.5;
      ctx.drawImage(S.glowWhite, p.x - 40, p.y - 40, 80, 80);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
  }

  drawBoss() {
    const ctx = this.ctx, S = this.sprites;
    for (const boss of this.world.bosses) {
      if (boss.alive) this.drawOneBoss(boss, S, ctx);
    }
  }

  drawOneBoss(b, S, ctx) {
    const sprite = S[b.id] || S.bossRonin || S.boss;
    const size = b.r * 3.4;
    const bob = Math.sin(this.world.t * 3) * 2;

    // counter stance aura
    if (b.state === 'counter' || b.phase === 3) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.4 + Math.sin(this.world.t * 12) * 0.2;
      ctx.strokeStyle = '#8fb8ff';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 16, 0, Math.PI * 2); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    // menacing under-glow so the boss reads from across the arena
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35;
    ctx.drawImage(S.glowFire, b.x - 90, b.y - 90, 180, 180);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(b.x, b.y + bob);
    ctx.rotate(b.face + Math.PI / 2);
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    // sword
    ctx.strokeStyle = 'rgba(230,240,255,0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, -b.r - 46); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, -b.r - 46); ctx.stroke();
    ctx.restore();

    if (b.flash > 0.02) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = b.flash * 0.4;
      ctx.drawImage(S.glowWhite, b.x - 70, b.y - 70, 140, 140);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
  }

  drawProjectiles() {
    const ctx = this.ctx, S = this.sprites;
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.world.projectiles.active) {
      const el = p.element;
      ctx.globalAlpha = 0.95;
      if (el === 'wind') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.strokeStyle = '#9ff5e4';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, 12, -1.1, 1.1); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(0, 0, 12, -0.9, 0.9); ctx.stroke();
        ctx.restore();
      } else if (el === 'lightning') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.strokeStyle = '#fff8d0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-16, 0); ctx.lineTo(-9, -5); ctx.lineTo(-2, 3); ctx.lineTo(6, -3); ctx.lineTo(14, 0);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,233,138,0.5)';
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.restore();
      } else if (el === 'water') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 12);
        grad.addColorStop(0, '#dff4ff');
        grad.addColorStop(0.6, '#63b7ff');
        grad.addColorStop(1, 'rgba(60,140,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(160,220,255,0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(-6, 0, 7, 1.2, 5.0); ctx.stroke();
        ctx.restore();
      } else if (el === 'earth') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.fillStyle = '#d8b07a';
        ctx.beginPath();
        ctx.moveTo(12, 0); ctx.lineTo(-8, -7); ctx.lineTo(-4, 0); ctx.lineTo(-8, 7);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(90,60,30,0.8)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      } else {
        const glow = 46;
        ctx.drawImage(S.orbFire, p.x - glow / 2, p.y - glow / 2, glow, glow);
        ctx.fillStyle = '#fff3d8';
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
        // ember trail
        if (Math.random() < 0.6) {
          ctx.fillStyle = 'rgba(255,150,60,0.5)';
          ctx.fillRect(p.x - p.vx * 0.012, p.y - p.vy * 0.012, 2, 2);
        }
      }
    }
    for (const p of this.world.eproj.active) {
      ctx.globalAlpha = 0.95;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.drawImage(S.orbEnemy, -11, -11, 22, 22);
      ctx.fillStyle = '#eaf6ff';
      ctx.beginPath(); ctx.ellipse(0, 0, 4.2, 1.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  drawEffects(dt) {
    const ctx = this.ctx;

    // expanding rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      if (r.life <= 0) { this.rings.splice(i, 1); continue; }
      const k = 1 - r.life / r.max;
      const rad = r.r0 + (r.r1 - r.r0) * (1 - Math.pow(1 - k, 2));
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (1 - k) * 0.75;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width;
      ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, Math.PI * 2); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    // cones (great fire annihilation)
    for (const c of this.world.cones.active) {
      const k = 1 - c.life / c.total;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (1 - k) * 0.5;
      const grd = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, c.range);
      grd.addColorStop(0, '#ffd9a0');
      grd.addColorStop(0.6, '#ff7a2f');
      grd.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.arc(c.x, c.y, c.range * (0.75 + k * 0.25), c.angle - c.halfAngle, c.angle + c.halfAngle);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    // bursts
    for (const b of this.world.bursts.active) {
      const k = 1 - b.life / b.total;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (1 - k) * 0.55;
      const rad = b.r * (0.7 + k * 0.4);
      const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, rad);
      grd.addColorStop(0, 'rgba(255,250,235,0.85)');
      grd.addColorStop(0.65, b.color || '#ff9a3c');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(b.x, b.y, rad, 0, Math.PI * 2); ctx.fill();
      // element signature on top of the splash
      if (b.element === 'earth') {
        ctx.strokeStyle = '#c9a06a';
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + k;
          ctx.beginPath();
          ctx.moveTo(b.x + Math.cos(a) * rad * 0.2, b.y + Math.sin(a) * rad * 0.2);
          ctx.lineTo(b.x + Math.cos(a) * rad * 0.95, b.y + Math.sin(a) * rad * 0.95);
          ctx.stroke();
        }
      } else if (b.element === 'water') {
        ctx.strokeStyle = 'rgba(160,220,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, rad * 0.9, 0, Math.PI * 2); ctx.stroke();
      } else if (b.element === 'lightning') {
        ctx.strokeStyle = 'rgba(255,248,200,0.9)';
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + k * 2;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x + Math.cos(a) * rad, b.y + Math.sin(a) * rad);
          ctx.stroke();
        }
      } else if (b.element === 'wind') {
        ctx.strokeStyle = 'rgba(160,245,220,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, rad * 0.8, k * 6, k * 6 + 2.2); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    // boss telegraphs
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const t = this.telegraphs[i];
      t.life -= dt;
      if (t.life <= 0) { this.telegraphs.splice(i, 1); continue; }
      const k = 1 - t.life / t.total;
      ctx.save();
      ctx.translate(t.x, t.y);
      if (t.kind === 'slash') {
        ctx.rotate(t.angle);
        ctx.fillStyle = `rgba(255,210,90,${0.10 + k * 0.16})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 200, -Math.PI / 2, Math.PI / 2);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = `rgba(255,230,140,${0.5 + k * 0.4})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 200, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      } else if (t.kind === 'dash') {
        ctx.rotate(t.angle);
        const len = t.len || 400;
        ctx.fillStyle = `rgba(255,70,70,${0.10 + k * 0.2})`;
        ctx.fillRect(0, -16, len, 32);
        ctx.strokeStyle = `rgba(255,120,120,${0.4 + k * 0.4})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, -16, len, 32);
        // arrow head so the direction is unmistakable
        ctx.fillStyle = `rgba(255,120,120,${0.5 + k * 0.4})`;
        ctx.beginPath();
        ctx.moveTo(len, 0); ctx.lineTo(len - 26, -20); ctx.lineTo(len - 26, 20);
        ctx.closePath(); ctx.fill();
      } else if (t.kind === 'slam') {
        ctx.strokeStyle = `rgba(255,180,90,${0.4 + k * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 300, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 300 * (1 - k * 0.8), 0, Math.PI * 2); ctx.stroke();
      } else if (t.kind === 'frost') {
        ctx.strokeStyle = `rgba(180,235,255,${0.35 + k * 0.45})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 420, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 420 * 0.25, Math.sin(a) * 420 * 0.25);
          ctx.lineTo(Math.cos(a) * 420, Math.sin(a) * 420);
          ctx.stroke();
        }
      } else if (t.kind === 'kirin') {
        ctx.strokeStyle = `rgba(255,240,150,${0.5 + k * 0.5})`;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, 130, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -600);
        ctx.lineTo(-30, -400); ctx.lineTo(20, -260); ctx.lineTo(-14, -120); ctx.lineTo(0, 0);
        ctx.stroke();
      } else if (t.kind === 'volley') {
        ctx.fillStyle = `rgba(255,150,150,${0.12 + k * 0.2})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 420, t.angle - 0.45, t.angle + 0.45);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    // slash arcs (after the fact)
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life -= dt;
      if (s.life <= 0) { this.slashes.splice(i, 1); continue; }
      const k = 1 - s.life / s.total;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.strokeStyle = '#fff3c4';
      ctx.lineWidth = 10 * (1 - k) + 2;
      ctx.beginPath(); ctx.arc(0, 0, s.reach, -Math.PI / 2 - 0.2, Math.PI / 2 + 0.2); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // lightning beams
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.life -= dt;
      if (b.life <= 0) { this.beams.splice(i, 1); continue; }
      const k = b.life / b.total;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = k * 0.9;
      ctx.strokeStyle = '#fff6c8';
      ctx.lineWidth = 3 + k * 3;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      const segs = 4;
      for (let k2 = 1; k2 <= segs; k2++) {
        const t = k2 / segs;
        const x = b.x1 + (b.x2 - b.x1) * t + (Math.random() - 0.5) * 18;
        const y = b.y1 + (b.y2 - b.y1) * t + (Math.random() - 0.5) * 18;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    // particles
    ctx.globalCompositeOperation = 'lighter';
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.94; p.vy *= 0.94;
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    // damage numbers
    ctx.textAlign = 'center';
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const n = this.numbers[i];
      n.life -= dt;
      if (n.life <= 0) { this.numbers.splice(i, 1); continue; }
      const k = 1 - n.life / n.max;
      n.y += n.vy * dt;
      n.vy *= 0.94;
      ctx.globalAlpha = Math.min(1, (1 - k) * 2.2);
      ctx.font = `${n.big ? 700 : 600} ${n.big ? 19 : 14}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillText(n.text, n.x + 1.2, n.y + 1.6);
      ctx.fillStyle = n.color;
      ctx.fillText(n.text, n.x, n.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
}
