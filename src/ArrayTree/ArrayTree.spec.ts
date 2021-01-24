import { ArrayTree, initializeArray } from "./ArrayTree";

const thirdLevelInTree = 33000;

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const identityInitializer = {
  initialize(index: number) {
    return index;
  },
};

describe("ArrayTree", () => {
  describe("initialization", () => {
    test("initialize", () => {
      for (let i = 0; i < 100; i++) {
        const randomLength = getRandomInt(1, thirdLevelInTree);

        expect(
          ArrayTree.initialize(randomLength, identityInitializer).toArray()
        ).toEqual(initializeArray(randomLength, 0, identityInitializer));
      }
    });

    test("push", () => {
      for (let i = 0; i < 100; i++) {
        const randomLength = getRandomInt(1, thirdLevelInTree);

        const actual = initializeArray(
          randomLength,
          0,
          identityInitializer
        ).reduce(
          (acc, element) => acc.push(element),
          ArrayTree.empty<number>()
        );

        expect(actual).toEqual(
          ArrayTree.initialize(randomLength, identityInitializer)
        );
      }
    });

    test("initialize non-identity", () => {
      expect(
        ArrayTree.initialize(4, {
          initialize(index) {
            return index * index;
          },
        }).toArray()
      ).toEqual([0, 1, 4, 9]);
    });

    test("initialize empty", () => {
      expect(ArrayTree.initialize(0, identityInitializer).toArray()).toEqual(
        []
      );
    });

    test("initialize negative", () => {
      expect(ArrayTree.initialize(-2, identityInitializer).toArray()).toEqual(
        []
      );
    });
  });

  describe("isEmpty", () => {
    test("all empty arrays are equal", () => {
      expect(ArrayTree.empty()).toEqual(ArrayTree.fromArray([]));
    });

    test("empty array", () => {
      expect(ArrayTree.empty().isEmpty()).toBe(true);
    });

    test("empty converted array", () => {
      expect(ArrayTree.fromArray([]).isEmpty()).toBe(true);
    });

    test("non-empty array", () => {
      expect(ArrayTree.fromArray([1]).isEmpty()).toBe(false);
    });
  });

  describe("length", () => {
    test("empty array", () => {
      expect(ArrayTree.empty().length).toEqual(0);
    });

    test("non-empty array", () => {
      for (let i = 0; i < 100; i++) {
        const length = getRandomInt(1, thirdLevelInTree);

        expect(
          ArrayTree.initialize(length, identityInitializer).length
        ).toEqual(length);
      }
    });

    test("push", () => {
      for (let i = 0; i < 100; i++) {
        const length = getRandomInt(1, thirdLevelInTree);

        expect(
          ArrayTree.initialize(length, identityInitializer).push(length).length
        ).toEqual(length + 1);
      }
    });

    test("append", () => {
      for (let i = 0; i < 100; i++) {
        const length = getRandomInt(1, thirdLevelInTree);

        expect(
          ArrayTree.initialize(length, identityInitializer).append(
            ArrayTree.initialize(Math.trunc(length / 2), identityInitializer)
          ).length
        ).toEqual(length + Math.trunc(length / 2));
      }
    });

    test(`set does not increase with length ${length}`, () => {
      for (let i = 0; i < 100; i++) {
        const length = getRandomInt(1, thirdLevelInTree);

        expect(
          ArrayTree.initialize(length, identityInitializer).set(
            Math.trunc(length / 2),
            1
          ).length
        ).toEqual(length);
      }
    });
  });
});
