import { ArrayTree, initializeArray } from "./ArrayTree";

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const identityInitializer = {
  initialize(index: number) {
    return index;
  },
};

describe("ArrayTree", () => {
  test("initialize", () => {
    for (let i = 0; i < 100; i++) {
      const randomLength = getRandomInt(1, 33000);

      expect(
        ArrayTree.initialize(randomLength, identityInitializer).toArray()
      ).toEqual(initializeArray(randomLength, 0, identityInitializer));
    }
  });

  test("push", () => {
    for (let i = 0; i < 100; i++) {
      const randomLength = getRandomInt(1, 33000);

      const actual = initializeArray(
        randomLength,
        0,
        identityInitializer
      ).reduce((acc, element) => acc.push(element), ArrayTree.empty<number>());

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
    expect(ArrayTree.initialize(0, identityInitializer).toArray()).toEqual([]);
  });

  test("initialize negative", () => {
    expect(ArrayTree.initialize(-2, identityInitializer).toArray()).toEqual([]);
  });
});
