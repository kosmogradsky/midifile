import { GeneratorOutput } from "./GeneratorOutput";
import { PseudorandomGenerator } from "./PseudorandomGenerator";
import { Seed } from "./Seed";

const MULTIPLIER = 1664525;
const INCREMENT = 1013904223;
const MODULO = Math.pow(2, 32);

class LinearCongruentialUint32Generator extends PseudorandomGenerator<number> {
  generate(seed: Seed): GeneratorOutput<number> {
    const generated = (seed.state * MULTIPLIER + INCREMENT) % MODULO;

    return new GeneratorOutput(generated, new Seed(generated));
  }
}

export class PermutedCongruentialUint32Generator extends PseudorandomGenerator<number> {
  readonly lcg = new LinearCongruentialUint32Generator();

  generate(seed: Seed): GeneratorOutput<number> {
    const lcgOutput = this.lcg.generate(seed);
    const count = lcgOutput.generated >>> 28;

    let word: number;
    word = lcgOutput.generated >> (4 + count);
    word = lcgOutput.generated ^ word;
    word = 277803737 * word;

    return new GeneratorOutput((word >>> 22) ^ word, lcgOutput.nextSeed);
  }
}
