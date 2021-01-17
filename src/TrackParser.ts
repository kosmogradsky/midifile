import { MidiEvent } from "./MidiEvent";
import { MidiParser } from "./MidiParser";

export class TrackParser {
  constructor(
    readonly trackIndex: number,
    readonly midiEvent: MidiEvent | null,
    readonly parser: MidiParser
  ) {}

  setMidiEvent(midiEvent: MidiEvent): TrackParser {
    return new TrackParser(this.trackIndex, midiEvent, this.parser);
  }

  next(): TrackParser {
    return new TrackParser(this.trackIndex, this.parser.next(), this.parser);
  }
}

export class SmallestDeltaTrackMidiEvent {
  constructor(readonly trackIndex: number, readonly midiEvent: MidiEvent) {}
}
