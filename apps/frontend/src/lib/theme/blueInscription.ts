export const BLUE_FAMILIES = ["fork", "branch", "hook", "pillar", "diamond", "spire"] as const
export type BlueFamily = (typeof BLUE_FAMILIES)[number]
export type BluePoint = [number, number]

export const BLUE_RUNES: BluePoint[][][] = [
  [
    [
      [0, -1],
      [0, 1]
    ],
    [
      [-0.6, -0.4],
      [0, 0.1],
      [0.6, -0.4]
    ]
  ],
  [
    [
      [-0.6, -1],
      [0.6, -1],
      [0, 1]
    ],
    [
      [-0.3, 0.2],
      [0.3, 0.2]
    ]
  ],
  [
    [
      [0, -1],
      [0, 1]
    ],
    [
      [0, -0.5],
      [0.6, -0.9]
    ],
    [
      [0, 0],
      [-0.6, 0.4]
    ]
  ],
  [
    [
      [-0.6, 1],
      [-0.6, -1],
      [0.6, -0.4],
      [-0.6, 0.2]
    ]
  ],
  [
    [
      [-0.6, -0.6],
      [0.6, -0.6]
    ],
    [
      [0, -0.6],
      [0, 1]
    ],
    [
      [-0.4, 1],
      [0.4, 1]
    ]
  ],
  [
    [
      [-0.5, -1],
      [0.5, 0],
      [-0.5, 1]
    ],
    [
      [0.5, -1],
      [0.5, 1]
    ]
  ],
  [
    [
      [0, -1],
      [0.6, 0],
      [0, 1],
      [-0.6, 0],
      [0, -1]
    ],
    [
      [0, -0.3],
      [0, 0.3]
    ]
  ],
  [
    [
      [-0.6, -1],
      [-0.6, 1],
      [0.6, 1]
    ],
    [
      [-0.6, 0],
      [0.4, -0.6]
    ]
  ],
  [
    [
      [0.6, -1],
      [-0.2, -0.2],
      [0.6, 0.6]
    ],
    [
      [-0.6, -0.2],
      [-0.6, 1]
    ]
  ],
  [
    [
      [-0.6, 0.8],
      [0, -1],
      [0.6, 0.8]
    ],
    [
      [-0.35, 0.1],
      [0.35, 0.1]
    ],
    [
      [0, 0.1],
      [0, 1]
    ]
  ]
]

/** Preserve phone/tablet density; desktop gains neighbours without extra nodes. */
export function blueLinkRadius(base: number, width: number, height: number): number {
  if (width < 1024) return base
  const expanded = Math.max(base, Math.min(240, base * Math.sqrt((width * height) / (390 * 844))))
  return base + (expanded - base) * 0.25
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

/** Reuse Blue's own script; the smaller signs and large sigils share one vocabulary. */
export function blueOutline(
  family: BlueFamily,
  ratio: number,
  withArc: boolean
): { glyph: BluePoint[][]; arc?: BluePoint[] } {
  const runeIndex: Record<BlueFamily, number> = { fork: 0, branch: 2, hook: 3, pillar: 4, diamond: 6, spire: 9 }
  const glyph: BluePoint[][] = BLUE_RUNES[runeIndex[family]].map((stroke) =>
    stroke.map(([x, y]) => [x * ratio * 0.72, y * 0.72])
  )
  // An incomplete enclosing stroke leaves the sign airy; no dense ring decorations.
  const arc: BluePoint[] | undefined = withArc
    ? Array.from({ length: 49 }, (_, i) => {
        const angle = -Math.PI * 0.8 + (i / 48) * Math.PI * 1.3
        return [Math.cos(angle), Math.sin(angle)]
      })
    : undefined
  return { glyph, arc }
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
