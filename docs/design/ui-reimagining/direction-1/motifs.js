/*
 * motifs.js — the one source of every colour's symbol (round 6; picks final in round 7). Each symbol
 * is drawn in a 100×100 box in currentColor; cut-outs use the disc colour
 * (--disc, the dark badge disc). The page's chosen symbol per colour is
 * CHOSEN; the other letters are the round-6 candidates the gallery shows.
 * motifs/<colour>.svg (the full badge with its elemental ring, used by CSS
 * as --motif) embeds the chosen symbol's paths — keep the two in step.
 * Mockup plumbing only; nothing here is app code.
 */
window.MOTIFS = (() => {
  const D = 'style="fill:var(--disc,#0e0e11)"';
  const S = {
    // ---- White: C from round 5 (the owner's pick) — a rising sun over a horizon ----
    'white-c': '<path d="M28 64 A22 22 0 0 1 72 64 Z" fill="currentColor"/><path d="M12 64 H88" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><g stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M50 14 V26"/><path d="M26 24 L33 33"/><path d="M74 24 L67 33"/><path d="M14 46 L24 50"/><path d="M86 46 L76 50"/></g><path d="M20 76 H80" stroke="currentColor" stroke-width="2" opacity="0.5" stroke-linecap="round"/>',
    // ---- Blue: C from round 5 (the owner's pick) — a single wave crest ----
    'blue-c': '<path d="M12 66 C 22 40, 40 30, 58 38 C 70 44, 74 56, 64 60 C 58 62, 54 56, 60 52" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M14 74 H86" stroke="currentColor" stroke-width="2.5" opacity="0.5" stroke-linecap="round"/><g fill="currentColor"><circle cx="72" cy="38" r="2.4"/><circle cx="80" cy="50" r="1.8"/><circle cx="66" cy="28" r="1.6"/></g>',
    // ---- Black: skull and bones, drawn our own way (round 6) ----
    // A · a skull in line — an open cranium with a crack, the sockets the only solid mass
    'black-a': '<path d="M30 52 A20 22 0 1 1 70 52 V60 Q70 66 64 66 V77 H36 V66 Q30 66 30 60 Z" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/><path d="M43 66 V77 M50 66 V77 M57 66 V77" stroke="currentColor" stroke-width="2.4"/><ellipse cx="41" cy="51" rx="6" ry="5.5" fill="currentColor"/><ellipse cx="59" cy="51" rx="6" ry="5.5" fill="currentColor"/><path d="M50 55 l-3.5 7 h7 z" fill="currentColor"/><path d="M48 31 l5 6 l-3 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    // B · crossed bones
    'black-b': '<g fill="currentColor"><g transform="rotate(45 50 50)"><rect x="46" y="24" width="8" height="52" rx="4"/><circle cx="44.5" cy="25" r="6"/><circle cx="55.5" cy="25" r="6"/><circle cx="44.5" cy="75" r="6"/><circle cx="55.5" cy="75" r="6"/></g><g transform="rotate(-45 50 50)"><rect x="46" y="24" width="8" height="52" rx="4"/><circle cx="44.5" cy="25" r="6"/><circle cx="55.5" cy="25" r="6"/><circle cx="44.5" cy="75" r="6"/><circle cx="55.5" cy="75" r="6"/></g></g>',
    // C · a small solid skull over crossed bones
    'black-c': '<g transform="translate(50 74) scale(0.58) translate(-50 -50)" fill="currentColor"><g transform="rotate(45 50 50)"><rect x="46" y="20" width="8" height="60" rx="4"/><circle cx="44.5" cy="21" r="6.5"/><circle cx="55.5" cy="21" r="6.5"/><circle cx="44.5" cy="79" r="6.5"/><circle cx="55.5" cy="79" r="6.5"/></g><g transform="rotate(-45 50 50)"><rect x="46" y="20" width="8" height="60" rx="4"/><circle cx="44.5" cy="21" r="6.5"/><circle cx="55.5" cy="21" r="6.5"/><circle cx="44.5" cy="79" r="6.5"/><circle cx="55.5" cy="79" r="6.5"/></g></g><path d="M34 44 A16 17 0 1 1 66 44 V50 Q66 55 61 55 V64 H39 V55 Q34 55 34 50 Z" fill="currentColor"/><ellipse cx="43" cy="43" rx="4.5" ry="4" ' + D + '/><ellipse cx="57" cy="43" rx="4.5" ry="4" ' + D + '/><path d="M50 47 l-2.5 5 h5 z" ' + D + '/><path d="M45 57 V64 M50 57 V64 M55 57 V64" stroke="var(--disc,#0e0e11)" stroke-width="1.6"/>',
    // D · a horned skull, solid
    'black-d': '<path d="M32 46 C 20 42, 16 26, 24 12 C 26 28, 32 34, 38 36 Z" fill="currentColor"/><path d="M68 46 C 80 42, 84 26, 76 12 C 74 28, 68 34, 62 36 Z" fill="currentColor"/><path d="M32 52 A18 19 0 1 1 68 52 V59 Q68 65 62 65 V78 H38 V65 Q32 65 32 59 Z" fill="currentColor"/><ellipse cx="42" cy="51" rx="5.5" ry="5" ' + D + '/><ellipse cx="58" cy="51" rx="5.5" ry="5" ' + D + '/><path d="M50 55 l-3 7 h6 z" ' + D + '/><path d="M44 68 V78 M50 68 V78 M56 68 V78" stroke="var(--disc,#0e0e11)" stroke-width="1.8"/>',
    // ---- Red: flames, ours (round 6) ----
    // A · a three-tongued flame with its hollow heart
    'red-a': '<path d="M50 8 C 56 20, 64 24, 68 22 C 72 36, 76 44, 76 58 C 76 76, 64 88, 50 88 C 36 88, 24 76, 24 58 C 24 48, 30 40, 34 30 C 37 38, 42 42, 44 38 C 42 28, 46 18, 50 8 Z" fill="currentColor"/><path d="M50 48 C 56 56, 62 60, 62 69 C 62 77, 56 82, 50 82 C 44 82, 38 77, 38 69 C 38 63, 44 59, 44 53 C 46 59, 50 57, 50 48 Z" ' + D + '/>',
    // B · one tall flame and three embers
    'red-b': '<path d="M50 12 C 60 28, 70 40, 68 58 C 66 74, 58 84, 50 86 C 40 84, 32 74, 32 58 C 32 46, 40 40, 42 30 C 44 40, 50 42, 50 34 C 48 26, 48 20, 50 12 Z" fill="currentColor"/><path d="M50 52 C 55 58, 58 62, 58 69 C 58 76, 54 80, 50 80 C 46 80, 42 76, 42 69 C 42 64, 46 60, 46 56 C 47 60, 50 58, 50 52 Z" ' + D + '/><g fill="currentColor"><circle cx="24" cy="30" r="2.4"/><circle cx="76" cy="26" r="2"/><circle cx="20" cy="60" r="1.8"/></g>',
    // C · a crown of fire — eight tongues round a ring
    'red-c': '<circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" stroke-width="3"/><g fill="currentColor"><path d="M50 30 C 57 24, 53 15, 55 8 C 46 14, 44 23, 50 30 Z"/><path d="M50 30 C 57 24, 53 15, 55 8 C 46 14, 44 23, 50 30 Z" transform="rotate(45 50 50)"/><path d="M50 30 C 57 24, 53 15, 55 8 C 46 14, 44 23, 50 30 Z" transform="rotate(90 50 50)"/><path d="M50 30 C 57 24, 53 15, 55 8 C 46 14, 44 23, 50 30 Z" transform="rotate(135 50 50)"/><path d="M50 30 C 57 24, 53 15, 55 8 C 46 14, 44 23, 50 30 Z" transform="rotate(180 50 50)"/><path d="M50 30 C 57 24, 53 15, 55 8 C 46 14, 44 23, 50 30 Z" transform="rotate(225 50 50)"/><path d="M50 30 C 57 24, 53 15, 55 8 C 46 14, 44 23, 50 30 Z" transform="rotate(270 50 50)"/><path d="M50 30 C 57 24, 53 15, 55 8 C 46 14, 44 23, 50 30 Z" transform="rotate(315 50 50)"/></g><circle cx="50" cy="50" r="6" fill="currentColor"/>',
    // D · fire over a peak (round 5's volcano, with flames)
    'red-d': '<path d="M12 84 L38 44 L50 56 L60 46 L88 84 Z" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/><g transform="translate(51 42) scale(0.5) translate(-50 -64)"><path d="M50 12 C 60 28, 70 40, 68 58 C 66 74, 58 84, 50 86 C 40 84, 32 74, 32 58 C 32 46, 40 40, 42 30 C 44 40, 50 42, 50 34 C 48 26, 48 20, 50 12 Z" fill="currentColor"/><path d="M50 52 C 55 58, 58 62, 58 69 C 58 76, 54 80, 50 80 C 46 80, 42 76, 42 69 C 42 64, 46 60, 46 56 C 47 60, 50 58, 50 52 Z" ' + D + '/></g><g fill="currentColor"><circle cx="70" cy="22" r="2"/><circle cx="32" cy="26" r="1.8"/></g>',
    // ---- Green: the sprouting seed, four ways (round 6; A is round 5's C) ----
    // A · round 7: the sprout redrawn — the bud is gone; the stem bends and curls
    //     into a tendril, the two leaves differ in size and height, the soil line
    //     sits off-centre. Asymmetric and a little mystical, not a diagram.
    'green-a': '<path d="M14 84 H76" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.6"/><path d="M46 84 C 46 72, 44 60, 50 48 C 55 38, 61 34, 59 26 C 58 20.5, 51.5 20, 50.5 25 C 49.5 29.5, 54 32, 57 29" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M46 67 C 40 53, 26 46, 15 50 C 17 63, 34 71, 46 67 Z" fill="currentColor"/><path d="M46 67 C 38 61, 29 55, 18 51.5" fill="none" stroke="var(--disc,#0e0e11)" stroke-width="1.3" stroke-linecap="round" opacity="0.9"/><path d="M51 51 C 55 41, 66 36.5, 75 40 C 71 50.5, 59 55, 51 51 Z" fill="currentColor"/><path d="M51 51 C 57 47, 64 43, 73 40.8" fill="none" stroke="var(--disc,#0e0e11)" stroke-width="1.1" stroke-linecap="round" opacity="0.9"/>',
    // B · the seed itself, half in the soil, the sprout rising from it
    'green-b': '<path d="M12 84 H88" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.6"/><path d="M22 84 Q 50 66 78 84" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><ellipse cx="50" cy="74" rx="10" ry="7" fill="currentColor" transform="rotate(-20 50 74)"/><path d="M50 68 V42" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M50 44 C 48 32, 36 28, 26 32 C 28 44, 40 50, 50 44 Z" fill="currentColor"/><path d="M50 44 C 52 32, 64 28, 74 32 C 72 44, 60 50, 50 44 Z" fill="currentColor"/>',
    // C · the seed splitting, the shoot pushing up between the halves
    'green-c': '<path d="M45 62 C 30 64, 30 84, 45 86" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M55 62 C 70 64, 70 84, 55 86" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M50 80 V36" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M50 52 C 46 40, 36 36, 26 40 C 30 52, 42 56, 50 52 Z" fill="currentColor"/><path d="M50 44 C 54 32, 64 28, 74 32 C 70 44, 58 48, 50 44 Z" fill="currentColor"/><path d="M50 36 C 46 28, 48 20, 54 16 C 56 24, 54 32, 50 36 Z" fill="currentColor"/>',
    // D · one leaf and a curling tendril off the seed
    'green-d': '<ellipse cx="50" cy="84" rx="9" ry="6" fill="currentColor"/><path d="M50 80 C 50 64, 50 54, 50 46" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M50 50 C 50 34, 66 32, 66 44 c 0 7, -9 9, -11 2" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><path d="M50 62 C 46 48, 32 42, 20 46 C 22 60, 38 66, 50 62 Z" fill="currentColor"/>',
    // ---- Colorless: a circle with a swirl — mystical, a little Eldrazi (round 6) ----
    // A · a spiral inside a ring
    'colorless-a': '<circle cx="50" cy="50" r="33" fill="none" stroke="currentColor" stroke-width="3"/><path d="M50 50 c 3 -3, 9 -2, 9 4 c 0 8, -11 11, -17 4 c -8 -8, -2 -22, 11 -23 c 14 -1, 24 10, 20 24 c -1 4, -3 7, -6 9" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><circle cx="51" cy="52" r="2" fill="currentColor"/>',
    // B · three arms turning inside a ring
    'colorless-b': '<circle cx="50" cy="50" r="33" fill="none" stroke="currentColor" stroke-width="3"/><g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M50 50 C 50 36, 60 28, 70 32"/><path d="M50 50 C 50 36, 60 28, 70 32" transform="rotate(120 50 50)"/><path d="M50 50 C 50 36, 60 28, 70 32" transform="rotate(240 50 50)"/></g><g fill="currentColor"><circle cx="72" cy="33" r="2.6"/><circle cx="72" cy="33" r="2.6" transform="rotate(120 50 50)"/><circle cx="72" cy="33" r="2.6" transform="rotate(240 50 50)"/></g><circle cx="50" cy="50" r="4" fill="currentColor"/>',
    // C · a vortex — broken rings turning in to one point, no outer ring
    'colorless-c': '<g fill="none" stroke="currentColor" stroke-linecap="round"><path d="M50 18 A32 32 0 1 1 22 34" stroke-width="3"/><path d="M50 26 A24 24 0 1 0 74 50" stroke-width="2.6" transform="rotate(-70 50 50)"/><path d="M50 36 A14 14 0 1 1 36 50" stroke-width="2.4" transform="rotate(30 50 50)"/><path d="M50 43 A7 7 0 1 0 57 50" stroke-width="2.2"/></g><circle cx="50" cy="50" r="2.5" fill="currentColor"/>',
    // D · a ring with tendrils curling inward
    'colorless-d': '<circle cx="50" cy="50" r="33" fill="none" stroke="currentColor" stroke-width="3"/><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M50 17 C 50 26, 42 28, 44 35"/><path d="M50 17 C 50 26, 42 28, 44 35" transform="rotate(60 50 50)"/><path d="M50 17 C 50 26, 42 28, 44 35" transform="rotate(120 50 50)"/><path d="M50 17 C 50 26, 42 28, 44 35" transform="rotate(180 50 50)"/><path d="M50 17 C 50 26, 42 28, 44 35" transform="rotate(240 50 50)"/><path d="M50 17 C 50 26, 42 28, 44 35" transform="rotate(300 50 50)"/></g><path d="M50 50 c 2 -2, 6 -1, 6 3 c 0 5, -7 7, -11 3 c -5 -5, -1 -14, 7 -15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'
  };
  // the symbol each page wears today — the owner's Round 7 picks: Black A, Red A, Green A (redrawn), Colorless C
  const CHOSEN = { white: 'c', blue: 'c', black: 'a', red: 'a', green: 'a', colorless: 'c' };
  const CANDIDATES = {
    white: [['c', 'rising sun over a horizon']],
    blue: [['c', 'a single wave crest']],
    black: [['a', 'a skull in line, cracked'], ['b', 'crossed bones'], ['c', 'skull over crossed bones'], ['d', 'a horned skull']],
    red: [['a', 'a three-tongued flame'], ['b', 'one tall flame, three embers'], ['c', 'a crown of fire'], ['d', 'fire over a peak']],
    green: [['a', 'the sprout — a curling stem, two unequal leaves (round 7 redraw)'], ['b', 'the seed half in the soil, sprouting'], ['c', 'the seed splitting round the shoot'], ['d', 'one leaf and a tendril off the seed']],
    colorless: [['a', 'a spiral inside a ring'], ['b', 'three arms turning in a ring'], ['c', 'a vortex, no outer ring'], ['d', 'a ring of tendrils, a swirl inside']]
  };
  function mount() {
    if (document.getElementById('motif-sprite')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'motif-sprite'; svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.setAttribute('style', 'position:absolute'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = Object.entries(S).map(([id, body]) => '<symbol id="m-' + id + '" viewBox="0 0 100 100">' + body + '</symbol>').join('');
    document.body.prepend(svg);
  }
  const use = (id, cls = '') => '<svg class="motif-ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 100 100" aria-hidden="true"><use href="#m-' + id + '"/></svg>';
  const chosen = (colour) => colour + '-' + CHOSEN[colour];
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  return { S, CHOSEN, CANDIDATES, use, chosen, mount };
})();
