/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';

import PropTypes from 'prop-types';

class LocalBusiness extends React.Component {
  static get propTypes () {
    return {
      business: PropTypes.object.isRequired
    };
  }

  render () {
    const uriMailTo = `mailto:${this.props.business.email}`;
    const uriTel = `tel:+1-'${this.props.business.telephone}`;

    return (
      <div
        className="grid-row-spaced footer-line contact-line"
        itemScope
        itemType="http://schema.org/LocalBusiness">
        <div className="contact-text">
          <span itemProp="name">
            {this.props.business.legalName}
          </span>
          <div itemProp="address" itemScope itemType="http://schema.org/PostalAddress">
            <span itemProp="streetAddress">
              {this.props.business.address.streetAddress}
            </span>
            <div>
              <span itemProp="addressLocality">
                {this.props.business.address.addressLocality}
              </span>
              <span itemProp="addressRegion">
                {this.props.business.address.addressRegion}
              </span>
              <span itemProp="postalCode">
                {this.props.business.address.postalCode}
              </span>
            </div>
          </div>
        </div>
        <div className="contact-links">
          <a href={uriMailTo}>
            <span itemProp="email">
              {this.props.business.email}
            </span>
          </a>
          <a href={uriTel}>
            <span itemProp="telephone">
              {this.props.business.telephone}
            </span>
          </a>
        </div>
      </div>
    );
  }
}

export default LocalBusiness;
