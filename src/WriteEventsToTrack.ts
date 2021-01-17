import {
  ChannelSubeventVisitor,
  ChannelNoteOn,
  ChannelNoteOff,
  ChannelNoteAftertouch,
  ChannelController,
  ChannelChannelAftertouch,
  ChannelPitchBend,
  ChannelProgramChange,
  ChannelUnknown,
} from "./ChannelSubevent";
import {
  EventDetailsVisitor,
  EventDetails,
  ChannelEventDetails,
  MetaEventDetails,
  SystemEventDetails,
  UnknownEventDetails,
} from "./EventDetails";
import { MidiEvent } from "./MidiEvent";
import { EVENT_META } from "./MidiEventConstants";
import { WriteMetaEventsToTrack } from "./WriteMetaEventsToTrack";

export class WriteEventsToTrack
  implements EventDetailsVisitor<void>, ChannelSubeventVisitor<void> {
  private destination: Uint8Array;
  private lastDestinationIndex = 0;
  private currentEventIndex = 0;

  constructor(bufferLength: number, readonly strictMode: boolean) {
    this.destination = new Uint8Array(bufferLength);
  }

  push(byte: number): void {
    this.destination[this.lastDestinationIndex] = byte;
    this.lastDestinationIndex++;
  }

  writeDeltaValue(midiEvent: MidiEvent): void {
    const delta = midiEvent.delta;

    if (delta >>> 28) {
      throw Error(
        "Event #" +
          this.currentEventIndex +
          ": Maximum delta time value reached (" +
          delta +
          "/134217728 max)"
      );
    }
    if (delta >>> 21) {
      this.push(((delta >>> 21) & 0x7f) | 0x80);
    }
    if (delta >>> 14) {
      this.push(((delta >>> 14) & 0x7f) | 0x80);
    }
    if (delta >>> 7) {
      this.push(((delta >>> 7) & 0x7f) | 0x80);
    }
    this.push(delta & 0x7f);
  }

  writeEventLength(midiEvent: { length: number }): void {
    if (midiEvent.length >>> 28) {
      throw Error(
        "Event #" +
          this.currentEventIndex +
          ": Maximum length reached (" +
          midiEvent.length +
          "/134217728 max)"
      );
    }
    if (midiEvent.length >>> 21) {
      this.push(((midiEvent.length >>> 21) & 0x7f) | 0x80);
    }
    if (midiEvent.length >>> 14) {
      this.push(((midiEvent.length >>> 14) & 0x7f) | 0x80);
    }
    if (midiEvent.length >>> 7) {
      this.push(((midiEvent.length >>> 7) & 0x7f) | 0x80);
    }
    this.push(midiEvent.length & 0x7f);
  }

  onChannelNoteOn(e: ChannelNoteOn): void {
    this.push(e.noteNumber);
    this.push(e.velocity);
  }

  onChannelNoteOff(e: ChannelNoteOff): void {
    this.push(e.noteNumber);
    this.push(e.velocity);
  }

  onChannelNoteAftertouch(e: ChannelNoteAftertouch): void {
    this.push(e.noteNumber);
    this.push(e.amount);
  }

  onChannelController(e: ChannelController): void {
    this.push(e.controllerNumber);
    this.push(e.value);
  }

  onChannelChannelAftertouch(e: ChannelChannelAftertouch): void {
    this.push(e.amount);
  }

  onChannelPitchBend(e: ChannelPitchBend): void {
    this.push(e.lsb);
    this.push(e.msb);
  }

  onChannelProgramChange(e: ChannelProgramChange): void {
    this.push(e.programNumber);
  }

  onChannelUnknown(e: ChannelUnknown): void {
    this.push(e.badparam);
  }

  onMidiChannelEvent(e: ChannelEventDetails): void {
    this.push((e.subevent.type << 4) + e.channel);
    e.subevent.accept(this);
  }

  onMidiMetaEvent(e: MetaEventDetails): void {
    this.push(EVENT_META);
    this.push(e.subevent.type);
    this.writeEventLength(e);
    e.subevent.accept(
      new WriteMetaEventsToTrack(
        this.currentEventIndex,
        e,
        this,
        this.strictMode
      )
    );
  }

  writeData(e: { length: number; data: number[] }): void {
    for (let dataIndex = 0; dataIndex < e.length; dataIndex++) {
      this.push(e.data[dataIndex]!);
    }
  }

  onMidiSystemEvent(e: SystemEventDetails) {
    this.writeData(e);
  }

  onMidiUnknownEvent(e: UnknownEventDetails) {
    this.writeData(e);
  }

  run(midiEvents: MidiEvent[]) {
    for (
      this.currentEventIndex = 0;
      this.currentEventIndex < midiEvents.length;
      this.currentEventIndex++
    ) {
      const midiEvent = midiEvents[this.currentEventIndex]!;

      this.writeDeltaValue(midiEvent);
      midiEvent.details.accept(this);
    }
  }
}
