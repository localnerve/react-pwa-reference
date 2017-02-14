/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';

const License = React.createClass({
  propTypes: {
    license: React.PropTypes.object.isRequired
  },

  render: function () {
    var statements = this.props.license.statement.split(
      this.props.license.type
    );

    return (
      <div className="grid-row-spaced footer-line">
        <span className="license">
          <span>
            {statements[0]}
          </span>
          <a href={this.props.license.url}>
            {this.props.license.type}
          </a>
          <span>
            {statements[1]}
          </span>
        </span>
      </div>
    );
  }
});

export default License;
