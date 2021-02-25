import { Mapper } from "../Mapper/Mapper";
import { LinkedEmpty, LinkedList, SumReducer } from "./LinkedList";

class NegateMapper implements Mapper<number, number> {
  map(input: number): number {
    return -input;
  }
}

const increment = 5;
class IncrementMapper implements Mapper<number, number> {
  map(input: number): number {
    return input + increment;
  }
}

function testListOfN(n: number): void {
  describe(`list with ${n} elements`, () => {
    const zeroHeadedRange = LinkedList.range(0, n);
    const range = LinkedList.range(1, n);
    const rangeWithEachElementIncremented = LinkedList.range(
      1 + increment,
      n + increment
    );
    const rangeInOppositeDirection = LinkedList.range(-n, -1).map(
      new NegateMapper()
    );
    const sumOfTermsInSequence = (n * (n + 1)) / 2;

    test("reduceLeft sum", () => {
      expect(range.reduceLeft(new SumReducer(), 0)).toEqual(
        sumOfTermsInSequence
      );
    });

    test("reduceRight sum", () => {
      expect(range.reduceRight(new SumReducer(), 0)).toEqual(
        sumOfTermsInSequence
      );
    });

    test("reverse", () => {
      expect(range.reverse().toArray()).toEqual(
        rangeInOppositeDirection.toArray()
      );
    });

    test("length", () => {
      expect(range.length()).toEqual(n);
    });

    test("map", () => {
      expect(range.map(new IncrementMapper()).toArray()).toEqual(
        rangeWithEachElementIncremented.toArray()
      );
    });

    test("for-of loop", () => {
      const array = [];

      for (const num of range) {
        array.push(num);
      }

      expect(array).toEqual(range.toArray());
    });

    describe("drop", () => {
      test("none", () => {
        expect(range).toEqual(range.drop(0));
      });

      test("some", () => {
        expect(new LinkedEmpty().cons(n)).toEqual(zeroHeadedRange.drop(n));
      });

      test("all", () => {
        expect(new LinkedEmpty()).toEqual(range.drop(n));
      });

      test("all+", () => {
        expect(new LinkedEmpty()).toEqual(range.drop(n + 1));
      });
    });
  });
}

describe("LinkedList", () => {
  testListOfN(0);
  testListOfN(1);
  testListOfN(2);
  testListOfN(5000);
});
