// DOM HUD + overlay screens (start, level-up, run-end). No game logic here.
import { ABILITIES, ULTIMATES, ELEMENTS } from '../core/abilities.js';
import { PASSIVES } from '../core/upgrades.js';
import { CLANS } from '../core/meta.js';
import { academyHTML, bindAcademy } from './academy.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor() {
    this.overlay = $('overlay');
    this.hpfill = $('hpfill'); this.hptext = $('hptext');
    this.chakrafill = $('chakrafill'); this.chakratext = $('chakratext');
    this.xpfill = $('xpfill'); this.xptext = $('xptext');
    this.timer = $('timer'); this.banner = $('wavebanner');
    this.bar = $('abilitybar');
    this.slots = new Map();
    this.bannerT = 0;
    this.bossbar = document.getElementById('bossbar');
    this.bossfill = document.getElementById('bossfill');
  }

  hideOverlay() {
    this.overlay.classList.add('hidden');
    this.overlay.innerHTML = '';
    document.getElementById('hud').style.opacity = '1';
  }
  showOverlay(html) {
    this.overlay.innerHTML = html;
    this.overlay.classList.remove('hidden');
    document.getElementById('hud').style.opacity = '0';
  }

  showAcademy(save, onBuy, onClose) {
    this.showOverlay(academyHTML(save));
    bindAcademy(this.overlay, save, onBuy, onClose);
  }

  showStart(onStart, save, onAcademy) {
    const ults = Object.values(ULTIMATES).map((u, i) => `
      <div class="ultcard" data-id="${u.id}">
        <div class="k">${u.tag}</div>
        <div class="n">${u.name}</div>
        <div class="d">${u.desc}</div>
      </div>`).join('');
    this.showOverlay(`
      <div class="panel center">
        <div class="title">Shinobi Survival</div>
        <div class="sub">Step 4 · Twenty minutes · four bosses · a reason to run again</div>
        <div class="card stat" style="max-width:560px;margin:0 auto;cursor:default;">
          <div class="k">Your first mission</div>
          <div class="d" style="font-size:13.5px;">
            Twenty minutes. Four bosses between you and the rank of Kage — the Ronin at five,
            the Twin at ten, the Warden at fifteen, the Sovereign at twenty.<br><br>
            You start with a fireball and an empty loadout. Every level you pick a jutsu or a
            passive: four active slots, six passives, five ranks each. The elements prime each
            other — <b>Wind</b> aerates and Fire detonates for 3×, <b>Water</b> drenches and
            Lightning chains, <b>Earth</b> roots and Wind launches. Ten fusion pairs sit between
            the five elements. Seals carry over: spend them in the Academy.
          </div>
        </div>
        <div class="keys">
          <span><kbd>WASD</kbd> / <kbd>arrows</kbd> move</span>
          <span><kbd>Space</kbd> dash</span>
          <span><kbd>Q</kbd> or <kbd>click</kbd> ultimate</span>
          <span><kbd>A</kbd> auto-cast is automatic</span>
        </div>
        <div class="ultpick">
          <div class="sub" style="margin-bottom:10px">Choose your ultimate</div>
          <div class="ultlist">${ults}</div>
        </div>
        <div class="metastrip">
          <span>${save ? save.seals : 0} seals</span>
          <span>${save ? (CLANS[save.clan] || CLANS.uchiha).name : 'Uchiha'}</span>
          <span>Ascension ${save ? save.ascension : 0}</span>
          <div class="btn ghost" id="acadbtn">Academy</div>
        </div>
        <div class="btn" id="startbtn">Enter the forest</div>
        <div class="hint">Best on a keyboard. Touch works: left stick, right buttons.</div>
      </div>`);
    let chosen = 'cataclysm';
    this.overlay.querySelectorAll('.ultcard').forEach((el) => {
      if (el.dataset.id === chosen) el.classList.add('sel');
      el.onclick = () => {
        chosen = el.dataset.id;
        this.overlay.querySelectorAll('.ultcard').forEach((o) => o.classList.toggle('sel', o === el));
      };
    });
    $('startbtn').onclick = () => { this.hideOverlay(); onStart(chosen); };
    const ab = $('acadbtn');
    if (ab && onAcademy) ab.onclick = onAcademy;
  }

  // FIX Batch 5: showLevelUp now takes an optional rank (4th arg) and renders Breakthrough cards distinctly.
  // Old signature showLevelUp(level, choices, onPick) still works — rank is optional.
  showLevelUp(level, choices, onPick, rank) {
    const rankLabel = rank ? ` · ${rank.charAt(0).toUpperCase() + rank.slice(1)}` : '';
    const cards = choices.map((c, i) => {
      if (c.kind === 'breakthrough') {
        return `<div class="card breakthrough" data-i="${i}" style="border-color:#ffd27a;background:linear-gradient(180deg,rgba(255,210,122,0.16),rgba(255,122,47,0.08))">
        <div class="k">Breakthrough · ${c.tag}</div>
        <div class="n">${c.name}</div>
        <div class="d">${c.desc}</div>
        <div class="tag">RANK</div>
      </div>`;
      }
      const cls = c.element === 'stat' ? 'stat' : c.element;
      return `<div class="card ${cls}" data-i="${i}">
        <div class="k">${c.kind === 'ability' ? 'Jutsu' : 'Passive'} · ${c.tag}</div>
        <div class="n">${c.name}</div>
        <div class="d">${c.desc}</div>
        <div class="tag">${c.element === 'stat' ? 'Passive' : c.element.toUpperCase()}</div>
      </div>`;
    }).join('');
    this.showOverlay(`
      <div class="panel">
        <div class="title" style="font-size:clamp(22px,4vw,36px)">Level ${level}${rankLabel}</div>
        <div class="sub">Choose one</div>
        <div class="cards">${cards}</div>
        <div class="hint">1 · 2 · 3 to pick</div>
      </div>`);
    const pick = (i) => { this.hideOverlay(); onPick(choices[i]); };
    this.overlay.querySelectorAll('.card').forEach((el) => {
      el.onclick = () => pick(parseInt(el.dataset.i, 10));
    });
    this.currentPick = pick;
  }

  showChoice({ onFight, onExtract }) {
    this.showOverlay(`
      <div class="panel center">
        <div class="title" style="font-size:clamp(24px,4.4vw,40px)">The Sovereign is broken</div>
        <div class="sub">Extract, or finish it</div>
        <div class="card stat" style="max-width:560px;margin:0 auto;cursor:default;text-align:left;">
          <div class="d" style="font-size:13.5px;">
            He is at a quarter health and the arena is about to collapse. Walking away now keeps
            everything you earned. Staying means the fight gets harder — and losing it costs you
            a quarter of your Seals.
          </div>
        </div>
        <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:22px;">
          <div class="btn ghost" id="extractbtn">Extract</div>
          <div class="btn" id="fightbtn">Finish the fight</div>
        </div>
      </div>`);
    document.getElementById('extractbtn').onclick = () => { this.hideOverlay(); onExtract(); };
    document.getElementById('fightbtn').onclick = () => { this.hideOverlay(); onFight(); };
  }

  showRunEnd({ win, time, level, kills, damage, abilities, passives, bossPct, stage, extracted, sealsEarned, sealsTotal }, onRestart) {
    const mm = Math.floor(time / 60), ss = Math.floor(time % 60).toString().padStart(2, '0');
    const build = abilities.map((a) => `${ABILITIES[a.id].name} <span style="opacity:.55">R${a.rank}</span>`).join(' · ');
    const pas = passives.length
      ? passives.map((a) => `${PASSIVES[a.id].name} <span style="opacity:.55">R${a.rank}</span>`).join(' · ')
      : 'none';
    this.showOverlay(`
      <div class="panel center">
        <div class="title" style="font-size:clamp(26px,5vw,46px);${win ? '' : 'background:linear-gradient(180deg,#fff,#ff5a5a);-webkit-background-clip:text;background-clip:text;'}">
          ${win ? (extracted ? 'Extracted — Alive' : 'The Sovereign falls') : 'You fell'}
        </div>
        <div class="sub">${extracted ? 'Extracted with what you earned' : win ? 'Run complete' : 'The forest keeps what it takes'}</div>
        <div class="stats">
          <div class="stat-box"><div class="v">${mm}:${ss}</div><div class="l">Survived</div></div>
          <div class="stat-box"><div class="v">${level}</div><div class="l">Level</div></div>
          <div class="stat-box"><div class="v">${stage}/4</div><div class="l">Bosses</div></div>
          <div class="stat-box"><div class="v">${kills}</div><div class="l">Kills</div></div>
          <div class="stat-box"><div class="v">${Math.round(damage / 100) / 10}k</div><div class="l">Damage</div></div>
          <div class="stat-box"><div class="v" style="color:#ffd27a">+${sealsEarned || 0}</div><div class="l">Seals · ${sealsTotal || 0} owned</div></div>
          ${win ? '' : `<div class="stat-box"><div class="v">${bossPct}%</div><div class="l">${['The Ronin', 'The Twin', 'The Warden', 'The Sovereign'][stage] || 'Boss'} HP left</div></div>`}
          <!-- FIX Batch 2: run-end no longer always says "Ronin". Title is Sovereign / Extracted on win, boss name on loss follows the stage you died in. -->
        </div>
        <div class="card stat" style="max-width:640px;margin:18px auto 0;cursor:default;text-align:left;">
          <div class="k">Your build</div>
          <div class="d">${build || 'nothing'}</div>
          <div class="k" style="margin-top:12px">Passives</div>
          <div class="d">${pas}</div>
        </div>
        <div class="btn" id="againbtn">Run again</div>
        <div class="hint">${win ? 'Try a different build: Fire alone, or Fire + Wind for Firestorm.' : 'Tip: dash through gaps, not into them. Aerated + Fire is your damage spike.'}</div>
      </div>`);
    $('againbtn').onclick = () => { this.hideOverlay(); onRestart(); };
  }

  banner_(text, seconds = 2.4) {
    this.banner.textContent = text;
    this.banner.style.opacity = '1';
    this.bannerT = seconds;
  }

  update(world, dt) {
    const p = world.player;
    const hpPct = Math.max(0, p.hp / p.maxHp) * 100;
    this.hpfill.style.width = hpPct + '%';
    this.hptext.textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    const ch = p.chakra;
    this.chakrafill.style.width = ch + '%';
    this.chakrafill.classList.toggle('full', ch >= 100);
    this.chakratext.textContent = ch >= 100 ? 'OVERCHARGE READY' : `${Math.floor(ch)} / 100`;
    this.xpfill.style.width = Math.min(100, (p.xp / p.xpNeed) * 100) + '%';
    this.xptext.textContent = `Lv ${p.level} · ${Math.floor(p.xp)}/${p.xpNeed}`;
    const t = Math.min(world.t, 1200);
    const mm = Math.floor(t / 60), ss = Math.floor(t % 60).toString().padStart(2, '0');
    this.timer.textContent = `${mm}:${ss}`;

    const bosses = world.bosses.filter((b) => b.alive);
    if (bosses.length) {
      this.bossbar.classList.remove('hidden');
      let hp = 0, max = 0;
      for (const b of bosses) { hp += Math.max(0, b.hp); max += b.maxHp; }
      this.bossfill.style.width = Math.max(0, (hp / max) * 100) + '%';
      const label = bosses.length > 1 ? bosses.map((b) => b.name.split('· ')[1] || b.name).join(' + ') : bosses[0].name;
      this.bossbar.querySelector('.bname').textContent = label;
    } else {
      this.bossbar.classList.add('hidden');
    }
    if (this.bannerT > 0) {
      this.bannerT -= dt;
      if (this.bannerT <= 0) this.banner.style.opacity = '0';
    }
    this.updateBar(world);
  }

  updateBar(world) {
    // 4 active slots + the ultimate
    const list = world.abilities;
    if (!this.bar.children.length) {
      for (let i = 0; i < 5; i++) {
        const d = document.createElement('div');
        d.className = 'ab';
        d.innerHTML = `<span class="nm"></span><span class="rk"></span><div class="cd"></div><div class="bar"></div>`;
        this.bar.appendChild(d);
      }
    }
    for (let i = 0; i < 5; i++) {
      const el = this.bar.children[i];
      if (i === 4) {
        const ready = world.player.chakra >= 100;
        el.classList.toggle('on', ready);
        el.querySelector('.nm').textContent = 'ULT';
        el.querySelector('.rk').textContent = '';
        el.querySelector('.cd').style.height = '0%';
        el.querySelector('.bar').style.background = ready ? '#b9a6ff' : '#4b3a7a';
        continue;
      }
      const ab = list[i];
      if (!ab) {
        el.classList.remove('on');
        el.querySelector('.nm').textContent = '';
        el.querySelector('.rk').textContent = '';
        el.querySelector('.cd').style.height = '100%';
        el.querySelector('.bar').style.background = 'transparent';
        continue;
      }
      const def = ABILITIES[ab.id];
      el.classList.add('on');
      el.querySelector('.nm').textContent = def.name.split(' ').slice(0, 2).join(' ');
      el.querySelector('.rk').textContent = 'R' + ab.rank;
      const cdPct = Math.max(0, Math.min(1, ab.cd / ab.cdMax));
      el.querySelector('.cd').style.height = (cdPct * 100) + '%';
      const col = ELEMENTS[def.element] ? ELEMENTS[def.element].color : '#8a8f9c';
      el.querySelector('.bar').style.background = col;
    }
  }
}
