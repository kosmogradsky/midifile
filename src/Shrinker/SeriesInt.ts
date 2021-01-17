import { LazyList } from "../LazyList/LazyList";

export function seriesInt(low: number, high: number): LazyList<number> {
  if (low >= high) {
    return LazyList.empty();
  }

  if (low === high - 1) {
    return LazyList.empty<number>().cons(low);
  }

  const nextLow = low + Math.trunc((high - low) / 2);

  return seriesInt(nextLow, high).cons(low);
}
