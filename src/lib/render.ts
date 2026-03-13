export type RenderConfig = {
  cellSize: number // pixels per cell
  padding: number // empty cells around the circle on each side
}

// Total pixel dimension of the canvas (square)
export function canvasSize(diameter: number, config: RenderConfig): number {
  return (diameter + 2 * config.padding) * config.cellSize
}

// Top-left pixel position of a cell at circle coordinates (x, y)
export function cellToPixel(
  x: number,
  y: number,
  diameter: number,
  config: RenderConfig
): { px: number; py: number } {
  const { cellSize, padding } = config
  const col = x + Math.floor(diameter / 2) + padding
  const row = Math.ceil(diameter / 2) - 1 - y + padding
  return { px: col * cellSize, py: row * cellSize }
}
