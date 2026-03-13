// Coordinates relative to the circle center (integer grid positions)
export type Point = {
  x: number
  y: number
}

// Configuration for a circle/ring
// diameter: outer extent in blocks
// thickness: 1 = single-block outline; Math.floor(diameter / 2) = filled disk
//
// Internally: outerRadius = diameter / 2
//             innerRadius = outerRadius - thickness
// A cell is filled when innerRadius ≤ dist(cell) ≤ outerRadius
export type CircleConfig = {
  diameter: number
  thickness: number
}

// Maximum coordinate value (positive or negative) for encoded cells.
// Bit-packing uses 16 bits per axis, giving a signed range of ±32767.
export const MAX_COORD = 32767

// Filled cell coordinates bit-packed into a single number.
// Upper 16 bits = x, lower 16 bits = y, both as signed 16-bit integers.
// Use encodeCell / decodeCell to convert.
export type CellSet = Set<number>

export function encodeCell(x: number, y: number): number {
  return ((x & 0xffff) << 16) | (y & 0xffff)
}

export function decodeCell(packed: number): Point {
  return {
    x: packed >> 16,
    y: (packed << 16) >> 16,
  }
}

// Computes the set of filled cells for a circle or ring.
//
// Even diameters sample at cell corner (x + 0.5, y + 0.5) so the four
// central cells are equidistant — no center block. Odd diameters sample
// at cell center (x, y) so cell (0, 0) is the center block.
//
// Valid thickness range: 1 to Math.ceil(diameter / 2).
// thickness = 1 → single-block outline
// thickness = Math.ceil(diameter / 2) → filled disk
export function computeCircleCells(config: CircleConfig): CellSet {
  const { diameter, thickness } = config
  const outerRadius = diameter / 2
  const innerRadius = outerRadius - thickness
  const isEven = diameter % 2 === 0

  const cells: CellSet = new Set()
  const half = Math.ceil(outerRadius)

  for (let x = -half; x <= half; x++) {
    for (let y = -half; y <= half; y++) {
      const dx = isEven ? x + 0.5 : x
      const dy = isEven ? y + 0.5 : y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist >= innerRadius && dist <= outerRadius) {
        cells.add(encodeCell(x, y))
      }
    }
  }

  return cells
}
