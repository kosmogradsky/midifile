import { GeneratorOutput } from "./GeneratorOutput";
import { PseudorandomGenerator } from "./PseudorandomGenerator";
import { Seed } from "./Seed";

export class ConstantGenerator<T> extends PseudorandomGenerator<T> {
  constructor(readonly value: T) {
    super();
  }

  generate(seed: Seed): GeneratorOutput<T> {
    return new GeneratorOutput(this.value, seed);
  }
}
