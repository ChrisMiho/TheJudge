/*
 * ambience.js — the magical dust behind every screen (pairs with
 * ambience.css). One small canvas, one profile-specific tint and current:
 *
 *   white      motes of light lifting slowly
 *   blue       dust turning on a slow, wide current
 *   black      ash settling, a rare violet spark
 *   red        embers lifting gently, a rare bright spark
 *   green      pollen drifting sideways
 *   colorless  fine dust settling, dim and steady
 *
 * Round 5: everything is slower, softer and finer than round 4 — no fast
 * sparks, no flashes; each mote is a soft glow that twinkles. Reads the
 * profile from <html data-profile> and restarts when it changes. Respects
 * reduced motion (draws nothing). Round 6: Black's ash is brighter with far
 * more violet sparks (it was the one colour that looked still); Colorless
 * reads its tint from the live --accent-soft token, so a custom colour
 * carries into the dust (restarts on data-accent as well). Mockup plumbing.
 */
(() => {
  const RECIPES = {
    white:     { n: 90,  color: [250, 248, 242], spark: [255, 255, 255], size: [0.5, 1.8], vx: [-0.03, 0.03], vy: [-0.1, -0.03], twinkle: 0.5, life: [12, 22] },
    blue:      { n: 100, color: [120, 200, 255], spark: [56, 225, 255],  size: [0.5, 1.7], vx: [-0.06, 0.06], vy: [-0.05, 0.05], twinkle: 0.7, life: [10, 20], current: true },
    black:     { n: 120, color: [190, 150, 235], spark: [222, 170, 255], size: [0.6, 2.1], vx: [-0.05, 0.05], vy: [0.03, 0.1],    twinkle: 0.6,  life: [12, 22], sparkRate: 0.22 },
    red:       { n: 90,  color: [255, 150, 120], spark: [255, 214, 102], size: [0.5, 1.8], vx: [-0.05, 0.05], vy: [-0.12, -0.04], twinkle: 0.8, life: [9, 18] },
    green:     { n: 90,  color: [140, 255, 190], spark: [74, 255, 160],  size: [0.5, 1.7], vx: [0.02, 0.09],  vy: [-0.03, 0.03], twinkle: 0.6, life: [12, 22] },
    colorless: { n: 80,  color: [228, 228, 231], spark: [244, 244, 245], size: [0.4, 1.4], vx: [-0.02, 0.02], vy: [0.02, 0.06],   twinkle: 0.25, life: [14, 26], fromToken: true }
  };

  // Colorless: the live accent-soft token (a custom hex, or the fixed grey) as [r, g, b]
  function tokenRGB() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--accent-soft').trim();
    const m = /^#([0-9a-f]{6})$/i.exec(v);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let canvas, ctx, parts = [], recipe, W = 0, H = 0, raf = 0, dpr = 1;

  const rnd = (a, b) => a + Math.random() * (b - a);

  function spawn(p, fresh) {
    const r = recipe;
    p.x = rnd(0, W);
    p.y = fresh ? rnd(0, H) : (r.vy[0] > 0 ? -10 : r.vy[1] < 0 ? H + 10 : rnd(0, H));
    p.vx = rnd(r.vx[0], r.vx[1]);
    p.vy = rnd(r.vy[0], r.vy[1]);
    p.s = rnd(r.size[0], r.size[1]);
    p.life = p.max = rnd(r.life[0], r.life[1]) * 60;
    p.ph = Math.random() * Math.PI * 2;
    p.spark = Math.random() < (r.sparkRate || 0.06);
    return p;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function start() {
    const profile = document.documentElement.dataset.profile || 'blue';
    recipe = Object.assign({}, RECIPES[profile] || RECIPES.blue);
    if (recipe.fromToken) { const c = tokenRGB(); if (c) { recipe.color = c; recipe.spark = c.map((x) => Math.min(255, x + 40)); } }
    parts = Array.from({ length: recipe.n }, () => spawn({}, true));
    cancelAnimationFrame(raf);
    if (!reduced.matches) raf = requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, W, H);
  }

  let t = 0;
  function tick() {
    t += 1;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.life -= 1;
      if (p.life <= 0) spawn(p, false);
      // a slow swirl on top of the drift; the blue current turns the whole field
      const swirl = recipe.current ? 0.35 : 0.12;
      p.x += p.vx + Math.sin(t / 140 + p.ph) * swirl * 0.5;
      p.y += p.vy + Math.cos(t / 160 + p.ph) * swirl * 0.3;
      if (p.x < -12) p.x = W + 12; if (p.x > W + 12) p.x = -12;
      if (p.y < -12 || p.y > H + 12) spawn(p, false);
      const fade = Math.min(1, p.life / 90, (p.max - p.life) / 90);
      const tw = 0.5 + 0.5 * Math.sin(t / (22 / Math.max(recipe.twinkle, 0.1)) + p.ph);
      const alpha = fade * (0.35 + 0.5 * tw) * (p.spark ? 1 : 0.7);
      const col = p.spark ? recipe.spark : recipe.color;
      const rad = p.s * (p.spark ? 6 : 4);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
      g.addColorStop(0, 'rgba(' + col.join(',') + ',' + (alpha * 0.5) + ')');
      g.addColorStop(1, 'rgba(' + col.join(',') + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(' + col.join(',') + ',' + alpha + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (p.spark ? 1.3 : 0.9), 0, Math.PI * 2); ctx.fill();
    }
    raf = requestAnimationFrame(tick);
  }

  function mount() {
    if (document.querySelector('.ambience')) return;
    const layer = document.createElement('div');
    layer.className = 'ambience'; layer.setAttribute('aria-hidden', 'true');
    const hazeA = document.createElement('div'); hazeA.className = 'haze a';
    const hazeB = document.createElement('div'); hazeB.className = 'haze b';
    canvas = document.createElement('canvas'); canvas.id = 'ambience-canvas';
    layer.append(hazeA, hazeB, canvas);
    document.body.prepend(layer);
    ctx = canvas.getContext('2d');
    resize(); start();
    window.addEventListener('resize', () => { resize(); });
    new MutationObserver(start).observe(document.documentElement, { attributes: true, attributeFilter: ['data-profile', 'data-accent'] });
    reduced.addEventListener?.('change', start);
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else if (!reduced.matches) raf = requestAnimationFrame(tick); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
