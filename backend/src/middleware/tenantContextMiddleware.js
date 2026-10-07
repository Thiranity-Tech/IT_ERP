const tenantContext = require("../services/tenantContext");

module.exports = (req, res, next) => {
  tenantContext.run({}, next);
};
