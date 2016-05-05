/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import Ribbon from './Ribbon';
import Logo from './Logo';
import Nav from './Nav';

const Header = React.createClass({
  propTypes: {
    selected: React.PropTypes.string.isRequired,
    links: React.PropTypes.array.isRequired,
    models: React.PropTypes.object.isRequired
  },

  render: function () {
    return (
      <header className="app-header">
        <div className="app-header-bg">
          <Ribbon
            business={this.props.models.LocalBusiness}
            social={this.props.models.SiteInfo.social}
            settings={this.props.models.Settings}
          />
          <Logo site={this.props.models.SiteInfo.site} />
        </div>
        <Nav selected={this.props.selected} links={this.props.links} />
      </header>
    );
  }
});

export default Header;
