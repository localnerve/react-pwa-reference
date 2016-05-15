/**
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import debugLib from 'debug';
import { connectToStores } from 'fluxible-addons-react';
import { closeModal as modalAction } from 'application/actions/modal';
import {
  subscribe as subscribeAction,
  unsubscribe as unsubscribeAction,
  demoSend as sendAction,
  updateTopics as updateTopicsAction
} from 'application/actions/push';
import { getSubscriptionId } from 'utils/push';
import Spinner from 'application/components/pages/Spinner';
import ContentPage from 'application/components/pages/ContentPage';
import Topics from './Topics';
import Switch from './Switch';

const debug = debugLib('Settings');

let Settings = React.createClass({
  propTypes: {
    failure: React.PropTypes.bool.isRequired,
    spinner: React.PropTypes.bool,
    name: React.PropTypes.string,
    heading: React.PropTypes.string,
    settingsNotSupported: React.PropTypes.string,
    pushNotifications: React.PropTypes.object,
    backgroundSync: React.PropTypes.object,
    demo: React.PropTypes.object,
    hasServiceWorker: React.PropTypes.bool,
    hasPushMessaging: React.PropTypes.bool,
    hasPermissions: React.PropTypes.bool,
    hasNotifications: React.PropTypes.bool,
    pushBlocked: React.PropTypes.bool,
    syncBlocked: React.PropTypes.bool,
    pushSubscription: React.PropTypes.object,
    pushSubscriptionError: React.PropTypes.object,
    pushTopics: React.PropTypes.array,
    pushTopicsError: React.PropTypes.object,
    transition: React.PropTypes.object
  },
  contextTypes: {
    executeAction: React.PropTypes.func.isRequired,
    getStore: React.PropTypes.func.isRequired
  },

  render: function () {
    if (!this.props.failure &&
        this.props.spinner ||
        Object.keys(this.props.transition).length > 0) {
      return React.createElement(Spinner);
    }

    return this.renderSettings();
  },

  /**
   * Render the settings dialog contents.
   */
  renderSettings: function () {
    const failureElement = this.renderFailure(),
      notSupported = this.renderNotSupported(),
      settingsControls = this.renderControls();

    return (
      <div className="settings">
        <span className="close" onClick={this.closeModal}></span>
        <h2>{this.props.heading || 'Error'}</h2>
        {failureElement}
        {notSupported}
        {settingsControls}
      </div>
    );
  },

  /**
   * Render a modal dialog failure outcome.
   * In this case, there is no prop that is reliable.
   * 500 content is appropriate here. It is preloaded by the server,
   * so it is reliable.
   */
  renderFailure: function () {
    const contentStore = this.context.getStore('ContentStore');

    if (this.props.failure) {
      return React.createElement(ContentPage, {
        content: contentStore.get('500').content
      });
    }

    return null;
  },

  /**
   * Render a message that indicates lack of support.
   */
  renderNotSupported: function () {
    const hasSettings = !this.props.failure &&
      this.props.hasServiceWorker && this.props.hasPushMessaging;

    if (!hasSettings) {
      return (
        <h4>{this.props.settingsNotSupported}</h4>
      );
    }

    return null;
  },

  /**
   * Render the settings controls.
   */
  renderControls: function () {
    if (!this.props.failure) {
      const pushDisabled =
        !this.props.hasServiceWorker ||
        !this.props.hasPushMessaging ||
        this.props.pushBlocked;

      const hasSubscription = !!this.props.pushSubscription;

      let pushNotice;
      if (!this.props.hasServiceWorker) {
        pushNotice = this.props.pushNotifications.notificationsNotSupported;
      } else if (!this.props.hasPushMessaging) {
        pushNotice = this.props.pushNotifications.pushMessagingNotSupported;
      } else if (this.props.pushBlocked) {
        pushNotice = this.props.pushNotifications.notificationsBlocked;
      } else if (this.props.pushSubscriptionError) {
        pushNotice = this.props.pushSubscriptionError.toString();
      } else if (this.props.pushTopicsError) {
        pushNotice = this.props.pushTopicsError.toString();
      }

      const pushDemo = this.renderPushDemo(pushDisabled, hasSubscription);

      return (
        <div>
          <div className="control-section">
            <Switch inputId="push-enable"
              disabled={pushDisabled}
              checked={hasSubscription}
              onChange={this.subscriptionChange}
              label={this.props.pushNotifications.enable}
              notice={pushNotice} />
            <Topics
              topics={this.props.pushTopics || this.props.pushNotifications.topics}
              disabled={pushDisabled || !hasSubscription}
              onChange={this.topicChange} />
            {pushDemo}
          </div>
          <div className="control-section">
            <Switch inputId="background-sync-enable"
              disabled={true}
              checked={false}
              onChange={() => {}}
              label={this.props.backgroundSync.enable}
              notice='Background Sync not implemented yet &#x2639;' />
          </div>
        </div>
      );
    }

    return null;
  },

  /**
   * Render the push demo content.
   */
  renderPushDemo: function (pushDisabled, hasSubscription) {
    if (this.props.demo && this.props.demo.pushNotification) {
      return (
        <div className="push-demo">
          <button
            disabled={pushDisabled || !hasSubscription}
            onClick={this.pushDemo}>
            <span>Demo Push Notification</span>
          </button>
        </div>
      );
    }

    return null;
  },

  /**
   * Subscribe/Unsubscribe all.
   */
  subscriptionChange: function (event) {
    debug('update subscription', event);

    const action = event.target.checked ? subscribeAction : unsubscribeAction;
    this.context.executeAction(action);
  },

  /**
   * Subscribe/Unsubscribe from a push topic.
   *
   * @param {Object} event - The synthetic checkbox event.
   */
  topicChange: function (event) {
    debug('update topic ', event.target.name, event.target.checked);

    this.context.executeAction(updateTopicsAction, {
      subscriptionId: getSubscriptionId(this.props.pushSubscription),
      endpoint: this.props.pushSubscription.endpoint,
      topics: [{
        tag: event.target.name,
        subscribed: event.target.checked
      }]
    });
  },

  /**
   * Send a push notification to the current subscription id.
   */
  pushDemo: function (event) {
    debug('demo push notification handler');

    event.currentTarget.blur();

    this.context.executeAction(sendAction, {
      subscription: this.props.pushSubscription
    });
  },

  /**
   * Closes the modal dialog.
   */
  closeModal: function () {
    this.context.executeAction(modalAction);
  }
});

Settings = connectToStores(Settings, ['SettingsStore'], (context) => {
  const settingsStore = context.getStore('SettingsStore');

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
});

export default Settings;
