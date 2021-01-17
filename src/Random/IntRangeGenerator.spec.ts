import { IntRangeGenerator } from "./IntRangeGenerator";
import { Seed } from "./Seed";

describe("IntRangeGenerator", () => {
  it("isRangePowerOfTwo", () => {
    expect(IntRangeGenerator.pcg(0, 7).isRangePowerOfTwo()).toBe(true);
    expect(IntRangeGenerator.pcg(0, 15).isRangePowerOfTwo()).toBe(true);
    expect(IntRangeGenerator.pcg(0, 31).isRangePowerOfTwo()).toBe(true);
    expect(IntRangeGenerator.pcg(1, 65).isRangePowerOfTwo()).toBe(false);
    expect(IntRangeGenerator.pcg(2, 130).isRangePowerOfTwo()).toBe(false);
    expect(IntRangeGenerator.pcg(3, 260).isRangePowerOfTwo()).toBe(false);
  });

  it("generates correctly for power of two", () => {
    expect(
      IntRangeGenerator.constant(0, 7, Math.pow(2, 32) - 1).generate(
        new Seed(0)
      ).generated
    ).toBe(7);
  });

  it("generates correctly for not a power of two", () => {
    expect(
      IntRangeGenerator.constant(1, 65, Math.pow(2, 32) - 1).generate(
        new Seed(0)
      ).generated
    ).toBe(61);
  });

  it("generates correctly for power of two for negative range", () => {
    expect(
      IntRangeGenerator.constant(-7, 0, Math.pow(2, 32) - 1).generate(
        new Seed(0)
      ).generated
    ).toBe(0);
  });

  it("generates correctly for not a power of two for negative range", () => {
    expect(
      IntRangeGenerator.constant(-65, -1, Math.pow(2, 32) - 1).generate(
        new Seed(0)
      ).generated
    ).toBe(-5);
  });
});
