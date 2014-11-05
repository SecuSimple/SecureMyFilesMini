var Utils = {};

/**
 * Computes simple checksum of a byte array
 * @param {Array[Byte]} byteArray - The byte array
 * @return {Number} The checksum
 */
Utils.cksum = function (byteArray) {
  var res = 0,
    len = byteArray.length;
  for (var i = 0; i < len; i++) {
    res = res * 31 + byteArray[i];
  }
  return res;
};

/**
 * Applies XOR on two arrays having a fixed length of 16 bytes.
 * @param {Array[Byte]} arr1 - The first array
 * @param {Array[Byte]} arr2 - The second array
 * @return {Array[Byte]} The result array
 */
Utils.xor = function (arr1, arr2) {
  for (var i = 0; i < 16; i++) {
    arr1[i] = arr1[i] ^ arr2[i];
  }
};

/**
 * Transforms a regular array into a typed array
 * @param {Array} array - the array to be copied
 */
Utils.toTypedArray = function (array, length) {
  var mLen = length ? Math.min(array.length, length) : array.length;
  var result = new Uint8Array(mLen);
  for (var i = mLen - 1; i >= 0; i--) {
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
  for (var i = 0; i < byteArray.byteLength; i++) {
    if (byteArray[i] === 0) {
      continue;
    }

    string += String.fromCharCode(byteArray[i]);
  }
  return string;
};

Utils.extendArray = function (array, length) {
  if (array.length >= length) {
    return array;
  }
  var result = new Array(length);
  for (var i = 0; i < length; i++) {
    result[i] = array[i] || 0;
  }
  return result;
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