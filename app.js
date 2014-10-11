/**
 * Main Secure My Files (SMF) class - creates a new SMF object
 * @constructor
 */
var smf = function () {
  var rGen = new Utils.RandomGenerator(),
    sMan, encryptor, decKey, actualLen, checksum;


  var applyHeader = function (size, iv) {
    var fileSize = Utils.stringToByteArray(size, 16);
    sMan.store(fileSize.concat(iv));
  };

  var getHeader = function (data) {
    data = Utils.toArray(data);
    checksum = Utils.byteArrayToString(data.slice(0, 16));
    actualLen = Utils.byteArrayToString(data.slice(16, 32));
    var iv = data.slice(32);

    encryptor = new Encryptor(Encryptors.AES, decKey, iv, 256);
    sMan.readNext(doEncryptedDownload);
  };

  var doEncryptedUpload = function (block) {
    block = Utils.toArray(block);
    block = encryptor.encrypt(block);
    sMan.store(block);
    if (!sMan.readNext(doEncryptedUpload)) {
      sMan.store(Utils.stringToByteArray(encryptor.getChecksum().toString(), 16), true);
      sMan.saveToDisk();
    }
  };

  var doEncryptedDownload = function (block) {
    block = Utils.toArray(block);
    block = encryptor.decrypt(block);
    sMan.store(block);
    if (!sMan.readNext(doEncryptedDownload)) {
       var computedSum = encryptor.getChecksum().toString();
       if(computedSum === checksum){
        sMan.saveToDisk(actualLen);
       }
       else {
        throw 'The file is corrupt.';
       }
    }
  };

  this.encryptFile = function (file, encKey) {
    var iv = rGen.generate();

    sMan = new StorageManager(file);
    encryptor = new Encryptor(Encryptors.AES, encKey, iv, 256);

    applyHeader(file.size.toString(), iv);
    sMan.readNext(doEncryptedUpload);
  };

  this.decryptFile = function (file, dKey) {
    decKey = dKey;
    sMan = new StorageManager(file);
    sMan.readNextLength(48, getHeader);
  };
};