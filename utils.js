var Utils = {};

//cached crcTable
var crcTable;

var createTable = function () {
  var c;
  var crcTable = [];
  for (var n = 0; n < 256; n++) {
    c = n;
    for (var k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[n] = c;
  }
  return crcTable;
};

Utils.crc32 = function (byteArray) {
  var crcTable = crcTable || (crcTable = createTable());
  var crc = 0 ^ (-1);

  for (var i = 0; i < byteArray.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byteArray[i]) & 0xFF];
  }

  return (crc ^ (-1)) >>> 0;
};

/**
 * Applies XOR on two arrays having a fixed length of 16 bytes.
 * @param {Array[Byte]} arr1 - The first array
 * @param {Array[Byte]} arr2 - The second array
 * @return {Array[Byte]} The result array
 */
Utils.xor = function (arr1, arr2) {
  var result = [];
  for (var i = 0; i < 16; i++) {
    result[i] = arr1[i] ^ arr2[i];
  }
  return result;
};

/**
 * Transforms a typed array into a regular array
 * @param {TypedArray} typedArray - the array to be copied
 */
Utils.toArray = function (typedArray) {
  var result = new Array(typedArray.byteLength);
  for (var i = typedArray.byteLength - 1; i >= 0; i--) {
    result[i] = typedArray[i];
  }
  return result;
};

/**
 * Transforms a regular array into a typed array
 * @param {Array} array - the array to be copied
 */
Utils.toTypedArray = function (array) {
  var result = new Uint8Array(array.length);
  for (var i = array.length - 1; i >= 0; i--) {
    result[i] = array[i];
  }
  return result;
};

Utils.stringToByteArray = function (string, len) {
  if (string.length > len) {
    throw 'String is too large';
  }

  var lengthArray = new Array(len);
  for (var i = string.length - 1, j = len - 1; i >= 0; i--, j--) {
    lengthArray[j] = string.charCodeAt(i);
  }

  while (j >= 0) {
    lengthArray[j--] = 0;
  }
  return lengthArray;
};

Utils.byteArrayToString = function (byteArray) {
  var string = '';
  for (var i = 0; i < byteArray.length; i++) {
    if (byteArray[i] === 0) {
      continue;
    }

    string += String.fromCharCode(byteArray[i]);
  }
  return string;
};

Utils.setArray = function (destination, source, offset) {
  for (var i = source.length - 1; i >= 0; i--) {
    destination[offset + i] = source[i];
  }
};

/**
 * Initializes the random number generator
 */
Utils.RandomGenerator = function () {
  var attached = false,
    entropy = [];

  /**
   * Initializes the generator
   */
  var checkEvents = function () {
    if (typeof document === 'undefined') {
      return;
    }

    if (!attached && entropy.length <= 102400) {
      document.addEventListener('mousemove', collectEntropy);
      attached = true;
    } else if (attached && entropy.length > 102400) {
      document.removeEventListener('mousemove', collectEntropy);
      attached = false;
    }
  };

  /**
   * Collects entropy from user
   */
  var collectEntropy = function (e) {
    entropy.push(e.screenX);
    entropy.push(e.screenY);
    checkEvents();
  };

  /**
   * Generate new random 128-bit key, based on entropy
   */
  this.generate = function () {
    var ent, dat, num, result = [];
    for (var i = 0; i < 16; i++) {
      ent = entropy.length > 1 ? entropy.splice(i, 2) : [Math.random() * 10, Math.random() * 10];
      dat = new Date();
      num = (ent.length === 2) ? ((ent[0] * Math.random() + ent[1] * Math.random()) / 10) : (Math.random() * 10 + Math.random() * 100 + Math.random() * 1000) / 100;

      result[i] = parseInt(num * dat.getMilliseconds() / 10);
      while (result[i] > 255) {
        result[i] -= 255;
      }
    }

    checkEvents();
    return result;
  };

  checkEvents();
};