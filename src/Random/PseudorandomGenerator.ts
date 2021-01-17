import { GeneratorOutput } from "./GeneratorOutput";
import { Seed } from "./Seed";

export const MAX_INT = 2147483647;
export const MIN_INT = -2147483648;

interface AndThenFactory<T, R> {
  createGenerator(input: T): PseudorandomGenerator<R>;
}

export abstract class PseudorandomGenerator<T> {
  abstract generate(seed: Seed): GeneratorOutput<T>;

  andThen<R>(factory: AndThenFactory<T, R>): PseudorandomGenerator<R> {
    return new AndThenGenerator(this, factory);
  }
}

class AndThenGenerator<T, R> extends PseudorandomGenerator<R> {
  constructor(
    readonly generatorA: PseudorandomGenerator<T>,
    readonly factoryGeneratorB: AndThenFactory<T, R>
  ) {
    super();
  }

  generate(seed: Seed): GeneratorOutput<R> {
    const outputA = this.generatorA.generate(seed);
    const outputB = this.factoryGeneratorB
      .createGenerator(outputA.generated)
      .generate(outputA.nextSeed);

    return outputB;
  }
}
