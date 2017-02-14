/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';

const SiteBullets = React.createClass({
  propTypes: {
    items: React.PropTypes.array.isRequired
  },

  render: function () {
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
});

export default SiteBullets;
