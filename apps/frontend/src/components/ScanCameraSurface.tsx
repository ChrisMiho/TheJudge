import { useCallback, useEffect, useRef, useState } from "react"
import { detectCard, type Point } from "../lib/scan/detector"
import { loadScanAudioMuted, saveScanAudioMuted } from "../lib/scan/audioPrefs"
import type { IdentifyResult, RgbImage } from "../lib/scan/types"
import { ScanDebugOverlay } from "./ScanDebugOverlay"
// Type-only import (erased at build): the hook owns the convergence/confirmation
// view-model shapes; this presentational component just renders them.
import type { ScanAddConfirmation, ScanConvergence, ScanDebugMetrics } from "../hooks/useScanCapture"

export type ScanCameraStatus = "idle" | "camera-error" | "scanning" | "no-card" | "captured" | "no-match"

export type ScanCameraSurfaceProps = {
  onCapture: (image: RgbImage) => void
  onResult?: (result: IdentifyResult | null) => void
  onStatusChange?: (status: ScanCameraStatus) => void
  identify?: (image: RgbImage) => IdentifyResult | Promise<IdentifyResult>
  convergence?: ScanConvergence
  confirmation?: ScanAddConfirmation | null
  /** Read-only per-frame diagnostics for the opt-in debug overlay (DEC-060 / REQ-041). */
  debug?: ScanDebugMetrics | null
  autoScanFps?: number
  paused?: boolean
  className?: string
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

export function ScanCameraSurface({
  onCapture,
  onResult,
  onStatusChange,
  identify,
  convergence,
  confirmation,
  debug,
  autoScanFps = 4,
  paused = false,
  className = ""
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
        // Only ask the detector to surface corners while the overlay is enabled,
        // so disabled-overlay scanning keeps the round-1 cost (NFR-010).
        let capturedCorners: Point[] | null = null
        const card = detectCard(
          frame,
          debugEnabledRef.current ? { onCorners: (corners) => (capturedCorners = corners) } : {}
        )
        if (!mountedRef.current) return

        if (debugEnabledRef.current) {
          setDebugCorners(capturedCorners)
          setDebugFrame({ width: frame.width, height: frame.height })
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
    [identify, onCapture, onResult, updateStatus]
  )

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false
    // Debug overlay is ephemeral: re-assert OFF whenever the camera (re)opens.
    setDebugEnabled(false)
    setDebugCorners(null)
    setDebugFrame(null)
    audioRef.current?.load()

    async function openCamera(): Promise<void> {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        })
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

  const isLocking = convergence?.phase === "locking" && Boolean(convergence.leaderName)
  const indicatorText =
    status === "camera-error"
      ? "Camera unavailable"
      : isLocking
        ? `Locking on ${convergence?.leaderName}`
        : "Searching for a card…"
  const handleMutedChange = (): void => {
    const next = !muted
    setMuted(next)
    saveScanAudioMuted(next)
  }

  return (
    <section className={`space-y-3 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl border border-slate-600 bg-slate-950">
        <video ref={videoRef} className="aspect-[3/4] w-full bg-slate-950 object-cover" muted playsInline />
        <audio ref={audioRef} src="/assets/scanSuccess.wav" preload="auto" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[82%] aspect-[745/1040] rounded-xl border-2 border-emerald-300/90 shadow-[0_0_0_999px_rgba(15,23,42,0.35)]" />
        </div>
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute left-3 top-3 flex max-w-[80%] flex-col gap-1 rounded-xl bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-100"
        >
          <span>{indicatorText}</span>
          {isLocking && (
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-700/80">
                <span
                  className="block h-full rounded-full bg-emerald-400 transition-[width] duration-150"
                  style={{
                    width: `${Math.min(100, Math.round((convergence!.votes / Math.max(1, convergence!.votesNeeded)) * 100))}%`
                  }}
                />
              </span>
              <span className="text-[11px] font-medium text-emerald-200/90">
                {`${convergence!.votes}/${convergence!.votesNeeded}`}
              </span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleMutedChange}
          aria-pressed={muted}
          aria-label={muted ? "Unmute scan sound" : "Mute scan sound"}
          className="absolute left-3 top-[4.75rem] rounded-full bg-slate-950/70 px-2.5 py-1 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
        </button>
        {debugEnabled && (
          <ScanDebugOverlay
            metrics={debug ?? null}
            corners={debugCorners}
            frameWidth={debugFrame?.width ?? null}
            frameHeight={debugFrame?.height ?? null}
          />
        )}
        <button
          type="button"
          onClick={() => setDebugEnabled((on) => !on)}
          aria-pressed={debugEnabled}
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
            debugEnabled
              ? "bg-sky-500/90 text-sky-50"
              : "bg-slate-950/70 text-slate-300 hover:bg-slate-800/80"
          }`}
        >
          Debug
        </button>
        {popup && (
          <div
            key={popup.id}
            role="status"
            aria-live="polite"
            className="scan-confirm-popup pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-1 rounded-2xl bg-emerald-500/90 px-5 py-4 text-emerald-50 shadow-lg">
              <span className="text-4xl" aria-hidden="true">
                👍
              </span>
              <span className="text-sm font-semibold">{`Added ${popup.cardName}`}</span>
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-slate-950/60 px-2.5 py-1 text-[10px] font-medium text-slate-300/80">
          Powered by Cardomancer
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      <button
        type="button"
        onClick={() => void scanCurrentFrame(true)}
        className="w-full rounded-lg border border-emerald-400/70 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-300"
      >
        Capture
      </button>
    </section>
  )
}
