export class ArrayHelper<T> {
  constructor(private array: T[]) {}

  get(index: number): T {
    if (index < 0 || index >= length) {
      throw new Error("index out of bounds");
    }

    return this.array[index]!;
  }

  set(index: number, value: T): ArrayHelper<T> {
    const length = this.array.length;

    if (index < 0 || index >= length) {
      throw new Error("index out of bounds");
    }

    const result = new Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = this.array[i];
    }

    result[index] = value;
    this.array = result;

    return this;
  }

  push(value: T): ArrayHelper<T> {
    const length = this.array.length;
    const result = new Array(length + 1);

    for (let i = 0; i < length; i++) {
      result[i] = this.array[i];
    }

    result[length] = value;
    this.array = result;

    return this;
  }

  getResult(): T[] {
    return this.array;
  }
}
