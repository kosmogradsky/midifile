import { LazyList } from "../LazyList/LazyList";
import { Mapper } from "../Mapper/Mapper";

class ChildrenMapper<T, R> {
  constructor(readonly mapper: Mapper<T, R>) {}

  map(rose: RoseTree<T>): RoseTree<R> {
    return rose.map(this.mapper);
  }
}

export class RoseTree<T> {
  static singleton<T>(value: T): RoseTree<T> {
    return new RoseTree(value, LazyList.empty());
  }

  constructor(readonly value: T, readonly children: LazyList<RoseTree<T>>) {}

  getRoot() {
    return this.value;
  }

  addChild(child: RoseTree<T>) {
    return new RoseTree(this.value, this.children.cons(child));
  }

  map<R>(mapper: Mapper<T, R>): RoseTree<R> {
    return new RoseTree(
      mapper.map(this.value),
      this.children.map(new ChildrenMapper(mapper))
    );
  }
}
