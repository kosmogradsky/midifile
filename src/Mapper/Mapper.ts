export interface Mapper<TInput, TOutput> {
  map(input: TInput): TOutput;
}

export interface MapperTwo<A, B, C> {
  map(inputA: A, inputB: B): C;
}

export interface MapperThree<A, B, C, D> {
  map(inputA: A, inputB: B, inputC: C): D;
}
