/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * A higher level convenience database access wrapper.
 */
/* global Promise */
'use strict';

var debug = require('../utils/debug')('db');
var idb = require('./idb');
var __DEV__ = process.env.NODE_ENV !== 'production';

/**
 * Construct a DataWrapper object.
 * Convenience wrapper for idb access by store and key.
 *
 * @constructor
 *
 * @param {String} storeName - The name of the idb store.
 * @param {Object} options - The creation options.
 * @param {String} options.key - The name of the key to access.
 * @param {Boolean} [options.emulateError] - for dev only, use to force error
 * outcomes in tests.
 */
function DataWrapper (storeName, options) {
  this.storeName = storeName;
  this.keyName = options.key;

  if (__DEV__) {
    if (typeof idb.emulateError === 'function') {
      idb.emulateError(options.emulateError);
    }
  }
}

DataWrapper.prototype = {
  /**
   * Read a value from a store.key.
   * If value is undefined, not found, rejects with informative error.
   *
   * @returns {Promise} Resolves to value on success.
   */
  read: function read () {
    var keyName = this.keyName,
      storeName = this.storeName;

    return idb.get(storeName, keyName).then(function (value) {
      return new Promise(function (resolve, reject) {
        if (typeof value !== 'undefined') {
          debug('successfully read ' + keyName + ' from ' + storeName);
          resolve(value);
        } else {
          var err = new Error(keyName + ' not found in '+ storeName);
          debug(err.message);
          reject(err);
        }
      });
    });
  },
  /**
   * Update a store.key value.
   *
   * @param {AnySupportedType} value - The new value.
   * @returns {Promise} Resolves or rejects when complete.
   */
  update: function update (value) {
    debug('updating ' + this.keyName + ' in ' + this.storeName);
    return idb.put(this.storeName, this.keyName, value);
  }
};

/***
 * There will be one exposed method here for each idb.stores key.
 */
module.exports = {};

/**
 * Create public data access wrappers for the keys in stores.
 * These convenience methods allow the using code to obtain a
 * get/put wrapper by storeName and keyName, exposing read/update methods
 * that just operate on values.
 *
 * Signature: <storeName> (options)
 * storeName from idb.stores is the method name.
 */
Object.keys(idb.stores).forEach(function (storeKey) {
  /**
   * Store wrapper method.
   *
   * @param {Object} options - Creation options object.
   * @param {String} options.key - The keyName to operate on.
   * @returns {DataWrapper} A DataWrapper object.
   */
  module.exports[storeKey] = function (options) {
    return new DataWrapper(idb.stores[storeKey], options);
  };
});
