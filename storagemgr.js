/**
 * Manages file operations
 * @param {File} file - The disk file to be handled
 */
var StorageManager = function (file) {
  var index = 0,
    chunkSize = 16000,
    reader = new FileReader(),
    fileSize = file.size,
    writer = [];

  /**
   * Reads the next specific number of bytes, calling the callback when done
   * @param {Number} size - The number of bytes to be read
   * @param {Function} callback - The callback to be called when done
   */
  var readChunk = function (size, callback) {
    if (index >= fileSize) {
      return false;
    }
    var bSize = size;
    if (index + size > fileSize) {
      bSize = fileSize - index;
    }
    reader.onload = function (e) {
      if (reader.readyState === 2) {
        var block = new Uint8Array(reader.result);
        if (typeof callback === 'function') {
          setTimeout(function () {
            callback(block);
          }, 5);
        }
      }
    };
    reader.readAsArrayBuffer(file.slice(index, index + bSize));
    index += bSize;
    return true;
  };

  /**
   * Reads the next chunk of bytes, calling the callback when done
   * @param {Function} callback - The callback to be called when done
   */
  this.readNext = function (callback) {
    return readChunk(chunkSize, callback);
  };

  /**
   * Reads the next specific number of bytes, calling the callback when done
   * @param {Number} size - The number of bytes to be read
   * @param {Function} callback - The callback to be called when done
   */
  this.readNextLength = function (size, callback) {
    if (!size) {
      throw 'Argument exception: Size zero or not specified.';
    }
    return readChunk(size, callback);
  };

  this.getName = function () {
    return file.name;
  };

  /**
   * Stores the provided data, calling the callback when done
   * @param {Uint8Array} data - The data to be stored
   * @param {Boolean} prepend - The data will be prepended
   * @param {Function} callback - The callback to be called when done
   */
  this.store = function (data, prepend, callback) {
    writer = prepend ? data.concat(writer) : writer.concat(data);

    if (typeof callback === 'function') {
      callback();
    }
  };

  /**
   * Saves the currently stored data to disk
   */
  this.saveToDisk = function (length) {
    var saveAs = saveAs || (typeof navigator !== "undefined" &&
      navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator));

    var blob = new Blob([Utils.toTypedArray(writer, length)], {
      type: 'application/octet-stream'
    });

    saveAs(blob);
  };
};