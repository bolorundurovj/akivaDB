const isEqual = require("./isEqual");

async function parseArray(filter, data) {
  if (filter.length > data.length) return false;

  const parsed = [];

  let id = 0;

  while (id < data.length) {
    if (parsed.length === filter.length) return true;

    let i = 0;

    while (i < filter.length) {
      if (parsed.length === filter.length) return true;
      if (parsed.indexOf(i) > -1) continue;

      if (Array.isArray(filter[i]) && Array.isArray(data[id])) {
        const res = await parseArray(filter[i], data[id]);

        if (res) parsed.push(i);
      } else if (filter[i] instanceof Object && data[id] instanceof Object) {
        const res = await isEqual(filter[i], Object.keys(filter[i]), data[id]);

        if (res) parsed.push(i);
      } else if (filter[i] === data[id]) parsed.push(i);

      i++;
    }

    id++;
  }

  if (parsed.length === filter.length) return true;

  return false;
}

module.exports = parseArray;
