import { LinkedElement, LinkedEmpty } from "../LinkedList/LinkedList";
import { NonEmptyList } from "../NonEmptyList/NonEmptyList";
import {
  FromWeightedGenerators,
  WeightedGenerator,
} from "./FromWeightedGenerators";
import { IntRangeGenerator } from "./IntRangeGenerator";

describe("FromWeightedGenerators", () => {
  it("correctly generates from two int32", () => {
    const firstIntGenerator = IntRangeGenerator.pcg(0, 2);
    const secondIntGenerator = IntRangeGenerator.pcg(3, 5);
    const threeIntGenerator = IntRangeGenerator.pcg(6, 8);

    expect(
      new FromWeightedGenerators(
        new NonEmptyList(new WeightedGenerator(0.5, firstIntGenerator), [
          new WeightedGenerator(0.3, secondIntGenerator),
          new WeightedGenerator(0.1, threeIntGenerator),
        ])
      ).pickGenerator(0.85)
    ).toBe(threeIntGenerator);
  });
});
