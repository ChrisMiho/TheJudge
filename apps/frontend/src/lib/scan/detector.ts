import type { Plane, RgbImage } from "./types"

export const CARD_WIDTH = 745
export const CARD_HEIGHT = 1040
export const CARD_ASPECT_RATIO = CARD_HEIGHT / CARD_WIDTH

export const ASPECT_TOLERANCE = 0.35
export const SOLIDITY_MIN = 0.65
export const RECTANGULARITY_MIN = 0.7
export const CANNY_LO = 30
export const CANNY_HI = 90
export const LOW_CONTRAST_CANNY_LO = 18
export const LOW_CONTRAST_CANNY_HI = 42
export const MIN_AREA_FRAC = 0.05
export const MAX_AREA_FRAC = 0.95

// Corner detection runs the full pure-JS CV pipeline per frame; on full-res
// phone captures that is slow and the warp jitters frame-to-frame. Detect on a
// frame downscaled so its longest side is at most this many px (a no-op for
// frames already at or below it), then scale corners back and warp from the
// FULL-res frame so hash quality is preserved. Higher effective FPS also gives
// the temporal stabilizer more votes per second.
export const MAX_DETECT_DIMENSION = 640

const EPSILON_PCTS = [0.02, 0.04, 0.06, 0.08] as const

export type Point = { x: number; y: number }

export type MinAreaRect = {
  center: Point
  width: number
  height: number
  angle: number
  box: Point[]
}

type Candidate = { quad: Point[]; area: number }

type DetectCardCornersOptions = {
  minAreaFrac?: number
  maxAreaFrac?: number
  onFallback?: (used: boolean) => void
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

export function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    area += a.x * b.y - b.x * a.y
  }
  return Math.abs(area) / 2
}

export function convexHull(points: Point[]): Point[] {
  const sorted = [...points]
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .filter((p, i, arr) => i === 0 || p.x !== arr[i - 1].x || p.y !== arr[i - 1].y)
  if (sorted.length <= 1) return sorted

  const lower: Point[] = []
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }

  const upper: Point[] = []
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }

  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

function centroid(points: Point[]): Point {
  let x = 0
  let y = 0
  for (const p of points) {
    x += p.x
    y += p.y
  }
  return { x: x / points.length, y: y / points.length }
}

function perimeter(points: Point[]): number {
  let total = 0
  for (let i = 0; i < points.length; i++) total += distance(points[i], points[(i + 1) % points.length])
  return total
}

function orderedByAngle(points: Point[]): Point[] {
  const c = centroid(points)
  return [...points].sort((a, b) => Math.atan2(a.y - c.y, a.x - c.x) - Math.atan2(b.y - c.y, b.x - c.x))
}

export function orderQuadCorners(points: Point[]): Point[] {
  if (points.length !== 4) throw new Error("orderQuadCorners requires exactly 4 points")
  const byY = [...points].sort((a, b) => a.y - b.y || a.x - b.x)
  const top = byY.slice(0, 2).sort((a, b) => a.x - b.x)
  const bottom = byY.slice(2).sort((a, b) => a.x - b.x)
  return [top[0], top[1], bottom[1], bottom[0]]
}

export function minAreaRect(points: Point[]): MinAreaRect {
  const hull = convexHull(points)
  if (hull.length === 0) {
    return { center: { x: 0, y: 0 }, width: 0, height: 0, angle: 0, box: [] }
  }
  if (hull.length === 1) {
    return { center: hull[0], width: 0, height: 0, angle: 0, box: [hull[0], hull[0], hull[0], hull[0]] }
  }

  let best: MinAreaRect | null = null
  let bestArea = Infinity
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i]
    const b = hull[(i + 1) % hull.length]
    const angle = Math.atan2(b.y - a.y, b.x - a.x)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const p of hull) {
      const rx = p.x * cos + p.y * sin
      const ry = -p.x * sin + p.y * cos
      minX = Math.min(minX, rx)
      maxX = Math.max(maxX, rx)
      minY = Math.min(minY, ry)
      maxY = Math.max(maxY, ry)
    }
    const width = maxX - minX
    const height = maxY - minY
    const area = width * height
    if (area < bestArea) {
      bestArea = area
      const cornersRot = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY }
      ]
      const box = cornersRot.map((p) => ({
        x: p.x * cos - p.y * sin,
        y: p.x * sin + p.y * cos
      }))
      best = {
        center: {
          x: ((minX + maxX) / 2) * cos - ((minY + maxY) / 2) * sin,
          y: ((minX + maxX) / 2) * sin + ((minY + maxY) / 2) * cos
        },
        width,
        height,
        angle,
        box
      }
    }
  }
  return best ?? { center: { x: 0, y: 0 }, width: 0, height: 0, angle: 0, box: [] }
}

function splitPlanes(frame: RgbImage): { gray: Plane; r: Plane; g: Plane; b: Plane } {
  const { width, height, data } = frame
  const gray = new Uint8Array(width * height)
  const r = new Uint8Array(width * height)
  const g = new Uint8Array(width * height)
  const b = new Uint8Array(width * height)
  for (let i = 0, p = 0; i < gray.length; i++, p += 3) {
    r[i] = data[p]
    g[i] = data[p + 1]
    b[i] = data[p + 2]
    gray[i] = Math.round(0.299 * r[i] + 0.587 * g[i] + 0.114 * b[i])
  }
  return {
    gray: { width, height, data: gray },
    r: { width, height, data: r },
    g: { width, height, data: g },
    b: { width, height, data: b }
  }
}

function gaussianBlur3x3(plane: Plane): Plane {
  const { width, height, data } = plane
  const out = new Uint8Array(data.length)
  const sample = (x: number, y: number) =>
    data[Math.min(height - 1, Math.max(0, y)) * width + Math.min(width - 1, Math.max(0, x))]
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sum =
        sample(x - 1, y - 1) +
        2 * sample(x, y - 1) +
        sample(x + 1, y - 1) +
        2 * sample(x - 1, y) +
        4 * sample(x, y) +
        2 * sample(x + 1, y) +
        sample(x - 1, y + 1) +
        2 * sample(x, y + 1) +
        sample(x + 1, y + 1)
      out[y * width + x] = Math.round(sum / 16)
    }
  }
  return { width, height, data: out }
}

function cannyEdges(plane: Plane, lo = CANNY_LO, hi = CANNY_HI): Plane {
  const blurred = gaussianBlur3x3(plane)
  const { width, height, data } = blurred
  const mag = new Float64Array(width * height)
  const dir = new Uint8Array(width * height)
  const nms = new Float64Array(width * height)
  const out = new Uint8Array(width * height)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      const gx =
        -data[i - width - 1] -
        2 * data[i - 1] -
        data[i + width - 1] +
        data[i - width + 1] +
        2 * data[i + 1] +
        data[i + width + 1]
      const gy =
        -data[i - width - 1] -
        2 * data[i - width] -
        data[i - width + 1] +
        data[i + width - 1] +
        2 * data[i + width] +
        data[i + width + 1]
      mag[i] = Math.hypot(gx, gy)
      const angle = (Math.atan2(gy, gx) * 180) / Math.PI
      const a = angle < 0 ? angle + 180 : angle
      dir[i] = a < 22.5 || a >= 157.5 ? 0 : a < 67.5 ? 1 : a < 112.5 ? 2 : 3
    }
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      let a: number
      let b: number
      if (dir[i] === 0) {
        a = mag[i - 1]
        b = mag[i + 1]
      } else if (dir[i] === 1) {
        a = mag[i - width + 1]
        b = mag[i + width - 1]
      } else if (dir[i] === 2) {
        a = mag[i - width]
        b = mag[i + width]
      } else {
        a = mag[i - width - 1]
        b = mag[i + width + 1]
      }
      if (mag[i] >= a && mag[i] >= b) nms[i] = mag[i]
    }
  }

  const stack: number[] = []
  for (let i = 0; i < nms.length; i++) {
    if (nms[i] >= hi) {
      out[i] = 255
      stack.push(i)
    }
  }
  while (stack.length) {
    const i = stack.pop() as number
    const x = i % width
    const y = Math.floor(i / width)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
        const ni = ny * width + nx
        if (out[ni] === 0 && nms[ni] >= lo) {
          out[ni] = 255
          stack.push(ni)
        }
      }
    }
  }
  return { width, height, data: out }
}

function contrastStretch(plane: Plane): Plane {
  const { width, height, data } = plane
  let min = 255
  let max = 0
  for (const value of data) {
    min = Math.min(min, value)
    max = Math.max(max, value)
  }
  const range = max - min
  if (range < 1) return plane

  const out = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) out[i] = Math.round(((data[i] - min) / range) * 255)
  return { width, height, data: out }
}

function thresholdPlane(plane: Plane, threshold: number, mode: "above" | "below"): Plane {
  const out = new Uint8Array(plane.data.length)
  for (let i = 0; i < plane.data.length; i++) {
    const hit = mode === "above" ? plane.data[i] >= threshold : plane.data[i] <= threshold
    out[i] = hit ? 255 : 0
  }
  return { width: plane.width, height: plane.height, data: out }
}

function orPlanes(a: Plane, b: Plane, c?: Plane): Plane {
  const out = new Uint8Array(a.data.length)
  for (let i = 0; i < out.length; i++) out[i] = a.data[i] || b.data[i] || (c?.data[i] ?? 0) ? 255 : 0
  return { width: a.width, height: a.height, data: out }
}

function morphPass(plane: Plane, mode: "dilate" | "erode", kernel: "rect" | "ellipse"): Plane {
  const { width, height, data } = plane
  const out = new Uint8Array(data.length)
  const offsets =
    kernel === "rect"
      ? [
          [-1, -1],
          [0, -1],
          [1, -1],
          [-1, 0],
          [0, 0],
          [1, 0],
          [-1, 1],
          [0, 1],
          [1, 1]
        ]
      : [
          [0, -1],
          [-1, 0],
          [0, 0],
          [1, 0],
          [0, 1]
        ]
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let hit = mode === "erode"
      for (const [dx, dy] of offsets) {
        const nx = x + dx
        const ny = y + dy
        const on = nx >= 0 && ny >= 0 && nx < width && ny < height && data[ny * width + nx] > 0
        if (mode === "dilate" && on) {
          hit = true
          break
        }
        if (mode === "erode" && !on) {
          hit = false
          break
        }
      }
      out[y * width + x] = hit ? 255 : 0
    }
  }
  return { width, height, data: out }
}

function morphClose(plane: Plane, iterations: number, kernel: "rect" | "ellipse"): Plane {
  let out = plane
  for (let i = 0; i < iterations; i++) out = morphPass(out, "dilate", kernel)
  for (let i = 0; i < iterations; i++) out = morphPass(out, "erode", kernel)
  return out
}

function morphCloseCascade(edges: Plane, iterations: number): Plane {
  return orPlanes(morphClose(edges, iterations, "rect"), morphClose(edges, iterations, "ellipse"))
}

function findExternalContours(binary: Plane): Point[][] {
  const { width, height, data } = binary
  const visited = new Uint8Array(data.length)
  const contours: Point[][] = []

  for (let start = 0; start < data.length; start++) {
    if (data[start] === 0 || visited[start]) continue
    const stack = [start]
    const boundary: Point[] = []
    visited[start] = 1

    while (stack.length) {
      const i = stack.pop() as number
      const x = i % width
      const y = Math.floor(i / width)
      let isBoundary = x === 0 || y === 0 || x === width - 1 || y === height - 1

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          const ni = ny * width + nx
          if (data[ni] > 0) {
            if (!visited[ni]) {
              visited[ni] = 1
              stack.push(ni)
            }
          } else {
            isBoundary = true
          }
        }
      }
      if (isBoundary) boundary.push({ x, y })
    }

    if (boundary.length >= 4) contours.push(orderedByAngle(boundary))
  }
  return contours
}

function perpendicularDistance(p: Point, a: Point, b: Point): number {
  const len = distance(a, b)
  if (len < 1e-9) return distance(p, a)
  return Math.abs((b.y - a.y) * p.x - (b.x - a.x) * p.y + b.x * a.y - b.y * a.x) / len
}

function rdpOpen(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points
  let maxDist = -1
  let index = -1
  const first = points[0]
  const last = points[points.length - 1]
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last)
    if (d > maxDist) {
      maxDist = d
      index = i
    }
  }
  if (maxDist > epsilon && index > 0) {
    const left = rdpOpen(points.slice(0, index + 1), epsilon)
    const right = rdpOpen(points.slice(index), epsilon)
    return left.slice(0, -1).concat(right)
  }
  return [first, last]
}

function approxPolyDPClosed(points: Point[], epsilon: number): Point[] {
  if (points.length <= 4) return points
  const closed = points.concat([points[0]])
  const simplified = rdpOpen(closed, epsilon)
  if (simplified.length > 1 && distance(simplified[0], simplified[simplified.length - 1]) < 1e-6) simplified.pop()
  return simplified
}

function findBestCardInEdges(edges: Plane, minArea: number, maxArea: number, morphIter: number): Candidate | null {
  const closed = morphCloseCascade(edges, morphIter)
  const contours = findExternalContours(closed)
  let best: Candidate | null = null
  let fallback: Candidate | null = null

  for (const contour of contours) {
    const hull = convexHull(contour)
    const hullArea = polygonArea(hull)
    const area = Math.max(polygonArea(contour), hullArea)
    if (area < minArea || area > maxArea || hullArea <= 0) continue
    if (area / hullArea < SOLIDITY_MIN) continue

    const rect = minAreaRect(hull)
    if (Math.min(rect.width, rect.height) < 1) continue
    const ratio = Math.max(rect.width, rect.height) / Math.min(rect.width, rect.height)
    if (Math.abs(ratio - CARD_ASPECT_RATIO) / CARD_ASPECT_RATIO > ASPECT_TOLERANCE) continue
    if (area / (rect.width * rect.height) < RECTANGULARITY_MIN) continue

    const peri = perimeter(contour)
    let polyFound = false
    for (const epsPct of EPSILON_PCTS) {
      const poly = approxPolyDPClosed(contour, epsPct * peri)
      if (poly.length === 4 && polygonArea(poly) >= minArea * 0.8) {
        if (!best || area > best.area) best = { quad: poly, area }
        polyFound = true
        break
      }
    }
    if (!polyFound && (!fallback || area > fallback.area)) fallback = { quad: rect.box, area }
  }

  return best ?? fallback
}

function combinedColorEdges(frame: RgbImage): Plane {
  const { r, g, b } = splitPlanes(frame)
  return orPlanes(cannyEdges(b), cannyEdges(g), cannyEdges(r))
}

function fitLine(points: Point[]): { vx: number; vy: number; px: number; py: number } {
  const c = centroid(points)
  let sxx = 0
  let sxy = 0
  let syy = 0
  for (const p of points) {
    const x = p.x - c.x
    const y = p.y - c.y
    sxx += x * x
    sxy += x * y
    syy += y * y
  }
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy)
  return { vx: Math.cos(theta), vy: Math.sin(theta), px: c.x, py: c.y }
}

function lineIntersection(
  a: { vx: number; vy: number; px: number; py: number },
  b: { vx: number; vy: number; px: number; py: number },
  fallback: Point
): Point {
  const det = a.vx * -b.vy - -b.vx * a.vy
  if (Math.abs(det) < 1e-6) return fallback
  const dx = b.px - a.px
  const dy = b.py - a.py
  const t = (dx * -b.vy - -b.vx * dy) / det
  return { x: a.px + t * a.vx, y: a.py + t * a.vy }
}

function refinePolygonOutward(frame: RgbImage, polygon: Point[], searchBand = 40): Point[] {
  const pts = orderedByAngle(polygon)
  const c = centroid(pts)
  const edges = combinedColorEdges(frame)
  const lines: Array<{ vx: number; vy: number; px: number; py: number }> = []

  for (let i = 0; i < 4; i++) {
    const p0 = pts[i]
    const p1 = pts[(i + 1) % 4]
    const sideLen = distance(p0, p1)
    if (sideLen < 1) return polygon
    const ux = (p1.x - p0.x) / sideLen
    const uy = (p1.y - p0.y) / sideLen
    let nx = -uy
    let ny = ux
    const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 }
    if (nx * (mid.x - c.x) + ny * (mid.y - c.y) < 0) {
      nx = -nx
      ny = -ny
    }

    const outer: Point[] = []
    for (let s = 0; s < 40; s++) {
      const t = 0.1 + (0.8 * s) / 39
      const base = { x: p0.x + t * (p1.x - p0.x), y: p0.y + t * (p1.y - p0.y) }
      let bestOff = 0
      for (let d = 1; d <= searchBand; d++) {
        const tx = Math.round(base.x + d * nx)
        const ty = Math.round(base.y + d * ny)
        if (tx < 0 || ty < 0 || tx >= edges.width || ty >= edges.height) break
        if (edges.data[ty * edges.width + tx] > 0) bestOff = d
      }
      if (bestOff > 0) outer.push({ x: base.x + bestOff * nx, y: base.y + bestOff * ny })
    }
    lines.push(outer.length < 8 ? { vx: ux, vy: uy, px: p0.x, py: p0.y } : fitLine(outer))
  }

  const refined = pts.map((p, i) => lineIntersection(lines[(i + 3) % 4], lines[i], p))
  const origArea = polygonArea(pts)
  if (origArea < 1) return polygon
  const ratio = polygonArea(refined) / origArea
  return ratio < 0.98 || ratio > 1.3 ? polygon : refined
}

function detectCardCornersPrimary(frame: RgbImage, minArea: number, maxArea: number): Point[] | null {
  const { gray, r, g, b } = splitPlanes(frame)
  const edgesGray = cannyEdges(gray)
  const edgesB = cannyEdges(b)
  const edgesG = cannyEdges(g)
  const edgesR = cannyEdges(r)
  const edgesMc = orPlanes(edgesB, edgesG, edgesR)
  const edgesPrimary = orPlanes(edgesMc, edgesGray)

  let best: Candidate | null = null
  for (const iter of [1, 3]) {
    best = findBestCardInEdges(edgesPrimary, minArea, maxArea, iter)
    if (best) break
  }

  if (!best) {
    const candidates: Candidate[] = []
    for (const edges of [edgesGray, edgesB, edgesG, edgesR]) {
      const candidate =
        findBestCardInEdges(edges, minArea, maxArea, 1) ?? findBestCardInEdges(edges, minArea, maxArea, 3)
      if (candidate) candidates.push(candidate)
    }
    if (candidates.length) {
      const areas = candidates.map((c) => c.area).sort((a, b) => a - b)
      const mid = Math.floor(areas.length / 2)
      const median = areas.length % 2 ? areas[mid] : (areas[mid - 1] + areas[mid]) / 2
      best =
        candidates
          .filter((c) => candidates.length === 1 || c.area <= median * 1.15)
          .sort((a, b) => b.area - a.area)[0] ?? null
    }
  }

  return best ? refinePolygonOutward(frame, best.quad) : null
}

function detectLowContrastCardCorners(frame: RgbImage, minArea: number, maxArea: number): Point[] | null {
  const { gray } = splitPlanes(frame)
  const stretchedGray = contrastStretch(gray)
  const edges = cannyEdges(stretchedGray, LOW_CONTRAST_CANNY_LO, LOW_CONTRAST_CANNY_HI)
  const lowThreshold = 64
  const highThreshold = 191
  const lightBlob = thresholdPlane(stretchedGray, lowThreshold, "above")
  const darkBlob = thresholdPlane(stretchedGray, highThreshold, "below")
  const best =
    findBestCardInEdges(edges, minArea, maxArea, 2) ??
    findBestCardInEdges(lightBlob, minArea, maxArea, 1) ??
    findBestCardInEdges(darkBlob, minArea, maxArea, 1) ??
    findBestCardInEdges(edges, minArea, maxArea, 4)
  return best ? refinePolygonOutward(frame, best.quad, 24) : null
}

export function detectCardCorners(frame: RgbImage, opts: DetectCardCornersOptions = {}): Point[] | null {
  const minArea = frame.width * frame.height * (opts.minAreaFrac ?? MIN_AREA_FRAC)
  const maxArea = frame.width * frame.height * (opts.maxAreaFrac ?? MAX_AREA_FRAC)
  const primary = detectCardCornersPrimary(frame, minArea, maxArea)
  if (primary) {
    opts.onFallback?.(false)
    return primary
  }

  const fallback = detectLowContrastCardCorners(frame, minArea, maxArea)
  opts.onFallback?.(fallback !== null)
  return fallback
}

function solve8x8(a: number[][], b: number[]): number[] {
  const n = 8
  const m = a.map((row, i) => row.concat([b[i]]))
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row
    }
    if (Math.abs(m[pivot][col]) < 1e-12) throw new Error("Cannot solve singular homography")
    ;[m[col], m[pivot]] = [m[pivot], m[col]]
    const div = m[col][col]
    for (let k = col; k <= n; k++) m[col][k] /= div
    for (let row = 0; row < n; row++) {
      if (row === col) continue
      const factor = m[row][col]
      for (let k = col; k <= n; k++) m[row][k] -= factor * m[col][k]
    }
  }
  return m.map((row) => row[n])
}

function homography(src: Point[], dst: Point[]): number[] {
  const a: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i]
    const u = dst[i].x
    const v = dst[i].y
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
    b.push(u)
    a.push([0, 0, 0, x, y, 1, -v * x, -v * y])
    b.push(v)
  }
  const h = solve8x8(a, b)
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1]
}

function invert3x3(h: number[]): number[] {
  const [a, b, c, d, e, f, g, i, j] = h
  const A = e * j - f * i
  const B = c * i - b * j
  const C = b * f - c * e
  const D = f * g - d * j
  const E = a * j - c * g
  const F = c * d - a * f
  const G = d * i - e * g
  const H = b * g - a * i
  const I = a * e - b * d
  const det = a * A + b * D + c * G
  if (Math.abs(det) < 1e-12) throw new Error("Cannot invert singular homography")
  return [A / det, B / det, C / det, D / det, E / det, F / det, G / det, H / det, I / det]
}

function bilinearSample(img: RgbImage, x: number, y: number, channel: 0 | 1 | 2): number {
  const sx = Math.min(img.width - 1, Math.max(0, x))
  const sy = Math.min(img.height - 1, Math.max(0, y))
  const x0 = Math.floor(sx)
  const y0 = Math.floor(sy)
  const x1 = Math.min(img.width - 1, x0 + 1)
  const y1 = Math.min(img.height - 1, y0 + 1)
  const fx = sx - x0
  const fy = sy - y0
  const p00 = img.data[(y0 * img.width + x0) * 3 + channel]
  const p10 = img.data[(y0 * img.width + x1) * 3 + channel]
  const p01 = img.data[(y1 * img.width + x0) * 3 + channel]
  const p11 = img.data[(y1 * img.width + x1) * 3 + channel]
  return Math.round((1 - fx) * (1 - fy) * p00 + fx * (1 - fy) * p10 + (1 - fx) * fy * p01 + fx * fy * p11)
}

function rotate90Clockwise(img: RgbImage): RgbImage {
  const out = new Uint8Array(img.data.length)
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const src = (y * img.width + x) * 3
      const dst = (x * img.height + (img.height - 1 - y)) * 3
      out[dst] = img.data[src]
      out[dst + 1] = img.data[src + 1]
      out[dst + 2] = img.data[src + 2]
    }
  }
  return { width: img.height, height: img.width, data: out }
}

/**
 * Order a detected quad into the canonical [TL, TR, BR, BL] used by the warp,
 * including the portrait swap a landscape detection needs. Exported so the
 * read-only debug overlay (DEC-060 / REQ-041) can map the canonical art-crop
 * region back onto the live frame through the *same* quad the warp consumes.
 */
export function orientCardQuad(quad: Point[]): Point[] {
  let [topLeft, topRight, bottomRight, bottomLeft] = orderQuadCorners(quad)
  const topLen = distance(topLeft, topRight)
  const leftLen = distance(topLeft, bottomLeft)
  if (topLen > leftLen) {
    ;[topLeft, topRight, bottomRight, bottomLeft] = [bottomLeft, topLeft, topRight, bottomRight]
  }
  return [topLeft, topRight, bottomRight, bottomLeft]
}

export function warpPerspective(frame: RgbImage, quad: Point[]): RgbImage {
  const [topLeft, topRight, bottomRight, bottomLeft] = orientCardQuad(quad)

  const src = [topLeft, topRight, bottomRight, bottomLeft]
  const dst = [
    { x: 0, y: 0 },
    { x: CARD_WIDTH - 1, y: 0 },
    { x: CARD_WIDTH - 1, y: CARD_HEIGHT - 1 },
    { x: 0, y: CARD_HEIGHT - 1 }
  ]
  const inv = invert3x3(homography(src, dst))
  const data = new Uint8Array(CARD_WIDTH * CARD_HEIGHT * 3)
  for (let y = 0; y < CARD_HEIGHT; y++) {
    for (let x = 0; x < CARD_WIDTH; x++) {
      const den = inv[6] * x + inv[7] * y + inv[8]
      const sx = (inv[0] * x + inv[1] * y + inv[2]) / den
      const sy = (inv[3] * x + inv[4] * y + inv[5]) / den
      const off = (y * CARD_WIDTH + x) * 3
      data[off] = bilinearSample(frame, sx, sy, 0)
      data[off + 1] = bilinearSample(frame, sx, sy, 1)
      data[off + 2] = bilinearSample(frame, sx, sy, 2)
    }
  }
  const warped = { width: CARD_WIDTH, height: CARD_HEIGHT, data }
  return warped.width > warped.height ? rotate90Clockwise(warped) : warped
}

/** Bilinear downscale of an RGB frame by a uniform scale factor (0 < scale <= 1). */
function downscaleRgb(frame: RgbImage, scale: number): RgbImage {
  const w = Math.max(1, Math.round(frame.width * scale))
  const h = Math.max(1, Math.round(frame.height * scale))
  const data = new Uint8Array(w * h * 3)
  const sx = frame.width / w
  const sy = frame.height / h
  for (let y = 0; y < h; y++) {
    const fy = (y + 0.5) * sy - 0.5
    for (let x = 0; x < w; x++) {
      const fx = (x + 0.5) * sx - 0.5
      const off = (y * w + x) * 3
      data[off] = bilinearSample(frame, fx, fy, 0)
      data[off + 1] = bilinearSample(frame, fx, fy, 1)
      data[off + 2] = bilinearSample(frame, fx, fy, 2)
    }
  }
  return { width: w, height: h, data }
}

export function detectCard(
  frame: RgbImage,
  opts: {
    minAreaFrac?: number
    maxAreaFrac?: number
    maxDetectDimension?: number
    /**
     * Additive, optional. Invoked with the canonical-oriented full-res corners
     * the warp consumes, so the read-only debug overlay (DEC-060 / REQ-041) can
     * draw the tracked card outline + art-crop read region. Changes no
     * detection/warp behavior; not called when no card is found.
     */
    onCorners?: (corners: Point[]) => void
  } = {}
): RgbImage | null {
  const longSide = Math.max(frame.width, frame.height)
  const maxDim = opts.maxDetectDimension ?? MAX_DETECT_DIMENSION

  if (longSide > maxDim) {
    // Detect on a downscaled copy (area fractions are scale-invariant), then map
    // corners back to full-res and warp from the original frame.
    const scale = maxDim / longSide
    const small = downscaleRgb(frame, scale)
    const cornersSmall = detectCardCorners(small, opts)
    if (!cornersSmall) return null
    const corners = cornersSmall.map((p) => ({ x: p.x / scale, y: p.y / scale }))
    opts.onCorners?.(orientCardQuad(corners))
    return warpPerspective(frame, corners)
  }

  const corners = detectCardCorners(frame, opts)
  if (!corners) return null
  opts.onCorners?.(orientCardQuad(corners))
  return warpPerspective(frame, corners)
}
