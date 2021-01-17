import {
  ChannelChannelAftertouch,
  ChannelController,
  ChannelNoteAftertouch,
  ChannelNoteOff,
  ChannelNoteOn,
  ChannelPitchBend,
  ChannelProgramChange,
  ChannelSubevent,
  ChannelUnknown,
} from "./ChannelSubevent";
import {
  EVENT_DIVSYSEX,
  EVENT_META,
  EVENT_META_COPYRIGHT_NOTICE,
  EVENT_META_CUE_POINT,
  EVENT_META_END_OF_TRACK,
  EVENT_META_INSTRUMENT_NAME,
  EVENT_META_KEY_SIGNATURE,
  EVENT_META_LYRICS,
  EVENT_META_MARKER,
  EVENT_META_MIDI_CHANNEL_PREFIX,
  EVENT_META_SEQUENCER_SPECIFIC,
  EVENT_META_SEQUENCE_NUMBER,
  EVENT_META_SET_TEMPO,
  EVENT_META_SMTPE_OFFSET,
  EVENT_META_TEXT,
  EVENT_META_TIME_SIGNATURE,
  EVENT_META_TRACK_NAME,
  EVENT_MIDI_CHANNEL_AFTERTOUCH,
  EVENT_MIDI_CONTROLLER,
  EVENT_MIDI_NOTE_AFTERTOUCH,
  EVENT_MIDI_NOTE_OFF,
  EVENT_MIDI_NOTE_ON,
  EVENT_MIDI_PITCH_BEND,
  EVENT_MIDI_PROGRAM_CHANGE,
  EVENT_SYSEX,
} from "./MidiEventConstants";
import {
  MetaChannelPrefix,
  MetaEndOfTrack,
  MetaKeySignature,
  MetaSequenceNumber,
  MetaSequencerSpecific,
  MetaSetTempo,
  MetaSmtpeOffset,
  MetaSubevent,
  MetaText,
  MetaTimeSignature,
  MetaUnknown,
} from "./MetaSubevent";
import { MidiEvent } from "./MidiEvent";
import { Stream } from "./Stream";
import {
  EventDetails,
  MetaEventDetails,
  SystemEventDetails,
  UnknownEventDetails,
  ChannelEventDetails,
} from "./EventDetails";

function isValidEventCode(eventCode: number): boolean {
  return (eventCode & 0x80) === 0x80;
}

export class MidiParser {
  private stream: Stream;
  private lastEventCode: number | undefined;

  constructor(
    dataView: DataView,
    startAt: number,
    private strictMode: boolean
  ) {
    this.stream = new Stream(startAt, dataView);
  }

  readMetaSequenceNumber(midiEventLength: number): MetaSequenceNumber {
    if (this.strictMode && midiEventLength !== 2) {
      throw new Error(this.stream.pos() + " Bad metaevent length.");
    }

    return new MetaSequenceNumber(
      this.stream.readUint8(),
      this.stream.readUint8()
    );
  }

  readMetaChannelPrefix(midiEventLength: number): MetaChannelPrefix {
    if (this.strictMode && midiEventLength !== 1) {
      throw new Error(this.stream.pos() + " Bad metaevent length.");
    }

    return new MetaChannelPrefix(this.stream.readUint8());
  }

  readMetaEndOfTrack(midiEventLength: number): MetaEndOfTrack {
    if (this.strictMode && midiEventLength !== 0) {
      throw new Error(this.stream.pos() + " Bad metaevent length.");
    }

    return new MetaEndOfTrack();
  }

  readMetaSmtpeOffset(midiEventLength: number): MetaSmtpeOffset {
    if (this.strictMode && midiEventLength !== 5) {
      throw new Error(this.stream.pos() + " Bad metaevent length.");
    }

    const hour = this.stream.readUint8();
    if (this.strictMode && hour > 23) {
      throw new Error(
        this.stream.pos() +
          " SMTPE offset hour value must" +
          " be part of 0-23."
      );
    }

    const minutes = this.stream.readUint8();
    if (this.strictMode && minutes > 59) {
      throw new Error(
        this.stream.pos() +
          " SMTPE offset minutes value" +
          " must be part of 0-59."
      );
    }

    const seconds = this.stream.readUint8();
    if (this.strictMode && seconds > 59) {
      throw new Error(
        this.stream.pos() +
          " SMTPE offset seconds value" +
          " must be part of 0-59."
      );
    }

    const frames = this.stream.readUint8();
    if (this.strictMode && frames > 30) {
      throw new Error(
        this.stream.pos() +
          " SMTPE offset frames value must" +
          " be part of 0-30."
      );
    }

    const subframes = this.stream.readUint8();
    if (this.strictMode && subframes > 99) {
      throw new Error(
        this.stream.pos() +
          " SMTPE offset subframes value" +
          " must be part of 0-99."
      );
    }

    return new MetaSmtpeOffset(hour, minutes, seconds, frames, subframes);
  }

  readMetaSetTempo(midiEventLength: number): MetaSetTempo {
    if (this.strictMode && midiEventLength !== 3) {
      throw new Error(
        this.stream.pos() + " Tempo meta event length must be 3."
      );
    }

    const tempo =
      (this.stream.readUint8() << 16) +
      (this.stream.readUint8() << 8) +
      this.stream.readUint8();

    return new MetaSetTempo(tempo, 60000000 / tempo);
  }

  readMetaKeySignature(midiEventLength: number): MetaKeySignature {
    if (this.strictMode && 2 !== midiEventLength) {
      throw new Error(this.stream.pos() + " Bad metaevent length.");
    }

    const key = this.stream.readUint8();
    if (this.strictMode && (key < -7 || key > 7)) {
      throw new Error(this.stream.pos() + " Bad metaevent length.");
    }

    const scale = this.stream.readUint8();
    if (this.strictMode && scale !== 0 && scale !== 1) {
      throw new Error(
        this.stream.pos() + " Key signature scale value must" + " be 0 or 1."
      );
    }

    return new MetaKeySignature(key, scale);
  }

  readMetaTimeSignature(midiEventLength: number): MetaTimeSignature {
    if (this.strictMode && 4 !== midiEventLength) {
      throw new Error(this.stream.pos() + " Bad metaevent length.");
    }

    const data = this.stream.readBytes(midiEventLength);
    const param1 = data[0]!;
    const param2 = data[1]!;
    const param3 = data[2]!;
    const param4 = data[3]!;

    return new MetaTimeSignature(data, param1, param2, param3, param4);
  }

  readMetaUnknown(subtype: number, midiEventLength: number): MetaUnknown {
    if (this.strictMode) {
      throw new Error(
        `${this.stream.pos()} Unknown meta event type (${subtype.toString(
          16
        )}).`
      );
    }

    return new MetaUnknown(subtype, this.stream.readBytes(midiEventLength));
  }

  readChannelNoteOn(noteNumber: number): ChannelSubevent {
    const velocity = this.stream.readUint8();

    // If velocity is 0, it's a note off event in fact
    if (velocity === 0) {
      return new ChannelNoteOff(
        noteNumber,
        127 // Find a standard telling what to do here
      );
    }

    return new ChannelNoteOn(
      noteNumber,
      velocity // Find a standard telling what to do here
    );
  }

  readChannelUnknown(eventType: number, eventParam1: number): ChannelUnknown {
    if (this.strictMode) {
      throw new Error(
        this.stream.pos() +
          " Unknown MIDI event type " +
          "(" +
          eventType.toString(16) +
          ")."
      );
    }

    return new ChannelUnknown(eventType, eventParam1);
  }

  readMetaSubevent(subtype: number, midiEventLength: number): MetaSubevent {
    switch (subtype) {
      case EVENT_META_SEQUENCE_NUMBER: {
        return this.readMetaSequenceNumber(midiEventLength);
      }
      case EVENT_META_TEXT:
      case EVENT_META_COPYRIGHT_NOTICE:
      case EVENT_META_TRACK_NAME:
      case EVENT_META_INSTRUMENT_NAME:
      case EVENT_META_LYRICS:
      case EVENT_META_MARKER:
      case EVENT_META_CUE_POINT: {
        return new MetaText(subtype, this.stream.readBytes(midiEventLength));
      }
      case EVENT_META_MIDI_CHANNEL_PREFIX: {
        return this.readMetaChannelPrefix(midiEventLength);
      }
      case EVENT_META_END_OF_TRACK: {
        return this.readMetaEndOfTrack(midiEventLength);
      }
      case EVENT_META_SET_TEMPO: {
        return this.readMetaSetTempo(midiEventLength);
      }
      case EVENT_META_SMTPE_OFFSET: {
        return this.readMetaSmtpeOffset(midiEventLength);
      }
      case EVENT_META_KEY_SIGNATURE: {
        return this.readMetaKeySignature(midiEventLength);
      }
      case EVENT_META_TIME_SIGNATURE: {
        return this.readMetaTimeSignature(midiEventLength);
      }
      case EVENT_META_SEQUENCER_SPECIFIC: {
        return new MetaSequencerSpecific(
          this.stream.readBytes(midiEventLength)
        );
      }
      default: {
        return this.readMetaUnknown(subtype, midiEventLength);
      }
    }
  }

  readChannelSubevent(eventType: number, eventParam1: number): ChannelSubevent {
    switch (eventType) {
      case EVENT_MIDI_NOTE_OFF: {
        return new ChannelNoteOff(eventParam1, this.stream.readUint8());
      }
      case EVENT_MIDI_NOTE_ON: {
        return this.readChannelNoteOn(eventParam1);
      }
      case EVENT_MIDI_NOTE_AFTERTOUCH: {
        return new ChannelNoteAftertouch(eventParam1, this.stream.readUint8());
      }
      case EVENT_MIDI_CONTROLLER: {
        return new ChannelController(eventParam1, this.stream.readUint8());
      }
      case EVENT_MIDI_PROGRAM_CHANGE: {
        return new ChannelProgramChange(eventParam1);
      }
      case EVENT_MIDI_CHANNEL_AFTERTOUCH: {
        return new ChannelChannelAftertouch(eventParam1);
      }
      case EVENT_MIDI_PITCH_BEND: {
        return new ChannelPitchBend(eventParam1, this.stream.readUint8());
      }
      default: {
        return this.readChannelUnknown(eventType, eventParam1);
      }
    }
  }

  readEventDetails(delta: number): EventDetails {
    // Read the eventTypeByte
    const eventCode = this.stream.readUint8();

    if (eventCode === EVENT_META) {
      // Meta events
      const subtype = this.stream.readUint8();
      const length = this.stream.readVarInt();
      const subevent = this.readMetaSubevent(subtype, length);

      return new MetaEventDetails(length, subevent);
    } else if (eventCode === EVENT_SYSEX || eventCode === EVENT_DIVSYSEX) {
      // System events
      const length = this.stream.readVarInt();
      const data = this.stream.readBytes(length);

      return new SystemEventDetails(length, data);
    } else if ((eventCode & 0xf0) === 0xf0) {
      // Unknown event, assuming it's system like event
      if (this.strictMode) {
        throw new Error(
          this.stream.pos() +
            " Unknown event type " +
            eventCode.toString(16) +
            ", Delta: " +
            delta +
            "."
        );
      }

      const badsubtype = this.stream.readVarInt();
      const length = this.stream.readUint8();
      const data = this.stream.readBytes(length);

      return new UnknownEventDetails(eventCode, badsubtype, length, data);
    } else {
      let eventParam1: number;

      // Running status
      if (isValidEventCode(eventCode)) {
        this.lastEventCode = eventCode;
        eventParam1 = this.stream.readUint8();
      } else {
        if (this.lastEventCode === undefined) {
          throw new Error(
            this.stream.pos() + " Running status without previous event"
          );
        }
        eventParam1 = eventCode;
      }

      const eventType = this.lastEventCode >> 4;
      const eventChannel = this.lastEventCode & 0x0f;
      const subevent = this.readChannelSubevent(eventType, eventParam1);

      return new ChannelEventDetails(eventChannel, subevent);
    }
  }

  // Read the next event
  next(): MidiEvent | null {
    // Check available datas
    if (this.stream.end()) {
      return null;
    }

    // Memoize the event index
    const index = this.stream.pos();
    // Read the delta time
    const delta = this.stream.readVarInt();

    const eventDetails = this.readEventDetails(delta);

    return new MidiEvent(index, delta, eventDetails);
  }
}
