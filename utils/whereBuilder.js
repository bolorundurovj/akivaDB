const buildWhere = (whereObj) => {
  const { key, value, operator } = whereObj;

  switch (operator) {
    case "equal":
      return (x) => x[key].toString() === value.toString();
    case "bigger":
      return (x) => {
        if (isNaN(x[key]) || isNaN(value)) {
          return x[key] > value;
        }

        return +x[key] > +value;
      };
    case "smaller":
      return (x) => {
        if (isNaN(x[key]) || isNaN(value)) {
          return x[key] < value;
        }

        return +x[key] < +value;
      };
    case "biggerEqual":
      return (x) => {
        if (isNaN(x[key]) || isNaN(value)) {
          return x[key] >= value;
        }

        return +x[key] >= +value;
      };
    case "smallerEqual":
      return (x) => {
        if (isNaN(x[key]) || isNaN(value)) {
          return x[key] <= value;
        }

        return +x[key] <= +value;
      };
    case "like":
      return (x) => x[key].toString().includes(value);

    default:
      throw new Error(`ERROR: ${operator} is not a valid operator.`);
  }
};

module.exports = { buildWhere };
