/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
// import { openModal as modalAction } from 'applictions/actions/modal';

const ModalLink = React.createClass({
  propTypes: {
    data: React.PropTypes.object.isRequired,
    className: React.PropTypes.string,
    children: React.PropTypes.any
  },
  contextTypes: {
    executeAction: React.PropTypes.func.isRequired
  },

  render: function () {
    return (
      <a className={this.props.className || ''} onClick={this.clickHandler}>
        {this.props.children}
      </a>
    );
  },

  clickHandler: function () {
    // this.context.executeAction(modalAction, this.props.data);
  }
});

export default ModalLink;
