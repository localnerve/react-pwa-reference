/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Global mocks (on window, navigator, etc) for service worker push notification support.
 */
/* global Promise */
'use strict';

/**
 * Setup the global Notification test fixture.
 */
function setupNotification (options) {
  options = options || {};

  global.window.Notification = {
    permission: options.permission || 'denied'
  };
}

/**
 * Setup the global permissions test fixture.
 *
 * @param {Object} options - Permissions setup options.
 * @param {String} [options.state] - The state to resolve to.
 * @param {Boolean} [options.rejectQuery] - Reject the permissions query.
 */
function setupPermissions (options) {
  options = options || {};

  var permissions = {};

  global.navigator.permissions = {
    query: function () {
      return new Promise(function (resolve, reject) {
        permissions.state = options.state;
        if (options.rejectQuery) {
          return reject(new Error('mock'));
        }
        return resolve(permissions);
      });
    }
  };

  return permissions;
}

/**
 * Setup the global serviceWorker pushManager test fixture.
 *
 * @param {Object} options - Push Manager setup options
 * @param {Boolean} [options.succeedUnsub] - succeed the unsubscribe.
 * @param {Boolean} [options.rejectUnsub] - reject the unsubscribe.
 * @param {Boolean} [options.rejectSubcribe] - reject the subscribe.
 * @param {Boolean} [options.rejectGetSub] - reject the getSubscription.
 * @param {Number} [options.countPostMessage] - count postMessage invocations.
 * @param {Boolean} [options.postMessageFail] - postMessage to return failure.
 */
function setupPushManager (options) {
  options = options || {};

  /**
   * A simple postMessage mock.
   */
  function postMessage () {
    var event = {
      data: {
        text: 'hello world'
      }
    };

    if (options.postMessageFail) {
      event.data.error = new Error('mock postmessage error');
    }

    if (options.countPostMessage >= 0) {
      options.countPostMessage++;
    } else {
      options.countPostMessage = 1;
    }

    var onmessage = global.navigator.serviceWorker.onmessage ||
      global.navigator.serviceWorker.controller.onmessage;

    if (typeof onmessage === 'function') {
      onmessage(event);
    }
  }

  var subscription = {
    endpoint: 'https://service.dom/push/123456789',
    unsubscribe: function () {
      if (options.rejectUnsub) {
        return Promise.reject(new Error('mock unsub'));
      }
      return Promise.resolve(options.succeedUnsub);
    }
  };

  global.navigator.serviceWorker = {
    ready: Promise.resolve({
      pushManager: {
        subscribe: function () {
          if (options.rejectSubcribe) {
            return Promise.reject(new Error('mock sub'));
          }
          return Promise.resolve(subscription);
        },
        getSubscription: function () {
          if (options.rejectGetSub) {
            return Promise.reject(new Error('mock getSub'));
          }
          return Promise.resolve(subscription);
        }
      },
      active: {
        postMessage: postMessage
      }
    }),
    controller: {
      postMessage: postMessage
    }
  };

  return subscription;
}

module.exports = {
  setupPushManager: setupPushManager,
  setupPermissions: setupPermissions,
  setupNotification: setupNotification
};
