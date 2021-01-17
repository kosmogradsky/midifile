import { Lazy, ToEvaluate } from "../Lazy/Lazy";
import { Mapper, MapperThree, MapperTwo } from "../Mapper/Mapper";
import { Reducer } from "../Reducer/Reducer";
import { ToArrayReducer } from "../ToArrayReducer/ToArrayReducer";

interface InfiniteDefinition<T> {
  define(prev: T): T;
}

class NumbersDefinition {
  define(prev: number): number {
    return prev + 1;
  }
}

export class LazyList<T> {
  static empty<T>(): LazyList<T> {
    return new LazyList(new ToEvaluate(new NilThunk<T>()));
  }

  static singleton<T>(value: T): LazyList<T> {
    return new LazyList(
      new ToEvaluate(new ConsThunk<T>(value, LazyList.empty()))
    );
  }

  static infinite<T>(definition: InfiniteDefinition<T>, seed: T): LazyList<T> {
    return new LazyList(new ToEvaluate(new InfiniteThunk(definition, seed)));
  }

  static numbers(): LazyList<number> {
    return LazyList.infinite(new NumbersDefinition(), 1);
  }

  static flatten<T>(list: LazyList<LazyList<T>>): LazyList<T> {
    return new LazyList(new ToEvaluate(new FlattenThunk(list)));
  }

  static mapTwo<A, B, C>(
    mapperTwo: MapperTwo<A, B, C>,
    list1: LazyList<A>,
    list2: LazyList<B>
  ): LazyList<C> {
    return new LazyList(
      new ToEvaluate(new MapTwoThunk(mapperTwo, list1, list2))
    );
  }

  static mapThree<A, B, C, D>(
    mapperThree: MapperThree<A, B, C, D>,
    list1: LazyList<A>,
    list2: LazyList<B>,
    list3: LazyList<C>
  ): LazyList<D> {
    return new LazyList(
      new ToEvaluate(new MapThreeThunk(mapperThree, list1, list2, list3))
    );
  }

  constructor(readonly list: Lazy<List<T>>) {}

  cons(value: T): LazyList<T> {
    return new LazyList(new ToEvaluate(new ConsThunk(value, this)));
  }

  isEmpty(): boolean {
    return this.list.force().isEmpty();
  }

  headAndTail() {
    return this.list.force().headAndTail();
  }

  append(list: LazyList<T>): LazyList<T> {
    return new LazyList(new ToEvaluate(new AppendThunk(list, this)));
  }

  take(n: number): LazyList<T> {
    return new LazyList(new ToEvaluate(new TakeThunk(n, this)));
  }

  takeWhile(predicate: TakeWhilePredicate<T>): LazyList<T> {
    return new LazyList(new ToEvaluate(new TakeWhileThunk(predicate, this)));
  }

  drop(n: number): LazyList<T> {
    return new LazyList(new ToEvaluate(new DropThunk(n, this)));
  }

  member(element: T): boolean {
    return this.list.force().member(element);
  }

  reduce<R>(reducer: Reducer<T, R>, seed: R): R {
    return this.list.force().reduce(reducer, seed);
  }

  map<R>(mapper: Mapper<T, R>): LazyList<R> {
    return new LazyList(new ToEvaluate(new MapThunk(mapper, this)));
  }

  andThen<R>(mapper: Mapper<T, LazyList<R>>): LazyList<R> {
    return LazyList.flatten(this.map(mapper));
  }

  toArray(): T[] {
    return this.list.force().reduce(new ToArrayReducer(), []);
  }
}

class NilThunk<T> {
  run() {
    return new Nil<T>();
  }
}

class ConsThunk<T> {
  constructor(readonly value: T, readonly next: LazyList<T>) {}

  run() {
    return new Cons<T>(this.value, this.next);
  }
}

class AppendThunk<T> {
  constructor(readonly list1: LazyList<T>, readonly list2: LazyList<T>) {}

  run() {
    return this.list1.list.force().append(this.list2);
  }
}

class InfiniteThunk<T> {
  constructor(readonly definition: InfiniteDefinition<T>, readonly seed: T) {}

  run() {
    return new Cons(
      this.seed,
      LazyList.infinite(this.definition, this.definition.define(this.seed))
    );
  }
}

class TakeThunk<T> {
  constructor(readonly n: number, readonly list: LazyList<T>) {}

  run(): List<T> {
    if (this.n <= 0) {
      return new Nil();
    }

    return this.list.list.force().take(this.n);
  }
}

interface TakeWhilePredicate<T> {
  shouldTake(element: T): boolean;
}

class TakeWhileThunk<T> {
  constructor(
    readonly predicate: TakeWhilePredicate<T>,
    readonly list: LazyList<T>
  ) {}

  run(): List<T> {
    return this.list.list.force().takeWhile(this.predicate);
  }
}

class DropThunk<T> {
  constructor(readonly n: number, readonly list: LazyList<T>) {}

  run(): List<T> {
    if (this.n <= 0) {
      return this.list.list.force();
    }

    return this.list.list.force().drop(this.n);
  }
}

class FlattenThunk<T> {
  constructor(readonly list: LazyList<LazyList<T>>) {}

  run(): List<T> {
    const headAndTail = this.list.headAndTail();

    if (headAndTail === undefined) {
      return new Nil();
    }

    const [head, tail] = headAndTail;

    return head.append(LazyList.flatten(tail)).list.force();
  }
}

class MapThunk<T, R> {
  constructor(readonly mapper: Mapper<T, R>, readonly list: LazyList<T>) {}

  run(): List<R> {
    return this.list.list.force().map(this.mapper);
  }
}

class MapTwoThunk<A, B, C> {
  constructor(
    readonly mapperTwo: MapperTwo<A, B, C>,
    readonly list1: LazyList<A>,
    readonly list2: LazyList<B>
  ) {}

  run(): List<C> {
    return this.list1.list
      .force()
      .mapTwoGetFirstArgument(this.mapperTwo, this.list2);
  }
}

class MapThreeThunk<A, B, C, D> {
  constructor(
    readonly mapperThree: MapperThree<A, B, C, D>,
    readonly list1: LazyList<A>,
    readonly list2: LazyList<B>,
    readonly list3: LazyList<C>
  ) {}

  run(): List<D> {
    return this.list1.list
      .force()
      .mapThreeGetFirstArgument(this.mapperThree, this.list2, this.list3);
  }
}

interface List<T> {
  isEmpty(): boolean;
  headAndTail(): [T, LazyList<T>] | undefined;
  append(list: LazyList<T>): List<T>;
  take(n: number): List<T>;
  takeWhile(predicate: TakeWhilePredicate<T>): List<T>;
  drop(n: number): List<T>;
  member(element: T): boolean;
  reduce<R>(reducer: Reducer<T, R>, seed: R): R;
  map<R>(mapper: Mapper<T, R>): List<R>;
  mapTwoGetFirstArgument<B, C>(
    mapperTwo: MapperTwo<T, B, C>,
    list2: LazyList<B>
  ): List<C>;
  mapTwoGetSecondArgument<A, C>(
    mapperTwo: MapperTwo<A, T, C>,
    list1: Cons<A>
  ): List<C>;
  mapThreeGetFirstArgument<B, C, D>(
    mapperThree: MapperThree<T, B, C, D>,
    list2: LazyList<B>,
    list3: LazyList<C>
  ): List<D>;
  mapThreeGetSecondArgument<A, C, D>(
    mapperThree: MapperThree<A, T, C, D>,
    list1: Cons<A>,
    list3: LazyList<C>
  ): List<D>;
  mapThreeGetThirdArgument<A, B, D>(
    mapperThree: MapperThree<A, B, T, D>,
    list1: Cons<A>,
    list2: Cons<B>
  ): List<D>;
}

class Nil<T> implements List<T> {
  isEmpty(): boolean {
    return true;
  }

  headAndTail() {
    return undefined;
  }

  append(list: LazyList<T>): List<T> {
    return list.list.force();
  }

  take() {
    return this;
  }

  takeWhile() {
    return this;
  }

  drop() {
    return this;
  }

  member() {
    return false;
  }

  reduce<R>(_reducer: Reducer<T, R>, seed: R): R {
    return seed;
  }

  map<R>(): List<R> {
    return new Nil<R>();
  }

  mapTwoGetFirstArgument<B, C>(
    _mapperTwo: MapperTwo<T, B, C>,
    _list2: LazyList<B>
  ): List<C> {
    return new Nil();
  }

  mapTwoGetSecondArgument<A, C>(
    _mapperTwo: MapperTwo<A, T, C>,
    _list1: Cons<A>
  ): List<C> {
    return new Nil();
  }

  mapThreeGetFirstArgument<B, C, D>(
    _mapperThree: MapperThree<T, B, C, D>,
    _list2: LazyList<B>,
    _list3: LazyList<C>
  ): List<D> {
    return new Nil();
  }

  mapThreeGetSecondArgument<A, C, D>(
    _mapperThree: MapperThree<A, T, C, D>,
    _list1: Cons<A>,
    _list3: LazyList<C>
  ): List<D> {
    return new Nil();
  }

  mapThreeGetThirdArgument<A, B, D>(
    _mapperThree: MapperThree<A, B, T, D>,
    _list1: Cons<A>,
    _list2: Cons<B>
  ): List<D> {
    return new Nil();
  }
}

class Cons<T> implements List<T> {
  constructor(readonly value: T, readonly next: LazyList<T>) {}

  isEmpty(): boolean {
    return false;
  }

  headAndTail(): [T, LazyList<T>] {
    return [this.value, this.next];
  }

  append(list: LazyList<T>): List<T> {
    return new Cons(this.value, this.next.append(list));
  }

  take(n: number) {
    return new Cons(this.value, this.next.take(n - 1));
  }

  takeWhile(predicate: TakeWhilePredicate<T>) {
    if (predicate.shouldTake(this.value)) {
      return new Cons(this.value, this.next.takeWhile(predicate));
    }

    return new Nil<T>();
  }

  drop(n: number): List<T> {
    return this.next.drop(n - 1).list.force();
  }

  member(element: T): boolean {
    return this.value === element || this.next.member(element);
  }

  reduce<R>(reducer: Reducer<T, R>, seed: R): R {
    return this.next.reduce(reducer, reducer.reduce(seed, this.value));
  }

  map<R>(mapper: Mapper<T, R>): List<R> {
    return new Cons<R>(mapper.map(this.value), this.next.map(mapper));
  }

  mapTwoGetFirstArgument<B, C>(
    mapperTwo: MapperTwo<T, B, C>,
    list2: LazyList<B>
  ): List<C> {
    return list2.list.force().mapTwoGetSecondArgument(mapperTwo, this);
  }

  mapTwoGetSecondArgument<A, C>(
    mapperTwo: MapperTwo<A, T, C>,
    list1: Cons<A>
  ): List<C> {
    return new Cons(
      mapperTwo.map(list1.value, this.value),
      LazyList.mapTwo(mapperTwo, list1.next, this.next)
    );
  }

  mapThreeGetFirstArgument<B, C, D>(
    mapperThree: MapperThree<T, B, C, D>,
    list2: LazyList<B>,
    list3: LazyList<C>
  ): List<D> {
    return list2.list
      .force()
      .mapThreeGetSecondArgument(mapperThree, this, list3);
  }

  mapThreeGetSecondArgument<A, C, D>(
    mapperThree: MapperThree<A, T, C, D>,
    list1: Cons<A>,
    list3: LazyList<C>
  ): List<D> {
    return list3.list
      .force()
      .mapThreeGetThirdArgument(mapperThree, list1, this);
  }

  mapThreeGetThirdArgument<A, B, D>(
    mapperThree: MapperThree<A, B, T, D>,
    list1: Cons<A>,
    list2: Cons<B>
  ): List<D> {
    return new Cons(
      mapperThree.map(list1.value, list2.value, this.value),
      LazyList.mapThree(mapperThree, list1.next, list2.next, this.next)
    );
  }
}
