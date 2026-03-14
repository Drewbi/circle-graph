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

    canvas.addEventListener("wheel", onWheel, { passive: false })
    return () => canvas.removeEventListener("wheel", onWheel)
  }, [canvasRef, transformRef, scheduleDraw])
}
