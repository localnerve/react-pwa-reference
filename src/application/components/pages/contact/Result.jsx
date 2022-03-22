/**
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

class ContactResult extends React.Component {
  static get propTypes () {
    return {
      failure: PropTypes.bool.isRequired,
      failedMessage: PropTypes.string.isRequired,
      label: PropTypes.object.isRequired,
      message: PropTypes.object.isRequired,
      business: PropTypes.object.isRequired
    };
  }

  shouldComponentUpdate (nextProps) {
    return nextProps.failure !== this.props.failure;
  }

  render () {
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
  }

  renderLinks () {
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
  }

  encodeURIMailTo () {
    const subject =
      encodeURIComponent(`${this.props.business.alternateName} contact email`);
    const body =
      this.props.failure ? encodeURIComponent(this.props.failedMessage) : '';

    return `mailto:${this.props.business.email}?subject=${subject}&body=${body}`;
  }
}

export default ContactResult;
