/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Specific tests and helpers for settings
 */
'use strict';

function getSettingsFields (context, SettingsStore) {
  var settingsStore = context.getStore(SettingsStore);
  return {
    hasServiceWorker: settingsStore.getHasServiceWorker(),
    hasPushMessaging: settingsStore.getHasPushMessaging(),
    hasPermissions: settingsStore.getHasPermissions(),
    hasNotifications: settingsStore.getHasNotifications(),
    pushBlocked: settingsStore.getPushBlocked(),
    syncBlocked: settingsStore.getSyncBlocked(),
    pushSubscription: settingsStore.getPushSubscription(),
    pushSubscriptionError: settingsStore.getPushSubscriptionError(),
    pushTopics: settingsStore.getPushTopics(),
    pushTopicsError: settingsStore.getPushTopicsError(),
    transition: settingsStore.getTransition()
  };
}

module.exports = {
  getSettingsFields: getSettingsFields
};
