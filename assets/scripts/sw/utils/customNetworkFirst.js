/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * A custom network first sw-toolbox route handler and factory
 */
/* global Promise, caches, setTimeout, clearTimeout */
'use strict';

var toolbox = require('sw-toolbox');
var helpers = require('./customHelpers');
var debug = require('./debug')('customNetworkFirst');

/**
 * A customized networkFirst cache strategy.
 * Nominal behavior is read-thru caching from network.
 * If network fails, fallback to cache.
 *
 * Specializations:
 *
 * Allows fetch and cache with two different versions of the request:
 *   One version for fetching the response from the network.
 *   One version for cache matching/updating.
 * This is a common service worker pattern that works around lack of ignoreSearch
 * implementation, but could also be useful for ignoring arbitrary components of
 * the request url in the cache, network cookie preservation, changing VARY, etc.
 * @see https://code.google.com/p/chromium/issues/detail?id=426309
 *
 * Allow optional cache fallback behavior (two level fallback).
 * If cache fallback fails, execute a cacheFallback method if specified.
 *
 * Allow optional (preemptive) timeouts.
 * A preemptive timeout can optionally be defined that forces the
 * cache/cacheFallback code path to be used. It is preemptive in the sense that
 * the application can have one timeout, but a shorter one can be defined here that
 * prevents the application timeout from ever materializing. So where the
 * application would timeout, instead it gets cached data.
 *
 * @param {Function} fetchRequest - given the original request,
 * returns a Promise that resolves to a network request.
 * @param {Function} cacheRequest - Given the original request, returns a
 * Promise that resolves to a cache request.
 * @param {Function} [cacheFallback] - Receives the cacheRequest,
 * returns a Promise (resolves to) Response in the event of a fallback cache miss.
 * @return {Function} An sw-toolbox route handler (request, values, options)
 */
function routeHandlerFactory (fetchRequest, cacheRequest, cacheFallback) {
  /**
   * The custom network first sw-toolbox route handler
   *
   * @param {Request} request - The request from sw-toolbox router.
   * @param {Object} values - route values, not used.
   * @param {Object} [options] - The options from sw-toolbox passed to
   * fetchAndCache.
   * @param {Function} [options.networkTimeout] - Use cache after timeout.
   * @return {Promise} Resolves to a Response on success.
   */
  return function customNetworkFirst (request, values, options) {
    options = options || {};

    return caches.open(toolbox.options.cache.name).then(function (cache) {
      var reqNet, reqCache, timeoutId;
      var promises = [];

      // Create the network and cache request versions
      return Promise.all([
        fetchRequest(request),
        cacheRequest(request)
      ]).then(function (reqs) {
        reqNet = reqs[0];
        reqCache = reqs[1];

        /**
         * Get the cached response.
         * return the cacheFallback response if cached response has no data.
         *
         * @returns {Promise} Cached response or the cacheFallback response.
         */
        function getCachedResponse () {
          var response = cache.match(reqCache);

          return response.then(function (data) {
            if (!data && cacheFallback) {
              return cacheFallback(reqCache);
            }
            return response;
          });
        }

        if (options.networkTimeout) {
          // Only participate in the race for resolve (not reject).
          var timeoutPromise = new Promise(function (resolve) {
            timeoutId = setTimeout(function () {
              debug('preemptive network timeout, fallback to cache');
              getCachedResponse().then(function (response) {
                // Only resolve if there's a valid cached or fallback response.
                if (response) {
                  resolve(response);
                }
              });
            }, options.networkTimeout);
          });
          promises.push(timeoutPromise);
        }

        var networkPromise = helpers.fetchAndCache(reqNet, reqCache, options)
        .then(function (response) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          return response;
        })
        .catch(function (error) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          debug('network req failed, fallback to cache', error);
          return getCachedResponse();
        });
        promises.push(networkPromise);

        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race
        return Promise.race(promises);
      });
    });
  };
}

module.exports = {
  routeHandlerFactory: routeHandlerFactory
};
