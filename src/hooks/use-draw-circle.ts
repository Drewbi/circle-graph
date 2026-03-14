import { useCallback, useRef } from "react"

import { type CellSet, decodeCell } from "@/lib/circle"
import { type RenderConfig, cellToPixel } from "@/lib/render"

export type Transform = { scale: number; x: number; y: number }
export type Palette = { background: string; cell: string; grid: string }
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
  renderRef: React.RefObject<RenderConfig>,
  paletteRef: React.RefObject<Palette>,
  gridStyleRef: React.RefObject<GridStyle>,
) {
  const rafRef = useRef<number | null>(null)
  const tileCacheRef = useRef<TileCache | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { scale, x: offsetX, y: offsetY } = transformRef.current!
    const { background, cell, grid } = paletteRef.current!
    const cells = cellsRef.current!
    const diameter = diameterRef.current!
    const render = renderRef.current!
    const gridStyle = gridStyleRef.current!
    const { cellSize } = render
    const gap = 1

    ctx.resetTransform()
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY)

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

      const worldLeft = -offsetX / scale
      const worldTop = -offsetY / scale
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

    if (gridStyle === "lines") {
      const worldLeft = -offsetX / scale
      const worldTop = -offsetY / scale
      const worldRight = (canvas.width - offsetX) / scale
      const worldBottom = (canvas.height - offsetY) / scale

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
  }, [canvasRef, transformRef, cellsRef, diameterRef, renderRef, paletteRef, gridStyleRef])

  const scheduleDraw = useCallback(() => {
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      draw()
    })
  }, [draw])

  return { draw, scheduleDraw }
}
