// Geometry-only simulation, not a browser rendering or performance benchmark.
// Compare identical uniform node samples at current and proposed link ranges.
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../../apps/frontend/src/components/AmbientScene.tsx', import.meta.url), 'utf8');
if (!/blue:\s*\{ n: 70,/.test(source) || !source.includes('links: 120') || !source.includes('{ k: 0.5, dust: 0.5, adaptive: true }')) {
  throw new Error('Renderer baseline changed; re-read its particle count and range.');
}

const count = 35;
const currentRange = 120 * (0.6 + 0.4 * 0.5);
const samples = 5000;
let state = 20261005;
function random() {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 4294967296;
}

function measure(points, range) {
  const parent = points.map((_, i) => i);
  const degree = points.map(() => 0);
  function root(i) {
    while (parent[i] !== i) i = parent[i];
    return i;
  }
  let links = 0;
  let strength = 0;
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const distance = Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1]);
      if (distance > range) continue;
      links++;
      strength += 1 - distance / range;
      degree[i]++;
      degree[j]++;
      parent[root(i)] = root(j);
    }
  }
  const sizes = new Map();
  for (let i = 0; i < count; i++) sizes.set(root(i), (sizes.get(root(i)) ?? 0) + 1);
  return [links, degree.filter(d => d === 0).length, [...sizes.values()].filter(n => n >= 3).length, strength];
}

const rows = [];
for (const [width, height] of [[390, 844], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440]]) {
  // Proposal only: keep phone/tablet unchanged; expand desktop search distance.
  const proposedRange = width < 1024 ? currentRange : Math.min(240, currentRange * Math.sqrt(width * height / (390 * 844)));
  const sums = [Array(4).fill(0), Array(4).fill(0)];
  for (let s = 0; s < samples; s++) {
    const points = Array.from({ length: count }, () => [random() * width, random() * height]);
    for (const [i, range] of [currentRange, proposedRange].entries()) {
      const result = measure(points, range);
      result.forEach((value, metric) => sums[i][metric] += value);
    }
  }
  for (const [i, mode] of ['current', 'proposed'].entries()) {
    const average = sums[i].map(v => Number((v / samples).toFixed(2)));
    rows.push({ viewport: `${width}x${height}`, mode, range: Number((i ? proposedRange : currentRange).toFixed(1)), links: average[0], isolatedNodes: average[1], groupsOfAtLeastThree: average[2], distanceWeightedLinks: average[3] });
  }
}
console.table(rows);
console.log('5000 uniform layouts per viewport. Fades, drift, panel occlusion, and frame rate excluded.');
