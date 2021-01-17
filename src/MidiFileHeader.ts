export const HEADER_LENGTH = 14;
const FRAMES_PER_SECONDS = 1;
const TICKS_PER_BEAT = 2;

// MIDIFileHeader : Read and edit a MIDI header chunk in a given ArrayBuffer
export class MidiFileHeader {
  private constructor(private datas: DataView) {}

  static withoutBuffer(): MidiFileHeader {
    const uint8Array = new Uint8Array(HEADER_LENGTH);

    // Adding the header id (MThd)
    uint8Array[0] = 0x4d;
    uint8Array[1] = 0x54;
    uint8Array[2] = 0x68;
    uint8Array[3] = 0x64;
    // Adding the header chunk size
    uint8Array[4] = 0x00;
    uint8Array[5] = 0x00;
    uint8Array[6] = 0x00;
    uint8Array[7] = 0x06;
    // Adding the file format (1 here cause it's the most commonly used)
    uint8Array[8] = 0x00;
    uint8Array[9] = 0x01;
    // Adding the track count (1 cause it's a new file)
    uint8Array[10] = 0x00;
    uint8Array[11] = 0x01;
    // Adding the time division (192 ticks per beat)
    uint8Array[12] = 0x00;
    uint8Array[13] = 0xc0;

    return new MidiFileHeader(
      new DataView(uint8Array.buffer, 0, HEADER_LENGTH)
    );
  }

  static fromBuffer(buffer: ArrayBuffer): MidiFileHeader {
    const datas = new DataView(buffer, 0, HEADER_LENGTH);

    // Reading MIDI header chunk
    if (
      !(
        String.fromCharCode(datas.getUint8(0)) === "M" &&
        String.fromCharCode(datas.getUint8(1)) === "T" &&
        String.fromCharCode(datas.getUint8(2)) === "h" &&
        String.fromCharCode(datas.getUint8(3)) === "d"
      )
    ) {
      throw new Error("Invalid MIDIFileHeader : MThd prefix not found");
    }

    // Reading chunk length
    if (datas.getUint32(4) !== 6) {
      throw new Error("Invalid MIDIFileHeader : Chunk length must be 6");
    }

    return new MidiFileHeader(datas);
  }

  getFormat() {
    const format = this.datas.getUint16(8);
    if (0 !== format && 1 !== format && 2 !== format) {
      throw new Error(
        "Invalid MIDI file : MIDI format (" +
          format +
          ")," +
          " format can be 0, 1 or 2 only."
      );
    }
    return format;
  }

  setFormat(format: number) {
    if (0 !== format && 1 !== format && 2 !== format) {
      throw new Error(
        "Invalid MIDI format given (" +
          format +
          ")," +
          " format can be 0, 1 or 2 only."
      );
    }
    this.datas.setUint16(8, format);
  }

  getTracksCount() {
    return this.datas.getUint16(10);
  }

  setTracksCount(count: number) {
    return this.datas.setUint16(10, count);
  }

  getTickResolution(maybeTempo?: number) {
    // Frames per seconds
    if (this.datas.getUint16(12) & 0x8000) {
      return 1000000 / (this.getSMPTEFrames() * this.getTicksPerFrame());
    }

    // Ticks per beat
    // Default MIDI tempo is 120bpm, 500ms per beat
    const tempo = maybeTempo ?? 500000;

    return tempo / this.getTicksPerBeat();
  }

  getTimeDivision() {
    if (this.datas.getUint16(12) & 0x8000) {
      return FRAMES_PER_SECONDS;
    }

    return TICKS_PER_BEAT;
  }

  getTicksPerBeat() {
    const divisionWord = this.datas.getUint16(12);
    if (divisionWord & 0x8000) {
      throw new Error("Time division is not expressed as ticks per beat.");
    }
    return divisionWord;
  }

  setTicksPerBeat(ticksPerBeat: number) {
    this.datas.setUint16(12, ticksPerBeat & 0x7fff);
  }

  getSMPTEFrames() {
    const divisionWord = this.datas.getUint16(12);

    if ((divisionWord & 0x8000) === 0) {
      throw new Error("Time division is not expressed as frames per seconds.");
    }

    const smpteFrames = divisionWord & 0x7f00;

    if ([24, 25, 29, 30].includes(smpteFrames) === false) {
      throw new Error("Invalid SMPTE frames value (" + smpteFrames + ").");
    }

    return smpteFrames === 29 ? 29.97 : smpteFrames;
  }

  getTicksPerFrame() {
    const divisionWord = this.datas.getUint16(12);

    if ((divisionWord & 0x8000) === 0) {
      throw new Error("Time division is not expressed as frames per seconds.");
    }

    return divisionWord & 0x00ff;
  }

  setSMTPEDivision(smpteFrames: number, ticksPerFrame: number) {
    if (29.97 === smpteFrames) {
      smpteFrames = 29;
    }
    if (-1 === [24, 25, 29, 30].indexOf(smpteFrames)) {
      throw new Error(
        "Invalid SMPTE frames value given (" + smpteFrames + ")."
      );
    }
    if (0 > ticksPerFrame || 0xff < ticksPerFrame) {
      throw new Error(
        "Invalid ticks per frame value given (" + smpteFrames + ")."
      );
    }
    this.datas.setUint8(12, 0x80 | smpteFrames);
    this.datas.setUint8(13, ticksPerFrame);
  }
}
