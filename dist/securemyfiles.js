(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var supercrypt = require('./src/encryptor');

module.exports = supercrypt;
},{"./src/encryptor":3}],2:[function(require,module,exports){
/**
 * Initializes a new AES CBC encryptor
 * @constructor
 * @param {Array<Byte>} key - The encryption key
 * @param {Array<Byte>} iv - The initialization vector
 */
var EncryptorAESCBC = function (key, iv) {
    var encryptor = {
        encrypt: encrypt,
        decrypt: decrypt
    },
        algSize = 16,
        prevEncBlock = iv,
        prevDecBlock = iv,
        sBox,
        shiftRowTab,
        sBoxInv,
        shiftRowTabInv,
        xTime;

    init();
    expandKey(key);

    return encryptor;
    /**
     * Encrypts the given byte array
     * @param {Uint8Array} byteArray - The typed byte array that needs to be encrypted
     */
    function encrypt(byteArray) {
        var startIndex = 0,
            endIndex,
            idx,
            eidx,
            encBlock,
            paddingValue,
            resultArray = new Uint8Array(byteArray.byteLength);

        while (startIndex < byteArray.byteLength) {
            endIndex = startIndex + algSize;

            //copy block to be encrypted into a temporary array
            encBlock = new Uint8Array(algSize);
            for (eidx = 0, idx = startIndex; idx < endIndex; eidx++ , idx++) {
                encBlock[eidx] = byteArray[idx];
            }

            //xor the blocks, CBC mode
            xor(encBlock, prevEncBlock);

            //encrypt block
            encryptBlock(encBlock, key);

            //save previous block for CBC
            prevEncBlock = encBlock.slice(0);

            //save the result in the resulting array
            resultArray.set(encBlock, startIndex);

            startIndex += algSize;
        }
        return resultArray;
    }

    /**
     * Decrypts the given byte array
     * @param {Uint8Array} byteArray - The typed byte array that needs to be decrypted
     */
    function decrypt(byteArray) {
        var startIndex = 0,
            eidx,
            idx,
            endIndex,
            decBlock,
            blockBefore,
            resultArray = new Uint8Array(byteArray.byteLength);

        while (startIndex < byteArray.byteLength) {
            endIndex = startIndex + algSize;

            //copy the block to be decrypted in a temporary array
            decBlock = new Uint8Array(algSize);
            for (eidx = 0, idx = startIndex; idx < endIndex; eidx++ , idx++) {
                decBlock[eidx] = byteArray[idx];
            }

            //save the block for CBC - needs to be encrypted
            blockBefore = decBlock.slice(0);

            //decrypt the block
            decryptBlock(decBlock, key);

            //xor with previous block, CBC mode
            xor(decBlock, prevDecBlock);

            //save the previous block for CBC
            prevDecBlock = blockBefore;

            //save the result in the resulting array
            resultArray.set(decBlock, startIndex);

            startIndex += algSize;
        }
        return resultArray;
    }


    /**
     * Applies XOR on two arrays having a fixed length of 16 bytes.
     * @param {Array<Byte>} arr1 - The first array
     * @param {Array<Byte>} arr2 - The second array
     * @returns {Array<Byte>} The result array
     */
    function xor(arr1, arr2) {
        for (var i = 0; i < algSize; i++) {
            arr1[i] = arr1[i] ^ arr2[i];
        }
    }

    /**
     * Combines the state with a round of the key
     */
    function addRoundKey(state, rkey) {
        for (var i = 0; i < algSize; i++)
            state[i] ^= rkey[i];
    }

    /**
     * Replaces bytes in the state with bytes from the lookup table
     */
    function subBytes(state, sbox) {
        for (var i = 0; i < algSize; i++)
            state[i] = sbox[state[i]];
    }

    /**
     * Shifts the rows of the state
     */
    function shiftRows(state, shifttab) {
        var h = state.slice(0);
        for (var i = 0; i < algSize; i++)
            state[i] = h[shifttab[i]];
    }

    /**
     * Mixes state columns (using a fixed polinomial function)
     */
    function mixColumns(state) {
        for (var i = 0; i < algSize; i += 4) {
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
    }

    /**
     * Inverted mix columns
     */
    function mixColumnsInv(state) {
        for (var i = 0; i < algSize; i += 4) {
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
    }

    /**
     * Initializes the runtime and lookup tables.
     */
    function init() {
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

        shiftRowTabInv = new Array(algSize);
        for (var j = 0; j < algSize; j++)
            shiftRowTabInv[shiftRowTab[j]] = j;

        xTime = new Array(256);
        for (var k = 0; k < 128; k++) {
            xTime[k] = k << 1;
            xTime[128 + k] = (k << 1) ^ 0x1b;
        }
    }

    /**
     * Expands the cipher key according to its length
     */
    function expandKey(key) {
        var kl = key.length,
            ks, Rcon = 1;
        switch (kl) {
            case 16:
                ks = algSize * (10 + 1);
                break;
            case 24:
                ks = algSize * (12 + 1);
                break;
            case 32:
                ks = algSize * (14 + 1);
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
            } else if ((kl > 24) && (i % kl == algSize))
                temp = new Array(sBox[temp[0]], sBox[temp[1]],
                    sBox[temp[2]], sBox[temp[3]]);
            for (var j = 0; j < 4; j++)
                key[i + j] = key[i + j - kl] ^ temp[j];
        }
    }

    /** 
     * Encrypt a 16-byte array block using the given key
     */
    function encryptBlock(block, key) {
        var l = key.length;
        addRoundKey(block, key.slice(0, algSize));
        for (var i = algSize; i < l - algSize; i += algSize) {
            subBytes(block, sBox);
            shiftRows(block, shiftRowTab);
            mixColumns(block);
            addRoundKey(block, key.slice(i, i + algSize));
        }
        subBytes(block, sBox);
        shiftRows(block, shiftRowTab);
        addRoundKey(block, key.slice(i, l));
    }

    /** 
     * Decrypts a 16-byte array block using the given key
     */
    function decryptBlock(block, key) {
        var l = key.length;
        addRoundKey(block, key.slice(l - algSize, l));
        shiftRows(block, shiftRowTabInv);
        subBytes(block, sBoxInv);
        for (var i = l - (2 * algSize); i >= algSize; i -= algSize) {
            addRoundKey(block, key.slice(i, i + algSize));
            mixColumnsInv(block);
            shiftRows(block, shiftRowTabInv);
            subBytes(block, sBoxInv);
        }
        addRoundKey(block, key.slice(0, algSize));
    }


};

//exports
module.exports = {
    AESCBC: EncryptorAESCBC
};
},{}],3:[function(require,module,exports){
var Encryptors = require('./enc-aescbc');
var sha256 = require('./sha256');
var hcompMac256 = require('./hmac256');
var chunkSize = 160000;
var algSize = 16;
var macSize = algSize * 2;

/**
  * Gets the chunkSize
  */
var getChunkSize = function () {
    return chunkSize;
};


/**
 * Encryptor class
 * 
 * @param {object} options - The options for the encryptor
 * @returns {object} The encryptor object
 */
var supercrypt = function (options) {
    var algorithm,
        readMac = new Uint8Array(macSize),
        compMac,
        sizeRead,
        service = {
            encrypt: encrypt,
            decrypt: decrypt,
            getChunkSize: getChunkSize
        },
        defaultOps = {
            algorithm: Encryptors.AESCBC
        };

    checkOptions();
    return service;

    /**
     * Initializes the encryptor
     */
    function checkOptions() {
        if (!options) {
            options = {};
        }

        extend(options, defaultOps);

        if (!options.readBlock) {
            throw "Exception. The 'readBlock' parameter was not present in the options";
        }

        if (!options.saveBlock) {
            throw "Exception. The 'saveBlock' parameter was not present in the options";
        }

        if (!options.fileSize) {
            throw "Exception. The 'fileSize' parameter was not present in the options.";
        }

        if (!options.finishHandler) {
            throw "Exception. The 'finishHandler' parameter was not present in the options";
        }

        if (!options.errorHandler) {
            throw "Exception. The 'errorHandler' parameter was not present in the options";
        }

        //adjusting to the size of the actual content (IV 16, MAC 32)
        options.decryptionFileSize = options.fileSize - algSize - macSize;
    }

    /**
     * Encrypts a byte block
     * 
     * @param {Uint8Array} block - The block to encrypt
     * @returns {Array<Byte>} The encrypted block
     */
    function encrypt(key, seedList) {
        if (!key) {
            throw "Exception. The parameter 'key' was not present";
        }

        //generating key hash
        var keyHash = getKeyHash(key);

        //initializing size
        sizeRead = 0;

        //instantiating the HMAC algorithm
        compMac = new hcompMac256(keyHash.slice(0, algSize));

        //generating and saving the IV
        var iv = generateIV(seedList);
        compMac.update(iv);
        options.saveBlock(iv);

        //instantiating the encryption algorithm
        algorithm = new options.algorithm(keyHash.slice(algSize), iv);

        //starting the encryption
        options.readBlock(chunkSize, continueEncryption);
    }

    /**
     * Saves and continues encryption
     * 
     * @param {Uint8Array} block - The input block
     */
    function continueEncryption(block) {
        if (options.progressHandler) {
            options.progressHandler(block.byteLength);
        }

        //update total size read from file
        sizeRead += block.byteLength;

        //apply padding to last block
        if (block.byteLength < chunkSize || sizeRead === options.fileSize) {
            //computing the padding
            var paddingLength = algSize - (block.byteLength % algSize),
                newBlock = new Uint8Array(block.byteLength + paddingLength);

            //setting the padding
            newBlock.set(block);
            for (var i = block.byteLength; i < newBlock.byteLength; i++) {
                newBlock[i] = paddingLength;
            }
            block = newBlock;
        }

        //encrypt the block and save
        block = algorithm.encrypt(block);
        compMac.update(block);
        options.saveBlock(block);

        //check if there's more to read
        if (!options.readBlock(chunkSize, continueEncryption)) {

            //save the mac and call the finish handler
            options.saveBlock(compMac.finalize());
            options.finishHandler();
        }
    }

    /**
     * Decrypts a byte block
     * 
     * @param {Uint8Array} block - The block to decrypt
     * @returns {Array<Byte>} The decrypted block
     */
    function decrypt(key) {
        var iv;

        if (!key) {
            throw "Exception. The parameter 'key' was not present";
        }

        //generating the key hash
        var keyHash = getKeyHash(key);
        compMac = new hcompMac256(keyHash.slice(0, algSize));

        //initializing size
        sizeRead = 0;

        options.readBlock(algSize, function (iv) {
            //update mac with iv
            compMac.update(iv);

            //instantiating the algorithm
            algorithm = new options.algorithm(keyHash.slice(algSize), iv);

            //starting the decryption
            options.readBlock(chunkSize, continueDecryption);
        });
    }

    /**
     * Saves and continues encryption
     * 
     * @param {Uint8Array} block - The input block
     */
    function continueDecryption(block) {
        //update progress
        if (options.progressHandler) {
            options.progressHandler(block.byteLength);
        }

        //update total size read from file
        sizeRead += block.byteLength;

        var byteDiff = sizeRead - options.decryptionFileSize;
        if (sizeRead > options.decryptionFileSize) {
            //get the read mac from the block (last bytes bigger than the file content size)
            readMac.set(block.slice(-byteDiff));
            block = block.slice(0, -byteDiff);
        }

        //update mac
        compMac.update(block);

        //decrypt the block
        block = algorithm.decrypt(block);

        //remove the last (padding) bytes
        if (sizeRead >= options.decryptionFileSize) {
            block = block.slice(0, -(block[block.byteLength - 1]));
        }
        options.saveBlock(block);

        //check if total size read has exceeded the actual file content
        if (sizeRead <= options.decryptionFileSize) {
            //read the next block and continue decryption
            options.readBlock(chunkSize, continueDecryption);
            return;
        }

        //if not all the mac is in this block, read the next block as well
        if (byteDiff < 32) {
            options.readBlock(byteDiff, function (lastBlock) {
                readMac.set(lastBlock, byteDiff);
                validateAndFinalize();
            });
        }
        else {
            validateAndFinalize();
        }
    }

    /**
     * Validates mac and finalizes decryption
     */
    function validateAndFinalize() {
        if (validateChecksum(readMac, compMac.finalize())) {
            options.finishHandler();
        }
        else {
            options.errorHandler(1);
        }
    }

    /**
     * Computes the hash of a given string key
     * @param {string} key - The key
     * @returns {object} They key hash
     */
    function getKeyHash(key) {
        var hash256 = new sha256();
        hash256.update(stringToByteArray(key));
        return hash256.finalize();
    }
};

/**
 * Transforms a string into a byte array
 * @param {String} str - the string to be transformed
 * @returns {Array} The resulting array
 */
function stringToByteArray(str) {
    return Array.prototype.map.call(str, function (c) { return c.charCodeAt(0); });
}

/**
 * Generate new random 128-bit key, based on seedList (a seed list)
 * If the seedlist is too short, the function will use random numbers
 * The function also uses miliseconds from current date to generate the IV
 * @param {Array<Number>} seedList - an array of seeds collected from true random sources (i.e. mouse movement)
 * @returns {Array<Number>} The randomly generated Initialization Vector
 */
function generateIV(seedList) {
    var ent, dat, num, result = [];

    if (!seedList) {
        seedList = [];
    }

    for (var i = 0; i < algSize; i++) {
        ent = seedList.length > 1 ? seedList.splice(i, 1) : [Math.random() * 10, Math.random() * 10];
        dat = new Date();
        num = ent.length ? ent[0] * Math.random() / 10 : (Math.random() * 10 + Math.random() * 100 + Math.random() * 1000) / 100;

        result[i] = parseInt(num * dat.getMilliseconds() / 10);
        while (result[i] > 255) {
            result[i] -= 255;
        }
    }

    return result;
}

/**
 * Extends object a with properties from object b
 * 
 * @param {object} a - The object that will get modified to include all properties
 * @param {object} b - The object to take properties from
 * @returns The modified object
 */
function extend(a, b) {
    for (var key in b)
        if (b.hasOwnProperty(key))
            a[key] = b[key];
    return a;
}

/**
 * Checks if two (typed) array(s) are equal
 * @param {ArrayBuffer} read - UInt8Array
 * @param {Array} comp - Array
 */
function validateChecksum(read, comp) {
    if (read.byteLength !== comp.length) {
        return false;
    }

    var i = read.byteLength;
    while (i--) {
        if (read[i] !== comp[i]) {
            return false;
        }
    }

    return true;
}

//setting the static function
supercrypt.getChunkSize = getChunkSize;

//exports
module.exports = supercrypt;
},{"./enc-aescbc":2,"./hmac256":4,"./sha256":5}],4:[function(require,module,exports){
var sha256 = require('./sha256');

/**
 * HMAC 256 function
 * @param {Array<Byte>} key - The key
 */
var hmac256 = function (key) {
    var hashKey = key.slice(0),
        hash256 = new sha256(),
        hashSize = 64,
        service = {
            update: update,
            finalize: finalize
        };

    init();
    return service;

    function init() {
        var i;

        for (i = hashKey.length; i < hashSize; i++)
            hashKey[i] = 0;
        for (i = 0; i < hashSize; i++)
            hashKey[i] ^= 0x36;

        hash256.update(hashKey);
    }

    
    /**
     * Updates the HMAC with a new message
     * @param {any} msg - The message as string or byte array
     */
    function update(msg) {
        //check the message type (string or byte array)
        if (typeof msg.byteLength === typeof undefined) {
            hash256.update(msg);
        }
        else {
            hash256.updateByte(msg);
        }
    }


    
    /**
     * Finalizes the HMAC calculation
     * @returns {Array<byte>} A byte array
     */
    function finalize() {
        var i,
            md = hash256.finalize(),
            hash256New = new sha256();

        for (i = 0; i < hashSize; i++)
            hashKey[i] ^= 0x36 ^ 0x5c;

        hash256New.update(hashKey);
        hash256New.update(md);

        for (i = 0; i < hashSize; i++)
            hashKey[i] = 0;

        hashKey = undefined;

        return hash256New.finalize();
    }
};

//exports
module.exports = hmac256;
},{"./sha256":5}],5:[function(require,module,exports){
/**
 * SHA 256 function
 */
var sha256 = function () {
    var initH = new Array(0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19),
        initK = new Array(
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
            0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
            0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
            0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
            0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
            0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
            0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
            0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
            0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
            0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
            0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
        ),
        buff = [],
        len = 0,
        hashSize = 64,
        service = {
            update: update,
            updateByte: updateByte,
            finalize: finalize
        };

    return service;

    /**
     * Updates the hash with a new message
     * @param {any} msg - The message as byte array
     */
    function updateByte(msg) {
        var temp = new Uint8Array((buff.byteLength || buff.length) + msg.byteLength);
        temp.set(buff);
        temp.set(msg, buff.byteLength || buff.length);

        for (var i = 0; i + hashSize <= temp.byteLength; i += hashSize) {
            hashByteBlock(initH, temp.slice(i, i + hashSize));
        }
        buff = temp.slice(i);
        len += msg.byteLength;
    }

    /**
     * Updates the hash with a new message
     * @param {any} msg - The message as string
     */
    function update(msg) {
        buff = buff.concat(msg);
        for (var i = 0; i + hashSize <= buff.length; i += hashSize)
            hashByteBlock(initH, buff.slice(i, i + hashSize));
        buff = buff.slice(i);
        len += msg.length;
    }

    /**
     * Finalizes the hash calculation
     * @returns {Array<byte>} The resulting hash
     */
    function finalize() {
        var i;

        if (typeof buff.byteLength !== typeof undefined) {
            //transforming buff into regular array
            buff = getArrayFromTypedArray(buff);
        }

        buff[buff.length] = 0x80;

        if (buff.length > hashSize - 8) {
            for (i = buff.length; i < hashSize; i++)
                buff[i] = 0;
            hashByteBlock(initH, buff);
            buff.length = 0;
        }

        for (i = buff.length; i < hashSize - 5; i++)
            buff[i] = 0;
        buff[59] = (len >>> 29) & 0xff;
        buff[60] = (len >>> 21) & 0xff;
        buff[61] = (len >>> 13) & 0xff;
        buff[62] = (len >>> 5) & 0xff;
        buff[63] = (len << 3) & 0xff;
        hashByteBlock(initH, buff);

        var res = new Array(32);
        for (i = 0; i < 8; i++) {
            res[4 * i + 0] = initH[i] >>> 24;
            res[4 * i + 1] = (initH[i] >> 16) & 0xff;
            res[4 * i + 2] = (initH[i] >> 8) & 0xff;
            res[4 * i + 3] = initH[i] & 0xff;
        }

        initH = undefined;
        buff = undefined;
        len = undefined;

        return res;
    }

    /**
     * Converts a typed array to a regular array
     * @param {TypedArray} typedArray - The typed array 
     * @returns {Array} The converted array
     */
    function getArrayFromTypedArray(typedArray) {
        var newArray = new Array(typedArray.byteLength);

        for (i = 0; i < newArray.length; i++) {
            newArray[i] = typedArray[i];
        }

        return newArray;
    }


    /**
     * SHA signature function
     * @param {number} x - The byte
     * @returns The result of the operation
     */
    function shasig0(x) {
        return ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
    }

    /**
     * SHA signature function
     * @param {number} x - The byte
     * @returns The result of the operation
     */
    function shasig1(x) {
        return ((x >>> 17) | (x << 15)) ^ ((x >>> 19) | (x << 13)) ^ (x >>> 10);
    }

    /**
     * SHA signature function
     * @param {number} x - The byte
     * @returns The result of the operation
     */
    function shaSig0(x) {
        return ((x >>> 2) | (x << 30)) ^ ((x >>> 13) | (x << 19)) ^
            ((x >>> 22) | (x << 10));
    }

    /**
     * SHA signature function
     * @param {number} x - The byte
     * @returns The result of the operation
     */
    function shaSig1(x) {
        return ((x >>> 6) | (x << 26)) ^ ((x >>> 11) | (x << 21)) ^
            ((x >>> 25) | (x << 7));
    }

    /**
     * SHA checksum function
     * @param {number} x - The byte
     * @param {number} y - The byte
     * @param {number} z - The byte
     * @returns The result of the operation
     */
    function shaCh(x, y, z) {
        return z ^ (x & (y ^ z));
    }

    /**
     * SHA byte operation function
     * @param {number} x - The byte
     * @param {number} y - The byte
     * @param {number} z - The byte
     * @returns The result of the operation
     */
    function shaMaj(x, y, z) {
        return (x & y) ^ (z & (x ^ y));
    }

    /**
     * SHA word block hashing function
     * @param {Array<byte>} H - The byte array
     * @param {Array<byte>} W - The byte array
     * @returns The result of the operation
     */
    function hashWordBlock(H, W) {
        var i;
        for (i = 16; i < hashSize; i++)
            W[i] = (shasig1(W[i - 2]) + W[i - 7] +
                shasig0(W[i - 15]) + W[i - 16]) & 0xffffffff;
        var state = [].concat(H);
        for (i = 0; i < hashSize; i++) {
            var T1 = state[7] + shaSig1(state[4]) +
                shaCh(state[4], state[5], state[6]) + initK[i] + W[i];
            var T2 = shaSig0(state[0]) + shaMaj(state[0], state[1], state[2]);
            state.pop();
            state.unshift((T1 + T2) & 0xffffffff);
            state[4] = (state[4] + T1) & 0xffffffff;
        }
        for (i = 0; i < 8; i++)
            H[i] = (H[i] + state[i]) & 0xffffffff;
    }

    /**
     * SHA byte block hashing function
     * @param {Array<byte>} H - The byte array
     * @param {Array<byte>} w - The byte array
     * @returns The result of the operation
     */
    function hashByteBlock(H, w) {
        var W = new Array(16);
        for (var i = 0; i < 16; i++)
            W[i] = w[4 * i + 0] << 24 | w[4 * i + 1] << 16 |
                w[4 * i + 2] << 8 | w[4 * i + 3];
        hashWordBlock(H, W);
    }
};

//exports
module.exports = sha256;
},{}],6:[function(require,module,exports){
var smf = require('./src/app');

window.SecureMyFiles = smf;
},{"./src/app":7}],7:[function(require,module,exports){
var supercrypt = require('../lib/supercrypt');
var StorageManager = require('./storagemgr');
var Utils = require('./utils');

/** 
 * Main Secure My Files (SMF) class - creates a new SMF object
 * @constructor
 * @param {Function} success - The success callback
 * @param {Function} error - The error callback
 */
var SecureMyFiles = function (success, error, progress, saveOnDisk) {
    var rGen = new Utils.RandomGenerator(),
        sMan,
        encryptor;

    if (typeof success !== 'function' || typeof error !== 'function') {
        throw 'Success and Error callbacks are mandatory and must be functions!';
    }

    var handleProgress = function (processed) {
        if (typeof progress === 'function') {
            progress(processed, sMan.getLength());
        }
    };

    var handleFinish = function (addExt) {
        sMan.saveToDisk(addExt);
    };

    var computeOutputLength = function (size, chunkSize) {
        //add IV and MAC to the file size
        var finalLength = size + 48;

        //add fixed 16B padding on intermediary blocks
        finalLength += Math.floor(size / chunkSize) * 16;

        //add padding for the last block
        finalLength += 16 - (size % 16);

        return finalLength;
    };

    this.encryptFile = function (file, key) {
        var seedList = [],//TODO use random generator
            chunkSize = supercrypt.getChunkSize(),
            finalLength = computeOutputLength(file.size, chunkSize);

        sMan = new StorageManager(file, finalLength);
        encryptor = new supercrypt({
            fileSize: sMan.getLength(),
            saveBlock: sMan.store,
            readBlock: sMan.readChunk,
            progressHandler: handleProgress,
            finishHandler: handleFinish.bind(this, true),
            errorHandler: error
        });

        encryptor.encrypt(key, seedList);
    };

    this.decryptFile = function (file, key) {
        sMan = new StorageManager(file, file.size - 48);
        encryptor = new supercrypt({
            fileSize: sMan.getLength(),
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
},{"../lib/supercrypt":1,"./storagemgr":8,"./utils":9}],8:[function(require,module,exports){
var Utils = require('./utils');

/**
 * Manages file operations
 * @param {File} file - The disk file to be handled
 * @param {number} outputLength - The length of the output file
 */
var StorageManager = function (file, outputLength) {
    var readerIndex = 0,
        writerIndex = 0,
        reader = new FileReader(),
        fileSize = file.size,
        fileName = file.name,
        writer = new Uint8Array(outputLength);

    /**
     * Saves a blob to disk
     */
    var saveBlob = function (blob, fileName) {
        var objUrl = URL.createObjectURL(blob);

        var a = document.createElement("a");
        a.style = "display: none";
        document.body.appendChild(a);

        a.href = objUrl;
        a.download = fileName;
        a.click();
        setTimeout(function () {
            URL.revokeObjectURL(objUrl);
        }, 0);
    };

    /**
     * Reads the next specific number of bytes, calling the callback when done
     * @param {Number} size - The number of bytes to be read
     * @param {Function} callback - The callback to be called when done
     */
    this.readChunk = function (size, callback) {
        if (readerIndex >= fileSize) {
            return false;
        }
        var bSize = size;
        if (readerIndex + size > fileSize) {
            bSize = fileSize - readerIndex;
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
        reader.readAsArrayBuffer(file.slice(readerIndex, readerIndex + bSize));
        readerIndex += bSize;
        return true;
    };

    /**
     * Stores the provided data, calling the callback when done
     * @param {Uint8Array} data - The data to be stored
     * @param {Function} callback - The callback to be called when done
     */
    this.store = function (data, callback) {
        writer.set(data, writerIndex);
        writerIndex += typeof data.byteLength === typeof undefined ? data.length : data.byteLength;

        if (typeof callback === 'function') {
            callback();
        }
    };

    /**
     * Gets the file length
     * @returns {Number} The file length
     */
    this.getLength = function () {
        return fileSize;
    };


    /**
     * Saves the currently stored data to disk
     * @param {boolean} addExt - True if should add the encryption extension
     */
    this.saveToDisk = function (addExt) {
        var blob;

        //if decrypted, the plain-text file will be smaller than the encrypted one
        if (writerIndex < writer.byteLength) {
            blob = new Blob([writer.slice(0, writerIndex)], {
                type: 'application/octet-stream'
            });
        }
        else {
            blob = new Blob([writer], {
                type: 'application/octet-stream'
            });
        }

        fileName = addExt ? fileName.concat('.smfw') : fileName.replace('.smfw', '');
        saveBlob(blob, fileName);
    };
};

//exports
module.exports = StorageManager;
},{"./utils":9}],9:[function(require,module,exports){
var Utils = {};


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

/**
 * Transforms a string into a fixed size byte array
 * @param {String} string - the string to be transformed
 * @param {Number} len - the desired destination length
 * @returns {Array} The resulting array padded with 0 at the end
 */
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

/**
 * Transforms a byte array into string
 * @param {TypedArray} byteArray - the typed byte array to be transformed
 * @returns {String} The resulting string
 */
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

//exports
module.exports = Utils;
},{}]},{},[6]);
