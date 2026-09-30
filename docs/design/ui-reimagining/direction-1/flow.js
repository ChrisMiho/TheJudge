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
  // round 11: the budget is drawn as a ring round the send pill (flow.css
  // .send-ring) — the box carries --fill (0–100) and data-near; `meterEl` is
  // accepted for older callers and ignored
  function bindComposer(textarea, countEl, meterEl, max = 300) {
    const box = textarea.closest('.q-box, .followup');
    const update = () => {
      const n = textarea.value.length;
      const near = n >= max - 30;
      if (countEl) { countEl.textContent = n + ' / ' + max; countEl.dataset.near = near ? 'true' : 'false'; }
      if (box) { box.style.setProperty('--fill', (n / max * 100).toFixed(1)); box.dataset.near = near ? 'true' : 'false'; box.dataset.fill = n === 0 ? '0' : 'some'; }
      autoGrow(textarea);
    };
    textarea.addEventListener('input', update);
    update();
    fitPlaceholder(textarea);
  }
  // round 11 ("when the width shrinks so much that the text no longer fits …
  // can we do something similar with the default text in the box too?"): the
  // box's hint comes in tiers — data-placeholders="What would you like to
  // know?|Ask your question…|Ask…" — and the longest one that fits the box on
  // one line is the one shown, re-measured whenever the box changes width.
  const measureCtx = document.createElement('canvas').getContext('2d');
  function fitPlaceholder(textarea) {
    const tiers = (textarea.dataset.placeholders || textarea.placeholder || '').split('|').map((s) => s.trim()).filter(Boolean);
    textarea.dataset.placeholders = tiers.join('|');
    if (tiers.length < 2) return;
    const fit = () => {
      if (textarea.dataset.listening === 'true') return;
      const cs = getComputedStyle(textarea);
      measureCtx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const room = textarea.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2;
      const pick = tiers.find((t) => measureCtx.measureText(t).width <= room) || tiers[tiers.length - 1];
      if (textarea.placeholder !== pick) textarea.placeholder = pick;
    };
    textarea._fitPlaceholder = fit;
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(textarea); else addEventListener('resize', fit);
    // the web font may land after the first measure
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    fit();
  }
  // the send control: a mic half and an arrow half in one pill, with the budget ring round it (round 11)
  const SEND_RING = '<svg class="send-ring" viewBox="0 0 88 48" aria-hidden="true"><rect class="track" x="4" y="4" width="80" height="40" rx="20" pathLength="100"/><rect class="fill" x="4" y="4" width="80" height="40" rx="20" pathLength="100"/></svg>';
  function sendMarkup(opts = {}) {
    return '<span class="send-wrap">' + SEND_RING + '<span class="send-pair"><button class="mic" type="button" aria-pressed="false" aria-label="' + (opts.micLabel || 'Speak your question') + '" title="' + (opts.micLabel || 'Speak your question') + '"' + (opts.demo ? ' data-demo="' + opts.demo + '"' : '') + '></button>' +
      '<button class="send"' + (opts.id ? ' id="' + opts.id + '"' : '') + ' aria-label="' + (opts.label || 'Send') + '" title="' + (opts.label || 'Send') + '">➤</button></span></span>';
  }
  function autoGrow(textarea) {
    const cap = parseFloat(getComputedStyle(textarea).maxHeight) || 176;
    const box = textarea.closest('.q-box, .followup');
    // measured twice (round 11): crossing the one-line threshold moves the text
    // onto a full-width row of its own, which changes how much height it needs
    // the one-line row decides the shape; the full-width row then decides the height
    textarea.classList.remove('grown');
    textarea.style.height = 'auto';
    const grown = textarea.scrollHeight > 56;
    textarea.classList.toggle('grown', grown);
    if (grown) textarea.style.height = 'auto';
    const h = Math.min(textarea.scrollHeight, cap);
    textarea.style.height = h + 'px';
    if (box) box.style.borderRadius = grown ? '1.1rem' : '';
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
      let timer = 0, typing = 0;
      const stop = () => { clearTimeout(timer); clearInterval(typing); mic.setAttribute('aria-pressed', 'false'); ta.dataset.listening = 'false'; if (ta._fitPlaceholder) ta._fitPlaceholder(); else ta.placeholder = ta.dataset.placeholders ? ta.dataset.placeholders.split('|')[0] : ta.placeholder; };
      mic.addEventListener('click', () => {
        if (mic.getAttribute('aria-pressed') === 'true') return stop();
        mic.setAttribute('aria-pressed', 'true'); ta.dataset.listening = 'true'; ta.placeholder = 'Listening…'; ta.value = '';
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
    // ?profile=green on any page previews that colour (round 7 convenience for review).
    // Round 10 ("when I move to the in-depth portion, the color profile always
    // swaps to blue"): the mockup forgot the colour between pages — each page
    // started from its own default. The shipped app keeps the player's colour as
    // a saved setting (REQ-099), so the mockup now does the same: the last
    // colour picked (and a custom Colorless) is remembered in this browser and
    // carried into every page. ?profile= still wins for a one-off preview.
    const want = new URLSearchParams(location.search).get('profile');
    const kept = remember('profile');
    const keptHex = remember('colorless');
    if (keptHex && /^#[0-9a-f]{6}$/i.test(keptHex)) { colorlessHex = keptHex; const well = document.getElementById('colorless-hex'); if (well) well.value = keptHex; }
    setProfile(want && PROFILES.some((p) => p[0] === want) ? want : (kept && PROFILES.some((p) => p[0] === kept) ? kept : (document.documentElement.dataset.profile || 'blue')));

    // Send feedback (modal) and History (side panel / sheet) live under the destinations, above Theme
    // round 11 ("we've never gone over the submit feedback form, let's do that
    // next"): the same sheet the rest of the app uses — a bottom sheet on a
    // phone, a floating card on desktop — carrying today's form: the kind of
    // feedback as three pills (Bug · Suggestion · Other), what happened, an
    // optional reply email, and the snapshot of the app's state that goes with
    // every report, folded behind one row. Send turns the sheet into a thank-you.
    const fbb = document.createElement('div'); fbb.className = 'sheet-backdrop'; fbb.id = 'feedback-backdrop'; fbb.dataset.open = 'false';
    const fb = document.createElement('aside'); fb.className = 'drawer-panel feedback-panel'; fb.id = 'feedback-modal'; fb.dataset.open = 'false'; fb.setAttribute('aria-label', 'Send feedback'); fb.setAttribute('role', 'dialog');
    const screenName = current || document.title.split(' — ')[0];
    fb.innerHTML = '<button class="icon-btn overlay-close" data-close="feedback-modal" aria-label="Close">✕</button>' +
      '<form class="fb-form" id="fb-form" novalidate>' +
        '<div class="fb-head"><small>Feedback</small><h2>Send feedback</h2></div>' +
        '<div class="fb-kind" role="radiogroup" aria-label="Feedback type">' +
          '<button type="button" class="fb-pill" data-kind="bug" aria-pressed="true"><span class="glyph">✕</span>Bug</button>' +
          '<button type="button" class="fb-pill" data-kind="suggestion" aria-pressed="false"><span class="glyph">✦</span>Suggestion</button>' +
          '<button type="button" class="fb-pill" data-kind="other" aria-pressed="false"><span class="glyph">…</span>Other</button></div>' +
        '<label class="fb-field"><span class="t">What happened?</span><textarea class="field" id="fb-text" rows="4" placeholder="What went wrong, and what did you expect to happen?" maxlength="2000"></textarea><span class="fb-err" id="fb-err" hidden>Please describe what happened before sending.</span></label>' +
        '<label class="fb-field"><span class="t">Reply email <small>optional</small></span><input class="field" id="fb-email" type="email" placeholder="you@example.com" autocomplete="email"></label>' +
        '<div class="fb-snapshot"><button type="button" class="fb-snap-row" id="fb-snap" aria-expanded="false"><span><span class="glyph">◈</span> Your report includes a snapshot of the app right now</span><span class="chev">▾</span></button>' +
          '<dl class="fb-snap-list" id="fb-snap-list" hidden>' +
            '<dt>Screen</dt><dd>' + screenName + '</dd>' +
            '<dt>Colour</dt><dd id="fb-snap-colour"></dd>' +
            '<dt>Question</dt><dd id="fb-snap-q">—</dd>' +
            '<dt>Cards</dt><dd id="fb-snap-cards">—</dd>' +
            '<dt>Viewport</dt><dd id="fb-snap-vp"></dd>' +
            '<dt>Build</dt><dd>direction-1 mockup · round 11</dd>' +
            '<dt>Browser</dt><dd id="fb-snap-ua"></dd></dl></div>' +
        '<div class="fb-foot"><span class="fb-note">Sent to the team, not to a public board.</span><button type="submit" class="btn primary" id="fb-send">Send feedback</button></div>' +
      '</form>' +
      '<div class="fb-done" id="fb-done" hidden><span class="seal" aria-hidden="true"></span><h2>Thanks — your feedback was sent.</h2><p>The team reads every report. If you left an email, a reply comes there.</p><button type="button" class="btn" data-close="feedback-modal">Done</button></div>';
    const KIND_HINT = { bug: 'What went wrong, and what did you expect to happen?', suggestion: 'What would make TheJudge better?', other: 'What\'s on your mind?' };
    const KIND_LABEL = { bug: 'What happened?', suggestion: 'What\'s your idea?', other: 'What would you like to tell us?' };
    setTimeout(() => {
      fb.querySelectorAll('.fb-pill').forEach((p) => p.addEventListener('click', () => {
        fb.querySelectorAll('.fb-pill').forEach((x) => x.setAttribute('aria-pressed', String(x === p)));
        fb.querySelector('#fb-text').placeholder = KIND_HINT[p.dataset.kind];
        fb.querySelector('.fb-field .t').textContent = KIND_LABEL[p.dataset.kind];
      }));
      fb.querySelector('#fb-snap').addEventListener('click', () => {
        const open = fb.querySelector('#fb-snap').getAttribute('aria-expanded') !== 'true';
        fb.querySelector('#fb-snap').setAttribute('aria-expanded', String(open)); fb.querySelector('#fb-snap-list').hidden = !open;
      });
      fb.querySelector('#fb-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const ta = fb.querySelector('#fb-text');
        if (!ta.value.trim()) { fb.querySelector('#fb-err').hidden = false; ta.focus(); ta.closest('.fb-field').dataset.invalid = 'true'; return; }
        const send = fb.querySelector('#fb-send'); send.disabled = true; send.textContent = 'Sending…';
        setTimeout(() => { fb.querySelector('#fb-form').hidden = true; fb.querySelector('#fb-done').hidden = false; fb.querySelector('#fb-done .btn').focus(); }, 900);
      });
      fb.querySelector('#fb-text').addEventListener('input', () => { fb.querySelector('#fb-err').hidden = true; delete fb.querySelector('#fb-text').closest('.fb-field').dataset.invalid; });
    }, 0);
    function openFeedback() {
      const q = document.getElementById('question-field');
      fb.querySelector('#fb-snap-colour').textContent = (document.documentElement.dataset.profile || 'blue').replace(/^./, (c) => c.toUpperCase());
      fb.querySelector('#fb-snap-q').textContent = q && q.value.trim() ? '“' + q.value.trim().slice(0, 80) + (q.value.trim().length > 80 ? '…' : '') + '”' : 'none in progress';
      const n = document.querySelectorAll('#ring .card, #shelf .card, .entry[data-id]').length;
      fb.querySelector('#fb-snap-cards').textContent = n ? n + (n === 1 ? ' card' : ' cards') : 'none';
      fb.querySelector('#fb-snap-vp').textContent = innerWidth + ' × ' + innerHeight;
      fb.querySelector('#fb-snap-ua').textContent = /Chrome/.test(navigator.userAgent) ? 'Chrome' : /Safari/.test(navigator.userAgent) ? 'Safari' : /Firefox/.test(navigator.userAgent) ? 'Firefox' : 'Browser';
      fb.querySelector('#fb-form').hidden = false; fb.querySelector('#fb-done').hidden = true;
      const send = fb.querySelector('#fb-send'); send.disabled = false; send.textContent = 'Send feedback';
      fbb.dataset.open = 'true'; fb.dataset.open = 'true'; fb.scrollTop = 0;
      setTimeout(() => fb.querySelector('#fb-text').focus(), 300);
    }
    document.body.append(fbb);
    const hb = document.createElement('div'); hb.className = 'sheet-backdrop'; hb.id = 'history-backdrop'; hb.dataset.open = 'false';
    const hd = document.createElement('aside'); hd.className = 'drawer-panel history-panel'; hd.id = 'history-drawer'; hd.dataset.open = 'false'; hd.setAttribute('aria-label', 'Question history');
    hd.innerHTML = '<button class="icon-btn overlay-close" data-close="history-drawer" aria-label="Close">✕</button>' +
      '<div class="h-head"><h2>Question History</h2><span class="n" id="history-n"></span></div>' +
      '<div class="h-panes"><div class="history-list" id="history-list" role="list"></div><div class="h-preview" id="history-preview"></div></div>' +
      '<div class="history-foot">Your last 20 answered questions are kept on this device. Open one to keep the conversation going.</div>';
    document.body.append(fb, hb, hd);
    const closeAll = () => { fb.dataset.open = 'false'; fbb.dataset.open = 'false'; hb.dataset.open = 'false'; hd.dataset.open = 'false'; };
    document.getElementById('tray-feedback').addEventListener('click', () => { setTray(false); openFeedback(); });
    document.getElementById('tray-history').addEventListener('click', () => { setTray(false); renderHistory(); hb.dataset.open = 'true'; hd.dataset.open = 'true'; });
    document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeAll));
    fbb.addEventListener('click', closeAll);
    hb.addEventListener('click', closeAll);
    window.FLOW.openFeedback = openFeedback;
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAll(); setTray(false); } });
    closeHistory = closeAll;
    return setTray;
  }

  // ---- Question History (round 11) — the demo's saved conversations. Today's
  // app keeps the last 20 answered questions in the browser (both modes); each
  // one holds the frozen cards or game context, the question, and the whole
  // thread, and reopening one is live — follow-ups keep going against the same
  // context. The mockup carries the same shape. ----
  const HISTORY = [
    { id: 'h1', mode: 'In-depth', when: '2 min ago', cards: ['Lightning Bolt', 'Counterspell', 'Sol Ring', 'Llanowar Elves', 'Swords to Plowshares', 'Lightning Helix'], context: 'Pre Combat Main · 2 players', q: 'How does this resolve?',
      thread: ['The top of the stack resolves first. [[Counterspell]] was cast in response to [[Lightning Bolt]], so it resolves first and counters the Bolt — Lightning Bolt is put into its owner\'s graveyard and deals no damage.\n[[Sol Ring]] and [[Llanowar Elves]] on the battlefield are untouched. With the stack empty, Player 1 gets priority again in the Pre Combat Main Phase and could still cast [[Swords to Plowshares]] from hand.',
        'you:What if I cast Lightning Helix at the Elves instead?', 'If [[Lightning Helix]] is cast with the stack empty, it is the only spell on the stack and resolves unless someone responds: it deals 3 damage to the Elves — lethal for a 1/1 — and you gain 3 life. The Counterspell already resolved, so it cannot be used again.'] },
    { id: 'h2', mode: 'Quick', when: '14 min ago', cards: ['Sol Ring'], q: 'Does Sol Ring tap for two?',
      thread: ['Yes. [[Sol Ring]] has "{T}: Add {C}{C}" — one tap gives two colorless mana. It is a mana ability, so it does not use the stack and cannot be responded to. It can be activated the turn it enters the battlefield; artifacts have no summoning sickness.'] },
    { id: 'h3', mode: 'Quick', when: '1 h ago', cards: ['Grapeshot', 'Dark Ritual'], q: 'If I cast Dark Ritual then Grapeshot, how many copies do I get?',
      thread: ['Storm counts every spell cast before [[Grapeshot]] this turn, by any player. With [[Dark Ritual]] as the only earlier spell, Grapeshot is copied once — two instances total, each dealing 1 damage to any target, and you may choose new targets for the copy.', 'you:Does the copy also have storm?', 'No. The copy is created by the storm trigger, not cast, so its own storm ability never triggers.'] },
    { id: 'h4', mode: 'Quick', when: 'yesterday', cards: [], q: 'Can I respond to a trigger?',
      thread: ['Yes. A triggered ability goes on the stack the next time a player would receive priority, and every player then gets a chance to respond to it with instants and activated abilities before it resolves. You cannot respond to it before it is put on the stack.'] },
    { id: 'h5', mode: 'In-depth', when: 'yesterday', cards: ['Birds of Paradise', 'Path to Exile', 'Rhystic Study'], context: 'Combat · 3 players', q: 'Do I draw from Rhystic Study if the Path is paid for?',
      thread: ['[[Rhystic Study]] triggers when an opponent casts a spell. When [[Path to Exile]] is cast, the trigger goes on the stack above it; when it resolves, that player chooses whether to pay {1}. If they pay, you draw nothing; if they do not, you may draw a card. Either way Path still resolves afterwards and exiles [[Birds of Paradise]].'] },
    { id: 'h6', mode: 'Quick', when: '3 days ago', cards: ['Llanowar Elves', 'Lightning Bolt'], q: 'Can I tap Llanowar Elves for mana in response to Lightning Bolt targeting it?',
      thread: ['Yes. Tapping [[Llanowar Elves]] for mana is a mana ability, and you can activate it while you hold priority in response to [[Lightning Bolt]]. The Elves still die when the Bolt resolves, but the mana is yours to spend on an instant first — the mana empties at the end of the step or phase.'] }
  ];
  let closeHistory = () => {};
  let previewId = null;
  const modeChip = (m) => '<span class="mode-chip">' + m + '</span>';
  const fan = (names) => {
    const cards = names.map(byName).filter(Boolean);
    if (!cards.length) return '<span class="h-fan"><span class="none" aria-hidden="true">—</span></span>';
    return '<span class="h-fan">' + cards.slice(0, 3).map((c) => thumb(c)).join('') + (cards.length > 3 ? '<span class="more">+' + (cards.length - 3) + '</span>' : '') + '</span>';
  };
  const followups = (h) => h.thread.filter((t) => t.startsWith('you:')).length;
  const firstLine = (h) => h.thread[0].replace(/\[\[(.+?)\]\]/g, '$1').split('\n')[0];
  function historyMessages(h) {
    return [{ who: 'you', text: h.q }].concat(h.thread.map((t) => t.startsWith('you:') ? { who: 'you', text: t.slice(4) } : { who: 'judge', text: t }));
  }
  function renderHistory() {
    const list = document.getElementById('history-list'), n = document.getElementById('history-n');
    if (!list) return;
    n.textContent = HISTORY.length ? HISTORY.length + ' of 20' : '';
    list.innerHTML = HISTORY.length ? HISTORY.map((h) => {
      const f = followups(h), cardsN = h.cards.length;
      return '<button class="history-row" role="listitem" data-id="' + h.id + '" aria-current="' + (previewId === h.id) + '">' + fan(h.cards) +
        '<span class="h-main"><span class="h-q">' + h.q + '</span><span class="h-a">' + firstLine(h) + '</span>' +
        '<span class="h-meta">' + modeChip(h.mode) + '<span class="sep"></span><span>' + (cardsN ? cardsN + (cardsN === 1 ? ' card' : ' cards') : 'no cards') + '</span>' +
        (h.context ? '<span class="sep"></span><span>' + h.context + '</span>' : '') +
        (f ? '<span class="sep"></span><span>' + f + (f === 1 ? ' follow-up' : ' follow-ups') + '</span>' : '') +
        '<span class="sep"></span><span>' + h.when + '</span></span></span><span class="h-chev" aria-hidden="true">›</span></button>';
    }).join('') : '<div class="history-empty">No saved questions yet. Every answered question is kept here, twenty at most.</div>';
    list.querySelectorAll('.history-row').forEach((b) => b.addEventListener('click', () => {
      const h = HISTORY.find((x) => x.id === b.dataset.id);
      // wide screen: pick it for the preview pane; phone: straight into the conversation
      if (matchMedia('(min-width: 600px)').matches) { previewId = h.id; renderHistory(); } else openHistoryEntry(h);
    }));
    renderPreview();
  }
  function renderPreview() {
    const pv = document.getElementById('history-preview');
    if (!pv) return;
    const h = HISTORY.find((x) => x.id === previewId);
    if (!h) { pv.innerHTML = '<div class="pv-empty">Pick a question to read it here.<br>Open puts you back in the conversation.</div>'; return; }
    const cards = h.cards.map(byName).filter(Boolean);
    pv.innerHTML = '<div class="pv-scroll"><div class="pv-when">' + modeChip(h.mode) + '<span>asked ' + h.when + '</span>' + (h.context ? '<span>·</span><span>' + h.context + '</span>' : '') + '</div>' +
      '<div class="chat-cards">' + (cards.length ? '<span class="lbl">Cards</span>' + cards.map((c) => thumb(c, 'tap')).join('') : '<span class="lbl">No cards attached</span>') + '</div>' +
      '<div class="thread">' + chatMarkup(historyMessages(h)) + '</div></div>' +
      '<div class="pv-foot"><button class="link" type="button" id="history-delete">Delete this question</button><button class="btn primary" type="button" id="history-open">Open conversation ›</button></div>';
    bindRefs(pv);
    pv.querySelector('#history-open').addEventListener('click', () => openHistoryEntry(h));
    pv.querySelector('#history-delete').addEventListener('click', () => {
      const b = pv.querySelector('#history-delete');
      if (b.dataset.armed !== 'true') { b.dataset.armed = 'true'; b.textContent = 'Delete for good? Tap again'; b.style.color = '#ff8fa3'; return; }
      HISTORY.splice(HISTORY.indexOf(h), 1); previewId = null; renderHistory();
    });
  }
  // opening a saved question: the page that owns the conversation (Ask a
  // Question) shows it in place; any other page goes there with ?history=
  function openHistoryEntry(h) {
    closeHistory();
    if (typeof window.FLOW.onOpenHistory === 'function') window.FLOW.onOpenHistory(h);
    else location.href = 'quick-question.html?history=' + encodeURIComponent(h.id);
  }
  const historyById = (id) => HISTORY.find((x) => x.id === id) || null;
  let colorlessHex = null;
  // the remembered colour (round 10) — read with one argument, write with two;
  // storage can be missing or refused (file://, private windows), so it never throws
  function remember(key, value) {
    try {
      const k = 'thejudge-mock-' + key;
      if (arguments.length < 2) return localStorage.getItem(k);
      if (value == null) localStorage.removeItem(k); else localStorage.setItem(k, value);
    } catch (e) { /* no storage: the page still works, it just forgets */ }
    return null;
  }
  function setProfile(id) {
    document.documentElement.setAttribute('data-profile', id);
    remember('profile', id);
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
  function setCustomColorless(hex) { colorlessHex = hex; remember('colorless', hex); applyCustom(); }
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

  // round 10: on a phone the demo strip folds behind a DEMO tab (shell.css)
  function mountDemoToggle() {
    if (!document.querySelector('.demo-bar') || document.querySelector('.demo-toggle')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'demo-toggle'; b.textContent = 'demo'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Show the mockup demo controls');
    const set = (open) => { document.body.dataset.demoOpen = open ? 'true' : 'false'; b.setAttribute('aria-expanded', String(open)); };
    b.addEventListener('click', () => set(document.body.dataset.demoOpen !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    document.body.append(b);
  }
  document.addEventListener('DOMContentLoaded', ensureDetailPanel);
  document.addEventListener('DOMContentLoaded', mountDemoToggle);
  return { img, art, library, byName, cardMarkup, openDetail, closeDetail, bindComposer, fitPlaceholder, sendMarkup, autoGrow, ring, applyRing, ringAttr, thumb, pips, chatMarkup, runWait, WAIT_STAGES, bindRefs, mountMics, mountMenu, setProfile, setCustomColorless, PROFILES, HISTORY, historyMessages, historyById, openHistoryEntry };
})();
