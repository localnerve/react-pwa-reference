/***
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';

import PropTypes from 'prop-types';

class SiteBullets extends React.Component {
  static get propTypes () {
    return {
      items: PropTypes.array.isRequired
    };
  }

  render () {
    const items = this.props.items.map(function (item, index, arr) {
      return (
        <span key={`bullet${index}`}>
          <span>
            {item}
          </span>
          <span>
            { index < (arr.length - 1) ? ' • ' : '' }
          </span>
        </span>
      );
    });

    return (
      <div className="grid-row-spaced att-line footer-line">
        <span>
          {items}
        </span>
      </div>
    );
  }
}

export default SiteBullets;
