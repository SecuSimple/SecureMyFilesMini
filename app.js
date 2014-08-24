/**
 * Main Secure My Files (SMF) class - creates a new SMF object
 * @constructor
 */
var smf = function () {
  var rGen = new Utils.RandomGenerator(),
    sMan, encryptor;


  var applyHeader = function (size, iv) {
    var fileSize = Utils.stringToByteArray(size, 16);
    sMan.store(fileSize.concat(iv));
  };


  var doEncryptedUpload = function (block) {
    block = Utils.toArray(block);
    block = encryptor.encrypt(block);
    sMan.store(block);
    readFileUpload();
  };

  var readFileUpload = function () {
    if (!sMan.EOF()) {
      sMan.readNext(doEncryptedUpload);
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
};