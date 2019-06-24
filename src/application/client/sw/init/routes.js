/***
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Handling for dynamic app routes.
 *
 * Uses a custom 'fastest' sw-toolbox route handler and a higher level TTL cache
 * to keep requests down and response as fast as possible.
 */
/* global Promise, Request, location, clients, MessageChannel, caches */
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

// Timeout for ping message to browser client.
const pingTimeout = 250;

/**
 * Remove all non-SSR main nav routes from cache and state.
 *
 * @returns {Promise} resolves to array of booleans representing cache deletions.
 */
function removeAndInvalidateNonSSRRoutes () {
  return idb.get(idb.stores.init, 'routes').then((routes = {}) => {
    const nonSSRRouteUrls = Object.keys(routes).filter((url) => {
      return !routes[url].ssr;
    });

    // Invalidate (will not skip fetchAndCache)
    nonSSRRouteUrls.forEach((url) => {
      routes[url].timestamp = 0;
    });

    if (nonSSRRouteUrls.length > 0) {
      return idb.put(idb.stores.init, 'routes', routes)
        .then(() => {
          return caches.open(toolbox.options.cache.name);
        })
        .then((cache) => {
          return Promise.all(
            nonSSRRouteUrls.map((url) => {
              return cache.delete(new Request(url), {
                ignoreSearch: true, ignoreMethod: true, ignoreVary: true
              });
            })
          );
        });
    }

    return Promise.resolve([]);
  });
}

/**
 * Determine if server-side render should be requested.
 * Server-side render should be requested if no browser present
 * (and can't determine JS ability) OR if a browser does not respond to ping
 * message (presumes a client has no-js).
 *
 * If SSR required, remove and invalidate the non-SSR routes.
 * Forces network request and cache population with SSR versions.
 *
 * @see #98
 *
 * @param {Boolean} startup - True if called from startup, false otherwise.
 * @returns {Promise} resolves to '1' if server-side render should happen,
 * '0' otherwise.
 */
function determineServerSideRender (startup) {
  if (!startup) {
    debug('JS in effect, no SSR required');
    // If not startup, then JS is happening, so SSR not needed.
    return Promise.resolve(0);
  }

  return clients.matchAll({
    type: 'window'
  })
    .then((windowClients) => {
      if (windowClients.length > 0) {
        return Promise.all(
          windowClients.map((windowClient) => {
            return new Promise((resolve) => {
              const timeout = setTimeout(resolve, pingTimeout, 1),
                messageChannel = new MessageChannel();

              messageChannel.port1.onmessage = (event) => {
                if (event.data.message === 'pong') {
                  debug('Got ping response');
                  clearTimeout(timeout);
                  // Got ping response, so NO server side render req'd
                  resolve(0);
                }
              };

              windowClient.postMessage({
                command: 'ping',
                port: messageChannel.port2
              }, [messageChannel.port2]);
            });
          })
        ).then(function(results) {
          const serverSideRender = results.indexOf(1) > -1 ? 1 : 0;

          return removeAndInvalidateNonSSRRoutes().then(() => {
            return serverSideRender;
          });
        });
      }

      debug('no clients found to determine server side render');
      return 1;
    });
}

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
 * @param {Number} serverSideRender - [0 or 1], 1 means should render on server.
 * @param {Object|String} request - The network Request or url string.
 * @returns String of the new request url.
 */
function networkRequest (serverSideRender, request) {
  const url =
    addOrReplaceUrlSearchParameter(
      (typeof request !== 'string') ? request.url : request,
      'render',
      '' + serverSideRender
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
 * @param {Boolean} serverSideRender - [0 or 1] 1 means serverSideRender.
 * @param {Request} request - The request of the successful network fetch.
 * @param {Response} response - The response of the successful network fetch.
 * @returns {Promise} A Promise resolving to the input response.
 */
function addRecentRoute (serverSideRender, request, response) {
  return idb.get(idb.stores.init, 'routes').then((routes = {}) => {
    const url = (new URL(request.url, location.origin)).pathname;

    routes[url] = routes[url] || {};
    routes[url].timestamp = Date.now();
    routes[url].ssr = serverSideRender === 1;

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
      const age = Date.now() - routes[url].timestamp;

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
 * @param {Number} serverSideRender - The server side render value (1 for SSR).
 * @param {String} url - The url to cache and install.
 * @returns {Promise} A Promise resolving on success (no sig value).
 */
function cacheAndInstallRoute (serverSideRender, url) {
  debug('cache route', url);

  // This has to happen regardless of the precache outcome, so don't wait.
  installRouteGetHandler(serverSideRender, url);

  // Must handle errors here, precache error is irrelevant beyond here.
  return contentRace(networkRequest(serverSideRender, url), url, null, {
    successHandler: addRecentRoute.bind(null, serverSideRender)
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
 * @param {Number} serverSideRender - The server side render value (1 for SSR).
 * @param {String} url - The url to install route GET handler on.
 * @returns {Promise} Resolves to undefined when complete.
 */
function installRouteGetHandler (serverSideRender, url) {
  debug('install route GET handler on', url);

  toolbox.router.get(url, routeHandlerFactory(
    networkRequest.bind(null, serverSideRender), cacheRequest
  ), {
    debug: toolbox.options.debug,
    successHandler: addRecentRoute.bind(null, serverSideRender)
  });

  return Promise.resolve();
}

/**
 * What this does:
 * 1. Fetch the mainNav routes of the application and update the cache with the
 * responses.
 * 2. Install route handlers for all the main nav routes.
 *
 * The route GET handler will be the start of a main navigation entry point for
 * the application. It will be fetched and cached from the network, unless
 * offline.
 * The page returned, will cause an 'init' command to execute again, along with
 * this method.
 *
 * So, to prevent a route from being fetched and cached twice, a TTL scheme
 * (add/getRecentRoute) is used to keep track of routes recently
 * fetched and cached from the route GET handler.
 *
 * @param {Object} payload - The stores container.
 * @param {Object} payload.RouteStore.routes - The routes of the application.
 * @param {Boolean} startup - True if called from sw startup, false otherwise.
 * @returns {Promise} Resolves to array of all installed route promises.
 */
export default function cacheRoutes (payload, startup) {
  const routes = payload.RouteStore.routes;

  debug('received routes', routes);

  return determineServerSideRender(startup)
    .then((serverSideRender) => {
      return Promise.all(Object.keys(routes).map((route) => {
        if (routes[route].mainNav) {
          const url = routes[route].path;

          return getRecentRoute(url).then((skipCache) => {
            if (skipCache) {
              return installRouteGetHandler(serverSideRender, url);
            }
            return cacheAndInstallRoute(serverSideRender, url);
          }).catch((error) => {
            debug('failed to get recentRoute', error);
            return cacheAndInstallRoute(serverSideRender, url);
          });
        }

        return Promise.resolve();
      }));
    });
}
