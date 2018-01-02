/***
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Module to contain sync filters.
 */
import syncable from 'utils/syncable';
import property from 'utils/property';

export const getFallback = property.find.bind(null, syncable.propertyName);
export const getPropertyByName = property.find;

/**
 * Get latest of type and operation for each unique key or prop.
 * Requests are 'classified' by type and operation. Each classification can
 * belong to a unique key or alternatively, a unique property value.
 *
 * Using Optional prop
 * The optional prop is supplied if the caller wants to not use fallback.key
 * to determine request uniqueness AND instead needs to use a custom property
 * value defined in the request body to determine request uniqueness within
 * one request type/operation (aka request 'class' or 'classification').
 *
 * Eliminating key uniqueness
 * Key can be removed from this filtering scheme altogether by making it always
 * the same value for a particular type/operation.
 *
 * Multiple Operations Set Input
 * If you supply multiple operations, the latest match in the op set will
 * win. Example: [subscribe, unsubscribe] will match the most recent of either
 * subscribe or unsubscribe. So, if there were a bunch of sub/unsub requests,
 * the last one will be the one that is replayed representing that 'class' of
 * request.
 *
 * TODO: Make fallback keys functional across request types
 * Practically, the key matching will only matter for contact requests, where the
 * 'key' is the replyToEmail. To make this also work for push type requests,
 * push subscription updates need to change all deferred requests' keys to the
 * new subscribeId as key AFTER the change is synchronized on the server.
 * subscription updates will have to take top priority (be processed first)
 * for 'push' type requests. While the priority ordering of push type requests
 * must remain (because an subscriptionId update changes everything and
 * the subscriptionId in the push request payloads of deferred requests will
 * need updating), the fallback.key complication could be avoided by just making
 * all push type requests use the same arbitrary key value
 * (like '9', for example), effectively removing the fallback key criterion
 * from push request types.
 *
 * @param {Array} dehydratedRequests - The dehydrated requests to search.
 * @param {String} type - The type to match against.
 * @param {Array} operations - Set of operations to match against, finds latest one.
 * @param {String} [prop] - A prop in the request to find and match against
 * for uniqueness. If omitted, uses key for uniqueness.
 * @returns {Array} The latest of type and operation, each unique key.
 */
function latestTypeAndOperation (dehydratedRequests, type, operations, prop) {
  const vals = [], keys = [],
    propFind = prop && property.find.bind(null, prop);

  return dehydratedRequests
    .sort((a, b) => {
      return (a.timestamp - b.timestamp) * -1; // descending order (latest first)
    })
    .filter((req) => {
      const fallback = req.fallback;
      const propVal = prop && propFind(req);

      // Match type and operation (operaion match is any one of given set).
      // Then, unique key or unqiue custom prop val.
      if (fallback.type === type &&
          operations.indexOf(fallback.operation) !== -1 &&
          (prop || keys.indexOf(fallback.key) === -1) &&
          (!prop || (propVal && vals.indexOf(propVal) === -1))) {
        keys.push(fallback.key);
        propVal && vals.push(propVal);
        return true;
      }

      return false;
    });
}
export { latestTypeAndOperation as latest }

/**
 * Return array of dehydrated requests that match type, one of a given
 * set of operations, and an optional key.
 *
 * @param {Array} dehydratedRequests - The dehydrated requests to search.
 * @param {String} type - The type to match against.
 * @param {Array} operations - The operations to match against.
 * @param {String} [key] - The key to match against.
 * @returns {Array} The array of dehydratedRequests that match the criteria.
 */
function typeAndOperation (dehydratedRequests, type, operations, key) {
  return dehydratedRequests.filter((req) => {
    const fallback = req.fallback;

    return (fallback.type === type &&
            operations.indexOf(fallback.operation) !== -1 &&
            (!key || fallback.key === key));
  });
}
export { typeAndOperation as match }

/**
 * Return array of dehydrated requests from source that aren't in exclusions.
 *
 * Uses request.timestamp to make the identifying distinction.
 * Request.timestamp is the timestamp at original deferral time.
 *
 * @param {Array} source - The source array of dehydrated Requests.
 * @param {Array} exclusions - The array of dehydrated requests to be excluded.
 * @returns {Array} The dehydrated requests from source that are not in
 * exclusions.
 */
export function without (source, exclusions) {
  const excludedTimestamps = exclusions.map((req) => {
    return req.timestamp;
  });

  return source.filter((req) => {
    return excludedTimestamps.indexOf(req.timestamp) === -1;
  });
}
