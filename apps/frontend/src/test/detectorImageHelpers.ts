import type { RgbImage } from "../lib/scan/types"

// Shared by the files split out of the original `detector.test.ts`, so the
// synthetic-frame builders exist once rather than once per split file.

export function makeImage(width: number, height: number, fill: [number, number, number]): RgbImage {
  const data = new Uint8Array(width * height * 3)
  for (let i = 0; i < data.length; i += 3) {
    data[i] = fill[0]
    data[i + 1] = fill[1]
    data[i + 2] = fill[2]
  }
  return { width, height, data }
}

export function setPixel(img: RgbImage, x: number, y: number, rgb: [number, number, number]): void {
  const off = (y * img.width + x) * 3
  img.data[off] = rgb[0]
  img.data[off + 1] = rgb[1]
  img.data[off + 2] = rgb[2]
}

export function fillRect(
  img: RgbImage,
  x0: number,
  y0: number,
  width: number,
  height: number,
  rgb: [number, number, number]
): void {
  for (let y = y0; y < y0 + height; y++) {
    for (let x = x0; x < x0 + width; x++) setPixel(img, x, y, rgb)
  }
}

export function quadCentroid(points: { x: number; y: number }[]): { x: number; y: number } {
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length
  }
}
