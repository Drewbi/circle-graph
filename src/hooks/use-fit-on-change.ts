import { useEffect, useRef } from "react"

import { type Transform } from "@/hooks/use-draw-circle"
import { type RenderConfig, canvasSize } from "@/lib/render"

export function useFitOnChange(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  transformRef: React.RefObject<Transform>,
  diameter: number,
  render: RenderConfig,
  scheduleDraw: () => void,
  fitTransform: (width: number, height: number, size: number) => Transform,
) {
  const prevDiameterRef = useRef(diameter)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvas.width === 0) return

    const { x, y, scale } = transformRef.current
    const threshold = canvasSize(diameter, render) * scale * 0.1

    if (
      Math.abs(diameter - prevDiameterRef.current) > 1 ||
      (Math.abs(x) < threshold && Math.abs(y) < threshold)
    ) {
      transformRef.current = fitTransform(canvas.width, canvas.height, canvasSize(diameter, render))
    }

    prevDiameterRef.current = diameter
    scheduleDraw()
  }, [diameter, render, scheduleDraw, canvasRef, transformRef, fitTransform])
}
