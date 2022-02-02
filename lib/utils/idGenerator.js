let _generatedUIDs = {};

/**
 * Generate UID
 * @author Bolorunduro Valiant-Joshua
 * @returns {string} UUID
 */
const generateUID = () => {
    let firstPart = (Math.random() * 46656) | 0;
    let secondPart = (Math.random() * 46656) | 0;
    firstPart = ("000" + firstPart.toString(36)).slice(-3);
    secondPart = ("000" + secondPart.toString(36)).slice(-3);
    return firstPart + secondPart;
};

/**
 * Generates UID and checks if Identifier id duplicated
 * @author Bolorunduro Valiant-Joshua
 * @returns {string} UUID
 */
const generateUIDWithCollisionChecking = () => {
    while (true) {
        const uid = (
            "0000" + ((Math.random() * Math.pow(36, 4)) | 0).toString(36)
        ).slice(-4);
        if (!_generatedUIDs.hasOwnProperty(uid)) {
            _generatedUIDs[uid] = true;
            return uid;
        }
    }
};

module.exports = { generateUID, generateUIDWithCollisionChecking };