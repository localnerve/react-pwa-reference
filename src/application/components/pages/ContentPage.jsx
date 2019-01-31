/***
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import PropTypes from 'prop-types';
import Spinner from './Spinner';

class ContentPage extends React.Component {
  static get propTypes () {
    return {
      content: PropTypes.any,
      spinner: PropTypes.bool
    };
  }

  render () {
    const content = this.renderContent();

    return (
      <div className="grid-container-center page-content">
        {content}
      </div>
    );
  }

  shouldComponentUpdate (nextProps) {
    const spinnerChange = this.props.spinner !== nextProps.spinner;
    const contentChange = this.props.content !== nextProps.content;
    return spinnerChange || contentChange;
  }

  /* eslint-disable react/no-danger-with-children */
  renderContent () {
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
  /* eslint-enable react/no-danger-with-children */
}

export default ContentPage;
