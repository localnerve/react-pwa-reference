/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import { NavLink } from 'fluxible-router';
import ModalLink from './ModalLink';

const Ribbon = React.createClass({
  propTypes: {
    social: React.PropTypes.object.isRequired,
    business: React.PropTypes.object.isRequired,
    settings: React.PropTypes.object.isRequired
  },

  render: function () {
    const uriTel = `tel:+1-${this.props.business.telephone}`;

    return (
      <div className="grid-row-spaced ribbon">
        <NavLink className="mail" routeName="contact">
          <span className="icon-envelop"></span>
        </NavLink>
        <a className="phone" href={uriTel}>
          <span className="icon-phone"></span>
        </a>
        <a href={this.props.social.twitter}>
          <span className="icon-twitter"></span>
        </a>
        <a href={this.props.social.github}>
          <span className="icon-github4"></span>
        </a>
        <ModalLink data={this.props.settings}>
          <span className="icon-cog"></span>
        </ModalLink>
      </div>
    );
  }
});

export default Ribbon;
