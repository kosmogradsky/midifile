const HDR_LENGTH = 8;

function getTrackLength(datas: DataView) {
  return datas.getUint32(4);
}

// MIDIFileTrack : Read and edit a MIDI track chunk in a given ArrayBuffer
export class MidiFileTrack {
  private constructor(private datas: DataView) {}

  static withoutBuffer(): MidiFileTrack {
    const uint8Array = new Uint8Array(12);

    // Adding the empty track header (MTrk)
    uint8Array[0] = 0x4d;
    uint8Array[1] = 0x54;
    uint8Array[2] = 0x72;
    uint8Array[3] = 0x6b;

    // Adding the empty track size (4)
    uint8Array[4] = 0x00;
    uint8Array[5] = 0x00;
    uint8Array[6] = 0x00;
    uint8Array[7] = 0x04;

    // Adding the track end event
    uint8Array[8] = 0x00;
    uint8Array[9] = 0xff;
    uint8Array[10] = 0x2f;
    uint8Array[11] = 0x00;

    return new MidiFileTrack(
      new DataView(uint8Array.buffer, 0, HDR_LENGTH + 4)
    );
  }

  static fromBuffer(buffer: ArrayBuffer, start: number): MidiFileTrack {
    // Buffer length must size at least like an  empty track (8+3bytes)
    if (12 > buffer.byteLength - start) {
      throw new Error(
        "Invalid MIDIFileTrack (0x" +
          start.toString(16) +
          ") :" +
          " Buffer length must size at least 12bytes"
      );
    }

    // Creating a temporary view to read the track header
    const tmpDatas = new DataView(buffer, start, HDR_LENGTH);

    // Reading MIDI track header chunk
    if (
      !(
        "M" === String.fromCharCode(tmpDatas.getUint8(0)) &&
        "T" === String.fromCharCode(tmpDatas.getUint8(1)) &&
        "r" === String.fromCharCode(tmpDatas.getUint8(2)) &&
        "k" === String.fromCharCode(tmpDatas.getUint8(3))
      )
    ) {
      throw new Error(
        "Invalid MIDIFileTrack (0x" +
          start.toString(16) +
          ") :" +
          " MTrk prefix not found"
      );
    }

    // Reading the track length
    const trackLength = getTrackLength(tmpDatas);

    if (buffer.byteLength - start < trackLength) {
      throw new Error(
        "Invalid MIDIFileTrack (0x" +
          start.toString(16) +
          ") :" +
          " The track size exceed the buffer length."
      );
    }

    // Creating the final DataView
    const datas = new DataView(buffer, start, HDR_LENGTH + trackLength);

    // Trying to find the end of track event
    if (
      !(
        0xff === datas.getUint8(HDR_LENGTH + (trackLength - 3)) &&
        0x2f === datas.getUint8(HDR_LENGTH + (trackLength - 2)) &&
        0x00 === datas.getUint8(HDR_LENGTH + (trackLength - 1))
      )
    ) {
      throw new Error(
        "Invalid MIDIFileTrack (0x" +
          start.toString(16) +
          ") :" +
          " No track end event found at the expected index" +
          " (" +
          (HDR_LENGTH + (trackLength - 1)).toString(16) +
          ")."
      );
    }

    return new MidiFileTrack(datas);
  }

  getTrackLength() {
    return getTrackLength(this.datas);
  }

  setTrackLength(trackLength: number) {
    return this.datas.setUint32(4, trackLength);
  }

  getTrackContent() {
    return new DataView(
      this.datas.buffer,
      this.datas.byteOffset + HDR_LENGTH,
      this.datas.byteLength - HDR_LENGTH
    );
  }

  setTrackContent(dataView: DataView) {
    // Calculating the track length
    const trackLength = dataView.byteLength - dataView.byteOffset;

    // Track length must size at least like an  empty track (4bytes)
    if (4 > trackLength) {
      throw new Error("Invalid track length, must size at least 4bytes");
    }
    this.datas = new DataView(new Uint8Array(HDR_LENGTH + trackLength).buffer);

    // Adding the track header (MTrk)
    this.datas.setUint8(0, 0x4d); // M
    this.datas.setUint8(1, 0x54); // T
    this.datas.setUint8(2, 0x72); // r
    this.datas.setUint8(3, 0x6b); // k

    // Adding the track size
    this.datas.setUint32(4, trackLength);

    // Copying the content
    const origin = new Uint8Array(
      dataView.buffer,
      dataView.byteOffset,
      dataView.byteLength
    );

    const destination = new Uint8Array(
      this.datas.buffer,
      HDR_LENGTH,
      trackLength
    );

    for (let i = 0; i < origin.length; i++) {
      destination[i] = origin[i]!;
    }
  }
}
