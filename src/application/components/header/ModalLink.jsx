/***
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { openModal as modalAction } from 'application/actions/modal';

class ModalLink extends React.Component {
  constructor (props) {
    super(props);
    this.clickHandler = this.clickHandler.bind(this);
  }

  static get propTypes () {
    return {
      data: PropTypes.object.isRequired,
      className: PropTypes.string,
      children: PropTypes.any
    };
  }

  static get contextTypes () {
    return {
      executeAction: PropTypes.func.isRequired
    };
  }

  render () {
    return (
      <a className={this.props.className || ''} onClick={this.clickHandler}>
        {this.props.children}
      </a>
    );
  }

  clickHandler () {
    this.context.executeAction(modalAction, this.props.data);
  }
}

export default ModalLink;
