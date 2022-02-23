const characterFormat: RegExp = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;

/**
 * Converts passed value to an array.
 * @param {T | T[]} x
 * @returns {Array} array
 */
export const toArray = <T>(x: T | T[]) => (Array.isArray(x) ? x : [x]);

/**
 * Checks for special characters.
 * @param {string} x
 * @returns {boolean} boolean
 */
export const containsSpecialChars = (x: string) => characterFormat.test(x);
