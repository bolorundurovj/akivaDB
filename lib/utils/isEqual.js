const parseArray = require("./parseArray");

async function isEqual(filter, keys, data) {
  for (const key of keys) {
    if (Array.isArray(filter[key]) && Array.isArray(data[key])) {
      const res = await parseArray(filter[key], data[key]);

      if (!res) return false;
    } else if (filter[key] instanceof Object && data[key] instanceof Object) {
      const res = await isEqual(
        filter[key],
        Object.keys(filter[key]),
        data[key]
      );

      if (!res) return false;
    } else if (filter[key] !== data[key]) return false;
  }

  return true;
}

module.exports = isEqual;
