import {
  EVENT_META_END_OF_TRACK,
  EVENT_META_KEY_SIGNATURE,
  EVENT_META_MIDI_CHANNEL_PREFIX,
  EVENT_META_SEQUENCER_SPECIFIC,
  EVENT_META_SEQUENCE_NUMBER,
  EVENT_META_SET_TEMPO,
  EVENT_META_SMTPE_OFFSET,
  EVENT_META_TIME_SIGNATURE,
} from "./MidiEventConstants";

export interface MetaSubeventVisitor<R> {
  onMetaEndOfTrack(mm: MetaEndOfTrack): R;
  onMetaSequenceNumber(mm: MetaSequenceNumber): R;
  onMetaText(mm: MetaText): R;
  onMetaChannelPrefix(mm: MetaChannelPrefix): R;
  onMetaSetTempo(mm: MetaSetTempo): R;
  onMetaSmtpeOffset(mm: MetaSmtpeOffset): R;
  onMetaKeySignature(mm: MetaKeySignature): R;
  onMetaTimeSignature(mm: MetaTimeSignature): R;
  onMetaSequencerSpecific(mm: MetaSequencerSpecific): R;
  onMetaUnknown(mm: MetaUnknown): R;
}

export interface MetaSubevent {
  readonly type: number;

  accept<R>(visitor: MetaSubeventVisitor<R>): R;
}

export class MetaEndOfTrack {
  readonly type = EVENT_META_END_OF_TRACK;

  accept<R>(visitor: MetaSubeventVisitor<R>): R {
    return visitor.onMetaEndOfTrack(this);
  }
}

export class MetaSequenceNumber {
  readonly type = EVENT_META_SEQUENCE_NUMBER;

  constructor(readonly msb: number, readonly lsb: number) {}

  accept<R>(visitor: MetaSubeventVisitor<R>): R {
    return visitor.onMetaSequenceNumber(this);
  }
}

export class MetaText {
  constructor(readonly type: number, readonly data: number[]) {}

  accept<R>(visitor: MetaSubeventVisitor<R>): R {
    return visitor.onMetaText(this);
  }
}

export class MetaChannelPrefix {
  readonly type = EVENT_META_MIDI_CHANNEL_PREFIX;

  constructor(readonly prefix: number) {}

  accept<R>(visitor: MetaSubeventVisitor<R>): R {
    return visitor.onMetaChannelPrefix(this);
  }
}

export class MetaSetTempo {
  readonly type = EVENT_META_SET_TEMPO;

  constructor(readonly tempo: number, readonly tempoBPM: number) {}

  accept<R>(visitor: MetaSubeventVisitor<R>): R {
    return visitor.onMetaSetTempo(this);
  }
}

export class MetaSmtpeOffset {
  readonly type = EVENT_META_SMTPE_OFFSET;

  constructor(
    readonly hour: number,
    readonly minutes: number,
    readonly seconds: number,
    readonly frames: number,
    readonly subframes: number
  ) {}

  accept<R>(visitor: MetaSubeventVisitor<R>): R {
    return visitor.onMetaSmtpeOffset(this);
  }
}

export class MetaKeySignature {
  readonly type = EVENT_META_KEY_SIGNATURE;

  constructor(readonly key: number, readonly scale: number) {}

  accept<R>(visitor: MetaSubeventVisitor<R>): R {
    return visitor.onMetaKeySignature(this);
  }
}

export class MetaTimeSignature {
  readonly type = EVENT_META_TIME_SIGNATURE;

  constructor(
    readonly data: number[],
    readonly param1: number,
    readonly param2: number,
    readonly param3: number,
    readonly param4: number
  ) {}

  accept<R>(visitor: MetaSubeventVisitor<R>): R {
    return visitor.onMetaTimeSignature(this);
  }
}

export class MetaSequencerSpecific {
  readonly type = EVENT_META_SEQUENCER_SPECIFIC;

  constructor(readonly data: number[]) {}

  accept<R>(visitor: MetaSubeventVisitor<R>): R {
    return visitor.onMetaSequencerSpecific(this);
  }
}

export class MetaUnknown {
  constructor(readonly type: number, readonly data: number[]) {}

  accept<R>(visitor: MetaSubeventVisitor<R>): R {
    return visitor.onMetaUnknown(this);
  }
}
