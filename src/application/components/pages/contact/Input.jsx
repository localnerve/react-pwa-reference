/**
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';

import PropTypes from 'prop-types';

class ContactInput extends React.Component {
  static get propTypes () {
    return {
      fieldValue: PropTypes.string,
      setInputReference: PropTypes.func.isRequired,
      label: PropTypes.object.isRequired,
      inputElement: PropTypes.string.isRequired,
      inputType: PropTypes.string,
      inputId: PropTypes.string.isRequired,
      focus: PropTypes.bool.isRequired
    };
  }

  render () {
    const inputElement = React.createElement(this.props.inputElement, {
      type: this.props.inputType,
      id: this.props.inputId,
      name: this.props.inputId,
      key: this.props.inputId,
      title: this.props.label.help,
      placeholder: this.props.label.help,
      ref: this.props.setInputReference,
      className: 'form-value-element',
      autoFocus: this.props.focus,
      required: true,
      'aria-required': true,
      defaultValue: this.props.fieldValue
    });
    return (
      <div>
        <label htmlFor={this.props.inputId} key={this.props.inputId + '-label'}>
          {this.props.label.text}
        </label>
        {inputElement}
      </div>
    );
  }
}

export default ContactInput;
