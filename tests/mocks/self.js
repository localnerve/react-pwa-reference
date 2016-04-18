/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise */
'use strict';

/**
 * PushManager mock
 */
function PushManager (options) {
  this.options = options;
}
PushManager.prototype = {
  getSubscription: function () {
    if (this.options.subReject) {
      return Promise.reject('mock error');
    }
    return Promise.resolve(this.options.subscribed ||
      typeof this.options.subscribed === 'undefined');
  },
  _updateOptions: function (options) {
    this.options = options;
  }
};

/**
 * Create the pushManager in registration for self.
 *
 * @param {Object} options - creation options.
 * @param {Boolean} options.subReject - pushManager.getSubscription should reject.
 * @param {Boolean} options.subscribed - pushManager.getSubscription should resolve to true.
 */
function createPushManager (options) {
  return new PushManager(options);
}

/**
 * Construct a self mock.
 */
function Self () {
  this.teardownReg = this.teardownSelf = this.teardownPush = false;
  this.events = {};
}
Self.prototype = {
  /**
   * Setup the self mock.
   *
   * @param {Object} options - Setup options.
   * @param {Object} options.pushManager - options to create a pushManager.
   */
  setup: function (options) {
    options = options || {};

    if (global.self) {
      global.self.registration = global.self.registration ||
        (this.teardownReg = true, {});

      if (options.pushManager) {
        if (!global.self.registration.pushManager) {
          this.teardownPush = true;
          global.self.registration.pushManager = createPushManager(
            options.pushManager
          );
        } else {
          global.self.registration.pushManager._updateOptions(
            options.pushManager
          );
        }
      }
    } else {
      this.teardownSelf = true;
      global.self = {};
      global.self.registration = {};

      if (options.pushManager) {
        global.self.registration.pushManager = createPushManager(
          options.pushManager
        );
      }
    }

    if (options.showNotificationFn) {
      global.self.registration.showNotification = options.showNotificationFn;
    } else {
      global.self.registration.showNotification = function () {};
    }

    if (options.syncRegisterFn) {
      global.self.registration.sync = {
        register: options.syncRegisterFn
      };
    } else {
      global.self.registration.sync = null;
    }

    if (!global.self.addEventListener) {
      global.self.addEventListener = function (name, func) {
        this.events[name] = func;
      }.bind(this);
    }
  },

  /**
   * teardown the self mock
   */
  teardown: function () {
    if (this.teardownSelf) {
      delete global.self;
    } else {
      if (this.teardownReg) {
        delete global.self.registration;
      } else if (this.teardownPush) {
        delete global.self.registration.pushManager;
      }
    }
  }
};

module.exports = Self;
