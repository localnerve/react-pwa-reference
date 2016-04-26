/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Module to contain indexedDB interactions (treo only referenced here).
 * Currently wraps Treo and exposes a handful of simple, asynchronous
 * objectStore operations.
 */
/* global Promise */
'use strict';

var treo = require('treo');

var IDB_VERSION = 1;
var IDB_NAME = 'service-worker';

// To add a new ObjectStore to the schema, add it here.
// Also, MUST update IDB_VERSION (no floats allowed),
// and override the treo schema callback to perform the upgrade details.
var IDB_STORES = {
  init: 'init',
  requests: 'requests',
  state: 'state'
};

/**
 * Return database and store references.
 *
 * @param {String} storeName - The name of the objectStore.
 * @returns An Object with the store and a db close method exposed.
 */
function _dbAndStore (storeName) {
  var db, schema = treo.schema()
    .version(IDB_VERSION);

  Object.keys(IDB_STORES).forEach(function (store) {
    schema.addStore(IDB_STORES[store]);
  });

  db = treo(IDB_NAME, schema);

  return {
    /**
     * wrap db close
     */
    close: function () {
      db.close(function () {
      });
    },
    store: db.store(storeName)
  };
}

/**
 * Promisify/Simplify Treo.
 * Penalty: Open and close the database on every interaction.
 *
 * @param {String} method - The ObjectStore method name, prebound on exports.
 * @param {String} storeName - The ObjectStore name.
 * The rest of the parameters are (in order):
 * 1. key/value/collection/none Arguments to the store operation exposed by Treo.
 * 2. the callback, which we always add at the end in here.
 * @returns A Promise that resolves with the supplied callback from Treo.
 */
function treoWrapper (method, storeName) {
  // Get the key, value, or collection arguments.
  var args = Array.prototype.slice.call(arguments, 2);

  return new Promise(function (resolve, reject) {
    var o = _dbAndStore(storeName);
    /**
     * callback bridge to Promise resolution
     */
    var cb = function treoCallback (err, res) {
      err ? reject(err) : resolve(res);
      o.close();
    };

    // Add the callback as the last argument.
    args.push(cb);

    // Call the method and resolve the promise.
    o.store[method].apply(o.store, args);
  });
}

// Create the exposed Object.
module.exports = {
  stores: IDB_STORES
};

/**
 * Add the exposed database operations.
 * These all have the signature:
 *   StoreName [, argument]
 *
 * Specific Signature Reminders:
 * all   (storeName)
 * batch (storeName, kvCollection)
 * del   (storeName, key)
 * get   (storeName, key)
 * put   (storeName, key, value)
 */
['all', 'batch', 'del', 'get', 'put'].forEach(function (method) {
  module.exports[method] = treoWrapper.bind(null, method);
});
