import { useEffect, useRef } from "react"

import { DebugPanel } from "@/components/debug-panel"
import { useTheme } from "@/components/theme-provider"
import { useDrawCircle, type GridStyle, type Palette, type Transform } from "@/hooks/use-draw-circle"
import { useFitOnChange } from "@/hooks/use-fit-on-change"
import { usePan } from "@/hooks/use-pan"
import { useResizeCanvas } from "@/hooks/use-resize-canvas"
import { useZoom } from "@/hooks/use-zoom"
import { type CellSet } from "@/lib/circle"
import { type RenderConfig, canvasSize } from "@/lib/render"

function fitTransform(canvasWidth: number, canvasHeight: number, size: number): Transform {
  const scale = Math.min(canvasWidth, canvasHeight) / size
  return { scale, x: (canvasWidth - size * scale) / 2, y: (canvasHeight - size * scale) / 2 }
}

const PALETTE: Record<"light" | "dark", Palette> = {
  light: { background: "#EDF2F4", cell: "#EF233C", grid: "#8D99AE50" },
  dark: { background: "#17171c", cell: "#EF233C", grid: "#2B2D42" },
}

type Props = {
  cells: CellSet
  diameter: number
  render: RenderConfig
  gridStyle: GridStyle
  showDebug?: boolean
}

export function CircleCanvas({ cells, diameter, render, gridStyle, showDebug }: Props) {
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
  const gridStyleRef = useRef(gridStyle)
  gridStyleRef.current = gridStyle

  const { draw, scheduleDraw } = useDrawCircle(
    canvasRef,
    transformRef,
    cellsRef,
    diameterRef,
    renderRef,
    paletteRef,
    gridStyleRef,
  )

  useResizeCanvas(wrapperRef, canvasRef, draw, (width, height) => {
    const size = canvasSize(diameterRef.current, renderRef.current)
    transformRef.current = fitTransform(width, height, size)
  })

  useZoom(canvasRef, transformRef, scheduleDraw)
  usePan(canvasRef, transformRef, scheduleDraw)
  useFitOnChange(canvasRef, transformRef, diameter, render, scheduleDraw, fitTransform)

  // Redraw when cells, palette, or grid style change
  useEffect(() => {
    scheduleDraw()
  }, [cells, palette, gridStyle, scheduleDraw])

  return (
    <div ref={wrapperRef} className="relative size-full">
      <canvas ref={canvasRef} />
      <DebugPanel transformRef={transformRef} show={showDebug ?? false} />
    </div>
  )
}
