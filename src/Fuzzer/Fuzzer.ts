import { NonEmptyList } from "../NonEmptyList/NonEmptyList";
import { ConstantGenerator } from "../Random/ConstantGenerator";
import {
  FromWeightedGenerators,
  WeightedGenerator,
} from "../Random/FromWeightedGenerators";
import { GeneratorOutput } from "../Random/GeneratorOutput";
import { IntRangeGenerator } from "../Random/IntRangeGenerator";
import {
  PseudorandomGenerator,
  MAX_INT,
  MIN_INT,
} from "../Random/PseudorandomGenerator";
import { Seed } from "../Random/Seed";
import { RoseTree } from "../RoseTree/RoseTree";
import { IntShrinker, Shrinker } from "../Shrinker/Shrinker";

export class CustomFuzzer<T> extends PseudorandomGenerator<RoseTree<T>> {
  constructor(
    readonly generator: PseudorandomGenerator<T>,
    readonly shrinker: Shrinker<T>
  ) {
    super();
  }

  generate(seed: Seed): GeneratorOutput<RoseTree<T>> {
    const output = this.generator.generate(seed);

    return new GeneratorOutput(
      this.shrinker.shrinkTree(output.generated),
      output.nextSeed
    );
  }
}

export const intFuzzer = new CustomFuzzer(
  new FromWeightedGenerators(
    new NonEmptyList(new WeightedGenerator(3, IntRangeGenerator.pcg(-50, 50)), [
      new WeightedGenerator(0.2, new ConstantGenerator(0)),
      new WeightedGenerator(1, IntRangeGenerator.pcg(0, MAX_INT - MIN_INT)),
      new WeightedGenerator(1, IntRangeGenerator.pcg(MIN_INT - MAX_INT, 0)),
    ])
  ),
  new IntShrinker()
);
