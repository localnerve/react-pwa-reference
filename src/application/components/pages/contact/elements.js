/***
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import Input from './Input';
import Result from './Result';

const classes = {
  name: Input,
  email: Input,
  message: Input,
  result: Result
};

const inputProps = {
  name: {
    inputElement: 'input',
    inputType: 'text',
    inputId: 'name-input'
  },
  email: {
    inputElement: 'input',
    inputType: 'email',
    inputId: 'email-input'
  },
  message: {
    inputElement: 'textarea',
    inputId: 'message-input'
  },
  result: {}
};

/**
 * Create a Contact Element
 *
 * @param {String} component - The name of the component to create.
 * @param {Object} props - The props to create the component with.
 * @returns {Object} A React Element for the given contact component name and props.
 */
export function createContactElement (component, props) {
  return React.createElement(
    classes[component],
    Object.assign(props, inputProps[component])
  );
}
