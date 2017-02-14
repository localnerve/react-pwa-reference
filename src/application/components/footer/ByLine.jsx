/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';

const ByLine = React.createClass({
  propTypes: {
    author: React.PropTypes.object.isRequired
  },

  render: function () {
    var byLine = this.props.author.byLine.replace(
      ` ${this.props.author.name}`, ''
    );

    return (
      <div className="grid-row-spaced footer-line by-line">
        <span className="by-line-items">
          <span>
            {byLine}
          </span>
          <span>
            <a href={this.props.author.url} target="_blank">
              {this.props.author.name}
            </a>
          </span>
          <span>
            &copy;
          </span>
          <span>
            {(new Date()).getFullYear()}
          </span>
        </span>
      </div>
    );
  }
});

export default ByLine;
