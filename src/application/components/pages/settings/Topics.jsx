/**
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';

import PropTypes from 'prop-types';

class Topics extends React.Component {
  static get propTypes () {
    return {
      topics: PropTypes.array.isRequired,
      disabled: PropTypes.bool.isRequired,
      onChange: PropTypes.func.isRequired
    };
  }

  render () {
    const topics = this.props.topics.map((topic) => {
      return (
        <li key={topic.tag}>
          <div className="topic-box">
            <input type="checkbox" id={topic.tag} name={topic.tag}
              checked={!!topic.subscribed}
              disabled={this.props.disabled}
              onChange={this.props.onChange} />
            <label htmlFor={topic.tag}></label>
          </div>
          <div className="topic-label">
            <span>{topic.label}</span>
          </div>
        </li>
      );
    }, this);

    return (
      <ul className="topics-list">
        {topics}
      </ul>
    );
  }
}

export default Topics;
