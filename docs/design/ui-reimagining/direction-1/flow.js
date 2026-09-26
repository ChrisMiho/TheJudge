/*
 * flow.js — demo helpers the question-flow pages share (Quick Question,
 * In-Depth Question, Trade Balancer): the demo card library with real corpus
 * fields, the Scryfall image URLs, the card-detail panel (round 3 layout),
 * the question-box budget + auto-grow, the chat renderer, and the shared
 * menu tray. Mockup plumbing only; nothing here is app code.
 */
window.FLOW = (() => {
  const img = (id) => 'https://cards.scryfall.io/normal/front/' + id[0] + '/' + id[1] + '/' + id + '.jpg';
  const art = (id) => 'https://cards.scryfall.io/art_crop/front/' + id[0] + '/' + id[1] + '/' + id + '.jpg';

  // real corpus fields (cardMetadata.json imageId + cardDetailByOracleId) for the demo cards
  const library = [
    { name: 'Lightning Bolt',       id: '132dc07f-74e2-4bd7-bdb1-4f5d5253c7f2', colors: ['R'], type: 'Instant',              cost: '{R}',    mv: 1, colorsLabel: 'Red',   sub: '—',          price: '$3.20',  oracle: 'Lightning Bolt deals 3 damage to any target.' },
    { name: 'Sol Ring',             id: '0ab38fe7-1929-44f6-b4ce-ce8cfacbfb76', colors: [], type: 'Artifact',             cost: '{1}',    mv: 1, colorsLabel: 'Colorless', sub: '—',      price: '$1.85',  oracle: '{T}: Add {C}{C}.' },
    { name: 'Llanowar Elves',       id: '2526a07a-0b92-4e31-81fe-14fb067b5821', colors: ['G'], type: 'Creature — Elf Druid', cost: '{G}',    mv: 1, colorsLabel: 'Green', sub: 'Elf, Druid', price: '$0.75',  oracle: '{T}: Add {G}.', pt: '1/1' },
    { name: 'Swords to Plowshares', id: '68ec2aed-7662-48ae-ab25-04f74ece1e41', colors: ['W'], type: 'Instant',              cost: '{W}',    mv: 1, colorsLabel: 'White', sub: '—',          price: '$0.60',  oracle: 'Exile target creature. Its controller gains life equal to its power.' },
    { name: 'Counterspell',         id: '4f616706-ec97-4923-bb1e-11a69fbaa1f8', colors: ['U'], type: 'Instant',              cost: '{U}{U}', mv: 2, colorsLabel: 'Blue',  sub: '—',          price: '$1.10',  oracle: 'Counter target spell.' },
    { name: 'Rhystic Study',        id: '9f37c5b6-a59c-45cd-9a99-e9357fe9ea1b', colors: ['U'], type: 'Enchantment',          cost: '{2}{U}', mv: 3, colorsLabel: 'Blue',  sub: '—',          price: '$32.00', oracle: 'Whenever an opponent casts a spell, you may draw a card unless that player pays {1}.' },
    { name: 'Path to Exile',        id: '177bd28f-8c83-4a91-a025-33312539d222', colors: ['W'], type: 'Instant',              cost: '{W}',    mv: 1, colorsLabel: 'White', sub: '—',          price: '$2.40',  oracle: 'Exile target creature. Its controller may search their library for a basic land card, put that card onto the battlefield tapped, then shuffle.' },
    { name: 'Lightning Helix',      id: '4101e3fe-b0e7-4f0f-b9ac-9b61a4d628b3', colors: ['W', 'R'], type: 'Instant',           cost: '{R}{W}', mv: 2, colorsLabel: 'White, Red', sub: '—', price: '$0.90', oracle: 'Lightning Helix deals 3 damage to any target and you gain 3 life.' },
    { name: 'Birds of Paradise',    id: '3ffe931c-9f19-4ea5-bc24-041eb00a5862', colors: ['G'], type: 'Creature — Bird',      cost: '{G}',    mv: 1, colorsLabel: 'Green', sub: 'Bird',       price: '$6.10',  oracle: 'Flying\n{T}: Add one mana of any color.', pt: '0/1' }
  ];
  const byName = (n) => library.find((c) => c.name === n);

  // card identity ring — same colours and rules as the app's cardIdentityRing.ts
  const RING = { W: 'rgb(248 231 185 / 0.55)', U: 'rgb(14 165 233 / 0.55)', B: 'rgb(113 113 122 / 0.55)', R: 'rgb(239 68 68 / 0.55)', G: 'rgb(34 197 94 / 0.55)' };
  const PIP = { W: '#f8e7b9', U: '#0ea5e9', B: '#71717a', R: '#ef4444', G: '#22c55e' };
  function ring(colors) {
    const c = ['W', 'U', 'B', 'R', 'G'].filter((x) => (colors || []).includes(x));
    if (!c.length) return 'rgb(148 163 184 / 0.55)';
    if (c.length === 1) return RING[c[0]];
    return 'linear-gradient(90deg, ' + c.map((x) => RING[x]).join(', ') + ')';
  }
  function applyRing(el, card) { el.classList.add('card-identity-ring'); el.style.setProperty('--card-identity-ring', ring(card.colors)); }
  const ringAttr = (card) => 'class="card-identity-ring" style="--card-identity-ring:' + ring(card.colors) + '"';
  // a small ringed thumbnail
  const thumb = (card, extra = '') => '<span class="thumb card-identity-ring' + (extra ? ' ' + extra : '') + '" data-name="' + card.name + '" style="--card-identity-ring:' + ring(card.colors) + '"><img src="' + img(card.id) + '" alt="' + card.name + '"></span>';
  const pips = (card) => (card.colors && card.colors.length ? '<span class="pips">' + card.colors.map((c) => '<i style="background:' + PIP[c] + '"></i>').join('') + '</span>' : '');

  // inner markup of a .card: the art (or the name-only fallback) plus the two corner widgets
  function cardMarkup(c, opts = {}) {
    return (opts.broken
      ? '<div class="fallback"><div><strong>' + c.name + '</strong><span>Image unavailable</span></div></div>'
      : '<img src="' + img(c.id) + '" alt="' + c.name + '" loading="eager">') +
      (opts.noRemove ? '' : '<button class="card-widget remove" aria-label="Remove ' + c.name + '">✕</button>') +
      '<button class="card-widget info" aria-label="Show details for ' + c.name + '">ⓘ</button>';
  }

  // ---- card detail panel (bottom sheet on phone, side panel on desktop) ----
  function ensureDetailPanel() {
    if (document.getElementById('detail-panel')) return;
    const backdrop = document.createElement('div');
    backdrop.className = 'sheet-backdrop'; backdrop.id = 'detail-backdrop'; backdrop.dataset.open = 'false';
    const panel = document.createElement('aside');
    panel.className = 'drawer-panel detail-panel'; panel.id = 'detail-panel';
    panel.dataset.open = 'false'; panel.setAttribute('aria-label', 'Card details');
    panel.innerHTML =
      '<button class="icon-btn overlay-close" id="detail-close" aria-label="Close">✕</button>' +
      '<div class="art"><img id="detail-art" alt=""><div class="title"><h2 id="detail-name"></h2><span class="cost" id="detail-cost"></span></div></div>' +
      '<div class="body">' +
        '<div class="typeline" id="detail-typeline"></div>' +
        '<p class="oracle" id="detail-oracle"></p>' +
        '<div class="facts" id="detail-facts"></div>' +
      '</div>';
    document.body.append(backdrop, panel);
    document.getElementById('detail-close').addEventListener('click', closeDetail);
    backdrop.addEventListener('click', closeDetail);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });
  }
  function openDetail(c) {
    ensureDetailPanel();
    const $ = (s) => document.getElementById(s);
    $('detail-name').textContent = c.name;
    $('detail-cost').textContent = c.cost;
    $('detail-art').src = art(c.id);
    $('detail-typeline').innerHTML = '<b>' + c.type + '</b>' + (c.pt ? '<span>·</span><b>' + c.pt + '</b>' : '') + '<span>·</span>' + pips(c) + '<span>' + c.colorsLabel + '</span>';
    $('detail-oracle').textContent = c.oracle;
    $('detail-facts').innerHTML =
      '<div class="fact"><small>Mana value</small><b>' + c.mv + '</b></div>' +
      '<div class="fact"><small>Subtypes</small><b>' + c.sub + '</b></div>' +
      '<div class="fact price"><small>Price · nonfoil</small><b>' + c.price + '</b></div>';
    $('detail-backdrop').dataset.open = 'true';
    $('detail-panel').dataset.open = 'true';
    $('detail-panel').scrollTop = 0;
    $('detail-close').focus();
  }
  function closeDetail() {
    const p = document.getElementById('detail-panel');
    if (!p) return;
    document.getElementById('detail-backdrop').dataset.open = 'false';
    p.dataset.open = 'false';
  }

  // ---- question box: slim until text arrives, grows to a cap, then scrolls;
  // the 300-character budget is shown inside the frame ----
  function bindComposer(textarea, countEl, meterEl, max = 300) {
    const update = () => {
      const n = textarea.value.length;
      if (countEl) { countEl.textContent = n + ' / ' + max; countEl.dataset.near = n >= max - 30 ? 'true' : 'false'; }
      if (meterEl) meterEl.style.width = (n / max * 100) + '%';
      autoGrow(textarea);
    };
    textarea.addEventListener('input', update);
    update();
  }
  function autoGrow(textarea) {
    const cap = parseFloat(getComputedStyle(textarea).maxHeight) || 176;
    textarea.style.height = 'auto';
    const h = Math.min(textarea.scrollHeight, cap);
    textarea.style.height = h + 'px';
    textarea.classList.toggle('grown', h > 56);
  }

  // ---- the conversation: renders a thread of {who:'you'|'judge', text, refs?} ----
  function chatMarkup(messages, cards) {
    return messages.map((m) => {
      if (m.who === 'you') return '<div class="msg you">' + m.text + '</div>';
      const body = m.text
        ? m.text.split('\n').map((p) => '<p>' + p.replace(/\[\[(.+?)\]\]/g, '<span class="ref" data-name="$1">$1</span>') + '</p>').join('')
        : '<span class="thinking"><i></i><i></i><i></i></span>';
      return '<div class="msg judge"><span class="seal" aria-hidden="true"></span><div><span class="who">TheJudge</span>' + body +
        (m.refs && m.refs.length ? '<div class="refs">' + m.refs.map((c) => thumb(c, 'tap')).join('') + '</div>' : '') + '</div></div>';
    }).join('');
  }
  function bindRefs(root) {
    root.querySelectorAll('.ref, .thumb.tap').forEach((el) => el.addEventListener('click', () => { const c = byName(el.dataset.name); if (c) openDetail(c); }));
  }

  // ---- the shared menu tray (round 3: from the left, plain rows, theme orbs at the foot) ----
  const PROFILES = [
    ['white', 'White', '#ede7d6', '#faf8f2', 'gilded filigree, dawn light'],
    ['blue', 'Blue', '#0050d8', '#38e1ff', 'a charged vortex, sparks in orbit'],
    ['black', 'Black', '#7c3aed', '#c77dff', 'thorns, ash, one hot ember'],
    ['red', 'Red', '#c10230', '#ff4d6d', 'embers rising through the dark'],
    ['green', 'Green', '#0a7a42', '#4affa0', 'vines, canopy light, pollen'],
    ['colorless', 'Colorless', '#52525b', '#e4e4e7', 'brass clockwork, settling dust']
  ];
  function mountMenu(current) {
    if (document.getElementById('menu-tray')) return;
    const backdrop = document.createElement('div'); backdrop.className = 'menu-tray-backdrop'; backdrop.id = 'tray-backdrop';
    const nav = document.createElement('nav'); nav.className = 'menu-tray'; nav.id = 'menu-tray'; nav.setAttribute('aria-label', 'Feature destinations');
    const dest = [['Quick Question', '⚡', 'quick-question.html'], ['In-Depth Question', '◈', 'in-depth-question.html'], ['Life Tracker', '♥', 'life-tracker-after.html'], ['Trade Balancer', '⚖', 'trade-balancer.html']];
    nav.innerHTML =
      '<div class="tray-brand"><span class="brand-mark"><span class="orb"></span><span><span class="wordmark">TheJudge</span><span class="tagline">MTG assistant</span></span></span>' +
      '<button class="icon-btn" id="tray-close" aria-label="Close menu">✕</button></div>' +
      '<ul class="tray-nav-list">' + dest.map(([n, g, href]) => '<li><button type="button" data-href="' + href + '"' + (n === current ? ' aria-current="page"' : '') + '><span class="glyph">' + g + '</span><span>' + n + '</span>' + (n === current ? '<span class="here">✓</span>' : '') + '</button></li>').join('') + '</ul>' +
      '<div class="tray-divider"></div>' +
      '<ul class="tray-nav-list"><li><button type="button" id="tray-feedback"><span class="glyph">✎</span><span>Send feedback</span></button></li>' +
      '<li><button type="button" id="tray-history"><span class="glyph">◷</span><span>History</span></button></li></ul>' +
      '<h3>Theme</h3><div class="theme-orbs" role="group" aria-label="Theme palettes" id="theme-orbs">' +
      PROFILES.map(([id, name, orb, soft]) => '<button class="theme-orb" data-profile-btn="' + id + '" aria-label="Theme: ' + name + '" style="--orb:' + orb + ';--orb-soft:' + soft + ';--orb-motif:url(motifs/' + id + '.svg)"><span class="orb"></span>' + name + '</button>').join('') +
      '</div><p class="theme-note" id="theme-note"></p>' +
      '<div class="tray-foot">Every screen follows the colour you pick.</div>';
    document.body.append(backdrop, nav);
    const setTray = (open) => { document.body.dataset.trayOpen = open ? 'true' : 'false'; };
    document.querySelectorAll('.menu-toggle').forEach((b) => b.addEventListener('click', () => setTray(document.body.dataset.trayOpen !== 'true')));
    document.getElementById('tray-close').addEventListener('click', () => setTray(false));
    backdrop.addEventListener('click', () => setTray(false));
    nav.querySelectorAll('[data-href]').forEach((b) => b.addEventListener('click', () => { if (!b.hasAttribute('aria-current')) location.href = b.dataset.href; else setTray(false); }));
    nav.querySelectorAll('[data-profile-btn]').forEach((b) => b.addEventListener('click', () => setProfile(b.dataset.profileBtn)));
    setProfile(document.documentElement.dataset.profile || 'blue');

    // Send feedback (modal) and History (side panel / sheet) live under the destinations, above Theme
    const fb = document.createElement('div'); fb.className = 'overlay-backdrop'; fb.id = 'feedback-modal'; fb.dataset.open = 'false';
    fb.innerHTML = '<div class="overlay-panel ornate small"><button class="icon-btn overlay-close" data-close="feedback-modal" aria-label="Close">✕</button>' +
      '<h2 style="margin:0.2rem 0 0.3rem">Send feedback</h2><p class="text-muted" style="margin:0 0 0.7rem;font-size:0.85rem">Tell us what\'s broken or what you\'d like to see.</p>' +
      '<textarea class="field" rows="4" placeholder="What\'s on your mind?"></textarea><div style="margin-top:0.75rem;display:flex;justify-content:flex-end"><button class="btn primary">Send</button></div></div>';
    const hb = document.createElement('div'); hb.className = 'sheet-backdrop'; hb.id = 'history-backdrop'; hb.dataset.open = 'false';
    const hd = document.createElement('aside'); hd.className = 'drawer-panel detail-panel'; hd.id = 'history-drawer'; hd.dataset.open = 'false'; hd.setAttribute('aria-label', 'Conversation history');
    hd.innerHTML = '<button class="icon-btn overlay-close" data-close="history-drawer" aria-label="Close">✕</button><div class="body" style="padding-top:2.8rem"><h2 style="margin:0">History</h2>' +
      '<p class="text-muted" style="margin:0;font-size:0.85rem">Past questions from this session.</p>' +
      '<div class="history-list">' + [['How does this resolve?', 'In-Depth · 6 cards · 2 min ago'], ['Does Sol Ring tap for two?', 'Quick · 1 card · 14 min ago'], ['Can I respond to a trigger?', 'Quick · no cards · yesterday']].map(([q, m]) =>
        '<button class="history-row"><span class="q">' + q + '</span><span class="m">' + m + '</span></button>').join('') + '</div></div>';
    document.body.append(fb, hb, hd);
    const closeAll = () => { fb.dataset.open = 'false'; hb.dataset.open = 'false'; hd.dataset.open = 'false'; };
    document.getElementById('tray-feedback').addEventListener('click', () => { setTray(false); fb.dataset.open = 'true'; fb.querySelector('textarea').focus(); });
    document.getElementById('tray-history').addEventListener('click', () => { setTray(false); hb.dataset.open = 'true'; hd.dataset.open = 'true'; });
    document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeAll));
    fb.addEventListener('click', (e) => { if (e.target === fb) closeAll(); });
    hb.addEventListener('click', closeAll);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAll(); setTray(false); } });
    return setTray;
  }
  function setProfile(id) {
    document.documentElement.setAttribute('data-profile', id);
    document.querySelectorAll('[data-profile-btn]').forEach((b) => b.setAttribute('data-current', b.dataset.profileBtn === id));
    const p = PROFILES.find((x) => x[0] === id);
    const note = document.getElementById('theme-note');
    if (note && p) note.innerHTML = '<b>' + p[1] + '</b> — ' + p[4] + '.';
  }

  document.addEventListener('DOMContentLoaded', ensureDetailPanel);
  return { img, art, library, byName, cardMarkup, openDetail, closeDetail, bindComposer, autoGrow, ring, applyRing, ringAttr, thumb, pips, chatMarkup, bindRefs, mountMenu, setProfile, PROFILES };
})();
