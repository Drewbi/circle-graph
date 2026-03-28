// Coordinates relative to the circle center (integer grid positions)
export type Point = {
  x: number
  y: number
}
// Configuration for a circle/ring

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

function mirrorOctants({ x, y }: Point, set: CellSet) {
    set.add(encodeCell(x, y))
    set.add(encodeCell(-x, -y))
    set.add(encodeCell(x, -y))
    set.add(encodeCell(-x, y))

    set.add(encodeCell(y, x))
    set.add(encodeCell(-y, -x))
    set.add(encodeCell(y, -x))
    set.add(encodeCell(-y, x))
}

function computeBresenhamCircleCells(config: CircleConfig): CellSet {
  const set: CellSet = new Set<number>()
  const isEven = config.diameter % 2 === 0
  const r = config.diameter / 2
  let x = 0
  let y = r
  let d = 3 - config.diameter
  console.log({x, y, d})
  mirrorOctants({ x, y }, set)

  while (y >= x) {
    x++
    
    if (d > 0) {
      y--
      d = d + 4 * (x - y) + 10
    } else {
      d = d + 4 * x + 6
    }
    
    mirrorOctants({ x, y }, set)
  }

return set
}

// --- Public API ---------------------------------------------------------
export function computeCircleCells(config: CircleConfig): CellSet {
  return computeBresenhamCircleCells(config)
}
