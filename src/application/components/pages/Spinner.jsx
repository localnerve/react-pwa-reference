/***
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import PropTypes from 'prop-types';
import ReactSpinner from 'react-spinner';

class Spinner extends React.Component {
  static get propTypes () {
    return {
      contained: PropTypes.bool
    };
  }

  render () {
    const spinner = <ReactSpinner className="react-spinner-custom" />;
    const element = this.props.contained
      ? React.createElement('div', { style: { marginTop: '50%' } }, spinner)
      : spinner;

    return element;
  }
}

export default Spinner;
