import {
  EVENT_MIDI_CHANNEL_AFTERTOUCH,
  EVENT_MIDI_CONTROLLER,
  EVENT_MIDI_NOTE_AFTERTOUCH,
  EVENT_MIDI_NOTE_OFF,
  EVENT_MIDI_NOTE_ON,
  EVENT_MIDI_PITCH_BEND,
  EVENT_MIDI_PROGRAM_CHANGE,
} from "./MidiEventConstants";

export interface ChannelSubeventVisitor<R> {
  onChannelNoteOff(cs: ChannelNoteOff): R;
  onChannelNoteOn(cs: ChannelNoteOn): R;
  onChannelNoteAftertouch(cs: ChannelNoteAftertouch): R;
  onChannelController(cs: ChannelController): R;
  onChannelProgramChange(cs: ChannelProgramChange): R;
  onChannelChannelAftertouch(cs: ChannelChannelAftertouch): R;
  onChannelPitchBend(cs: ChannelPitchBend): R;
  onChannelUnknown(cs: ChannelUnknown): R;
}

export interface ChannelSubevent {
  readonly type: number;
  readonly hasTwoParams: boolean;

  accept<R>(visitor: ChannelSubeventVisitor<R>): R;
}

export class ChannelNoteOff {
  readonly type = EVENT_MIDI_NOTE_OFF;
  readonly hasTwoParams = true;

  constructor(readonly noteNumber: number, readonly velocity: number) {}

  accept<R>(visitor: ChannelSubeventVisitor<R>): R {
    return visitor.onChannelNoteOff(this);
  }
}

export class ChannelNoteOn {
  readonly type = EVENT_MIDI_NOTE_ON;
  readonly hasTwoParams = true;

  constructor(readonly noteNumber: number, readonly velocity: number) {}

  accept<R>(visitor: ChannelSubeventVisitor<R>): R {
    return visitor.onChannelNoteOn(this);
  }
}

export class ChannelNoteAftertouch {
  readonly type = EVENT_MIDI_NOTE_AFTERTOUCH;
  readonly hasTwoParams = true;

  constructor(readonly noteNumber: number, readonly amount: number) {}

  accept<R>(visitor: ChannelSubeventVisitor<R>): R {
    return visitor.onChannelNoteAftertouch(this);
  }
}

export class ChannelController {
  readonly type = EVENT_MIDI_CONTROLLER;
  readonly hasTwoParams = true;

  constructor(readonly controllerNumber: number, readonly value: number) {}

  accept<R>(visitor: ChannelSubeventVisitor<R>): R {
    return visitor.onChannelController(this);
  }
}

export class ChannelProgramChange {
  readonly type = EVENT_MIDI_PROGRAM_CHANGE;
  readonly hasTwoParams = false;

  constructor(readonly programNumber: number) {}

  accept<R>(visitor: ChannelSubeventVisitor<R>): R {
    return visitor.onChannelProgramChange(this);
  }
}

export class ChannelChannelAftertouch {
  readonly type = EVENT_MIDI_CHANNEL_AFTERTOUCH;
  readonly hasTwoParams = false;

  constructor(readonly amount: number) {}

  accept<R>(visitor: ChannelSubeventVisitor<R>): R {
    return visitor.onChannelChannelAftertouch(this);
  }
}

export class ChannelPitchBend {
  readonly type = EVENT_MIDI_PITCH_BEND;
  readonly hasTwoParams = true;

  constructor(readonly lsb: number, readonly msb: number) {}

  accept<R>(visitor: ChannelSubeventVisitor<R>): R {
    return visitor.onChannelPitchBend(this);
  }
}

export class ChannelUnknown {
  readonly hasTwoParams = false;

  constructor(readonly type: number, readonly badparam: number) {}

  accept<R>(visitor: ChannelSubeventVisitor<R>): R {
    return visitor.onChannelUnknown(this);
  }
}
