export interface Reducer<TInput, TOutput> {
  reduce(acc: TOutput, input: TInput): TOutput;
}
