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
  return { scale: Math.min(canvasWidth, canvasHeight) / size, x: 0, y: 0 }
}

const PALETTE: Record<"light" | "dark", Palette> = {
  light: { background: "#EDF2F4", cell: "#EF233C", grid: "#8D99AE50", debug: "#2B2D42" },
  dark: { background: "#17171c", cell: "#EF233C", grid: "#2B2D42", debug: "#8D99AE" },
}

type Props = {
  cells: CellSet
  diameter: number
  thickness: number
  render: RenderConfig
  gridStyle: GridStyle
  showDebug?: boolean
  showCircleOverlay?: boolean
}

export function CircleCanvas({ cells, diameter, thickness, render, gridStyle, showDebug, showCircleOverlay }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  const palette = isDark ? PALETTE.dark : PALETTE.light

  const transformRef = useRef<Transform>({ scale: 1, x: 0, y: 0 })
  const worldCenterRef = useRef(canvasSize(diameter, render) / 2)
  worldCenterRef.current = canvasSize(diameter, render) / 2
  const cellsRef = useRef(cells)
  cellsRef.current = cells
  const diameterRef = useRef(diameter)
  diameterRef.current = diameter
  const thicknessRef = useRef(thickness)
  thicknessRef.current = thickness
  const renderRef = useRef(render)
  renderRef.current = render
  const paletteRef = useRef(palette)
  paletteRef.current = palette
  const gridStyleRef = useRef(gridStyle)
  gridStyleRef.current = gridStyle
  const showCircleOverlayRef = useRef(showCircleOverlay ?? false)
  showCircleOverlayRef.current = showCircleOverlay ?? false

  const { draw, scheduleDraw } = useDrawCircle(
    canvasRef,
    transformRef,
    cellsRef,
    diameterRef,
    thicknessRef,
    renderRef,
    paletteRef,
    gridStyleRef,
    showCircleOverlayRef,
  )

  useResizeCanvas(wrapperRef, canvasRef, draw, (width, height) => {
    const size = canvasSize(diameterRef.current, renderRef.current)
    transformRef.current = fitTransform(width, height, size)
  })

  useZoom(canvasRef, transformRef, worldCenterRef, scheduleDraw)
  usePan(canvasRef, transformRef, scheduleDraw)
  useFitOnChange(canvasRef, transformRef, diameter, render, scheduleDraw, fitTransform)

  // Redraw when cells, palette, grid style, or overlay options change
  useEffect(() => {
    scheduleDraw()
  }, [cells, thickness, palette, gridStyle, showCircleOverlay, scheduleDraw])

  return (
    <div ref={wrapperRef} className="relative size-full">
      <canvas ref={canvasRef} className="touch-none" />
      <DebugPanel transformRef={transformRef} show={showDebug ?? false} />
    </div>
  )
}
