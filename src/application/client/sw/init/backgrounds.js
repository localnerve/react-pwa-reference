/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Handling for background image requests.
 */
/* global Promise, Request, caches */
import toolbox from 'sw-toolbox';
import urlm from 'utils/urls';
import debugLib from 'sw/utils/debug';

const debug = debugLib('init:backgrounds');

/**
 * Escape a string for usage in a regular expression.
 */
function regexEscape(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Precache a request if the response does NOT exist.
 *
 * @param {Object} options - options to accompany the cache operation.
 * @param {Object} req - The Request object to cache.
 * @param {Object} res - The Response object, if null, Request should be cached.
 */
function precacheBackground (options, req, res) {
  if (!res) {
    debug('precaching background', req);
    return toolbox.cache(req.clone(), options);
  }
  return Promise.resolve();
}

/**
 * A precaching read-thru cache
 * When a background request comes in, checks against the other backgrounds.
 * If one or more of the other backgrounds is not in the cache, fetch and cache
 * them right now.
 * Serve the current background request, updating the cache as you go.
 *
 * @param {Object} backgroundUrls - The backgroundUrls used to init
 * BackgroundStore.
 * @param {Object} request - A Request object
 * @param {Object} values - Ignored, passed on to the strategy.
 * @param {Object} options - The router options.
 */
function precacheBackgrounds (backgroundUrls, request, values, options) {
  // precache/prefetch backgrounds that will be needed next that are not
  // already cached.
  // NOTE: This is an async side-effect - we don't wait for (or handle) the
  // result.
  Promise.all(Object.keys(backgroundUrls).map((key) => {
    const background = urlm.getLastPathSegment(backgroundUrls[key]),
      current = urlm.getLastPathSegment(request.url);

    if (current && background && current !== background) {
      // build the request for the next background
      const reCurrent = new RegExp('(' + regexEscape(current) + ')(\/)?$');
      const notCurrent = request.url.replace(reCurrent, background + '$2');
      const reqNotCurrent = new Request(notCurrent, {
        mode: 'no-cors' // these are from a cdn
      });

      // if reqNotCurrent not in cache, a falsy response will be given to
      // precacheBackground.
      return caches.open(toolbox.options.cache.name).then((cache) => {
        return cache.match(reqNotCurrent).then(
          precacheBackground.bind(null, options, reqNotCurrent)
        );
      });
    }
  })).catch((error) => {
    debug('Error prefetching next backgrounds:', error);
  });

  return toolbox.fastest(request, values, options);
}

/**
 * Cache background images for the app
 *
 * @param {Object} payload - The stores payload object.
 * @param {Object} payload.BackgroundStore - The dehydrated BackgroundStore.
 * @param {Object} payload.BackgroundStore.backgroundUrls - The background urls
 * object, containing name-values for backgrounds at imageServiceUrl.
 * @param {String} payload.BackgroundStore.imageServiceUrl - The url to the
 * image service.
 */
export default function backgroundHandler (payload) {
  const backgroundStore = payload.BackgroundStore;

  debug('install background image handler', backgroundStore);

  // Install a precaching, read-thru cache on all requests to the background
  // image service
  toolbox.router.get('*',
    precacheBackgrounds.bind(null, backgroundStore.backgroundUrls), {
      debug: toolbox.options.debug,
      origin: urlm.getHostname(backgroundStore.imageServiceUrl)
    }
  );

  // Nothing deferred (yet), so return a resolved Promise
  return Promise.resolve();
}
