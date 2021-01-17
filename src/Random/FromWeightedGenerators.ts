import { LinkedList } from "../LinkedList/LinkedList";
import { NonEmptyList } from "../NonEmptyList/NonEmptyList";
import { FloatRangeGenerator } from "./FloatRangeGenerator";
import { PseudorandomGenerator } from "./PseudorandomGenerator";
import { Seed } from "./Seed";

export class WeightedGenerator {
  constructor(
    readonly weight: number,
    readonly generator: PseudorandomGenerator<number>
  ) {}
}

export class FromWeightedGenerators extends PseudorandomGenerator<number> {
  floatGenerator: FloatRangeGenerator;

  constructor(readonly pairs: NonEmptyList<WeightedGenerator>) {
    super();

    const total =
      pairs.head.weight +
      pairs.tail.reduce((sum, pair) => sum + pair.weight, 0);
    this.floatGenerator = FloatRangeGenerator.pcg(0, total);
  }

  pickGenerator(randomFloat: number): PseudorandomGenerator<number> {
    let sumOfWeights = randomFloat;

    for (const pair of this.pairs) {
      if (sumOfWeights <= pair.weight) {
        return pair.generator;
      }

      sumOfWeights -= pair.weight;
    }

    return this.pairs.head.generator;
  }

  generate(seed: Seed) {
    const floatGeneratorOutput = this.floatGenerator.generate(seed);
    const generator = this.pickGenerator(floatGeneratorOutput.generated);

    return generator.generate(floatGeneratorOutput.nextSeed);
  }
}
