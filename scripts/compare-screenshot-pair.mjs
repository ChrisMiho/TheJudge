#!/usr/bin/env node
/**
 * Pixel comparison for one build/mockup screenshot pair (ui-look-translation).
 *
 *   node scripts/compare-screenshot-pair.mjs --build <build.png> --mockup <mockup.png>
 *        [--mask <mask.json>] [--tolerance <0-255>]
 *
 * Both PNGs must be the same pixel size; otherwise the script exits non-zero and
 * prints both sizes. `--tolerance` is the per-channel difference a pixel may have
 * and still count as matching (default 0). One JSON line goes to stdout:
 *   { build, mockup, mask, tolerance, comparedPixels, maskedPixels,
 *     differingPixels, differingFraction }
 * `differingFraction` is differingPixels / comparedPixels, counting only pixels
 * inside the content box and outside every mask region.
 *
 * Mask JSON: { "contentBox": {x,y,width,height}?, "regions": [{name, reason, x, y,
 * width, height}] } in the capture's own pixels; every region needs a name and a
 * reason (card art, live data, the opaque tray, the touch floor, the mock banner).
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { PNG } from "pngjs";

export function parseArgs(argv) {
  const args = { build: null, mockup: null, mask: null, tolerance: 0 };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--build") args.build = value;
    else if (flag === "--mockup") args.mockup = value;
    else if (flag === "--mask") args.mask = value;
    else if (flag === "--tolerance") args.tolerance = Number(value);
    else throw new Error(`Unknown argument: ${flag}`);
    i += 1;
  }
  if (!args.build || !args.mockup) {
    throw new Error("Usage: compare-screenshot-pair.mjs --build <build.png> --mockup <mockup.png> [--mask <mask.json>] [--tolerance <0-255>]");
  }
  if (!Number.isFinite(args.tolerance) || args.tolerance < 0 || args.tolerance > 255) {
    throw new Error("--tolerance must be a number from 0 to 255");
  }
  return args;
}

function readPng(path) {
  return PNG.sync.read(readFileSync(path));
}

function clampBox(box, width, height) {
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(width, Math.ceil(box.x + box.width));
  const y1 = Math.min(height, Math.ceil(box.y + box.height));
  return { x0, y0, x1: Math.max(x0, x1), y1: Math.max(y0, y1) };
}

export function readMask(path) {
  const mask = JSON.parse(readFileSync(path, "utf8"));
  for (const region of mask.regions ?? []) {
    if (!region.name || !region.reason) {
      throw new Error(`Mask region needs a name and a reason: ${JSON.stringify(region)}`);
    }
  }
  return mask;
}

export function comparePngs(build, mockup, { mask = null, tolerance = 0 } = {}) {
  if (build.width !== mockup.width || build.height !== mockup.height) {
    const error = new Error(`Size mismatch: build ${build.width}x${build.height}, mockup ${mockup.width}x${mockup.height}`);
    error.code = "SIZE_MISMATCH";
    throw error;
  }
  const { width, height } = build;
  const box = clampBox(mask?.contentBox ?? { x: 0, y: 0, width, height }, width, height);
  const masked = new Uint8Array(width * height);
  for (const region of mask?.regions ?? []) {
    const r = clampBox(region, width, height);
    for (let y = r.y0; y < r.y1; y += 1) {
      for (let x = r.x0; x < r.x1; x += 1) masked[y * width + x] = 1;
    }
  }
  let compared = 0;
  let maskedPixels = 0;
  let differing = 0;
  for (let y = box.y0; y < box.y1; y += 1) {
    for (let x = box.x0; x < box.x1; x += 1) {
      if (masked[y * width + x]) {
        maskedPixels += 1;
        continue;
      }
      compared += 1;
      const i = (y * width + x) * 4;
      for (let c = 0; c < 4; c += 1) {
        if (Math.abs(build.data[i + c] - mockup.data[i + c]) > tolerance) {
          differing += 1;
          break;
        }
      }
    }
  }
  return {
    comparedPixels: compared,
    maskedPixels,
    differingPixels: differing,
    differingFraction: compared === 0 ? 0 : differing / compared
  };
}

export function run(argv) {
  const args = parseArgs(argv);
  const mask = args.mask ? readMask(args.mask) : null;
  const result = comparePngs(readPng(args.build), readPng(args.mockup), { mask, tolerance: args.tolerance });
  return {
    build: args.build,
    mockup: args.mockup,
    mask: args.mask,
    tolerance: args.tolerance,
    ...result
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.stdout.write(`${JSON.stringify(run(process.argv.slice(2)))}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}
