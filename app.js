/**
 * Main Secure My Files (SMF) class - creates a new SMF object
 * @constructor
 */
var smf = function () {
  var rGen = new Utils.RandomGenerator(),
    sMan, encryptor, decKey;


  var applyHeader = function (size, iv) {
    var fileSize = Utils.stringToByteArray(size, 16);
    sMan.store(fileSize.concat(iv));
  };

  var getHeader = function (data) {
    data = Utils.toArray(data);
    var len = data.slice(0, 16),
      iv = data.slice(16);

    encryptor = new Encryptor(Encryptors.AES, decKey, iv, 256);
    sMan.setSize(parseInt(Utils.byteArrayToString(len), 10));
    readFileDownload();
  };

  var doEncryptedUpload = function (block) {
    block = Utils.toArray(block);
    block = encryptor.encrypt(block);
    sMan.store(block);
    readFileUpload();
  };

  var doEncryptedDownload = function (block) {
    block = Utils.toArray(block);
    block = encryptor.decrypt(block);
    sMan.store(block);
    readFileDownload();
  };

  var readFileUpload = function () {
    if (!sMan.EOF()) {
      sMan.readNext(doEncryptedUpload);
    } else {
      sMan.saveToDisk();
    }
  };

  var readFileDownload = function () {
    if (!sMan.EOF()) {
      sMan.readNext(doEncryptedDownload);
    } else {
      sMan.saveToDisk();
    }
  };

  this.encryptFile = function (file, encKey) {
    var iv = rGen.generate();

    sMan = new StorageManager(file);
    encryptor = new Encryptor(Encryptors.AES, encKey, iv, 256);

    applyHeader(file.size.toString(), iv);
    readFileUpload();
  };

  this.decryptFile = function (file, dKey) {
    decKey = dKey;
    sMan = new StorageManager(file);
    sMan.readNextLength(32, getHeader);
  };
};