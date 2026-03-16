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

// --- Distance-based algorithm -------------------------------------------

// Computes the set of filled cells for a circle or ring using a distance check.
//
// Even diameters sample at cell corner (x + 0.5, y + 0.5) so the four
// central cells are equidistant — no center block. Odd diameters sample
// at cell center (x, y) so cell (0, 0) is the center block.
//
// Valid thickness range: 1 to Math.ceil(diameter / 2).
// thickness = 1 → single-block outline
// thickness = Math.ceil(diameter / 2) → filled disk
function computeDistanceCells(config: CircleConfig): CellSet {
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

// --- Midpoint (Bresenham) algorithm -------------------------------------
//
// Works in one octant (x: 0 → r·cos45°, y decreasing) using a decision
// variable derived from evaluating the circle equation at the midpoint
// between the two candidate pixels at each step.
//
// Decision variable F (4× scaled to stay integer):
//   even diameter: F_init = 13 − 8r,  E: F += 8x+16,  SE: F += 8x−8y+20
//   odd  diameter: F_init = 4 − 8R,   E: F += 8x+12,  SE: F += 8x−8y+20
// where R = (d−1)/2 and r = d/2 for even d.
//
// The algorithm always increments x, so each x value appears exactly once,
// and since the choice is strictly E-or-SE, no two adjacent cells share both
// a horizontal and vertical neighbour — fat corners are structurally impossible.
//
// For rings the outer and inner arcs are generated separately. For each x the
// span [y_inner, y_outer] is filled. The inner diameter is snapped to the
// nearest integer with the same parity as the outer so both arcs share the
// same half-pixel sample offset.

function midpointArc(diameter: number): Array<[number, number]> {
  const isEven = diameter % 2 === 0
  const points: Array<[number, number]> = []

  let x: number, y: number, F: number
  if (isEven) {
    const r = diameter / 2
    x = 0; y = r - 1
    F = 13 - 8 * r
  } else {
    const R = (diameter - 1) / 2
    x = 0; y = R
    F = 4 - 8 * R
  }

  while (x <= y) {
    points.push([x, y])
    if (F < 0) {
      F += isEven ? 8 * x + 16 : 8 * x + 12
      x++
    } else {
      F += 8 * x - 8 * y + 20
      x++
      y--
    }
  }

  return points
}

function addOctantSpan(cells: CellSet, x: number, yMin: number, yMax: number, isEven: boolean) {
  for (let y = yMin; y <= yMax; y++) {
    if (isEven) {
      // Centre between cells — reflect with offset so the four quadrants tile correctly
      cells.add(encodeCell(x, y));       cells.add(encodeCell(-x - 1, y))
      cells.add(encodeCell(x, -y - 1)); cells.add(encodeCell(-x - 1, -y - 1))
      cells.add(encodeCell(y, x));       cells.add(encodeCell(-y - 1, x))
      cells.add(encodeCell(y, -x - 1)); cells.add(encodeCell(-y - 1, -x - 1))
    } else {
      // Centre at (0, 0) — standard 8-fold symmetry
      cells.add(encodeCell(x, y));   cells.add(encodeCell(-x, y))
      cells.add(encodeCell(x, -y)); cells.add(encodeCell(-x, -y))
      cells.add(encodeCell(y, x));   cells.add(encodeCell(-y, x))
      cells.add(encodeCell(y, -x)); cells.add(encodeCell(-y, -x))
    }
  }
}

function computeMidpointCells(config: CircleConfig): CellSet {
  const { diameter, thickness } = config
  const isEven = diameter % 2 === 0
  const cells: CellSet = new Set()

  const outerArc = midpointArc(diameter)

  // Snap inner diameter to the nearest positive integer with the same parity as the
  // outer so that both arcs use the same half-pixel sample offset.
  const rawInner = diameter - 2 * thickness
  const innerMap = new Map<number, number>()
  if (rawInner > 0) {
    let innerDiam = Math.round(rawInner)
    if (innerDiam % 2 !== diameter % 2) innerDiam--  // preserve parity, err toward thicker ring
    if (innerDiam > 0) {
      for (const [x, y] of midpointArc(innerDiam)) {
        innerMap.set(x, y)
      }
    }
  }

  for (const [x, yOuter] of outerArc) {
    const yInner = innerMap.get(x) ?? 0
    addOctantSpan(cells, x, yInner, yOuter, isEven)
  }

  return cells
}

// --- Closest-cell algorithm ---------------------------------------------
//
// For each column x, selects the single cell whose center is closest to the
// ideal circle arc (from inside), guaranteeing that no two adjacent cells in
// a single-thickness outline share a face — only corner adjacency in diagonal
// sections is possible.
//
// Approach based on Donat Studios' Pixel Circle Generator:
// https://donatstudios.com/PixelCircleGenerator

function closestCellArc(diameter: number): Map<number, number> {
  const r = diameter / 2
  const isEven = diameter % 2 === 0
  const arc = new Map<number, number>()
  const half = Math.floor(r)
  for (let x = 0; x <= half; x++) {
    const dx = isEven ? x + 0.5 : x
    const dySquared = r * r - dx * dx
    if (dySquared < 0) break
    arc.set(x, Math.floor(Math.sqrt(dySquared)))
  }
  return arc
}

function computeClosestCellCells(config: CircleConfig): CellSet {
  const { diameter, thickness } = config
  const isEven = diameter % 2 === 0
  const cells: CellSet = new Set()
  const outerArc = closestCellArc(diameter)

  // Snap inner diameter to nearest positive integer with the same parity as
  // outer so both arcs share the same half-pixel sample offset.
  const rawInner = diameter - 2 * thickness
  const innerArc = new Map<number, number>()
  if (rawInner > 0) {
    let innerDiam = Math.round(rawInner)
    if (innerDiam % 2 !== diameter % 2) innerDiam-- // preserve parity, err toward thicker ring
    if (innerDiam > 0) {
      for (const [x, y] of closestCellArc(innerDiam)) innerArc.set(x, y)
    }
  }

  for (const [x, yOuter] of outerArc) {
    const yInner = innerArc.has(x) ? innerArc.get(x)! + 1 : 0
    for (let y = yInner; y <= yOuter; y++) {
      if (isEven) {
        cells.add(encodeCell(x, y));       cells.add(encodeCell(-x - 1, y))
        cells.add(encodeCell(x, -y - 1)); cells.add(encodeCell(-x - 1, -y - 1))
        cells.add(encodeCell(y, x));       cells.add(encodeCell(-y - 1, x))
        cells.add(encodeCell(y, -x - 1)); cells.add(encodeCell(-y - 1, -x - 1))
      } else {
        cells.add(encodeCell(x, y));   cells.add(encodeCell(-x, y))
        cells.add(encodeCell(x, -y)); cells.add(encodeCell(-x, -y))
        cells.add(encodeCell(y, x));   cells.add(encodeCell(-y, x))
        cells.add(encodeCell(y, -x)); cells.add(encodeCell(-y, -x))
      }
    }
  }

  return cells
}

// --- Public API ---------------------------------------------------------

export function computeCircleCells(config: CircleConfig): CellSet {
  return computeClosestCellCells(config)
}
