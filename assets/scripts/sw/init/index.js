/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Init message and data handling.
 */
/* global Promise, self */
'use strict';

var backgrounds = require('./backgrounds');
var routes = require('./routes');
var update = require('./update');
var apiRequests = require('./apiRequests');
var sync = require('../sync');
var stores = require('../utils/db').init({ key: 'stores' });
var apis = require('../utils/db').init({ key: 'apis' });
var timestamp = require('../utils/db').init({ key: 'timestamp' });
var debug = require('../utils/debug')('init');

/**
 * Kick-off the maintenance and synchronization of stored requests.
 * Does nothing if run at startup and worker has one-off sync capability.
 *
 * @param {Object} payload - The message payload.
 * @param {Boolean} payload.startup - True if run at worker startup.
 * @param {Object} payload.apis - The api information for the app.
 * @returns {Promise} Resolves when complete.
 */
function startRequestSync (payload) {
  // If this is run at worker startup and has sync capability, don't run.
  var shouldRun = !payload.startup || !self.registration.sync;

  if (shouldRun) {
    debug('running request sync');

    return sync.serviceAllRequests(payload.apis)
    .catch(function (error) {
      debug('serviceAllRequests failed ', error);
    });
  } else {
    debug('request sync skipped');
  }

  return Promise.resolve();
}

/**
 * Update stores and setup sw-toolbox route map.
 *
 * TODO: clear sw-toolbox router map if setup will occur.
 *
 * @param {Object} payload - Initial payload
 * @param {Number} payload.timestamp - The timestamp of the payload.
 * @param {Object} payload.stores - The flux stores for the app.
 * @param {Object} payload.apis - The api information for the app.
 * @param {Boolean} payload.startup - Indicates the sw started up and memory
 * needs initializing.
 */
function updateAndSetup (payload) {
  return update(payload).then(function (updated) {
    if (updated || payload.startup) {
      debug('running setup');

      return backgrounds(payload.stores)
      .then(function () {
        return apiRequests(payload.apis);
      })
      .then(function () {
        return routes(payload.stores);
      });
    } else {
      debug('setup skipped');
    }
  });
}

/**
 * The 'init' message handler, runs the initialization sequence.
 *
 * Uses the initial store data sent from the server to setup dynamic request
 * handling, and to keep the store data up-to-date if the app is online.
 *
 * When?
 * 1. Gets executed every new app load (once per session), via message.
 * 2. Gets executed at the beginning of service worker start, via load.
 * So can run multiple times, *must be idempotent*.
 *
 * What?
 * 1. Updates the init.stores in IndexedDB if the app is online
 *    Including updated apiInfos, required for sync.
 * 2. Conditinally synchronizes and maintains deferred requests in IndexedDB.
 * 3. Installs route handlers for sw-toolbox.
 * 4. Precaches/prefetches backgrounds and routes.
 *
 * @param {Object} payload - Initial payload.
 * @param {Function} responder - Function to call to resolve the message.
 */
function init (payload, responder) {
  debug('Running init, payload:', payload);

  return updateAndSetup(payload)
  .then(function () {
    return startRequestSync(payload);
  })
  .then(function () {
    return responder({
      error: null
    });
  })
  .catch(function (error) {
    debug('init failed', error);
    return responder({
      error: error.toString()
    });
  });
}

/**
 * Reads all the stored init data.
 *
 * @return {Promise} A Promise that resolves to a Object with the init payload.
 */
function initData () {
  return Promise.all([
    stores.read(),
    apis.read(),
    timestamp.read()
  ])
  .then(function (data) {
    return {
      stores: data[0],
      apis: data[1],
      timestamp: data[2]
    };
  });
}

/**
 * Expose the init command and storage access for relevant init keys.
 */
module.exports = {
  command: init,
  data: initData
};
