import { MapperTwo } from "../Mapper/Mapper";
import { GeneratorOutput } from "./GeneratorOutput";
import { PseudorandomGenerator } from "./PseudorandomGenerator";
import { Seed } from "./Seed";

export class MapTwoGenerator<A, B, C> extends PseudorandomGenerator<C> {
  constructor(
    readonly generatorA: PseudorandomGenerator<A>,
    readonly generatorB: PseudorandomGenerator<B>,
    readonly mapper: MapperTwo<A, B, C>
  ) {
    super();
  }

  generate(seed: Seed) {
    const firstOutput = this.generatorA.generate(seed);
    const secondOutput = this.generatorB.generate(firstOutput.nextSeed);
    const value = this.mapper.map(
      firstOutput.generated,
      secondOutput.generated
    );

    return new GeneratorOutput(value, secondOutput.nextSeed);
  }
}
