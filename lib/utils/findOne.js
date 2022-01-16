const isEqual = require("./isEqual");
const parseArray = require("./parseArray");

async function findOne(array, filter, keys) {
  if (!keys) keys = Object.keys(filter);

  let i = 0;
  let index = -1;

  find: while (i < array.length) {
    if (index > -1) break;

    let k = 0;

    while (k < keys.length) {
      if (index > -1) break;

      if (Array.isArray(filter[keys[k]]) && Array.isArray(array[i][keys[k]])) {
        const res = await parseArray(filter[keys[k]], array[i][keys[k]]);

        if (!res) {
          i++;

          continue find;
        }
      } else if (
        filter[keys[k]] instanceof Object &&
        array[i][keys[k]] instanceof Object
      ) {
        const res = await isEqual(
          filter[keys[k]],
          Object.keys(filter[keys[k]]),
          array[i][keys[k]]
        );

        if (!res) {
          i++;

          continue find;
        }
      } else if (filter[keys[k]] !== array[i][keys[k]]) {
        i++;

        continue find;
      }

      k++;
    }

    index = i;

    break;
  }

  if (index < 0) return {};

  return {
    item: array[index],
    index,
  };
}

module.exports = findOne;
