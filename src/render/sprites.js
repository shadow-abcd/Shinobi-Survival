// Baked sprites: everything is drawn once into offscreen canvases, then blitted.
// Canvas2D gradients per-entity per-frame would be far too slow at 300+ enemies.
const DPR = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * DPR);
  c.height = Math.ceil(h * DPR);
  const g = c.getContext('2d');
  g.scale(DPR, DPR);
  return { c, g };
}

function glow(color, r, alpha = 1) {
  const { c, g } = canvas(r * 2, r * 2);
  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, hexA(color, 0.95 * alpha));
  grd.addColorStop(0.45, hexA(color, 0.35 * alpha));
  grd.addColorStop(1, hexA(color, 0));
  g.fillStyle = grd;
  g.fillRect(0, 0, r * 2, r * 2);
  return c;
}

export function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

function enemySprite(type, color, edge, r) {
  const pad = 12;
  const size = (r + pad) * 2;
  const { c, g } = canvas(size, size);
  const cx = size / 2, cy = size / 2;

  // shadow
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath(); g.ellipse(cx, cy + r * 0.6, r * 0.92, r * 0.4, 0, 0, Math.PI * 2); g.fill();

  // cloak: a hooded body — circle body with a pointed cowl at the back
  const grd = g.createRadialGradient(cx - r * 0.3, cy - r * 0.45, r * 0.2, cx, cy, r * 1.05);
  grd.addColorStop(0, lighten(color, 0.28));
  grd.addColorStop(0.7, color);
  grd.addColorStop(1, darken(color, 0.35));
  g.fillStyle = grd;
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();

  // cowl point (up-back)
  g.fillStyle = darken(color, 0.45);
  g.beginPath();
  g.moveTo(cx - r * 0.62, cy - r * 0.5);
  g.quadraticCurveTo(cx, cy - r * 1.55, cx + r * 0.62, cy - r * 0.5);
  g.quadraticCurveTo(cx, cy - r * 0.85, cx - r * 0.62, cy - r * 0.5);
  g.closePath(); g.fill();

  if (type === 'archer') {
    // bow slung across the body
    g.strokeStyle = hexA(edge, 0.75);
    g.lineWidth = Math.max(1.4, r * 0.16);
    g.beginPath(); g.arc(cx + r * 0.18, cy + r * 0.1, r * 0.82, -1.15, 1.15); g.stroke();
    g.strokeStyle = 'rgba(220,240,255,0.35)';
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(cx + r * 0.55, cy + r * 0.82); g.lineTo(cx + r * 0.55, cy - r * 0.62); g.stroke();
  } else if (type === 'brute') {
    // shoulder plates
    g.fillStyle = 'rgba(10,8,14,0.55)';
    g.beginPath(); g.ellipse(cx - r * 0.55, cy + r * 0.1, r * 0.42, r * 0.28, 0.3, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(cx + r * 0.55, cy + r * 0.1, r * 0.42, r * 0.28, -0.3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = hexA(edge, 0.45); g.lineWidth = 2;
    g.beginPath(); g.arc(cx, cy, r * 0.55, 0, Math.PI * 2); g.stroke();
  } else {
    // masked band across the face
    g.fillStyle = 'rgba(8,6,12,0.62)';
    g.beginPath(); g.ellipse(cx, cy + r * 0.06, r * 0.72, r * 0.26, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = hexA(edge, 0.5);
    g.beginPath(); g.arc(cx - r * 0.22, cy + r * 0.02, 1.7, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + r * 0.22, cy + r * 0.02, 1.7, 0, Math.PI * 2); g.fill();
  }

  // rim
  g.strokeStyle = hexA(edge, 0.8);
  g.lineWidth = Math.max(1.2, r * 0.1);
  g.beginPath(); g.arc(cx, cy, r - 1, 0, Math.PI * 2); g.stroke();
  return c;
}

function darken(hex, amt) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  const r = Math.max(0, ((n >> 16) & 255) * (1 - amt));
  const g = Math.max(0, ((n >> 8) & 255) * (1 - amt));
  const b = Math.max(0, (n & 255) * (1 - amt));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function playerSprite(r) {
  const pad = 16;
  const size = (r + pad) * 2;
  const { c, g } = canvas(size, size);
  const cx = size / 2, cy = size / 2;

  // shadow
  g.fillStyle = 'rgba(0,0,0,0.45)';
  g.beginPath(); g.ellipse(cx, cy + r * 0.62, r * 1.0, r * 0.4, 0, 0, Math.PI * 2); g.fill();

  // cloak body
  const grd = g.createRadialGradient(cx - r * 0.35, cy - r * 0.5, r * 0.15, cx, cy, r * 1.08);
  grd.addColorStop(0, '#2b3a58');
  grd.addColorStop(0.62, '#141b2c');
  grd.addColorStop(1, '#070a12');
  g.fillStyle = grd;
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();

  // hood folds
  g.strokeStyle = 'rgba(120,160,220,0.22)';
  g.lineWidth = 1.4;
  g.beginPath(); g.arc(cx, cy, r * 0.72, Math.PI * 1.05, Math.PI * 1.95); g.stroke();

  // teal sash across the chest
  g.save();
  g.beginPath(); g.arc(cx, cy, r - 0.8, 0, Math.PI * 2); g.clip();
  g.fillStyle = 'rgba(95,232,200,0.85)';
  g.beginPath();
  g.moveTo(cx - r, cy + r * 0.34);
  g.lineTo(cx + r, cy + r * 0.06);
  g.lineTo(cx + r, cy + r * 0.30);
  g.lineTo(cx - r, cy + r * 0.58);
  g.closePath(); g.fill();
  g.restore();

  // headband
  g.fillStyle = '#dbe7f7';
  g.beginPath(); g.ellipse(cx, cy - r * 0.30, r * 0.62, r * 0.15, -0.12, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#8fb2d8';
  g.beginPath(); g.ellipse(cx + r * 0.02, cy - r * 0.30, r * 0.12, r * 0.12, 0, 0, Math.PI * 2); g.fill();

  // hood shape behind the band
  g.fillStyle = 'rgba(6,8,14,0.55)';
  g.beginPath();
  g.moveTo(cx - r * 0.6, cy - r * 0.34);
  g.quadraticCurveTo(cx, cy - r * 1.25, cx + r * 0.6, cy - r * 0.34);
  g.quadraticCurveTo(cx, cy - r * 0.62, cx - r * 0.6, cy - r * 0.34);
  g.closePath(); g.fill();

  // rim light
  g.strokeStyle = 'rgba(200,240,255,0.95)';
  g.lineWidth = 1.8;
  g.beginPath(); g.arc(cx, cy, r - 0.9, 0, Math.PI * 2); g.stroke();

  // scarf tail (behind, drawn at the back edge)
  g.strokeStyle = 'rgba(95,232,200,0.7)';
  g.lineWidth = 2.6;
  g.beginPath();
  g.moveTo(cx - r * 0.75, cy + r * 0.15);
  g.quadraticCurveTo(cx - r * 1.35, cy + r * 0.35, cx - r * 1.5, cy - r * 0.15);
  g.stroke();
  return c;
}

function bossSprite(r, scheme = {}) {
  const coat = scheme.coat || ['#9d2b3b', '#6b1a26', '#2a0a10'];
  const maskCol = scheme.mask || ['#f2e6dc', '#c9a99a', '#6d4b45'];
  const eyeCol = scheme.eye || '#ff3b3b';
  const rimCol = scheme.rim || 'rgba(255,120,110,0.85)';
  const horns = scheme.horns !== false;
  const pad = 22;
  const size = (r + pad) * 2;
  const { c, g } = canvas(size, size);
  const cx = size / 2, cy = size / 2;

  // shadow
  g.fillStyle = 'rgba(0,0,0,0.5)';
  g.beginPath(); g.ellipse(cx, cy + r * 0.66, r * 1.15, r * 0.45, 0, 0, Math.PI * 2); g.fill();

  // shoulder plates
  g.fillStyle = '#2a1018';
  g.beginPath(); g.ellipse(cx - r * 0.72, cy + r * 0.12, r * 0.46, r * 0.34, 0.35, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(cx + r * 0.72, cy + r * 0.12, r * 0.46, r * 0.34, -0.35, 0, Math.PI * 2); g.fill();

  // haori (coat)
  const grd = g.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.15, cx, cy, r * 1.05);
  grd.addColorStop(0, coat[0]);
  grd.addColorStop(0.55, coat[1]);
  grd.addColorStop(1, coat[2]);
  g.fillStyle = grd;
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();

  // coat opening (pale inner robe)
  g.fillStyle = 'rgba(230,220,215,0.16)';
  g.beginPath();
  g.moveTo(cx, cy - r * 0.1);
  g.lineTo(cx + r * 0.30, cy + r * 0.85);
  g.lineTo(cx - r * 0.30, cy + r * 0.85);
  g.closePath(); g.fill();

  // oni mask
  const mask = g.createRadialGradient(cx - r * 0.1, cy - r * 0.42, 1, cx, cy - r * 0.28, r * 0.62);
  mask.addColorStop(0, maskCol[0]);
  mask.addColorStop(0.75, maskCol[1]);
  mask.addColorStop(1, maskCol[2]);
  g.fillStyle = mask;
  g.beginPath(); g.ellipse(cx, cy - r * 0.26, r * 0.46, r * 0.5, 0, 0, Math.PI * 2); g.fill();

  // horns
  if (horns) {
    g.fillStyle = '#e8ded6';
    g.beginPath(); g.moveTo(cx - r * 0.34, cy - r * 0.62); g.lineTo(cx - r * 0.52, cy - r * 1.05); g.lineTo(cx - r * 0.14, cy - r * 0.72); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx + r * 0.34, cy - r * 0.62); g.lineTo(cx + r * 0.52, cy - r * 1.05); g.lineTo(cx + r * 0.14, cy - r * 0.72); g.closePath(); g.fill();
  }

  // eyes + grin
  g.fillStyle = eyeCol;
  g.beginPath(); g.ellipse(cx - r * 0.19, cy - r * 0.34, r * 0.10, r * 0.07, -0.25, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(cx + r * 0.19, cy - r * 0.34, r * 0.10, r * 0.07, 0.25, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(30,8,10,0.8)';
  g.lineWidth = Math.max(1.5, r * 0.055);
  g.beginPath();
  g.moveTo(cx - r * 0.2, cy - r * 0.05);
  g.quadraticCurveTo(cx, cy + r * 0.12, cx + r * 0.2, cy - r * 0.05);
  g.stroke();

  // rim light
  g.strokeStyle = rimCol;
  g.lineWidth = 2;
  g.beginPath(); g.arc(cx, cy, r - 1, 0, Math.PI * 2); g.stroke();
  return c;
}

function gemSprite() {
  const s = 24;
  const { c, g } = canvas(s, s);
  const cx = s / 2, cy = s / 2;
  const grd = g.createRadialGradient(cx, cy, 1, cx, cy, 11);
  grd.addColorStop(0, 'rgba(120,225,255,0.55)');
  grd.addColorStop(1, 'rgba(63,208,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  // faceted diamond
  g.fillStyle = '#2ea9d8';
  g.beginPath();
  g.moveTo(cx, cy - 6); g.lineTo(cx + 4.6, cy - 1); g.lineTo(cx, cy + 6); g.lineTo(cx - 4.6, cy - 1);
  g.closePath(); g.fill();
  g.fillStyle = '#9fe9ff';
  g.beginPath();
  g.moveTo(cx, cy - 6); g.lineTo(cx + 4.6, cy - 1); g.lineTo(cx, cy + 1.4);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(240,253,255,0.95)';
  g.beginPath(); g.arc(cx - 1, cy - 2.4, 1.2, 0, Math.PI * 2); g.fill();
  return c;
}

function lighten(hex, amt) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  const r = Math.min(255, ((n >> 16) & 255) + 255 * amt);
  const g = Math.min(255, ((n >> 8) & 255) + 255 * amt);
  const b = Math.min(255, (n & 255) + 255 * amt);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}


function toadSprite(r) {
  const pad = 12, size = (r + pad) * 2;
  const { c, g } = canvas(size, size);
  const cx = size / 2, cy = size / 2;
  g.fillStyle = 'rgba(0,0,0,0.4)';
  g.beginPath(); g.ellipse(cx, cy + r * 0.7, r * 1.1, r * 0.42, 0, 0, Math.PI * 2); g.fill();
  const grd = g.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.2, cx, cy, r);
  grd.addColorStop(0, '#a8e6a0');
  grd.addColorStop(0.7, '#4f9a63');
  grd.addColorStop(1, '#1f4a30');
  g.fillStyle = grd;
  g.beginPath(); g.ellipse(cx, cy + r * 0.1, r * 0.95, r * 0.8, 0, 0, Math.PI * 2); g.fill();
  // eyes
  g.fillStyle = '#f4ffe8';
  g.beginPath(); g.arc(cx - r * 0.45, cy - r * 0.5, r * 0.26, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(cx + r * 0.45, cy - r * 0.5, r * 0.26, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#101a10';
  g.beginPath(); g.arc(cx - r * 0.45, cy - r * 0.5, r * 0.12, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(cx + r * 0.45, cy - r * 0.5, r * 0.12, 0, Math.PI * 2); g.fill();
  // mouth
  g.strokeStyle = 'rgba(20,30,20,0.7)'; g.lineWidth = 2.4;
  g.beginPath(); g.arc(cx, cy + r * 0.25, r * 0.45, 0.25, Math.PI - 0.25); g.stroke();
  g.strokeStyle = 'rgba(190,255,200,0.5)'; g.lineWidth = 1.6;
  g.beginPath(); g.ellipse(cx, cy + r * 0.1, r * 0.9, r * 0.75, 0, Math.PI * 1.05, Math.PI * 1.75); g.stroke();
  return c;
}

function golemSprite(r) {
  const pad = 12, size = (r + pad) * 2;
  const { c, g } = canvas(size, size);
  const cx = size / 2, cy = size / 2;
  g.fillStyle = 'rgba(0,0,0,0.45)';
  g.beginPath(); g.ellipse(cx, cy + r * 0.72, r * 1.15, r * 0.4, 0, 0, Math.PI * 2); g.fill();
  const grd = g.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.2, cx, cy, r);
  grd.addColorStop(0, '#8d7050');
  grd.addColorStop(0.7, '#4d3a28');
  grd.addColorStop(1, '#251a12');
  g.fillStyle = grd;
  g.beginPath();
  const pts = 7;
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const rr = r * (0.82 + ((i * 37) % 10) / 45);
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(200,170,120,0.35)'; g.lineWidth = 2;
  g.stroke();
  g.fillStyle = '#ffb45a';
  g.beginPath(); g.arc(cx - r * 0.22, cy - r * 0.15, 2.6, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(cx + r * 0.22, cy - r * 0.15, 2.6, 0, Math.PI * 2); g.fill();
  return c;
}

function waterCloneSprite(r) {
  const pad = 12, size = (r + pad) * 2;
  const { c, g } = canvas(size, size);
  const cx = size / 2, cy = size / 2;
  g.fillStyle = 'rgba(0,0,0,0.3)';
  g.beginPath(); g.ellipse(cx, cy + r * 0.6, r * 0.9, r * 0.35, 0, 0, Math.PI * 2); g.fill();
  const grd = g.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.15, cx, cy, r * 1.05);
  grd.addColorStop(0, 'rgba(190,235,255,0.95)');
  grd.addColorStop(0.6, 'rgba(70,150,220,0.9)');
  grd.addColorStop(1, 'rgba(20,60,110,0.9)');
  g.fillStyle = grd;
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(200,240,255,0.85)'; g.lineWidth = 1.6;
  g.beginPath(); g.arc(cx, cy, r - 1, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(240,252,255,0.9)';
  g.beginPath(); g.ellipse(cx, cy - r * 0.2, r * 0.45, r * 0.14, 0, 0, Math.PI * 2); g.fill();
  return c;
}

export function buildSprites() {
  const S = {};
  S.fodder = enemySprite('fodder', '#a8455f', '#ff7f9b', 13);
  S.brute = enemySprite('brute', '#6f2f4a', '#ff9a7f', 21);
  S.archer = enemySprite('archer', '#3d5a7a', '#7fc4ff', 12);
  S.player = playerSprite(13);
  S.toad = toadSprite(30);
  S.golem = golemSprite(20);
  S.waterClone = waterCloneSprite(16);
  S.boss = bossSprite(34);
  S.bossRonin = bossSprite(34);
  S.twinRanged = bossSprite(26, { coat: ['#3b4b7a', '#1e2a4a', '#0b1020'], mask: ['#e6e9f2', '#a9b4c9', '#4b5566'], eye: '#8fd0ff', rim: 'rgba(140,190,255,0.85)', horns: false });
  S.twinMelee = bossSprite(28, { coat: ['#7a3b4b', '#4a1e2a', '#200b10'], mask: ['#f2e0e6', '#c99aa9', '#664b55'], eye: '#ff6b8a', rim: 'rgba(255,140,160,0.85)', horns: false });
  S.warden = bossSprite(46, { coat: ['#6b6152', '#3a352c', '#171410'], mask: ['#d8d0c0', '#9a917f', '#4b463c'], eye: '#ffb45a', rim: 'rgba(220,200,150,0.9)' });
  S.sovereign = bossSprite(52, { coat: ['#5b2b7a', '#2f1642', '#120716'], mask: ['#f0e6ff', '#b79bd8', '#5b4a6d'], eye: '#ffd27a', rim: 'rgba(200,160,255,0.9)' });
  S.gem = gemSprite();
  S.gemElite = gemSprite();
  S.glowFire = glow('#ff7a2f', 32);
  S.glowWind = glow('#5fe8c8', 32);
  S.glowGold = glow('#ffd27a', 48);
  S.glowWhite = glow('#ffffff', 40);
  S.orbFire = glow('#ff9a3c', 18);
  S.orbWind = glow('#7ff0d4', 16);
  S.orbEnemy = glow('#8fd0ff', 9);
  S.shadowSoft = glow('#000000', 40);
  return S;
}
