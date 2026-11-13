// The Academy: Seals spending between runs — global stats, arsenal unlocks, clan trees.
import {
  CLANS, GLOBAL_UPGRADES, CLAN_TREE, ARSENAL_COST, ULTIMATES, ULTIMATE_COST, BANISH_COST, BANISH_MAX_BOUGHT,
  costOf, clanTreeCost, clanUnlocked, buyGlobal, buyArsenal, buyClanTree, buyBanish, buyUltimate,
  selectClan, perfectShinobi,
} from '../core/meta.js';
import { ABILITIES, ELEMENTS } from '../core/abilities.js';

export function academyHTML(save) {
  const sealLine = `<div class="acad-head"><div><span class="sealcount">${save.seals}</span> <span class="sealword">Seals</span></div>
    <div class="acad-meta">Ascension ${save.ascension} · ${save.wins} wins · best ${Math.floor(save.bestTime / 60)}:${String(Math.floor(save.bestTime % 60)).padStart(2, '0')}</div></div>`;

  const global = Object.values(GLOBAL_UPGRADES).map((u) => {
    const rank = save.global[u.id] || 0;
    const maxed = rank >= u.max;
    const cost = costOf(u, rank);
    return `<div class="acad-row ${maxed ? 'maxed' : ''}" data-kind="global" data-id="${u.id}">
      <div class="ar-name">${u.name}<span class="ar-rank">${rank}/${u.max}</span></div>
      <div class="ar-desc">${u.desc}</div>
      <div class="ar-cost">${maxed ? 'maxed' : cost + ' seals'}</div>
    </div>`;
  }).join('');

  // FIX Batch 6 (Banish purchases): +1 Banish charge per run, 50 Seals each, max 2 bought (max 3 per run total).
  const banishBought = save.banish || 0;
  const banishMaxed = banishBought >= BANISH_MAX_BOUGHT;
  const banishRow = `<div class="acad-row ${banishMaxed ? 'maxed' : ''}" data-kind="banish" data-id="banish">
      <div class="ar-name">Banish Charge<span class="ar-rank">${banishBought}/${BANISH_MAX_BOUGHT}</span></div>
      <div class="ar-desc">+1 Banish charge per run (1 free + bought). Banish removes an offered card from the pool for the run.</div>
      <div class="ar-cost">${banishMaxed ? 'maxed' : BANISH_COST + ' seals'}</div>
    </div>`;
  const globalWithBanish = global + banishRow;

  // FIX Batch 7: Ultimates (200 Seals each, design §6) live in the Arsenal tab below T2/T3 rows. Cataclysm is free.
  const ultimates = ULTIMATES.map((u) => {
    const owned = !!(save.ultimates && save.ultimates[u.id]);
    return `<div class="acad-row ${owned ? 'owned' : ''}" data-kind="ultimate" data-id="${u.id}">
      <div class="ar-name">${u.name}<span class="ar-rank">Ultimate</span></div>
      <div class="ar-desc">${u.desc}</div>
      <div class="ar-cost">${owned ? 'unlocked' : ULTIMATE_COST + ' seals'}</div>
    </div>`;
  }).join('');
  const arsenal = Object.values(ABILITIES).filter((a) => a.tier >= 2).map((a) => {
    const owned = !!save.arsenal[a.id];
    const cost = ARSENAL_COST[a.tier];
    const col = ELEMENTS[a.element].color;
    return `<div class="acad-row ${owned ? 'owned' : ''}" data-kind="arsenal" data-id="${a.id}" data-tier="${a.tier}">
      <div class="ar-name"><span class="dot" style="background:${col}"></span>${a.name}<span class="ar-rank">T${a.tier}</span></div>
      <div class="ar-desc">${a.desc}</div>
      <div class="ar-cost">${owned ? 'unlocked' : cost + ' seals'}</div>
    </div>`;
  }).join('');

  const clans = Object.values(CLANS).map((c) => {
    const unlocked = clanUnlocked(save, c.id);
    const selected = save.clan === c.id;
    const rank = save.clanTree[c.id] || 0;
    const maxed = rank >= CLAN_TREE.ranks;
    const cost = clanTreeCost(save, c.id);
    const legacy = save.legacy[c.id];
    // FIX Batch 2 (clan click was confusing): one row did two jobs. Now the label says which job a click does.
    const clanAction = !unlocked ? 'Locked' : selected ? 'Click to train' : 'Click to select';
    const clanCost = !unlocked ? 'locked' : maxed ? (legacy ? 'legacy earned' : 'tree maxed') : selected ? `Train: tree ${rank}/${CLAN_TREE.ranks} · ${cost} seals` : `Select first — then train: tree ${rank}/${CLAN_TREE.ranks} · ${cost} seals`;
    return `<div class="acad-row clan ${unlocked ? '' : 'locked'} ${selected ? 'selected' : ''}"
        data-kind="clan" data-id="${c.id}">
      <div class="ar-name">${c.name}<span class="ar-rank">${unlocked ? clanAction : c.unlockMinutes + ' min'}</span></div>
      <div class="ar-desc">${c.short} · ${c.trait}</div>
      <div class="ar-cost">${clanCost}</div>
    </div>`;
  }).join('');

  return `<div class="panel acad">
    ${sealLine}
    <div class="acad-tabs">
      <div class="tab active" data-tab="global">Training</div>
      <div class="tab" data-tab="arsenal">Arsenal</div>
      <div class="tab" data-tab="clans">Clans</div>
    </div>
    <div class="acad-body" data-panel="global">${globalWithBanish}</div>
    <div class="acad-body hidden" data-panel="arsenal">${arsenal}${ultimates}</div>
    <div class="acad-body hidden" data-panel="clans">${clans}</div>
    <div class="acad-foot">
      <div id="acadmsg" style="min-height:18px;font-size:12.5px;color:#ffb0b0;text-align:center;"></div>
      ${perfectShinobi(save) ? '<span class="perfect">Perfect Shinobi · +10% damage on every run</span>' : ''}
      <div class="btn" id="acadclose">Back</div>
    </div>
  </div>`;
}

export function bindAcademy(root, save, onBuy, onClose) {
  root.querySelectorAll('.tab').forEach((t) => {
    t.onclick = () => {
      root.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
      root.querySelectorAll('.acad-body').forEach((b) => {
        b.classList.toggle('hidden', b.dataset.panel !== t.dataset.tab);
      });
    };
  });
  root.querySelectorAll('.acad-row').forEach((row) => {
    row.onclick = () => {
      const kind = row.dataset.kind;
      const id = row.dataset.id;
      let res;
      if (kind === 'global') res = buyGlobal(save, id);
      else if (kind === 'banish') res = buyBanish(save);
      else if (kind === 'arsenal') res = buyArsenal(save, id, parseInt(row.dataset.tier, 10));
      else if (kind === 'ultimate') res = buyUltimate(save, id);
      else if (kind === 'clan') {
        if (clanUnlocked(save, id)) {
          if (save.clan !== id) { res = selectClan(save, id); }
          else res = buyClanTree(save, id);
        } else res = { ok: false, reason: 'locked' };
      }
      // FIX Batch 2 (Academy silent failures): a failed buy now says WHY instead of doing nothing.
      const msg = root.querySelector('#acadmsg');
      if (res && res.ok) { if (msg) msg.textContent = 'Purchased!'; onBuy(); }
      else if (msg && res) {
        if (res.reason === 'seals') msg.textContent = `Not enough Seals — need ${res.cost} seals.`;
        else if (res.reason === 'maxed') msg.textContent = 'Already maxed.';
        else if (res.reason === 'locked') msg.textContent = 'Locked — survive longer to unlock.';
        else if (res.reason === 'owned') msg.textContent = 'Already unlocked.';
        else msg.textContent = 'Cannot buy that right now.';
      }
    };
  });
  const close = root.querySelector('#acadclose');
  if (close) close.onclick = onClose;
}
