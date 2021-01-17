import { ChannelSubevent } from "./ChannelSubevent";
import { MetaSubevent, MetaText } from "./MetaSubevent";
import { EVENT_META, EVENT_SYSEX, EVENT_MIDI } from "./MidiEventConstants";

export interface EventDetails {
  readonly type: number;

  accept<R>(visitor: EventDetailsVisitor<R>): R;
}

export interface EventDetailsVisitor<R> {
  onMidiMetaEvent(e: MetaEventDetails): R;
  onMidiSystemEvent(e: SystemEventDetails): R;
  onMidiUnknownEvent(e: UnknownEventDetails): R;
  onMidiChannelEvent(e: ChannelEventDetails): R;
}

export class MetaTextDetails {
  readonly type = EVENT_META;

  constructor(
    readonly length: number,
    readonly data: number[],
    readonly text = ""
  ) {}
}

export class MetaEventDetails {
  readonly type = EVENT_META;

  constructor(readonly length: number, readonly subevent: MetaSubevent) {}

  accept<R>(visitor: EventDetailsVisitor<R>): R {
    return visitor.onMidiMetaEvent(this);
  }
}

export class SystemEventDetails {
  readonly type = EVENT_SYSEX;

  constructor(readonly length: number, readonly data: number[]) {}

  accept<R>(visitor: EventDetailsVisitor<R>): R {
    return visitor.onMidiSystemEvent(this);
  }
}

export class UnknownEventDetails {
  constructor(
    readonly type: number,
    readonly badsubtype: number,
    readonly length: number,
    readonly data: number[]
  ) {}

  accept<R>(visitor: EventDetailsVisitor<R>): R {
    return visitor.onMidiUnknownEvent(this);
  }
}

export class ChannelEventDetails {
  readonly type = EVENT_MIDI;

  constructor(readonly channel: number, readonly subevent: ChannelSubevent) {}

  accept<R>(visitor: EventDetailsVisitor<R>): R {
    return visitor.onMidiChannelEvent(this);
  }
}
