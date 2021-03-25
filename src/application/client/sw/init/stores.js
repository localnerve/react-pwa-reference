/***
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Special handling for Flux Stores saved in IndexedDB 'init.stores' ObjectStore.
 */
/* global Promise, Response, Blob */
import debugLib from 'sw/utils/debug';
import * as idb from 'sw/utils/idb';
import * as apiHelpers from 'sw/utils/api';

const keyName = 'stores';
const debug = debugLib('init:stores');

/**
 * Update IndexedDB init.stores.
 *
 * @param {Object} stores - The initial Flux Stores payload.
 * @return {Promise} A Promise that resolves to the result of idb.put.
 */
export function updateInitStores (stores) {
  debug('Updating init.stores');
  return mergeContent(stores).then((merged) => {
    return idb.put(idb.stores.init, keyName, merged);
  });
}

/**
 * Keep old ContentStore content if it does not exist in newStores.
 * This is used by resourceContentResponse
 * @see resourceContentResponse
 *
 * NOTE: This grows the content over time. There is not currently a purging
 * mechanism.
 * TODO: Add IndexedDB purge to activate.
 *
 * @param {Object} newStores - The newer version of Flux Store data.
 * @param {Object} newStores.ContentStore.contents - The new contents
 * (will be merged with old content)
 * @return {Promise} A Promise that resolves to the new data merged with old content.
 */
function mergeContent (newStores) {
  return idb.get(idb.stores.init, keyName).then((oldStores) => {
    if (newStores && oldStores) {
      const oldContent = oldStores.ContentStore.contents,
        newContent = newStores.ContentStore.contents;

      Object.keys(oldContent).forEach((resource) => {
        // If the content is missing in newStores, it lives on.
        if (!newContent[resource]) {
          newContent[resource] = oldContent[resource];
        }
      });
    }

    return Promise.resolve(newStores);
  });
}

/**
 * Pull the resource request from the given request url and
 * return the content response for that resource (if one exists).
 *
 * Uses IndexedDB init.stores to retrieve the initially served content.
 * @see apiRequests.js
 *
 * @param {String} request - the request url to find the resource in.
 * @return {Object} A promise that resolves to the Response with the initial
 * content for the resource specified in the request.
 */
export function resourceContentResponse (request) {
  /* eslint-disable no-useless-escape */
  const matches = request.match(/resource=([\w\-]+)/);
  /* eslint-enable no-useless-escape */
  const resource = matches && matches[1];

  if (resource) {
    return idb.get(idb.stores.init, keyName).then((payload) => {
      const content = payload && payload.ContentStore &&
        payload.ContentStore.contents[resource];

      debug(
        'resourceContentResponse, resource:', resource, ', response:', content
      );

      return new Promise((resolve, reject) => {
        if (content) {
          const blob = new Blob([JSON.stringify(
            apiHelpers.createContentResponse(content)
          )], {
            type: 'application/json'
          });

          resolve(new Response(blob));
        } else {
          reject(new Error(`Content not found for resource: ${resource}`));
        }
      });
    });
  }

  // No resource, so Promise resolves to undefined.
  debug('resourceContentResponse: no resource');
  return Promise.resolve();
}
