import { FilterMidiChannelEvent } from "./FilterMidiChannelEvent";
import { FilterMidiMetaEvent } from "./FilterMidiMetaEvent";
import { GetLyrics } from "./GetLyrics";
import { GetTickResolution } from "./GetTickResolution";
import { MidiChannelEvent, MidiEvent, MidiMetaEvent } from "./MidiEvent";
import { MidiFileHeader, HEADER_LENGTH } from "./MidiFileHeader";
import { MidiFileTrack } from "./MidiFileTrack";
import { MidiParser } from "./MidiParser";
import { PartialEventDetailsVisitor } from "./PartialVisitors";
import { SmallestDeltaTrackMidiEvent, TrackParser } from "./TrackParser";

export class MidiFile {
  readMidiEvents: MidiEvent[];

  constructor(
    readonly header: MidiFileHeader,
    readonly tracks: MidiFileTrack[]
  ) {
    this.readMidiEvents = this.readEvents();
  }

  static withoutBuffer() {
    // Creating the content
    const header = MidiFileHeader.withoutBuffer();
    const tracks = [MidiFileTrack.withoutBuffer()];

    return new MidiFile(header, tracks);
  }

  static fromBuffer(buffer: ArrayBuffer) {
    // Minimum MIDI file size is a headerChunk size (14bytes)
    // and an empty track (8+3bytes)
    if (25 > buffer.byteLength) {
      throw new Error(
        "A buffer of a valid MIDI file must have, at least, a" +
          " size of 25bytes."
      );
    }

    // Reading header
    const header = MidiFileHeader.fromBuffer(buffer);
    const tracks = [];

    let currentBufferIndex = HEADER_LENGTH;
    const tracksCount = header.getTracksCount();

    // Reading tracks
    for (let currentTrack = 0; currentTrack < tracksCount; currentTrack++) {
      // Testing the buffer length
      if (currentBufferIndex >= buffer.byteLength - 1) {
        throw new Error(
          "Couldn't find datas corresponding to the track #" +
            currentTrack +
            "."
        );
      }

      // Creating the track object
      const track = MidiFileTrack.fromBuffer(buffer, currentBufferIndex);
      tracks.push(track);

      // Updating index to the track end
      currentBufferIndex += track.getTrackLength() + 8;
    }

    // Testing integrity : currentBufferIndex should be at the end of the buffer
    if (currentBufferIndex !== buffer.byteLength) {
      throw new Error("It seems that the buffer contains too much datas.");
    }

    return new MidiFile(header, tracks);
  }

  getPlayTime(midiEvent: MidiEvent, tickResolution: number) {
    return (midiEvent.delta * tickResolution) / 1000;
  }

  getTickResolution(midiEvent: MidiEvent): number | undefined {
    const maybeTickResolution = new GetTickResolution(this.header).run(
      midiEvent
    );

    return maybeTickResolution;
  }

  readSequentially(): MidiEvent[] {
    const midiEvents = [];
    const format = this.header.getFormat();

    let playTime = 0;
    let tickResolution = this.header.getTickResolution();

    for (const track of this.tracks) {
      // reset playtime if format is 2
      playTime = format === 2 ? playTime : 0;
      const parser = new MidiParser(track.getTrackContent(), 0, false);
      // looping through events
      for (let event = parser.next(); event !== null; event = parser.next()) {
        playTime += this.getPlayTime(event, tickResolution);
        tickResolution = this.getTickResolution(event) ?? tickResolution;

        // push the events
        event = event.setPlayTime(playTime);
        midiEvents.push(event);
      }
    }

    return midiEvents;
  }

  findSmallestDeltaEvent(
    trackParsers: TrackParser[]
  ): SmallestDeltaTrackMidiEvent | null {
    let smallest = null;

    // finding the smallest event
    for (const trackParser of trackParsers) {
      if (trackParser.midiEvent === null) {
        continue;
      }

      if (
        smallest === null ||
        trackParser.midiEvent.delta < smallest.midiEvent.delta
      ) {
        smallest = new SmallestDeltaTrackMidiEvent(
          trackParser.trackIndex,
          trackParser.midiEvent
        );
      }
    }

    return smallest;
  }

  getNextTrackParsers(
    smallest: SmallestDeltaTrackMidiEvent,
    trackParsers: TrackParser[]
  ): TrackParser[] {
    return trackParsers.map((trackParser) => {
      // getting next event
      if (smallest.trackIndex === trackParser.trackIndex) {
        return trackParser.next();
      }

      if (trackParser.midiEvent === null) {
        return trackParser;
      }

      // decrementing the delta of previous events
      return trackParser.setMidiEvent(
        trackParser.midiEvent.setDelta(
          trackParser.midiEvent.delta - smallest.midiEvent.delta
        )
      );
    });
  }

  readConcurrently(): MidiEvent[] {
    const midiEvents = [];

    let playTime = 0;
    let tickResolution = this.header.getTickResolution();

    let trackParsers = this.tracks.map((track, index) => {
      const parser = new MidiParser(track.getTrackContent(), 0, false);

      return new TrackParser(index, parser.next(), parser);
    });
    let smallest = this.findSmallestDeltaEvent(trackParsers);

    // Filling events
    while (smallest !== null) {
      // filling values
      let event = smallest.midiEvent;
      playTime += this.getPlayTime(event, tickResolution);
      tickResolution = this.getTickResolution(event) ?? tickResolution;

      // push midi events
      event = new MidiEvent(
        event.index,
        event.delta,
        event.details,
        playTime,
        smallest.trackIndex
      );
      midiEvents.push(event);

      trackParsers = this.getNextTrackParsers(smallest, trackParsers);
      smallest = this.findSmallestDeltaEvent(trackParsers);
    }

    return midiEvents;
  }

  readEvents(): MidiEvent[] {
    const format = this.header.getFormat();

    // Reading events
    if (format !== 1 || this.tracks.length === 1) {
      return this.readSequentially();
    } else {
      return this.readConcurrently();
    }
  }

  getMidiEvents() {
    const filteredEvents: MidiChannelEvent[] = [];

    for (const midiEvent of this.readMidiEvents) {
      const visitor = new PartialEventDetailsVisitor(
        new FilterMidiChannelEvent(midiEvent)
      );
      const maybeMidiChannelEvent = midiEvent.details.accept(visitor);

      if (maybeMidiChannelEvent) {
        filteredEvents.push(maybeMidiChannelEvent);
      }
    }

    return filteredEvents;
  }

  getMetaEvents() {
    const filteredEvents: MidiMetaEvent[] = [];

    for (const midiEvent of this.readMidiEvents) {
      const visitor = new PartialEventDetailsVisitor(
        new FilterMidiMetaEvent(midiEvent)
      );
      const maybeMidiMetaEvent = midiEvent.details.accept(visitor);

      if (maybeMidiMetaEvent) {
        filteredEvents.push(maybeMidiMetaEvent);
      }
    }

    return filteredEvents;
  }

  getLyrics() {
    const midiEvents = this.getMetaEvents();

    return new GetLyrics(midiEvents).run();
  }
}
