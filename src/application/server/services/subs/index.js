/***
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * subscription model:
 * - {String} subscriptionId
 * - {String} endpoint
 * - {Array} topics
 *   - {Boolean} subscribed
 *   - {String} tag
 *   - {String} label
 */
import debugLib from 'debug';
import data from '../data';

const debug = debugLib('services:subs');

// FIXME:
// Subscription storage should not be in this process in a real application.
// This is particularly fatal for subs, because browser sub state will be out
// of sync with the server.
const subscriptions = {};

/**
 * Create a new push notification subscription.
 * Initially subscribes to all topics.
 *
 * @param {String} subscriptionId - The user's subscriptionId.
 * @param {String} endpoint - The user's push service endpoint.
 * @param {Function} callback - Called on completion.
 */
export function create (subscriptionId, endpoint, callback) {
  if (!subscriptionId || !endpoint) {
    debug('create: Bad subscriptionId or endpoint supplied');
    return callback(new Error ('Bad subscriptionId or endpoint supplied'));
  }

  if (subscriptions[subscriptionId]) {
    debug('create: subscriptionId already exists');
    return callback(new Error('subscriptionId already exists'));
  }

  data.fetch({
    resource: 'settings'
  }, (err, payload) => {
    debug('create: fetch settings: ', err, payload);

    if (err) {
      return callback(err);
    }

    const topics = payload.content.pushNotifications.topics.map(function (topic) {
      topic.subscribed = true;
      return topic;
    });

    subscriptions[subscriptionId] = {
      subscriptionId: subscriptionId,
      endpoint: endpoint,
      topics: topics
    };

    return callback(null, topics);
  });
}

/**
 * Read push notification topics for a subscription.
 * If no subscription id supplied, or subscription not found, return all available topics.
 *
 * @param {String} [subscriptionId] - The user's subscription ID.
 * @param {Function} callback - Called on completion.
 */
export function read (subscriptionId, callback) {
  if (subscriptionId) {
    const subscription =  subscriptions[subscriptionId];

    if (subscription) {
      debug('read: subscription topics found', subscriptions[subscriptionId].topics);
      return callback(null, subscriptions[subscriptionId].topics);
    }
  }

  data.fetch({
    resource: 'settings'
  }, (err, payload) => {
    debug('read: fetch settings: ', err, payload);

    if (err) {
      return callback(err);
    }

    return callback(null, payload.content.pushNotifications.topics);
  });
}

/**
 * Update push notification topics subscribed to.
 * TODO: Update subscriptionId for subscription synchronization support.
 *
 * @param {String} subscriptionId - The subscription ID of a user.
 * @param {Array} [updateTopics] - The topics to update subscription of.
 * @param {String} [endpoint] - Optional endpoint to update the subscriber to.
 * @param {String} [newId] - Optional new subscription ID to update to.
 * @param {Function} callback - Called on completion.
 */
export function update (subscriptionId, updateTopics, endpoint, newId, callback) {
  const subscription = subscriptions[subscriptionId];

  if (!subscription) {
    debug(`update: No subscription found for ${subscriptionId}`);
    return callback(new Error(`No subscription found for ${subscriptionId}`));
  }

  if (newId) {
    if (subscriptions[newId]) {
      debug('update: newId already exists, cannot update');
      return callback(new Error(`newId already exists for ${newId}`));
    }
    delete subscriptions[subscriptionId];
    subscriptions[newId] = subscription;
    subscription.subscriptionId = newId;
    debug(`update: updated subscriptionId from ${subscriptionId} to ${newId}`);
  }

  subscription.endpoint = endpoint || subscription.endpoint;
  debug(`update: updated endpoint = ${!!endpoint}`);

  if (updateTopics) {
    subscription.topics.forEach(function (subscribedTopic) {
      const updates = updateTopics.filter(function (updateTopic) {
        return subscribedTopic.tag === updateTopic.tag;
      });

      if (updates && updates.length > 0) {
        debug(`update: ${subscribedTopic.label} updated, subscribe = ${updates[0].subscribed}`);

        // first update wins.
        subscribedTopic.subscribed = updates[0].subscribed;
      }
    });
  }

  return callback(null, subscription.topics);
}

/**
 * Unsubscribe a user from push notifications.
 *
 * @param {String} subscriptionId - The subscription ID of a user.
 * @param {Function} callback - Called on completion.
 */
function unsubscribe (subscriptionId, callback) {
  if (!subscriptions[subscriptionId]) {
    debug(`unsubscribe: No subscription found for ${subscriptionId}`);
    return callback(new Error(`No subscription found for ${subscriptionId}`));
  }

  delete subscriptions[subscriptionId];

  debug(`unsubscribe: deleted subscription ${subscriptionId}`);
  return callback();
}
export { unsubscribe as delete };

/**
 * Get all subscriptions
 */
export function getSubscriptions () {
  return subscriptions;
}

export default {
  create,
  read,
  update,
  delete: unsubscribe,
  getSubscriptions
}
