// Stolen from tiny-trie.js, but specialized for prefix queries
// https://github.com/jnu/tiny-trie/blob/master/src/PackedTrie.ts

const BASE64_INT_TO_CHAR = `\
ABCDEFGHIJKLMNOPQRSTUVWXYZ\
abcdefghijklmnopqrstuvwxyz\
0123456789\
+/\
`.split("");

const BASE64_CHAR_TO_INT = BASE64_INT_TO_CHAR.reduce((agg, char, i) => {
  agg[char] = i;
  return agg;
}, {});

function readBits(binary, start, len) {
  const startChar = ~~(start / 6);
  const startBitOffset = start % 6;
  const endBit = startBitOffset + len;
  const charLen = Math.ceil(endBit / 6);
  const mask = (0x1 << len) - 1;
  let chunk = 0;

  for (let i = 0; i < charLen; i++) {
    chunk <<= 6;
    chunk |= BASE64_CHAR_TO_INT[binary[startChar + i]];
  }

  let rightPadding = endBit % 6;
  if (rightPadding) {
    chunk >>= 6 - rightPadding;
  }

  return chunk & mask;
}

const TERMINAL = "\0";
const TERMINUS = Object.create(null);
const VERSION = 0;
const HEADER_WIDTH_FIELD = 10;
const VERSION_FIELD = 10;
const OFFSET_SIGN_FIELD = 1;
const OFFSET_VAL_FIELD = 21;
const CHAR_WIDTH_FIELD = 8;
const POINTER_WIDTH_FIELD = 8;

class PackedPrefixTinyTrie {
  constructor(binary) {
    let ptr = 0;

    // Split binary into header and content by checking first field
    const headerCharCount = readBits(binary, ptr, HEADER_WIDTH_FIELD);
    ptr += HEADER_WIDTH_FIELD;
    const header = binary.substr(0, headerCharCount);

    const version = readBits(binary, ptr, VERSION_FIELD);
    ptr += VERSION_FIELD;

    if (version !== VERSION) {
      throw new Error(
        `Version mismatch! Binary: ${version}, Reader: ${VERSION}`
      );
    }

    // Main trie data
    this.data = binary.substr(headerCharCount);

    // compute pointer offset
    const offsetSign = readBits(header, ptr, OFFSET_SIGN_FIELD);
    ptr += OFFSET_SIGN_FIELD;
    let offset = readBits(header, ptr, OFFSET_VAL_FIELD);
    ptr += OFFSET_VAL_FIELD;

    if (offsetSign) {
      offset = -offset;
    }

    // Pointer offset
    this.offset = offset;

    // interpret the field width within each word
    let charWidth = readBits(header, ptr, CHAR_WIDTH_FIELD);
    ptr += CHAR_WIDTH_FIELD;

    let pointerWidth = readBits(header, ptr, POINTER_WIDTH_FIELD);
    ptr += POINTER_WIDTH_FIELD;

    // Interpret the rest of the header as the charTable
    let headerFieldChars = Math.ceil(ptr / 6);
    let charTable = header.substr(headerFieldChars);

    this.table = charTable.split("").reduce(
      (agg, char, i) => {
        agg[char] = i + 1;
        return agg;
      },
      { [TERMINAL]: 0 }
    );

    // Construct inverse table
    this.inverseTable = [TERMINAL].concat(charTable.split(""));

    // Number of bits in a word
    this.wordWidth = charWidth + pointerWidth + 1;

    // Mask for reading the pointer value from a word
    this.lastMask = 0x1;

    // Offset of pointer field in word
    this.pointerShift = 1;

    // Mask for reading pointer
    this.pointerMask = (0x1 << pointerWidth) - 1;

    // Mask for reading characters
    this.charMask = (0x1 << charWidth) - 1;

    // Offset of charTable
    this.charShift = 1 + pointerWidth;

    // console.log("offset", this.offset);
    // console.log("table", this.table);
    // console.log("inverseTable", this.inverseTable);
    // console.log("wordWidth", this.wordWidth);
    // console.log("lastMask", this.lastMask);
    // console.log("pointerShift", this.pointerShift);
    // console.log("pointerMask", this.pointerMask);
    // console.log("charShift", this.charShift);
    // console.log("charMask", this.charMask);
  }

  search(str) {
    const {
      data,
      offset,
      table,
      inverseTable,
      wordWidth,
      lastMask,
      pointerShift,
      pointerMask,
      charShift,
      charMask,
    } = this;

    // Search queue.
    let node = { pointer: 0, memo: "" };
    const lastDepth = str.length;

    // Loop over input string. Go one iteration longer to check for terminal character after string is found in trie
    for (let i = 0; i <= str.length; i++) {
      const isLast = i >= lastDepth;
      const token = isLast ? TERMINAL : str[i];

      // Loop over node's children
      let wordPointer = node.pointer;
      let last = false;
      while (!last) {
        // Optimization: Exit immediately if the char was not found in
        // the table (meaning there can't be any children in the trie
        // with this character). Exception is wildcards.
        if (!table.hasOwnProperty(token)) {
          break;
        }

        const bits = wordPointer * wordWidth;
        const chunk = readBits(data, bits, wordWidth);

        // Read the character index
        const charIdx = (chunk >> charShift) & charMask;

        // If this character is matched, jump to the pointer given in
        // this node.
        if (charIdx === table[token]) {
          const pointer = (chunk >> pointerShift) & pointerMask;
          // Find the next char with an inverse map, since we might
          // be using a wildcard search.
          const newChar = inverseTable[charIdx];
          // Stopping condition: searching last block and we hit a terminal
          if (isLast && newChar === TERMINAL) {
            return { inDict: true, prefix: true };
          }

          // Push next node for search, if it's non-terminal.
          if (newChar !== TERMINAL) {
            node.pointer = wordPointer + offset + pointer;
            node.memo = node.memo + newChar;
            break;
          }
        }

        // If this wasn't a match, check if this was the last key in
        // the block.
        last = chunk & lastMask;

        // Otherwise increment the pointer to the next sibling key
        wordPointer += 1;
      }
      // If we didn't find the right character in any of the children, the word isn't real
      if (last) {
        if (isLast) {
          return { inDict: false, prefix: true };
        }
        return { inDict: false, prefix: false };
      }
    }

    return { inDict: false, prefix: false };
  }
}

export { PackedPrefixTinyTrie };
