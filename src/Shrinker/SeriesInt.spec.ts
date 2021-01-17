import { seriesInt } from "./SeriesInt";

describe("SeriesInt", () => {
  test("seriesInt", () => {
    expect(seriesInt(0, 10).toArray()).toEqual([0, 5, 7, 8, 9]);
  });
});
