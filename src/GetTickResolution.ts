import { EventDetailsVisitor, MetaEventDetails } from "./EventDetails";
import { MetaSubeventVisitor, MetaSetTempo } from "./MetaSubevent";
import { MidiEvent } from "./MidiEvent";
import { MidiFileHeader } from "./MidiFileHeader";
import {
  PartialMetaSubeventVisitor,
  PartialEventDetailsVisitor,
} from "./PartialVisitors";

export class GetTickResolution
  implements
    Partial<EventDetailsVisitor<number | undefined>>,
    Partial<MetaSubeventVisitor<number>> {
  constructor(private header: MidiFileHeader) {}

  onMetaSetTempo(e: MetaSetTempo): number {
    return this.header.getTickResolution(e.tempo);
  }

  onMidiMetaEvent(e: MetaEventDetails): number | undefined {
    return e.subevent.accept(new PartialMetaSubeventVisitor(this));
  }

  run(midiEvent: MidiEvent): number | undefined {
    return midiEvent.details.accept(new PartialEventDetailsVisitor(this));
  }
}
