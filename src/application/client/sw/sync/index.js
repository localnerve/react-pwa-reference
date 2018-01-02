/***
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file
 * for terms.
 *
 * Module to contain sync operations.
 */
/* global Blob, Promise, Request, Response, fetch, self */
import toolbox from 'sw-toolbox';
import * as filters from './filters';
import * as serviceable from './serviceable';
import * as idb from 'sw/utils/idb';
import debugLib from 'sw/utils/debug';
import { dehydrateRequest, rehydrateRequest } from 'sw/utils/requests';
import { createXHRContextFromText } from 'sw/utils/api';

const debug = debugLib('sync:index');

/***
 * The maximum number of times a single request fail synchronization.
 * This is incremented on a request when a synchronization attempt fails.
 * @see serviceAllRequests
 */
export const MAX_FAILURES = 3;

/***
 * Synchronization operations.
 *
 * Add operations here to direct sync event handling.
 */
const OPERATIONS = {
  delimiter: ':',
  deferredRequests: 'deferredRequests'
};
export { OPERATIONS as _ops }

/**
 * Defer a request until later by storing it in IndexedDB.
 * This is called if the fetch fails.
 * Register one-off sync if available.
 *
 * NOTE:
 * 1. Stores the old csrf token in the url. Replaced when serviced later.
 * @see serviceOneRequest
 *
 * @param {String} apiPath - The key used to service the requests in proper xhrContext.
 * @param {Object} request - A Request object to use to make the post request.
 * @returns {Promise} Resolves to a Response with a status of 203 or 400.
 */
export function deferRequest (apiPath, request) {
  const hasSync = !!self.registration.sync;

  return dehydrateRequest(request, 'json').then((dehydratedRequest) => {
    // This is THE source of the deferred request timestamp.
    const timestamp = Date.now().toString(),
      fallback = filters.getFallback(dehydratedRequest.body, true) || {};

    // Store the timestamp with the value for easier management in serviceAllRequests.
    dehydratedRequest.timestamp = timestamp;

    // Store the apiPath with the value to allow the request to be serviced
    // in the proper xhrContext in serviceAllRequests.
    dehydratedRequest.apiPath = apiPath;

    // Keep the fallback processing directives at the top level.
    dehydratedRequest.fallback = fallback;

    // Add it to IndexedDB.
    return idb.put(idb.stores.requests, timestamp, dehydratedRequest)
      .then(() => {
        // If no sync and user replayable, show user a failure.
        const shouldSucceed = hasSync || !fallback.userReplayable,
          status = {
            code: 400,
            text: 'failed'
          };

        // Otherwise, it should succeed.
        // So, defer and register for a one-off background-sync if possible.
        if (shouldSucceed) {
          status.code = 203;
          status.text = 'deferred';

          if (hasSync) {
            return self.registration.sync.register([
              OPERATIONS.deferredRequests,
              apiPath
            ].join(OPERATIONS.delimiter))
              .catch((error) => {
                debug('sync register failed ', error);
              })
              // Always succeed.
              .then(() => {
                return status;
              });
          }
        }

        return status;
      })
      .then((status) => {
        return new Response(null, {
          status: status.code,
          statusText: status.text
        });
      });
  });
}

/**
 * Maintain deferred requests.
 *
 * Passes through the given Response, but maintains the deferred requests as
 * a side-effect.
 *
 * Intended to be used on successful network fetch (as a successHandler) to
 * manually remove deferred requests to avoid unintended synchronization.
 *
 * Use case: A user request succeeds that renders prior deferred requests
 *  unwarranted/irrelevant/dangerous/etc.
 *
 * @param {Request} req - ignored.
 * @param {Response} res - passed through on success.
 * @param {Request} reqToCache - A clone of the Request that succeeded
 * on the network that would be used for caching and contains a fallback object.
 * @returns {Promise} Resolves to the Response on success.
 */
export function maintainRequests (req, res, reqToCache) {
  return idb.all(idb.stores.requests).then((dehydratedRequests) => {
    const request = reqToCache.clone();

    return request.json().then((body) => {
      return serviceable.pruneRequestsByPolicy(
        dehydratedRequests,
        filters.getFallback(body),
        body
      );
    });
  }).then(() => {
    return res;
  });
}

/**
 * Remove a fallback object (if found) from request and clone.
 *
 * @param {Object} options - Request init options to create with.
 * @param {Request} request - The request to clone.
 * @returns {Promise} Resolves to a request clone with options and
 * fallback object removed.
 */
export function removeFallback (options, request) {
  const req = request.clone();

  return req.json().then((body) => {
    // Remove the fallback object from the body
    filters.getFallback(body, true);

    return new Request(req.url, Object.assign({
      method: req.method,
      headers: req.headers,
      body: new Blob([JSON.stringify(body)], {
        type: 'application/json'
      }),
      mode: req.mode,
      credentials: req.credentials,
      cache: req.cache,
      referrer: req.referrer
    }, options));
  });
}

/**
 * Deal with an abandoned deferred request that will not be processed again.
 * This is just a placeholder.
 *
 * @private
 *
 * @param {Object} dehydratedRequest - The request that was abandoned.
 * @return {Promise} Resolves to undefined when complete.
 */
function manageAbandonedRequest (dehydratedRequest) {
  debug('TODO: manage abandoned request', dehydratedRequest);
  return Promise.resolve();
}

/**
 * Service (synchronize, replay, etc.) one deferred request.
 *
 * Throws exception if apiInfo not found in supplied apis object.
 * If a deferred request synchronization succeeds, it is removed from storage.
 * If a deferred request fails to sync more than MAX_FAILURES, it is abandoned.
 *
 * @private
 *
 * @param {Object} dehydratedRequest - A dehydrated request.
 * @param {Number|String} dehydratedRequest.timestamp - The request timestamp.
 * @param {String} dehydratedRequest.apiPath - The api path for the request.
 * @param {Object} apis - An object of apiInfos, keyed by apiPath.
 * @param {Object} [options] - Options object.
 * @param {RegExp} [options.successResponses] - Custom definition of http
 * success status.
 * @param {Boolean} [options.noManage] - If truthy, don't manage fetch failure.
 * @returns {Promise} Resolves to undefined on success or continued deferral.
 * Resolves to the dehydratedRequest with updated failureCount on abandonment.
 */
function serviceOneRequest (dehydratedRequest, apis, options = {}) {
  const
    timestamp = dehydratedRequest.timestamp,
    apiInfo = apis[dehydratedRequest.apiPath],
    successResponses =
      options.successResponses || toolbox.options.successResponses;

  // apiInfo found for this request
  if (apiInfo) {
    // Rehydrate the request with up-to-date CSRF token.
    const req = rehydrateRequest(dehydratedRequest, apiInfo);

    // Make the network request, delete the stored request on success.
    return fetch(req)
      .then((response) => {
        if (successResponses.test(response.status)) {
          debug('successful request sync', req);
          return idb.del(idb.stores.requests, timestamp);
        }
        throw response;
      })
      .catch((error) => {
        if (options.noManage) {
          return Promise.reject(error);
        }

        debug('network failure', error);

        // Abandonment case, 1 based failureCount - but inc'd after this
        // so count >= MAX_FAILURES (first is undef).
        if (dehydratedRequest.failureCount &&
            dehydratedRequest.failureCount >= MAX_FAILURES) {
          debug('request ABANDONED after MAX_FAILURES', dehydratedRequest);

          return manageAbandonedRequest(dehydratedRequest)
            .then(() => {
              return idb.del(idb.stores.requests, timestamp);
            })
            .then(() => {
              // Resolve to the abandoned dehydratedRequest.
              return dehydratedRequest;
            });
        }

        // Maintain failure count.
        dehydratedRequest.failureCount =
          (dehydratedRequest.failureCount || 0) + 1;

        // Update the stored dehydratedRequest (continue deferral)
        return idb.put(idb.stores.requests, timestamp, dehydratedRequest);
      });
  }

  // No apiInfo found for dehydratedRequest.apiPath
  throw new Error(`API Info for ${dehydratedRequest.apiPath} not found`);
}

/**
 * Service all servicable deferred requests stored in IndexedDB requests.
 *
 * `serviceable`, means ordered and filtered deferred requests for delayed
 * processing in a way that mantains application consistency.
 * @see ./serviceable.js
 *
 * If a deferred request is deemed not serviceable, it is removed from storage.
 *
 * serviceAllRequests runs from one-off sync and the init command in the case
 * that sync not supported.
 *
 * @param {Object} apis - The application apis object.
 * @param {Object} [options] - Options object.
 * @param {RegExp} [options.successResponses] - Custom definition of http
 * success status.
 * @returns A Promise that resolves on all synchronization outcomes, rejects on
 * first failure (Promise.all).
 */
export function serviceAllRequests (apis, options = {}) {
  return idb.all(idb.stores.requests)
    .then((allRequests) => {
      return serviceable.getRequests(allRequests)
        .then((serviceableRequests) => {
          return serviceable.pruneRequests(allRequests, serviceableRequests)
            .then(() => {
              return serviceableRequests;
            });
        });
    })
    .then((serviceableRequests) => {
      return Promise.all(
        serviceableRequests.map((dehydratedRequest) => {
          return serviceOneRequest(dehydratedRequest, apis, options);
        })
      );
    });
}

/**
 * Handle the one-off sync event.
 *
 * NOTE: lastChance is not handled. Deferred requests remain in IndexedDB
 * for manual processing by the `init` message, which tracks and handles
 * abandonment.
 * For application items more urgent, abandonment should be handled here, too.
 * @see serviceOneRequest
 *
 * For OPERATIONS.deferredRequests:
 * 1. Fetch valid credentials.
 *    NOTE: Fetch must be on the same origin as apiPath to get credentials.
 *          However, this implementation assumes:
 *          a. All dehydratedRequest.apiPaths are on this origin.
 *          b. url csrf tokens are in the cookie and responseText.
 * 2. Service all deferred requests.
 */
self.addEventListener('sync', (event) => {
  const eventParts = event.tag.split(OPERATIONS.delimiter),
    eventOperation = eventParts[0],
    eventDetail = eventParts[1];

  debug(`sync event, op ${eventOperation} detail`, eventDetail);

  if (eventOperation === OPERATIONS.deferredRequests) {
    const apiPath = eventDetail;
    const apiPathTest = apiPath
      ? Promise.resolve()
      : Promise.reject(new Error('bad apiPath supplied'));

    event.waitUntil(
      apiPathTest
        .then(() => {
          return fetch('/?render=0', {
            credentials: 'include'
          });
        })
        .then((response) => {
          if (response.ok) {
            return response.text();
          }
          throw new Error('sync event bad GET response');
        })
        .then((text) => {
          const apis = {
            [apiPath]: {
              xhrContext: createXHRContextFromText(text)
            }
          };

          return serviceAllRequests(apis, {
            noManage: true
          });
        })
    );
  }
});
