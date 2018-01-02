/***
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Init message and data handling.
 */
/* global Promise, self */
import backgrounds from './backgrounds';
import routes from './routes';
import update from './update';
import apiRequests from './apiRequests';
import { serviceAllRequests } from '../sync';
import { stores as dbStores } from 'sw/utils/db';
import debugLib from 'sw/utils/debug';

const debug = debugLib('init:index');
const stores = dbStores.init({ key: 'stores' });
const apis = dbStores.init({ key: 'apis' });
const timestamp = dbStores.init({ key: 'timestamp' });

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
  const shouldRun = !payload.startup || !self.registration.sync;

  if (shouldRun) {
    debug('running request sync');

    return serviceAllRequests(payload.apis).catch((error) => {
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
  return update(payload).then((updated) => {
    if (updated || payload.startup) {
      debug('running setup');

      return backgrounds(payload.stores)
        .then(() => {
          return apiRequests(payload.apis);
        })
        .then(() => {
          return routes(payload.stores, payload.startup);
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
export function initCommand (payload, responder) {
  debug('Running init, payload:', payload);

  return updateAndSetup(payload)
    .then(() => {
      return startRequestSync(payload);
    })
    .then(() => {
      return responder({
        error: null
      });
    })
    .catch((error) => {
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
export function initData () {
  return Promise
    .all([
      stores.read(),
      apis.read(),
      timestamp.read()
    ])
    .then((data) => {
      return {
        stores: data[0],
        apis: data[1],
        timestamp: data[2]
      };
    });
}
