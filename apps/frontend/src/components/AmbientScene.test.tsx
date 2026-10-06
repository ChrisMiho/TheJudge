import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AmbientScene, shouldFallbackToStatic } from "./AmbientScene"
import {
  blueLinkRadius,
  createBlueFamilyPicker,
  blueOutline,
  bluePlacement,
  BLUE_FAMILIES
} from "../lib/theme/blueInscription"
import { PALETTES } from "../lib/theme/palettes"

function mockMatchMedia(prefersReduced: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: prefersReduced && query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  )
}

const GOLDEN: Record<string, string> = {
  // Fingerprints of one seeded still frame for the cases this diff must leave
  // unchanged except for the intentional Blue desktop connection increase. The draw-call count
  // (the part before the colon) is version-independent; the hash is of args
  // rounded to 3 decimals, so it is stable across Node/V8 versions (see
  // fingerprint() below).
  green1280: "12865:156881676",
  greenTray1280: "2998:2931903125",
  white390: "193:180073385",
  white1280: "193:961196455",
  blue390: "339:2624013100",
  blue1280: "355:4266266178",
  black390: "1196:3087704209",
  black1280: "22136:1430510574",
  red390: "205:4138612825",
  red1280: "205:2887479130",
  colorless390: "195:642700728",
  colorless1280: "217:4115066807"
}

type CallLog = { name: string; args: unknown[] }[]

/** A 2D context that records every call and answers gradient/measure requests. */
function createRecordingContext(
  log: CallLog,
  onStroke?: (state: Record<string, unknown>) => void
): CanvasRenderingContext2D {
  const gradient = { addColorStop: vi.fn() }
  const target: Record<string, unknown> = {}
  return new Proxy(target, {
    get(_target, property: string) {
      if (property in target) return target[property]
      return (...args: unknown[]) => {
        if (property === "stroke") onStroke?.(target)
        log.push({ name: property, args })
        if (property.startsWith("create") && property.endsWith("Gradient")) return gradient
        return undefined
      }
    },
    set(_target, property: string, value: unknown) {
      target[property] = value
      return true
    }
  }) as unknown as CanvasRenderingContext2D
}

describe("Frontend - Theme", () => {
  let log: CallLog
  const realWidth = window.innerWidth
  const realHeight = window.innerHeight

  function setViewport(width: number, height: number): void {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width })
    Object.defineProperty(window, "innerHeight", { configurable: true, value: height })
  }

  /** One still frame (reduced motion = seeded) of a colour's scene at a viewport. */
  function paintStill(profile: string, width: number, height: number): CallLog {
    mockMatchMedia(true)
    setViewport(width, height)
    document.documentElement.setAttribute("data-profile", profile)
    log.length = 0
    const { unmount } = render(<AmbientScene motif="leaves" />)
    unmount()
    return [...log]
  }

  function fingerprint(calls: CallLog): string {
    // Round every numeric draw-call arg to 3 decimals before hashing. The raw
    // args are full-precision results of Math.sin/cos/sqrt, which are not
    // bit-identical across V8/Node versions (the scene renders fine; only the
    // last bits drift). Rounding to 0.001 absorbs that sub-pixel drift — far
    // below the drift magnitude's worst case — while still catching any real
    // change to the frame, so the fingerprint is stable whether the suite runs
    // on the dev's Node or CI's Node 22.
    const text = JSON.stringify(calls, (_key, value) =>
      typeof value === "number" && Number.isFinite(value) ? Math.round(value * 1000) / 1000 : value
    )
    let hash = 5381
    for (let i = 0; i < text.length; i += 1) hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0
    return `${calls.length}:${hash}`
  }

  afterEach(() => setViewport(realWidth, realHeight))

  beforeEach(() => {
    log = []
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => createRecordingContext(log) as unknown as RenderingContext
    )
    document.documentElement.setAttribute("data-profile", "blue")
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    document.documentElement.removeAttribute("data-profile")
  })

  it("renders the mockup's page layer: two haze sheets and one fixed canvas, decorative and non-interactive", () => {
    for (const palette of PALETTES) {
      const { container, unmount } = render(<AmbientScene motif={palette.motif} />)
      const scene = screen.getByTestId("ambient-scene")
      expect(scene).toHaveAttribute("aria-hidden", "true")
      expect(scene.dataset.motif).toBe(palette.motif)
      expect(scene).toHaveClass("ambience")
      expect(container.querySelectorAll(".haze").length).toBe(2)
      expect(container.querySelectorAll("canvas").length).toBe(1)
      expect(scene.querySelectorAll("button, a, input, [role]").length).toBe(0)
      unmount()
    }
  })

  it("renders at full strength behind the page by default and as the Menu tray's whisper copy in the tray", () => {
    const { rerender } = render(<AmbientScene motif="runes" />)
    expect(screen.getByTestId("ambient-scene").dataset.variant).toBe("page")

    rerender(<AmbientScene motif="runes" variant="tray" />)
    const tray = screen.getByTestId("ambient-scene")
    expect(tray.dataset.variant).toBe("tray")
    expect(tray).toHaveClass("tray-flair")
    expect(tray.querySelector("canvas.flair-canvas")).not.toBeNull()
  })

  it("paints one still frame under prefers-reduced-motion and schedules no animation", () => {
    mockMatchMedia(true)
    const raf = vi.spyOn(window, "requestAnimationFrame")
    render(<AmbientScene motif="runes" />)

    expect(log.some((call) => call.name === "clearRect")).toBe(true)
    expect(log.some((call) => call.name === "arc")).toBe(true)
    expect(raf).not.toHaveBeenCalled()
  })

  it("paints the identical still frame every time under reduced motion (seeded)", () => {
    mockMatchMedia(true)
    const first = render(<AmbientScene motif="runes" />)
    const firstFrame = JSON.stringify(log.filter((call) => call.name === "arc"))
    first.unmount()
    log.length = 0
    render(<AmbientScene motif="runes" />)

    expect(JSON.stringify(log.filter((call) => call.name === "arc"))).toBe(firstFrame)
  })

  it("keeps animating when motion is allowed", () => {
    mockMatchMedia(false)
    const raf = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1)
    render(<AmbientScene motif="runes" />)

    expect(raf).toHaveBeenCalled()
  })

  it("redraws in the new colour when the Theme changes the profile", async () => {
    mockMatchMedia(true)
    render(<AmbientScene motif="runes" />)
    const before = log.length

    document.documentElement.setAttribute("data-profile", "red")

    await waitFor(() => expect(log.length).toBeGreaterThan(before))
  })

  it("falls back to static when most sampled frames run slower than ~45fps", () => {
    // A weak machine: ~30fps (33ms/frame) sustained -> freeze to the still frame.
    const slow = Array.from({ length: 40 }, () => 33)
    expect(shouldFallbackToStatic(slow)).toBe(true)
  })

  it("keeps animating when the machine holds a smooth frame rate", () => {
    const smooth60 = Array.from({ length: 40 }, () => 16.7)
    expect(shouldFallbackToStatic(smooth60)).toBe(false)
    // A solid ~50fps machine (20ms) still animates — it is only borderline, not slow.
    const smooth50 = Array.from({ length: 40 }, () => 20)
    expect(shouldFallbackToStatic(smooth50)).toBe(false)
  })

  it("ignores a short sample (startup jank) and does not downgrade", () => {
    // Too few frames to judge: a couple of slow startup frames must not trip it.
    expect(shouldFallbackToStatic([40, 40, 40])).toBe(false)
  })

  it("tolerates a minority of slow frames (occasional hitches keep animating)", () => {
    const mostlySmooth = [...Array.from({ length: 30 }, () => 16), ...Array.from({ length: 8 }, () => 40)]
    expect(shouldFallbackToStatic(mostlySmooth)).toBe(false)
  })

  it("stops its loop when it unmounts", () => {
    mockMatchMedia(false)
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(7)
    const cancel = vi.spyOn(window, "cancelAnimationFrame")
    const { unmount } = render(<AmbientScene motif="runes" />)

    unmount()

    expect(cancel).toHaveBeenCalledWith(7)
  })

  describe("Green on a phone", () => {
    /** Deepest point any drawn limb segment reaches (leaf veins use tiny local coordinates). */
    function limbDepth(calls: CallLog): number {
      return Math.max(0, ...calls.filter((c) => c.name === "lineTo").map((c) => Number(c.args[1])))
    }

    it("keeps limbs off the side edges at 390 wide", () => {
      expect(limbDepth(paintStill("green", 390, 844))).toBeLessThan(160)
    })

    it("covers the whole phone band, including 520 to 767 wide", () => {
      for (const width of [520, 600, 767]) {
        expect(limbDepth(paintStill("green", width, 1000))).toBeLessThan(160)
      }
    })

    it("draws fewer leaves on a phone than the same screen without the phone path would", () => {
      const leaves = (calls: CallLog) => calls.filter((c) => c.name === "bezierCurveTo").length
      expect(leaves(paintStill("green", 390, 844))).toBeLessThan(leaves(paintStill("green", 800, 844)))
    })

    it("leaves green at 768 and wider with its full limbs", () => {
      expect(limbDepth(paintStill("green", 768, 1024))).toBeGreaterThan(200)
      expect(limbDepth(paintStill("green", 1280, 800))).toBeGreaterThan(200)
      expect(fingerprint(paintStill("green", 1280, 800))).toBe(GOLDEN.green1280)
    })

    it("leaves the tray-width tall scene on a wide screen as it was (vines down the edges)", () => {
      mockMatchMedia(true)
      setViewport(1280, 800)
      document.documentElement.setAttribute("data-profile", "green")
      log.length = 0
      const { unmount } = render(<AmbientScene motif="leaves" variant="tray" />)
      unmount()
      expect(fingerprint([...log])).toBe(GOLDEN.greenTray1280)
    })

    it("preserves seeded scenes apart from the intentional Blue desktop connections", () => {
      for (const profile of ["white", "blue", "black", "red", "colorless"]) {
        expect(fingerprint(paintStill(profile, 390, 844))).toBe(GOLDEN[`${profile}390`])
        expect(fingerprint(paintStill(profile, 1280, 800))).toBe(GOLDEN[`${profile}1280`])
      }
    })
  })
  describe("Blue constellations and inscriptions", () => {
    it("restores frequent desktop connections while keeping the phone still frame", () => {
      const desktop = paintStill("blue", 1280, 800)
      expect(desktop.filter((call) => call.name === "lineTo").length).toBeGreaterThan(25)
      expect(desktop.filter((call) => call.name === "drawImage")).toHaveLength(35)
      expect(fingerprint(paintStill("blue", 390, 844))).toBe(GOLDEN.blue390)
    })

    it("updates renderer connections on resize and leaves tray connections disabled", () => {
      mockMatchMedia(false)
      let seed = 123
      vi.spyOn(Math, "random").mockImplementation(() => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
        return seed / 4294967296
      })
      let frame: FrameRequestCallback = () => undefined
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
        frame = callback
        return 1
      })
      setViewport(1440, 900)
      const { unmount } = render(<AmbientScene motif="runes" />)
      // Preserve particle positions so only the live connection range changes.
      log.length = 0
      frame(0)
      const desktopLinks = log.filter((c) => c.name === "lineTo").length
      expect(desktopLinks).toBeGreaterThan(25)
      setViewport(390, 844)
      window.dispatchEvent(new Event("resize"))
      log.length = 0
      frame(16)
      expect(log.find((c) => c.name === "clearRect")?.args).toEqual([0, 0, 390, 844])
      expect(log.filter((c) => c.name === "lineTo").length).toBeLessThan(desktopLinks)
      unmount()
      const tray = render(<AmbientScene motif="runes" variant="tray" />)
      log.length = 0
      frame(32)
      expect(log.filter((c) => c.name === "lineTo")).toHaveLength(0)
      tray.unmount()
    })

    it("traces, holds and fades successive large shapes and refits an active shape on resize", () => {
      mockMatchMedia(false)
      setViewport(1440, 900)
      vi.spyOn(Math, "random").mockReturnValue(0.5)
      let frame: FrameRequestCallback = () => undefined
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
        frame = callback
        return 1
      })
      let now = 10
      vi.spyOn(performance, "now").mockImplementation(() => (now += 16))
      const outlines: { points: number[][]; alpha: number }[] = []
      vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation(
        () =>
          createRecordingContext(log, (state) => {
            if (state.lineWidth !== 1.1 || state.shadowBlur !== 8) return
            const start = log.map((c) => c.name).lastIndexOf("beginPath")
            const points = log
              .slice(start)
              .filter((c) => c.name === "lineTo")
              .map((c) => c.args as number[])
            const alpha = Number(String(state.strokeStyle).split(",").at(-1)?.replace(")", ""))
            outlines.push({ points, alpha })
          }) as unknown as RenderingContext
      )
      const { unmount } = render(<AmbientScene motif="runes" />)
      const advance = (count: number) => {
        for (let i = 0; i < count; i++) {
          log.length = 0
          outlines.length = 0
          frame(now)
        }
      }
      advance(119)
      expect(outlines).toHaveLength(0)
      advance(1)
      expect(outlines).toHaveLength(1)
      const firstPointCount = outlines[0].points.length
      advance(259)
      expect(outlines[0].points.length).toBeGreaterThan(firstPointCount)
      const fullPointCount = outlines[0].points.length
      advance(300)
      expect(outlines[0].points).toHaveLength(fullPointCount)
      const holdingAlpha = outlines[0].alpha
      advance(540)
      expect(outlines[0].alpha).toBeLessThan(holdingAlpha * 0.2)
      advance(21)
      expect(outlines).toHaveLength(0)
      advance(420)
      expect(outlines.length).toBeGreaterThan(0)
      setViewport(320, 200)
      window.dispatchEvent(new Event("resize"))
      advance(260)
      for (const outline of outlines)
        for (const [x, y] of outline.points) expect(Math.hypot(x, y)).toBeLessThanOrEqual(83.201)
      expect(
        log
          .filter((c) => c.name === "translate")
          .some((c) => Number(c.args[0]) > 0 && Number(c.args[0]) < 320 && Number(c.args[1]) < 200)
      ).toBe(true)
      unmount()
    })

    it("preserves a holding tray inscription and its lifecycle during resize", () => {
      mockMatchMedia(false)
      vi.spyOn(Math, "random").mockReturnValue(0.5)
      let frame: FrameRequestCallback = () => undefined
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
        frame = callback
        return 1
      })
      let refit: () => void = () => undefined
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(callback: () => void) {
            refit = callback
          }
          observe() {}
          disconnect() {}
        }
      )
      const width = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(320)
      const height = vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(500)
      let largeStrokes = 0
      vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation(
        () =>
          createRecordingContext(log, (state) => {
            if (state.lineWidth === 1.1 && state.shadowBlur === 8) largeStrokes++
          }) as unknown as RenderingContext
      )
      const { unmount } = render(<AmbientScene motif="runes" variant="tray" />)
      for (let i = 0; i < 400; i++) {
        log.length = 0
        frame(0)
      }
      expect(largeStrokes).toBeGreaterThan(0)
      width.mockReturnValue(280)
      height.mockReturnValue(300)
      refit()
      log.length = 0
      largeStrokes = 0
      frame(0)
      expect(largeStrokes).toBeGreaterThan(0)
      expect(log.find((c) => c.name === "clearRect")?.args).toEqual([0, 0, 280, 300])
      unmount()
    })

    it("repaints the Blue still frame on resize without restarting reduced motion", () => {
      mockMatchMedia(true)
      setViewport(1440, 900)
      const raf = vi.spyOn(window, "requestAnimationFrame")
      const { unmount } = render(<AmbientScene motif="runes" />)
      setViewport(390, 844)
      log.length = 0
      window.dispatchEvent(new Event("resize"))
      expect(log.filter((c) => c.name === "drawImage")).toHaveLength(35)
      expect(raf).not.toHaveBeenCalled()
      unmount()
    })

    it("repaints a resized weak-hardware fallback without scheduling animation", () => {
      mockMatchMedia(false)
      setViewport(1440, 900)
      let queued: FrameRequestCallback | undefined
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
        queued = callback
        return 1
      })
      let now = 10
      vi.spyOn(performance, "now").mockImplementation(() => (now += 33))
      const { unmount } = render(<AmbientScene motif="runes" />)
      let frames = 0
      while (queued && frames < 100) {
        const callback = queued
        queued = undefined
        frames++
        log.length = 0
        callback(now)
      }
      expect(frames).toBeGreaterThan(20)
      expect(frames).toBeLessThan(100)
      setViewport(390, 844)
      log.length = 0
      window.dispatchEvent(new Event("resize"))
      expect(log.filter((c) => c.name === "drawImage")).toHaveLength(35)
      expect(queued).toBeUndefined()
      unmount()
    })

    it("keeps phone and tablet radii and caps desktop links from live dimensions", () => {
      expect(blueLinkRadius(96, 390, 844)).toBe(96)
      expect(blueLinkRadius(96, 1023, 900)).toBe(96)
      expect(blueLinkRadius(96, 1280, 800)).toBeCloseTo(169.325, 2)
      expect(blueLinkRadius(96, 1440, 900)).toBeCloseTo(190.494, 2)
      expect(blueLinkRadius(96, 1920, 1080)).toBe(240)
      expect(blueLinkRadius(96, 2560, 1440)).toBe(240)
    })

    it("visits every family in each bag without consecutive repeats across bags", () => {
      // Constant random values exercise even a shuffle that produces the same order.
      for (const random of [() => 0, () => 0.5, () => 0.999]) {
        const next = createBlueFamilyPicker(random)
        const families = Array.from({ length: 36 }, () => next())
        for (let i = 0; i < families.length; i++) {
          if (i) expect(families[i]).not.toBe(families[i - 1])
          if (i % 6 === 0) expect(new Set(families.slice(i, i + 6))).toEqual(new Set(BLUE_FAMILIES))
        }
      }
    })

    it("bounds complete outlines including overlapping loops inside their radius", () => {
      for (const family of BLUE_FAMILIES) {
        for (const ratio of [0.6, 0.75, 0.9]) {
          const outlines = blueOutline(family, ratio, true)
          expect(outlines.length).toBeLessThanOrEqual(2)
          for (const outline of outlines) {
            expect(outline.length).toBeGreaterThan(3)
            expect(outline[outline.length - 1]).toEqual(outline[0])
            for (const [x, y] of outline) expect(Math.hypot(x, y)).toBeLessThanOrEqual(1.000001)
          }
        }
      }
    })

    it("contains all rotated families in wide gutters and low narrow or tray space", () => {
      for (const [width, height] of [
        [390, 844],
        [1280, 800],
        [1440, 900],
        [1920, 1080],
        [320, 200],
        [280, 100]
      ]) {
        for (const choice of [0, 0.5, 0.999]) {
          const { x, y, r } = bluePlacement(width, height, choice, 0.999)
          expect(x - r).toBeGreaterThanOrEqual(0)
          expect(x + r).toBeLessThanOrEqual(width)
          expect(y - r).toBeGreaterThanOrEqual(0)
          expect(y + r).toBeLessThanOrEqual(height)
          if (width >= 1280) expect(x + r <= (width - 768) / 2 || x - r >= (width + 768) / 2).toBe(true)
          else expect(y).toBeGreaterThanOrEqual(height * 0.5)
        }
      }
    })
  })
})
