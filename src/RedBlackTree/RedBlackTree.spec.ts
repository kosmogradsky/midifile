import { RedBlackTree, RedBlackEmpty } from "./RedBlackTree";

describe("RedBlackTree", () => {
  test("empty", () => {
    expect(RedBlackTree.fromArray([])).toEqual(
      new RedBlackEmpty<string, string>()
    );
  });

  test("insert", () => {
    expect(RedBlackTree.fromArray([["k", "v"]])).toEqual(
      new RedBlackEmpty<string, string>().insert("k", "v")
    );
  });

  test("insert replace", () => {
    expect(RedBlackTree.fromArray([["k", "vv"]])).toEqual(
      new RedBlackEmpty<string, string>().insert("k", "v").insert("k", "vv")
    );
  });

  test("get existent", () => {
    expect(RedBlackTree.fromArray([["k", "v"]]).get("k")).toEqual("v");
  });

  test("get non-existent", () => {
    expect(RedBlackTree.fromArray([["k", "v"]]).get("g")).toEqual(undefined);
  });
});
