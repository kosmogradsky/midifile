import { Mapper } from "../Mapper/Mapper";
import { Reducer } from "../Reducer/Reducer";
import { ToArrayReducer } from "../ToArrayReducer/ToArrayReducer";

class ReverseReducer<T> implements Reducer<T, LinkedList<T>> {
  reduce(acc: LinkedList<T>, element: T): LinkedList<T> {
    return acc.cons(element);
  }
}

class LengthReducer<T> implements Reducer<T, number> {
  reduce(acc: number): number {
    return acc + 1;
  }
}

export class SumReducer implements Reducer<number, number> {
  reduce(acc: number, element: number): number {
    return acc + element;
  }
}

class MapReducer<T, R> implements Reducer<T, LinkedList<R>> {
  constructor(readonly mapper: Mapper<T, R>) {}

  reduce(acc: LinkedList<R>, element: T): LinkedList<R> {
    return acc.cons(this.mapper.map(element));
  }
}

class ReduceRightHelper<T, TReturn> {
  private count = 0;

  constructor(
    readonly reducer: Reducer<T, TReturn>,
    private seed: TReturn,
    private list: LinkedList<T>
  ) {}

  reduceNextElements() {
    if (this.count > 500) {
      return this.list.reverse().reduceLeft(this.reducer, this.seed);
    }

    this.count += 1;
    return this.reduceFirstElement();
  }

  reduceFourthElement(firstValue: T, secondValue: T, thirdValue: T) {
    const fourthElement = this.list.asElement();

    if (fourthElement === null) {
      return this.reducer.reduce(
        this.reducer.reduce(
          this.reducer.reduce(this.seed, thirdValue),
          secondValue
        ),
        firstValue
      );
    }

    this.list = fourthElement.next;
    this.seed = this.reduceNextElements();

    return this.reducer.reduce(
      this.reducer.reduce(
        this.reducer.reduce(
          this.reducer.reduce(this.seed, fourthElement.value),
          thirdValue
        ),
        secondValue
      ),
      firstValue
    );
  }

  reduceThirdElement(firstValue: T, secondValue: T) {
    const thirdElement = this.list.asElement();

    if (thirdElement === null) {
      return this.reducer.reduce(
        this.reducer.reduce(this.seed, secondValue),
        firstValue
      );
    }

    this.list = thirdElement.next;
    return this.reduceFourthElement(
      firstValue,
      secondValue,
      thirdElement.value
    );
  }

  reduceSecondElement(firstValue: T) {
    const secondElement = this.list.asElement();

    if (secondElement === null) {
      return this.reducer.reduce(this.seed, firstValue);
    }

    this.list = secondElement.next;
    return this.reduceThirdElement(firstValue, secondElement.value);
  }

  reduceFirstElement() {
    const firstElement = this.list.asElement();

    if (firstElement === null) {
      return this.seed;
    }

    this.list = firstElement.next;
    return this.reduceSecondElement(firstElement.value);
  }

  reduce(): TReturn {
    return this.reduceFirstElement();
  }
}

class LinkedListIterator<T> implements Iterator<T> {
  constructor(private nextList: LinkedList<T>) {}

  next(): IteratorResult<T> {
    const nextElement = this.nextList.asElement();

    if (nextElement === null) {
      return { done: true, value: undefined };
    }

    this.nextList = nextElement.next;
    return { done: false, value: nextElement.value };
  }
}

export abstract class LinkedList<T> implements Iterable<T> {
  static sum(numbers: LinkedList<number>): number {
    return numbers.reduceLeft(new SumReducer(), 0);
  }

  static range(start: number, end: number): LinkedList<number> {
    let current = end;
    let result: LinkedList<number> = new LinkedEmpty();

    while (current >= start) {
      result = result.cons(current);
      current -= 1;
    }

    return result;
  }

  abstract asElement(): LinkedElement<T> | null;
  abstract reduceLeft<TReturn>(
    reducer: Reducer<T, TReturn>,
    seed: TReturn
  ): TReturn;

  [Symbol.iterator](): Iterator<T> {
    return new LinkedListIterator(this);
  }

  cons(value: T): LinkedElement<T> {
    return new LinkedElement(value, this);
  }

  reverse(): LinkedList<T> {
    return this.reduceLeft(new ReverseReducer(), new LinkedEmpty());
  }

  length() {
    return this.reduceLeft(new LengthReducer(), 0);
  }

  reduceRight<TReturn>(reducer: Reducer<T, TReturn>, seed: TReturn): TReturn {
    return new ReduceRightHelper(reducer, seed, this).reduce();
  }

  map<TReturn>(mapper: Mapper<T, TReturn>): LinkedList<TReturn> {
    return this.reduceRight(new MapReducer(mapper), new LinkedEmpty());
  }

  toArray(): T[] {
    return this.reduceLeft(new ToArrayReducer(), []);
  }

  drop(n: number): LinkedList<T> {
    let result: LinkedList<T> = this;

    for (let i = 0; i < n; i++) {
      const element = result.asElement();

      if (element === null) {
        return result;
      }

      result = element.next;
    }

    return result;
  }
}

export class LinkedEmpty<T> extends LinkedList<T> {
  asElement(): null {
    return null;
  }

  reduceLeft<TReturn>(_reducer: Reducer<T, TReturn>, seed: TReturn): TReturn {
    return seed;
  }
}

export class LinkedElement<T> extends LinkedList<T> {
  constructor(readonly value: T, readonly next: LinkedList<T>) {
    super();
  }

  asElement(): LinkedElement<T> {
    return this;
  }

  reduceLeft<TReturn>(reducer: Reducer<T, TReturn>, seed: TReturn): TReturn {
    let currentAcc = seed;
    let currentElement: LinkedElement<T> | null = this;

    while (currentElement !== null) {
      currentAcc = reducer.reduce(currentAcc, currentElement.value);
      currentElement = currentElement.next.asElement();
    }

    return currentAcc;
  }
}
