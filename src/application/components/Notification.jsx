/***
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global window */
import React from 'react';
import cx from 'classnames';

class Notification extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      hide: true,
      active: false,
      close: false,
      message: ''
    };
    this.close = this.close.bind(this);
    this.messageHandler = this.messageHandler.bind(this);
  }

  componentDidMount () {
    window.addEventListener('message', this.messageHandler);
    if ('serviceWorker' in window.navigator) {
      window.navigator.serviceWorker.addEventListener('message', this.messageHandler);
    }
  }

  componentWillUnmount () {
    window.removeEventListener('message', this.messageHandler);
    if ('serviceWorker' in window.navigator) {
      window.navigator.serviceWorker.removeEventListener('message', this.messageHandler);
    }
  }

  render () {
    return (
      <div className={cx({
        hide: this.state.hide,
        'is-active': this.state.active,
        'notification': true
      })}>
        <span className={cx({
          hide: !this.state.close,
          close: this.state.close
        })} onClick={this.close}>
        </span>
        <div className="notification-content" style={{
          paddingRight: this.state.close ? '1.7rem' : '0px'
        }}>
          {this.state.message}
        </div>
      </div>
    );
  }

  /**
   * Handle notification events.
   * Shows messages to the user by inserting the notification component into the
   * document render tree via display (hide) and revealing it via opacity (active).
   * Vice-versa for removal.
   *
   * @param {Object} event - A MessageEvent from the browser.
   * @param {String} event.origin - The origin of the window that sent the message.
   * @param {Object} event.data - The data dispatched from the source.
   * @param {String} event.data.command - 'notify' if the message is meant for this handler.
   * @param {Boolean} event.data.show - True if a notification should be displayed, false for hidden.
   * @param {String} event.data.message - The contents of the notification message.
   * @param {Number} event.data.time - The time the message should be visible.
   * If omitted, this results in a close button being displayed.
   */
  messageHandler (event) {
    if (event.origin === window.location.origin &&
        event.data.command === 'notify') {
      this.setState({
        message: event.data.message,
        hide: !event.data.show,
        close: !event.data.time
      }, function () {
        this.setState({
          active: event.data.show
        });
      });

      if (event.data.time) {
        window.setTimeout(function (self) {
          self.setState({
            active: false
          }, function () {
            window.setTimeout(function () {
              self.setState({
                hide: true
              });
            }, 500);
          });
        }, event.data.time, this);
      }
    }
  }

  close () {
    this.setState({
      hide: true,
      message: '',
      close: false,
      active: false
    });
  }
}

export default Notification;
