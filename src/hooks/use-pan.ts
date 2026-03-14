import { useEffect } from "react"

import type { Transform } from "@/hooks/use-draw-circle"

export function usePan(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  transformRef: React.RefObject<Transform>,
  scheduleDraw: () => void,
) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let dragging = false
    let startX = 0
    let startY = 0
    let startTx = 0
    let startTy = 0

    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary) {
        // Second finger arrived — cancel single-finger pan so pinch-zoom can take over
        dragging = false
        canvas.style.cursor = "grab"
        return
      }
      dragging = true
      startX = e.clientX
      startY = e.clientY
      startTx = transformRef.current!.x
      startTy = transformRef.current!.y
      canvas.setPointerCapture(e.pointerId)
      canvas.style.cursor = "grabbing"
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      transformRef.current!.x = startTx + (e.clientX - startX)
      transformRef.current!.y = startTy + (e.clientY - startY)
      scheduleDraw()
    }

    const onPointerUp = () => {
      dragging = false
      canvas.style.cursor = "grab"
    }

    canvas.style.cursor = "grab"
    canvas.addEventListener("pointerdown", onPointerDown)
    canvas.addEventListener("pointermove", onPointerMove)
    canvas.addEventListener("pointerup", onPointerUp)

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown)
      canvas.removeEventListener("pointermove", onPointerMove)
      canvas.removeEventListener("pointerup", onPointerUp)
    }
  }, [canvasRef, transformRef, scheduleDraw])
}
