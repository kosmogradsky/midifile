export interface LazyMapper<A, B> {
  map(a: A): B;
}

class MapThunk<T, R> {
  constructor(readonly mapper: LazyMapper<T, R>, readonly input: T) {}

  run(): R {
    return this.mapper.map(this.input);
  }
}

export abstract class Lazy<T> {
  abstract force(): T;

  map<R>(mapper: LazyMapper<T, R>): Lazy<R> {
    const forced = this.force();

    return new ToEvaluate(new MapThunk(mapper, forced));
  }
}

export interface Thunk<T> {
  run(): T;
}

export class ToEvaluate<T> extends Lazy<T> {
  constructor(readonly thunk: Thunk<T>) {
    super();
  }

  force(): T {
    return this.thunk.run();
  }
}

export class Evalualted<T> extends Lazy<T> {
  constructor(readonly value: T) {
    super();
  }

  force(): T {
    return this.value;
  }
}
