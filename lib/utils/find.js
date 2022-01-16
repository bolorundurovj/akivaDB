const deepClone = require("rfdc")();
const isEqual = require("./isEqual");
const parseArray = require("./parseArray");

async function findData(array, filter, max, json) {
  const keys = Object.keys(filter);

  const filtered = [];

  let i = 0;

  filter: while (i < array.length) {
    if (i > max) break;

    for (const key of keys) {
      if (Array.isArray(filter[key]) && Array.isArray(array[i][key])) {
        const res = await parseArray(filter[key], array[i][key]);

        if (!res) {
          i++;

          continue filter;
        }
      } else if (
        filter[key] instanceof Object &&
        array[i][key] instanceof Object
      ) {
        const res = isEqual(
          filter[key],
          Object.keys(filter[key], array[i][key])
        );

        if (!res) {
          i++;

          continue filter;
        }
      } else if (filter[key] !== array[i][key]) {
        i++;

        continue filter;
      }
    }

    filtered.push(array[i]);

    i++;
  }

  return filtered.length ? deepClone(filtered) : [];
}

module.exports = findData;
