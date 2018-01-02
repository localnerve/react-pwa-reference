/***
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import PropTypes from 'prop-types';
import Ribbon from './Ribbon';
import Logo from './Logo';
import Nav from './Nav';

class Header extends React.Component {
  static get propTypes () {
    return {
      selected: PropTypes.string.isRequired,
      links: PropTypes.array.isRequired,
      models: PropTypes.object.isRequired,
      hasServiceWorker: PropTypes.bool.isRequired
    };
  }

  render () {
    return (
      <header className="app-header">
        <div className="app-header-bg">
          <Ribbon
            business={this.props.models.LocalBusiness}
            social={this.props.models.SiteInfo.social}
            settings={this.props.models.Settings}
            hasServiceWorker={this.props.hasServiceWorker}
          />
          <Logo site={this.props.models.SiteInfo.site} />
        </div>
        <Nav selected={this.props.selected} links={this.props.links} />
      </header>
    );
  }
}

export default Header;
