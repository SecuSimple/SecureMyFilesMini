var supercrypt = require('../lib/supercrypt');
var StorageManager = require('./storagemgr');
var Utils = require('./utils');

/** 
 * Main Secure My Files (SMF) class - creates a new SMF object
 * @constructor
 * @param {Function} success - The success callback
 * @param {Function} error - The error callback
 * @param {Function} progress - [Optional] The progress callback
 */
var SecureMyFiles = function (success, error, progress) {
    var rGen = new Utils.RandomGenerator(),
        sMan,
        encryptor;

    if (typeof success !== 'function' || typeof error !== 'function') {
        throw 'Success and Error callbacks are mandatory and must be functions!';
    }

    var handleProgress = function (processedPercent) {
        if (typeof progress === 'function') {
            progress(processedPercent);
        }
    };

    var handleFinish = function (addExt) {
        sMan.saveToDisk(addExt);
    };

    this.encryptFile = function (file, key) {
        var seedList = rGen.generate();

        sMan = new StorageManager(file, supercrypt.getEncryptedLength(file.size));
        encryptor = new supercrypt({
            fileSize: file.size,
            saveBlock: sMan.store,
            readBlock: sMan.readChunk,
            progressHandler: handleProgress,
            finishHandler: handleFinish.bind(this, true),
            errorHandler: error
        });

        encryptor.encrypt(key, seedList);
    };

    this.decryptFile = function (file, key) {
        sMan = new StorageManager(file, supercrypt.getDecryptedLength(file.size));
        encryptor = new supercrypt({
            fileSize: file.size,
            saveBlock: sMan.store,
            readBlock: sMan.readChunk,
            progressHandler: handleProgress,
            finishHandler: handleFinish,
            errorHandler: error,
        });

        encryptor.decrypt(key);
    };
};

//exports
module.exports = SecureMyFiles;