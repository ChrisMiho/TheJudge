/*
 * flow.js — demo helpers the question-flow pages share (Quick Question,
 * In-Depth Question): the demo card library with real corpus fields, the
 * Scryfall image URL, the card-detail panel, and the question-box budget.
 * Mockup plumbing only; nothing here is app code.
 */
window.FLOW = (() => {
  const img = (id) => 'https://cards.scryfall.io/normal/front/' + id[0] + '/' + id[1] + '/' + id + '.jpg';

  // real corpus fields (cardMetadata.json imageId + cardDetailByOracleId) for the demo cards
  const library = [
    { name: 'Lightning Bolt',       id: '132dc07f-74e2-4bd7-bdb1-4f5d5253c7f2', colors: ['R'], type: 'Instant',              cost: '{R}',    mv: 1, colorsLabel: 'Red',   sub: '—',          price: '$3.20',  oracle: 'Lightning Bolt deals 3 damage to any target.' },
    { name: 'Sol Ring',             id: '0ab38fe7-1929-44f6-b4ce-ce8cfacbfb76', colors: [], type: 'Artifact',             cost: '{1}',    mv: 1, colorsLabel: '—',     sub: '—',          price: '$1.85',  oracle: '{T}: Add {C}{C}.' },
    { name: 'Llanowar Elves',       id: '2526a07a-0b92-4e31-81fe-14fb067b5821', colors: ['G'], type: 'Creature — Elf Druid', cost: '{G}',    mv: 1, colorsLabel: 'Green', sub: 'Elf, Druid', price: '$0.75',  oracle: '{T}: Add {G}.' },
    { name: 'Swords to Plowshares', id: '68ec2aed-7662-48ae-ab25-04f74ece1e41', colors: ['W'], type: 'Instant',              cost: '{W}',    mv: 1, colorsLabel: 'White', sub: '—',          price: '$0.60',  oracle: 'Exile target creature. Its controller gains life equal to its power.' },
    { name: 'Counterspell',         id: '4f616706-ec97-4923-bb1e-11a69fbaa1f8', colors: ['U'], type: 'Instant',              cost: '{U}{U}', mv: 2, colorsLabel: 'Blue',  sub: '—',          price: '$1.10',  oracle: 'Counter target spell.' },
    { name: 'Rhystic Study',        id: '9f37c5b6-a59c-45cd-9a99-e9357fe9ea1b', colors: ['U'], type: 'Enchantment',          cost: '{2}{U}', mv: 3, colorsLabel: 'Blue',  sub: '—',          price: '$32.00', oracle: 'Whenever an opponent casts a spell, you may draw a card unless that player pays {1}.' },
    { name: 'Path to Exile',        id: '177bd28f-8c83-4a91-a025-33312539d222', colors: ['W'], type: 'Instant',              cost: '{W}',    mv: 1, colorsLabel: 'White', sub: '—',          price: '$2.40',  oracle: 'Exile target creature. Its controller may search their library for a basic land card, put that card onto the battlefield tapped, then shuffle.' },
    { name: 'Lightning Helix',      id: '4101e3fe-b0e7-4f0f-b9ac-9b61a4d628b3', colors: ['W', 'R'], type: 'Instant',           cost: '{R}{W}', mv: 2, colorsLabel: 'White, Red', sub: '—', price: '$0.90', oracle: 'Lightning Helix deals 3 damage to any target and you gain 3 life.' },
    { name: 'Birds of Paradise',    id: '3ffe931c-9f19-4ea5-bc24-041eb00a5862', colors: ['G'], type: 'Creature — Bird',      cost: '{G}',    mv: 1, colorsLabel: 'Green', sub: 'Bird',       price: '$6.10',  oracle: 'Flying\n{T}: Add one mana of any color.' }
  ];
  const byName = (n) => library.find((c) => c.name === n);

  // card identity ring — same colours and rules as the app's cardIdentityRing.ts
  const RING = { W: 'rgb(248 231 185 / 0.55)', U: 'rgb(14 165 233 / 0.55)', B: 'rgb(113 113 122 / 0.55)', R: 'rgb(239 68 68 / 0.55)', G: 'rgb(34 197 94 / 0.55)' };
  function ring(colors) {
    const c = ['W', 'U', 'B', 'R', 'G'].filter((x) => (colors || []).includes(x));
    if (!c.length) return 'rgb(148 163 184 / 0.55)';
    if (c.length === 1) return RING[c[0]];
    return 'linear-gradient(90deg, ' + c.map((x) => RING[x]).join(', ') + ')';
  }
  function applyRing(el, card) { el.classList.add('card-identity-ring'); el.style.setProperty('--card-identity-ring', ring(card.colors)); }
  const ringAttr = (card) => 'class="card-identity-ring" style="--card-identity-ring:' + ring(card.colors) + '"';
  // a small ringed thumbnail
  const thumb = (card, extra = '') => '<span class="thumb card-identity-ring' + (extra ? ' ' + extra : '') + '" style="--card-identity-ring:' + ring(card.colors) + '"><img src="' + img(card.id) + '" alt="' + card.name + '"></span>';

  // inner markup of a .card: the art (or the name-only fallback) plus the two corner widgets
  function cardMarkup(c, opts = {}) {
    return (opts.broken
      ? '<div class="fallback"><div><strong>' + c.name + '</strong><span>Image unavailable</span></div></div>'
      : '<img src="' + img(c.id) + '" alt="' + c.name + '" loading="eager">') +
      (opts.noRemove ? '' : '<button class="card-widget remove tap-target" aria-label="Remove ' + c.name + '">✕</button>') +
      '<button class="card-widget info tap-target" aria-label="Show details for ' + c.name + '">ⓘ</button>';
  }

  // ---- card detail panel (bottom sheet on phone, side panel on desktop) ----
  function ensureDetailPanel() {
    if (document.getElementById('detail-panel')) return;
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-tray-backdrop'; backdrop.id = 'detail-backdrop';
    const panel = document.createElement('aside');
    panel.className = 'drawer-panel detail-panel'; panel.id = 'detail-panel';
    panel.dataset.open = 'false'; panel.setAttribute('aria-label', 'Card details');
    panel.innerHTML =
      '<button class="icon-btn overlay-close tap-target" id="detail-close" aria-label="Close">✕</button>' +
      '<h2 id="detail-name"></h2>' +
      '<div class="detail-top"><img id="detail-img" alt=""><dl id="detail-fields"></dl></div>' +
      '<div class="oracle"><small>Oracle text</small><span id="detail-oracle"></span></div>';
    document.body.append(backdrop, panel);
    document.getElementById('detail-close').addEventListener('click', closeDetail);
    backdrop.addEventListener('click', closeDetail);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });
  }
  function openDetail(c) {
    ensureDetailPanel();
    const $ = (s) => document.getElementById(s);
    $('detail-name').textContent = c.name;
    $('detail-img').src = img(c.id);
    $('detail-fields').innerHTML =
      '<dt>Mana cost</dt><dd>' + c.cost + '</dd>' +
      '<dt>Mana value</dt><dd>' + c.mv + '</dd>' +
      '<dt>Type</dt><dd>' + c.type + '</dd>' +
      '<dt>Colors</dt><dd>' + c.colorsLabel + '</dd>' +
      '<dt>Subtypes</dt><dd>' + c.sub + '</dd>' +
      '<dt>Price</dt><dd class="price">' + c.price + ' (nonfoil)</dd>';
    $('detail-oracle').textContent = c.oracle;
    document.documentElement.dataset.trayOpen = 'true';
    $('detail-panel').dataset.open = 'true';
    $('detail-close').focus();
  }
  function closeDetail() {
    const p = document.getElementById('detail-panel');
    if (!p) return;
    document.documentElement.dataset.trayOpen = 'false';
    p.dataset.open = 'false';
  }

  // ---- question box: 300-character budget shown inside the frame ----
  function bindComposer(textarea, countEl, meterEl, max = 300) {
    const update = () => {
      const n = textarea.value.length;
      countEl.textContent = n + ' / ' + max;
      countEl.dataset.near = n >= max - 30 ? 'true' : 'false';
      meterEl.style.width = (n / max * 100) + '%';
    };
    textarea.addEventListener('input', update);
    update();
  }

  document.addEventListener('DOMContentLoaded', ensureDetailPanel);
  return { img, library, byName, cardMarkup, openDetail, closeDetail, bindComposer, ring, applyRing, ringAttr, thumb };
})();
