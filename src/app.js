// App shell: input, fixed-timestep loop, screen transitions.
import { World, TICK } from './core/world.js';
import { Renderer } from './render/renderer.js';
import { UI } from './ui/menus.js';
import { Audio } from './ui/audio.js';
import { loadSave, writeSave, bankRun, metaModifiers } from './core/meta.js';
import { botStep } from './ui/autopilot.js';

const canvas = document.getElementById('game');
window.__err = '';
window.addEventListener('error', (e) => { window.__err = String(e.message || e.error); });
window.addEventListener('unhandledrejection', (e) => { window.__err = 'rej ' + String(e.reason); });
const params = new URLSearchParams(location.search);
const seed = params.has('seed') ? parseInt(params.get('seed'), 10) : (Date.now() % 100000);

const world = new World(seed);
let save = loadSave(window.localStorage);
// dev helper: ?debugseals=500 seeds a balance for testing the Academy
if (params.has('debugseals')) { save.seals = parseInt(params.get('debugseals'), 10) || 0; }
if (params.has('debugasc')) { save.ascension = parseInt(params.get('debugasc'), 10) || 0; }
const renderer = new Renderer(canvas, world);
const ui = new UI();
const audio = new Audio();

let started = false;
let menuOpen = false;
let acc = 0;
let last = performance.now();
let bossAnnounced = false;
let lateAnnounced = false;
let safeAnnounced = false;
let fpsAcc = 0, fpsN = 0;

window.addEventListener('resize', () => renderer.resize());

// ---------------- input ----------------
const keys = new Set();
const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
};
window.addEventListener('keydown', (e) => {
  if (KEYMAP[e.code]) { keys.add(KEYMAP[e.code]); e.preventDefault(); }
  if (e.code === 'Space') { world.input.dash = true; e.preventDefault(); }
  if (e.code === 'KeyQ') { tryUltimate(); }
  if (e.code === 'KeyM') audio.toggle();
  if (e.code === 'Digit1' && ui.currentPick) ui.currentPick(0);
  if (e.code === 'Digit2' && ui.currentPick) ui.currentPick(1);
  if (e.code === 'Digit3' && ui.currentPick) ui.currentPick(2);
  audio.init();
});
window.addEventListener('keyup', (e) => {
  if (KEYMAP[e.code]) keys.delete(KEYMAP[e.code]);
});

function readKeys() {
  let x = 0, y = 0;
  if (keys.has('left')) x -= 1;
  if (keys.has('right')) x += 1;
  if (keys.has('up')) y -= 1;
  if (keys.has('down')) y += 1;
  return { x, y };
}

// touch joystick
let stickId = null, stickOrigin = null;
const stick = document.getElementById('stick');
const knob = document.getElementById('stickknob');
const isTouch = window.matchMedia('(pointer: coarse)').matches;
if (isTouch) {
  document.getElementById('touch').classList.remove('hidden');
  const dashBtn = document.getElementById('dashbtn');
  const ultBtn = document.getElementById('ultbtn');
  dashBtn.addEventListener('touchstart', (e) => { world.input.dash = true; e.preventDefault(); });
  ultBtn.addEventListener('touchstart', (e) => { tryUltimate(); e.preventDefault(); });
}
stick.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  stickId = t.identifier;
  const r = stick.getBoundingClientRect();
  stickOrigin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  e.preventDefault();
}, { passive: false });
stick.addEventListener('touchmove', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier !== stickId) continue;
    const dx = t.clientX - stickOrigin.x, dy = t.clientY - stickOrigin.y;
    const max = 46;
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / max);
    touchVec.x = (dx / d) * k; touchVec.y = (dy / d) * k;
    knob.style.transform = `translate(${(dx / d) * Math.min(max, d)}px, ${(dy / d) * Math.min(max, d)}px)`;
  }
  e.preventDefault();
}, { passive: false });
const resetStick = (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier !== stickId) continue;
    stickId = null; touchVec.x = 0; touchVec.y = 0;
    knob.style.transform = 'translate(0,0)';
  }
};
stick.addEventListener('touchend', resetStick);
stick.addEventListener('touchcancel', resetStick);
const touchVec = { x: 0, y: 0 };

canvas.addEventListener('dblclick', () => tryUltimate());
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function tryUltimate() {
  if (world.state !== 'playing') return;
  if (world.castUltimate()) audio.ultimate();
}

// ---------------- audio hooks ----------------
world.bus.on('cast', (e) => audio.cast(e.element || 'fire'));
world.bus.on('damage', (e) => { if (!e.dot) audio.hit(e.crit || e.detonate); });
world.bus.on('detonate', () => audio.detonate());
world.bus.on('fusion', () => audio.fusion());
world.bus.on('boss:telegraph', (e) => audio.telegraph(e.kind));
world.bus.on('boss:phase', () => audio.bossPhase());
world.bus.on('stage:clear', () => audio.level());
world.bus.on('player:hurt', () => audio.hurt());
world.bus.on('levelup', () => audio.level());
world.bus.on('boss:spawn', () => audio.boss());
// FIX Batch 4: Batch 2 boss events had VFX but no sound. Hook them up.
world.bus.on('boss:armor', () => audio.armor());
world.bus.on('boss:swap', () => audio.swap());
world.bus.on('boss:enrage', () => audio.enrage());
world.bus.on('counter:reflect', () => audio.counter());
// FIX Batch 5: Breakthrough + Flow audio.
world.bus.on('rank:breakthrough', () => audio.breakthrough());
world.bus.on('flow:start', () => audio.flow());
// FIX Batch 6: Banish audio.
world.bus.on('banish', () => audio.banish());

// ---------------- screens ----------------
// dev helpers: ?warp=<seconds> skips ahead, &god=1 keeps the player alive while skipping
const WARP = parseInt(params.get('warp') || '0', 10);
const GOD = params.get('god') === '1';
const SHOW_FPS = params.get('fps') === '1';
const AUTO = params.get('auto') === '1';
const NO_MENUS = params.get('nomenu') === '1';

function startRun(ult = params.get('ult') || 'cataclysm') {
  world.reset(params.has('seed') ? seed : (Date.now() % 100000), save);
  world.ultimate = ult;
  const realDamage = world.damagePlayer.bind(world);
  if (GOD) world.damagePlayer = () => {};
  if (WARP > 0) {
    const ticks = WARP * 60;
    for (let i = 0; i < ticks; i++) {
      try {
      if (world.state === 'levelup') {
        if (AUTO) { world.chooseLevelUp(world.pendingChoices[0]); continue; }
        break;
      }
      if (world.state !== 'playing') break;
      if (AUTO) botStep(world, world.t);
      world.step(TICK);
      } catch (err) {
        window.__err = 'warp: ' + err.message + ' @t' + world.t.toFixed(0);
        break;
      }
    }
    bossAnnounced = world.bossSpawned;
    lateAnnounced = world.t > 285;
  }
  if (GOD) world.damagePlayer = realDamage;
  if (params.has('hp1')) { world.player.hp = 1; world.player.iframe = 0; world.player.regenT = 0; }
  acc = 0; started = true; menuOpen = false;
  bossAnnounced = false; lateAnnounced = false;
  audio.init();
  ui.banner_('Whispering Forest', 2.2);
}

function openAcademy() {
  ui.showAcademy(save, () => {
    writeSave(window.localStorage, save);
    ui.showAcademy(save, refreshAcademy, () => { ui.hideOverlay(); ui.showStart(startRun, save, openAcademy); });
  }, () => { ui.hideOverlay(); ui.showStart(startRun, save, openAcademy); });
}
function refreshAcademy() {
  ui.showAcademy(save, refreshAcademy, () => { ui.hideOverlay(); ui.showStart(startRun, save, openAcademy); });
}
if (AUTO) { startRun(); } else { ui.showStart(startRun, save, openAcademy); }

function handleState() {
  if (world.state === 'levelup' && AUTO) {
    world.chooseLevelUp(world.pendingChoices[0]);
    return;
  }
  if (world.state === 'levelup' && !menuOpen) {
    menuOpen = true;
    // FIX Batch 6: Banish does NOT cost the pick — after banishing, re-show the re-rolled menu with the same pick handler.
    const showMenu = () => ui.showLevelUp(world.player.level, world.pendingChoices, pick, {
      rank: world.player.rank, banishCharges: world.player.banishCharges,
      onBanish: (choice) => { if (world.banish(choice)) showMenu(); },
    });
    const pick = (choice) => {
      world.chooseLevelUp(choice);
      if (world.state === 'levelup') showMenu();
      else menuOpen = false;
    };
    showMenu();
    return;
  }
  if (world.state === 'choice' && AUTO) { world.resumeFight(); return; }
  if (world.state === 'choice' && !menuOpen) {
    menuOpen = true;
    ui.showChoice({
      onFight: () => { menuOpen = false; world.resumeFight(); },
      onExtract: () => { menuOpen = false; world.extract(); },
    });
    return;
  }
  if ((world.state === 'dead' || world.state === 'won') && !menuOpen) {
    menuOpen = true;
    const earned = bankRun(save, {
      win: world.state === 'won' && !world.extracted,
      extracted: world.extracted,
      bosses: world.stageIndex,
      time: world.t,
      level: world.player.level,
    });
    writeSave(window.localStorage, save);
    ui.showRunEnd({
      win: world.state === 'won', time: world.t, level: world.player.level, kills: world.kills,
      damage: world.damageDealt,
      abilities: world.abilities.map((a) => ({ ...a })),
      passives: world.passives.map((a) => ({ ...a })),
      bossPct: world.boss ? Math.max(0, Math.round((world.boss.hp / world.boss.maxHp) * 100)) : 100,
      stage: world.stageIndex, extracted: world.extracted,
      sealsEarned: earned, sealsTotal: save.seals,
    }, () => { menuOpen = false; startRun(world.ultimate); });
  }
}

// ---------------- loop ----------------
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1;

  if (started && world.state === 'playing') {
    if (AUTO) {
      botStep(world, world.t);
    } else {
      const k = readKeys();
      if (touchVec.x || touchVec.y) { world.input.x = touchVec.x; world.input.y = touchVec.y; }
      else { world.input.x = k.x; world.input.y = k.y; }
    }
    if (world.hitstop > 0) {
      world.hitstop = Math.max(0, world.hitstop - dt);   // brief freeze on big hits
      acc = 0;
    } else {
      acc += dt;
      let guard = 0;
      while (acc >= TICK && guard++ < 6) {
        world.step(TICK);
        acc -= TICK;
        if (world.state !== 'playing') break;
      }
    }
    if (world.state === 'playing' && !lateAnnounced && world.t > 270 && world.t < 300) {
      lateAnnounced = true;
      ui.banner_('Something is coming', 2.0);
    }
    if (world.safeT > 0 && !safeAnnounced) {
      safeAnnounced = true;
      ui.banner_('The field goes quiet', 1.6);
    }
    if (world.safeT <= 0) safeAnnounced = false;
    if (world.bossActive && !bossAnnounced) {
      bossAnnounced = true;
      ui.banner_(world.boss ? world.boss.name : 'Boss', 2.6);
    }
    if (!world.bossActive) bossAnnounced = false;
  }

  renderer.draw(dt);
  ui.update(world, dt);
  if (SHOW_FPS) {
    fpsAcc += dt; fpsN++;
    if (fpsAcc >= 0.5) {
      const w = world;
      document.getElementById('fps').textContent =
        `${Math.round(fpsN / fpsAcc)} fps · ${w.enemies.count} en · ${w.t.toFixed(0)}s · ${w.state} · lv ${w.player.level} · kills ${w.kills} · boss ${w.boss ? Math.round(w.boss.hp) : '-'} · hp ${Math.round(w.player.hp)} · ${w.abilities.map(a=>a.id[0]+a.rank).join('')} · xp ${Math.round(w.player.xp)}/${w.player.xpNeed} · gems ${w.gems.count} · ERR ${window.__err || '-'}`;
      fpsAcc = 0; fpsN = 0;
    }
  }
  if (isTouch) {
    document.getElementById('ultbtn').classList.toggle('ready', world.player.chakra >= 100);
  }
  handleState();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
window.__world = world;

// Step 4: Polish — M=mute, S=shake toggle, C=colorblind toggle
window.addEventListener('keydown', (e)=>{
  if(e.key==='m'||e.key==='M'){ window.__muted = !window.__muted; try{ localStorage.setItem('shinobi.settings.v1', JSON.stringify({muted: window.__muted, shake: window.__shake!==false, colorblind: !!window.__colorblind})); }catch(_){} console.log('mute', window.__muted); }
  if(e.key==='s'||e.key==='S'){ window.__shake = !(window.__shake!==false); console.log('shake', window.__shake); }
  if(e.key==='c'||e.key==='C'){ window.__colorblind = !window.__colorblind; document.body.classList.toggle('colorblind', !!window.__colorblind); console.log('colorblind', window.__colorblind); }
});
// Step 4: restore settings on load
try{ const s = JSON.parse(localStorage.getItem('shinobi.settings.v1')||'{}'); window.__muted = !!s.muted; window.__shake = s.shake!==false; window.__colorblind = !!s.colorblind; if(window.__colorblind) document.body.classList.add('colorblind'); }catch(_){}

// Step 4: Polish — M=mute, S=shake toggle, C=colorblind toggle
window.addEventListener('keydown', (e)=>{
  if(e.key==='m'||e.key==='M'){ window.__muted = !window.__muted; try{ localStorage.setItem('shinobi.settings.v1', JSON.stringify({muted: window.__muted, shake: window.__shake!==false, colorblind: !!window.__colorblind})); }catch(_){} console.log('mute', window.__muted); }
  if(e.key==='s'||e.key==='S'){ window.__shake = !(window.__shake!==false); console.log('shake', window.__shake); }
  if(e.key==='c'||e.key==='C'){ window.__colorblind = !window.__colorblind; document.body.classList.toggle('colorblind', !!window.__colorblind); console.log('colorblind', window.__colorblind); }
});
// Step 4: restore settings on load
try{ const s = JSON.parse(localStorage.getItem('shinobi.settings.v1')||'{}'); window.__muted = !!s.muted; window.__shake = s.shake!==false; window.__colorblind = !!s.colorblind; if(window.__colorblind) document.body.classList.add('colorblind'); }catch(_){}

// Step 4: Polish — M=mute, S=shake toggle, C=colorblind toggle
window.addEventListener('keydown', (e)=>{
  if(e.key==='m'||e.key==='M'){ window.__muted = !window.__muted; try{ localStorage.setItem('shinobi.settings.v1', JSON.stringify({muted: window.__muted, shake: window.__shake!==false, colorblind: !!window.__colorblind})); }catch(_){} console.log('mute', window.__muted); }
  if(e.key==='s'||e.key==='S'){ window.__shake = !(window.__shake!==false); console.log('shake', window.__shake); }
  if(e.key==='c'||e.key==='C'){ window.__colorblind = !window.__colorblind; document.body.classList.toggle('colorblind', !!window.__colorblind); console.log('colorblind', window.__colorblind); }
});
// Step 4: restore settings on load
try{ const s = JSON.parse(localStorage.getItem('shinobi.settings.v1')||'{}'); window.__muted = !!s.muted; window.__shake = s.shake!==false; window.__colorblind = !!s.colorblind; if(window.__colorblind) document.body.classList.add('colorblind'); }catch(_){}

// Step 4: Polish — M=mute, S=shake toggle, C=colorblind toggle
window.addEventListener('keydown', (e)=>{
  if(e.key==='m'||e.key==='M'){ window.__muted = !window.__muted; try{ localStorage.setItem('shinobi.settings.v1', JSON.stringify({muted: window.__muted, shake: window.__shake!==false, colorblind: !!window.__colorblind})); }catch(_){} console.log('mute', window.__muted); }
  if(e.key==='s'||e.key==='S'){ window.__shake = !(window.__shake!==false); console.log('shake', window.__shake); }
  if(e.key==='c'||e.key==='C'){ window.__colorblind = !window.__colorblind; document.body.classList.toggle('colorblind', !!window.__colorblind); console.log('colorblind', window.__colorblind); }
});
// Step 4: restore settings on load
try{ const s = JSON.parse(localStorage.getItem('shinobi.settings.v1')||'{}'); window.__muted = !!s.muted; window.__shake = s.shake!==false; window.__colorblind = !!s.colorblind; if(window.__colorblind) document.body.classList.add('colorblind'); }catch(_){}

// Step 4: Polish — M=mute, S=shake toggle, C=colorblind toggle
window.addEventListener('keydown', (e)=>{
  if(e.key==='m'||e.key==='M'){ window.__muted = !window.__muted; try{ localStorage.setItem('shinobi.settings.v1', JSON.stringify({muted: window.__muted, shake: window.__shake!==false, colorblind: !!window.__colorblind})); }catch(_){} console.log('mute', window.__muted); }
  if(e.key==='s'||e.key==='S'){ window.__shake = !(window.__shake!==false); console.log('shake', window.__shake); }
  if(e.key==='c'||e.key==='C'){ window.__colorblind = !window.__colorblind; document.body.classList.toggle('colorblind', !!window.__colorblind); console.log('colorblind', window.__colorblind); }
});
// Step 4: restore settings on load
try{ const s = JSON.parse(localStorage.getItem('shinobi.settings.v1')||'{}'); window.__muted = !!s.muted; window.__shake = s.shake!==false; window.__colorblind = !!s.colorblind; if(window.__colorblind) document.body.classList.add('colorblind'); }catch(_){}

// Batch 10: Joystick — Magic Survival feel. Left thumb = move, spells auto-cast + auto-aim.
// Touch on left half of screen = joystick. Drag to move, release to stop.
(function(){
  let joyId = null, joyX = 0, joyY = 0, joyStartX = 0, joyStartY = 0;
  const el = document.getElementById('game') || document.body;
  el.addEventListener('touchstart', (e)=>{
    for (const touch of e.changedTouches){
      if (touch.clientX < window.innerWidth * 0.5 && joyId === null){
        joyId = touch.identifier; joyStartX = touch.clientX; joyStartY = touch.clientY; joyX = 0; joyY = 0;
      }
    }
  }, {passive: true});
  el.addEventListener('touchmove', (e)=>{
    for (const touch of e.changedTouches){
      if (touch.identifier === joyId){
        const dx = touch.clientX - joyStartX, dy = touch.clientY - joyStartY;
        const d = Math.hypot(dx, dy) || 1;
        const max = 60;
        const cl = Math.min(d, max);
        joyX = (dx/d) * (cl/max); joyY = (dy/d) * (cl/max);
        // Feed into world input if world is global
        if (window.world) { window.world.input.x = joyX; window.world.input.y = joyY; }
        if (window.gameWorld) { window.gameWorld.input.x = joyX; window.gameWorld.input.y = joyY; }
      }
    }
  }, {passive: true});
  const endJoy = (e)=>{
    for (const touch of e.changedTouches){
      if (touch.identifier === joyId){ joyId = null; joyX = 0; joyY = 0; if (window.world) { window.world.input.x = 0; window.world.input.y = 0; } }
    }
  };
  el.addEventListener('touchend', endJoy, {passive: true});
  el.addEventListener('touchcancel', endJoy, {passive: true});
  console.log('Batch 10: Joystick ready — left thumb to move, spells auto-cast');
})();
