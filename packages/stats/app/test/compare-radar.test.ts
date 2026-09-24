import { describe, expect, test } from "bun:test"
import { radarSeriesPath } from "../src/routes/compare-radar"

describe("radar missing data", () => {
  test("unknown scores do not create points or segments at zero", () => {
    expect(radarSeriesPath([undefined, undefined, undefined, undefined])).toBe("")
    expect(radarSeriesPath([80, undefined, 60, undefined])).toBe("")
  })

  test("segments stop at gaps and retain the wraparound edge", () => {
    expect(radarSeriesPath([100, undefined, 50, 100])).toBe("M 50,75 L 0,50 M 0,50 L 50,0")
  })

  test("a measured zero still connects to measured neighbors", () => {
    expect(radarSeriesPath([0, 100, undefined, undefined])).toBe("M 50,50 L 100,50")
  })
})
