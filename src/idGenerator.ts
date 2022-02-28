import crypto from 'crypto';

let _generatedUIDs = {};

/**
 * Generate UID
 * @author Bolorunduro Valiant-Joshua
 * @returns {string} UUID
 */
export const generateUID = () => {
    let firstPart = (Math.random() * 46656) | 0;
    let secondPart = (Math.random() * 46656) | 0;
    (firstPart as any) = ("000" + firstPart.toString(36)).slice(-3);
    (secondPart as any) = ("000" + secondPart.toString(36)).slice(-3);
    return firstPart + secondPart;
};

/**
 * Generate UID based on datetime
 * @author Bolorunduro Valiant-Joshua
 * @returns {string} UUID
 */
export const generateUIDByTimestamp = (seed?: number) => {
    seed = seed || crypto.randomBytes(1).readUInt8();
    const timestamp = Date.now().toString(16);
    const random = crypto.randomBytes(5).toString('hex');

    seed += 1;
    return `${timestamp}${random}${seed.toString(16)}`;
};

/**
 * Generates UID and checks if Identifier id duplicated
 * @author Bolorunduro Valiant-Joshua
 * @returns {string} UUID
 */
export const generateUIDWithCollisionChecking = () => {
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
