/**
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import PropTypes from 'prop-types';
import sizeAction from 'application/actions/size';
import { fluxibleWindowResizeReporter } from 'react-element-size-reporter';
import Notification from './Notification';

class PageContainer extends React.Component {
  static get propTypes () {
    return {
      children: PropTypes.any.isRequired
    };
  }

  render () {
    return (
      <div className="page">
        {this.props.children}
        <Notification />
      </div>
    );
  }
}

const pageContainer = fluxibleWindowResizeReporter(
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

export default pageContainer
