import { useCallback, useEffect, useRef, useState } from "react"
import { detectCard } from "../lib/scan/detector"
import type { IdentifyResult, RgbImage } from "../lib/scan/types"

export type ScanCameraStatus = "idle" | "camera-error" | "scanning" | "no-card" | "captured" | "no-match"

export type ScanCameraSurfaceProps = {
  onCapture: (image: RgbImage) => void
  onResult?: (result: IdentifyResult | null) => void
  onStatusChange?: (status: ScanCameraStatus) => void
  identify?: (image: RgbImage) => IdentifyResult | Promise<IdentifyResult>
  autoScanFps?: number
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
  autoScanFps = 4,
  className = ""
}: ScanCameraSurfaceProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastScanRef = useRef(0)
  const detectionBusyRef = useRef(false)
  const mountedRef = useRef(true)
  const [status, setStatus] = useState<ScanCameraStatus>("idle")

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
        const card = detectCard(frame)
        if (!mountedRef.current) return

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
      if (now - lastScanRef.current >= minMs && !detectionBusyRef.current) {
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

  const statusText =
    status === "camera-error"
      ? "Camera unavailable"
      : status === "scanning"
        ? "Scanning"
        : status === "no-card"
          ? "No card found"
          : status === "no-match"
            ? "No match"
            : status === "captured"
              ? "Captured"
              : "Ready"

  return (
    <section className={`space-y-3 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl border border-slate-600 bg-slate-950">
        <video ref={videoRef} className="aspect-[3/4] w-full bg-slate-950 object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[82%] aspect-[745/1040] rounded-xl border-2 border-emerald-300/90 shadow-[0_0_0_999px_rgba(15,23,42,0.35)]" />
        </div>
        <div className="absolute left-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-slate-100">
          {statusText}
        </div>
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
