import { MetaTextDetails } from "./EventDetails";
import { MetaSubeventVisitor, MetaText } from "./MetaSubevent";
import { MidiMetaTextEvent, MidiMetaEvent } from "./MidiEvent";
import { EVENT_META_LYRICS, EVENT_META_TEXT } from "./MidiEventConstants";
import { PartialMetaSubeventVisitor } from "./PartialVisitors";
import { Utf8 } from "./Utf8";

export class GetLyrics implements Partial<MetaSubeventVisitor<void>> {
  private texts: MidiMetaTextEvent[] = [];
  private lyrics: MidiMetaTextEvent[] = [];
  private currentVisitee: MidiMetaEvent | null = null;

  constructor(readonly metaEvents: MidiMetaEvent[]) {}

  getCurrentVisitee(): MidiMetaEvent {
    if (this.currentVisitee === null) {
      throw new Error("currentVisitee is null");
    }

    return this.currentVisitee;
  }

  onMetaText(subevent: MetaText): void {
    const midiEvent = this.getCurrentVisitee();
    const midiMetaTextEvent = new MidiMetaTextEvent(
      midiEvent.index,
      midiEvent.delta,
      new MetaTextDetails(midiEvent.details.length, subevent.data),
      midiEvent.playTime,
      midiEvent.trackIndex
    );

    if (subevent.type === EVENT_META_LYRICS) {
      this.lyrics.push(midiMetaTextEvent);
    } else if (subevent.type === EVENT_META_TEXT) {
      // Ignore special texts
      if ("@" === String.fromCharCode(subevent.data[0]!)) {
        if ("T" === String.fromCharCode(subevent.data[1]!)) {
          // console.log('Title : ' + event.text.substring(2));
        } else if ("I" === String.fromCharCode(subevent.data[1]!)) {
          // console.log('Info : ' + event.text.substring(2));
        } else if ("L" === String.fromCharCode(subevent.data[1]!)) {
          // console.log('Lang : ' + event.text.substring(2));
        }
      } else if (String.fromCharCode(...subevent.data).indexOf("words") === 0) {
        // karaoke text follows, remove all previous text
        this.texts = [];
      } else if (midiEvent.playTime > 0) {
        // karaoke texts
        this.texts.push(midiMetaTextEvent);
      }
    }
  }

  getEvents(): MidiMetaTextEvent[] {
    for (const metaEvent of this.metaEvents) {
      this.currentVisitee = metaEvent;
      metaEvent.details.subevent.accept(new PartialMetaSubeventVisitor(this));
    }

    this.currentVisitee = null;

    // Choosing the right lyrics
    if (this.lyrics.length > 2) {
      return this.lyrics;
    } else {
      return this.texts;
    }
  }

  run(): MidiMetaTextEvent[] {
    const textEvents = this.getEvents();

    // Convert texts and detect encoding
    try {
      return textEvents.map((textEvent) =>
        textEvent.setText(
          Utf8.getStringFromBytes(
            textEvent.details.data,
            0,
            textEvent.details.length,
            true
          )
        )
      );
    } catch (e) {
      return textEvents.map((textEvent) =>
        textEvent.setText(
          textEvent.details.data
            .map(function (c) {
              return String.fromCharCode(c);
            })
            .join("")
        )
      );
    }
  }
}
