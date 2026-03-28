import { useCallback, useRef } from "react"

import { type CellSet, decodeCell } from "@/lib/circle"
import { type RenderConfig, cellToPixel } from "@/lib/render"

export type Transform = { scale: number; x: number; y: number }
export type Palette = { background: string; cell: string; grid: string; debug: string }
export type GridStyle = "dots" | "lines"

type TileCache = { key: string; pattern: CanvasPattern }

function makeDotTile(cellSize: number, dotRadius: number, color: string): OffscreenCanvas {
  const tile = new OffscreenCanvas(cellSize, cellSize)
  const ctx = tile.getContext("2d")!
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cellSize / 2, cellSize / 2, dotRadius, 0, Math.PI * 2)
  ctx.fill()
  return tile
}

export function useDrawCircle(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  transformRef: React.RefObject<Transform>,
  cellsRef: React.RefObject<CellSet>,
  diameterRef: React.RefObject<number>,
  thicknessRef: React.RefObject<number>,
  renderRef: React.RefObject<RenderConfig>,
  paletteRef: React.RefObject<Palette>,
  gridStyleRef: React.RefObject<GridStyle>,
  showCircleOverlayRef: React.RefObject<boolean>,
  showCentreDebugRef: React.RefObject<boolean>,
) {
  const rafRef = useRef<number | null>(null)
  const tileCacheRef = useRef<TileCache | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { scale, x: offsetX, y: offsetY } = transformRef.current!
    const { background, cell, grid, debug } = paletteRef.current!
    const cells = cellsRef.current!
    const diameter = diameterRef.current!
    const thickness = thicknessRef.current!
    const render = renderRef.current!
    const gridStyle = gridStyleRef.current!
    const showCircleOverlay = showCircleOverlayRef.current!
    const showCentreDebug = showCentreDebugRef.current!
    const { cellSize } = render
    const gap = 1

    ctx.resetTransform()
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // x/y are pan offsets from centre — compute the actual pixel offset for setTransform
    const worldCenter = (diameter / 2 + render.padding) * render.cellSize
    const actualX = canvas.width / 2 - worldCenter * scale + offsetX
    const actualY = canvas.height / 2 - worldCenter * scale + offsetY
    ctx.setTransform(scale, 0, 0, scale, actualX, actualY)

    if (gridStyle === "dots") {
      // Tile is created at screen resolution so dots stay crisp at any zoom.
      // pattern.setTransform corrects the tile back to cellSize world units,
      // also absorbing any rounding error from the integer canvas size.
      const tileScreen = Math.max(cellSize, Math.round(cellSize * scale))
      const key = `${tileScreen},${grid}`

      if (tileCacheRef.current?.key !== key) {
        const tile = makeDotTile(tileScreen, tileScreen / 10, grid)
        const pattern = ctx.createPattern(tile, "repeat")!
        tileCacheRef.current = { key, pattern }
      }

      const s = cellSize / tileScreen // maps tile pixels → world units
      tileCacheRef.current!.pattern.setTransform(new DOMMatrix([s, 0, 0, s, 0, 0]))

      const worldLeft = -actualX / scale
      const worldTop = -actualY / scale
      ctx.fillStyle = tileCacheRef.current!.pattern
      ctx.fillRect(worldLeft, worldTop, canvas.width / scale, canvas.height / scale)
    }

    // Filled cells with a small inset gap (overdraw dots underneath)
    ctx.fillStyle = cell
    for (const packed of cells) {
      const { x, y } = decodeCell(packed)
      const { px, py } = cellToPixel(x, y, diameter, render)
      ctx.fillRect(px + gap, py + gap, cellSize - gap * 2, cellSize - gap * 2)
    }

    if (showCircleOverlay) {
      const { cellSize, padding } = render
      const outerRadius = diameter / 2
      const innerRadius = Math.max(0, outerRadius - thickness)
      // Center is always at (outerRadius + padding) * cellSize for both even and odd diameters
      const cx = (outerRadius + padding) * cellSize
      const cy = (outerRadius + padding) * cellSize

      ctx.save()
      ctx.globalAlpha = 0.25
      ctx.fillStyle = debug
      ctx.beginPath()
      ctx.arc(cx, cy, outerRadius * cellSize, 0, Math.PI * 2, false)
      if (innerRadius > 0) ctx.arc(cx, cy, innerRadius * cellSize, 0, Math.PI * 2, true)
      ctx.fill("evenodd")
      ctx.restore()
    }

    if (showCentreDebug) {
      const { cellSize, padding } = render
      const outerRadius = diameter / 2
      const cx = (outerRadius + padding) * cellSize
      const cy = (outerRadius + padding) * cellSize
      const lineLen = outerRadius  * cellSize

      ctx.save()
      // Clip all lines to the outer circle so they terminate at the radius
      ctx.beginPath()
      ctx.arc(cx, cy, lineLen, 0, Math.PI * 2)
      ctx.clip()

      ctx.strokeStyle = debug
      ctx.lineWidth = 1 / scale
      ctx.globalAlpha = 0.6
      ctx.setLineDash([6 / scale, 6 / scale])

      ctx.beginPath()
      // Horizontal
      ctx.moveTo(cx - lineLen, cy)
      ctx.lineTo(cx + lineLen, cy)
      // Vertical
      ctx.moveTo(cx, cy - lineLen)
      ctx.lineTo(cx, cy + lineLen)
      // Diagonal (octant boundary at 45°)
      ctx.moveTo(cx - lineLen, cy - lineLen)
      ctx.lineTo(cx + lineLen, cy + lineLen)
      // Anti-diagonal (octant boundary at 135°)
      ctx.moveTo(cx - lineLen, cy + lineLen)
      ctx.lineTo(cx + lineLen, cy - lineLen)
      ctx.stroke()

      ctx.setLineDash([])

      // Highlight centre: single cell for odd diameter, marker dot for even
      ctx.fillStyle = debug
      if (diameter % 2 === 1) {
        const { px, py } = cellToPixel(0, 0, diameter, render)
        ctx.globalAlpha = 0.35
        ctx.fillRect(px, py, cellSize, cellSize)
      } else {
        // Even: no cell sits at centre — draw a small diamond at the intersection
        const s = cellSize * 0.35
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.moveTo(cx, cy - s)
        ctx.lineTo(cx + s, cy)
        ctx.lineTo(cx, cy + s)
        ctx.lineTo(cx - s, cy)
        ctx.closePath()
        ctx.fill()
      }

      ctx.restore()
    }

    if (gridStyle === "lines") {
      const worldLeft = -actualX / scale
      const worldTop = -actualY / scale
      const worldRight = (canvas.width - actualX) / scale
      const worldBottom = (canvas.height - actualY) / scale

      const firstCol = Math.floor(worldLeft / cellSize)
      const lastCol = Math.ceil(worldRight / cellSize)
      const firstRow = Math.floor(worldTop / cellSize)
      const lastRow = Math.ceil(worldBottom / cellSize)

      ctx.strokeStyle = grid
      ctx.lineWidth = 1 / scale
      ctx.beginPath()
      for (let i = firstCol; i <= lastCol; i++) {
        const x = i * cellSize
        ctx.moveTo(x, worldTop)
        ctx.lineTo(x, worldBottom)
      }
      for (let i = firstRow; i <= lastRow; i++) {
        const y = i * cellSize
        ctx.moveTo(worldLeft, y)
        ctx.lineTo(worldRight, y)
      }
      ctx.stroke()
    }
  }, [canvasRef, transformRef, cellsRef, diameterRef, thicknessRef, renderRef, paletteRef, gridStyleRef, showCircleOverlayRef, showCentreDebugRef])

  const scheduleDraw = useCallback(() => {
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      draw()
    })
  }, [draw])

  return { draw, scheduleDraw }
}
