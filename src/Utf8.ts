export const Utf8 = {
  // UTF8 decoding functions
  getCharLength(theByte: number): number {
    // 4 bytes encoded char (mask 11110000)
    if (0b11110000 === (theByte & 0b11110000)) {
      return 4;
      // 3 bytes encoded char (mask 11100000)
    } else if (0b11100000 === (theByte & 0b11100000)) {
      return 3;
      // 2 bytes encoded char (mask 11000000)
    } else if (0b11000000 === (theByte & 0b11000000)) {
      return 2;
      // 1 bytes encoded char
    } else if (0b1000000 === (theByte & 0b1000000)) {
      return 1;
    }
    return 0;
  },
  getCharCode(
    bytes: number[],
    byteOffset = 0,
    maybeCharLength: number | undefined
  ): number {
    let charCode = 0;

    // validate that the array has at least one byte in it
    if (bytes.length - byteOffset <= 0) {
      throw new Error("No more characters remaining in array.");
    }

    // Retrieve charLength if not given
    let charLength = maybeCharLength ?? this.getCharLength(bytes[byteOffset]!);

    if (charLength === 0) {
      throw new Error(
        `${bytes[byteOffset]!.toString(
          2
        )} is not a significative byte (offset: ${byteOffset}).`
      );
    }

    // Return byte value if charlength is 1
    if (charLength === 1) {
      return bytes[byteOffset]!;
    }

    // validate that the array has enough bytes to make up this character
    if (bytes.length - byteOffset < charLength) {
      throw new Error(
        `Expected at least ${charLength} bytes remaining in array.`
      );
    }

    // Test UTF8 integrity
    const utf8IntegrityMask = 0b10000000 >> charLength;
    if (bytes[byteOffset]! & utf8IntegrityMask) {
      throw Error(
        `Index ${byteOffset}: A ${charLength} bytes encoded char cannot encode the ${
          charLength + 1
        }th rank bit to 1.`
      );
    }

    // Reading the first byte
    const firstByteMask = 0b0111111 >> charLength;
    charCode += (bytes[byteOffset]! & firstByteMask) << (--charLength * 6);

    // Reading next bytes
    while (charLength) {
      if (
        0x80 !== (bytes[byteOffset + 1]! & 0x80) ||
        0x40 === (bytes[byteOffset + 1]! & 0x40)
      ) {
        throw Error(
          "Index " +
            (byteOffset + 1) +
            ": Next bytes of encoded char" +
            ' must begin with a "10" bit sequence.'
        );
      }
      charCode += (bytes[++byteOffset]! & 0x3f) << (--charLength * 6);
    }

    return charCode;
  },
  getStringFromBytes(
    bytes: number[],
    byteOffset = 0,
    byteLength = bytes.length,
    strict: boolean
  ): string {
    const chars = [];

    let currentOffset = byteOffset;

    while (currentOffset < byteLength) {
      const charLength = this.getCharLength(bytes[currentOffset]!);
      if (currentOffset + charLength > byteLength) {
        if (strict) {
          throw Error(
            `Index ${currentOffset}: Found a ${charLength} bytes encoded char declaration but only ${
              byteLength - currentOffset
            } bytes are available.`
          );
        }
      } else {
        chars.push(
          String.fromCodePoint(
            this.getCharCode(bytes, currentOffset, charLength)
          )
        );
      }
      currentOffset += charLength;
    }

    return chars.join("");
  },
};
