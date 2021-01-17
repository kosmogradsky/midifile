import { BeatNote } from "./BeatNote";
import {
  ChannelController,
  ChannelNoteOff,
  ChannelNoteOn,
  ChannelPitchBend,
  ChannelProgramChange,
  ChannelSubeventVisitor,
} from "./ChannelSubevent";
import { MidiChannelEvent } from "./MidiEvent";
import { PartialChannelSubeventVisitor } from "./PartialVisitors";
import {
  RedBlackEmpty,
  RedBlackTree,
  Updater,
} from "./RedBlackTree/RedBlackTree";
import { SongBeat } from "./SongBeat";
import { SongTrack } from "./SongTrack";

class PushBeatNote implements Updater<SongBeat> {
  constructor(readonly note: BeatNote) {}

  update(beat: SongBeat) {
    return beat.notes.cons(this.note);
  }
}

export class Song implements ChannelSubeventVisitor<void> {
  private duration = 0;
  private tracks: SongTrack[] = [];
  private beats: RedBlackTree<number, SongBeat> = new RedBlackEmpty();
  private currentVisitee: MidiChannelEvent | null = null;

  getCurrentVisitee(): MidiChannelEvent {
    if (this.currentVisitee === null) {
      throw new Error("currentVisitee is null");
    }

    return this.currentVisitee;
  }

  constructor(readonly channelEvents: MidiChannelEvent[]) {
    for (const channelEvent of channelEvents) {
      if (channelEvent.playTime / 1000 > this.duration) {
        this.duration = channelEvent.playTime / 1000;
      }

      this.currentVisitee = channelEvent;
      channelEvent.details.subevent.accept(
        new PartialChannelSubeventVisitor(this)
      );
    }

    // reverse beats notes
    // reverse tracks notes

    this.currentVisitee = null;
  }

  onChannelNoteOn(channelNoteOn: ChannelNoteOn) {
    const channelEvent = this.getCurrentVisitee();

    if (channelEvent.details.channel == 9) {
      if (channelNoteOn.noteNumber >= 35 && channelNoteOn.noteNumber <= 81) {
        this.startDrum(currentEvent, channelNoteOn);
      } else {
        console.log("wrong drum", channelNoteOn);
      }
    } else {
      if (channelNoteOn.noteNumber >= 0 && channelNoteOn.noteNumber <= 127) {
        this.startNote(channelNoteOn);
      } else {
        console.log("wrong tone", channelNoteOn);
      }
    }
  }

  onChannelNoteOff(channelNoteOff: ChannelNoteOff) {
    const channelEvent = this.getCurrentVisitee();

    if (channelEvent.details.channel != 9) {
      this.closeNote(channelNoteOff);
    }
  }

  onChannelProgramChange(channelProgramChange: ChannelProgramChange) {
    const channelEvent = this.getCurrentVisitee();

    if (channelEvent.details.channel != 9) {
      var track = this.takeTrack(channelEvent.details.channel);
      track.program = channelProgramChange.programNumber;
    } else {
      console.log("skip program for drums");
    }
  }

  onChannelController(channelController: ChannelController) {
    const channelEvent = this.getCurrentVisitee();

    if (channelController.controllerNumber == 7) {
      if (channelEvent.details.channel != 9) {
        var track = this.takeTrack(channelEvent.details.channel);
        track.volume = channelController.value / 127 || 0.000001;
        //console.log('volume', track.volume,'for',events[i].channel);
      }
    }
  }

  onChannelPitchBend(channelPitchBend: ChannelPitchBend) {
    const channelEvent = this.getCurrentVisitee();

    this.addSlide(channelEvent);
  }

  onChannelUnknown() {
    const channelEvent = this.getCurrentVisitee();

    console.log("unknown", channelEvent.details.channel, channelEvent);
  }

  onChannelChannelAftertouch() {
    this.onChannelUnknown();
  }

  onChannelNoteAftertouch() {
    this.onChannelUnknown();
  }

  startDrum(midiEvent: MidiChannelEvent, channelNoteOn: ChannelNoteOn) {
    var beat = this.takeBeat(channelNoteOn.noteNumber);
    beat.notes.push({
      when: midiEvent.playTime / 1000,
    });
  }
}
