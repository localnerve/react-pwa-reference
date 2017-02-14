/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import Spinner from './Spinner';

const ContentPage = React.createClass({
  propTypes: {
    content: React.PropTypes.any,
    spinner: React.PropTypes.bool
  },

  render: function () {
    const content = this.renderContent();

    return (
      <div className="grid-container-center page-content">
        {content}
      </div>
    );
  },

  shouldComponentUpdate: function (nextProps) {
    const spinnerChange = this.props.spinner !== nextProps.spinner;
    const contentChange = this.props.content !== nextProps.content;
    return spinnerChange || contentChange;
  },

  /*eslint-disable react/no-danger */
  renderContent: function () {
    if (this.props.spinner) {
      return (
        <Spinner />
      );
    } else {
      return (
        <div key="content" dangerouslySetInnerHTML={{__html: this.props.content || ''}}>
        </div>
      );
    }
  }
  /*eslint-enable react/no-danger */
});

export default ContentPage;
