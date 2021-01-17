import { Seed } from "./Seed";

export class GeneratorOutput<T> {
  constructor(readonly generated: T, readonly nextSeed: Seed) {}
}
