import { ToEvaluate } from "../Lazy/Lazy";
import { LazyList } from "../LazyList/LazyList";
import { RoseTree } from "../RoseTree/RoseTree";
import { seriesInt } from "./SeriesInt";

class ShrinkBranchesThunk<T> {
  constructor(readonly shrinker: Shrinker<T>, readonly root: T) {}

  map(shrunkRoot: T): RoseTree<T> {
    return this.shrinker.shrinkTree(shrunkRoot);
  }

  run() {
    return this.shrinker.shrink(this.root).map(this).list.force();
  }
}

export abstract class Shrinker<T> {
  abstract shrink(shrunken: T): LazyList<T>;

  shrinkTree(root: T): RoseTree<T> {
    return new RoseTree(
      root,
      new LazyList(new ToEvaluate(new ShrinkBranchesThunk(this, root)))
    );
  }
}

export class IntShrinker extends Shrinker<number> {
  shrink(shrunken: number): LazyList<number> {
    if (shrunken < 0) {
      return seriesInt(0, -shrunken)
        .map({
          map(input) {
            return -input;
          },
        })
        .cons(-shrunken);
    }

    return seriesInt(0, shrunken);
  }
}
