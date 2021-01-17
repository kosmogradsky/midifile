import { BeatNote } from "./BeatNote";
import { LinkedElement } from "./LinkedList/LinkedList";

export class SongBeat {
  constructor(
    readonly trackNumber: number,
    readonly notes: LinkedElement<BeatNote>,
    readonly volume = 1,
    readonly program = 0
  ) {}
}
