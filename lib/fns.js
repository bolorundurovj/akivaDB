const CHUNK = 16384;

/**
 * Split array
 * @param {[]} array The array to split
 * @param {!Number} [pages] array to split every pages
 * @returns {Array<Array<any>>}
 */
async function splitArray(array, pages = 2) {
  if (!array.length) return [];

  const chunks = [];

  for (let i = 0; i < array.length; ) {
    chunks.push(array.slice(i, (i += pages)));
  }

  return chunks;
}

/**
 * Encode strings
 * @param {string} string The string to encode
 */
function encode(string) {
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
}

/**
 * Decode strings
 * @param {string} string The string to Decode
 */
function decode(string) {
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

      const first = 1 * code.substring(0, 2) + 33;
      const second = 1 * code.substring(2) + 33;

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
}

module.exports = {
  splitArray,
  encode,
  decode,
};
