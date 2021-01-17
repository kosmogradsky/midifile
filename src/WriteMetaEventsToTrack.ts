import {
  MetaSubeventVisitor,
  MetaSequenceNumber,
  MetaText,
  MetaTimeSignature,
  MetaSequencerSpecific,
  MetaUnknown,
  MetaChannelPrefix,
  MetaSetTempo,
  MetaSmtpeOffset,
  MetaKeySignature,
} from "./MetaSubevent";
import { MetaEventDetails } from "./EventDetails";

interface WritableByteMedium {
  push(byte: number): void;
}

export class WriteMetaEventsToTrack implements MetaSubeventVisitor<void> {
  constructor(
    readonly metaEventIndex: number,
    readonly metaEvent: MetaEventDetails,
    readonly byteMedium: WritableByteMedium,
    readonly strictMode: boolean
  ) {}

  writeData(e: { data: number[] }): void {
    for (let dataIndex = 0; dataIndex < this.metaEvent.length; dataIndex++) {
      this.byteMedium.push(e.data[dataIndex]!);
    }
  }

  onMetaSequenceNumber(e: MetaSequenceNumber): void {
    this.byteMedium.push(e.lsb);
    this.byteMedium.push(e.msb);
  }

  onMetaText(e: MetaText): void {
    this.writeData(e);
  }

  onMetaTimeSignature(e: MetaTimeSignature): void {
    this.writeData(e);
  }

  onMetaSequencerSpecific(e: MetaSequencerSpecific): void {
    this.writeData(e);
  }

  onMetaUnknown(e: MetaUnknown): void {
    this.writeData(e);
  }

  onMetaChannelPrefix(e: MetaChannelPrefix): void {
    this.byteMedium.push(e.prefix);
  }

  onMetaEndOfTrack() {
    // do nothing
  }

  onMetaSetTempo(e: MetaSetTempo): void {
    this.byteMedium.push(e.tempo >> 16);
    this.byteMedium.push((e.tempo >> 8) & 0xff);
    this.byteMedium.push(e.tempo & 0xff);
  }

  onMetaSmtpeOffset(e: MetaSmtpeOffset): void {
    if (this.strictMode && e.hour > 23) {
      throw new Error(
        "Event #" +
          this.metaEventIndex +
          ": SMTPE offset hour value must be" +
          " part of 0-23."
      );
    }
    this.byteMedium.push(e.hour);
    if (this.strictMode && e.minutes > 59) {
      throw new Error(
        "Event #" +
          this.metaEventIndex +
          ": SMTPE offset minutes value must" +
          " be part of 0-59."
      );
    }
    this.byteMedium.push(e.minutes);
    if (this.strictMode && e.seconds > 59) {
      throw new Error(
        "Event #" +
          this.metaEventIndex +
          ": SMTPE offset seconds value must" +
          " be part of 0-59."
      );
    }
    this.byteMedium.push(e.seconds);
    if (this.strictMode && e.frames > 30) {
      throw new Error(
        "Event #" +
          this.metaEventIndex +
          ": SMTPE offset frames amount must" +
          " be part of 0-30."
      );
    }
    this.byteMedium.push(e.frames);
    if (this.strictMode && e.subframes > 99) {
      throw new Error(
        "Event #" +
          this.metaEventIndex +
          ": SMTPE offset subframes amount" +
          " must be part of 0-99."
      );
    }
    this.byteMedium.push(e.subframes);
  }

  onMetaKeySignature(e: MetaKeySignature): void {
    if (e.key < -7 || e.key > 7) {
      throw new Error(
        "Event #" +
          this.metaEventIndex +
          ":The key signature key must be" +
          " between -7 and 7"
      );
    }
    if (e.scale < 0 || e.scale > 1) {
      throw new Error(
        "Event #" +
          this.metaEventIndex +
          ":" +
          "The key signature scale must be 0 or 1"
      );
    }
    this.byteMedium.push(e.key);
    this.byteMedium.push(e.scale);
  }
}
