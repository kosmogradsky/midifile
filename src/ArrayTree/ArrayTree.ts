import { ArrayHelper } from "../ArrayHelper/ArrayHelper";
import { LinkedEmpty, LinkedList } from "../LinkedList/LinkedList";
import { Reducer } from "../Reducer/Reducer";

function logBase(base: number, n: number) {
  return Math.log(n) / Math.log(base);
}

function compressNodes<T>(nodes: LinkedList<Node<T>>): LinkedList<Node<T>> {
  let acc: LinkedList<Node<T>> = new LinkedEmpty();
  let treeNodes: Node<T>[] = [];

  for (const node of nodes) {
    treeNodes.push(node);

    if (treeNodes.length === branchFactor) {
      acc = acc.cons(new Tree(treeNodes));
      treeNodes = [];
    }
  }

  if (treeNodes.length > 0) {
    acc = acc.cons(new Tree(treeNodes));
  }

  return acc.reverse();
}

function appendN<T>(n: number, dest: T[], source: T[]): T[] {
  const destLength = dest.length;
  const itemsToCopy = Math.min(n - destLength, source.length);

  const size = destLength + itemsToCopy;
  const result = new Array(size);

  for (let i = 0; i < destLength; i++) {
    result[i] = dest[i];
  }

  for (let i = 0; i < itemsToCopy; i++) {
    result[i + destLength] = source[i];
  }

  return result;
}

function getTailIndex(length: number): number {
  return (length >>> shiftStep) << shiftStep;
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
const benchmarkDiscoveredAppendPerformanceBorder = branchFactor * 4;

interface Node<T> {
  get(index: number, depth: number): T;
  set(index: number, value: T, depth: number): Node<T>;
  insertTail(tail: T[], index: number, depth: number): Tree<T>;
  reduceLeft<R>(reducer: Reducer<T, R>, seed: R): R;
  reduceRight<R>(reducer: Reducer<T, R>, seed: R): R;
  [Symbol.iterator](): IterableIterator<T>;
  reduceLeaves<R>(reducer: Reducer<Leaf<T>, R>, seed: R): R;
  asTree(): Tree<T> | null;
  fetchNewTail(endIndex: number, depth: number): T[];
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

  reduceLeaves<R>(reducer: Reducer<Leaf<T>, R>, seed: R): R {
    return this.nodes.reduce(
      (acc, node) => node.reduceLeaves(reducer, acc),
      seed
    );
  }

  asTree(): Tree<T> {
    return this;
  }

  hoistTree(oldDepth: number, newDepth: number): Tree<T> {
    if (oldDepth <= newDepth || this.nodes.length === 0) {
      return this;
    }

    const subnode = new ArrayHelper(this.nodes).get(0);
    const subtree = subnode.asTree();

    if (subtree === null) {
      return this;
    }

    return subtree.hoistTree(oldDepth - 1, newDepth);
  }

  sliceTree(depth: number, endIndex: number): Tree<T> {
    const endNodeIndex = this.getNodeIndex(depth, endIndex);
    const subnode = new ArrayHelper(this.nodes).get(endNodeIndex);
    const subtree = subnode.asTree();

    if (subtree === null) {
      return new Tree(this.nodes.slice(0, endNodeIndex));
    }

    const newSubtree = subtree.sliceTree(depth - 1, endIndex);
    if (newSubtree.nodes.length === 0) {
      return new Tree(this.nodes.slice(0, endNodeIndex));
    }

    const newNodes = this.nodes.slice(0, endNodeIndex);
    newNodes.push(newSubtree);
    return new Tree(newNodes);
  }

  fetchNewTail(endIndex: number, depth: number): T[] {
    const tailNodeIndex = this.getNodeIndex(endIndex, depth);
    const tailNode = new ArrayHelper(this.nodes).get(tailNodeIndex);

    return tailNode.fetchNewTail(endIndex, depth - 1);
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

  reduceLeaves<R>(reducer: Reducer<Leaf<T>, R>, seed: R): R {
    return reducer.reduce(seed, this);
  }

  asTree(): null {
    return null;
  }

  fetchNewTail(endIndex: number): T[] {
    return this.elements.slice(0, lastStepBits & endIndex);
  }
}

class Builder<T> {
  constructor(
    readonly tail: T[],
    readonly nodeList: LinkedList<Node<T>>,
    readonly nodeListLength: number
  ) {}

  toArrayTree(shouldReverseNodeList: boolean): ArrayTree<T> {
    if (this.nodeListLength === 0) {
      return new ArrayTree(this.tail.length, 1, new Tree([]), this.tail);
    } else {
      const treeLength = this.nodeListLength * branchFactor;
      const tree = this.toTree(shouldReverseNodeList);
      const depth = Math.max(
        1,
        Math.floor(logBase(branchFactor, treeLength - 1))
      );

      return new ArrayTree(
        this.tail.length + treeLength,
        depth,
        tree,
        this.tail
      );
    }
  }

  toTree(shouldReverseNodeList: boolean): Tree<T> {
    let nodeList = shouldReverseNodeList
      ? this.nodeList.reverse()
      : this.nodeList;
    let nextNodeListLength = Math.ceil(this.nodeListLength / branchFactor);

    while (nextNodeListLength > 1) {
      nodeList = compressNodes(nodeList);
      nextNodeListLength = Math.ceil(nextNodeListLength / branchFactor);
    }

    return new Tree(nodeList.toArray());
  }

  appendHelpBuilder(tail: T[]): Builder<T> {
    const appended = appendN(branchFactor, this.tail, tail);
    const notAppended = branchFactor - this.tail.length - tail.length;

    if (notAppended < 0) {
      return new Builder(
        tail.slice(notAppended),
        this.nodeList.cons(new Leaf(appended)),
        this.nodeListLength + 1
      );
    }

    if (notAppended === 0) {
      return new Builder(
        [],
        this.nodeList.cons(new Leaf(appended)),
        this.nodeListLength + 1
      );
    }

    return new Builder(appended, this.nodeList, this.nodeListLength);
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

    let leaves: LinkedList<Leaf<T>> = new LinkedEmpty();
    for (
      let i = leavesLength - branchFactor;
      i > -branchFactor;
      i -= branchFactor
    ) {
      leaves = leaves.cons(
        new Leaf(initializeArray(branchFactor, i, elementInitializer))
      );
    }

    return new Builder(tail, leaves, leavesLength / branchFactor).toArrayTree(
      false
    );
  }

  static fromArray<T>(array: T[]): ArrayTree<T> {
    if (array.length === 0) {
      return ArrayTree.empty<T>();
    }

    const tailLength = array.length % branchFactor;
    const leavesLength = array.length - tailLength;
    const tail = array.slice(leavesLength);

    let leaves: LinkedList<Leaf<T>> = new LinkedEmpty();
    for (let i = leavesLength - branchFactor; i > 0; i -= branchFactor) {
      leaves = leaves.cons(new Leaf(array.slice(i, i + branchFactor)));
    }

    return new Builder(tail, leaves, leavesLength / branchFactor).toArrayTree(
      false
    );
  }

  readonly tailIndex = getTailIndex(this.length);

  constructor(
    readonly length: number,
    readonly depth: number,
    readonly tree: Tree<T>,
    readonly tail: T[]
  ) {}

  *[Symbol.iterator]() {
    yield* this.tree[Symbol.iterator]();
    yield* this.tail[Symbol.iterator]();
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this.length) {
      return undefined;
    }

    if (index >= this.tailIndex) {
      return new ArrayHelper(this.tail).get(lastStepBits & index);
    }

    return this.tree.get(index, this.depth);
  }

  set(index: number, value: T): ArrayTree<T> {
    if (index < 0 || index >= this.length) {
      return this;
    }

    if (index >= this.tailIndex) {
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

  isEmpty() {
    return this.length === 0;
  }

  append(appendix: ArrayTree<T>): ArrayTree<T> {
    const border = benchmarkDiscoveredAppendPerformanceBorder;

    if (appendix.length <= border) {
      const reducer: Reducer<Leaf<T>, ArrayTree<T>> = {
        reduce(arrayTree, leaf) {
          return arrayTree.appendHelpTree(leaf.elements);
        },
      };

      return appendix.tree
        .reduceLeaves(reducer, this)
        .appendHelpTree(appendix.tail);
    }

    const reducer: Reducer<Leaf<T>, Builder<T>> = {
      reduce(arrayTree, leaf) {
        return arrayTree.appendHelpBuilder(leaf.elements);
      },
    };

    return appendix.tree
      .reduceLeaves(reducer, this.toBuilder())
      .appendHelpBuilder(appendix.tail)
      .toArrayTree(true);
  }

  appendHelpTree(elements: T[]): ArrayTree<T> {
    const appended = appendN(branchFactor, this.tail, elements);
    const itemsToAppend = elements.length;
    const notAppended = branchFactor - this.tail.length - itemsToAppend;
    const newArrayTree = this.replaceTail(appended);

    if (notAppended < 0) {
      const nextTail = elements.slice(notAppended);

      return newArrayTree.replaceTail(nextTail);
    }

    return newArrayTree;
  }

  toBuilder(): Builder<T> {
    const reducer: Reducer<Leaf<T>, LinkedList<Node<T>>> = {
      reduce(list, leaf) {
        return list.cons(leaf);
      },
    };

    return new Builder(
      this.tail,
      this.tree.nodes.reduce(
        (acc: LinkedList<Node<T>>, node) => node.reduceLeaves(reducer, acc),
        new LinkedEmpty<Node<T>>()
      ),
      Math.trunc(this.length / branchFactor)
    );
  }

  private translateIndex(index: number) {
    const positiveIndex = index < 0 ? this.length + index : index;

    if (positiveIndex < 0) {
      return 0;
    }

    if (positiveIndex > this.length) {
      return this.length;
    }

    return positiveIndex;
  }

  private sliceRight(endIndex: number): ArrayTree<T> {
    if (endIndex === this.length) {
      return this;
    }

    if (endIndex >= this.tailIndex) {
      return new ArrayTree(
        endIndex,
        this.depth,
        this.tree,
        this.tail.slice(0, lastStepBits & endIndex)
      );
    }

    const newTailIndex = getTailIndex(endIndex);
    const newDepth = Math.max(
      1,
      Math.floor(logBase(branchFactor, Math.max(newTailIndex - 1, 1)))
    );

    return new ArrayTree(
      endIndex,
      newDepth,
      this.tree
        .sliceTree(this.depth, newTailIndex)
        .hoistTree(this.depth, newDepth),
      this.tree.fetchNewTail(endIndex, this.depth)
    );
  }

  private sliceLeft(from: number): ArrayTree<T> {
    if (from === 0) {
      return this;
    }

    if (from >= this.tailIndex) {
      return new ArrayTree<T>(
        this.length - from,
        this.depth,
        new Tree([]),
        this.tail.slice(from - this.tailIndex)
      );
    }

    const leafNodes = this.tree.reduceLeaves<LinkedList<Leaf<T>>>(
      {
        reduce(acc, leaf) {
          return acc.cons(leaf);
        },
      },
      new LinkedEmpty()
    );
    const nodesToDrop = Math.trunc(from / branchFactor);
    const nodesToInsert = leafNodes.drop(nodesToDrop);

    
  }
}
