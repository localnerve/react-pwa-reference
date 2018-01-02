/***
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Synchronize push subscription.
 */
/* global Promise, fetch */
import syncable from 'utils/syncable';
import * as sync from './index';
import * as serviceable from './serviceable';
import debugLib from 'sw/utils/debug';
import * as idb from 'sw/utils/idb';
import { createRequestBody } from 'sw/utils/api';
import { rehydrateRequest } from 'sw/utils/requests';

const debug = debugLib('sync:push');
const subscriptionService = '/_api';

/**
 * Get the existing subscriptionId and apiInfo for the subscription service.
 *
 * Determines if the existingId is an id and different than
 * the given suscriptionId.
 * If the existingId is an id and different, gets the apiInfo for the
 * subscriptionService.
 *
 * @private
 *
 * @param {String} subscriptionId - The new or existing subscriptionId.
 * @returns {Promise} resolves to object containing:
 *  {String} existingId - The existing subscriptionId, falsy if none found.
 *  {Object} apiInfo - The apiInfo for the subscription service, falsy if an
 *  api call should not be made.
 */
function getSubscriptionInfo (subscriptionId) {
  const result = {};

  return idb.get(idb.stores.state, 'subscriptionId')
    .then((existingId) => {
      result.existingId = existingId;

      if (existingId && subscriptionId !== existingId) {
        debug('reading init.apis');
        return idb.get(idb.stores.init, 'apis');
      }
    })
    .then((apis) => {
      if (apis) {
        result.apiInfo = apis[subscriptionService];
        if (!result.apiInfo) {
          throw new Error('subscription service api info not found');
        }
      }
      return result;
    });
}

/**
 * Synchronize the given subscriptionId with IndexedDB and subscription
 * service.
 *
 * If no subscriptionId stored, store the subscriptionId.
 * If the given subscriptionId is different than stored, update storage and
 *   subscription service.
 * If no change, no action performed.
 *
 * @param {String} subscriptionId - The new or existing subscriptionId.
 * If falsy, then deletes the existing subscriptionId from IndexedDB.
 * @returns {Promise} Resolves to undefined for del, Response, or false if no request was/will be made.
 */
function synchronizePushSubscription (subscriptionId) {
  let apiInfo, requestState, existingId;

  debug('synchronize push subscription', subscriptionId);

  if (!subscriptionId) {
    return idb.del(idb.stores.state, 'subscriptionId');
  }

  return getSubscriptionInfo(subscriptionId)
    .then((result) => {
      apiInfo = result.apiInfo;
      existingId = result.existingId;

      if (apiInfo) {
        requestState = {
          url: apiInfo.xhrPath,
          method: 'POST',
          bodyType: 'json',
          body: createRequestBody(apiInfo.xhrContext, {
            body: {},
            operation: 'update',
            params: {
              subscriptionId: existingId,
              newId: subscriptionId
            },
            resource: 'subscription'
          })
        };

        return fetch(rehydrateRequest(requestState, apiInfo));
      }
    })
    .then((resp) => {
      const response = resp || {};
      const updateSubscriptionId = !existingId || response.ok;

      // If subscription not found or service successfully updated, update
      // subscriptionId in IndexedDB.
      if (updateSubscriptionId) {
        return Promise
          .all([
            serviceable.updatePushSubscription(response.ok && subscriptionId),
            idb.put(idb.stores.state, 'subscriptionId', subscriptionId)
          ])
          .then(() => {
            debug('successfully updated subscriptionId');
            return resp ? response : false;
          });
      }

      if (response.ok === false) {
        debug(`fetch failed (${response.status}), ${response.statusText}`);

        // Add syncable property to body
        requestState.body = syncable.push(
          requestState.body,
          subscriptionId,
          syncable.ops.updateSubscription
        );

        return sync.deferRequest(
          subscriptionService,
          rehydrateRequest(requestState, apiInfo)
        );
      }
    });
}
export { synchronizePushSubscription as synchronize }
