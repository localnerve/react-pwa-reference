/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Handles IndexedDB updates.
 * Only updates init IDBObjectStore if it gets new/first data.
 */
'use strict';

var stores = require('./stores');
var apis = require('../utils/db').init({ key: 'apis' });
var timestamp = require('../utils/db').init({ key: 'timestamp' });
var debug = require('../utils/debug')('init.update');

/**
 * Update the IndexedDB init IDBObjectStore if appropriate.
 *
 * @param {Object} payload - Initial payload
 * @param {Object} payload.stores - The flux stores for the app.
 * @param {Object} payload.apis - The api information for the app.
 * @param {Number} payload.timestamp - The timestamp of the app state.
 * @return {Boolean} A promise that resolves to boolean indicating if init
 * got new data and should run.
 */
module.exports = function update (payload) {
  debug('Running update');

  return timestamp.read().then(function (currentTs) {
    // If the incoming timestamp is newer, it's on.
    return payload.timestamp && currentTs < payload.timestamp;
  }, function () {
    // No existing timestamp found, so brand new - it's on!
    return true;
  }).then(function (shouldUpdate) {
    if (shouldUpdate) {
      // Update the init.timestamp
      return timestamp.update(payload.timestamp)
      .then(function () {
        // Update init.stores
        return stores.updateInitStores(payload.stores);
      })
      .then(function () {
        // Update init.apis
        return apis.update(payload.apis).then(function () {
          return true;
        });
      }).catch(function (error) {
        debug('Failed to update', error);
        throw error; // rethrow
      });
    } else {
      return false;
    }
  });
};
