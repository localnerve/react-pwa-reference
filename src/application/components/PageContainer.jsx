/**
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import sizeAction from 'application/actions/size';
import { fluxibleWindowResizeReporter } from 'react-element-size-reporter';
import Notification from './Notification';

let PageContainer = React.createClass({
  propTypes: {
    children: React.PropTypes.any.isRequired
  },

  render: function () {
    return (
      <div className="page">
        {this.props.children}
        <Notification />
      </div>
    );
  }
});

PageContainer = fluxibleWindowResizeReporter(
  PageContainer, '.page', sizeAction, {
    resizeWait: 50,
    sizeReporter: {
      reportWidth: true,
      reportHeight: true,
      grow: {
        height: 10
      }
    }
  }
);

export default PageContainer
