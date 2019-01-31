/***
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'fluxible-router';

class Logo extends React.Component {
  static get propTypes () {
    return {
      site: PropTypes.object.isRequired
    };
  }

  render () {
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
}

export default Logo;
