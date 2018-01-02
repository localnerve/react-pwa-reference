/***
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Store for service settings.
 */
import { createStore } from 'fluxible/addons';

export const SettingsStore = createStore({
  storeName: 'SettingsStore',

  handlers: {
    'SETTINGS_STATE': 'updateSettingsState',
    'SETTINGS_TRANSITION': 'updateTransition'
  },

  /**
   * Set inital store state.
   */
  initialize: function () {
    this.hasServiceWorker = false;
    this.hasPushMessaging = false;
    this.hasPermissions = false;
    this.hasNotifications = false;
    this.pushBlocked = false;
    this.syncBlocked = false;
    this.pushSubscription = null;
    this.pushSubscriptionError = null;
    this.pushTopics = null;
    this.pushTopicsError = null;
    this.transition = {};
  },

  /**
   * SETTINGS_STATE handler.
   *
   * @param {Object} payload - The SETTINGS_STATE action payload.
   * @param {Boolean} [payload.hasServiceWorker] -
   * @param {Boolean} [payload.hasPushMessaging] -
   * @param {Boolean} [payload.hasPermissions] -
   * @param {Boolean} [payload.hasNotifications] -
   * @param {Boolean} [payload.pushBlocked] -
   * @param {Boolean} [payload.syncBlocked] -
   * @param {Object} [payload.pushSubscription] -
   * @param {Object} [payload.pushSubscriptionError] -
   * @param {Array} [payload.pushTopics] -
   * @param {Object} [payload.pushTopicsError] -
   */
  updateSettingsState: function (payload) {
    this.hasServiceWorker =
      ('hasServiceWorker' in payload) ? payload.hasServiceWorker : this.hasServiceWorker;
    this.hasPushMessaging =
      ('hasPushMessaging' in payload) ? payload.hasPushMessaging : this.hasPushMessaging;
    this.hasPermissions =
      ('hasPermissions' in payload) ? payload.hasPermissions : this.hasPermissions;
    this.hasNotifications =
      ('hasNotifications' in payload) ? payload.hasNotifications : this.hasNotifications;
    this.pushBlocked =
      ('pushBlocked' in payload) ? payload.pushBlocked : this.pushBlocked;
    this.syncBlocked =
      ('syncBlocked' in payload) ? payload.syncBlocked : this.syncBlocked;
    this.pushSubscription =
      ('pushSubscription' in payload) ? payload.pushSubscription : this.pushSubscription;
    this.pushTopics =
      ('pushTopics' in payload) ? payload.pushTopics : this.pushTopics;

    // end all transition states
    this.transition = {};

    this.pushSubscriptionError = payload.pushSubscriptionError || null;
    this.pushTopicsError = payload.pushTopicsError || null;

    this.emitChange();
  },

  /**
   * SETTINGS_TRANSITION handler.
   *
   * @param {Object} payload - The SETTINGS_TRANSITION action payload.
   * @param {Boolean} [payload.pushSubscription] - True when a transition is occurring on pushSubscription.
   * @param {Boolean} [payload.pushTopics] - True when a transition is occurring on pushTopics.
   */
  updateTransition: function (payload) {
    const updatePushSubscription = ('pushSubscription' in payload),
      updatePushTopics = ('pushTopics' in payload);

    this.transition = {
      pushSubscription:
        updatePushSubscription ? payload.pushSubscription : this.transition.pushSubscription,
      pushTopics:
        updatePushTopics ? payload.pushTopics : this.transition.pushTopics
    };

    if (updatePushSubscription || updatePushTopics) {
      this.emitChange();
    }
  },

  /**
   * @returns {Boolean} true if the environment supports service worker.
   */
  getHasServiceWorker: function () {
    return this.hasServiceWorker;
  },

  /**
   * @returns {Boolean} true if the environment supports push messaging.
   */
  getHasPushMessaging: function () {
    return this.hasPushMessaging;
  },

  /**
   * @returns {Boolean} true if the environment supports permissions API.
   */
  getHasPermissions: function () {
    return this.hasPermissions;
  },

  /**
   * @returns {Boolean} true if the environment supports notifications API.
   */
  getHasNotifications: function () {
    return this.hasNotifications;
  },

  /**
   * @returns {Boolean} true if the user blocked push notifications.
   */
  getPushBlocked: function () {
    return this.pushBlocked;
  },

  /**
   * @returns {Boolean} true if the user blocked background sync.
   */
  getSyncBlocked: function () {
    return this.syncBlocked;
  },

  /**
   * @returns {Object} the push subscription object.
   */
  getPushSubscription: function () {
    return this.pushSubscription;
  },

  /**
   * @returns {Object} a push subscription error.
   */
  getPushSubscriptionError: function () {
    return this.pushSubscriptionError;
  },

  /**
   * @returns {Array} the push notification topics.
   */
  getPushTopics: function () {
    return this.pushTopics;
  },

  /**
   * @returns {Object} a push notification topics error.
   */
  getPushTopicsError: function () {
    return this.pushTopicsError;
  },

  /**
   * @returns {Object} the transition object.
   */
  getTransition: function () {
    return this.transition;
  },

  /**
   * @returns {Object} The SettingsStore state.
   */
  dehydrate: function () {
    return {
      hasServiceWorker: this.hasServiceWorker,
      hasPushMessaging: this.hasPushMessaging,
      hasPermissions: this.hasPermissions,
      hasNotifications: this.hasNotifications,
      pushBlocked: this.pushBlocked,
      syncBlocked: this.syncBlocked,
      pushSubscription: this.pushSubscription,
      pushSubscriptionError: this.pushSubscriptionError,
      pushTopics: this.pushTopics,
      pushTopicsError: this.pushTopicsError,
      transition: this.transition
    };
  },

  /**
   * Hydrate the SettingsStore from the given state.
   *
   * @param {Object} state - The new SettingsStore state.
   */
  rehydrate: function (state) {
    this.hasServiceWorker = state.hasServiceWorker;
    this.hasPushMessaging = state.hasPushMessaging;
    this.hasPermissions = state.hasPermissions;
    this.hasNotifications = state.hasNotifications;
    this.pushBlocked = state.pushBlocked;
    this.syncBlocked = state.syncBlocked;
    this.pushSubscription = state.pushSubscription;
    this.pushSubscriptionError = state.pushSubscriptionError;
    this.pushTopics = state.pushTopics;
    this.pushTopicsError = state.pushTopicsError;
    this.transition = state.transition;
  }
});

export default SettingsStore;
