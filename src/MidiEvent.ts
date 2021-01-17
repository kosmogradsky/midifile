import {
  ChannelEventDetails,
  EventDetails,
  MetaEventDetails,
  MetaTextDetails,
} from "./EventDetails";

export class MidiMetaEvent {
  constructor(
    readonly index: string,
    readonly delta: number,
    readonly details: MetaEventDetails,
    readonly playTime: number,
    readonly trackIndex: number
  ) {}
}

export class MidiChannelEvent {
  constructor(
    readonly index: string,
    readonly delta: number,
    readonly details: ChannelEventDetails,
    readonly playTime = 0,
    readonly trackIndex = -1
  ) {}
}

export class MidiMetaTextEvent {
  constructor(
    readonly index: string,
    readonly delta: number,
    readonly details: MetaTextDetails,
    readonly playTime = 0,
    readonly trackIndex = -1
  ) {}

  setText(text: string): MidiMetaTextEvent {
    return new MidiMetaTextEvent(
      this.index,
      this.delta,
      new MetaTextDetails(this.details.length, this.details.data, text),
      this.playTime,
      this.trackIndex
    );
  }
}

export class MidiEvent {
  constructor(
    readonly index: string,
    readonly delta: number,
    readonly details: EventDetails,
    readonly playTime = 0,
    readonly trackIndex = -1
  ) {}

  setPlayTime(playTime: number): MidiEvent {
    return new MidiEvent(
      this.index,
      this.delta,
      this.details,
      playTime,
      this.trackIndex
    );
  }

  setDelta(delta: number) {
    return new MidiEvent(
      this.index,
      delta,
      this.details,
      this.playTime,
      this.trackIndex
    );
  }
}
