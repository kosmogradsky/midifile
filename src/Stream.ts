export class Stream {
  private position: number;

  constructor(startAt: number, private buffer: DataView) {
    this.position = startAt;
  }

  getPosition() {
    return this.position;
  }

  readUint8() {
    const uint8 = this.buffer.getUint8(this.position);
    this.position += 1;

    return uint8;
  }

  readVarInt() {
    let varInt = 0;

    for (let i = 0; i < 4; i++) {
      const uint8 = this.readUint8();

      if (uint8 & 0b10000000) {
        varInt += uint8 & 0b01111111;
        varInt <<= 7;
      } else {
        return varInt + uint8;
      }
    }

    throw new Error(
      `0x ${this.position.toString(
        16
      )}: Variable integer length cannot exceed 4 bytes`
    );
  }

  readBytes(length: number) {
    const bytes = [];

    for (let i = length; i > 0; i--) {
      bytes.push(this.readUint8());
    }

    return bytes;
  }

  pos() {
    return "0x" + (this.buffer.byteOffset + this.position).toString(16);
  }

  end() {
    return this.position === this.buffer.byteLength;
  }
}
