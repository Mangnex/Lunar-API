const CRYPT_KEY = require('../configs').CRYPT_KEY;

function Decrypt(cipher) {
    let keyBytes = typeof CRYPT_KEY === "string" ? Buffer.from(CRYPT_KEY, "utf8") : CRYPT_KEY;
    let keyLength = keyBytes.length;
    let cipherBytes = Buffer.from(cipher, "hex");
    let cipherLength = cipherBytes.length;
    let randomBytes = [];
    let randomSeed = 0;

    for (let i = 0; i < keyLength; i++) {
        randomSeed = ((randomSeed + keyBytes[i] * (i + 1)) * 1103515245 + 12345) >>> 0;
        randomSeed = (randomSeed >>> 16) % 4294967296;
    }

    for (let i = 0; i < (cipherLength - keyLength + 1) * keyLength; i++) {
        randomSeed = (randomSeed % 4194304 * 1103515245 + 12345) >>> 0;
        randomBytes[i] = (randomSeed >>> 16) % 256;
    }

    let randomIndex = randomBytes.length - 1;
    let lastKeyByte = keyBytes[keyLength - 1];
    let resultBytes = new Uint8Array(cipherLength - keyLength + 1);

    for (let i = cipherLength - 1; i >= keyLength - 1; i--) {
        let resultByte = (cipherBytes[i] - lastKeyByte + 256) % 256;
        resultByte = (resultByte - randomBytes[randomIndex--] + 256) % 256;

        for (let j = keyLength - 2; j >= 0; j--) {
            let index = i - (keyLength - 1 - j);
            let cipherByte = (cipherBytes[index] - keyBytes[j] + 256) % 256;
            cipherByte = (cipherByte - resultByte + 256) % 256;
            cipherByte = (cipherByte - randomBytes[randomIndex--] + 256) % 256;
            cipherBytes[index] = cipherByte;
        }
        resultBytes[i - keyLength + 1] = resultByte;
    }

    return Buffer.from(resultBytes).toString("utf8");
}

function Encrypt(message) {
    let keyBytes = typeof CRYPT_KEY === "string" ? Buffer.from(CRYPT_KEY, "utf8") : CRYPT_KEY;
    let keyLength = keyBytes.length;
    let messageBytes = Buffer.from(message, "utf8");
    let messageLength = messageBytes.length;
    let resultBytes = new Uint8Array(messageLength + keyLength - 1);
    let randomSeed = 0;

    for (let i = 0; i < keyLength; i++) {
        randomSeed = ((randomSeed + keyBytes[i] * (i + 1)) * 1103515245 + 12345) >>> 0;
        randomSeed = (randomSeed >>> 16) % 4294967296;
    }

    let randomBytes = [];
    for (let i = 0; i < messageLength * keyLength; i++) {
        randomSeed = (randomSeed % 4194304 * 1103515245 + 12345) >>> 0;
        randomBytes[i] = (randomSeed >>> 16) % 256;
    }

    let randomIndex = 0;
    for (let i = 0; i < messageLength; i++) {
        let messageByte = messageBytes[i];
        for (let j = 0; j < keyLength; j++) {
            let resultIndex = i + j;
            let keyByte = keyBytes[j];
            let resultByte = (messageByte + (resultBytes[resultIndex] || 0)) % 256;
            resultByte = (resultByte + keyByte) % 256;
            resultByte = (resultByte + randomBytes[randomIndex++]) % 256;
            resultBytes[resultIndex] = resultByte;
        }
    }

    return Buffer.from(resultBytes).toString("hex");
}

function CustomDecrypt(cipher, key) {
    let keyBytes = typeof key === "string" ? Buffer.from(key, "utf8") : key;
    let keyLength = keyBytes.length;
    let cipherBytes = Buffer.from(cipher, "hex");
    let cipherLength = cipherBytes.length;
    let randomBytes = [];
    let randomSeed = 0;

    for (let i = 0; i < keyLength; i++) {
        randomSeed = ((randomSeed + keyBytes[i] * (i + 1)) * 1103515245 + 12345) >>> 0;
        randomSeed = (randomSeed >>> 16) % 4294967296;
    }

    for (let i = 0; i < (cipherLength - keyLength + 1) * keyLength; i++) {
        randomSeed = (randomSeed % 4194304 * 1103515245 + 12345) >>> 0;
        randomBytes[i] = (randomSeed >>> 16) % 256;
    }

    let randomIndex = randomBytes.length - 1;
    let lastKeyByte = keyBytes[keyLength - 1];
    let resultBytes = new Uint8Array(cipherLength - keyLength + 1);

    for (let i = cipherLength - 1; i >= keyLength - 1; i--) {
        let resultByte = (cipherBytes[i] - lastKeyByte + 256) % 256;
        resultByte = (resultByte - randomBytes[randomIndex--] + 256) % 256;

        for (let j = keyLength - 2; j >= 0; j--) {
            let index = i - (keyLength - 1 - j);
            let cipherByte = (cipherBytes[index] - keyBytes[j] + 256) % 256;
            cipherByte = (cipherByte - resultByte + 256) % 256;
            cipherByte = (cipherByte - randomBytes[randomIndex--] + 256) % 256;
            cipherBytes[index] = cipherByte;
        }
        resultBytes[i - keyLength + 1] = resultByte;
    }

    return Buffer.from(resultBytes).toString("utf8");
}

function CustomEncrypt(message, key) {
    let keyBytes = typeof key === "string" ? Buffer.from(key, "utf8") : key;
    let keyLength = keyBytes.length;
    let messageBytes = Buffer.from(message, "utf8");
    let messageLength = messageBytes.length;
    let resultBytes = new Uint8Array(messageLength + keyLength - 1);
    let randomSeed = 0;

    for (let i = 0; i < keyLength; i++) {
        randomSeed = ((randomSeed + keyBytes[i] * (i + 1)) * 1103515245 + 12345) >>> 0;
        randomSeed = (randomSeed >>> 16) % 4294967296;
    }

    let randomBytes = [];
    for (let i = 0; i < messageLength * keyLength; i++) {
        randomSeed = (randomSeed % 4194304 * 1103515245 + 12345) >>> 0;
        randomBytes[i] = (randomSeed >>> 16) % 256;
    }

    let randomIndex = 0;
    for (let i = 0; i < messageLength; i++) {
        let messageByte = messageBytes[i];
        for (let j = 0; j < keyLength; j++) {
            let resultIndex = i + j;
            let keyByte = keyBytes[j];
            let resultByte = (messageByte + (resultBytes[resultIndex] || 0)) % 256;
            resultByte = (resultByte + keyByte) % 256;
            resultByte = (resultByte + randomBytes[randomIndex++]) % 256;
            resultBytes[resultIndex] = resultByte;
        }
    }

    return Buffer.from(resultBytes).toString("hex");
}

module.exports = {CustomEncrypt, CustomDecrypt, Encrypt, Decrypt}