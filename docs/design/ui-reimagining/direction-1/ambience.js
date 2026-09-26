/*
 * ambience.js — the particle field behind every screen (pairs with
 * ambience.css). One small canvas, one profile-specific recipe:
 *
 *   white      slow rising motes of light, soft and round
 *   blue       tiny sparks orbiting a centre, occasional bright flash
 *   black      ash drifting down, a rare violet ember
 *   red        embers rising fast with a flicker, fading as they climb
 *   green      pollen drifting sideways, twinkling
 *   colorless  fine dust settling, dim and steady
 *
 * Reads the profile from <html data-profile> and restarts when it changes,
 * so the Theme orbs re-theme the field live. Respects reduced motion (draws
 * nothing). Round 4: ~50% denser (owner: "still too subtle"). Mockup plumbing only.
 */
(() => {
  const RECIPES = {
    white:     { n: 52, color: [250, 248, 242], size: [1, 3],   vx: [-0.04, 0.04], vy: [-0.22, -0.08], twinkle: 0.6, glow: 10, life: [9, 16] },
    blue:      { n: 70, color: [56, 225, 255],  size: [0.6, 1.8], vx: [-0.25, 0.25], vy: [-0.25, 0.25], twinkle: 1.2, glow: 8, life: [4, 9], orbit: true },
    black:     { n: 60, color: [180, 170, 200], size: [0.8, 2.2], vx: [-0.08, 0.08], vy: [0.06, 0.2],   twinkle: 0.3, glow: 0, life: [10, 18], ember: [199, 125, 255] },
    red:       { n: 66, color: [255, 120, 90],  size: [0.8, 2.4], vx: [-0.12, 0.12], vy: [-0.5, -0.22], twinkle: 1.8, glow: 12, life: [3, 7], fromBottom: true },
    green:     { n: 58, color: [74, 255, 160],  size: [0.7, 2],   vx: [0.05, 0.22],  vy: [-0.06, 0.06], twinkle: 0.9, glow: 8, life: [8, 14] },
    colorless: { n: 46, color: [228, 228, 231], size: [0.5, 1.4], vx: [-0.03, 0.03], vy: [0.04, 0.1],   twinkle: 0.2, glow: 0, life: [12, 20] }
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let canvas, ctx, parts = [], recipe, W = 0, H = 0, raf = 0, dpr = 1;

  const rnd = (a, b) => a + Math.random() * (b - a);

  function spawn(p, fresh) {
    const r = recipe;
    p.x = rnd(0, W);
    p.y = fresh ? rnd(0, H) : r.fromBottom ? H + 10 : (r.vy[0] > 0 ? -10 : r.vy[1] < 0 ? H + 10 : rnd(0, H));
    p.vx = rnd(r.vx[0], r.vx[1]);
    p.vy = rnd(r.vy[0], r.vy[1]);
    p.s = rnd(r.size[0], r.size[1]);
    p.life = p.max = rnd(r.life[0], r.life[1]) * 60;
    p.ph = Math.random() * Math.PI * 2;
    p.ember = r.ember && Math.random() < 0.08;
    if (r.orbit) { p.a = Math.random() * Math.PI * 2; p.rad = rnd(Math.min(W, H) * 0.12, Math.min(W, H) * 0.42); p.sp = rnd(0.0012, 0.004) * (Math.random() < 0.5 ? 1 : -1); }
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
    recipe = RECIPES[profile] || RECIPES.blue;
    parts = Array.from({ length: recipe.n }, () => spawn({}, true));
    cancelAnimationFrame(raf);
    if (!reduced.matches) raf = requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, W, H);
  }

  let t = 0;
  function tick() {
    t += 1;
    ctx.clearRect(0, 0, W, H);
    const [cr, cg, cb] = recipe.color;
    for (const p of parts) {
      p.life -= 1;
      if (p.life <= 0) spawn(p, false);
      if (recipe.orbit) {
        p.a += p.sp;
        const cx = W / 2, cy = H * 0.45;
        p.x = cx + Math.cos(p.a) * p.rad + p.vx * 20 * Math.sin(t / 60 + p.ph);
        p.y = cy + Math.sin(p.a) * p.rad * 0.7 + p.vy * 20 * Math.cos(t / 70 + p.ph);
      } else {
        p.x += p.vx + Math.sin(t / 90 + p.ph) * 0.12;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
        if (p.y < -12 || p.y > H + 12) spawn(p, false);
      }
      const fade = Math.min(1, p.life / 60, (p.max - p.life) / 60);
      const tw = 0.55 + 0.45 * Math.sin(t / (14 / Math.max(recipe.twinkle, 0.1)) + p.ph);
      const alpha = fade * tw * (p.ember ? 1 : 0.85);
      const col = p.ember ? recipe.ember : [cr, cg, cb];
      if (recipe.glow || p.ember) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * (p.ember ? 7 : 4));
        g.addColorStop(0, 'rgba(' + col.join(',') + ',' + (alpha * 0.55) + ')');
        g.addColorStop(1, 'rgba(' + col.join(',') + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (p.ember ? 7 : 4), 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(' + col.join(',') + ',' + alpha + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (p.ember ? 1.6 : 1), 0, Math.PI * 2); ctx.fill();
    }
    raf = requestAnimationFrame(tick);
  }

  function mount() {
    if (document.querySelector('.ambience')) return;
    const layer = document.createElement('div');
    layer.className = 'ambience'; layer.setAttribute('aria-hidden', 'true');
    canvas = document.createElement('canvas'); canvas.id = 'ambience-canvas';
    layer.appendChild(canvas);
    document.body.prepend(layer);
    ctx = canvas.getContext('2d');
    resize(); start();
    window.addEventListener('resize', () => { resize(); });
    new MutationObserver(start).observe(document.documentElement, { attributes: true, attributeFilter: ['data-profile'] });
    reduced.addEventListener?.('change', start);
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else if (!reduced.matches) raf = requestAnimationFrame(tick); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
