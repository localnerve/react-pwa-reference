/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * A Yahoo fetchr service definition for push notification subscriptions.
 */
import subs from './subs';
import error from './error';

export const name = 'subscription';

/**
 * Create a subscription.
 *
 * @param {Object} req - Not used.
 * @param {String} resource - Not used.
 * @param {Object} params - subscriptionId and endpoint.
 * @param {Object} body - Not used.
 * @param {Object} config - Not used.
 * @param {Function} callback - The callback to execute on completion.
 */
export function create (req, resource, params, body, config, callback) {
  return subs.create(
    params.subscriptionId,
    params.endpoint,
    (err, data) => {
      callback(error(err), data);
    }
  );
}

/**
 * Read a subscription.
 *
 * @param {Object} req - Not used.
 * @param {String} resource - Not used.
 * @param {Object} params - subscriptionId.
 * @param {Object} config - Not used.
 * @param {Function} callback - The callback to execute on completion.
 */
export function read (req, resource, params, config, callback) {
  return subs.read(
    params.subscriptionId,
    (err, data) => {
      callback(error(err), data);
    }
  );
}

/**
 * Update a subscription.
 *
 * @param {Object} req - Not used.
 * @param {String} resource - Not used.
 * @param {Object} params - Request parameters.
 * @param {String} params.subscriptionId - The subscriptionId to update.
 * @param {String} params.endpoint - The subscription endpoint.
 * @param {String} [params.newId] - The new subscriptionId.
 * @param {Object} body - Request body.
 * @param {Array} [body.topics] - subscription topics.
 * @param {Object} config - Not used.
 * @param {Function} callback - The callback to execute on completion.
 */
export function update (req, resource, params, body, config, callback) {
  return subs.update(
    params.subscriptionId,
    body.topics,
    params.endpoint,
    params.newId,
    (err, data) => {
      callback(error(err), data);
    }
  );
}

/**
 * Delete a subscription.
 *
 * @param {Object} req - Not used.
 * @param {String} resource - Not used.
 * @param {Object} params - subscriptionId.
 * @param {Object} config - Not used.
 * @param {Function} callback - The callback to execute on completion.
 */
function deleteSub (req, resource, params, config, callback) {
  return subs.delete(
    params.subscriptionId,
    (err, data) => {
      callback(error(err), data);
    }
  );
}
export { deleteSub as delete };

export default {
  name,
  create,
  read,
  update,
  delete: deleteSub
};
