// Event types
export const EVENT_META = 0xff;
export const EVENT_SYSEX = 0xf0;
export const EVENT_DIVSYSEX = 0xf7;
export const EVENT_MIDI = 0x8;
// Meta event types
export const EVENT_META_SEQUENCE_NUMBER = 0x00;
export const EVENT_META_TEXT = 0x01;
export const EVENT_META_COPYRIGHT_NOTICE = 0x02;
export const EVENT_META_TRACK_NAME = 0x03;
export const EVENT_META_INSTRUMENT_NAME = 0x04;
export const EVENT_META_LYRICS = 0x05;
export const EVENT_META_MARKER = 0x06;
export const EVENT_META_CUE_POINT = 0x07;
export const EVENT_META_MIDI_CHANNEL_PREFIX = 0x20;
export const EVENT_META_END_OF_TRACK = 0x2f;
export const EVENT_META_SET_TEMPO = 0x51;
export const EVENT_META_SMTPE_OFFSET = 0x54;
export const EVENT_META_TIME_SIGNATURE = 0x58;
export const EVENT_META_KEY_SIGNATURE = 0x59;
export const EVENT_META_SEQUENCER_SPECIFIC = 0x7f;
// MIDI event types
export const EVENT_MIDI_NOTE_OFF = 0x8;
export const EVENT_MIDI_NOTE_ON = 0x9;
export const EVENT_MIDI_NOTE_AFTERTOUCH = 0xa;
export const EVENT_MIDI_CONTROLLER = 0xb;
export const EVENT_MIDI_PROGRAM_CHANGE = 0xc;
export const EVENT_MIDI_CHANNEL_AFTERTOUCH = 0xd;
export const EVENT_MIDI_PITCH_BEND = 0xe;
// MIDI event sizes
export const MIDI_1PARAM_EVENTS = [
  EVENT_MIDI_PROGRAM_CHANGE,
  EVENT_MIDI_CHANNEL_AFTERTOUCH,
];
