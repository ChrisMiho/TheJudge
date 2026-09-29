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
    { name: 'Birds of Paradise',    id: '3ffe931c-9f19-4ea5-bc24-041eb00a5862', colors: ['G'], type: 'Creature — Bird',      cost: '{G}',    mv: 1, colorsLabel: 'Green', sub: 'Bird',       price: '$6.10',  oracle: 'Flying\n{T}: Add one mana of any color.', pt: '0/1' },
    // round 8: a storm card and a ritual, for the Copies demo and a ten-card review
    { name: 'Grapeshot',            id: '923e1291-3999-4f81-ade4-073fb982143f', colors: ['R'], type: 'Sorcery',              cost: '{1}{R}', mv: 2, colorsLabel: 'Red',   sub: '—',          price: '$0.45',  oracle: 'Grapeshot deals 1 damage to any target.\nStorm (When you cast this spell, copy it for each spell cast before it this turn. You may choose new targets for the copies.)' },
    { name: 'Dark Ritual',          id: '055d3a93-6c9a-4c03-a2f4-17a41fa8f0b1', colors: ['B'], type: 'Instant',              cost: '{B}',    mv: 1, colorsLabel: 'Black', sub: '—',          price: '$0.70',  oracle: 'Add {B}{B}{B}.' }
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
      '<div class="fact price"><small>Price</small><b>' + c.price + '</b></div>';
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
    const box = textarea.closest('.q-box, .followup');
    if (box) box.style.borderRadius = h > 56 ? '1.1rem' : '';
  }

  // ---- the conversation: renders a thread of {who:'you'|'judge', text}; [[Card Name]]
  // becomes a tappable name — the cards themselves live only in the Cards strip ----
  function chatMarkup(messages, cards) {
    return messages.map((m) => {
      if (m.who === 'you') return '<div class="msg you">' + m.text + '</div>';
      const body = m.text
        ? m.text.split('\n').map((p) => '<p>' + p.replace(/\[\[(.+?)\]\]/g, '<span class="ref" data-name="$1">$1</span>') + '</p>').join('')
        : '<span class="wait" role="status" aria-live="polite"><span class="wait-lines"></span><span class="wait-foot"><span class="thinking"><i></i><i></i><i></i></span><span class="wait-time">0:00</span></span></span>';
      return '<div class="msg judge' + (m.text ? '' : ' waiting') + '"><span class="seal" aria-hidden="true"></span><div><span class="who">TheJudge</span>' + body + '</div></div>';
    }).join('');
  }
  // ---- the wait (round 8: "the funny text that prints while we wait … some
  // sort of bubble with an animation that prints those messages"): today's
  // WAIT_STAGES (askAiWaitStages.ts, verbatim) play inside the judge's own
  // bubble — each line types itself out behind a quill caret, the one before it
  // lifts and fades, and the elapsed clock ticks at the foot. The bubble's edge
  // breathes in the colour's light while it waits. Round 9 ("too fast, the text
  // changes before it's even fully readable"): the clock runs at real speed —
  // the thresholds are the seconds a player actually waits — and each letter
  // inks itself in with a glow (flow.css .ch). `speed` is 1 unless a demo says
  // otherwise.
  const WAIT_STAGES = [
    { threshold: 0, message: 'Consulting the stack…', variant: 'calm' },
    { threshold: 3, message: 'Priority is passing to the LLM.', variant: 'calm' },
    { threshold: 8, message: 'The judge is reading every layer. Twice.', variant: 'curious' },
    { threshold: 15, message: 'Still waiting? The servers are scrying 1.', variant: 'curious' },
    { threshold: 25, message: 'At this point we’re basically in a MUD subgame.', variant: 'absurd' },
    { threshold: 40, message: 'If this were F6, we’d have resolved by now.', variant: 'absurd' }
  ];
  function runWait(root, { speed = 1, until = Infinity, onDone } = {}) {
    const box = root.querySelector('.wait');
    if (!box) return () => {};
    const lines = box.querySelector('.wait-lines'), clock = box.querySelector('.wait-time');
    const t0 = performance.now();
    let shown = -1, typer = 0, done = false;
    function type(el, text) {
      clearInterval(typer);
      let i = 0;
      el.textContent = '';
      typer = setInterval(() => {
        const ch = document.createElement('span'); ch.className = 'ch'; ch.textContent = text[i]; el.append(ch);
        i += 1;
        if (i >= text.length) { clearInterval(typer); el.classList.add('typed'); }
      }, 46);
    }
    const tick = setInterval(() => {
      const sec = (performance.now() - t0) / 1000 * speed;
      clock.textContent = Math.floor(sec / 60) + ':' + String(Math.floor(sec) % 60).padStart(2, '0');
      let idx = 0; WAIT_STAGES.forEach((st, i) => { if (st.threshold <= sec) idx = i; });
      if (idx !== shown) {
        shown = idx;
        const old = lines.querySelector('.wait-line:not(.out)');
        if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 700); }
        const el = document.createElement('span');
        el.className = 'wait-line'; el.dataset.v = WAIT_STAGES[idx].variant;
        lines.append(el); type(el, WAIT_STAGES[idx].message);
      }
      if (!done && sec >= until) { done = true; stop(); onDone && onDone(); }
    }, 100);
    function stop() { clearInterval(tick); clearInterval(typer); }
    return stop;
  }

  // ---- round 9: the microphone inside the send control. A tap starts
  // listening (the mic half glows, the box says so); what is said types into
  // the box. The build uses the browser's SpeechRecognition, which hands off to
  // the phone's own dictation engine — nothing of ours runs. The mockup plays a
  // demo sentence after a moment instead of listening.
  const MIC_SVG = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="7" y="2" width="6" height="10" rx="3" fill="currentColor"/><path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v3M7 18h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  function mountMics() {
    document.querySelectorAll('.send-pair .mic').forEach((mic) => {
      if (mic.dataset.bound) return; mic.dataset.bound = 'true';
      mic.innerHTML = MIC_SVG;
      const box = mic.closest('.q-box, .followup'), ta = box && box.querySelector('textarea');
      if (!ta) return;
      const was = ta.placeholder;
      let timer = 0, typing = 0;
      const stop = () => { clearTimeout(timer); clearInterval(typing); mic.setAttribute('aria-pressed', 'false'); ta.placeholder = was; };
      mic.addEventListener('click', () => {
        if (mic.getAttribute('aria-pressed') === 'true') return stop();
        mic.setAttribute('aria-pressed', 'true'); ta.placeholder = 'Listening… say your question'; ta.value = '';
        ta.dispatchEvent(new Event('input'));
        const said = mic.dataset.demo || 'Can I respond to Lightning Bolt with Counterspell after it targets my Elves?';
        timer = setTimeout(() => {
          let i = 0;
          typing = setInterval(() => { i += 1; ta.value = said.slice(0, i); ta.dispatchEvent(new Event('input')); if (i >= said.length) stop(); }, 28);
        }, 1400);
      });
    });
  }
  document.addEventListener('DOMContentLoaded', mountMics);

  function bindRefs(root) {
    root.querySelectorAll('.ref, .thumb.tap').forEach((el) => el.addEventListener('click', () => { const c = byName(el.dataset.name); if (c) openDetail(c); }));
  }

  // ---- the shared menu tray (round 3: from the left, plain rows, theme orbs at
  // the foot; round 4: the orbs carry no names or blurbs — the colour is the label;
  // round 6: one "Ask a Question" destination, a card silhouette for its glyph,
  // Send feedback right under the list, the theme row as flat motif icons, and
  // Colorless with its custom colour back; round 7: the icons sit in filled
  // circles like mana symbols, and the foot plays the colour's element) ----
  const CARD_GLYPH = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="2" width="12" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="6.5" y="4.5" width="7" height="5" rx="1" fill="currentColor" opacity="0.85"/><path d="M6.5 12.5 h7 M6.5 15 h4.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
  const PROFILES = [
    ['white', 'White', '#ede7d6', '#faf8f2'],
    ['blue', 'Blue', '#0050d8', '#38e1ff'],
    ['black', 'Black', '#7c3aed', '#c77dff'],
    ['red', 'Red', '#c10230', '#ff4d6d'],
    ['green', 'Green', '#0a7a42', '#4affa0'],
    ['colorless', 'Colorless', '#52525b', '#e4e4e7']
  ];
  function mountMenu(current) {
    if (document.getElementById('menu-tray')) return;
    const backdrop = document.createElement('div'); backdrop.className = 'menu-tray-backdrop'; backdrop.id = 'tray-backdrop';
    const nav = document.createElement('nav'); nav.className = 'menu-tray'; nav.id = 'menu-tray'; nav.setAttribute('aria-label', 'Feature destinations');
    // Question History sits right under the question flows (round 5) — when the
    // two flows become one "Question", it sits under that
    // Quick Question and In-Depth Question are one "Ask a Question" now: the question
    // page opens, and "Add in-depth details" is the way into the deeper flow
    const dest = [['Ask a Question', CARD_GLYPH, 'quick-question.html'], ['Question History', '◷', null], ['Life Tracker', '♥', 'life-tracker-after.html'], ['Trade Balancer', '⚖', 'trade-balancer.html']];
    nav.innerHTML =
      '<div class="tray-brand"><span class="brand-mark"><span class="orb"></span><span class="brand-text"><span class="wordmark">TheJudge</span><span class="tagline">MTG Assistant</span></span></span>' +
      '<button class="icon-btn" id="tray-close" aria-label="Close menu">✕</button></div>' +
      '<ul class="tray-nav-list">' + dest.map(([n, g, href]) => '<li><button type="button"' + (href ? ' data-href="' + href + '"' : ' id="tray-history"') + (n === current ? ' aria-current="page"' : '') + '><span class="glyph">' + g + '</span><span>' + n + '</span>' + (n === current ? '<span class="here">✓</span>' : '') + '</button></li>').join('') +
      '<li><div class="tray-divider"></div></li>' +
      '<li><button type="button" id="tray-feedback"><span class="glyph">✎</span><span>Send feedback</span></button></li></ul>' +
      '<h3>Theme</h3><div class="theme-orbs" role="group" aria-label="Theme palettes" id="theme-orbs">' +
      PROFILES.map(([id, name, orb, soft]) => '<button class="theme-orb" data-profile-btn="' + id + '" aria-label="Theme: ' + name + '" title="' + name + '" style="--orb:' + orb + ';--orb-soft:' + soft + '"><span class="orb">' + (window.MOTIFS ? window.MOTIFS.use(window.MOTIFS.chosen(id)) : '') + '</span></button>').join('') +
      '</div><div class="theme-custom" id="theme-custom" data-show="false"><input type="color" id="colorless-hex" aria-label="Customize Colorless color" value="#71717a"><span>Colorless colour</span><button class="btn" id="colorless-reset" type="button">Reset to gray</button></div>' +
      '<div class="tray-flair" aria-hidden="true"></div>';
    document.body.append(backdrop, nav);
    // round 7: the colour's element plays at a whisper in the tray's foot
    if (window.AMBIENCE) window.AMBIENCE.mountFlair(nav.querySelector('.tray-flair'));
    const setTray = (open) => { document.body.dataset.trayOpen = open ? 'true' : 'false'; };
    document.querySelectorAll('.menu-toggle').forEach((b) => b.addEventListener('click', () => setTray(document.body.dataset.trayOpen !== 'true')));
    document.getElementById('tray-close').addEventListener('click', () => setTray(false));
    backdrop.addEventListener('click', () => setTray(false));
    nav.querySelectorAll('[data-href]').forEach((b) => b.addEventListener('click', () => { if (!b.hasAttribute('aria-current')) location.href = b.dataset.href; else setTray(false); }));
    nav.querySelectorAll('[data-profile-btn]').forEach((b) => b.addEventListener('click', () => setProfile(b.dataset.profileBtn)));
    document.getElementById('colorless-hex').addEventListener('input', (e) => setCustomColorless(e.target.value));
    document.getElementById('colorless-reset').addEventListener('click', () => { setCustomColorless(null); document.getElementById('colorless-hex').value = '#71717a'; });
    // ?profile=green on any page previews that colour (round 7 convenience for review)
    const want = new URLSearchParams(location.search).get('profile');
    setProfile(want && PROFILES.some((p) => p[0] === want) ? want : (document.documentElement.dataset.profile || 'blue'));

    // Send feedback (modal) and History (side panel / sheet) live under the destinations, above Theme
    const fb = document.createElement('div'); fb.className = 'overlay-backdrop'; fb.id = 'feedback-modal'; fb.dataset.open = 'false';
    fb.innerHTML = '<div class="overlay-panel ornate small"><button class="icon-btn overlay-close" data-close="feedback-modal" aria-label="Close">✕</button>' +
      '<h2 style="margin:0.2rem 0 0.3rem">Send feedback</h2><p class="text-muted" style="margin:0 0 0.7rem;font-size:0.85rem">Tell us what\'s broken or what you\'d like to see.</p>' +
      '<textarea class="field" rows="4" placeholder="What\'s on your mind?"></textarea><div style="margin-top:0.75rem;display:flex;justify-content:flex-end"><button class="btn primary">Send</button></div></div>';
    const hb = document.createElement('div'); hb.className = 'sheet-backdrop'; hb.id = 'history-backdrop'; hb.dataset.open = 'false';
    const hd = document.createElement('aside'); hd.className = 'drawer-panel detail-panel'; hd.id = 'history-drawer'; hd.dataset.open = 'false'; hd.setAttribute('aria-label', 'Conversation history');
    hd.innerHTML = '<button class="icon-btn overlay-close" data-close="history-drawer" aria-label="Close">✕</button><div class="body" style="padding-top:2.8rem"><h2 style="margin:0">Question History</h2>' +
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
  let colorlessHex = null;
  function setProfile(id) {
    document.documentElement.setAttribute('data-profile', id);
    document.querySelectorAll('[data-profile-btn]').forEach((b) => b.setAttribute('data-current', b.dataset.profileBtn === id));
    const custom = document.getElementById('theme-custom');
    if (custom) custom.dataset.show = id === 'colorless';
    applyCustom();
  }
  // Colorless custom colour (as today's app). Round 8 ("setting certain colors
  // removes the ability to read certain text, and other colors even made the
  // background images disappear"): the picked hex is no longer poured into all
  // three accent tokens as-is. Each token is derived from it with a floor —
  //   accent-soft  (accent text, the dust, the shapes, the badge light)
  //                lifted toward white until it reads on the page ground (7:1)
  //   accent       (fills, glows, edges) lifted until it stands off the ground
  //                (2.4:1), so a near-black pick still shows
  //   text-on-accent  white or near-black, whichever reads on that fill
  //   accent-strong   the fill a step darker (the button's lower half)
  // The hue always survives; only lightness moves. null restores the grey.
  const hexRGB = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgbHex = (c) => '#' + c.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const GROUND = [9, 9, 11];
  function liftTo(c, floor) {
    // mix toward white in small steps until the colour clears the floor on the ground
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const m = c.map((v) => v + (255 - v) * t);
      if (contrast(m, GROUND) >= floor) return m;
    }
    return [255, 255, 255];
  }
  function deriveColorless(hex) {
    const c = hexRGB(hex);
    const soft = liftTo(c, 7), accent = liftTo(c, 2.4);
    const onAccent = contrast(accent, [255, 255, 255]) >= contrast(accent, GROUND) ? '#ffffff' : '#09090b';
    const strong = accent.map((v) => v * 0.62);
    return { soft: rgbHex(soft), accent: rgbHex(accent), strong: rgbHex(strong), onAccent };
  }
  function setCustomColorless(hex) { colorlessHex = hex; applyCustom(); }
  function applyCustom() {
    const root = document.documentElement;
    const on = root.dataset.profile === 'colorless' && colorlessHex;
    const d = on ? deriveColorless(colorlessHex) : null;
    const set = (v, x) => (on ? root.style.setProperty(v, x) : root.style.removeProperty(v));
    set('--accent', d && d.accent); set('--accent-strong', d && d.strong); set('--accent-soft', d && d.soft);
    set('--accent-contrast', d && d.onAccent);
    set('--wash-tint', d && 'color-mix(in srgb, ' + d.accent + ' 16%, #0c0c0d)');
    if (on) root.setAttribute('data-accent', colorlessHex); else root.removeAttribute('data-accent');
  }

  document.addEventListener('DOMContentLoaded', ensureDetailPanel);
  return { img, art, library, byName, cardMarkup, openDetail, closeDetail, bindComposer, autoGrow, ring, applyRing, ringAttr, thumb, pips, chatMarkup, runWait, WAIT_STAGES, bindRefs, mountMics, mountMenu, setProfile, setCustomColorless, PROFILES };
})();
