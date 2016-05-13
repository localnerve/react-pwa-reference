/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise */
import request from 'superagent';
import debugLib from 'debug';
import configs from 'configs';
import cache from './cache-interface';

const debug = debugLib('services:data:fetch');
const config = configs.create().data;

/**
 * Get a single resource from FRED and cache it.
 *
 * @param {Object} params - The parameters controlling fetch.
 * @param {String} params.resource - The name of the resource to fetch, the key for the fetched data.
 * @param {String} [params.url] - The url of the resource to fetch. If omitted, defaults to the FRED url.
 * @param {Function} callback - The callback to execute on completion.
 */
export function fetchOne (params, callback) {
  debug(`fetching resource "${params.resource}"`);

  // A manifest request has no url specified
  if (!params.url) {
    params.url = config.FRED.url();
  } else {
    params.url = config.FRED.branchify(params.url);
  }

  request.get(params.url)
  .set('User-Agent', 'superagent')
  .set('Accept', config.FRED.mediaType())
  .end((err, res) => {
    if (err) {
      debug(`GET failed for ${params.url}: ${err}`);
      return callback(err);
    }

    let resource;
    const content = res.body && res.body.content;

    if (content) {
      debug(`Content successfully retrieved for ${params.url}`);

      cache.put(
        params, new Buffer(content, config.FRED.contentEncoding()).toString()
      );

      resource = cache.get(params.resource);

      if (resource) {
        return callback(null, resource);
      }

      return callback(
        new Error(
          `Requested resource ${params.resource} not found for ${params.url}`
        )
      );
    }

    debug(`Content not found for ${params.url}`, res.body);
    return callback(new Error(`Content not found for ${params.url}`));
  });
}

/**
 * Get the main resource from FRED.
 * Populates/updates the routes and models (all top-level resources).
 *
 * @param {Function} callback - The callback to execute on completion.
 */
export function fetchMain (callback) {
  fetchOne({
    resource: config.FRED.mainResource
  }, callback);
}

/**
 * Get all resources from FRED and cache them.
 * Call to update or populate the entire data cache.
 * Returns an array of each routes' content.
 * TODO: if a route references a model with content, fetch that too.
 *
 * @param {Function} callback - The callback to execute on completion.
 */
export function fetchAll (callback) {
  fetchMain((err, routes) => {
    if (err) {
      debug(`fetchAll failed to get routes: ${err}`);
      return callback(err);
    }

    Promise.all(
      Object.keys(routes).map((route) => {
        return new Promise((resolve, reject) => {
          fetchOne(routes[route].action.params, (err, res) => {
            if (err) {
              return reject(err);
            }
            return resolve(res);
          });
        });
      })
    )
    .then((result) => {
      callback(null, result);
    }, callback);
  });
}

/**
 * Check params for main resource resource request.
 *
 * @param {Object} params - fetch params.
 * @param {String} params.resource - the resource to be fetched.
 * @returns {Boolean} true if mainResource request, false otherwise.
 */
export function isManifestRequest (params) {
  return !!(params && params.resource === config.FRED.mainResource);
}

export default {
  fetchMain,
  fetchOne,
  fetchAll,
  isManifestRequest
};
