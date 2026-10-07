const { AsyncLocalStorage } = require("async_hooks");

const storage = new AsyncLocalStorage();

const run = (context, callback) => storage.run(context, callback);
const enter = (context) => storage.enterWith(context);
const get = () => storage.getStore() || {};

module.exports = { run, enter, get };
