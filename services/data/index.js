/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import debugLib from 'debug';
import cache from './cache-interface';
import fetchLib from './fetch';

const debug = debugLib('services:data:index');

/**
 * Get a resource from cache.
 * If not found, get a resource from FRED
 *
 * @param {Object} params - The parameters controlling fetch.
 * @param {String} params.resource - The name of the resource to fetch.
 * @param {String} [params.url] - The url of the resource to fetch.
 * Not required if expected in cache.
 * @param {Function} callback - The callback to execute on completion.
 */
export function fetch (params, callback) {
  debug(`fetching resource "${params.resource}"`);

  const resource = cache.get(params.resource);

  if (resource) {
    debug('cache hit');
    return callback(null, resource);
  }

  // If a cache hit was required, see if we already have a fetchable spec.
  if (!fetchLib.isManifestRequest(params) && !params.url) {
    const spec = cache.find(params.resource);
    if (spec) {
      params = spec;
    }
  }

  fetchLib.fetchOne(params, callback);
}

export const initialize = fetchLib.fetchMain;
export const update = fetchLib.fetchAll;

export default {
  fetch,
  initialize,
  update
};
