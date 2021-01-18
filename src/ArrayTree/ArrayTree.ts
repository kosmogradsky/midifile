import { ArrayHelper } from "../ArrayHelper/ArrayHelper";
import { Reducer } from "../Reducer/Reducer";

function logBase(base: number, n: number) {
  return Math.log(n) / Math.log(base);
}

function compressNodes<T>(nodes: Node<T>[]): Node<T>[] {
  let acc: Node<T>[] = [];

  for (let i = 0; i < nodes.length; i += branchFactor) {
    acc.push(new Tree(nodes.slice(i, i + branchFactor)));
  }

  return acc;
}

interface ElementInitializer<T> {
  initialize(index: number): T;
}

export function initializeArray<T>(
  length: number,
  offset: number,
  elementInitializer: ElementInitializer<T>
): T[] {
  const result = new Array(length);

  for (let i = 0; i < length; i++) {
    result[i] = elementInitializer.initialize(offset + i);
  }

  return result;
}

const branchFactor = 32;
const shiftStep = Math.ceil(Math.log2(branchFactor));
const lastStepBits = 0xffffffff >>> (32 - shiftStep);

interface Node<T> {
  get(index: number, depth: number): T;
  set(index: number, value: T, depth: number): Node<T>;
  insertTail(tail: T[], index: number, depth: number): Tree<T>;
  reduceLeft<R>(reducer: Reducer<T, R>, seed: R): R;
  reduceRight<R>(reducer: Reducer<T, R>, seed: R): R;
  [Symbol.iterator](): IterableIterator<T>;
}

class Tree<T> implements Node<T> {
  constructor(readonly nodes: Node<T>[]) {}

  getNodeIndex(index: number, depth: number) {
    return lastStepBits & (index >>> (depth * shiftStep));
  }

  get(index: number, depth: number) {
    return new ArrayHelper(this.nodes)
      .get(this.getNodeIndex(index, depth))
      .get(index, depth - 1);
  }

  set(index: number, value: T, depth: number): Tree<T> {
    const nodeIndex = this.getNodeIndex(index, depth);
    const subtree = new ArrayHelper(this.nodes).get(nodeIndex);
    const newSubtree = subtree.set(index, value, depth - 1);

    return new Tree(
      new ArrayHelper(this.nodes).set(nodeIndex, newSubtree).getResult()
    );
  }

  insertTail(tail: T[], index: number, depth: number): Tree<T> {
    const nodeIndex = this.getNodeIndex(index, depth);

    if (nodeIndex >= this.nodes.length) {
      if (depth === 1) {
        return new Tree(
          new ArrayHelper(this.nodes).push(new Leaf(tail)).getResult()
        );
      } else {
        const subtree = new Tree<T>([]).insertTail(tail, index, depth - 1);

        return new Tree(new ArrayHelper(this.nodes).push(subtree).getResult());
      }
    } else {
      const node = new ArrayHelper(this.nodes).get(nodeIndex);
      const updatedNode = node.insertTail(tail, index, depth - 1);

      return new Tree(
        new ArrayHelper(this.nodes).set(nodeIndex, updatedNode).getResult()
      );
    }
  }

  reduceLeft<R>(reducer: Reducer<T, R>, seed: R): R {
    return this.nodes.reduce(
      (acc, node) => node.reduceLeft(reducer, acc),
      seed
    );
  }

  reduceRight<R>(reducer: Reducer<T, R>, seed: R): R {
    return this.nodes.reduce(
      (acc, node) => node.reduceRight(reducer, acc),
      seed
    );
  }

  *[Symbol.iterator]() {
    for (const node of this.nodes) {
      yield* node[Symbol.iterator]();
    }
  }
}

class Leaf<T> implements Node<T> {
  constructor(readonly elements: T[]) {}

  get(index: number, depth: number) {
    return new ArrayHelper(this.elements).get(lastStepBits & index);
  }

  set(index: number, value: T): Leaf<T> {
    return new Leaf(
      new ArrayHelper(this.elements)
        .set(lastStepBits & index, value)
        .getResult()
    );
  }

  insertTail(tail: T[], index: number, depth: number): Tree<T> {
    return new Tree([this]).insertTail(tail, index, depth - 1);
  }

  reduceLeft<R>(reducer: Reducer<T, R>, seed: R): R {
    return this.elements.reduce(
      (acc, element) => reducer.reduce(acc, element),
      seed
    );
  }

  reduceRight<R>(reducer: Reducer<T, R>, seed: R): R {
    return this.elements.reduceRight(
      (acc, element) => reducer.reduce(acc, element),
      seed
    );
  }

  [Symbol.iterator]() {
    return this.elements[Symbol.iterator]();
  }
}

class Builder<T> {
  constructor(readonly tail: T[], readonly nodeList: Node<T>[]) {}

  toArrayTree(): ArrayTree<T> {
    if (this.nodeList.length === 0) {
      return new ArrayTree(this.tail.length, 1, new Tree([]), this.tail);
    } else {
      const nodesCount = this.nodeList.length * branchFactor;
      const tree = this.toTree();
      const depth = Math.max(
        1,
        Math.floor(logBase(branchFactor, nodesCount - 1))
      );

      return new ArrayTree(
        this.tail.length + nodesCount,
        depth,
        tree,
        this.tail
      );
    }
  }

  toTree(): Tree<T> {
    let nodeList = this.nodeList;

    while (nodeList.length > 1) {
      nodeList = compressNodes(nodeList);
    }

    return new Tree(nodeList);
  }
}

export class ArrayTree<T> {
  static empty<T>(): ArrayTree<T> {
    return new ArrayTree(0, 1, new Tree([]), []);
  }

  static initialize<T>(
    length: number,
    elementInitializer: ElementInitializer<T>
  ): ArrayTree<T> {
    if (length <= 0) {
      return ArrayTree.empty<T>();
    }

    const tailLength = length % branchFactor;
    const leavesLength = length - tailLength;
    const tail = initializeArray(tailLength, leavesLength, elementInitializer);

    let leaves: Leaf<T>[] = [];
    for (let i = 0; i < leavesLength; i += branchFactor) {
      leaves.push(
        new Leaf(initializeArray(branchFactor, i, elementInitializer))
      );
    }

    return new Builder(tail, leaves).toArrayTree();
  }

  constructor(
    readonly length: number,
    readonly depth: number,
    readonly tree: Tree<T>,
    readonly tail: T[]
  ) {}

  private getIndexOfTheFirstElementInTail() {
    return (this.length >>> shiftStep) << shiftStep;
  }

  *[Symbol.iterator]() {
    yield* this.tree[Symbol.iterator]();
    yield* this.tail[Symbol.iterator]();
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this.length) {
      return undefined;
    }

    if (index >= this.getIndexOfTheFirstElementInTail()) {
      return new ArrayHelper(this.tail).get(lastStepBits & index);
    }

    return this.tree.get(index, this.depth);
  }

  set(index: number, value: T): ArrayTree<T> {
    if (index < 0 || index >= this.length) {
      return this;
    }

    if (index >= this.getIndexOfTheFirstElementInTail()) {
      return new ArrayTree(
        this.length,
        this.depth,
        this.tree,
        new ArrayHelper(this.tail).set(lastStepBits & index, value).getResult()
      );
    }

    return new ArrayTree(
      this.length,
      this.depth,
      this.tree.set(index, value, this.depth),
      this.tail
    );
  }

  private replaceTail(newTail: T[]): ArrayTree<T> {
    const originalTailLength = this.tail.length;
    const newTailLength = newTail.length;

    const newArrayTreeLength =
      this.length + (newTailLength - originalTailLength);

    if (newTailLength > branchFactor) {
      throw new Error(
        "new tail length is greater than branching factor, cannot replace tail"
      );
    }

    if (newTailLength === branchFactor) {
      const overflow =
        newArrayTreeLength >>> shiftStep > 1 << (this.depth * shiftStep);

      if (overflow) {
        const newDepth = this.depth + 1;
        const newTree = new Tree([this.tree]).insertTail(
          newTail,
          this.length,
          newDepth
        );

        return new ArrayTree(newArrayTreeLength, newDepth, newTree, []);
      }

      return new ArrayTree(
        newArrayTreeLength,
        this.depth,
        this.tree.insertTail(newTail, this.length, this.depth),
        []
      );
    }

    return new ArrayTree(newArrayTreeLength, this.depth, this.tree, newTail);
  }

  push(element: T): ArrayTree<T> {
    return this.replaceTail(
      new ArrayHelper(this.tail).push(element).getResult()
    );
  }

  reduceLeft<R>(reducer: Reducer<T, R>, seed: R): R {
    const reducedNodes = this.tree.nodes.reduce(
      (acc, node) => node.reduceLeft(reducer, acc),
      seed
    );

    return this.tail.reduce(
      (acc, element) => reducer.reduce(acc, element),
      reducedNodes
    );
  }

  reduceRight<R>(reducer: Reducer<T, R>, seed: R): R {
    const reducedNodes = this.tree.nodes.reduceRight(
      (acc, node) => node.reduceRight(reducer, acc),
      seed
    );

    return this.tail.reduceRight(
      (acc, element) => reducer.reduce(acc, element),
      reducedNodes
    );
  }

  toArray(): T[] {
    const result: T[] = [];

    for (const element of this) {
      result.push(element);
    }

    return result;
  }
}
