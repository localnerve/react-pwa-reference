/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import { NavLink } from 'fluxible-router';

const Logo = React.createClass({
  propTypes: {
    site: React.PropTypes.object.isRequired
  },

  render: function () {
    return (
      <div className="logo">
        <NavLink routeName="home" title="flux-react-example">
          <h1>
            {this.props.site.name}
          </h1>
          <span className="tagline">
            {this.props.site.tagLine}
          </span>
        </NavLink>
      </div>
    );
  }
});

export default Logo;
