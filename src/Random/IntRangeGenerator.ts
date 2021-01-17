import { ConstantGenerator } from "./ConstantGenerator";
import { PermutedCongruentialUint32Generator } from "./PermutedCongruentialUint32Generator";
import { GeneratorOutput } from "./GeneratorOutput";
import { PseudorandomGenerator } from "./PseudorandomGenerator";
import { Seed } from "./Seed";

export class IntRangeGenerator extends PseudorandomGenerator<number> {
  readonly range: number;

  static constant(rangeStart: number, rangeEnd: number, int32Const: number) {
    return new IntRangeGenerator(
      rangeStart,
      rangeEnd,
      new ConstantGenerator(int32Const)
    );
  }

  static pcg(rangeStart: number, rangeEnd: number): IntRangeGenerator {
    return new IntRangeGenerator(
      rangeStart,
      rangeEnd,
      new PermutedCongruentialUint32Generator()
    );
  }

  constructor(
    readonly rangeStart: number,
    rangeEnd: number,
    readonly int32Generator: PseudorandomGenerator<number>
  ) {
    super();

    if (rangeStart >= rangeEnd) {
      throw new Error("rangeStart must be less than rangeEnd");
    }

    this.range = rangeEnd - rangeStart + 1;
  }

  isRangePowerOfTwo() {
    return ((this.range - 1) & this.range) === 0;
  }

  generateWhenRangeIsPowerOfTwo(seed: Seed): GeneratorOutput<number> {
    const generatorOutput = this.int32Generator.generate(seed);
    const value =
      (generatorOutput.generated & (this.range - 1)) + this.rangeStart;

    return new GeneratorOutput(value, generatorOutput.nextSeed);
  }

  generateWhenRangeIsNotPowerOfTwo(seed: Seed): GeneratorOutput<number> {
    const generatorOutput = this.int32Generator.generate(seed);
    const threshold = Math.pow(2, 32) % this.range;

    if (generatorOutput.generated < threshold) {
      return this.generateWhenRangeIsNotPowerOfTwo(generatorOutput.nextSeed);
    }

    return new GeneratorOutput(
      (generatorOutput.generated % this.range) + this.rangeStart,
      generatorOutput.nextSeed
    );
  }

  generate(seed: Seed): GeneratorOutput<number> {
    if (this.isRangePowerOfTwo()) {
      return this.generateWhenRangeIsPowerOfTwo(seed);
    } else {
      return this.generateWhenRangeIsNotPowerOfTwo(seed);
    }
  }
}
