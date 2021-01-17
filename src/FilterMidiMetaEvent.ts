import { MetaEventDetails, EventDetailsVisitor } from "./EventDetails";
import { MidiMetaEvent, MidiEvent } from "./MidiEvent";

export class FilterMidiMetaEvent
  implements Partial<EventDetailsVisitor<MidiMetaEvent>> {
  constructor(readonly midiEvent: MidiEvent) {}

  onMidiMetaEvent(eventDetails: MetaEventDetails): MidiMetaEvent {
    return new MidiMetaEvent(
      this.midiEvent.index,
      this.midiEvent.delta,
      eventDetails,
      this.midiEvent.playTime,
      this.midiEvent.trackIndex
    );
  }
}
