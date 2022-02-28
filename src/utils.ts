const CHUNK = 16384;
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

/**
 * Covert boolean to number
 * @param x boolean
 * @returns {number} 1 or 0
 */
export const boolToNumber = (x: boolean) => (x ? 1 : 0);

/**
 * Split array
 * @param {[]} array The array to split
 * @param {!Number} [pages] array to split every pages
 * @returns {Array<Array<any>>} array
 */
export const splitArray = async (array: Array<any>, pages = 2) => {
  if (!array.length) return [];

  const chunks = [];

  for (let i = 0; i < array.length; ) {
    chunks.push(array.slice(i, (i += pages)));
  }

  return chunks;
};

/**
 * Encode strings
 * @param {string} string The string to encode
 * @returns encodedString
 */
export const encode = (string: string) => {
  const b64 = Buffer.from(string).toString("base64");

  let enc = "";

  let l = 0;

  while (l < b64.length) {
    const str = b64.substring(l, l + CHUNK);

    let codes = [];
    let i = 0;

    while (i < str.length) {
      const strng = str.substring(i, i + 2);

      const code = [strng.charCodeAt(0), strng.charCodeAt(1)];
      const first = code[0] - 33;
      const second = (code[1] || 93) - 33;

      codes.push(`${first}${second}`);

      i += 2;
    }

    const encStr = String.fromCharCode(...codes);

    enc += encStr;

    l += CHUNK;

    if (l < b64.length) enc += "\n";
  }

  return enc;
};

/**
 * Decode strings
 * @param {string} string The string to Decode
 * @returns decodedString
 */
export const decode = (string: string) => {
  if (!string.length) return "";

  const strings = string.replace(/\n/g, "");

  let b64 = "";

  let l = 0;

  while (l < strings.length) {
    const str = strings.substring(l, l + CHUNK / 2);

    let codes = [];
    let i = 0;

    while (i < str.length) {
      const code = `${str[i].charCodeAt(0)}`;

      const first = 1 * parseInt(code.substring(0, 2)) + 33;
      const second = 1 * parseInt(code.substring(2)) + 33;

      codes.push(first);

      if (second != 93) codes.push(second);

      i++;
    }

    const decStr = String.fromCharCode(...codes);

    b64 += decStr;

    l += CHUNK / 2;
  }

  const decoded = Buffer.from(b64, "base64").toString();

  return decoded;
};
