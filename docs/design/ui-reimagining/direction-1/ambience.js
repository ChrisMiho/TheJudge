/*
 * ambience.js — the moving part of every colour's personality, drawn on one
 * canvas behind the page (pairs with ambience.css, which paints the haze).
 *
 * Two layers per colour, both slow, soft and faint:
 *   the dust    fine motes that twinkle and drift (round 5), one recipe per colour
 *   the scene   round 7 — each colour's element, played as its own animation:
 *     white      soft beams from above and slow orbs of light lifting
 *     blue       bubbles rising through slow waves — undersea
 *     black      fog banks rolling low, a few wandering wisps
 *     red        heat tongues licking up from the foot of the screen, embers
 *     green      a canopy hangs from the top edge; leaves fall from it
 *     colorless  abstract shapes — rings, hexagons, ticks — turning slowly
 *
 * Reads the profile from <html data-profile> and restarts when it changes.
 * Respects reduced motion (draws nothing). Colorless reads the live
 * --accent-soft token so a custom colour carries in (restarts on data-accent).
 * The same renderer, at low density, plays in the Menu tray's foot
 * (mountFlair) — the round-7 "subtle knob": a whisper of the colour's theme
 * where round 6 had the badge. Mockup plumbing only; nothing here is app code.
 */
window.AMBIENCE = (() => {
  const RECIPES = {
    white:     { n: 70,  color: [250, 248, 242], spark: [255, 255, 255], size: [0.5, 1.8], vx: [-0.03, 0.03], vy: [-0.1, -0.03], twinkle: 0.5, life: [12, 22] },
    blue:      { n: 70,  color: [120, 200, 255], spark: [56, 225, 255],  size: [0.5, 1.7], vx: [-0.06, 0.06], vy: [-0.05, 0.05], twinkle: 0.7, life: [10, 20], current: true },
    black:     { n: 90,  color: [190, 150, 235], spark: [222, 170, 255], size: [0.6, 2.1], vx: [-0.05, 0.05], vy: [0.03, 0.1],    twinkle: 0.6,  life: [12, 22], sparkRate: 0.22 },
    red:       { n: 80,  color: [255, 150, 120], spark: [255, 214, 102], size: [0.5, 1.8], vx: [-0.05, 0.05], vy: [-0.14, -0.05], twinkle: 0.8, life: [9, 18], sparkRate: 0.14 },
    green:     { n: 60,  color: [140, 255, 190], spark: [74, 255, 160],  size: [0.5, 1.7], vx: [0.02, 0.09],  vy: [-0.03, 0.03], twinkle: 0.6, life: [12, 22] },
    colorless: { n: 60,  color: [228, 228, 231], spark: [244, 244, 245], size: [0.4, 1.4], vx: [-0.02, 0.02], vy: [0.02, 0.06],   twinkle: 0.25, life: [14, 26], fromToken: true }
  };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  const mix = (a, b, t) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];

  // Colorless: the live accent-soft token (a custom hex, or the fixed grey) as [r, g, b]
  function tokenRGB() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--accent-soft').trim();
    const m = /^#([0-9a-f]{6})$/i.exec(v);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ================= the scenes ================= */
  // each scene: init(W, H, k) builds its actors; draw(ctx, t, W, H) paints one frame;
  // backdrop(ctx, W, H) (optional) paints the still part once per resize into a cache

  const GREEN = {
    dark: [10, 92, 51], mid: [10, 122, 66], mint: [74, 255, 160],
    init(W, H, k) {
      const n = Math.max(4, Math.round(14 * k * Math.sqrt(W * H / 1296000)));
      this.leaves = Array.from({ length: n }, () => this.leaf(W, H, true));
    },
    leaf(W, H, fresh) {
      return { x: rnd(0, W), y: fresh ? rnd(-40, H) : rnd(-60, -10), s: rnd(6, 12), rot: rnd(0, 6.3), rs: rnd(-0.012, 0.012), vy: rnd(0.22, 0.5), amp: rnd(0.25, 0.5), ph: rnd(0, 6.3), a: rnd(0.16, 0.3), t: Math.random() };
    },
    drawLeaf(ctx, x, y, s, rot, col, a, veinCol) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.beginPath(); ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.95, -s * 0.45, s * 0.95, s * 0.5, 0, s);
      ctx.bezierCurveTo(-s * 0.95, s * 0.5, -s * 0.95, -s * 0.45, 0, -s);
      ctx.fillStyle = rgba(col, a); ctx.fill();
      if (veinCol) { ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.lineTo(0, s * 0.8); ctx.strokeStyle = rgba(veinCol, a * 0.8); ctx.lineWidth = 0.8; ctx.stroke(); }
      ctx.restore();
    },
    backdrop(ctx, W, H, k) {
      // the canopy: a soft dark band along the top and a few branches hanging into the page
      const g = ctx.createLinearGradient(0, 0, 0, Math.min(180, H * 0.3));
      g.addColorStop(0, rgba(this.mid, 0.3 * k)); g.addColorStop(1, rgba(this.dark, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, Math.min(180, H * 0.3));
      const branches = Math.max(3, Math.round(W / 180));
      for (let i = 0; i < branches; i++) {
        const x0 = (i + 0.5 + rnd(-0.3, 0.3)) * (W / branches), len = rnd(110, 250) * Math.min(1, H / 700), dir = rnd(-1, 1);
        const cx1 = x0 + dir * len * 0.3, cy1 = len * 0.45, x1 = x0 + dir * len * 0.7, y1 = len;
        // taper: several strokes of shrinking width along the same curve
        for (let w = 5; w >= 1; w -= 1.3) {
          ctx.beginPath(); ctx.moveTo(x0, -6); ctx.quadraticCurveTo(cx1, cy1 * (w / 5) * 0.9 + 6, x0 + (x1 - x0) * (1 - (w - 1) / 6), y1 * (1 - (w - 1) / 6));
          ctx.strokeStyle = rgba(this.mid, 0.34 * k); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke();
        }
        // twigs and leaf clusters along the branch
        for (let j = 0; j < 4; j++) {
          const tt = 0.3 + j * 0.2, bx = (1 - tt) * (1 - tt) * x0 + 2 * (1 - tt) * tt * cx1 + tt * tt * x1, by = (1 - tt) * (1 - tt) * -6 + 2 * (1 - tt) * tt * cy1 + tt * tt * y1;
          const tx = bx + rnd(-30, 30), ty = by + rnd(6, 30);
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.strokeStyle = rgba(this.mid, 0.3 * k); ctx.lineWidth = 1.2; ctx.stroke();
          const m = 3 + Math.floor(rnd(0, 4));
          for (let q = 0; q < m; q++) this.drawLeaf(ctx, tx + rnd(-14, 14), ty + rnd(-10, 12), rnd(4, 8), rnd(0, 6.3), mix(this.mid, this.mint, rnd(0, 0.5)), 0.24 * k, null);
        }
      }
    },
    draw(ctx, t, W, H) {
      for (const l of this.leaves) {
        l.y += l.vy; l.x += Math.sin(t / 95 + l.ph) * l.amp + 0.06; l.rot += l.rs + Math.sin(t / 70 + l.ph) * 0.004;
        if (l.y > H + 30 || l.x < -40 || l.x > W + 40) Object.assign(l, this.leaf(W, H, false));
        const fade = Math.min(1, (l.y + 30) / 90);
        this.drawLeaf(ctx, l.x, l.y, l.s, l.rot, mix(this.mid, this.mint, l.t * 0.7), l.a * fade, this.dark);
      }
    }
  };

  const RED = {
    deep: [122, 4, 36], hot: [255, 77, 109], glow: [255, 140, 90],
    init(W, H, k) {
      const n = Math.max(4, Math.round(9 * k * Math.sqrt(W / 1440)));
      this.tongues = Array.from({ length: n }, () => this.tongue(W, H, true));
    },
    tongue(W, H, fresh) {
      const life = rnd(220, 380);
      return { x: rnd(0, W), y: H + 20, w: rnd(16, 40), h: rnd(50, 130) * Math.min(1, H / 700), vy: rnd(0.25, 0.5), life, max: life, age: fresh ? rnd(0, life) : 0, ph: rnd(0, 6.3), sway: rnd(0.2, 0.5) };
    },
    draw(ctx, t, W, H) {
      // a low bed of heat along the foot
      const g = ctx.createLinearGradient(0, H, 0, H - Math.min(140, H * 0.22));
      g.addColorStop(0, rgba(this.deep, 0.28 + 0.06 * Math.sin(t / 90))); g.addColorStop(1, rgba(this.deep, 0));
      ctx.fillStyle = g; ctx.fillRect(0, H - 160, W, 160);
      for (const f of this.tongues) {
        f.age += 1; f.y -= f.vy; f.x += Math.sin(t / 60 + f.ph) * f.sway;
        if (f.age > f.max) Object.assign(f, this.tongue(W, H, false));
        const p = f.age / f.max, a = Math.sin(p * Math.PI) * 0.16, hh = f.h * (1 - p * 0.55), ww = f.w * (1 - p * 0.4);
        ctx.save(); ctx.translate(f.x, f.y); ctx.scale(1, hh / ww);
        const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, ww);
        rg.addColorStop(0, rgba(this.glow, a)); rg.addColorStop(0.45, rgba(this.hot, a * 0.55)); rg.addColorStop(1, rgba(this.deep, 0));
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, ww, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  };

  const BLUE = {
    ink: [30, 58, 156], cyan: [56, 225, 255], pale: [180, 235, 255],
    init(W, H, k) {
      const n = Math.max(5, Math.round(16 * k * Math.sqrt(W * H / 1296000)));
      this.bubbles = Array.from({ length: n }, () => this.bubble(W, H, true));
      this.waves = [0, 1, 2].map((i) => ({ y: 0.58 + i * 0.14, amp: rnd(5, 9), len: rnd(170, 260), sp: rnd(0.25, 0.5) * (i % 2 ? -1 : 1), ph: rnd(0, 6.3) }));
    },
    bubble(W, H, fresh) { return { x: rnd(0, W), y: fresh ? rnd(0, H) : H + rnd(10, 40), r: rnd(2.5, 8), vy: rnd(0.22, 0.55), ph: rnd(0, 6.3), a: rnd(0.22, 0.4) }; },
    draw(ctx, t, W, H) {
      for (const w of this.waves) {
        ctx.beginPath();
        const y0 = H * w.y;
        for (let x = -10; x <= W + 10; x += 8) ctx.lineTo(x, y0 + Math.sin((x / w.len) * Math.PI * 2 + t * 0.004 * w.sp + w.ph) * w.amp);
        ctx.strokeStyle = rgba(this.cyan, 0.11); ctx.lineWidth = 1.4; ctx.stroke();
      }
      for (const b of this.bubbles) {
        b.y -= b.vy; b.x += Math.sin(t / 80 + b.ph) * 0.3;
        if (b.y < -20) Object.assign(b, this.bubble(W, H, false));
        const fade = Math.min(1, (H + 20 - b.y) / 80);
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(this.cyan, 0.04 * fade); ctx.fill();
        ctx.strokeStyle = rgba(this.pale, b.a * fade); ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.62, Math.PI * 1.05, Math.PI * 1.55);
        ctx.strokeStyle = rgba([255, 255, 255], b.a * 1.2 * fade); ctx.lineWidth = 1.1; ctx.stroke();
      }
    }
  };

  const WHITE = {
    warm: [250, 240, 220], cream: [250, 248, 242],
    init(W, H, k) {
      const nb = Math.max(3, Math.round(5 * k));
      this.beams = Array.from({ length: nb }, (_, i) => ({ x: W * (0.2 + 0.6 * (i + 0.5) / nb) + rnd(-40, 40), ang: rnd(-0.16, 0.16), w: rnd(50, 130), a: rnd(0.035, 0.06), ph: rnd(0, 6.3), sway: rnd(0.012, 0.03) }));
      const no = Math.max(3, Math.round(6 * k * Math.sqrt(W * H / 1296000)));
      this.orbs = Array.from({ length: no }, () => this.orb(W, H, true));
    },
    orb(W, H, fresh) { return { x: rnd(0, W), y: fresh ? rnd(0, H) : H + 40, r: rnd(12, 34), vy: rnd(0.06, 0.18), ph: rnd(0, 6.3), a: rnd(0.035, 0.07) }; },
    draw(ctx, t, W, H) {
      for (const b of this.beams) {
        ctx.save(); ctx.translate(b.x, -30); ctx.rotate(b.ang + Math.sin(t / 420 + b.ph) * b.sway);
        const len = H * 1.15, a = b.a * (0.7 + 0.3 * Math.sin(t / 260 + b.ph));
        for (const [ww, aa] of [[b.w, a * 0.45], [b.w * 0.6, a * 0.6], [b.w * 0.28, a]]) {
          const g = ctx.createLinearGradient(0, 0, 0, len); g.addColorStop(0, rgba(this.cream, aa)); g.addColorStop(1, rgba(this.cream, 0));
          ctx.fillStyle = g; ctx.fillRect(-ww / 2, 0, ww, len);
        }
        ctx.restore();
      }
      for (const o of this.orbs) {
        o.y -= o.vy; o.x += Math.sin(t / 140 + o.ph) * 0.15;
        if (o.y < -50) Object.assign(o, this.orb(W, H, false));
        const a = o.a * (0.75 + 0.25 * Math.sin(t / 90 + o.ph));
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r); g.addColorStop(0, rgba(this.warm, a)); g.addColorStop(1, rgba(this.warm, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
      }
    }
  };

  const BLACK = {
    fog: [140, 110, 180], wisp: [199, 125, 255],
    init(W, H, k) {
      const n = Math.max(3, Math.round(7 * k * Math.sqrt(W / 1440)));
      this.banks = Array.from({ length: n }, () => ({ x: rnd(0, W), y: H * rnd(0.55, 0.98), rx: rnd(160, 340), ry: rnd(40, 100), vx: rnd(0.06, 0.2) * (Math.random() < 0.5 ? -1 : 1), a: rnd(0.08, 0.14), ph: rnd(0, 6.3) }));
      this.wisps = Array.from({ length: Math.max(1, Math.round(3 * k)) }, () => ({ x: rnd(0, W), y: rnd(H * 0.3, H * 0.9), ph: rnd(0, 6.3), sp: rnd(0.6, 1) }));
    },
    draw(ctx, t, W, H) {
      for (const b of this.banks) {
        b.x += b.vx; if (b.x < -b.rx) b.x = W + b.rx; if (b.x > W + b.rx) b.x = -b.rx;
        const a = b.a * (0.8 + 0.2 * Math.sin(t / 200 + b.ph));
        ctx.save(); ctx.translate(b.x, b.y + Math.sin(t / 300 + b.ph) * 6); ctx.scale(1, b.ry / b.rx);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, b.rx); g.addColorStop(0, rgba(this.fog, a)); g.addColorStop(1, rgba(this.fog, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, b.rx, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      for (const w of this.wisps) {
        w.x += Math.sin(t / 170 * w.sp + w.ph) * 0.45 + Math.cos(t / 410 + w.ph) * 0.2;
        w.y += Math.cos(t / 210 * w.sp + w.ph * 1.3) * 0.3;
        if (w.x < -20) w.x = W + 20; if (w.x > W + 20) w.x = -20; w.y = Math.max(H * 0.2, Math.min(H * 0.95, w.y));
        const a = 0.28 + 0.3 * (0.5 + 0.5 * Math.sin(t / 45 + w.ph));
        const g = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, 26); g.addColorStop(0, rgba(this.wisp, a * 0.5)); g.addColorStop(1, rgba(this.wisp, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w.x, w.y, 26, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = rgba([240, 225, 255], a); ctx.beginPath(); ctx.arc(w.x, w.y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }
  };

  const COLORLESS = {
    col: [228, 228, 231],
    init(W, H, k) {
      const n = Math.max(4, Math.round(11 * k * Math.sqrt(W * H / 1296000)));
      this.shapes = Array.from({ length: n }, () => this.shape(W, H));
    },
    shape(W, H) {
      return { kind: pick(['hex', 'hex', 'ring', 'ticks', 'square', 'tri', 'dash']), x: rnd(0, W), y: rnd(0, H), r: rnd(14, 46), rot: rnd(0, 6.3), rs: rnd(-0.005, 0.005), vx: rnd(-0.06, 0.06), vy: rnd(-0.05, 0.05), a: rnd(0.05, 0.11), inner: Math.random() < 0.5 };
    },
    poly(ctx, n, r, rot) { ctx.beginPath(); for (let i = 0; i < n; i++) { const a = rot + i / n * Math.PI * 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); },
    draw(ctx, t, W, H) {
      for (const s of this.shapes) {
        s.x += s.vx; s.y += s.vy; s.rot += s.rs;
        if (s.x < -60) s.x = W + 60; if (s.x > W + 60) s.x = -60; if (s.y < -60) s.y = H + 60; if (s.y > H + 60) s.y = -60;
        ctx.save(); ctx.translate(s.x, s.y); ctx.strokeStyle = rgba(this.col, s.a); ctx.lineWidth = 1.2; ctx.setLineDash([]);
        if (s.kind === 'hex') { this.poly(ctx, 6, s.r, s.rot); ctx.stroke(); if (s.inner) { this.poly(ctx, 6, s.r * 0.55, -s.rot); ctx.stroke(); } }
        else if (s.kind === 'square') { this.poly(ctx, 4, s.r, s.rot); ctx.stroke(); if (s.inner) { this.poly(ctx, 4, s.r * 0.6, s.rot + 0.78); ctx.stroke(); } }
        else if (s.kind === 'tri') { this.poly(ctx, 3, s.r, s.rot); ctx.stroke(); }
        else if (s.kind === 'ring') { ctx.beginPath(); ctx.arc(0, 0, s.r, 0, Math.PI * 2); ctx.stroke(); if (s.inner) { ctx.beginPath(); ctx.arc(0, 0, s.r * 0.4, 0, Math.PI * 2); ctx.stroke(); } }
        else if (s.kind === 'dash') { ctx.setLineDash([3, 7]); ctx.beginPath(); ctx.arc(0, 0, s.r, s.rot, s.rot + Math.PI * 2); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(0, 0, s.r, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 12; i++) { const a = s.rot + i / 12 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * s.r, Math.sin(a) * s.r); ctx.lineTo(Math.cos(a) * s.r * 0.85, Math.sin(a) * s.r * 0.85); ctx.stroke(); } }
        ctx.restore();
      }
    }
  };

  const SCENES = { white: WHITE, blue: BLUE, black: BLACK, red: RED, green: GREEN, colorless: COLORLESS };

  /* ================= one renderer, attached to a canvas ================= */
  // opts: k (scene density, 1 = the page), dust (dust density, 1 = the page), size() -> [W, H]
  function attach(canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    const k = opts.k ?? 1, dustK = opts.dust ?? 1;
    let parts = [], recipe, scene, W = 0, H = 0, raf = 0, dpr = 1, t = Math.floor(rnd(0, 10000)), cache = null;

    function spawn(p, fresh) {
      const r = recipe;
      p.x = rnd(0, W);
      p.y = fresh ? rnd(0, H) : (r.vy[0] > 0 ? -10 : r.vy[1] < 0 ? H + 10 : rnd(0, H));
      p.vx = rnd(r.vx[0], r.vx[1]); p.vy = rnd(r.vy[0], r.vy[1]);
      p.s = rnd(r.size[0], r.size[1]);
      p.life = p.max = rnd(r.life[0], r.life[1]) * 60;
      p.ph = Math.random() * Math.PI * 2;
      p.spark = Math.random() < (r.sparkRate || 0.06);
      return p;
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      [W, H] = opts.size ? opts.size() : [window.innerWidth, window.innerHeight];
      canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildCache();
    }
    function buildCache() {
      cache = null;
      if (!scene || !scene.backdrop || !W || !H) return;
      cache = document.createElement('canvas'); cache.width = canvas.width; cache.height = canvas.height;
      const c2 = cache.getContext('2d'); c2.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.backdrop(c2, W, H, k);
    }
    function start() {
      const profile = document.documentElement.dataset.profile || 'blue';
      recipe = Object.assign({}, RECIPES[profile] || RECIPES.blue);
      scene = Object.create(SCENES[profile] || SCENES.blue);
      if (recipe.fromToken) { const c = tokenRGB(); if (c) { recipe.color = c; recipe.spark = c.map((x) => Math.min(255, x + 40)); scene.col = c; } }
      parts = Array.from({ length: Math.round(recipe.n * dustK) }, () => spawn({}, true));
      scene.init(W, H, k);
      buildCache();
      cancelAnimationFrame(raf);
      if (!reduced.matches) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    }
    function tick() {
      t += 1;
      ctx.clearRect(0, 0, W, H);
      if (cache) ctx.drawImage(cache, 0, 0, W, H);
      scene.draw(ctx, t, W, H);
      for (const p of parts) {
        p.life -= 1;
        if (p.life <= 0) spawn(p, false);
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
        g.addColorStop(0, rgba(col, alpha * 0.5)); g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = rgba(col, alpha); ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (p.spark ? 1.3 : 0.9), 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    resize(); start();
    new MutationObserver(start).observe(document.documentElement, { attributes: true, attributeFilter: ['data-profile', 'data-accent'] });
    reduced.addEventListener?.('change', start);
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else if (!reduced.matches) raf = requestAnimationFrame(tick); });
    return { resize, start, stop: () => cancelAnimationFrame(raf) };
  }

  // the page layer: haze sheets (CSS) + one full-window canvas
  function mount() {
    if (document.querySelector('.ambience')) return;
    const layer = document.createElement('div');
    layer.className = 'ambience'; layer.setAttribute('aria-hidden', 'true');
    const hazeA = document.createElement('div'); hazeA.className = 'haze a';
    const hazeB = document.createElement('div'); hazeB.className = 'haze b';
    const canvas = document.createElement('canvas'); canvas.id = 'ambience-canvas';
    layer.append(hazeA, hazeB, canvas);
    document.body.prepend(layer);
    const r = attach(canvas, { k: 1, dust: 1 });
    window.addEventListener('resize', r.resize);
  }

  // the Menu tray's foot (round 7): the same scene at a whisper, sized to its box
  function mountFlair(el) {
    const canvas = document.createElement('canvas'); canvas.className = 'flair-canvas';
    el.append(canvas);
    const r = attach(canvas, { k: 0.45, dust: 0.35, size: () => [el.clientWidth || 320, el.clientHeight || 200] });
    if (window.ResizeObserver) new ResizeObserver(() => { r.resize(); r.start(); }).observe(el);
    return r;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  return { attach, mountFlair, SCENES, RECIPES };
})();
