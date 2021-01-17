import { PermutedCongruentialUint32Generator } from "./PermutedCongruentialUint32Generator";
import { GeneratorOutput } from "./GeneratorOutput";
import { PseudorandomGenerator } from "./PseudorandomGenerator";
import { Seed } from "./Seed";

export class FloatRangeGenerator extends PseudorandomGenerator<number> {
  static pcg(rangeStart: number, rangeEnd: number): FloatRangeGenerator {
    return new FloatRangeGenerator(
      rangeStart,
      rangeEnd,
      new PermutedCongruentialUint32Generator()
    );
  }

  constructor(
    readonly rangeStart: number,
    readonly rangeEnd: number,
    readonly generator: PseudorandomGenerator<number>
  ) {
    super();

    if (rangeStart >= rangeEnd) {
      throw new Error("rangeStart must be less than rangeEnd");
    }
  }

  generate(seed: Seed): GeneratorOutput<number> {
    const firstOutput = this.generator.generate(seed);
    const secondOutput = this.generator.generate(firstOutput.nextSeed);

    const higherBits = (Math.pow(2, 26) - 1) & firstOutput.generated;
    const lowerBits = (Math.pow(2, 27) - 1) & secondOutput.generated;

    const value = (higherBits * Math.pow(2, 27) + lowerBits) / Math.pow(2, 53);
    const range = Math.abs(this.rangeEnd - this.rangeStart);

    const scaled = value * range + this.rangeStart;

    return new GeneratorOutput(scaled, secondOutput.nextSeed);
  }
}
