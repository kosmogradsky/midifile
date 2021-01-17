import { LinkedElement } from "./LinkedList/LinkedList";
import { TrackNote } from "./TrackNote";

export class SongTrack {
  constructor(
    readonly trackNumber: number,
    readonly notes: LinkedElement<TrackNote>,
    readonly volume = 1,
    readonly program = 0
  ) {}
}
