export const BLUE_FAMILIES = ["ring", "triangle", "diamond", "hexagon", "ellipse", "loops"] as const
export type BlueFamily = (typeof BLUE_FAMILIES)[number]
export type BluePoint = [number, number]

/** Preserve phone/tablet density; desktop gains neighbours without extra nodes. */
export function blueLinkRadius(base: number, width: number, height: number): number {
  return width < 1024 ? base : Math.min(240, base * Math.sqrt((width * height) / (390 * 844)))
}

export function createBlueFamilyPicker(random: () => number): () => BlueFamily {
  let bag: BlueFamily[] = []
  let previous: BlueFamily | undefined
  return () => {
    if (!bag.length) {
      bag = [...BLUE_FAMILIES]
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        ;[bag[i], bag[j]] = [bag[j], bag[i]]
      }
      if (bag[bag.length - 1] === previous) {
        ;[bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]]
      }
    }
    previous = bag.pop()!
    return previous
  }
}

/** Complete paths stay inside the unit circle, including both overlapping loops. */
export function blueOutline(family: BlueFamily, ratio: number, inner: boolean): BluePoint[][] {
  const ellipse = (rx: number, ry: number, cx = 0): BluePoint[] => {
    const points: BluePoint[] = Array.from({ length: 64 }, (_, i) => {
      const angle = (i / 64) * Math.PI * 2
      return [cx + Math.cos(angle) * rx, Math.sin(angle) * ry]
    })
    return [...points, points[0]]
  }
  if (family === "ring") return inner ? [ellipse(1, 1), ellipse(0.7, 0.7)] : [ellipse(1, 1)]
  if (family === "ellipse") return [ellipse(1, ratio)]
  if (family === "loops") return [ellipse(0.7, 0.7, -0.3), ellipse(0.7, 0.7, 0.3)]
  const sides = family === "triangle" ? 3 : family === "diamond" ? 4 : 6
  const points: BluePoint[] = Array.from({ length: sides }, (_, i) => {
    const angle = -Math.PI / 2 + (i / sides) * Math.PI * 2
    return [Math.cos(angle) * (family === "diamond" ? ratio : 1), Math.sin(angle)]
  })
  return [[...points, points[0]]]
}

/** Reuse spawn choices on resize, keeping the full rotating envelope on canvas. */
export function bluePlacement(width: number, height: number, horizontal: number, vertical: number) {
  const gutter = (width - Math.min(768, width * 0.92)) / 2
  const wide = gutter > 150
  const r = Math.max(
    0,
    Math.min(
      wide ? Math.min(gutter * 0.5, height * 0.16, 110) : Math.min(width * 0.26, 90),
      width / 2 - 2,
      height / 2 - 2
    )
  )
  const clamp = (value: number, extent: number) => Math.max(r + 2, Math.min(extent - r - 2, value))
  return {
    x: clamp(wide ? (horizontal < 0.5 ? gutter / 2 : width - gutter / 2) : (0.25 + horizontal * 0.5) * width, width),
    y: clamp((wide ? 0.3 + vertical * 0.48 : 0.7 + vertical * 0.2) * height, height),
    r
  }
}
