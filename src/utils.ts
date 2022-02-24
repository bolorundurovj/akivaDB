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

/**
 * Convert bytes to human readable formats.
 * @param {number} x
 * @returns {string} formattedSize
 */
export const humanReadableFileSize = (x: number) => {
  const units = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let l = 0,
    n = x || 0;
  while (n >= 1024 && ++l) {
    n = n / 1024;
  }
  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + units[l];
};
