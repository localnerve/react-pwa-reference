/**
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';

import PropTypes from 'prop-types';

class Switch extends React.Component {
  static get propTypes () {
    return {
      inputId: PropTypes.string.isRequired,
      checked: PropTypes.bool.isRequired,
      disabled: PropTypes.bool.isRequired,
      onChange: PropTypes.func.isRequired,
      label: PropTypes.string.isRequired,
      notice: PropTypes.string
    };
  }

  render () {
    return (
      <div>
        <div className="switch">
          <input type="checkbox" id={this.props.inputId}
            disabled={this.props.disabled}
            checked={this.props.checked}
            onChange={this.props.onChange} />
          <label htmlFor={this.props.inputId}></label>
        </div>
        <div className="switch-label">
          <span>{this.props.label}</span>
        </div>
        <div style={{
          display: this.props.notice ? 'block' : 'none'
        }} className="switch-notice">
          <small>{this.props.notice}</small>
        </div>
      </div>
    );
  }
}

export default Switch;
