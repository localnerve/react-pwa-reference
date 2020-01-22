/**
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global window */
import debugLib from 'debug';
import { getSubscriptionId } from 'utils/push';
import syncable from 'utils/syncable';
import messages from 'utils/messages';

const debug = debugLib('actions:push');
const __test__ = __TEST__; // eslint-disable-line no-undef

/**
 * The send push action.
 * This is for in-app demonstration only.
 *
 * @param {Object} context - The fluxible action context.
 * @param {Object} payload - The action payload.
 * @param {Object} payload.subscription - The push subscription.
 * @param {Function} done - The callback to execute on action completion.
 */
export function demoSend (context, payload, done) {
  debug('performing demo send push notification', payload);

  const subscriptionId = getSubscriptionId(payload.subscription);

  context.service.create('push', syncable.push({
    subscriptionId: subscriptionId,
    endpoint: payload.subscription.endpoint
  }, subscriptionId, syncable.ops.demo), {}, {}, (err) => {
    debug('completed push', err);
    if (err) {
      return done(err);
    }
    return done();
  });
}

/**
 * Subscribe to push notifications.
 *
 * @param {Object} context - The fluxible action context.
 * @param {Object} payload - ignored, except for testing.
 * @param {Function} done - The callback to execute on action completion.
 */
export function subscribe (context, payload, done) {
  debug('subscribing to push notifications');

  context.dispatch('SETTINGS_TRANSITION', {
    pushSubscription: true
  });

  /**
   * complete subscribe.
   */
  function complete (error, subscription, topics) {
    debug('subscribe complete', error, subscription, topics);

    context.dispatch('SETTINGS_STATE', {
      pushTopics: error ? null : topics,
      pushSubscription: subscription,
      pushSubscriptionError: error
    });

    return done(error);
  }

  window.navigator.serviceWorker.ready.then((registration) => {
    registration.pushManager.subscribe({
      userVisibleOnly: true
    }).then((subscription) => {
      debug('browser subscribed', subscription);

      const params = {
        subscriptionId: getSubscriptionId(subscription),
        endpoint: subscription.endpoint
      };

      if (__test__) {
        params.emulateError = payload && payload.emulateError;
      }

      return messages.workerSendMessage({
        command: 'pushSync',
        payload: {
          subscriptionId: params.subscriptionId
        }
      }).then(() => {
        context.service.create('subscription', syncable.push(
          params, params.subscriptionId, syncable.ops.subscribe
        ), {}, {}, (err, data) => {
          if (err) {
            messages.workerSendMessage({
              command: 'pushSync',
              payload: {
                subscriptionId: false
              }
            });
          }
          complete(err, subscription, data);
        });
      }).catch((error) => {
        debug('pushSync message failed ', error);
        complete(error, null, null);
      });
    }).catch((error) => {
      const settingsStore = context.getStore('SettingsStore'),
        hasPermissions = settingsStore.getHasPermissions();

      if (hasPermissions) {
        window.navigator.permissions.query({
          name: 'push',
          userVisibleOnly: true
        })
          .then((permissionState) => {
            debug(
              'subscribe error',
              error,
              ' push permissions state ',
              permissionState
            );
            if (permissionState.state === 'prompt') {
              error = new Error('Must accept the permission prompt');
            } else if (permissionState.state === 'denied') {
              error = new Error('User blocked notifications');
            }
          })
          .catch((error2) => {
            debug('subscribe error', error, ' permissions error ', error2);
          })
          .then(() => {
            complete(error, null, null);
          });
      } else {
        debug('subscribe error', error);
        debug('hasNotifications', settingsStore.getHasNotifications());

        if (settingsStore.getHasNotifications()) {
          debug(
            'subscribe error',
            error,
            ' Notification permission ',
            window.Notification.permission
          );
        }

        complete(error, null, null);
      }
    });
  });
}

/**
 * Unsubscribe from push notifications.
 *
 * @param {Object} context - The fluxible action context.
 * @param {Object} payload - ignored, except for testing.
 * @param {Function} done - The callback to execute on action completion.
 */
export function unsubscribe (context, payload, done) {
  debug('unsubscribing from push notifications', payload);

  context.dispatch('SETTINGS_TRANSITION', {
    pushSubscription: true
  });

  /**
   * complete unsubscribe
   */
  function complete (error) {
    debug('unsubscribe complete', error);

    const params = {
      pushSubscriptionError: error
    };

    if (!error) {
      params.pushSubscription = null;
      params.pushTopics = null;
    }

    context.dispatch('SETTINGS_STATE', params);
    return done(error);
  }

  window.navigator.serviceWorker.ready.then((registration) => {
    registration.pushManager.getSubscription().then((pushSubscription) => {
      debug('got push subscription', pushSubscription);

      const subscription = pushSubscription ||
        context.getStore('SettingsStore').getPushSubscription();

      debug('subscription to unsubscribe', subscription);

      if (!subscription) {
        return complete(new Error('Subscription not found'));
      }

      subscription.unsubscribe().then((successful) => {
        debug('unsubscribed from browser, success: ', successful);

        if (!successful) {
          return complete(new Error('Unsubscribe unsuccessful'));
        }

        const params = {
          subscriptionId: getSubscriptionId(subscription)
        };

        if (__test__) {
          params.emulateError = payload && payload.emulateError;
        }

        return messages.workerSendMessage({
          command: 'pushSync',
          payload: {
            subscriptionId: false
          }
        }).then(() => {
          context.service.delete('subscription',
            syncable.push(
              params,
              params.subscriptionId,
              syncable.ops.unsubscribe
            ), {}, (err) => {
              if (err) {
                // Restore the subscription
                messages.workerSendMessage({
                  command: 'pushSync',
                  payload: {
                    subscriptionId: params.subscriptionId
                  }
                });
              }
              complete(err);
            }
          );
        }).catch((error) => {
          debug('pushSync message failed ', error);
          error.message = 'pushSync message failed: ' + error.message;
          complete(error);
        });
      }).catch((error) => {
        error.message = 'Unsubscribe failed: ' + error.message;
        complete(error);
      });
    }).catch((error) => {
      error.message = 'getSubscription failed: ' + error.message;
      complete(error);
    });
  });
}

/**
 * Factory for subscription topic result handler.
 *
 * @private
 *
 * @param {Object} context - The fluxible action context.
 * @param {String} verb - Subscription topic verb, one of 'read' or 'update'.
 * @param {Function} done - The done callback.
 */
function subscriptionTopicResultHandler (context, verb, done) {
  return (err, data) => {
    debug(`completed push notification topics ${verb}`, err, data);

    const state = {
      pushTopicsError: err
    };

    if (!err) {
      state.pushTopics = data;
    }

    context.dispatch('SETTINGS_STATE', state);

    return done(err);
  };
}

/**
 * Get push notification topics.
 *
 * @param {Object} context - The fluxible action context.
 * @param {Object} payload - The action payload.
 * @param {Function} done - The callback to execute on action completion.
 */
export function getTopics (context, payload, done) {
  debug('reading push notification topics', payload);

  context.dispatch('SETTINGS_TRANSITION', {
    pushTopics: true
  });

  context.service.read('subscription', payload, {},
    subscriptionTopicResultHandler(context, 'read', done)
  );
}

/**
 * Update push notifications subscribed topics.
 *
 * @param {Object} context - The fluxible action context.
 * @param {Object} payload - The action payload.
 * @param {Function} done - The callback to execute on action completion.
 */
export function updateTopics (context, payload, done) {
  debug('updating push notification topics', payload);

  context.dispatch('SETTINGS_TRANSITION', {
    pushTopics: true
  });

  // move the topics to the POST body
  const body = {
    topics: payload.topics
  };
  delete payload.topics;

  context.service.update('subscription',
    syncable.push(payload, payload.subscriptionId, syncable.ops.updateTopics),
    body,
    {},
    subscriptionTopicResultHandler(context, 'update', done)
  );
}

export default {
  demoSend,
  subscribe,
  unsubscribe,
  getTopics,
  updateTopics
}
