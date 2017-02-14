/**
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import cx from 'classnames';

const ContactResult = React.createClass({
  propTypes: {
    failure: React.PropTypes.bool.isRequired,
    failedMessage: React.PropTypes.string.isRequired,
    label: React.PropTypes.object.isRequired,
    message: React.PropTypes.object.isRequired,
    business: React.PropTypes.object.isRequired
  },

  shouldComponentUpdate: function (nextProps) {
    return nextProps.failure !== this.props.failure;
  },

  render: function () {
    const links = this.renderLinks();

    return (
      <div className="contact-result">
        <h3 className={cx({
          hide: this.props.failure
        })}>
          {this.props.label.success.text}
        </h3>
        <p>
          {this.props.message[this.props.failure ? 'failure' : 'success'].text}
        </p>
        <p className="contact-result-contact">
          {links}
        </p>
      </div>
    );
  },

  renderLinks: function () {
    const uriMailTo = this.encodeURIMailTo();
    const uriTel = `tel:+1-${this.props.business.telephone}`;

    if (!this.props.failure) {
      return [
        <a key="link-email" className="icon-envelop" href={uriMailTo}>
          <span>
            {this.props.business.email}
          </span>
        </a>,
        <a key="link-phone" className="icon-phone" href={uriTel}>
          <span>
            {this.props.business.telephone}
          </span>
        </a>
      ];
    } else {
      return [
        <a key="link-email" className="icon-envelop" href={uriMailTo}>
          <span>
            {this.props.message.failure.email}
          </span>
          <small className="help-note">
            {this.props.message.failure.emailHelp}
          </small>
        </a>,
        <a key="link-phone" className="icon-phone" href={uriTel}>
          <span>
            {this.props.message.failure.call}
          </span>
        </a>
      ];
    }
  },

  encodeURIMailTo: function () {
    const subject =
      encodeURIComponent(`${this.props.business.alternateName} contact email`);
    const body =
      this.props.failure ? encodeURIComponent(this.props.failedMessage) : '';

    return `mailto:${this.props.business.email}?subject=${subject}&body=${body}`;
  }
});

export default ContactResult;
