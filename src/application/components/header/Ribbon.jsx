/***
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global window */
import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'fluxible-router';
import ModalLink from './ModalLink';
import cx from 'classnames';

class Ribbon extends React.Component {
  static get propTypes () {
    return {
      social: PropTypes.object.isRequired,
      business: PropTypes.object.isRequired,
      settings: PropTypes.object.isRequired,
      hasServiceWorker: PropTypes.bool.isRequired
    };
  }

  render () {
    const serverRender = typeof window === 'undefined';
    const uriTel = `tel:+1-${this.props.business.telephone}`;

    return (
      <div className="grid-row-spaced ribbon">
        <NavLink className="glyph" routeName="contact">
          <svg className="icon icon-envelop" aria-labelledby="envelop-title" role="img">
            <title id="envelop-title">Contact Us</title>
            <use xlinkHref="#icon-mail2"></use>
          </svg>
        </NavLink>
        <a className="glyph" href={uriTel}>
          <svg className="icon icon-phone" aria-labelledby="phone-title" role="img">
            <title id="phone-title">Call Us</title>
            <use xlinkHref="#icon-phone"></use>
          </svg>
        </a>
        <a className="glyph" href={this.props.social.twitter}>
          <svg className="icon icon-twitter" aria-labelledby="twitter-title" role="img">
            <title id="twitter-title">Our Twitter</title>
            <use xlinkHref="#icon-twitter"></use>
          </svg>
        </a>
        <a className="glyph" href={this.props.social.github}>
          <svg className="icon icon-github" aria-labelledby="github-title" role="img">
            <title id="github-title">Our Github</title>
            <use xlinkHref="#icon-github"></use>
          </svg>
        </a>
        <ModalLink className={cx({
          glyph: true,
          'settings-link': true,
          // Only add this cost if client doesn't support sw
          hide: !serverRender && !this.props.hasServiceWorker
        })} data={this.props.settings}>
          <svg className="icon icon-cog" aria-labelledby="settings-title" role="img">
            <title id="settings-title">Application Settings</title>
            <use xlinkHref="#icon-cog"></use>
          </svg>
        </ModalLink>
      </div>
    );
  }
}

export default Ribbon;
