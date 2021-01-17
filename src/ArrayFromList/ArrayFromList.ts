import { LinkedList } from "../LinkedList/LinkedList";

export class ArrayFromList<T> {
  readonly array: T[];
  readonly remainsOfList: LinkedList<T>;

  constructor(arrayLength: number, list: LinkedList<T>) {
    this.array = new Array(arrayLength);
    this.remainsOfList = list;
    let currentIndex = 0;
    let currentElement = list.asElement();

    while (currentIndex < arrayLength && currentElement !== null) {
      this.array[currentIndex] = currentElement.value;
      this.remainsOfList = currentElement.next;
      currentElement = this.remainsOfList.asElement();
      currentIndex++;
    }

    this.array.length = currentIndex;
  }
}
