/**
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';

const Switch = React.createClass({
  propTypes: {
    inputId: React.PropTypes.string.isRequired,
    checked: React.PropTypes.bool.isRequired,
    disabled: React.PropTypes.bool.isRequired,
    onChange: React.PropTypes.func.isRequired,
    label: React.PropTypes.string.isRequired,
    notice: React.PropTypes.string
  },

  render: function () {
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
});

export default Switch;
