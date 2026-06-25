import { detectCardCorners } from "./detector"
import manifestJson from "./__fixtures__/detector/manifest.json"
import type { RgbImage } from "./types"

type Rgb = [number, number, number]
type QuadTuple = [[number, number], [number, number], [number, number], [number, number]]

type Degradation =
  | { kind: "none" }
  | { kind: "glare"; center: [number, number]; radius: number; strength: number }
  | { kind: "lowContrastNoise"; amplitude: number }
  | { kind: "shadowGradient"; strength: number }
  | { kind: "foilStripes"; stripeCount: number; strength: number }

export type DetectorFixtureManifestEntry = {
  id: string
  conditionClass: string
  source: "synthetic"
  provenance: string
  generation: {
    seed: number
    frameWidth: number
    frameHeight: number
    surfaceRgb: Rgb
    borderRgb: Rgb
    artRgb: Rgb
    quad: QuadTuple
    degradation: Degradation
  }
}

export type DetectorFixtureManifest = {
  schemaVersion: 1
  notes: string
  fixtures: DetectorFixtureManifestEntry[]
}

export type DetectorFixture = {
  id: string
  conditionClass: string
  image: RgbImage
  manifestEntry: DetectorFixtureManifestEntry
}

export type DetectorFixtureEvalResult = {
  id: string
  conditionClass: string
  detected: boolean
}

export type DetectorFixtureEvalReport = {
  total: number
  detected: number
  detectRate: number
  results: DetectorFixtureEvalResult[]
}

type Point = { x: number; y: number }

const manifest = manifestJson as DetectorFixtureManifest

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function hashNoise(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h = (h ^ (h >>> 16)) >>> 0
  return h / 0xffffffff
}

function noisyRgb(rgb: Rgb, x: number, y: number, seed: number, amplitude: number): Rgb {
  return rgb.map((channel, index) => clampByte(channel + (hashNoise(x, y, seed + index * 17) - 0.5) * amplitude)) as Rgb
}

function toPoints(quad: QuadTuple): Point[] {
  return quad.map(([x, y]) => ({ x, y }))
}

function insetQuad(quad: Point[], amount: number): Point[] {
  const center = quad.reduce<Point>((sum, p) => ({ x: sum.x + p.x / quad.length, y: sum.y + p.y / quad.length }), {
    x: 0,
    y: 0
  })
  return quad.map((p) => ({ x: p.x + (center.x - p.x) * amount, y: p.y + (center.y - p.y) * amount }))
}

function cross(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

function insideConvexQuad(point: Point, quad: Point[]): boolean {
  let sawPositive = false
  let sawNegative = false
  for (let i = 0; i < quad.length; i++) {
    const value = cross(quad[i], quad[(i + 1) % quad.length], point)
    sawPositive ||= value > 0
    sawNegative ||= value < 0
    if (sawPositive && sawNegative) return false
  }
  return true
}

function setPixel(data: Uint8Array, width: number, x: number, y: number, rgb: Rgb): void {
  const offset = (y * width + x) * 3
  data[offset] = rgb[0]
  data[offset + 1] = rgb[1]
  data[offset + 2] = rgb[2]
}

function getPixel(data: Uint8Array, width: number, x: number, y: number): Rgb {
  const offset = (y * width + x) * 3
  return [data[offset], data[offset + 1], data[offset + 2]]
}

function applyGlare(image: RgbImage, center: [number, number], radius: number, strength: number): void {
  const [cx, cy] = center
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const distance = Math.hypot(x - cx, y - cy)
      if (distance > radius) continue
      const mix = (1 - distance / radius) * strength
      const current = getPixel(image.data, image.width, x, y)
      setPixel(
        image.data,
        image.width,
        x,
        y,
        current.map((channel) => clampByte(channel * (1 - mix) + 255 * mix)) as Rgb
      )
    }
  }
}

function applyLowContrastNoise(image: RgbImage, seed: number, amplitude: number): void {
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const current = getPixel(image.data, image.width, x, y)
      setPixel(image.data, image.width, x, y, noisyRgb(current, x, y, seed, amplitude))
    }
  }
}

function applyShadowGradient(image: RgbImage, strength: number): void {
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const gradient = 1 - strength * ((x / Math.max(1, image.width - 1)) * 0.6 + (y / Math.max(1, image.height - 1)) * 0.4)
      const current = getPixel(image.data, image.width, x, y)
      setPixel(
        image.data,
        image.width,
        x,
        y,
        current.map((channel) => clampByte(channel * gradient)) as Rgb
      )
    }
  }
}

function applyFoilStripes(image: RgbImage, quad: Point[], stripeCount: number, strength: number): void {
  const inner = insetQuad(quad, 0.16)
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      if (!insideConvexQuad({ x, y }, inner)) continue
      const wave = (Math.sin(((x + y * 0.65) / image.width) * Math.PI * stripeCount) + 1) / 2
      if (wave < 0.62) continue
      const current = getPixel(image.data, image.width, x, y)
      const mix = (wave - 0.62) * strength
      setPixel(
        image.data,
        image.width,
        x,
        y,
        [clampByte(current[0] + 100 * mix), clampByte(current[1] + 145 * mix), clampByte(current[2] + 185 * mix)]
      )
    }
  }
}

function applyDegradation(image: RgbImage, entry: DetectorFixtureManifestEntry, outerQuad: Point[]): void {
  const { degradation } = entry.generation
  if (degradation.kind === "glare") {
    applyGlare(image, degradation.center, degradation.radius, degradation.strength)
  } else if (degradation.kind === "lowContrastNoise") {
    applyLowContrastNoise(image, entry.generation.seed, degradation.amplitude)
  } else if (degradation.kind === "shadowGradient") {
    applyShadowGradient(image, degradation.strength)
  } else if (degradation.kind === "foilStripes") {
    applyFoilStripes(image, outerQuad, degradation.stripeCount, degradation.strength)
  }
}

export function loadDetectorFixtureManifest(): DetectorFixtureManifest {
  return manifest
}

export function generateDetectorFixtureImage(entry: DetectorFixtureManifestEntry): RgbImage {
  const { frameWidth, frameHeight, surfaceRgb, borderRgb, artRgb, seed } = entry.generation
  const outerQuad = toPoints(entry.generation.quad)
  const innerQuad = insetQuad(outerQuad, 0.1)
  const data = new Uint8Array(frameWidth * frameHeight * 3)

  for (let y = 0; y < frameHeight; y++) {
    for (let x = 0; x < frameWidth; x++) {
      let rgb = noisyRgb(surfaceRgb, x, y, seed, 3)
      const point = { x, y }
      if (insideConvexQuad(point, outerQuad)) rgb = noisyRgb(borderRgb, x, y, seed + 1000, 4)
      if (insideConvexQuad(point, innerQuad)) rgb = noisyRgb(artRgb, x, y, seed + 2000, 24)
      setPixel(data, frameWidth, x, y, rgb)
    }
  }

  const image = { width: frameWidth, height: frameHeight, data }
  applyDegradation(image, entry, outerQuad)
  return image
}

export function loadDetectorFixtures(): DetectorFixture[] {
  return manifest.fixtures.map((entry) => ({
    id: entry.id,
    conditionClass: entry.conditionClass,
    image: generateDetectorFixtureImage(entry),
    manifestEntry: entry
  }))
}

export function evaluateDetectorFixtures(fixtures: DetectorFixture[] = loadDetectorFixtures()): DetectorFixtureEvalReport {
  const results = fixtures.map<DetectorFixtureEvalResult>((fixture) => ({
    id: fixture.id,
    conditionClass: fixture.conditionClass,
    detected: detectCardCorners(fixture.image) !== null
  }))
  const detected = results.filter((result) => result.detected).length
  return {
    total: results.length,
    detected,
    detectRate: results.length === 0 ? 0 : detected / results.length,
    results
  }
}
