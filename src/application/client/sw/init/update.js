/***
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Handles IndexedDB updates.
 * Only updates init IDBObjectStore if it gets new/first data.
 */
import * as stores from './stores';
import * as db from 'sw/utils/db';
import debugLib from 'sw/utils/debug';

const debug = debugLib('init:update');
const apis = db.stores.init({ key: 'apis' });
const timestamp = db.stores.init({ key: 'timestamp' });

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
export default function update (payload) {
  debug('Running update');

  return timestamp.read().then((currentTs) => {
    // If the incoming timestamp is newer, it's on.
    return payload.timestamp && currentTs < payload.timestamp;
  }, () => {
    // No existing timestamp found, so brand new - it's on!
    return true;
  }).then((shouldUpdate) => {
    if (shouldUpdate) {
      // Update the init.timestamp
      return timestamp.update(payload.timestamp)
        .then(() => {
          // Update init.stores
          return stores.updateInitStores(payload.stores);
        })
        .then(() => {
          // Update init.apis
          return apis.update(payload.apis).then(() => {
            return true;
          });
        }).catch((error) => {
          debug('Failed to update', error);
          throw error; // rethrow
        });
    } else {
      return false;
    }
  });
}
