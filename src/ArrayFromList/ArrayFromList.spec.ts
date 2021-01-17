import { LinkedEmpty } from "../LinkedList/LinkedList";
import { ArrayFromList } from "./ArrayFromList";

describe("ArrayFromList", () => {
  test("ArrayFromList", () => {
    const list = new LinkedEmpty()
      .cons(1)
      .cons(2)
      .cons(3)
      .cons(4)
      .cons(5)
      .cons(6);
    const arrayFromList = new ArrayFromList(3, list);

    expect(arrayFromList.array).toEqual([6, 5, 4]);
    expect(arrayFromList.remainsOfList).toEqual(
      new LinkedEmpty().cons(1).cons(2).cons(3)
    );
  });
});
