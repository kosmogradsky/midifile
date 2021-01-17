import { GeneratorOutput } from "./GeneratorOutput";
import { PseudorandomGenerator } from "./PseudorandomGenerator";
import { FloatRangeGenerator } from "./FloatRangeGenerator";
import { Seed } from "./Seed";

class TwoInt32Generator extends PseudorandomGenerator<number> {
  counter = 0;

  generate() {
    if (this.counter === 0) {
      this.counter++;
      return new GeneratorOutput(1589556080, new Seed(0));
    }

    return new GeneratorOutput(284667839, new Seed(0));
  }
}

describe("FloatRangeGenerator", () => {
  it("correctly generates from two int32", () => {
    expect(
      new FloatRangeGenerator(0, 1, new TwoInt32Generator()).generate(
        new Seed(0)
      ).generated
    ).toBe(0.6862313765427571);
  });
});
