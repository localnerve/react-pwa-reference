/**
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import PropTypes from 'prop-types';
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

class Settings extends React.Component {
  constructor (props) {
    super(props);

    this.closeModal = this.closeModal.bind(this);
    this.subscriptionChange = this.subscriptionChange.bind(this);
    this.topicChange = this.topicChange.bind(this);
    this.pushDemo = this.pushDemo.bind(this);
  }

  static get propTypes () {
    return {
      failure: PropTypes.bool.isRequired,
      spinner: PropTypes.bool,
      name: PropTypes.string,
      heading: PropTypes.string,
      settingsNotSupported: PropTypes.string,
      pushNotifications: PropTypes.object,
      backgroundSync: PropTypes.object,
      demo: PropTypes.object,
      hasServiceWorker: PropTypes.bool,
      hasPushMessaging: PropTypes.bool,
      hasPermissions: PropTypes.bool,
      hasNotifications: PropTypes.bool,
      pushBlocked: PropTypes.bool,
      syncBlocked: PropTypes.bool,
      pushSubscription: PropTypes.object,
      pushSubscriptionError: PropTypes.object,
      pushTopics: PropTypes.array,
      pushTopicsError: PropTypes.object,
      transition: PropTypes.object
    };
  }

  static get contextTypes () {
    return {
      executeAction: PropTypes.func.isRequired,
      getStore: PropTypes.func.isRequired
    };
  }

  render () {
    if (!this.props.failure &&
        this.props.spinner ||
        Object.keys(this.props.transition).length > 0) {
      return React.createElement(Spinner, {
        contained: true
      });
    }

    return this.renderSettings();
  }

  /**
   * Render the settings dialog contents.
   */
  renderSettings () {
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
  }

  /**
   * Render a modal dialog failure outcome.
   * In this case, there is no prop that is reliable.
   * 500 content is appropriate here. It is preloaded by the server,
   * so it is reliable.
   */
  renderFailure () {
    const contentStore = this.context.getStore('ContentStore');

    if (this.props.failure) {
      return React.createElement(ContentPage, {
        content: contentStore.get('500').content
      });
    }

    return null;
  }

  /**
   * Render a message that indicates lack of support.
   */
  renderNotSupported () {
    const hasSettings = !this.props.failure &&
      this.props.hasServiceWorker && this.props.hasPushMessaging;

    if (!hasSettings) {
      return (
        <h4>{this.props.settingsNotSupported}</h4>
      );
    }

    return null;
  }

  /**
   * Render the settings controls.
   */
  renderControls () {
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
  }

  /**
   * Render the push demo content.
   */
  renderPushDemo (pushDisabled, hasSubscription) {
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
  }

  /**
   * Subscribe/Unsubscribe all.
   */
  subscriptionChange (event) {
    debug('update subscription', event);

    const action = event.target.checked ? subscribeAction : unsubscribeAction;
    this.context.executeAction(action);
  }

  /**
   * Subscribe/Unsubscribe from a push topic.
   *
   * @param {Object} event - The synthetic checkbox event.
   */
  topicChange (event) {
    debug('update topic ', event.target.name, event.target.checked);

    this.context.executeAction(updateTopicsAction, {
      subscriptionId: getSubscriptionId(this.props.pushSubscription),
      endpoint: this.props.pushSubscription.endpoint,
      topics: [{
        tag: event.target.name,
        subscribed: event.target.checked
      }]
    });
  }

  /**
   * Send a push notification to the current subscription id.
   */
  pushDemo (event) {
    debug('demo push notification handler');

    event.currentTarget.blur();

    this.context.executeAction(sendAction, {
      subscription: this.props.pushSubscription
    });
  }

  /**
   * Closes the modal dialog.
   */
  closeModal () {
    this.context.executeAction(modalAction);
  }
}

const settings = connectToStores(Settings, ['SettingsStore'], (context) => {
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

export default settings;
