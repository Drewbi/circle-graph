import { useCallback, useRef } from "react"

import { type CellSet, decodeCell } from "@/lib/circle"
import { type RenderConfig, cellToPixel } from "@/lib/render"

export type Transform = { scale: number; x: number; y: number }
export type Palette = { background: string; cell: string; gridLine: string }

export function useDrawCircle(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  transformRef: React.RefObject<Transform>,
  cellsRef: React.RefObject<CellSet>,
  diameterRef: React.RefObject<number>,
  renderRef: React.RefObject<RenderConfig>,
  paletteRef: React.RefObject<Palette>,
) {
  const rafRef = useRef<number | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { scale, x: offsetX, y: offsetY } = transformRef.current!
    const { background, cell, gridLine } = paletteRef.current!
    const cells = cellsRef.current!
    const diameter = diameterRef.current!
    const render = renderRef.current!
    const { cellSize } = render

    ctx.resetTransform()
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY)

    ctx.fillStyle = cell
    for (const packed of cells) {
      const { x, y } = decodeCell(packed)
      const { px, py } = cellToPixel(x, y, diameter, render)
      ctx.fillRect(px, py, cellSize, cellSize)
    }

    // Compute visible world bounds from the current transform
    const worldLeft = -offsetX / scale
    const worldTop = -offsetY / scale
    const worldRight = (canvas.width - offsetX) / scale
    const worldBottom = (canvas.height - offsetY) / scale

    const firstCol = Math.floor(worldLeft / cellSize)
    const lastCol = Math.ceil(worldRight / cellSize)
    const firstRow = Math.floor(worldTop / cellSize)
    const lastRow = Math.ceil(worldBottom / cellSize)

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
    ctx.strokeStyle = gridLine
    ctx.lineWidth = 1 / scale
    ctx.stroke()
  }, [canvasRef, transformRef, cellsRef, diameterRef, renderRef, paletteRef])

  const scheduleDraw = useCallback(() => {
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      draw()
    })
  }, [draw])

  return { draw, scheduleDraw }
}
