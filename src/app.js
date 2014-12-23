/**
 * Main Secure My Files (SMF) class - creates a new SMF object
 * @constructor
 * @param {Function} success - The success callback
 * @param {Function} error - The error callback
 */
var SecureMyFiles = function (success, error, progress) {
  var rGen = new Utils.RandomGenerator(),
    sMan, encryptor;

  if (typeof success !== 'function' || typeof error !== 'function') {
    throw 'Success and Error callbacks are mandatory and must be functions!';
  }

  var doEncryptedUpload = function (block) {
    handleProgress(block.byteLength);
    block = encryptor.encrypt(block);
    sMan.store(block);
    if (!sMan.readNext(doEncryptedUpload)) {
      sMan.store(encryptor.getChecksum(), true);
      sMan.saveToDisk();
      success();
    }
  };

  var doEncryptedDownload = function (block) {
    handleProgress(block.byteLength);
    block = encryptor.decrypt(block);
    sMan.store(block);
    if (!sMan.readNext(doEncryptedDownload)) {
      if (encryptor.isChecksumValid()) {
        sMan.saveToDisk();
        success();
      } else {
        error('Password incorrect or corrupt input file.');
      }
    }
  };

  var handleProgress = function (processed) {
    if (typeof progress === 'function') {
      progress(processed, sMan.getLength());
    }
  };

  this.encryptFile = function (file, encKey) {
    var iv = rGen.generate();

    sMan = new StorageManager(file);
    encryptor = new Encryptor(Encryptors.AES, encKey, iv, 256);
    sMan.store(Utils.stringToByteArray(file.size.toString(), 16).concat(iv));
    sMan.readNext(doEncryptedUpload);
  };

  this.decryptFile = function (file, dKey) {
    sMan = new StorageManager(file);
    sMan.readNextLength(48, function (data) {
      encryptor = new Encryptor(Encryptors.AES, dKey, data.subarray(32), 256, data.subarray(0, 16));
      sMan.setLength(data.subarray(16, 32));
      sMan.readNext(doEncryptedDownload);
    });
  };
};