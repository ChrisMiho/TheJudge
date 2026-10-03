/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import type { Palette } from "../lib/theme/palettes";

export type AmbientSceneProps = {
  /** The active profile's motif id (REQ-201); kept for the page/tray hook and the data attribute. */
  motif: Palette["motif"];
  /**
   * "page" (default): the full-strength scene behind every page (the mockup's
   * `.ambience` layer: two haze sheets, the colour's badge, and one fixed
   * canvas). "tray": the Menu tray's own whisper-strength copy, playing at a
   * lower density behind the destination rows (the mockup's `.tray-flair`).
   */
  variant?: "page" | "tray";
};

type AttachOptions = { k?: number; dust?: number; tray?: boolean; adaptive?: boolean; size?: () => [number, number] };

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Same seed every time under reduced motion, so the one painted still frame is
 * identical run to run (the pixel comparison in the build-screenshot pairs
 * depends on it); animated scenes keep `Math.random`.
 */
const STILL_FRAME_SEED = 20261002;

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

let random: () => number = Math.random;

function reducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(REDUCED_QUERY).matches;
}

/*
 * Adaptive fallback for weak hardware. The full-screen scene is GPU paint/
 * composite-bound, not JS-bound — smooth on a strong GPU, "lag central" on a
 * weak one — and no amount of thinning the scene changes that. So after the
 * loop starts we sample ~1.2s of real frame times: if the machine cannot hold
 * ~45fps for the majority of that window, the loop freezes to one still frame
 * (the same resting look reduced-motion gets) instead of animating a janky one.
 */
const PROBE_SLOW_MS = 22; // a frame slower than ~45fps
const PROBE_MIN_SAMPLES = 20; // need a real window; ignore startup jank
const PROBE_SLOW_FRACTION = 0.5; // majority of the window must be slow
const PROBE_WINDOW_MS = 1200;

export function shouldFallbackToStatic(frameDurationsMs: number[]): boolean {
  if (frameDurationsMs.length < PROBE_MIN_SAMPLES) return false;
  const slow = frameDurationsMs.filter((d) => d > PROBE_SLOW_MS).length;
  return slow / frameDurationsMs.length > PROBE_SLOW_FRACTION;
}

/*
 * The renderer below is `ambience.js` from the direction-1 mockup, ported
 * unchanged (NFR-006: the one hand-written canvas renderer, no library): the
 * dust and each colour's element (white beams, blue runes, black fog, red heat,
 * green canopy and leaves, colorless shapes), drawn on one canvas. Its colour
 * values are the mockup's own, kept here and keyed by profile so a Theme change
 * restarts it (the file is exempt from the REQ-216 audit for that reason).
 * Differences from the mockup: it paints one still frame under reduced motion
 * instead of nothing, and it is torn down when the component unmounts.
 */
const AMBIENCE = (() => {
  const RECIPES: any = {
    white:     { n: 70,  color: [250, 248, 242], spark: [255, 255, 255], size: [0.5, 1.8], vx: [-0.03, 0.03], vy: [-0.1, -0.03], twinkle: 0.5, life: [12, 22] },
    blue:      { n: 70,  color: [120, 200, 255], spark: [56, 225, 255],  size: [0.5, 1.7], vx: [-0.06, 0.06], vy: [-0.05, 0.05], twinkle: 0.7, life: [10, 20], current: true, links: 120 },
    black:     { n: 90,  color: [190, 150, 235], spark: [222, 170, 255], size: [0.6, 2.1], vx: [-0.05, 0.05], vy: [0.03, 0.1],    twinkle: 0.6,  life: [12, 22], sparkRate: 0.22 },
    red:       { n: 80,  color: [255, 150, 120], spark: [255, 214, 102], size: [0.5, 1.8], vx: [-0.05, 0.05], vy: [-0.14, -0.05], twinkle: 0.8, life: [9, 18], sparkRate: 0.14 },
    green:     { n: 60,  color: [140, 255, 190], spark: [74, 255, 160],  size: [0.5, 1.7], vx: [0.02, 0.09],  vy: [-0.03, 0.03], twinkle: 0.6, life: [12, 22] },
    colorless: { n: 60,  color: [228, 228, 231], spark: [244, 244, 245], size: [0.4, 1.4], vx: [-0.02, 0.02], vy: [0.02, 0.06],   twinkle: 0.25, life: [14, 26], fromToken: true }
  };

  const rnd = (a: number, b: number) => a + random() * (b - a);
  const pick = (a: any[]) => a[Math.floor(random() * a.length)];
  const rgba = (c: number[], a: number) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  const mix = (a: number[], b: number[], t: number) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];

  // Colorless: the live accent-soft token (a custom hex, or the fixed grey) as [r, g, b]
  function tokenRGB(): number[] | null {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--accent-soft').trim();
    const m = /^#([0-9a-f]{6})$/i.exec(v);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }


  /* ================= the scenes ================= */
  // each scene: init(W, H, k) builds its actors; draw(ctx, t, W, H) paints one frame;
  // backdrop(ctx, W, H) (optional) paints the still part once per resize into a cache

  const GREEN: any = {
    dark: [10, 92, 51], mid: [10, 122, 66], mint: [74, 255, 160], wood: [60, 150, 100],
    init(W: any, H: any, k: any) {
      const n = Math.max(7, Math.round(14 * k * Math.sqrt(W * H / 1296000)));
      this.leaves = Array.from({ length: n }, () => this.leaf(W, H, true));
    },
    leaf(W: any, H: any, fresh: any) {
      return { x: rnd(0, W), y: fresh ? rnd(-40, H) : rnd(-60, -10), s: rnd(6, 12), rot: rnd(0, 6.3), rs: rnd(-0.012, 0.012), vy: rnd(0.22, 0.5), amp: rnd(0.25, 0.5), ph: rnd(0, 6.3), a: rnd(0.16, 0.3), t: random() };
    },
    drawLeaf(ctx: any, x: any, y: any, s: any, rot: any, col: any, a: any, veinCol: any) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.beginPath(); ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.95, -s * 0.45, s * 0.95, s * 0.5, 0, s);
      ctx.bezierCurveTo(-s * 0.95, s * 0.5, -s * 0.95, -s * 0.45, 0, -s);
      ctx.fillStyle = rgba(col, a); ctx.fill();
      if (veinCol) { ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.lineTo(0, s * 0.8); ctx.strokeStyle = rgba(veinCol, a * 0.8); ctx.lineWidth = 0.8; ctx.stroke(); }
      ctx.restore();
    },
    // round 8 ("the branches hanging down are a little wonky"): limbs now grow
    // like limbs — they reach in from the top corners, arch, droop under their
    // own weight, fork into thinner twigs, and carry leaves that hang
    limb(ctx: any, x: any, y: any, ang: any, len: any, w: any, k: any, depth: any) {
      // walk the limb, bending under gravity, and keep its points; then draw the
      // wood as one tapered stroke (a dark core with a lit edge), so it reads as a
      // branch rather than a chain of beads
      const steps = Math.max(5, Math.round(len / 7));
      const bend = rnd(-0.02, 0.02);
      const forks = depth < 2 ? [Math.round(steps * rnd(0.3, 0.45)), Math.round(steps * rnd(0.6, 0.8))] : [];
      const pts = [{ x, y, w }], forkAt = [];
      for (let i = 0; i < steps; i++) {
        x += Math.cos(ang) * 7; y += Math.sin(ang) * 7;
        if (forks.includes(i)) forkAt.push({ x, y, ang: ang + (random() < 0.5 ? -1 : 1) * rnd(0.5, 0.9), len: len * rnd(0.45, 0.6), w: w * 0.6 });
        ang += bend + (Math.PI / 2 - ang) * 0.012 * (1 + depth * 0.6);
        w = Math.max(0.8, w * 0.965);
        pts.push({ x, y, w });
      }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = rgba(this.dark, (0.6 - depth * 0.08) * k); ctx.lineWidth = a.w; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = rgba(this.wood, (0.42 - depth * 0.08) * k); ctx.lineWidth = Math.max(0.6, a.w * 0.45); ctx.stroke();
      }
      for (const f of forkAt) this.limb(ctx, f.x, f.y, f.ang, f.len, f.w, k, depth + 1);
      // leaves: a few hang from the outer third of any thinner wood, and a small cluster at every tip
      if (depth >= 1) for (let i = Math.round(pts.length * 0.6); i < pts.length - 1; i += 3) {
        const p = pts[i], hang = Math.PI / 2 + rnd(-0.6, 0.6);
        this.drawLeaf(ctx, p.x + Math.cos(hang) * 9, p.y + Math.sin(hang) * 9, rnd(6, 10), hang + Math.PI / 2, mix(this.mid, this.mint, rnd(0.05, 0.35)), rnd(0.18, 0.28) * k, this.dark);
      }
      const tip = pts[pts.length - 1];
      for (let q = 0; q < 3 + Math.floor(rnd(0, 2)); q++) {
        const hang = Math.PI / 2 + rnd(-1.1, 1.1);
        this.drawLeaf(ctx, tip.x + Math.cos(hang) * rnd(5, 12), tip.y + Math.sin(hang) * rnd(5, 12), rnd(6, 10), hang + Math.PI / 2, mix(this.mid, this.mint, rnd(0.1, 0.4)), rnd(0.18, 0.28) * k, this.dark);
      }
    },
    backdrop(ctx: any, W: any, H: any, k: any) {
      // the canopy's shade: a soft band along the top
      const g = ctx.createLinearGradient(0, 0, 0, Math.min(180, H * 0.3));
      g.addColorStop(0, rgba(this.mid, 0.3 * k)); g.addColorStop(1, rgba(this.dark, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, Math.min(180, H * 0.3));
      // limbs: from just past each top corner, reaching inward and drooping;
      // a short one or two hang from the middle of the top edge
      const scale = Math.max(0.5, Math.min(1, W / 1100)) * Math.min(1, H / 700);
      // tall and narrow (the Menu tray, a phone): the limbs hang down both side
      // edges as vines, reaching into the open space below the content
      if (H > W * 1.6 && W < 520) {
        for (const side of [0, 1]) {
          for (let i = 0; i < 2; i++) {
            const x0 = side ? W + 6 : -6;
            const ang = side ? Math.PI * rnd(0.6, 0.68) : Math.PI * rnd(0.32, 0.4);
            this.limb(ctx, x0, rnd(-10, 40) + i * H * 0.28, ang, H * rnd(0.3, 0.45), rnd(5, 7), k, 0);
          }
        }
        return;
      }
      const per = W > 900 ? 3 : 2;
      for (const side of [0, 1]) {
        for (let i = 0; i < per; i++) {
          const x0 = side ? W + rnd(0, 30) - i * W * 0.07 : -rnd(0, 30) + i * W * 0.07;
          const ang = side ? Math.PI - rnd(0.05, 0.4) : rnd(0.05, 0.4);
          this.limb(ctx, x0, rnd(-10, 26) + i * 10, ang, rnd(300, 460) * scale, rnd(7, 10) * scale + 2, k, 0);
        }
      }
      if (W > 600) for (let i = 0; i < 2; i++) this.limb(ctx, W * rnd(0.3, 0.7), -8, Math.PI / 2 + rnd(-0.6, 0.6), rnd(90, 150) * scale, 4, k, 1);
    },
    draw(ctx: any, t: any, W: any, H: any) {
      for (const l of this.leaves) {
        l.y += l.vy; l.x += Math.sin(t / 95 + l.ph) * l.amp + 0.06; l.rot += l.rs + Math.sin(t / 70 + l.ph) * 0.004;
        if (l.y > H + 30 || l.x < -40 || l.x > W + 40) Object.assign(l, this.leaf(W, H, false));
        const fade = Math.min(1, (l.y + 30) / 90);
        this.drawLeaf(ctx, l.x, l.y, l.s, l.rot, mix(this.mid, this.mint, l.t * 0.7), l.a * fade, this.dark);
      }
    }
  };

  const RED: any = {
    deep: [122, 4, 36], hot: [255, 77, 109], glow: [255, 140, 90],
    init(W: any, H: any, k: any) {
      const n = Math.max(4, Math.round(9 * k * Math.sqrt(W / 1440)));
      this.tongues = Array.from({ length: n }, () => this.tongue(W, H, true));
    },
    tongue(W: any, H: any, fresh: any) {
      const life = rnd(220, 380);
      return { x: rnd(0, W), y: H + 20, w: rnd(16, 40), h: rnd(50, 130) * Math.min(1, H / 700), vy: rnd(0.25, 0.5), life, max: life, age: fresh ? rnd(0, life) : 0, ph: rnd(0, 6.3), sway: rnd(0.2, 0.5) };
    },
    draw(ctx: any, t: any, W: any, H: any) {
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

  // Blue (round 8: "more blue arcane focused" — the bubbles and the moving
  // horizontal lines are gone): runes of an invented script write themselves
  // in the air, glow, and fade as they drift up; the dust specks are threaded
  // into faint constellations (the renderer's `links`). Round 9 ("some of the
  // shapes are too large and detailed … larger shapes need to be less detailed
  // like the ones in the colorless profile"): the big shape is a plain ring —
  // one circle that inscribes itself, holds, and dissolves, with at most a
  // thin second ring inside — no rune marks, no star of chords. The runes stay
  // small. The runes are drawn for this app — no real alphabet, no Wizards glyph.
  const RUNES = [
    [[[0, -1], [0, 1]], [[-0.6, -0.4], [0, 0.1], [0.6, -0.4]]],
    [[[-0.6, -1], [0.6, -1], [0, 1]], [[-0.3, 0.2], [0.3, 0.2]]],
    [[[0, -1], [0, 1]], [[0, -0.5], [0.6, -0.9]], [[0, 0], [-0.6, 0.4]]],
    [[[-0.6, 1], [-0.6, -1], [0.6, -0.4], [-0.6, 0.2]]],
    [[[-0.6, -0.6], [0.6, -0.6]], [[0, -0.6], [0, 1]], [[-0.4, 1], [0.4, 1]]],
    [[[-0.5, -1], [0.5, 0], [-0.5, 1]], [[0.5, -1], [0.5, 1]]],
    [[[0, -1], [0.6, 0], [0, 1], [-0.6, 0], [0, -1]], [[0, -0.3], [0, 0.3]]],
    [[[-0.6, -1], [-0.6, 1], [0.6, 1]], [[-0.6, 0], [0.4, -0.6]]],
    [[[0.6, -1], [-0.2, -0.2], [0.6, 0.6]], [[-0.6, -0.2], [-0.6, 1]]],
    [[[-0.6, 0.8], [0, -1], [0.6, 0.8]], [[-0.35, 0.1], [0.35, 0.1]], [[0, 0.1], [0, 1]]]
  ];
  const BLUE: any = {
    cyan: [56, 225, 255], pale: [190, 240, 255], deep: [0, 80, 216],
    init(W: any, H: any, k: any) {
      this.k = k;
      this.maxRunes = Math.max(2, Math.round(7 * k * Math.sqrt(W * H / 1296000)));
      this.runes = [];
      this.circle = null; this.nextCircle = 120;
    },
    // a rune: writes itself (stroke by stroke), holds with a glow, fades as it rises
    rune(W: any, H: any) {
      return { g: pick(RUNES), x: rnd(0.04, 0.96) * W, y: rnd(0.12, 0.95) * H, s: rnd(7, 13), rot: rnd(-0.25, 0.25), age: 0, write: rnd(90, 150), hold: rnd(160, 300), fade: rnd(160, 240), vy: rnd(0.04, 0.12) };
    },
    // the ring sits in open space: the side gutters on a wide screen, low on a phone or in the tray
    spellCircle(W: any, H: any) {
      const col = Math.min(768, W * 0.92), gutter = (W - col) / 2;
      const wide = gutter > 150;
      const r = wide ? Math.min(gutter * 0.5, H * 0.16, 110) : Math.min(W * 0.26, 90);
      const x = wide ? (random() < 0.5 ? gutter / 2 : W - gutter / 2) : rnd(0.25, 0.75) * W;
      const y = wide ? rnd(0.3, 0.78) * H : rnd(0.7, 0.9) * H;
      return { x, y, r, age: 0, draw: 260, hold: 600, fade: 260, rot: rnd(0, 6.3), inner: random() < 0.5 };
    },
    strokeRune(ctx: any, g: any, x: any, y: any, s: any, rot: any, prog: any) {
      // prog 0..1 across all of the rune's strokes
      const segs = [];
      for (const line of g) for (let i = 1; i < line.length; i++) segs.push([line[i - 1], line[i]]);
      const shown = prog * segs.length;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
      segs.forEach(([a, b], i) => {
        if (i >= shown) return;
        const f = Math.min(1, shown - i);
        ctx.moveTo(a[0] * s, a[1] * s); ctx.lineTo((a[0] + (b[0] - a[0]) * f) * s, (a[1] + (b[1] - a[1]) * f) * s);
      });
      ctx.stroke(); ctx.restore();
    },
    draw(ctx: any, t: any, W: any, H: any) {
      if (this.runes.length < this.maxRunes && random() < 0.012) this.runes.push(this.rune(W, H));
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      this.runes = this.runes.filter((r: any) => {
        r.age += 1; r.y -= r.vy;
        const end = r.write + r.hold + r.fade;
        if (r.age > end) return false;
        const prog = Math.min(1, r.age / r.write);
        const a = r.age < r.write + r.hold ? 1 : 1 - (r.age - r.write - r.hold) / r.fade;
        ctx.shadowColor = rgba(this.cyan, 0.8 * a); ctx.shadowBlur = 10;
        ctx.strokeStyle = rgba(this.pale, 0.34 * a); ctx.lineWidth = 1.3;
        this.strokeRune(ctx, r.g, r.x, r.y, r.s, r.rot, prog);
        return true;
      });
      ctx.shadowBlur = 0;
      // the ring (round 9, plain): inscribe (the arc grows), hold and breathe, dissolve
      if (!this.circle && --this.nextCircle <= 0) this.circle = this.spellCircle(W, H);
      const c = this.circle;
      if (c) {
        c.age += 1;
        const end = c.draw + c.hold + c.fade;
        if (c.age > end) { this.circle = null; this.nextCircle = rnd(240, 600); return; }
        const p = Math.min(1, c.age / c.draw);
        const a = (c.age < c.draw + c.hold ? 1 : 1 - (c.age - c.draw - c.hold) / c.fade) * (0.85 + 0.15 * Math.sin(t / 70));
        const turn = c.rot + t * 0.0006;
        ctx.save(); ctx.translate(c.x, c.y);
        ctx.shadowColor = rgba(this.cyan, 0.6 * a); ctx.shadowBlur = 8;
        ctx.strokeStyle = rgba(this.pale, 0.16 * a); ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.arc(0, 0, c.r, turn, turn + p * Math.PI * 2); ctx.stroke();
        if (c.inner) { ctx.strokeStyle = rgba(this.pale, 0.09 * a); ctx.beginPath(); ctx.arc(0, 0, c.r * 0.7, -turn, -turn - p * Math.PI * 2, true); ctx.stroke(); }
        ctx.restore(); ctx.shadowBlur = 0;
      }
    }
  };

  const WHITE: any = {
    warm: [250, 240, 220], cream: [250, 248, 242],
    init(W: any, H: any, k: any) {
      const nb = Math.max(3, Math.round(5 * k));
      this.beams = Array.from({ length: nb }, (_, i) => ({ x: W * (0.2 + 0.6 * (i + 0.5) / nb) + rnd(-40, 40), ang: rnd(-0.16, 0.16), w: rnd(50, 130), a: rnd(0.035, 0.06), ph: rnd(0, 6.3), sway: rnd(0.012, 0.03) }));
      const no = Math.max(3, Math.round(6 * k * Math.sqrt(W * H / 1296000)));
      this.orbs = Array.from({ length: no }, () => this.orb(W, H, true));
    },
    orb(W: any, H: any, fresh: any) { return { x: rnd(0, W), y: fresh ? rnd(0, H) : H + 40, r: rnd(12, 34), vy: rnd(0.06, 0.18), ph: rnd(0, 6.3), a: rnd(0.035, 0.07) }; },
    draw(ctx: any, t: any, W: any, H: any) {
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

  // Black (round 8: "kinda generic … better than just an ombré background"):
  // the fog and the wandering orbs stay; the still part now has a shape —
  // thorned brambles creeping in from both lower corners and a pale crescent
  // moon, veiled, high in the open space.
  const BLACK: any = {
    fog: [140, 110, 180], wisp: [199, 125, 255], vine: [124, 58, 237], moon: [226, 212, 255],
    bramble(ctx: any, x0: any, y0: any, dir: any, len: any, w: any, k: any, depth: any) {
      // one curling stem: a run of short segments that bends as it goes, thorns along it
      let x = x0, y = y0, ang = dir, width = w;
      const bend = rnd(0.012, 0.03) * (random() < 0.5 ? -1 : 1);
      const steps = Math.round(len / 6);
      ctx.lineCap = 'round';
      for (let i = 0; i < steps; i++) {
        const nx = x + Math.cos(ang) * 6, ny = y + Math.sin(ang) * 6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny);
        ctx.strokeStyle = rgba(this.vine, (0.62 - 0.3 * i / steps) * k); ctx.lineWidth = width; ctx.stroke();
        if (i % 3 === 0) { ctx.strokeStyle = rgba(this.wisp, (0.22 - 0.12 * i / steps) * k); ctx.lineWidth = Math.max(0.5, width * 0.35); ctx.stroke(); }
        if (i % 4 === 2 && i < steps - 2) {
          // a thorn: a small hooked triangle off one side
          const side = i % 8 === 2 ? 1 : -1, ta = ang + side * 1.1, tl = 3 + width * 1.6;
          ctx.beginPath(); ctx.moveTo(nx + Math.cos(ang) * 2, ny + Math.sin(ang) * 2); ctx.lineTo(nx + Math.cos(ta) * tl, ny + Math.sin(ta) * tl); ctx.lineTo(nx - Math.cos(ang) * 2, ny - Math.sin(ang) * 2);
          ctx.fillStyle = rgba(this.wisp, 0.5 * k); ctx.fill();
        }
        if (depth < 2 && i > steps * 0.3 && i % 9 === 4) this.bramble(ctx, nx, ny, ang + (random() < 0.5 ? -0.9 : 0.9), len * 0.35, width * 0.6, k, depth + 1);
        x = nx; y = ny; ang += bend + Math.sin(i / 5) * 0.012; width = Math.max(0.6, width * 0.985);
      }
    },
    backdrop(ctx: any, W: any, H: any, k: any) {
      const col = Math.min(768, W * 0.92), gutter = (W - col) / 2, wide = gutter > 150;
      // brambles: a few stems from each lower corner, reaching up and in
      const reach = Math.min(W * 0.42, 560) * (wide ? 1 : 0.85);
      for (const side of [0, 1]) {
        const x0 = side ? W + 4 : -4, n = wide ? 5 : 3;
        for (let i = 0; i < n; i++) {
          const up = -Math.PI / 2 + (side ? -1 : 1) * rnd(0.3, 1.15);
          this.bramble(ctx, x0, H + 4 - rnd(0, H * 0.22), up, reach * rnd(0.6, 1), rnd(2.6, 4.2), k, 0);
        }
        // a couple more creep in along the top corners, hanging down
        if (wide) for (let i = 0; i < 2; i++) this.bramble(ctx, side ? W + 4 : -4, rnd(H * 0.05, H * 0.25), side ? Math.PI + rnd(-0.5, 0.2) : rnd(-0.2, 0.5), reach * rnd(0.35, 0.6), rnd(2, 3), k, 0);
      }
      // the moon: a crescent in the open space, behind a veil of its own light
      const r = wide ? Math.min(46, gutter * 0.18) : 26;
      const mx = wide ? W - gutter / 2 + gutter * 0.12 : W - 44, my = wide ? H * 0.2 : 118;
      const halo = ctx.createRadialGradient(mx - r * 0.3, my, r * 0.4, mx, my, r * 3.6);
      halo.addColorStop(0, rgba(this.wisp, 0.12 * k)); halo.addColorStop(1, rgba(this.wisp, 0));
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, r * 4, 0, Math.PI * 2); ctx.fill();
      const m = document.createElement('canvas'); m.width = m.height = Math.ceil(r * 2 + 4);
      const mc = m.getContext('2d') as CanvasRenderingContext2D;
      mc.filter = 'blur(0.8px)'; mc.fillStyle = rgba(this.moon, 0.32 * k); mc.beginPath(); mc.arc(r + 2, r + 2, r, 0, Math.PI * 2); mc.fill();
      mc.globalCompositeOperation = 'destination-out';
      mc.beginPath(); mc.arc(r + 2 + r * 0.38, r + 2 - r * 0.2, r * 0.92, 0, Math.PI * 2); mc.fill();
      ctx.drawImage(m, mx - r - 2, my - r - 2);
    },
    init(W: any, H: any, k: any) {
      const n = Math.max(3, Math.round(7 * k * Math.sqrt(W / 1440)));
      this.banks = Array.from({ length: n }, () => ({ x: rnd(0, W), y: H * rnd(0.55, 0.98), rx: rnd(160, 340), ry: rnd(40, 100), vx: rnd(0.06, 0.2) * (random() < 0.5 ? -1 : 1), a: rnd(0.08, 0.14), ph: rnd(0, 6.3) }));
      this.wisps = Array.from({ length: Math.max(1, Math.round(3 * k)) }, () => ({ x: rnd(0, W), y: rnd(H * 0.3, H * 0.9), ph: rnd(0, 6.3), sp: rnd(0.6, 1) }));
    },
    draw(ctx: any, t: any, W: any, H: any) {
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

  const COLORLESS: any = {
    col: [228, 228, 231],
    init(W: any, H: any, k: any) {
      const n = Math.max(4, Math.round(11 * k * Math.sqrt(W * H / 1296000)));
      this.shapes = Array.from({ length: n }, () => this.shape(W, H));
    },
    shape(W: any, H: any) {
      return { kind: pick(['hex', 'hex', 'ring', 'ticks', 'square', 'tri', 'dash']), x: rnd(0, W), y: rnd(0, H), r: rnd(14, 46), rot: rnd(0, 6.3), rs: rnd(-0.005, 0.005), vx: rnd(-0.06, 0.06), vy: rnd(-0.05, 0.05), a: rnd(0.05, 0.11), inner: random() < 0.5 };
    },
    poly(ctx: any, n: any, r: any, rot: any) { ctx.beginPath(); for (let i = 0; i < n; i++) { const a = rot + i / n * Math.PI * 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); },
    draw(ctx: any, _t: any, W: any, H: any) {
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

  // the Menu tray (round 9: "the blue profile side menu still has bubbles
  // floating around instead of the new abstract things"): every colour's tray
  // plays the same scene as its page — Blue's runes and ring included. Round
  // 8's bubbles-and-wave tray scene is gone.
  const SCENES: any = { white: WHITE, blue: BLUE, black: BLACK, red: RED, green: GREEN, colorless: COLORLESS };
  // round 10 ("the colorless profile tray really lacks animation, or they're
  // invisible?"): at tray size the page recipe gave Colorless four shapes at
  // 5–11% — nothing to see. The tray gets a fuller scatter of smaller shapes,
  // drawn a shade brighter and turning a touch faster; still the quietest tray.
  const TRAY_SCENES: any = {
    colorless: Object.assign(Object.create(COLORLESS), {
      shapes: [] as any[],
      init(W: any, H: any, k: any) {
        const n = Math.max(12, Math.round(30 * k * Math.sqrt(W * H / 1296000)));
        this.shapes = Array.from({ length: n }, () => this.shape(W, H));
      },
      shape(W: any, H: any) {
        const s = COLORLESS.shape(W, H);
        s.r = rnd(8, 30); s.a = rnd(0.16, 0.3); s.rs = rnd(-0.008, 0.008);
        return s;
      }
    })
  };

  /* ================= one renderer, attached to a canvas ================= */
  // opts: k (scene density, 1 = the page), dust (dust density, 1 = the page), size() -> [W, H]
  function attach(canvas: HTMLCanvasElement, opts: AttachOptions = {}) {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    const k = opts.k ?? 1, dustK = opts.dust ?? 1, adaptive = opts.adaptive ?? false;
    let parts: any[] = [], recipe: any, scene: any, W = 0, H = 0, raf = 0, dpr = 1, t = 0, cache: HTMLCanvasElement | null = null;
    // adaptive-fallback probe (see shouldFallbackToStatic): sampled after start()
    let probeDone = false, probeStart = 0, probeLast = 0;
    const probeSamples: number[] = [];

    function spawn(p: any, fresh: boolean) {
      const r = recipe;
      p.x = rnd(0, W);
      p.y = fresh ? rnd(0, H) : (r.vy[0] > 0 ? -10 : r.vy[1] < 0 ? H + 10 : rnd(0, H));
      p.vx = rnd(r.vx[0], r.vx[1]); p.vy = rnd(r.vy[0], r.vy[1]);
      p.s = rnd(r.size[0], r.size[1]);
      p.life = p.max = rnd(r.life[0], r.life[1]) * 60;
      p.ph = random() * Math.PI * 2;
      p.spark = random() < (r.sparkRate || 0.06);
      return p;
    }
    function resize() {
      // Cap at 1.5, not 2: the full-screen canvas is re-rastered every frame,
      // so its cost scales with dpr². 1.5 cuts that ~45% on 2x+ displays; the
      // scene is soft and blended, so the sharpness drop is not noticeable.
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      [W, H] = opts.size ? opts.size() : [window.innerWidth, window.innerHeight];
      canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildCache();
    }
    function buildCache() {
      cache = null;
      if (!scene || !scene.backdrop || !W || !H) return;
      cache = document.createElement('canvas'); cache.width = canvas.width; cache.height = canvas.height;
      const c2 = cache.getContext('2d') as CanvasRenderingContext2D; c2.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.backdrop(c2, W, H, k);
    }
    function start() {
      probeDone = false; probeStart = 0; probeLast = 0; probeSamples.length = 0;
      random = reducedMotion() ? seededRandom(STILL_FRAME_SEED) : Math.random;
      t = Math.floor(rnd(0, 10000));
      const profile = document.documentElement.dataset.profile || 'blue';
      recipe = Object.assign({}, RECIPES[profile] || RECIPES.blue);
      scene = Object.create((opts.tray && TRAY_SCENES[profile]) || SCENES[profile] || SCENES.blue);
      if (recipe.fromToken) { const c = tokenRGB(); if (c) { recipe.color = c; recipe.spark = c.map((x) => Math.min(255, x + 40)); scene.col = c; } }
      parts = Array.from({ length: Math.round(recipe.n * dustK) }, () => spawn({}, true));
      scene.init(W, H, k);
      buildCache();
      cancelAnimationFrame(raf);
      if (!reducedMotion()) raf = requestAnimationFrame(() => tick());
      else { ctx.clearRect(0, 0, W, H); tick(true); }
    }
    function tick(once?: boolean | number) {
      // Adaptive fallback: while probing, time real frames; if the machine
      // can't keep up, draw THIS frame as usual but stop the loop so it rests
      // on a still image rather than animating a janky one.
      let freeze = false;
      if (adaptive && !probeDone && once !== true) {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (probeStart === 0) { probeStart = now; probeLast = now; }
        else {
          probeSamples.push(now - probeLast); probeLast = now;
          if (now - probeStart >= PROBE_WINDOW_MS && probeSamples.length >= PROBE_MIN_SAMPLES) {
            probeDone = true;
            freeze = shouldFallbackToStatic(probeSamples);
          }
        }
      }
      t += 1;
      ctx.clearRect(0, 0, W, H);
      if (cache) ctx.drawImage(cache, 0, 0, W, H);
      scene.draw(ctx, t, W, H);
      // Blue (round 8): specks near each other are threaded into faint constellations
      if (recipe.links && !opts.tray) {
        const L = recipe.links * Math.min(1, 0.6 + 0.4 * k), L2 = L * L;
        ctx.lineWidth = 0.7;
        for (let i = 0; i < parts.length; i++) {
          const a = parts[i];
          for (let j = i + 1; j < parts.length; j++) {
            const b = parts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
            if (d2 > L2) continue;
            const fa = Math.min(1, a.life / 90, (a.max - a.life) / 90), fb = Math.min(1, b.life / 90, (b.max - b.life) / 90);
            ctx.strokeStyle = rgba(recipe.color, 0.16 * (1 - Math.sqrt(d2) / L) * fa * fb);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
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
      if (once !== true && !freeze) raf = requestAnimationFrame(() => tick());
    }
    resize(); start();
    const observer = new MutationObserver(() => start());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-profile', 'data-accent'] });
    const reducedQuery = typeof window.matchMedia === 'function' ? window.matchMedia(REDUCED_QUERY) : null;
    const onReducedChange = () => start();
    reducedQuery?.addEventListener?.('change', onReducedChange);
    const onVisibility = () => { if (document.hidden) cancelAnimationFrame(raf); else if (!reducedMotion()) raf = requestAnimationFrame(() => tick()); };
    document.addEventListener('visibilitychange', onVisibility);
    return {
      resize,
      start,
      stop: () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        reducedQuery?.removeEventListener?.('change', onReducedChange);
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }

  return { attach };
})();

export function AmbientScene({ motif, variant = "page" }: AmbientSceneProps): JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root || typeof canvas.getContext !== "function" || !canvas.getContext("2d")) {
      return undefined;
    }
    if (variant === "tray") {
      const scene = AMBIENCE.attach(canvas, {
        k: 0.7,
        dust: 0.45,
        tray: true,
        size: () => [root.clientWidth || 320, root.clientHeight || 200]
      });
      const refit = () => {
        scene.resize();
        scene.start();
      };
      if (typeof ResizeObserver === "undefined") {
        window.addEventListener("resize", refit);
        return () => {
          window.removeEventListener("resize", refit);
          scene.stop();
        };
      }
      const resize = new ResizeObserver(refit);
      resize.observe(root);
      return () => {
        resize.disconnect();
        scene.stop();
      };
    }
    // Half density: k/dust 1 -> 0.5 halves the scene elements and the drifting
    // dust particles drawn every frame. Keeps the look, ~halves the draw cost.
    // adaptive: weak GPUs that can't hold the frame rate rest on a still frame.
    const scene = AMBIENCE.attach(canvas, { k: 0.5, dust: 0.5, adaptive: true });
    window.addEventListener("resize", scene.resize);
    return () => {
      window.removeEventListener("resize", scene.resize);
      scene.stop();
    };
  }, [variant]);

  if (variant === "tray") {
    return (
      <div ref={rootRef} aria-hidden="true" data-testid="ambient-scene" data-motif={motif} data-variant="tray" className="tray-flair">
        <canvas ref={canvasRef} className="flair-canvas" />
      </div>
    );
  }

  return (
    <div ref={rootRef} aria-hidden="true" data-testid="ambient-scene" data-motif={motif} data-variant="page" className="ambience">
      <div className="haze a" />
      <div className="haze b" />
      <canvas ref={canvasRef} id="ambience-canvas" />
    </div>
  );
}
