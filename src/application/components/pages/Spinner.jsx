/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import ReactSpinner from 'react-spinner';

const Spinner = React.createClass({
  propTypes: {
    contained: React.PropTypes.bool
  },

  render: function () {
    const spinner = <ReactSpinner className="react-spinner-custom" />;
    const element = this.props.contained
      ? React.createElement('div', { style: { marginTop: '50%' } }, spinner)
      : spinner;

    return element;
  }
});

export default Spinner;
