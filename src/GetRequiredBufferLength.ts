import {
  EventDetailsVisitor,
  EventDetails,
  ChannelEventDetails,
  MetaEventDetails,
  UnknownEventDetails,
} from "./EventDetails";
import { MidiEvent } from "./MidiEvent";

// Return the buffer length needed to encode the given events
export class GerRequiredBufferLength implements EventDetailsVisitor<number> {
  getEncodedDeltaLength(event: MidiEvent): number {
    const delta = event.delta;

    if (delta >>> 21 > 0) {
      return 4;
    }

    if (delta >>> 14 > 0) {
      return 3;
    }

    if (delta >>> 7 > 0) {
      return 2;
    }

    return 1;
  }

  getEncodedLengthLength(event: { length: number }): number {
    if (event.length >>> 21 > 0) {
      return 4;
    }

    if (event.length >>> 14 > 0) {
      return 3;
    }

    if (event.length >>> 7 > 0) {
      return 2;
    }

    return 1;
  }

  onMidiChannelEvent(e: ChannelEventDetails): number {
    let eventLength = 0;

    // Adding a byte for subtype + channel
    eventLength++;
    // Adding a byte for the first params
    eventLength++;
    // Adding a byte for the optionnal second param
    if (e.subevent.hasTwoParams) {
      eventLength++;
    }

    return eventLength;
  }

  onMidiSystemEvent(e: { length: number }): number {
    let eventLength = 0;

    // Adding a byte for the event type
    eventLength++;
    // Adding necessary bytes to encode the length
    eventLength += this.getEncodedLengthLength(e);
    // Adding bytes corresponding to the event length
    eventLength += e.length;

    return eventLength;
  }

  onMidiMetaEvent(e: MetaEventDetails): number {
    let eventLength = 0;

    // Adding a byte for the event type
    eventLength++;
    // Adding a byte for META events subtype
    eventLength++;
    // Adding necessary bytes to encode the length
    eventLength += this.getEncodedLengthLength(e);
    // Adding bytes corresponding to the event length
    eventLength += e.length;

    return eventLength;
  }

  onMidiUnknownEvent(e: UnknownEventDetails): number {
    return this.onMidiSystemEvent(e);
  }

  run(events: MidiEvent[]): number {
    let bufferLength = 0;

    // Calculating the track size by adding events lengths
    for (const event of events) {
      // Computing necessary bytes to encode the delta value
      bufferLength += this.getEncodedDeltaLength(event);
      // MIDI Events have various fixed lengths
      bufferLength += event.details.accept(this);
    }

    return bufferLength;
  }
}
