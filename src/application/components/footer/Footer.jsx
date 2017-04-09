/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import PropTypes from 'prop-types';
import ByLine from './ByLine';
import SiteBullets from './SiteBullets';
import License from './License';
import LocalBusiness from './LocalBusiness';

class Footer extends React.Component {
  static get propTypes () {
    return {
      models: PropTypes.object.isRequired
    };
  }

  render () {
    return (
      <footer className="app-footer">
        <SiteBullets items={this.props.models.SiteInfo.site.bullets} />
        <LocalBusiness business={this.props.models.LocalBusiness} />
        <License license={this.props.models.SiteInfo.license} />
        <ByLine author={this.props.models.SiteInfo.developer} />
      </footer>
    );
  }
}

export default Footer;
