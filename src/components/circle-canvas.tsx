import { useEffect, useRef } from "react"

import { useTheme } from "@/components/theme-provider"
import { useDrawCircle, type Palette, type Transform } from "@/hooks/use-draw-circle"
import { usePan } from "@/hooks/use-pan"
import { useResizeCanvas } from "@/hooks/use-resize-canvas"
import { useZoom } from "@/hooks/use-zoom"
import { type CellSet } from "@/lib/circle"
import { type RenderConfig, canvasSize } from "@/lib/render"

const PALETTE: Record<"light" | "dark", Palette> = {
  light: { background: "#EDF2F4", cell: "#EF233C", gridLine: "#8D99AE50" },
  dark: { background: "#101119", cell: "#EF233C", gridLine: "#2B2D4250" },
}

type Props = {
  cells: CellSet
  diameter: number
  render: RenderConfig
}

export function CircleCanvas({ cells, diameter, render }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  const palette = isDark ? PALETTE.dark : PALETTE.light

  const transformRef = useRef<Transform>({ scale: 1, x: 0, y: 0 })
  const cellsRef = useRef(cells)
  cellsRef.current = cells
  const diameterRef = useRef(diameter)
  diameterRef.current = diameter
  const renderRef = useRef(render)
  renderRef.current = render
  const paletteRef = useRef(palette)
  paletteRef.current = palette

  const { draw, scheduleDraw } = useDrawCircle(
    canvasRef,
    transformRef,
    cellsRef,
    diameterRef,
    renderRef,
    paletteRef,
  )

  useResizeCanvas(wrapperRef, canvasRef, draw, (width, height) => {
    const size = canvasSize(diameterRef.current, renderRef.current)
    transformRef.current = { scale: 1, x: (width - size) / 2, y: (height - size) / 2 }
  })

  useZoom(canvasRef, transformRef, scheduleDraw)
  usePan(canvasRef, transformRef, scheduleDraw)

  // Re-center when diameter changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvas.width === 0) return
    const size = canvasSize(diameter, render)
    const { scale } = transformRef.current
    transformRef.current = {
      scale,
      x: (canvas.width - size * scale) / 2,
      y: (canvas.height - size * scale) / 2,
    }
    scheduleDraw()
  }, [diameter, render, scheduleDraw])

  // Redraw when cells or palette change
  useEffect(() => {
    scheduleDraw()
  }, [cells, palette, scheduleDraw])

  return (
    <div ref={wrapperRef} className="size-full">
      <canvas ref={canvasRef} />
    </div>
  )
}
