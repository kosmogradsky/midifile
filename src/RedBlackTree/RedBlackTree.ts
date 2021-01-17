interface ToString {
  toString(): string;
}

export interface Updater<TValue> {
  update(prev: TValue | undefined): TValue;
}

class InsertUpdater<TValue> implements Updater<TValue> {
  constructor(readonly insertValue: TValue) {}

  update() {
    return this.insertValue;
  }
}

interface HasValueOrSubtree<TKey, TValue> {
  getValueOrSubtree(key: TKey): GotValueOrSubtree<TKey, TValue>;
}

interface GotValueOrSubtree<TKey, TValue> {
  value: TValue | undefined;
  subtree: HasValueOrSubtree<TKey, TValue> | undefined;
}

class GotValue<TKey, TValue> implements GotValueOrSubtree<TKey, TValue> {
  subtree: HasValueOrSubtree<TKey, TValue> | undefined = undefined;

  constructor(readonly value: TValue | undefined) {}
}

class GotSubtree<TKey, TValue> implements GotValueOrSubtree<TKey, TValue> {
  value: TValue | undefined = undefined;

  constructor(readonly subtree: HasValueOrSubtree<TKey, TValue>) {}
}

export abstract class RedBlackTree<TKey extends ToString, TValue> {
  static fromArray<TKey, TValue>(
    entries: [key: TKey, value: TValue][]
  ): RedBlackTree<TKey, TValue> {
    return entries.reduce<RedBlackTree<TKey, TValue>>(
      (tree, [key, value]) => tree.insert(key, value),
      new RedBlackEmpty<TKey, TValue>()
    );
  }

  abstract get(key: TKey): TValue | undefined;
  abstract getValueOrSubtree(key: TKey): GotValueOrSubtree<TKey, TValue>;
  abstract update(
    key: TKey,
    updater: Updater<TValue>
  ): RedBlackTree<TKey, TValue>;
  abstract updateHelp(
    key: TKey,
    updater: Updater<TValue>
  ): RedBlackNode<TKey, TValue>;
  abstract balanceRight(
    leftNode: RedBlackTree<TKey, TValue>,
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue>;
  abstract balanceLeftWhenRightIsBlack(
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue>;

  insert(key: TKey, value: TValue): RedBlackTree<TKey, TValue> {
    return this.update(key, new InsertUpdater(value));
  }
}

export class RedBlackEmpty<TKey, TValue> extends RedBlackTree<TKey, TValue> {
  get(): TValue | undefined {
    return undefined;
  }

  getValueOrSubtree(): GotValueOrSubtree<TKey, TValue> {
    return new GotValue<TKey, TValue>(undefined);
  }

  update(key: TKey, updater: Updater<TValue>): RedBlackTree<TKey, TValue> {
    return new BlackNode(
      key,
      updater.update(undefined),
      new RedBlackEmpty(),
      new RedBlackEmpty()
    );
  }

  updateHelp(key: TKey, updater: Updater<TValue>): RedBlackNode<TKey, TValue> {
    return new RedNode(
      key,
      updater.update(undefined),
      new RedBlackEmpty(),
      new RedBlackEmpty()
    );
  }

  balanceRight(
    leftNode: RedBlackTree<TKey, TValue>,
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue> {
    return leftNode.balanceLeftWhenRightIsBlack(rootNode);
  }

  balanceLeftWhenRightIsBlack(
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue> {
    return rootNode;
  }
}

abstract class RedBlackNode<TKey extends ToString, TValue> extends RedBlackTree<
  TKey,
  TValue
> {
  constructor(
    readonly key: TKey,
    readonly value: TValue,
    readonly left: RedBlackTree<TKey, TValue>,
    readonly right: RedBlackTree<TKey, TValue>
  ) {
    super();
  }

  abstract createSameColorNode(
    key: TKey,
    value: TValue,
    left: RedBlackTree<TKey, TValue>,
    right: RedBlackTree<TKey, TValue>
  ): RedBlackNode<TKey, TValue>;

  abstract balanceLeftWhenRightIsRed(
    rightNode: RedBlackNode<TKey, TValue>,
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue>;

  abstract balanceLeftLeft(
    leftNode: RedBlackNode<TKey, TValue>,
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue>;

  abstract balanceRight(
    leftNode: RedBlackTree<TKey, TValue>,
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue>;

  abstract balanceLeftWhenRightIsBlack(
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue>;

  abstract colorBlack(): BlackNode<TKey, TValue>;

  balance() {
    return this.right.balanceRight(this.left, this);
  }

  getValueOrSubtree(key: TKey): GotValueOrSubtree<TKey, TValue> {
    if (key === this.key) {
      return new GotValue(this.value);
    } else if (key > this.key) {
      return new GotSubtree(this.right);
    } else {
      return new GotSubtree(this.left);
    }
  }

  get(key: TKey): TValue | undefined {
    let subtree: HasValueOrSubtree<TKey, TValue> | undefined = this;
    let value: TValue | undefined = undefined;

    while (subtree !== undefined) {
      const result: GotValueOrSubtree<TKey, TValue> = subtree.getValueOrSubtree(
        key
      );

      subtree = result.subtree;
      value = result.value;
    }

    return value;
  }

  update(key: TKey, updater: Updater<TValue>): RedBlackTree<TKey, TValue> {
    return this.updateHelp(key, updater).colorBlack();
  }

  updateHelp(key: TKey, updater: Updater<TValue>): RedBlackNode<TKey, TValue> {
    const sKey = key.toString();
    const sThisKey = this.key.toString();

    if (sKey < sThisKey) {
      return this.createSameColorNode(
        this.key,
        this.value,
        this.left.updateHelp(key, updater),
        this.right
      ).balance();
    }

    if (sKey > sThisKey) {
      return this.createSameColorNode(
        this.key,
        this.value,
        this.left,
        this.right.updateHelp(key, updater)
      ).balance();
    }

    return this.createSameColorNode(
      this.key,
      updater.update(this.value),
      this.left,
      this.right
    );
  }
}

class RedNode<TKey, TValue> extends RedBlackNode<TKey, TValue> {
  constructor(
    readonly key: TKey,
    readonly value: TValue,
    readonly left: RedBlackTree<TKey, TValue>,
    readonly right: RedBlackTree<TKey, TValue>
  ) {
    super(key, value, left, right);
  }

  createSameColorNode(
    key: TKey,
    value: TValue,
    left: RedBlackTree<TKey, TValue>,
    right: RedBlackTree<TKey, TValue>
  ): RedBlackNode<TKey, TValue> {
    return new RedNode(key, value, left, right);
  }

  balanceRight(
    leftNode: RedBlackNode<TKey, TValue>,
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue> {
    return leftNode.balanceLeftWhenRightIsRed(this, rootNode);
  }

  balanceLeftWhenRightIsRed(
    rightNode: RedBlackNode<TKey, TValue>,
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue> {
    return new RedNode(
      rootNode.key,
      rootNode.value,
      this.colorBlack(),
      rightNode.colorBlack()
    );
  }

  balanceLeftWhenRightIsBlack(
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue> {
    return this.balanceLeftLeft(this, rootNode);
  }

  balanceLeftLeft(
    leftNode: RedBlackNode<TKey, TValue>,
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue> {
    return new RedNode(
      leftNode.key,
      leftNode.value,
      this.colorBlack(),
      new BlackNode(
        rootNode.key,
        rootNode.value,
        leftNode.right,
        rootNode.right
      )
    );
  }

  colorBlack() {
    return new BlackNode(this.key, this.value, this.left, this.right);
  }
}

export class BlackNode<TKey, TValue> extends RedBlackNode<TKey, TValue> {
  constructor(
    readonly key: TKey,
    readonly value: TValue,
    readonly left: RedBlackTree<TKey, TValue>,
    readonly right: RedBlackTree<TKey, TValue>
  ) {
    super(key, value, left, right);
  }

  createSameColorNode(
    key: TKey,
    value: TValue,
    left: RedBlackTree<TKey, TValue>,
    right: RedBlackTree<TKey, TValue>
  ): RedBlackNode<TKey, TValue> {
    return new BlackNode(key, value, left, right);
  }

  balanceLeftWhenRightIsRed(
    rightNode: RedBlackNode<TKey, TValue>,
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue> {
    return rootNode.createSameColorNode(
      rightNode.key,
      rightNode.value,
      new RedNode(rootNode.key, rootNode.value, this, rightNode.left),
      rightNode.right
    );
  }

  balanceRight(
    leftNode: RedBlackTree<TKey, TValue>,
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue> {
    return leftNode.balanceLeftWhenRightIsBlack(rootNode);
  }

  balanceLeftWhenRightIsBlack(
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue> {
    return rootNode;
  }

  balanceLeftLeft(
    _leftNode: RedBlackNode<TKey, TValue>,
    rootNode: RedBlackNode<TKey, TValue>
  ): RedBlackNode<TKey, TValue> {
    return rootNode;
  }

  colorBlack() {
    return this;
  }
}
