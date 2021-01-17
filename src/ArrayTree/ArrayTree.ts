import { ArrayFromList } from "../ArrayFromList/ArrayFromList";
import { ArrayHelper } from "../ArrayHelper/ArrayHelper";
import { LinkedEmpty, LinkedList } from "../LinkedList/LinkedList";

function logBase(base: number, n: number) {
  return Math.log(n) / Math.log(base);
}

function compressNodes<T>(nodes: LinkedList<Node<T>>): LinkedList<Node<T>> {
  let acc: LinkedList<Node<T>> = new LinkedEmpty<Node<T>>();
  let remainingNodes = nodes;

  while (remainingNodes.length() > 0) {
    const arrayFromList = new ArrayFromList(branchFactor, nodes);
    acc = acc.cons(new Tree(arrayFromList.array));
    remainingNodes = arrayFromList.remainsOfList;
  }

  return acc.reverse();
}

const branchFactor = 32;
const shiftStep = Math.ceil(Math.log2(branchFactor));
const lastStepBits = 0xffffffff >>> (32 - shiftStep);

interface Node<T> {
  get(index: number, depth: number): T;
  set(index: number, value: T, depth: number): Node<T>;
  insertTail(tail: T[], index: number, depth: number): Tree<T>;
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
}

class Builder<T> {
  constructor(
    readonly tail: T[],
    readonly nodeList: LinkedList<Node<T>>,
    readonly nodeListSize: number
  ) {}

  toArrayTree(shouldReverseNodeList: boolean) {
    if (this.nodeListSize === 0) {
      return new ArrayTree(this.tail.length, 1, new Tree([]), this.tail);
    } else {
      const nodesCount = this.nodeListSize * branchFactor;
      const tree = this.toTree(nodesCount, shouldReverseNodeList);
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

  toTree(nodesCount: number, shouldReverseNodeList: boolean): Tree<T> {
    let nodeListSize = this.nodeListSize;
    let nodeList = shouldReverseNodeList
      ? this.nodeList.reverse()
      : this.nodeList;

    while (nodeListSize > 1) {
      nodeList = compressNodes(nodeList);
      nodeListSize = Math.ceil(nodeListSize / branchFactor);
    }

    return new Tree(new ArrayFromList(branchFactor, nodeList).array);
  }
}

class ArrayTree<T> {
  constructor(
    readonly length: number,
    readonly depth: number,
    readonly tree: Tree<T>,
    readonly tail: T[]
  ) {}

  getIndexOfTheFirstElementInTail() {
    return (this.length >>> shiftStep) << shiftStep;
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

  replaceTail(newTail: T[]): ArrayTree<T> {
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
}
