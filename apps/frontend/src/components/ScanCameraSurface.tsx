import { useCallback, useEffect, useRef, useState } from "react"
import { CARD_HEIGHT, CARD_WIDTH, MAX_DETECT_DIMENSION, detectCard, type GuideRect, type Point } from "../lib/scan/detector"
import { loadScanAudioMuted, saveScanAudioMuted } from "../lib/scan/audioPrefs"
import type { ConditionReason } from "../lib/scan/frameQuality"
import type { IdentifyResult, RgbImage } from "../lib/scan/types"
import type { AcquisitionFrameDiagnostic, CaptureDiagnostic } from "../lib/scan/acquisitionDiagnostics"
import { ScanCardOutline } from "./ScanCardOutline"
import { ScanDebugOverlay } from "./ScanDebugOverlay"
// Type-only import (erased at build): the hook owns the convergence/confirmation
// view-model shapes; this presentational component just renders them.
import type { ScanAddConfirmation, ScanConvergence, ScanDebugMetrics, ScanDetectorNudge } from "../hooks/useScanCapture"

export type ScanCameraStatus = "idle" | "camera-error" | "scanning" | "no-card" | "captured" | "no-match"

function downloadCanvasAsPng(canvas: HTMLCanvasElement): void {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `scan-frame-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, "image/png")
}

function downloadDiagnosticAsJson(diagnostic: AcquisitionFrameDiagnostic): void {
  if (typeof URL.createObjectURL !== "function") return
  const blob = new Blob([JSON.stringify(diagnostic, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `scan-frame-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Cause-aware searching hints (DEC-062 / REQ-043 / FLOW-006). Maps the frame
// quality reason to a short, action-oriented nudge. Only shown while searching;
// the locking state stays focused on the named leader and vote progress.
const CONDITION_HINT_COPY: Record<ConditionReason, string> = {
  glare: "Too much glare — tilt the card",
  blur: "Hold steady",
  occlusion: "Keep the card edges in view",
  "low-detail": "Move closer"
}

const DETECTOR_NUDGE_COPY: Record<ScanDetectorNudge, string> = {
  "card-outline": "Fill the guide on a flat contrasting surface; keep fingers off the edges"
}

export type ScanCameraSurfaceProps = {
  onCapture: (image: RgbImage) => void
  onResult?: (result: IdentifyResult | null) => void
  onStatusChange?: (status: ScanCameraStatus) => void
  identify?: (image: RgbImage) => IdentifyResult | Promise<IdentifyResult>
  convergence?: ScanConvergence
  confirmation?: ScanAddConfirmation | null
  /** Read-only per-frame diagnostics for the opt-in debug overlay (DEC-060 / REQ-041). */
  debug?: ScanDebugMetrics | null
  /** Debug-gated, read-only capture/detector diagnostics for acquisition tuning (DEC-077 / REQ-057). */
  onAcquisitionDiagnostic?: (diagnostic: AcquisitionFrameDiagnostic) => void
  autoScanFps?: number
  paused?: boolean
  className?: string
  /** Test seam: overrides the default raw-frame PNG download. Injected in unit tests; omit in production. */
  _frameExporter?: (canvas: HTMLCanvasElement) => void
  /** Test seam: overrides the default diagnostic JSON download. Injected in unit tests; omit in production. */
  _diagnosticExporter?: (diagnostic: AcquisitionFrameDiagnostic) => void
}

function imageDataToRgb(imageData: ImageData): RgbImage {
  const out = new Uint8Array(imageData.width * imageData.height * 3)
  for (let src = 0, dst = 0; src < imageData.data.length; src += 4, dst += 3) {
    out[dst] = imageData.data[src]
    out[dst + 1] = imageData.data[src + 1]
    out[dst + 2] = imageData.data[src + 2]
  }
  return { width: imageData.width, height: imageData.height, data: out }
}

function frameGuideRect(frameWidth: number, frameHeight: number): GuideRect {
  const height = frameHeight * 0.82
  const width = height * (CARD_WIDTH / CARD_HEIGHT)
  return {
    x: (frameWidth - width) / 2,
    y: (frameHeight - height) / 2,
    width,
    height
  }
}

type FocusCapableTrack = MediaStreamTrack & {
  getCapabilities?: () => MediaTrackCapabilities & { focusMode?: string[] }
  getSettings?: () => MediaTrackSettings & { focusMode?: string }
}

function getVideoTrack(stream: MediaStream | null): FocusCapableTrack | null {
  const track = stream?.getVideoTracks?.()[0] ?? stream?.getTracks().find((candidate) => candidate.kind === "video")
  return (track as FocusCapableTrack | undefined) ?? null
}

function getVideoTrackSettings(stream: MediaStream | null): MediaTrackSettings | null {
  const track = getVideoTrack(stream)
  return track?.getSettings?.() ?? null
}

async function requestContinuousFocusIfSupported(stream: MediaStream): Promise<string | null> {
  const track = getVideoTrack(stream)
  const capabilities = track?.getCapabilities?.() as (MediaTrackCapabilities & { focusMode?: string[] }) | undefined
  const focusModes = capabilities?.focusMode
  if (!track?.applyConstraints || !focusModes?.includes("continuous")) return null
  try {
    const constraints = { advanced: [{ focusMode: "continuous" }] } as unknown as MediaTrackConstraints
    await track.applyConstraints(constraints)
    return "continuous"
  } catch {
    return null
  }
}

function captureDiagnosticFromFrame(
  frameIndex: number,
  frame: RgbImage,
  settings: MediaTrackSettings | null,
  requestedFocusMode: string | null
): CaptureDiagnostic {
  const extendedSettings = settings as (MediaTrackSettings & { focusMode?: string }) | null
  return {
    frameIndex,
    timestampMs: Math.round(performance.now()),
    nativeWidth: frame.width,
    nativeHeight: frame.height,
    trackWidth: settings?.width,
    trackHeight: settings?.height,
    trackFrameRate: settings?.frameRate,
    trackFacingMode: settings?.facingMode,
    trackDeviceId: settings?.deviceId,
    trackGroupId: settings?.groupId,
    trackFocusModeRequested: requestedFocusMode ?? undefined,
    trackFocusMode: extendedSettings?.focusMode
  }
}

export function ScanCameraSurface({
  onCapture,
  onResult,
  onStatusChange,
  identify,
  convergence,
  confirmation,
  debug,
  onAcquisitionDiagnostic,
  autoScanFps = 4,
  paused = false,
  className = "",
  _frameExporter,
  _diagnosticExporter
}: ScanCameraSurfaceProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastScanRef = useRef(0)
  const detectionBusyRef = useRef(false)
  const mountedRef = useRef(true)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const phaseRef = useRef(convergence?.phase)
  phaseRef.current = convergence?.phase
  const [status, setStatus] = useState<ScanCameraStatus>("idle")
  const [popup, setPopup] = useState<ScanAddConfirmation | null>(null)
  const [muted, setMuted] = useState(() => loadScanAudioMuted())
  const mutedRef = useRef(muted)
  mutedRef.current = muted
  // Opt-in debug overlay (DEC-060 / REQ-041). Ephemeral and OFF on each scanner
  // open: this component mounts fresh when the scanner opens, so `useState(false)`
  // already resets it; the camera-open effect re-asserts off on a camera re-open.
  const [debugEnabled, setDebugEnabled] = useState(false)
  const debugEnabledRef = useRef(false)
  debugEnabledRef.current = debugEnabled
  const [debugCorners, setDebugCorners] = useState<Point[] | null>(null)
  const [debugFrame, setDebugFrame] = useState<{ width: number; height: number } | null>(null)
  const [debugAcquisitionDiagnostic, setDebugAcquisitionDiagnostic] =
    useState<AcquisitionFrameDiagnostic | null>(null)
  // Always-on locking outline (DEC-083 / REQ-062). The oriented quad is captured
  // into this ref on every detected frame regardless of the debug toggle (cheap:
  // detection/warp already run every frame). It is only pushed into React state
  // — which triggers the SVG render — while `convergence.phase === "locking"`, so
  // scanning with the overlay off and phase "searching" adds zero re-renders.
  const lockCornersRef = useRef<{ corners: Point[]; frameWidth: number; frameHeight: number } | null>(null)
  const [lockOutline, setLockOutline] = useState<{ corners: Point[]; frameWidth: number; frameHeight: number } | null>(
    null
  )
  const frameIndexRef = useRef(0)
  const requestedFocusModeRef = useRef<string | null>(null)
  const frameExporterRef = useRef(_frameExporter ?? downloadCanvasAsPng)
  frameExporterRef.current = _frameExporter ?? downloadCanvasAsPng
  const diagnosticExporterRef = useRef(_diagnosticExporter ?? downloadDiagnosticAsJson)
  diagnosticExporterRef.current = _diagnosticExporter ?? downloadDiagnosticAsJson

  // Momentary thumbs-up on each successful auto-add; keyed on the monotonic id so
  // repeat adds re-trigger the CSS fade and ding.
  useEffect(() => {
    if (!confirmation) return
    setPopup(confirmation)
    if (!mutedRef.current) {
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = 0
        void audio.play().catch(() => {})
      }
    }
    const timer = window.setTimeout(() => setPopup(null), 1400)
    return () => window.clearTimeout(timer)
    // Trigger on the monotonic id only: a fresh add must re-fire even for the same card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmation?.id])

  const updateStatus = useCallback(
    (next: ScanCameraStatus) => {
      setStatus(next)
      onStatusChange?.(next)
    },
    [onStatusChange]
  )

  const scanCurrentFrame = useCallback(
    async (force = false) => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || detectionBusyRef.current) return
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0 || video.videoHeight === 0) {
        return
      }

      detectionBusyRef.current = true
      updateStatus("scanning")
      try {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const frame = imageDataToRgb(ctx.getImageData(0, 0, canvas.width, canvas.height))
        const frameIndex = frameIndexRef.current + 1
        frameIndexRef.current = frameIndex
        const guide = frameGuideRect(frame.width, frame.height)
        const captureDiagnostic =
          debugEnabledRef.current
            ? captureDiagnosticFromFrame(
                frameIndex,
                frame,
                getVideoTrackSettings(streamRef.current),
                requestedFocusModeRef.current
              )
            : null
        if (force && debugEnabledRef.current) {
          frameExporterRef.current(canvas)
        }
        // Always ask the detector to surface corners (DEC-083 / REQ-062): the quad
        // is already computed for the warp regardless of debug, so this only adds
        // one cheap `orientCardQuad` reorder — no extra detection cost (NFR-010).
        const capturedCorners: { current: Point[] | null } = { current: null }
        const detectorOptions = {
          guide,
          maxDetectDimension: MAX_DETECT_DIMENSION,
          onCorners: (corners: Point[]) => (capturedCorners.current = corners)
        }
        const card = detectCard(frame, detectorOptions)
        if (!mountedRef.current) return

        lockCornersRef.current = capturedCorners.current
          ? { corners: capturedCorners.current, frameWidth: frame.width, frameHeight: frame.height }
          : null
        if (phaseRef.current === "locking") {
          setLockOutline(lockCornersRef.current)
        }

        if (debugEnabledRef.current) {
          const detectorCorners = capturedCorners.current
          const diagnostic: AcquisitionFrameDiagnostic = {
            ...(captureDiagnostic ? { capture: captureDiagnostic } : {}),
            detector: {
              success: Boolean(card),
              nativeWidth: frame.width,
              nativeHeight: frame.height,
              maxDetectDimension: MAX_DETECT_DIMENSION,
              guideRect: guide,
              ...(detectorCorners ? { corners: detectorCorners.map((point) => [point.x, point.y] as const) } : {})
            },
            ...(!card ? { reason: "detector-miss" as const } : {})
          }
          setDebugCorners(detectorCorners)
          setDebugFrame({ width: frame.width, height: frame.height })
          setDebugAcquisitionDiagnostic(diagnostic)
          onAcquisitionDiagnostic?.(diagnostic)
          if (force) {
            diagnosticExporterRef.current(diagnostic)
          }
        }

        if (!card) {
          if (force) onResult?.(null)
          updateStatus("no-card")
          return
        }

        onCapture(card)
        if (identify) {
          // Slice E supplies the real lazy-loaded identifier; this component makes no artifact or backend fetches.
          const result = await identify(card)
          if (!mountedRef.current) return
          onResult?.(result)
          updateStatus(result.matched ? "captured" : "no-match")
        } else {
          onResult?.(null)
          updateStatus("captured")
        }
      } finally {
        detectionBusyRef.current = false
      }
    },
    [identify, onAcquisitionDiagnostic, onCapture, onResult, updateStatus]
  )

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false
    // Debug overlay is ephemeral: re-assert OFF whenever the camera (re)opens.
    setDebugEnabled(false)
    setDebugCorners(null)
    setDebugFrame(null)
    setDebugAcquisitionDiagnostic(null)
    lockCornersRef.current = null
    setLockOutline(null)
    requestedFocusModeRef.current = null
    audioRef.current?.load()

    async function openCamera(): Promise<void> {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: { ideal: "environment" },
          },
          audio: false
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        requestedFocusModeRef.current = await requestContinuousFocusIfSupported(stream)
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        updateStatus("idle")
      } catch {
        updateStatus("camera-error")
      }
    }

    void openCamera()

    return () => {
      cancelled = true
      mountedRef.current = false
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [updateStatus])

  useEffect(() => {
    const minMs = 1000 / Math.max(1, autoScanFps)
    const tick = (now: number) => {
      if (!pausedRef.current && now - lastScanRef.current >= minMs && !detectionBusyRef.current) {
        lastScanRef.current = now
        void scanCurrentFrame(false)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [autoScanFps, scanCurrentFrame])

  // Clear the outline once, exactly when phase leaves "locking" — both a drop
  // back to "searching" and a lock-complete/auto-add reset land here.
  useEffect(() => {
    if (convergence?.phase !== "locking") {
      setLockOutline(null)
    }
  }, [convergence?.phase])

  const isLocking = convergence?.phase === "locking" && Boolean(convergence.leaderName)
  const isSearching = status !== "camera-error" && !isLocking
  // Cause-aware hint only while searching under poor frame conditions; never
  // during locking (keeps locking copy clean) or a camera error.
  const conditionHint =
    isSearching && convergence?.conditionHint ? CONDITION_HINT_COPY[convergence.conditionHint] : null
  const detectorNudge =
    isSearching && convergence?.detectorNudge ? DETECTOR_NUDGE_COPY[convergence.detectorNudge] : null
  const searchingNudge = detectorNudge ?? conditionHint
  const inZoneCue = isSearching && !searchingNudge && convergence?.inZone ? "Good — hold steady" : null
  const indicatorText =
    status === "camera-error"
      ? "Camera unavailable"
      : isLocking
        ? `Locking on ${convergence?.leaderName}`
        : (searchingNudge ?? inZoneCue)
  const handleMutedChange = (): void => {
    const next = !muted
    setMuted(next)
    saveScanAudioMuted(next)
  }

  // The scanner's state in the mockup's own words (`card-scan.html`'s `[data-state]`): the stylesheet
  // keys the guide's breathing, the thumbs-up and the camera-error look off it.
  const scanState =
    status === "camera-error"
      ? "camera-error"
      : popup
        ? "added"
        : isLocking
          ? "locking"
          : searchingNudge || inZoneCue
            ? "nudge"
            : "searching"

  return (
    <section className={`scan ${className}`} data-state={scanState} data-debug={debugEnabled}>
      <div className="viewfinder">
        <video ref={videoRef} className="scan-video" muted playsInline />
        <audio ref={audioRef} src="/assets/scanSuccess.wav" preload="auto" />

        {/* The guide: a thin accent border with four corner ticks, breathing while locking; it dims
            everything outside it through the box-shadow spread (`card-scan.html`'s `.guide`). */}
        <div className="guide" data-testid="scan-alignment-guide">
          <span className="tick tl" aria-hidden="true" />
          <span className="tick tr" aria-hidden="true" />
          <span className="tick bl" aria-hidden="true" />
          <span className="tick br" aria-hidden="true" />
        </div>

        {/* "Locking on <card>" + the vote bar, top-left — the text and aria contract are unchanged. */}
        <div role="status" aria-live="polite" className="indicator" hidden={!indicatorText}>
          {indicatorText && (
            <span>
              {!isLocking && status !== "camera-error" && <span className="dot" aria-hidden="true" />}
              {indicatorText}
            </span>
          )}
          {isLocking && (
            <span className="votes">
              <span className="bar">
                <i
                  style={{
                    width: `${Math.min(100, Math.round((convergence!.votes / Math.max(1, convergence!.votesNeeded)) * 100))}%`
                  }}
                />
              </span>
              <span className="n">{`${convergence!.votes}/${convergence!.votesNeeded}`}</span>
            </span>
          )}
        </div>

        {lockOutline && (
          <ScanCardOutline
            corners={lockOutline.corners}
            frameWidth={lockOutline.frameWidth}
            frameHeight={lockOutline.frameHeight}
            variant="affirmative"
          />
        )}
        {debugEnabled && (
          <ScanDebugOverlay
            metrics={debug ?? null}
            acquisitionDiagnostic={debugAcquisitionDiagnostic}
            corners={debugCorners}
            frameWidth={debugFrame?.width ?? null}
            frameHeight={debugFrame?.height ?? null}
          />
        )}

        {popup && (
          <div key={popup.id} role="status" aria-live="polite" className="confirm scan-confirm-popup">
            <div>
              <span className="up" aria-hidden="true">
                👍
              </span>
              <span>{`Added ${popup.cardName}`}</span>
            </div>
          </div>
        )}

        {/* The foot band: sound at the left, the round shutter in the middle, Debug at the right.
            "Mute scan sound"/"Unmute scan sound" and "Capture" keep their exact accessible names
            (DESIGN-BRIEF.md A12); the shutter's disc is decoration. */}
        <div className="vf-foot">
          <button
            type="button"
            onClick={handleMutedChange}
            aria-pressed={muted}
            aria-label={muted ? "Unmute scan sound" : "Mute scan sound"}
            className="mute"
          >
            <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
          </button>
          <button type="button" onClick={() => void scanCurrentFrame(true)} aria-label="Capture" className="shutter" />
          <button
            type="button"
            onClick={() =>
              setDebugEnabled((on) => {
                const next = !on
                if (!next) setDebugAcquisitionDiagnostic(null)
                return next
              })
            }
            aria-pressed={debugEnabled}
            className="debug-toggle"
          >
            Debug
          </button>
        </div>
      </div>
      <p className="credit">Powered by Cardomancer</p>
      {/* REQ-214: the mockup's one-line hint under the frame — text, not a control. */}
      <p className="scan-hint">
        Auto-scan is on: a confident match adds the card and keeps scanning. The shutter reads one frame by hand.
      </p>
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </section>
  )
}
