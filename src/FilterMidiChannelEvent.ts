import { ChannelEventDetails, EventDetailsVisitor } from "./EventDetails";
import { MidiChannelEvent, MidiEvent } from "./MidiEvent";

export class FilterMidiChannelEvent
  implements Partial<EventDetailsVisitor<MidiChannelEvent>> {
  constructor(readonly midiEvent: MidiEvent) {}

  onMidiChannelEvent(eventDetails: ChannelEventDetails): MidiChannelEvent {
    return new MidiChannelEvent(
      this.midiEvent.index,
      this.midiEvent.delta,
      eventDetails,
      this.midiEvent.playTime,
      this.midiEvent.trackIndex
    );
  }
}
