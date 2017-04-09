/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
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
          <svg className="icon icon-envelop">
            <use xlinkHref="#icon-mail2"></use>
          </svg>
        </NavLink>
        <a className="glyph" href={uriTel}>
          <svg className="icon icon-phone">
            <use xlinkHref="#icon-phone"></use>
          </svg>
        </a>
        <a className="glyph" href={this.props.social.twitter}>
          <svg className="icon icon-twitter">
            <use xlinkHref="#icon-twitter"></use>
          </svg>
        </a>
        <a className="glyph" href={this.props.social.github}>
          <svg className="icon icon-github">
            <use xlinkHref="#icon-github"></use>
          </svg>
        </a>
        <ModalLink className={cx({
          glyph: true,
          'settings-link': true,
          // Only add this cost if client doesn't support sw
          hide: !serverRender && !this.props.hasServiceWorker
        })} data={this.props.settings}>
          <svg className="icon icon-cog">
            <use xlinkHref="#icon-cog"></use>
          </svg>
        </ModalLink>
      </div>
    );
  }
}

export default Ribbon;
