import { describe, expect, it } from "vitest"

import { type CircleConfig, computeCircleCells, decodeCell } from "./circle"

// Converts a CircleConfig to a visual string for easy diffing on failure.
// Filled cells are "X", empty cells are ".". Each row is a line.
//
// Coordinate mapping:
//   row = ceil(diameter / 2) - 1 - y
//   col = x + floor(diameter / 2)
function circleToString(config: CircleConfig): string {
  const { diameter } = config
  const grid = Array.from({ length: diameter }, () =>
    Array<string>(diameter).fill(".")
  )
  for (const packed of computeCircleCells(config)) {
    const { x, y } = decodeCell(packed)
    const r = Math.ceil(diameter / 2) - 1 - y
    const c = x + Math.floor(diameter / 2)
    grid[r][c] = "X"
  }
  return grid.map((row) => row.join("")).join("\n")
}

describe("computeCircleCells", () => {
  describe("odd diameter — center block sampling", () => {
    it("diameter 3, thickness 1 — outline ring", () => {
      expect(circleToString({ diameter: 3, thickness: 1 })).toBe(
        [
          "XXX", 
          "X.X", 
          "XXX"
        ].join("\n")
      )
    })

    it("diameter 3, thickness 2 — filled disk", () => {
      expect(circleToString({ diameter: 3, thickness: 2 })).toBe(
        [
          "XXX",
          "XXX",
          "XXX"
        ].join("\n")
      )
    })

    it("diameter 5, thickness 1 — outline ring", () => {
      expect(circleToString({ diameter: 5, thickness: 1 })).toBe(
        [
          ".XXX.",
          "X...X",
          "X...X",
          "X...X",
          ".XXX.",
        ].join("\n")
      )
    })

    it("diameter 11, thickness 1 — outline ring", () => {
      expect(circleToString({ diameter: 11, thickness: 1 })).toBe(
        [
          "...XXXXX...",
          "..X.....X..",
          ".X.......X.",
          "X.........X",
          "X.........X",
          "X.........X",
          "X.........X",
          "X.........X",
          ".X.......X.",
          "..X.....X..",
          "...XXXXX...",
        ].join("\n")
      )
    })
  })

  describe("even diameter — corner sampling", () => {
    it("diameter 4, thickness 1 — outline ring", () => {
      expect(circleToString({ diameter: 4, thickness: 1 })).toBe(
        ["XXXX", "X..X", "X..X", "XXXX"].join("\n")
      )
    })

    it("diameter 6, thickness 2 — wide ring", () => {
      expect(circleToString({ diameter: 6, thickness: 2 })).toBe(
        [
          ".XXXX.",
          "XXXXXX",
          "XX..XX",
          "XX..XX",
          "XXXXXX",
          ".XXXX.",
        ].join("\n")
      )
    })

    it("diameter 10, thickness 1 — outline ring", () => {
      expect(circleToString({ diameter: 10, thickness: 1 })).toBe(
        [
          "..XXXXXX..",
          ".XX....XX.",
          "XX......XX",
          "X........X",
          "X........X",
          "X........X",
          "X........X",
          "XX......XX",
          ".XX....XX.",
          "..XXXXXX..",
        ].join("\n")
      )
    })
  })
})
