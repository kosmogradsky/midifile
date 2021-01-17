import { Reducer } from "../Reducer/Reducer";

export class ToArrayReducer<T> implements Reducer<T, T[]> {
  reduce(acc: T[], element: T): T[] {
    acc.push(element);
    return acc;
  }
}
