/**
 * Manages file operations
 * @param {File} file - The disk file to be handled
 */
var StorageManager = function (file) {
  var index = 0,
    chunkSize = 16000,
    reader = new FileReader(),
    fileSize = file.size,
    writer = new Array(); //make Uint8Array

  /**
   * Reads the next specific number of bytes, calling the callback when done
   * @param {Number} size - The number of bytes to be read
   * @param {Function} callback - The callback to be called when done
   */
  var readChunk = function (size, callback) {
    if (index < fileSize) {
      var bSize = size;
      if (index + size > fileSize) {
        bSize = fileSize - index;
      }
      reader.onload = function (e) {
        if (reader.readyState === 2) {
          var block = new Uint8Array(reader.result);

          if (typeof callback === 'function') {
            callback(block);
          }
        }
      };
      reader.readAsArrayBuffer(file.slice(index, index + bSize));
      index += bSize;
    }
  };

  /**
   * Reads the next chunk of bytes, calling the callback when done
   * @param {Function} callback - The callback to be called when done
   */
  this.readNext = function (callback) {
    readChunk(chunkSize, callback);
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
    readChunk(size, callback);
  };

  this.EOF = function () {
    return (index >= fileSize);
  };

  this.getName = function () {
    return file.name;
  };

  this.getSize = function () {
    return fileSize;
  };

  this.setSize = function (size) {
    fileSize = size;
  };

  /**
   * Stores the provided data, calling the callback when done
   * @param {Uint8Array} data - The data to be stored
   * @param {Function} callback - The callback to be called when done
   */
  this.store = function (data, callback) {
    writer = writer.concat(data);

    if (typeof callback === 'function') {
      callback(block);
    }
  };

  /**
   * Saves the currently stored data to disk
   */
  this.saveToDisk = function () {
    var saveAs = saveAs || (typeof navigator !== "undefined" &&
      navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator));

    var blob = new Blob([Utils.toTypedArray(writer)], {
      type: 'application/octet-stream'
    });

    saveAs(blob);
  };
};