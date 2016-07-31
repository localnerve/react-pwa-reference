/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Handling for dynamic app routes.
 *
 * Uses a custom 'fastest' sw-toolbox route handler and a higher level TTL cache
 * to keep requests down and response as fast as possible.
 */
/* global Promise, Request, URL, location */
import toolbox from 'sw-toolbox';
import debugLib from 'sw/utils/debug';
import { contentRace } from 'sw/utils/customHelpers';
import { routeHandlerFactory } from 'sw/utils/customFastest';
import * as idb from 'sw/utils/idb';
import {
  addOrReplaceUrlSearchParameter,
  stripSearchParameters
} from 'sw/utils/requests';

const debug = debugLib('init:routes');

// Recent Route Lifespan (after this, it is re-fetched and cached)
const routeTTL = 1000 * 60 * 20;

/**
 * Create a request for network use.
 * Adds a parameter to tell the server to skip rendering.
 * Includes credentials.
 *
 * Route requests require a parameter that indicates no server-side rendering
 * of the application should be done.
 * This reduces the load on the server. The rendered application markup is not
 * required in this case, since the main app bundle is already cached.
 *
 * @private
 *
 * @param {Object|String} request - The Request from sw-toolbox router, or a string.
 * @returns String of the new request url.
 */
function networkRequest (request) {
  const url =
    addOrReplaceUrlSearchParameter(
      (typeof request !== 'string') ? request.url : request, 'render', '0'
    );

  return new Request(url, {
    credentials: 'include'
  });
}

/**
 * Create a request for cache.
 *
 * This exists because:
 * ignoreSearch option is not implemented yet in cache.match/matchAll,
 * so we stripSearchParameters to ignoreSearch ourselves in the request we cache.
 * https://code.google.com/p/chromium/issues/detail?id=426309
 *
 * Response from Google:
 * https://github.com/GoogleChrome/sw-toolbox/issues/35
 *
 * @private
 *
 * @param {Object} request - A Request object from sw-toolbox.
 * @returns A string of the modified request url to be used in caching.
 */
function cacheRequest (request) {
  return stripSearchParameters(request.url);
}

/**
 * Add the given successful request url and timestamp to init.routes IDB store.
 * This is a fetchAndCache successHandler that stores the request times
 * as a side effect and just returns the response.
 *
 * @private
 *
 * @param {Request} request - The request of the successful network fetch.
 * @param {Response} response - The response of the successful network fetch.
 * @returns {Promise} A Promise resolving to the input response.
 */
function addRecentRoute (request, response) {
  return idb.get(idb.stores.init, 'routes').then((routes = {}) => {
    routes[(new URL(request.url, location.origin)).pathname] = Date.now();

    return idb.put(idb.stores.init, 'routes', routes).then(() => {
      return response;
    });
  });
}

/**
 * Look up the given url in 'init.routes' to see if fetchAndCache should be
 * skipped. If age is less than TTL and already cached, skip.
 *
 * @private
 *
 * @param {String} url - The url pathname to test.
 * @returns {Promise} Promise resolves to Boolean, true if cache should be skipped.
 */
function getRecentRoute (url) {
  return idb.get(idb.stores.init, 'routes').then((routes) => {
    if (routes && routes[url]) {
      const age = Date.now() - routes[url];

      if (age < routeTTL) {
        return toolbox.cacheOnly(new Request(url)).then((response) => {
          if (response) {
            debug(`skipping fetchAndCache for ${url}`);
            return true;
          }
          return false;
        });
      }
    }

    return false;
  });
}

/**
 * Install a fastest handler for the given route url.
 * Also, try to precache the route.
 *
 * @private
 *
 * @param {String} url - The url to cache and install.
 * @returns {Promise} A Promise resolving on success (no sig value).
 */
function cacheAndInstallRoute (url) {
  debug('cache route', url);

  // This has to happen regardless of the precache outcome.
  installRouteGetHandler(url);

  // Must handle errors here, precache error is irrelevant beyond here.
  return contentRace(networkRequest(url), url, null, {
    successHandler: addRecentRoute
  })
    .catch((error) => {
      debug(`failed to precache ${url}`, error);
    });
}

/**
 * Install a 'fastest' cache handler for the given route url.
 *
 * @private
 *
 * @param {String} url - The url to install route GET handler on.
 * @returns {Promise} Resolves to undefined when complete.
 */
function installRouteGetHandler (url) {
  debug('install route GET handler on', url);

  toolbox.router.get(url, routeHandlerFactory(
    networkRequest, cacheRequest
  ), {
    debug: toolbox.options.debug,
    successHandler: addRecentRoute
  });

  return Promise.resolve();
}

/**
 * What this does:
 * 1. Fetch the mainNav routes of the application and update the cache with the responses.
 * 2. Install route handlers for all the main nav routes.
 *
 * The route GET handler will be the start of a main navigation entry point for
 * the application. It will be fetched and cached from the network, unless offline.
 * The page returned, will cause an 'init' command to execute again, along with
 * this method.
 *
 * So, to prevent a route from being fetched and cached twice, a TTL scheme
 * (add/getRecentRoute) is used to keep track of routes recently
 * fetched and cached from the route GET handler.
 *
 * @param {Object} payload - The payload of the init message.
 * @param {Object} payload.RouteStore.routes - The routes of the application.
 * @returns {Promise} Resolves to array of all installed route promises.
 */
export default function cacheRoutes (payload) {
  const routes = payload.RouteStore.routes;

  debug('received routes', routes);

  return Promise.all(Object.keys(routes).map((route) => {
    if (routes[route].mainNav) {
      const url = routes[route].path;

      return getRecentRoute(url).then((skipCache) => {
        if (skipCache) {
          return installRouteGetHandler(url);
        }
        return cacheAndInstallRoute(url);
      }).catch((error) => {
        debug('failed to get recentRoute', error);
        return cacheAndInstallRoute(url);
      });
    }

    return Promise.resolve();
  }));
}
