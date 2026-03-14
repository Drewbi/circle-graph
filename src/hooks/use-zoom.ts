import { useEffect } from "react"

import type { Transform } from "@/hooks/use-draw-circle"

export function useZoom(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  transformRef: React.RefObject<Transform>,
  worldCenterRef: React.RefObject<number>,
  scheduleDraw: () => void,
) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()

      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top

      const { scale, x: panX, y: panY } = transformRef.current!
      const wc = worldCenterRef.current!

      // Resolve pan-from-centre to absolute pixel offsets
      const offsetX = canvas.width / 2 - wc * scale + panX
      const offsetY = canvas.height / 2 - wc * scale + panY

      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      const newScale = Math.min(Math.max(scale * factor, 0.1), 20)

      // Keep the world point under the cursor fixed
      const newOffsetX = cx - (cx - offsetX) * (newScale / scale)
      const newOffsetY = cy - (cy - offsetY) * (newScale / scale)

      // Convert back to pan-from-centre
      transformRef.current!.scale = newScale
      transformRef.current!.x = newOffsetX - (canvas.width / 2 - wc * newScale)
      transformRef.current!.y = newOffsetY - (canvas.height / 2 - wc * newScale)

      scheduleDraw()
    }

    let lastPinchDist = 0

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0], t2 = e.touches[1]
        lastPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return

      const t1 = e.touches[0], t2 = e.touches[1]
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      if (lastPinchDist === 0) { lastPinchDist = dist; return }

      const factor = dist / lastPinchDist
      lastPinchDist = dist

      const rect = canvas.getBoundingClientRect()
      const cx = (t1.clientX + t2.clientX) / 2 - rect.left
      const cy = (t1.clientY + t2.clientY) / 2 - rect.top

      const { scale, x: panX, y: panY } = transformRef.current!
      const wc = worldCenterRef.current!

      const offsetX = canvas.width / 2 - wc * scale + panX
      const offsetY = canvas.height / 2 - wc * scale + panY

      const newScale = Math.min(Math.max(scale * factor, 0.1), 20)

      const newOffsetX = cx - (cx - offsetX) * (newScale / scale)
      const newOffsetY = cy - (cy - offsetY) * (newScale / scale)

      transformRef.current!.scale = newScale
      transformRef.current!.x = newOffsetX - (canvas.width / 2 - wc * newScale)
      transformRef.current!.y = newOffsetY - (canvas.height / 2 - wc * newScale)

      scheduleDraw()
    }

    const onTouchEnd = () => { lastPinchDist = 0 }

    canvas.addEventListener("wheel", onWheel, { passive: false })
    canvas.addEventListener("touchstart", onTouchStart, { passive: true })
    canvas.addEventListener("touchmove", onTouchMove, { passive: true })
    canvas.addEventListener("touchend", onTouchEnd)
    return () => {
      canvas.removeEventListener("wheel", onWheel)
      canvas.removeEventListener("touchstart", onTouchStart)
      canvas.removeEventListener("touchmove", onTouchMove)
      canvas.removeEventListener("touchend", onTouchEnd)
    }
  }, [canvasRef, transformRef, worldCenterRef, scheduleDraw])
}
