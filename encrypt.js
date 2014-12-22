/**
 * Initializes a new encryptor
 * @constructor
 * @param {Function} Encryptor - The encryption function
 * @param {String} encKey - The encryption key
 * @param {Array[Byte]} iv - The initialization vector
 * @param {Number} keyLength - The encryption key desired length
 * @param [Optional] {Array[Byte]} readChecksum - The checksum read from file
 */
var Encryptor = function (Encryptor, encKey, iv, keyLength, readChecksum) {
  var prevEncBlock = iv,
    prevDecBlock = iv,
    checksum = 0,
    encryptor = new Encryptor(keyLength),
    key = new Array(encryptor.keyLength / 8);

  encryptor.init();
  key = Utils.stringToByteArray(encKey, 32);
  encryptor.expandKey(key);

  /**
   * Encrypts the given byte array
   * @param {Uint8Array} byteArray - The typed byte array that needs to be encrypted
   */
  this.encrypt = function (byteArray) {
    var startIndex = 0,
      endIndex,
      idx,
      eidx,
      encBlock,
      resultArray = [];

    while (startIndex < byteArray.byteLength) {
      endIndex = startIndex + 16;
      if (endIndex > byteArray.byteLength) {
        endIndex = byteArray.byteLength;
      }
      encBlock = [];
      for (eidx = 0, idx = startIndex; idx < endIndex; eidx++, idx++) {
        encBlock[eidx] = byteArray[idx];
      }
      while (eidx < 16) {
        encBlock[eidx++] = 0;
      }
      checksum = checksum ^ Utils.cksum(encBlock);
      Utils.xor(encBlock, prevEncBlock);

      encryptor.encrypt(encBlock, key);

      prevEncBlock = encBlock.slice(0);

      for (eidx = 0, idx = resultArray.length; eidx < 16; eidx++, idx++) {
        resultArray[idx] = encBlock[eidx];
      }

      startIndex += 16;
    }
    return resultArray;
  };

  /**
   * Decrypts the given byte array
   * @param {Uint8Array} byteArray - The typed byte array that needs to be decrypted
   */
  this.decrypt = function (byteArray) {
    var startIndex = 0,
      endIndex,
      decBlock,
      blockBefore,
      resultArray = [];

    while (startIndex < byteArray.byteLength) {
      endIndex = startIndex + 16;
      if (endIndex > byteArray.byteLength) {
        endIndex = byteArray.byteLength;
      }

      decBlock = [];
      for (eidx = 0, idx = startIndex; idx < endIndex; eidx++, idx++) {
        decBlock[eidx] = byteArray[idx];
      }

      blockBefore = decBlock.slice(0);
      encryptor.decrypt(decBlock, key);
      Utils.xor(decBlock, prevDecBlock);
      checksum = checksum ^ Utils.cksum(decBlock);

      prevDecBlock = blockBefore;

      for (eidx = 0, idx = resultArray.length; eidx < 16; eidx++, idx++) {
        resultArray[idx] = decBlock[eidx];
      }

      startIndex += 16;
    }
    return resultArray;
  };

  /**
   * Returns the checksum
   * @returns {Array[Byte]} - the checksum as a padded byte array
   */
  this.getChecksum = function () {
    return Utils.stringToByteArray(checksum.toString(), 16);
  };

  /**
   * Validates the checksum
   * @returns {Boolean} - true if valid, false if not
   */
  this.isChecksumValid = function () {
    return Utils.byteArrayToString(readChecksum) === checksum.toString();
  };
};

/**
 * Initializes an AES encryptor
 * @constructor
 * @param {Number} keyLength - The length of the key
 */
var AES = function (keyLength) {
  var sBox, shiftRowTab, sBoxInv, shiftRowTabInv, xTime;

  /**
   * Combines the state with a round of the key
   */
  var addRoundKey = function (state, rkey) {
    for (var i = 0; i < 16; i++)
      state[i] ^= rkey[i];
  };

  /**
   * Replaces bytes in the state with bytes from the lookup table
   */
  var subBytes = function (state, sbox) {
    for (var i = 0; i < 16; i++)
      state[i] = sbox[state[i]];
  };

  /**
   * Shifts the rows of the state
   */
  var shiftRows = function (state, shifttab) {
    var h = state.slice(0);
    for (var i = 0; i < 16; i++)
      state[i] = h[shifttab[i]];
  };

  /**
   * Mixes state columns (using a fixed polinomial function)
   */
  var mixColumns = function (state) {
    for (var i = 0; i < 16; i += 4) {
      var s0 = state[i + 0],
        s1 = state[i + 1];
      var s2 = state[i + 2],
        s3 = state[i + 3];
      var h = s0 ^ s1 ^ s2 ^ s3;
      state[i + 0] ^= h ^ xTime[s0 ^ s1];
      state[i + 1] ^= h ^ xTime[s1 ^ s2];
      state[i + 2] ^= h ^ xTime[s2 ^ s3];
      state[i + 3] ^= h ^ xTime[s3 ^ s0];
    }
  };

  /**
   * Inverted mix columns
   */
  var mixColumnsInv = function (state) {
    for (var i = 0; i < 16; i += 4) {
      var s0 = state[i + 0],
        s1 = state[i + 1];
      var s2 = state[i + 2],
        s3 = state[i + 3];
      var h = s0 ^ s1 ^ s2 ^ s3;
      var xh = xTime[h];
      var h1 = xTime[xTime[xh ^ s0 ^ s2]] ^ h;
      var h2 = xTime[xTime[xh ^ s1 ^ s3]] ^ h;
      state[i + 0] ^= h1 ^ xTime[s0 ^ s1];
      state[i + 1] ^= h2 ^ xTime[s1 ^ s2];
      state[i + 2] ^= h1 ^ xTime[s2 ^ s3];
      state[i + 3] ^= h2 ^ xTime[s3 ^ s0];
    }
  };

  this.algorithm = 'AES';
  this.keyLength = keyLength ? keyLength : 256;

  /**
   * Initializes the runtime and lookup tables.
   */
  this.init = function () {
    sBox = new Array(99, 124, 119, 123, 242, 107, 111, 197, 48, 1, 103, 43, 254, 215, 171,
      118, 202, 130, 201, 125, 250, 89, 71, 240, 173, 212, 162, 175, 156, 164, 114, 192, 183, 253,
      147, 38, 54, 63, 247, 204, 52, 165, 229, 241, 113, 216, 49, 21, 4, 199, 35, 195, 24, 150, 5, 154,
      7, 18, 128, 226, 235, 39, 178, 117, 9, 131, 44, 26, 27, 110, 90, 160, 82, 59, 214, 179, 41, 227,
      47, 132, 83, 209, 0, 237, 32, 252, 177, 91, 106, 203, 190, 57, 74, 76, 88, 207, 208, 239, 170,
      251, 67, 77, 51, 133, 69, 249, 2, 127, 80, 60, 159, 168, 81, 163, 64, 143, 146, 157, 56, 245,
      188, 182, 218, 33, 16, 255, 243, 210, 205, 12, 19, 236, 95, 151, 68, 23, 196, 167, 126, 61,
      100, 93, 25, 115, 96, 129, 79, 220, 34, 42, 144, 136, 70, 238, 184, 20, 222, 94, 11, 219, 224,
      50, 58, 10, 73, 6, 36, 92, 194, 211, 172, 98, 145, 149, 228, 121, 231, 200, 55, 109, 141, 213,
      78, 169, 108, 86, 244, 234, 101, 122, 174, 8, 186, 120, 37, 46, 28, 166, 180, 198, 232, 221,
      116, 31, 75, 189, 139, 138, 112, 62, 181, 102, 72, 3, 246, 14, 97, 53, 87, 185, 134, 193, 29,
      158, 225, 248, 152, 17, 105, 217, 142, 148, 155, 30, 135, 233, 206, 85, 40, 223, 140, 161,
      137, 13, 191, 230, 66, 104, 65, 153, 45, 15, 176, 84, 187, 22);

    shiftRowTab = new Array(0, 5, 10, 15, 4, 9, 14, 3, 8, 13, 2, 7, 12, 1, 6, 11);

    sBoxInv = new Array(256);
    for (var i = 0; i < 256; i++)
      sBoxInv[sBox[i]] = i;

    shiftRowTabInv = new Array(16);
    for (var j = 0; j < 16; j++)
      shiftRowTabInv[shiftRowTab[j]] = j;

    xTime = new Array(256);
    for (var k = 0; k < 128; k++) {
      xTime[k] = k << 1;
      xTime[128 + k] = (k << 1) ^ 0x1b;
    }
  };

  /**
   * Expands the cipher key according to its length
   */
  this.expandKey = function (key) {
    var kl = key.length,
      ks, Rcon = 1;
    switch (kl) {
    case 16:
      ks = 16 * (10 + 1);
      break;
    case 24:
      ks = 16 * (12 + 1);
      break;
    case 32:
      ks = 16 * (14 + 1);
      break;
    default:
      throw "Key error: Only key lengths of 16, 24 or 32 bytes allowed!";
    }
    for (var i = kl; i < ks; i += 4) {
      var temp = key.slice(i - 4, i);
      if (i % kl === 0) {
        temp = new Array(sBox[temp[1]] ^ Rcon, sBox[temp[2]],
          sBox[temp[3]], sBox[temp[0]]);
        if ((Rcon <<= 1) >= 256)
          Rcon ^= 0x11b;
      } else if ((kl > 24) && (i % kl == 16))
        temp = new Array(sBox[temp[0]], sBox[temp[1]],
          sBox[temp[2]], sBox[temp[3]]);
      for (var j = 0; j < 4; j++)
        key[i + j] = key[i + j - kl] ^ temp[j];
    }
  };

  /** 
   * Encrypt a 16-byte array block using the given key
   */
  this.encrypt = function (block, key) {
    var l = key.length;
    addRoundKey(block, key.slice(0, 16));
    for (var i = 16; i < l - 16; i += 16) {
      subBytes(block, sBox);
      shiftRows(block, shiftRowTab);
      mixColumns(block);
      addRoundKey(block, key.slice(i, i + 16));
    }
    subBytes(block, sBox);
    shiftRows(block, shiftRowTab);
    addRoundKey(block, key.slice(i, l));
  };

  /** 
   * Decrypts a 16-byte array block using the given key
   */
  this.decrypt = function (block, key) {
    var l = key.length;
    addRoundKey(block, key.slice(l - 16, l));
    shiftRows(block, shiftRowTabInv);
    subBytes(block, sBoxInv);
    for (var i = l - 32; i >= 16; i -= 16) {
      addRoundKey(block, key.slice(i, i + 16));
      mixColumnsInv(block);
      shiftRows(block, shiftRowTabInv);
      subBytes(block, sBoxInv);
    }
    addRoundKey(block, key.slice(0, 16));
  };
};

var Encryptors = {
  AES: AES
};