import { useEffect } from "react"

import type { Transform } from "@/hooks/use-draw-circle"

export function useZoom(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  transformRef: React.RefObject<Transform>,
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

      const { scale, x, y } = transformRef.current!
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      const newScale = Math.min(Math.max(scale * factor, 0.1), 20)

      transformRef.current!.scale = newScale
      transformRef.current!.x = cx - (cx - x) * (newScale / scale)
      transformRef.current!.y = cy - (cy - y) * (newScale / scale)

      scheduleDraw()
    }

    canvas.addEventListener("wheel", onWheel, { passive: false })
    return () => canvas.removeEventListener("wheel", onWheel)
  }, [canvasRef, transformRef, scheduleDraw])
}
