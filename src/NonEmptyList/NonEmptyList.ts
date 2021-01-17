export class NonEmptyList<T> implements Iterable<T> {
  constructor(readonly head: T, readonly tail: T[]) {}

  *[Symbol.iterator]() {
    yield this.head;

    for (const element of this.tail) {
      yield element;
    }
  }
}
