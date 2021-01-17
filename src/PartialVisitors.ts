import {
  ChannelChannelAftertouch,
  ChannelController,
  ChannelNoteAftertouch,
  ChannelNoteOff,
  ChannelNoteOn,
  ChannelPitchBend,
  ChannelProgramChange,
  ChannelSubeventVisitor,
  ChannelUnknown,
} from "./ChannelSubevent";
import {
  EventDetailsVisitor,
  ChannelEventDetails,
  SystemEventDetails,
  UnknownEventDetails,
  MetaEventDetails,
} from "./EventDetails";
import {
  MetaChannelPrefix,
  MetaEndOfTrack,
  MetaKeySignature,
  MetaSequenceNumber,
  MetaSequencerSpecific,
  MetaSetTempo,
  MetaSmtpeOffset,
  MetaSubeventVisitor,
  MetaText,
  MetaTimeSignature,
  MetaUnknown,
} from "./MetaSubevent";

export class PartialEventDetailsVisitor<T>
  implements EventDetailsVisitor<T | undefined> {
  constructor(private visitor: Partial<EventDetailsVisitor<T>>) {}

  onMidiChannelEvent(e: ChannelEventDetails): T | undefined {
    return this.visitor.onMidiChannelEvent?.(e);
  }

  onMidiSystemEvent(e: SystemEventDetails): T | undefined {
    return this.visitor.onMidiSystemEvent?.(e);
  }

  onMidiUnknownEvent(e: UnknownEventDetails): T | undefined {
    return this.visitor.onMidiUnknownEvent?.(e);
  }

  onMidiMetaEvent(e: MetaEventDetails): T | undefined {
    return this.visitor.onMidiMetaEvent?.(e);
  }
}

export class PartialMetaSubeventVisitor<T>
  implements MetaSubeventVisitor<T | undefined> {
  constructor(private visitor: Partial<MetaSubeventVisitor<T>>) {}

  onMetaEndOfTrack(e: MetaEndOfTrack): T | undefined {
    return this.visitor.onMetaEndOfTrack?.(e);
  }

  onMetaSequencerSpecific(e: MetaSequencerSpecific): T | undefined {
    return this.visitor.onMetaSequencerSpecific?.(e);
  }

  onMetaKeySignature(e: MetaKeySignature): T | undefined {
    return this.visitor.onMetaKeySignature?.(e);
  }

  onMetaSequenceNumber(e: MetaSequenceNumber): T | undefined {
    return this.visitor.onMetaSequenceNumber?.(e);
  }

  onMetaSmtpeOffset(e: MetaSmtpeOffset): T | undefined {
    return this.visitor.onMetaSmtpeOffset?.(e);
  }

  onMetaText(e: MetaText): T | undefined {
    return this.visitor.onMetaText?.(e);
  }

  onMetaTimeSignature(e: MetaTimeSignature): T | undefined {
    return this.visitor.onMetaTimeSignature?.(e);
  }

  onMetaUnknown(e: MetaUnknown): T | undefined {
    return this.visitor.onMetaUnknown?.(e);
  }

  onMetaSetTempo(e: MetaSetTempo): T | undefined {
    return this.visitor.onMetaSetTempo?.(e);
  }

  onMetaChannelPrefix(e: MetaChannelPrefix): T | undefined {
    return this.visitor.onMetaChannelPrefix?.(e);
  }
}

export class PartialChannelSubeventVisitor<T>
  implements ChannelSubeventVisitor<T | undefined> {
  constructor(private visitor: Partial<ChannelSubeventVisitor<T>>) {}

  onChannelNoteOn(e: ChannelNoteOn): T | undefined {
    return this.visitor.onChannelNoteOn?.(e);
  }

  onChannelNoteOff(e: ChannelNoteOff): T | undefined {
    return this.visitor.onChannelNoteOff?.(e);
  }

  onChannelNoteAftertouch(cs: ChannelNoteAftertouch): T | undefined {
    return this.visitor.onChannelNoteAftertouch?.(cs);
  }
  onChannelController(cs: ChannelController): T | undefined {
    return this.visitor.onChannelController?.(cs);
  }
  onChannelProgramChange(cs: ChannelProgramChange): T | undefined {
    return this.visitor.onChannelProgramChange?.(cs);
  }
  onChannelChannelAftertouch(cs: ChannelChannelAftertouch): T | undefined {
    return this.visitor.onChannelChannelAftertouch?.(cs);
  }
  onChannelPitchBend(cs: ChannelPitchBend): T | undefined {
    return this.visitor.onChannelPitchBend?.(cs);
  }
  onChannelUnknown(cs: ChannelUnknown): T | undefined {
    return this.visitor.onChannelUnknown?.(cs);
  }
}
